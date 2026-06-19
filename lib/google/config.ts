import { env } from '../env';

export const googleConfig = {
  get apiKey() {
    return env.googleMapsApiKey;
  },
  urls: {
    geocoding: 'https://maps.googleapis.com/maps/api/geocode/json',
    placesNew: 'https://places.googleapis.com/v1/places:searchNearby',
    placesTextSearch: 'https://places.googleapis.com/v1/places:searchText',
  },
};
