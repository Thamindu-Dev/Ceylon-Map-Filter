import { NextRequest, NextResponse } from 'next/server';
import { ExtractionOrchestrator } from '../../../lib/services/extraction';

const MAX_KEYWORD_LENGTH = 100;
const MAX_LOCATION_LENGTH = 200;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { keyword, location, radius, mode = 'dropdown', latitude, longitude } = body;

    if (!keyword || typeof keyword !== 'string' || keyword.trim().length === 0) {
      return NextResponse.json({ error: 'Valid keyword string is required' }, { status: 400 });
    }

    if (keyword.length > MAX_KEYWORD_LENGTH) {
      return NextResponse.json({ error: `Keyword must not exceed ${MAX_KEYWORD_LENGTH} characters` }, { status: 400 });
    }

    if (mode === 'dropdown') {
      if (!location || typeof location !== 'string') {
        return NextResponse.json({ error: 'Valid location string is required for dropdown mode' }, { status: 400 });
      }
      if (location.length > MAX_LOCATION_LENGTH) {
        return NextResponse.json({ error: `Location must not exceed ${MAX_LOCATION_LENGTH} characters` }, { status: 400 });
      }
    }

    if (mode === 'map' && (typeof latitude !== 'number' || typeof longitude !== 'number')) {
      return NextResponse.json({ error: 'Valid latitude and longitude are required for map mode' }, { status: 400 });
    }

    if (!radius || typeof radius !== 'number' || radius <= 0 || radius > 50000) {
      return NextResponse.json({ error: 'Valid radius in meters is required (max 50,000)' }, { status: 400 });
    }

    const searchData = await ExtractionOrchestrator.performDeepSearch({
      keyword: keyword.trim(),
      locationName: location,
      radiusMeters: radius,
      mode,
      latitude,
      longitude,
    });

    return NextResponse.json({ success: true, data: searchData });
  } catch (error: unknown) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
