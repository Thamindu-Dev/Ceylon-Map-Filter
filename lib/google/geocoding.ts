import axios from 'axios';
import { googleConfig } from './config';
import { GeocodingResult } from '../../types';

/**
 * Service to interact with the Google Geocoding API.
 * Designed for server-side use to protect API keys.
 */
export class GeocodingService {
  /**
   * Converts a location string into geographic coordinates.
   * 
   * @param locationName - The address or place name to geocode (e.g., "Colombo")
   * @returns A promise that resolves to lat, lng, and formatted address.
   * @throws Error if the API request fails or no results are found.
   */
  static async getCoordinates(locationName: string): Promise<GeocodingResult> {
    if (!locationName || locationName.trim() === '') {
      throw new Error('Location name must be provided');
    }

    try {
      const response = await axios.get(googleConfig.urls.geocoding, {
        params: {
          address: locationName,
          key: googleConfig.apiKey,
        },
      });

      const data = response.data;

      if (data.status !== 'OK' || !data.results || data.results.length === 0) {
        throw new Error(`Geocoding failed for "${locationName}": ${data.error_message || data.status}`);
      }

      // We take the first result as the most relevant match
      const result = data.results[0];

      let viewport;
      if (result.geometry?.viewport) {
        viewport = {
          low: {
            latitude: result.geometry.viewport.southwest.lat,
            longitude: result.geometry.viewport.southwest.lng,
          },
          high: {
            latitude: result.geometry.viewport.northeast.lat,
            longitude: result.geometry.viewport.northeast.lng,
          }
        };
      }

      // Find the city/locality in the address components
      let city: string | undefined = undefined;
      if (result.address_components) {
        for (const component of result.address_components) {
          if (component.types.includes('locality')) {
            city = component.long_name;
            break;
          }
        }
        if (!city) {
          for (const component of result.address_components) {
            if (component.types.includes('sublocality') || component.types.includes('administrative_area_level_3')) {
              city = component.long_name;
              break;
            }
          }
        }
      }

      return {
        latitude: result.geometry.location.lat,
        longitude: result.geometry.location.lng,
        formattedAddress: result.formatted_address,
        viewport,
        city,
      };
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Network error during geocoding API call: ${error.message}`);
      }
      // Re-throw custom logic errors from above
      throw error;
    }
  }

  /**
   * Performs reverse geocoding to get address details from latitude and longitude.
   * 
   * @param latitude - The latitude
   * @param longitude - The longitude
   * @returns A promise that resolves to lat, lng, formatted address, and city.
   */
  static async reverseGeocode(latitude: number, longitude: number): Promise<GeocodingResult> {
    try {
      const response = await axios.get(googleConfig.urls.geocoding, {
        params: {
          latlng: `${latitude},${longitude}`,
          key: googleConfig.apiKey,
        },
      });

      const data = response.data;

      if (data.status !== 'OK' || !data.results || data.results.length === 0) {
        return {
          latitude,
          longitude,
          formattedAddress: `Map Point (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`
        };
      }

      const result = data.results[0];
      
      // Find the city/locality in the address components
      let city: string | undefined = undefined;
      if (result.address_components) {
        for (const component of result.address_components) {
          if (component.types.includes('locality')) {
            city = component.long_name;
            break;
          }
        }
        if (!city) {
          for (const component of result.address_components) {
            if (component.types.includes('sublocality') || component.types.includes('administrative_area_level_3')) {
              city = component.long_name;
              break;
            }
          }
        }
      }

      return {
        latitude: result.geometry?.location?.lat ?? latitude,
        longitude: result.geometry?.location?.lng ?? longitude,
        formattedAddress: result.formatted_address,
        city
      };
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
      return {
        latitude,
        longitude,
        formattedAddress: `Map Point (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`
      };
    }
  }
}
