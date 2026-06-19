// @ts-expect-error — pdfmake lacks official type declarations
import pdfMake from 'pdfmake/build/pdfmake.js';
// @ts-expect-error — pdfmake lacks official type declarations
import pdfFonts from 'pdfmake/build/vfs_fonts.js';
import { Place } from '../../types';
import { getExportTitleAndFilename } from './exportNaming';

type PdfMakeInstance = {
  vfs?: Record<string, string>;
  createPdf: (def: PdfDocDefinition) => { getBuffer: (cb: (buf: Buffer) => void) => void };
};

type PdfDocDefinition = {
  content: unknown[];
  styles: Record<string, unknown>;
  defaultStyle: Record<string, unknown>;
};

const rawLib = pdfMake as PdfMakeInstance & { default?: PdfMakeInstance };
const pdfMakeLib: PdfMakeInstance = rawLib.default ?? rawLib;
const vfs = (pdfFonts as { pdfMake?: { vfs: Record<string, string> } })?.pdfMake?.vfs ?? (pdfFonts as Record<string, string>);
if (pdfMakeLib && vfs) {
  pdfMakeLib.vfs = vfs;
}

export const generatePdfBuffer = (
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

      const docDefinition: PdfDocDefinition = {
        content: [
          { text: title, style: 'header' },
          { text: `Total Records: ${places.length}`, style: 'subheader', margin: [0, 0, 0, 20] },
        ],
        styles: {
          header: { fontSize: 20, bold: true, margin: [0, 0, 0, 10], color: '#1e3a8a' },
          subheader: { fontSize: 12, bold: true, margin: [0, 0, 0, 5], color: '#374151' },
          placeTitle: { fontSize: 16, bold: true, color: '#111827', margin: [0, 15, 0, 5] },
          placeDetails: { fontSize: 12, color: '#4b5563', margin: [0, 2, 0, 2], lineHeight: 1.4 },
        },
        defaultStyle: { font: 'Roboto' },
      };

      places.forEach((place, index) => {
        (docDefinition.content as unknown[]).push({ text: `${index + 1}. ${place.name}`, style: 'placeTitle' });

        const details: unknown[] = [];
        if (place.category) details.push({ text: `Category: ${place.category.replace(/_/g, ' ')}` });
        if (place.address) details.push({ text: `Address: ${place.address}` });
        if (place.phone) details.push({ text: `Phone: ${place.phone}` });
        if (place.website) details.push({ text: `Website: ${place.website}`, link: place.website, color: '#2563eb' });
        if (place.rating) details.push({ text: `Rating: ${place.rating} (${place.review_count ?? 0} reviews)` });

        (docDefinition.content as unknown[]).push({ ul: details, style: 'placeDetails', margin: [15, 0, 0, 15] });
      });

      pdfMakeLib.createPdf(docDefinition).getBuffer((buffer: Buffer) => {
        resolve(buffer);
      });
    } catch (error) {
      reject(error);
    }
  });
};
