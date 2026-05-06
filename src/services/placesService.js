import axios from 'axios';
import { GOOGLE_PLACES_API_KEY, LANDMARK_RADIUS_METERS } from '../config';

const BASE = 'https://maps.googleapis.com/maps/api/place';

export async function getNearbyLandmarks(latitude, longitude) {
  const response = await axios.get(`${BASE}/nearbysearch/json`, {
    params: {
      location: `${latitude},${longitude}`,
      radius: LANDMARK_RADIUS_METERS,
      type: 'tourist_attraction',
      key: GOOGLE_PLACES_API_KEY,
    },
  });

  const { status, results } = response.data;
  if (status !== 'OK' && status !== 'ZERO_RESULTS') {
    throw new Error(`Google Places API error: ${status}`);
  }
  return results || [];
}

export async function getPlaceDetails(placeId) {
  const response = await axios.get(`${BASE}/details/json`, {
    params: {
      place_id: placeId,
      fields: 'name,rating,editorial_summary,types,formatted_address',
      key: GOOGLE_PLACES_API_KEY,
    },
  });
  return response.data.result || null;
}

// Haversine formula — returns distance in meters between two lat/lng points
export function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
