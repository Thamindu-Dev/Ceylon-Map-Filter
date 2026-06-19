import { googleConfig } from './config';
import { GeocodingResult } from '../../types';

export class GeocodingService {
  static async getCoordinates(locationName: string): Promise<GeocodingResult> {
    if (!locationName || locationName.trim() === '') {
      throw new Error('Location name must be provided');
    }

    const url = new URL(googleConfig.urls.geocoding);
    url.searchParams.set('address', locationName);
    url.searchParams.set('key', googleConfig.apiKey);

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`Geocoding request failed with status ${response.status}`);
    }

    const data = await response.json();

    if (data.status !== 'OK' || !data.results?.length) {
      throw new Error(`Geocoding failed for "${locationName}": ${data.error_message ?? data.status}`);
    }

    const result = data.results[0];

    let viewport: GeocodingResult['viewport'];
    if (result.geometry?.viewport) {
      viewport = {
        low: {
          latitude: result.geometry.viewport.southwest.lat,
          longitude: result.geometry.viewport.southwest.lng,
        },
        high: {
          latitude: result.geometry.viewport.northeast.lat,
          longitude: result.geometry.viewport.northeast.lng,
        },
      };
    }

    const city = GeocodingService.extractCity(result.address_components);

    return {
      latitude: result.geometry.location.lat,
      longitude: result.geometry.location.lng,
      formattedAddress: result.formatted_address,
      viewport,
      city,
    };
  }

  static async reverseGeocode(latitude: number, longitude: number): Promise<GeocodingResult> {
    const fallback: GeocodingResult = {
      latitude,
      longitude,
      formattedAddress: `Map Point (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
    };

    try {
      const url = new URL(googleConfig.urls.geocoding);
      url.searchParams.set('latlng', `${latitude},${longitude}`);
      url.searchParams.set('key', googleConfig.apiKey);

      const response = await fetch(url.toString());

      if (!response.ok) return fallback;

      const data = await response.json();

      if (data.status !== 'OK' || !data.results?.length) return fallback;

      const result = data.results[0];
      const city = GeocodingService.extractCity(result.address_components);

      return {
        latitude: result.geometry?.location?.lat ?? latitude,
        longitude: result.geometry?.location?.lng ?? longitude,
        formattedAddress: result.formatted_address,
        city,
      };
    } catch (err) {
      console.error('Reverse geocoding failed:', err);
      return fallback;
    }
  }

  private static extractCity(
    components: Array<{ types: string[]; long_name: string }> | undefined
  ): string | undefined {
    if (!components) return undefined;

    const primary = components.find((c) => c.types.includes('locality'));
    if (primary) return primary.long_name;

    const secondary = components.find(
      (c) =>
        c.types.includes('sublocality') ||
        c.types.includes('administrative_area_level_3')
    );
    return secondary?.long_name;
  }
}
