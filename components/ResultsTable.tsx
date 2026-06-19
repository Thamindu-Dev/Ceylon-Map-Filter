'use client';

import React, { useState } from 'react';
import { PlaceResult } from '../types';
import { Button } from './ui/Button';

interface SearchMetadata {
  category?: string;
  keyword?: string;
  city?: string;
  radius?: number;
  mode?: 'dropdown' | 'map';
}

interface ResultsTableProps {
  places: PlaceResult[];
  searchMetadata?: SearchMetadata | null;
}

export const ResultsTable = ({ places, searchMetadata }: ResultsTableProps) => {
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  if (!places || places.length === 0) return null;

  const triggerDownload = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    window.URL.revokeObjectURL(url);
  };

  const handleExportExcel = async () => {
    setIsExportingExcel(true);
    try {
      const response = await fetch('/api/export/excel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ places, metadata: searchMetadata }),
      });

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const disposition = response.headers.get('Content-Disposition') ?? '';
      const match = disposition.match(/filename="?([^"]+)"?/);
      const filename = match?.[1] ?? 'places_data.xlsx';
      triggerDownload(blob, filename);
    } catch (err) {
      console.error('Excel export error:', err);
    } finally {
      setIsExportingExcel(false);
    }
  };

  const handleExportPDF = async () => {
    setIsExportingPdf(true);
    try {
      const response = await fetch('/api/export/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ places, metadata: searchMetadata }),
      });

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const disposition = response.headers.get('Content-Disposition') ?? '';
      const match = disposition.match(/filename="?([^"]+)"?/);
      const filename = match?.[1] ?? 'places_data.pdf';
      triggerDownload(blob, filename);
    } catch (err) {
      console.error('PDF export error:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="w-full space-y-4">
      <div className="flex justify-end gap-3">
        <Button
          onClick={handleExportExcel}
          isLoading={isExportingExcel}
          className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 h-auto text-sm border-none"
        >
          Export as Excel
        </Button>
        <Button
          onClick={handleExportPDF}
          isLoading={isExportingPdf}
          className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 h-auto text-sm border-none"
        >
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
                  <td className="p-4 text-sm text-gray-400 capitalize">
                    {place.category?.replace(/_/g, ' ') || '-'}
                  </td>
                  <td
                    className="p-4 text-sm text-gray-400 max-w-xs truncate"
                    title={place.address || ''}
                  >
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
                      {place.phone && <span>{place.phone}</span>}
                      {place.website && (
                        <a
                          href={place.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 transition-colors truncate max-w-[150px] inline-block"
                        >
                          Website ↗
                        </a>
                      )}
                      {!place.phone && !place.website && (
                        <span className="text-gray-600">-</span>
                      )}
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
