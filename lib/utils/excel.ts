import * as ExcelJS from 'exceljs';
import { Place } from '../../types';

export const generateExcelBuffer = async (places: Place[]): Promise<ArrayBuffer> => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Places');

  sheet.columns = [
    { header: 'Name', key: 'name', width: 30 },
    { header: 'Address', key: 'address', width: 40 },
    { header: 'Phone', key: 'phone', width: 20 },
    { header: 'Website', key: 'website', width: 30 },
    { header: 'Rating', key: 'rating', width: 10 },
    { header: 'Reviews', key: 'review_count', width: 10 },
    { header: 'Latitude', key: 'latitude', width: 15 },
    { header: 'Longitude', key: 'longitude', width: 15 },
  ];

  // Style the header row
  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };

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
