/**
 * Formats a descriptive title and sanitized filename for exports.
 */
export function getExportTitleAndFilename(metadata?: {
  category?: string;
  keyword?: string;
  city?: string;
  radius?: number;
  mode?: 'dropdown' | 'map';
} | null) {
  if (!metadata) {
    return {
      title: 'Extracted Places Data',
      filename: 'places_data'
    };
  }

  const { category, keyword, city, radius, mode } = metadata;

  // 1. Pluralize Category
  let baseName = 'Places';
  if (category) {
    const cat = category.trim();
    const lowerCat = cat.toLowerCase();
    if (lowerCat === 'pharmacy') {
      baseName = 'Pharmacies';
    } else if (lowerCat === 'cafe') {
      baseName = 'Cafes';
    } else if (lowerCat.endsWith('s')) {
      baseName = cat;
    } else {
      baseName = `${cat}s`;
    }
  }

  // 2. Build Query Description with Keyword
  let queryDesc = '';
  if (keyword) {
    const kw = keyword.trim();
    if (category) {
      queryDesc = `${baseName} with ${kw}`;
    } else {
      queryDesc = `${baseName} with ${kw} keyword`;
    }
  } else {
    queryDesc = baseName;
  }

  // 3. Build Location Description with optional radius
  const locationName = city ? city.trim() : 'Unknown Location';
  let locationDesc = '';
  if (mode === 'map' && radius) {
    if (keyword) {
      locationDesc = `in ${radius}m radius around ${locationName}`;
    } else {
      locationDesc = `in ${locationName} and ${radius}m radius`;
    }
  } else {
    locationDesc = `in ${locationName}`;
  }

  const title = `${queryDesc} ${locationDesc}`.trim();

  // Sanitize for safe filenames (alphanumeric, spaces, dashes, underscores)
  const filename = title
    .replace(/[^a-zA-Z0-9\s-_]/g, '')
    .trim();

  return {
    title,
    filename: filename || 'places_data'
  };
}
