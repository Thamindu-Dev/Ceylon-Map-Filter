/**
 * Environment variable validation and export.
 * Using getter functions ensures that Next.js doesn't throw errors at build time
 * if variables are only needed at runtime. It will fail fast when accessed if missing.
 */
export const env = {
  get supabaseUrl(): string {
    const value = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!value) {
      throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_URL');
    }
    return value;
  },
  
  get supabaseAnonKey(): string {
    const value = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!value) {
      throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY');
    }
    return value;
  },
  
  get googleMapsApiKey(): string {
    const value = process.env.GOOGLE_MAPS_API_KEY;
    if (!value) {
      throw new Error('Missing environment variable: GOOGLE_MAPS_API_KEY');
    }
    return value;
  }
};
