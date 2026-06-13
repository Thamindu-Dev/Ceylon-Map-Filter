import { NextRequest, NextResponse } from 'next/server';
import { PlacesRepository } from '../../../../lib/supabase/repository';
import { generateExcelBuffer } from '../../../../lib/utils/excel';
import { getExportTitleAndFilename } from '../../../../lib/utils/exportNaming';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const keyword = searchParams.get('keyword') || '';
    const location = searchParams.get('location') || '';
    const category = searchParams.get('category') || '';
    const city = searchParams.get('city') || '';
    const radiusStr = searchParams.get('radius');
    const radius = radiusStr ? parseInt(radiusStr, 10) : undefined;
    const mode = (searchParams.get('mode') as 'dropdown' | 'map') || 'dropdown';

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

    let resolvedCity = city;
    if (!resolvedCity && location) {
      resolvedCity = location.split(',')[0].trim();
    }

    const metadata = {
      category,
      keyword,
      city: resolvedCity,
      radius,
      mode
    };

    const { filename } = getExportTitleAndFilename(metadata);
    const buffer = await generateExcelBuffer(places, metadata);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}.xlsx"`,
      },
    });
  } catch (error: any) {
    console.error('Excel Export Error:', error);
    return NextResponse.json({ error: 'Failed to generate Excel file' }, { status: 500 });
  }
}
