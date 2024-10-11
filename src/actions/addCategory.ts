'use server'

import { MongoClient } from 'mongodb'
import { revalidatePath } from 'next/cache'

if (!process.env.MONGO_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"')
}

const uri = process.env.MONGO_URI as string

export async function addCategory(data: {
  name: string;
  popularityPercentage: number;
  type: string;
}) {
  const client = new MongoClient(uri)
  try {
    await client.connect()
    const db = client.db('Scenes')
    const collection = db.collection('categories')
    
    const category = {
      name: data.name,
      popularityPercentage: data.popularityPercentage,
      type: data.type,
      __v: 0, // Set version to 0 by default
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    
    const result = await collection.insertOne(category)
    revalidatePath('/categories')
    return { success: true, message: 'Category added successfully', id: result.insertedId }
  } catch (error) {
    console.error('Failed to add category:', error)
    return { success: false, message: 'Failed to add category. Please try again.' }
  } finally {
    await client.close()
  }
}