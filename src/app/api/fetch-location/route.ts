import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

if (!process.env.MONGO_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"')
}

const uri = process.env.MONGO_URI as string;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');

  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
  }

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('Scenes');
    const collection = db.collection('locations');
    
    const locations = await collection.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { formattedAddress: { $regex: query, $options: 'i' } }
      ]
    }).limit(10).toArray();
    
    return NextResponse.json(locations);
  } catch (error) {
    console.error('Error searching locations:', error);
    return NextResponse.json({ error: 'An error occurred while searching for locations.' }, { status: 500 });
  } finally {
    await client.close();
  }
}