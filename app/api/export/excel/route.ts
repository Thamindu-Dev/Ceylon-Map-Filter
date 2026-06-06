import { NextRequest, NextResponse } from 'next/server';
import { PlacesRepository } from '../../../../lib/supabase/repository';
import { generateExcelBuffer } from '../../../../lib/utils/excel';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const keyword = searchParams.get('keyword');
    const location = searchParams.get('location');

    let places = [];

    // If we have filters, fetch only those to export exactly what was searched
    if (keyword && location) {
      places = await PlacesRepository.getPlacesBySearch(keyword, location);
    } else {
      // Fallback: fetch everything if no parameters provided
      places = await PlacesRepository.getAllPlaces();
    }

    if (places.length === 0) {
      return NextResponse.json({ error: 'No places found to export' }, { status: 404 });
    }

    const buffer = await generateExcelBuffer(places);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="places_export_${Date.now()}.xlsx"`,
      },
    });
  } catch (error: any) {
    console.error('Excel Export Error:', error);
    return NextResponse.json({ error: 'Failed to generate Excel file' }, { status: 500 });
  }
}
