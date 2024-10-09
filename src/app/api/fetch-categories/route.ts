import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

export async function GET() {
  const client = new MongoClient(process.env.MONGO_URI as string);
  
  try {
    await client.connect();
    const db = client.db('Scenes');
    const collection = db.collection('categories');
    
    const categories = await collection.find({}).toArray();
    
    return NextResponse.json(categories);
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  } finally {
    await client.close();
  }
}