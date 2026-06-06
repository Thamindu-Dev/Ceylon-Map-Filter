import { GeocodingService } from '../google/geocoding';
import { PlacesService } from '../google/places';
import { PlacesRepository } from '../supabase/repository';
import { PlaceResult } from '../../types';

export class ExtractionOrchestrator {
  /**
   * Generates a spatial grid of search points to bypass Google's 60-result limit per search.
   * Optimized for Sri Lankan geography by using a 9-point grid (center + 8 compass points)
   * which overlaps efficiently to sweep an entire radius.
   *
   * @param centerLat Latitude of the main target
   * @param centerLng Longitude of the main target
   * @param totalRadiusMeters The total radius the user requested
   */
  private static generateSearchGrid(centerLat: number, centerLng: number, totalRadiusMeters: number) {
    // If the radius is small, a single point is sufficient to grab everything
    if (totalRadiusMeters <= 1500) {
       return [{ lat: centerLat, lng: centerLng, radius: totalRadiusMeters }];
    }

    // Sub-radius for each grid point. We use an overlapping sub-radius.
    const subRadius = Math.ceil(totalRadiusMeters / 1.5);
    
    // Constants for conversion (Approximate near Equator / Sri Lanka)
    const METERS_PER_DEGREE_LAT = 111320;
    
    // Calculate the coordinate offsets to place our grid points
    const latOffset = (subRadius * 0.8) / METERS_PER_DEGREE_LAT; 
    const lngOffset = (subRadius * 0.8) / (METERS_PER_DEGREE_LAT * Math.cos(centerLat * (Math.PI / 180)));

    const diagLatOffset = latOffset * 0.707; // sin/cos of 45 deg
    const diagLngOffset = lngOffset * 0.707;

    return [
      { lat: centerLat, lng: centerLng, radius: subRadius }, // Center
      { lat: centerLat + latOffset, lng: centerLng, radius: subRadius }, // North
      { lat: centerLat - latOffset, lng: centerLng, radius: subRadius }, // South
      { lat: centerLat, lng: centerLng + lngOffset, radius: subRadius }, // East
      { lat: centerLat, lng: centerLng - lngOffset, radius: subRadius }, // West
      { lat: centerLat + diagLatOffset, lng: centerLng + diagLngOffset, radius: subRadius }, // NE
      { lat: centerLat + diagLatOffset, lng: centerLng - diagLngOffset, radius: subRadius }, // NW
      { lat: centerLat - diagLatOffset, lng: centerLng + diagLngOffset, radius: subRadius }, // SE
      { lat: centerLat - diagLatOffset, lng: centerLng - diagLngOffset, radius: subRadius }, // SW
    ];
  }

  /**
   * Executes a comprehensive deep search across a generated grid, handling pagination,
   * deduplication, and database persistence automatically.
   */
  static async performDeepSearch(keyword: string, locationName: string, radiusMeters: number) {
    // 1. Resolve coordinates
    const geoResult = await GeocodingService.getCoordinates(locationName);
    
    // 2. Generate search points
    const gridPoints = this.generateSearchGrid(geoResult.latitude, geoResult.longitude, radiusMeters);

    // Use a Map to automatically deduplicate by place_id
    const allPlaces = new Map<string, PlaceResult>();

    // 3. Search each point sequentially to avoid rate limits
    for (let i = 0; i < gridPoints.length; i++) {
       const point = gridPoints[i];
       let pageToken: string | undefined = undefined;
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

           result.places.forEach(p => {
             if (!allPlaces.has(p.place_id)) {
               allPlaces.set(p.place_id, p);
             }
           });

           pageToken = result.nextPageToken;
           pageCount++;

           // Google Places API requires a short delay before using a nextPageToken
           if (pageToken) {
             await new Promise(r => setTimeout(r, 2000));
           }
         } catch (err) {
           console.error(`Grid search failed at point ${point.lat},${point.lng}:`, err);
           // If a single grid point fails, break its pagination but continue to the next grid point
           break; 
         }
       } while (pageToken && pageCount < 3); // Limit to 3 pages per grid point to avoid massive quotas
       
       // Add a minor delay between grid points
       if (i < gridPoints.length - 1) {
           await new Promise(r => setTimeout(r, 1000));
       }
    }

    const uniquePlaces = Array.from(allPlaces.values());

    // 4. Save results to the database in bulk
    if (uniquePlaces.length > 0) {
      const placesToSave = uniquePlaces.map(p => ({
        ...p,
        search_keyword: keyword,
        search_location: locationName
      }));
      await PlacesRepository.savePlaces(placesToSave);
    }

    // 5. Return the comprehensive result set
    return {
       centerCoordinates: geoResult,
       places: uniquePlaces,
       totalGridPointsSearched: gridPoints.length,
       totalUniqueResults: uniquePlaces.length
    };
  }
}
