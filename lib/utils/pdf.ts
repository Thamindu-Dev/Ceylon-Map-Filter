import pdfMake from 'pdfmake/build/pdfmake.js';
import pdfFonts from 'pdfmake/build/vfs_fonts.js';
import { Place } from '../../types';

// Inject the virtual file system to use fonts seamlessly on the server
(pdfMake as any).vfs = pdfFonts.pdfMake.vfs;

export const generatePdfBuffer = async (
  places: Place[],
  keyword: string,
  location: string
): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    try {
      const docDefinition: any = {
        content: [
          { text: 'Business Directory Extract', style: 'header' },
          { text: `Search Keyword: ${keyword || 'All'}`, style: 'subheader' },
          { text: `Search Location: ${location || 'All'}`, style: 'subheader' },
          { text: `Total Records: ${places.length}`, style: 'subheader', margin: [0, 0, 0, 20] },
        ],
        styles: {
          header: { fontSize: 24, bold: true, margin: [0, 0, 0, 10], color: '#1e3a8a' }, // Deep blue
          subheader: { fontSize: 14, bold: true, margin: [0, 0, 0, 5], color: '#374151' }, // Gray 700
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

      const pdfDocGenerator = (pdfMake as any).createPdf(docDefinition);
      
      pdfDocGenerator.getBuffer((buffer: Buffer) => {
        resolve(buffer);
      });
    } catch (error) {
      reject(error);
    }
  });
};
