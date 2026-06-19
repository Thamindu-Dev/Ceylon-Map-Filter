export const env = {
  get googleMapsApiKey(): string {
    const value = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!value) {
      throw new Error('Missing environment variable: NEXT_PUBLIC_GOOGLE_MAPS_API_KEY');
    }
    return value;
  },
};
