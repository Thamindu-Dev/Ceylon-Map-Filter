import { NextRequest, NextResponse } from 'next/server';
import { generateExcelBuffer } from '../../../../lib/utils/excel';
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
    const buffer = await generateExcelBuffer(places, metadata);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}.xlsx"`,
      },
    });
  } catch (error: unknown) {
    console.error('Excel export error:', error);
    return NextResponse.json({ error: 'Failed to generate Excel file' }, { status: 500 });
  }
}
