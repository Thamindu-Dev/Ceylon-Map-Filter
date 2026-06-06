import { supabase } from './client';
import { Place } from '../../types';

export class PlacesRepository {
  /**
   * Bulk inserts places into the Supabase database.
   * Gracefully ignores duplicates based on the unique place_id constraint.
   * 
   * @param places - An array of Place objects to insert
   * @returns A promise that resolves when the insertion is complete
   */
  static async savePlaces(places: Place[]): Promise<void> {
    if (!places || places.length === 0) return;

    // We use upsert with ignoreDuplicates to silently skip any places
    // that already exist in our database with the same place_id.
    const { error } = await supabase
      .from('places')
      .upsert(places, { 
        onConflict: 'place_id', 
        ignoreDuplicates: true 
      });

    if (error) {
      console.error('Supabase Insert Error:', error);
      throw new Error(`Failed to save places to database: ${error.message}`);
    }
  }

  /**
   * Fetches all extracted places from the database.
   * Useful for exporting functionality.
   */
  static async getAllPlaces(): Promise<Place[]> {
    const { data, error } = await supabase
      .from('places')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Supabase Select Error:', error);
      throw new Error(`Failed to fetch places: ${error.message}`);
    }
    
    return data || [];
  }

  /**
   * Fetches places filtered by keyword and location.
   */
  static async getPlacesBySearch(keyword: string, location: string): Promise<Place[]> {
    const { data, error } = await supabase
      .from('places')
      .select('*')
      .ilike('search_keyword', `%${keyword}%`)
      .ilike('search_location', `%${location}%`)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Supabase Select Error:', error);
      throw new Error(`Failed to fetch places by search: ${error.message}`);
    }
    
    return data || [];
  }
}
