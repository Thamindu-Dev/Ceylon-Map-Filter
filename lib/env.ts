export const env = {
  get googleMapsApiKey(): string {
    const value = process.env.GOOGLE_MAPS_API_KEY;
    if (!value) {
      throw new Error('Missing environment variable: GOOGLE_MAPS_API_KEY');
    }
    return value;
  },
};
