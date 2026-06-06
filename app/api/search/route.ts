import { NextRequest, NextResponse } from 'next/server';
import { ExtractionOrchestrator } from '../../../lib/services/extraction';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { keyword, location, radius, pageToken } = body;

    // Validation
    if (!keyword || typeof keyword !== 'string') {
      return NextResponse.json({ error: 'Valid keyword string is required' }, { status: 400 });
    }
    
    if (!location || typeof location !== 'string') {
      return NextResponse.json({ error: 'Valid location string is required' }, { status: 400 });
    }

    if (!radius || typeof radius !== 'number' || radius <= 0 || radius > 50000) {
      return NextResponse.json({ error: 'Valid radius in meters is required (max 50,000)' }, { status: 400 });
    }

    // 1. Perform Deep Search Orchestration
    // This handles Geocoding, Grid generation, Google Places Search, Pagination, Deduplication, and Database Storage.
    const searchData = await ExtractionOrchestrator.performDeepSearch(
      keyword,
      location,
      radius
    );

    // 2. Return results
    return NextResponse.json({
      success: true,
      data: searchData
    });

  } catch (error: any) {
    console.error('API /api/search Error:', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred during search' },
      { status: 500 }
    );
  }
}
