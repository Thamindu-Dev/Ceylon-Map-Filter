import { env } from '../env';

export const googleConfig = {
  // Use a getter so the environment variable is validated when accessed
  get apiKey() {
    return env.googleMapsApiKey;
  },
  
  // Base URLs for the Google APIs we will use
  urls: {
    geocoding: 'https://maps.googleapis.com/maps/api/geocode/json',
    placesNew: 'https://places.googleapis.com/v1/places:searchNearby'
  }
};
