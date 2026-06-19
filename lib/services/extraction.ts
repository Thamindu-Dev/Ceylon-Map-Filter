import { GeocodingService } from '../google/geocoding';
import { PlacesService } from '../google/places';
import { PlaceResult, ExtractionRequest, GeocodingResult } from '../../types';

const METERS_PER_DEGREE_LAT = 111320;
const GRID_CONCURRENCY = 3;
const PAGE_DELAY_MS = 2000;
const GRID_DELAY_MS = 500;
const MAX_PAGES_PER_POINT = 3;

export class ExtractionOrchestrator {
  private static generateSearchGrid(
    centerLat: number,
    centerLng: number,
    totalRadiusMeters: number
  ) {
    if (totalRadiusMeters <= 1500) {
      return [{ lat: centerLat, lng: centerLng, radius: totalRadiusMeters }];
    }

    const subRadius = Math.ceil(totalRadiusMeters / 1.5);
    const latOffset = (subRadius * 0.8) / METERS_PER_DEGREE_LAT;
    const lngOffset =
      (subRadius * 0.8) /
      (METERS_PER_DEGREE_LAT * Math.cos(centerLat * (Math.PI / 180)));
    const diagLat = latOffset * 0.707;
    const diagLng = lngOffset * 0.707;

    return [
      { lat: centerLat, lng: centerLng, radius: subRadius },
      { lat: centerLat + latOffset, lng: centerLng, radius: subRadius },
      { lat: centerLat - latOffset, lng: centerLng, radius: subRadius },
      { lat: centerLat, lng: centerLng + lngOffset, radius: subRadius },
      { lat: centerLat, lng: centerLng - lngOffset, radius: subRadius },
      { lat: centerLat + diagLat, lng: centerLng + diagLng, radius: subRadius },
      { lat: centerLat + diagLat, lng: centerLng - diagLng, radius: subRadius },
      { lat: centerLat - diagLat, lng: centerLng + diagLng, radius: subRadius },
      { lat: centerLat - diagLat, lng: centerLng - diagLng, radius: subRadius },
    ];
  }

  private static haversineDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371e3;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  private static async searchGridPoint(
    keyword: string,
    point: { lat: number; lng: number; radius: number },
    centerLat: number,
    centerLng: number,
    radiusMeters: number
  ): Promise<PlaceResult[]> {
    const results: PlaceResult[] = [];
    let pageToken: string | undefined;
    let pageCount = 0;

    do {
      try {
        const result = await PlacesService.searchPlaces(
          keyword,
          point.lat,
          point.lng,
          point.radius,
          pageToken
        );

        for (const p of result.places) {
          if (p.latitude !== null && p.longitude !== null) {
            const dist = this.haversineDistance(centerLat, centerLng, p.latitude, p.longitude);
            if (dist > radiusMeters) continue;
          }
          results.push(p);
        }

        pageToken = result.nextPageToken;
        pageCount++;

        if (pageToken) {
          await new Promise((r) => setTimeout(r, PAGE_DELAY_MS));
        }
      } catch (err) {
        console.error(`Grid search failed at (${point.lat}, ${point.lng}):`, err);
        break;
      }
    } while (pageToken && pageCount < MAX_PAGES_PER_POINT);

    return results;
  }

  static async performDeepSearch(request: ExtractionRequest) {
    const { keyword, locationName, mode, latitude, longitude } = request;
    let { radiusMeters } = request;

    let centerLat: number;
    let centerLng: number;
    let geoResult: GeocodingResult | undefined;

    if (mode === 'dropdown') {
      if (!locationName) throw new Error('Location name is required for dropdown mode');
      geoResult = await GeocodingService.getCoordinates(locationName);
      centerLat = geoResult.latitude;
      centerLng = geoResult.longitude;

      if (!geoResult.city) {
        geoResult.city = locationName.split(',')[0].trim();
      }

      if (geoResult.viewport) {
        const cornerDist = this.haversineDistance(
          centerLat,
          centerLng,
          geoResult.viewport.high.latitude,
          geoResult.viewport.high.longitude
        );
        radiusMeters = Math.min(Math.ceil(cornerDist * 1.2), 50000);
      }
    } else {
      if (latitude === undefined || longitude === undefined) {
        throw new Error('Latitude and longitude are required for map mode');
      }
      centerLat = latitude;
      centerLng = longitude;
      geoResult = await GeocodingService.reverseGeocode(centerLat, centerLng);
    }

    const gridPoints = this.generateSearchGrid(centerLat, centerLng, radiusMeters);
    const allPlaces = new Map<string, PlaceResult>();

    for (let i = 0; i < gridPoints.length; i += GRID_CONCURRENCY) {
      const batch = gridPoints.slice(i, i + GRID_CONCURRENCY);
      const batchResults = await Promise.all(
        batch.map((point) =>
          this.searchGridPoint(keyword, point, centerLat, centerLng, radiusMeters)
        )
      );

      for (const pointResults of batchResults) {
        for (const place of pointResults) {
          if (!allPlaces.has(place.place_id)) {
            allPlaces.set(place.place_id, place);
          }
        }
      }

      if (i + GRID_CONCURRENCY < gridPoints.length) {
        await new Promise((r) => setTimeout(r, GRID_DELAY_MS));
      }
    }

    const uniquePlaces = Array.from(allPlaces.values());

    return {
      centerCoordinates: geoResult,
      places: uniquePlaces,
      totalGridPointsSearched: gridPoints.length,
      totalUniqueResults: uniquePlaces.length,
    };
  }
}
