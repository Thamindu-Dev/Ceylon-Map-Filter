import { googleConfig } from './config';
import { PlaceResult } from '../../types';

const FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.nationalPhoneNumber',
  'places.websiteUri',
  'places.rating',
  'places.userRatingCount',
  'places.location',
  'places.primaryType',
  'nextPageToken',
].join(',');

export class PlacesService {
  static async searchPlaces(
    keyword: string,
    latitude: number,
    longitude: number,
    radiusMeters: number,
    pageToken?: string
  ): Promise<{ places: PlaceResult[]; nextPageToken?: string }> {
    const requestBody: Record<string, unknown> = {
      textQuery: keyword,
      locationBias: {
        circle: {
          center: { latitude, longitude },
          radius: radiusMeters,
        },
      },
    };

    if (pageToken) {
      requestBody.pageToken = pageToken;
    }

    const response = await fetch(googleConfig.urls.placesTextSearch, {
      method: 'POST',
      headers: {
        'X-Goog-Api-Key': googleConfig.apiKey,
        'X-Goog-FieldMask': FIELD_MASK,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(
        `Google Places API error (${response.status}): ${err?.error?.message ?? response.statusText}`
      );
    }

    const data = await response.json();

    const places: PlaceResult[] = (data.places ?? []).map((p: Record<string, unknown>) => {
      const displayName = p.displayName as { text?: string } | undefined;
      const location = p.location as { latitude?: number; longitude?: number } | undefined;
      return {
        place_id: p.id as string,
        name: displayName?.text ?? '',
        address: (p.formattedAddress as string | null) ?? null,
        phone: (p.nationalPhoneNumber as string | null) ?? null,
        website: (p.websiteUri as string | null) ?? null,
        rating: (p.rating as number | null) ?? null,
        review_count: (p.userRatingCount as number | null) ?? null,
        latitude: location?.latitude ?? null,
        longitude: location?.longitude ?? null,
        category: (p.primaryType as string | null) ?? keyword,
      };
    });

    return { places, nextPageToken: data.nextPageToken };
  }
}
