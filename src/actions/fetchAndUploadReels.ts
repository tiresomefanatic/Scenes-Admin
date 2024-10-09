'use server'

import { MongoClient, ObjectId } from 'mongodb'
import axios from 'axios'
import { v2 as cloudinary } from 'cloudinary'
import { EventEmitter } from 'events'

if (!process.env.MONGO_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"')
}

const uri = process.env.MONGO_URI
const rapidApiKey = process.env.GOOGLE_PLACES_API_KEY
const rapidApiHost = 'instagram-bulk-scraper-latest.p.rapidapi.com'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

const progressEmitter = new EventEmitter()

async function fetchUserReels(userId: string) {
  const options = {
    method: 'GET',
    url: `https://${rapidApiHost}/webuser_reels/${userId}`,
    params: { nocors: 'false' },
    headers: {
      'X-RapidAPI-Key': rapidApiKey,
      'X-RapidAPI-Host': rapidApiHost
    }
  }

  const response = await axios.request(options)
  return response.data
}

async function fetchMediaByCode(code: string) {
  const options = {
    method: 'GET',
    url: `https://${rapidApiHost}/media_download_by_shortcode/${code}`,
    headers: {
      'X-RapidAPI-Key': rapidApiKey,
      'X-RapidAPI-Host': rapidApiHost
    }
  }

  const response = await axios.request(options)
  return response.data
}

async function uploadToCloudinary(videoUrl: string) {
  const uploadResult = await cloudinary.uploader.upload(videoUrl, {
    resource_type: "video",
    folder: "instagram_reels",
  })

  return {
    videoUri: uploadResult.secure_url,
    thumbUri: uploadResult.secure_url.replace(/\.[^/.]+$/, ".jpg"),
  }
}

export async function fetchAndUploadReels(data: {
  locationName: string
  reelCount: number
}, sessionId: string) {
  const client = new MongoClient(uri)
  try {
    await client.connect()
    const db = client.db('Scenes')
    const locationsCollection = db.collection('locations')
    const reelsCollection = db.collection('reels')

    progressEmitter.emit(sessionId, { type: 'progress', message: 'Connecting to database...', progress: 5 })

    // Find the location
    const location = await locationsCollection.findOne({ name: data.locationName })
    if (!location) {
      progressEmitter.emit(sessionId, { type: 'error', message: 'Location not found' })
      return { success: false, message: 'Location not found' }
    }

    progressEmitter.emit(sessionId, { type: 'progress', message: 'Fetching reels data...', progress: 10 })

    // Fetch reels
    const reelsData = await fetchUserReels(location.instagramId)
    if (!reelsData.data || !reelsData.data.items || !Array.isArray(reelsData.data.items)) {
      progressEmitter.emit(sessionId, { type: 'error', message: 'Invalid reels data structure' })
      return { success: false, message: 'Invalid reels data structure' }
    }

    const reelItems = reelsData.data.items
      .filter((item: any) => item.media && item.media.media_type === 2) // Ensure it's a video
      .slice(0, data.reelCount)

    let processedReels = 0
    const totalReels = reelItems.length

    progressEmitter.emit(sessionId, { type: 'progress', message: `Found ${totalReels} reels to process`, progress: 20 })

    for (const [index, item] of reelItems.entries()) {
      progressEmitter.emit(sessionId, { type: 'progress', message: `Processing reel ${index + 1} of ${totalReels}`, progress: 20 + (60 * index / totalReels) })

      const mediaData = await fetchMediaByCode(item.media.code)
      
      if (mediaData.data && mediaData.data.main_media_hd) {
        progressEmitter.emit(sessionId, { type: 'progress', message: `Uploading reel ${index + 1} to Cloudinary`, progress: 20 + (60 * (index + 0.5) / totalReels) })

        const { videoUri, thumbUri } = await uploadToCloudinary(mediaData.data.main_media_hd)

        const newReel = {
          location: new ObjectId(location._id),
          category: new ObjectId(location.category),
          videoUri,
          thumbUri,
          caption: item.media.caption?.text || '',
          likes: [],
          comments: [],
          viewCount: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        }

        await reelsCollection.insertOne(newReel)
        processedReels++

        progressEmitter.emit(sessionId, { type: 'progress', message: `Reel ${index + 1} processed and saved`, progress: 20 + (60 * (index + 1) / totalReels) })
      }
    }

    progressEmitter.emit(sessionId, { type: 'progress', message: 'All reels processed', progress: 100 })

    return { success: true, message: `Successfully processed ${processedReels} reels`, processedReels }
  } catch (error) {
    console.error('Error processing reels:', error)
    progressEmitter.emit(sessionId, { type: 'error', message: 'An error occurred while processing reels' })
    return { success: false, message: 'An error occurred while processing reels. Please try again.' }
  } finally {
    await client.close()
  }
}

export async function subscribeToProgress(sessionId: string, callback: (data: any) => void) {
  progressEmitter.on(sessionId, callback)
}

export async function unsubscribeFromProgress(sessionId: string, callback: (data: any) => void) {
  progressEmitter.off(sessionId, callback)
}