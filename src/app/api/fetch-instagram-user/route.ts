import { NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get('username');

  if (!username) {
    return NextResponse.json({ error: 'Username parameter is required' }, { status: 400 });
  }

  const rapidApiKey = process.env.GOOGLE_PLACES_API_KEY;
  const rapidApiHost = 'instagram-bulk-scraper-latest.p.rapidapi.com';

  const options = {
    method: 'GET',
    url: `https://${rapidApiHost}/webget_user_id/${username}`,
    headers: {
      'X-RapidAPI-Key': rapidApiKey,
      'X-RapidAPI-Host': rapidApiHost
    }
  };

  try {
    const response = await axios.request(options);
    console.log('Instagram result', response.data);
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error fetching Instagram data:', error);
    return NextResponse.json({ error: 'An error occurred while fetching Instagram data.' }, { status: 500 });
  }
}