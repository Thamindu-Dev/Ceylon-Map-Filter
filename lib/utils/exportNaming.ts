export function getExportTitleAndFilename(
  metadata?: {
    category?: string;
    keyword?: string;
    city?: string;
    radius?: number;
    mode?: 'dropdown' | 'map';
  } | null
) {
  if (!metadata) {
    return { title: 'Extracted Places Data', filename: 'places_data' };
  }

  const { category, keyword, city, radius, mode } = metadata;

  let baseName = 'Places';
  if (category) {
    const cat = category.trim();
    const lower = cat.toLowerCase();
    if (lower === 'pharmacy') {
      baseName = 'Pharmacies';
    } else if (lower === 'cafe') {
      baseName = 'Cafes';
    } else if (lower.endsWith('s')) {
      baseName = cat;
    } else {
      baseName = `${cat}s`;
    }
  }

  const queryDesc = keyword
    ? category
      ? `${baseName} with ${keyword.trim()}`
      : `${baseName} with ${keyword.trim()} keyword`
    : baseName;

  const locationName = city?.trim() || 'Unknown Location';
  const locationDesc =
    mode === 'map' && radius
      ? keyword
        ? `in ${radius}m radius around ${locationName}`
        : `in ${locationName} and ${radius}m radius`
      : `in ${locationName}`;

  const title = `${queryDesc} ${locationDesc}`.trim();
  const filename = title.replace(/[^a-zA-Z0-9\s\-_]/g, '').trim() || 'places_data';

  return { title, filename };
}
