// @ts-ignore
import pdfMake from 'pdfmake/build/pdfmake.js';
// @ts-ignore
import pdfFonts from 'pdfmake/build/vfs_fonts.js';
import { Place } from '../../types';

const pdfMakeLib = pdfMake && (pdfMake as any).default ? (pdfMake as any).default : pdfMake;

// Inject the virtual file system to use fonts seamlessly on the server
if (pdfMakeLib && pdfFonts) {
  const vfs = pdfFonts.pdfMake ? pdfFonts.pdfMake.vfs : pdfFonts;
  pdfMakeLib.vfs = vfs;
}

import { getExportTitleAndFilename } from './exportNaming';

export const generatePdfBuffer = async (
  places: Place[],
  metadata?: {
    category?: string;
    keyword?: string;
    city?: string;
    radius?: number;
    mode?: 'dropdown' | 'map';
  } | null
): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    try {
      const { title } = getExportTitleAndFilename(metadata);

      const docDefinition: any = {
        content: [
          { text: title, style: 'header' },
          { text: `Total Records: ${places.length}`, style: 'subheader', margin: [0, 0, 0, 20] },
        ],
        styles: {
          header: { fontSize: 20, bold: true, margin: [0, 0, 0, 10], color: '#1e3a8a' }, // Deep blue
          subheader: { fontSize: 12, bold: true, margin: [0, 0, 0, 5], color: '#374151' }, // Gray 700
          placeTitle: { fontSize: 16, bold: true, color: '#111827', margin: [0, 15, 0, 5] },
          placeDetails: { fontSize: 12, color: '#4b5563', margin: [0, 2, 0, 2], lineHeight: 1.4 }
        },
        defaultStyle: {
          font: 'Roboto'
        }
      };

      // Implement as a numbered directory list as per earlier plan review preference
      places.forEach((place, index) => {
        docDefinition.content.push({
          text: `${index + 1}. ${place.name}`,
          style: 'placeTitle'
        });

        const details = [];
        if (place.category) details.push({ text: `Category: ${place.category.replace(/_/g, ' ')}` });
        if (place.address) details.push({ text: `Address: ${place.address}` });
        if (place.phone) details.push({ text: `Phone: ${place.phone}` });
        if (place.website) details.push({ text: `Website: ${place.website}`, link: place.website, color: '#2563eb' });
        if (place.rating) details.push({ text: `Rating: ${place.rating} (${place.review_count || 0} reviews)` });

        docDefinition.content.push({
          ul: details,
          style: 'placeDetails',
          margin: [15, 0, 0, 15]
        });
      });

      const pdfDocGenerator = (pdfMakeLib as any).createPdf(docDefinition);
      
      pdfDocGenerator.getBuffer((buffer: Buffer) => {
        resolve(buffer);
      });
    } catch (error) {
      reject(error);
    }
  });
};
