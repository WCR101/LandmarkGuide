import axios from 'axios';
import { GOOGLE_PLACES_API_KEY } from '../config';
import { getDistance } from './placesService';

// Decodes Google's encoded polyline format into [{lat, lng}] array
function decodePolyline(encoded) {
  const points = [];
  let index = 0, lat = 0, lng = 0;
  while (index < encoded.length) {
    let b, shift = 0, result = 0;
    do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;
    shift = 0; result = 0;
    do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lng += result & 1 ? ~(result >> 1) : result >> 1;
    points.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }
  return points;
}

// Pick one point every intervalMeters, tracking cumulative distance
function samplePoints(points, intervalMeters = 700) {
  let accumulated = 0, totalDist = 0;
  const sampled = [{ ...points[0], distFromStart: 0 }];
  for (let i = 1; i < points.length; i++) {
    const d = getDistance(points[i - 1].lat, points[i - 1].lng, points[i].lat, points[i].lng);
    accumulated += d;
    totalDist += d;
    if (accumulated >= intervalMeters) {
      sampled.push({ ...points[i], distFromStart: totalDist });
      accumulated = 0;
    }
  }
  // Always include the final point
  const last = points[points.length - 1];
  sampled.push({ ...last, distFromStart: totalDist });
  return sampled;
}

export async function fetchRouteSummary(originCoords, destinationText) {
  // Step 1 — get the driving route
  const dirRes = await axios.get('https://maps.googleapis.com/maps/api/directions/json', {
    params: {
      origin: `${originCoords.latitude},${originCoords.longitude}`,
      destination: destinationText,
      key: GOOGLE_PLACES_API_KEY,
    },
  });

  if (dirRes.data.status !== 'OK') {
    const msg = dirRes.data.status === 'NOT_FOUND' || dirRes.data.status === 'ZERO_RESULTS'
      ? `No route found to "${destinationText}". Try a more specific address.`
      : `Directions error: ${dirRes.data.status}`;
    throw new Error(msg);
  }

  const leg = dirRes.data.routes[0].legs[0];
  const points = decodePolyline(dirRes.data.routes[0].overview_polyline.points);
  const sampled = samplePoints(points, 700);

  // Step 2 — query Places near each sampled point, deduplicating by place_id
  const seen = new Set();
  const landmarks = [];

  await Promise.all(
    sampled.map(async (pt) => {
      try {
        const plRes = await axios.get('https://maps.googleapis.com/maps/api/place/nearbysearch/json', {
          params: {
            location: `${pt.lat},${pt.lng}`,
            radius: 400,
            type: 'tourist_attraction',
            key: GOOGLE_PLACES_API_KEY,
          },
        });
        for (const place of plRes.data.results || []) {
          if (!seen.has(place.place_id)) {
            seen.add(place.place_id);
            landmarks.push({ ...place, distFromStart: pt.distFromStart });
          }
        }
      } catch { /* skip individual failed sub-requests */ }
    }),
  );

  return {
    landmarks: landmarks.sort((a, b) => a.distFromStart - b.distFromStart),
    totalDistance: leg.distance.text,
    totalDuration: leg.duration.text,
    originAddress: leg.start_address,
    destinationAddress: leg.end_address,
  };
}
