import { NextRequest, NextResponse } from 'next/server';
import { generatePdfBuffer } from '../../../../lib/utils/pdf';
import { getExportTitleAndFilename } from '../../../../lib/utils/exportNaming';
import type { Place } from '../../../../types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { places, metadata } = body as {
      places: Place[];
      metadata?: {
        category?: string;
        keyword?: string;
        city?: string;
        radius?: number;
        mode?: 'dropdown' | 'map';
      };
    };

    if (!Array.isArray(places) || places.length === 0) {
      return NextResponse.json({ error: 'No places provided for export' }, { status: 400 });
    }

    const { filename } = getExportTitleAndFilename(metadata);
    const buffer = await generatePdfBuffer(places, metadata);

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}.pdf"`,
      },
    });
  } catch (error: unknown) {
    console.error('PDF export error:', error);
    return NextResponse.json({ error: 'Failed to generate PDF file' }, { status: 500 });
  }
}
