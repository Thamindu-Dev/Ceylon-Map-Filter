import React from 'react';
import { PlaceResult } from '../types';
import * as ExcelJS from 'exceljs';
// @ts-ignore
import pdfMake from 'pdfmake/build/pdfmake';
// @ts-ignore
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { Button } from './ui/Button';
import { getExportTitleAndFilename } from '../lib/utils/exportNaming';

// Initialize pdfMake fonts safely
if (pdfMake && pdfFonts && pdfFonts.pdfMake) {
  pdfMake.vfs = pdfFonts.pdfMake.vfs;
} else if (pdfMake && pdfFonts) {
  // @ts-ignore
  pdfMake.vfs = pdfFonts;
}

interface ResultsTableProps {
  places: PlaceResult[];
  searchMetadata?: {
    category?: string;
    keyword?: string;
    city?: string;
    radius?: number;
    mode?: 'dropdown' | 'map';
  } | null;
}

export const ResultsTable = ({ places, searchMetadata }: ResultsTableProps) => {
  if (!places || places.length === 0) return null;

  const handleExportExcel = async () => {
    const { title, filename } = getExportTitleAndFilename(searchMetadata);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Places');

    // Add title row at row 1
    const titleRow = worksheet.getRow(1);
    titleRow.values = [title];
    titleRow.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FF1E3A8A' } }; // Deep blue
    worksheet.mergeCells('A1:G1');
    worksheet.getRow(2).values = []; // Empty spacer row

    // Column headers at row 3
    const headerRow = worksheet.getRow(3);
    headerRow.values = ['Name', 'Category', 'Address', 'Rating', 'Reviews', 'Phone', 'Website'];
    headerRow.font = { name: 'Arial', size: 11, bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    worksheet.columns = [
      { key: 'name', width: 30 },
      { key: 'category', width: 20 },
      { key: 'address', width: 40 },
      { key: 'rating', width: 10 },
      { key: 'review_count', width: 10 },
      { key: 'phone', width: 20 },
      { key: 'website', width: 35 },
    ];

    places.forEach(place => {
      worksheet.addRow({
        name: place.name,
        category: place.category?.replace(/_/g, ' ') || '-',
        address: place.address || '-',
        rating: place.rating || '-',
        review_count: place.review_count || '-',
        phone: place.phone || '-',
        website: place.website || '-',
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${filename}.xlsx`;
    anchor.click();
    window.URL.revokeObjectURL(url);
  };

  const handleExportPDF = () => {
    const { title, filename } = getExportTitleAndFilename(searchMetadata);

    const tableBody: any[][] = [
      [{ text: 'Name', style: 'tableHeader' }, { text: 'Category', style: 'tableHeader' }, { text: 'Address', style: 'tableHeader' }, { text: 'Rating', style: 'tableHeader' }, { text: 'Phone', style: 'tableHeader' }]
    ];

    places.forEach(place => {
      tableBody.push([
        place.name || '-',
        place.category?.replace(/_/g, ' ') || '-',
        place.address || '-',
        place.rating ? `${place.rating} (${place.review_count})` : '-',
        place.phone || '-'
      ]);
    });

    const docDefinition = {
      content: [
        { text: title, style: 'header' },
        {
          table: {
            headerRows: 1,
            widths: ['*', 'auto', '*', 'auto', 'auto'],
            body: tableBody
          }
        }
      ],
      styles: {
        header: {
          fontSize: 18,
          bold: true,
          margin: [0, 0, 0, 10]
        },
        tableHeader: {
          bold: true,
          fontSize: 13,
          color: 'black'
        }
      }
    };

    pdfMake.createPdf(docDefinition as any).download(`${filename}.pdf`);
  };

  return (
    <div className="w-full space-y-4">
      <div className="flex justify-end gap-3">
        <Button onClick={handleExportExcel} className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 h-auto text-sm border-none">
          Export as Excel
        </Button>
        <Button onClick={handleExportPDF} className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 h-auto text-sm border-none">
          Export as PDF
        </Button>
      </div>

      <div className="w-full overflow-hidden rounded-2xl border border-gray-800 bg-gray-900/50 backdrop-blur-md shadow-2xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-800/80 text-gray-300 text-sm uppercase tracking-wider">
              <th className="p-4 font-semibold rounded-tl-2xl">Name</th>
              <th className="p-4 font-semibold">Category</th>
              <th className="p-4 font-semibold">Address</th>
              <th className="p-4 font-semibold">Rating</th>
              <th className="p-4 font-semibold rounded-tr-2xl">Contact</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/50 text-gray-200">
            {places.map((place, idx) => (
              <tr 
                key={place.place_id || idx} 
                className="hover:bg-gray-800/30 transition-colors duration-150"
              >
                <td className="p-4 font-medium">{place.name}</td>
                <td className="p-4 text-sm text-gray-400 capitalize">{place.category?.replace(/_/g, ' ') || '-'}</td>
                <td className="p-4 text-sm text-gray-400 max-w-xs truncate" title={place.address || ''}>
                  {place.address || '-'}
                </td>
                <td className="p-4">
                  {place.rating ? (
                    <div className="flex items-center gap-1.5">
                      <span className="text-amber-400">★</span>
                      <span className="font-medium">{place.rating}</span>
                      <span className="text-xs text-gray-500">({place.review_count})</span>
                    </div>
                  ) : (
                    <span className="text-gray-600">-</span>
                  )}
                </td>
                <td className="p-4 text-sm text-gray-400">
                  <div className="flex flex-col gap-1">
                    {place.phone ? <span>{place.phone}</span> : null}
                    {place.website ? (
                      <a href={place.website} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 transition-colors truncate max-w-[150px] inline-block">
                        Website ↗
                      </a>
                    ) : null}
                    {!place.phone && !place.website && <span className="text-gray-600">-</span>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
    </div>
  );
};
