import { NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');

  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
  }

  

  const googlePlacesApiKey = process.env.GOOGLE_PLACES_API_KEY;
  const googlePlacesApiHost = 'google-map-places.p.rapidapi.com';

  const options = {
    method: 'GET',
    url: 'https://google-map-places.p.rapidapi.com/maps/api/place/textsearch/json',
    params: {
      query: query,
      radius: '1000',
      language: 'en',
      region: 'en'
    },
    headers: {
      'X-RapidAPI-Key': googlePlacesApiKey,
      'X-RapidAPI-Host': googlePlacesApiHost
    }
  };

  try {
    const response = await axios.request(options);
    console.log('google result', response.data)
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error fetching Google Places data:', error);
    return NextResponse.json({ error: 'An error occurred while searching for places.' }, { status: 500 });
  }
}