'use server'

import { MongoClient, ObjectId } from 'mongodb'
import { revalidatePath } from 'next/cache'

if (!process.env.MONGO_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"')
}

const uri = process.env.MONGO_URI as string

console.log('uri', uri)

export async function addLocation(data: {
  name: string;
  formattedAddress: string;
  placeId: string;
  latitude: number;
  longitude: number;
  neLatitude: number;
  neLongitude: number;
  swLatitude: number;
  swLongitude: number;
  category: string;
  instagramId?: string;
  instagramUsername?: string;
  instagramBio?: string;

}) {
  const client = new MongoClient(uri)
  try {
    await client.connect()
    const db = client.db('Scenes')
    const collection = db.collection('locations')
    
    const location = {
      name: data.name,
      formattedAddress: data.formattedAddress,
      placeId: data.placeId,
      geometry: {
        location: {
          lat: data.latitude,
          lng: data.longitude,
        },
        viewport: {
          northeast: {
            lat: data.neLatitude,
            lng: data.neLongitude,
          },
          southwest: {
            lat: data.swLatitude,
            lng: data.swLongitude,
          },
        },
      },
      category: new ObjectId(data.category),
      instagramId: data.instagramId,
      instagramUsername: data.instagramUsername,
      instagramBio: data.instagramBio,  


      createdAt: new Date(),
    }
    
    const result = await collection.insertOne(location)
    revalidatePath('/locations')
    return { success: true, message: 'Location added successfully', id: result.insertedId }
  } catch (error) {
    console.error('Failed to add location:', error)
    return { success: false, message: 'Failed to add location. Please try again.' }
  } finally {
    await client.close()
  }
}