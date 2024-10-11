'use server'

import { MongoClient, ObjectId } from 'mongodb'
import axios from 'axios'
import { v2 as cloudinary } from 'cloudinary'

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

interface Location {
  _id: ObjectId;
  name: string;
  instagramId: string;
  category: ObjectId;
}

interface ReelItem {
  media: {
    media_type: number;
    code: string;
    caption?: {
      text: string;
    };
  };
}

interface FetchAndUploadReelsInput {
  locationId: string;
  reelCount: number;
}

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
  console.log('fetched user reels:', response.data)
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

export async function fetchAndUploadReels(data: FetchAndUploadReelsInput) {
  const client = new MongoClient(uri)
  try {
    await client.connect()
    const db = client.db('Scenes')
    const locationsCollection = db.collection<Location>('locations')
    const reelsCollection = db.collection('reels')

    // Find the location by ID
    const location = await locationsCollection.findOne({ _id: new ObjectId(data.locationId) })
    
    if (!location) {
      return { success: false, message: 'Location not found' }
    }

    // Fetch reels
    const reelsData = await fetchUserReels(location.instagramId)
    if (!reelsData.data || !reelsData.data.items || !Array.isArray(reelsData.data.items)) {
      return { success: false, message: 'Invalid reels data structure' }
    }

    const reelItems = (reelsData.data.items as ReelItem[])
      .filter(item => item.media && item.media.media_type === 2) // Ensure it's a video
      .slice(0, data.reelCount)

    let processedReels = 0

    for (const item of reelItems) {
      const mediaData = await fetchMediaByCode(item.media.code)
      
      if (mediaData.data && mediaData.data.main_media_hd) {
        const { videoUri, thumbUri } = await uploadToCloudinary(mediaData.data.main_media_hd)

        const newReel = {
          location: location._id,
          category: location.category,
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
      }
    }

    return { 
      success: true, 
      message: `Successfully processed ${processedReels} reels for ${location.name}`, 
      processedReels 
    }
  } catch (error) {
    console.error('Error processing reels:', error)
    return { success: false, message: 'An error occurred while processing reels. Please try again.' }
  } finally {
    await client.close()
  }
}