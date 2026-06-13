import { NextRequest, NextResponse } from 'next/server';
import { PlacesRepository } from '../../../../lib/supabase/repository';
import { generatePdfBuffer } from '../../../../lib/utils/pdf';
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

    // Filter by keyword and location if provided, to export the displayed dataset
    if (keyword && location) {
      places = await PlacesRepository.getPlacesBySearch(keyword, location);
    } else {
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
    const buffer = await generatePdfBuffer(places, metadata);

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error('PDF Export Error:', error);
    return NextResponse.json({ error: 'Failed to generate PDF file' }, { status: 500 });
  }
}
