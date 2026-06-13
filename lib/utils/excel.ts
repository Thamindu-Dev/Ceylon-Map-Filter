import * as ExcelJS from 'exceljs';
import { Place } from '../../types';
import { getExportTitleAndFilename } from './exportNaming';

export const generateExcelBuffer = async (
  places: Place[],
  metadata?: {
    category?: string;
    keyword?: string;
    city?: string;
    radius?: number;
    mode?: 'dropdown' | 'map';
  } | null
): Promise<ArrayBuffer> => {
  const { title } = getExportTitleAndFilename(metadata);

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Places');

  // Add title row at row 1
  const titleRow = sheet.getRow(1);
  titleRow.values = [title];
  titleRow.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FF1E3A8A' } }; // Deep blue
  sheet.mergeCells('A1:H1');
  sheet.getRow(2).values = []; // Empty spacer row

  // Column headers at row 3
  const headerRow = sheet.getRow(3);
  headerRow.values = ['Name', 'Address', 'Phone', 'Website', 'Rating', 'Reviews', 'Latitude', 'Longitude'];
  headerRow.font = { name: 'Arial', size: 11, bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };

  sheet.columns = [
    { key: 'name', width: 30 },
    { key: 'address', width: 40 },
    { key: 'phone', width: 20 },
    { key: 'website', width: 30 },
    { key: 'rating', width: 10 },
    { key: 'review_count', width: 10 },
    { key: 'latitude', width: 15 },
    { key: 'longitude', width: 15 },
  ];

  places.forEach((place) => {
    sheet.addRow({
      name: place.name,
      address: place.address || '',
      phone: place.phone || '',
      website: place.website || '',
      rating: place.rating || '',
      review_count: place.review_count || '',
      latitude: place.latitude || '',
      longitude: place.longitude || '',
    });
  });

  // Next.js Responses work well with ArrayBuffers
  const buffer = await workbook.xlsx.writeBuffer();
  return buffer as ArrayBuffer;
};
