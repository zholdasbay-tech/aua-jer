// Web Mercator helpers. World coordinates run 0..1 across the whole map.
import { CITIES } from './constants';

export const mx = (lon) => (lon + 180) / 360;
export function my(lat) {
  const s = Math.sin((lat * Math.PI) / 180);
  return 0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI);
}
export const ilon = (x) => x * 360 - 180;
export const ilat = (y) => (Math.atan(Math.sinh(Math.PI * (1 - 2 * y))) * 180) / Math.PI;

export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

export function formatLatLon(lat, lon, digits = 3) {
  return (
    Math.abs(lat).toFixed(digits) + '°' + (lat < 0 ? 'S' : 'N') + '  ' +
    Math.abs(lon).toFixed(digits) + '°' + (lon < 0 ? 'W' : 'E')
  );
}

export function isValidLatLon(lat, lon) {
  return Number.isFinite(lat) && Number.isFinite(lon) && lat >= -85 && lat <= 85 && lon >= -180 && lon <= 180;
}

// Great-circle distance in km.
export function distanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371, d = Math.PI / 180;
  const a = Math.sin(((lat2 - lat1) * d) / 2) ** 2 +
    Math.cos(lat1 * d) * Math.cos(lat2 * d) * Math.sin(((lon2 - lon1) * d) / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export function compassFrom(lat1, lon1, lat2, lon2) {
  const d = Math.PI / 180;
  const y = Math.sin((lon2 - lon1) * d) * Math.cos(lat2 * d);
  const x = Math.cos(lat1 * d) * Math.sin(lat2 * d) - Math.sin(lat1 * d) * Math.cos(lat2 * d) * Math.cos((lon2 - lon1) * d);
  const brg = ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
  return ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.round(brg / 45) % 8];
}

// "28 km NE of Astana", or null when no known city is close enough.
export function nearCity(lat, lon, maxKm = 160) {
  let best = null;
  for (const [name, clat, clon] of CITIES) {
    const km = distanceKm(clat, clon, lat, lon);
    if (km < maxKm && (!best || km < best.km)) best = { name, km, dir: compassFrom(clat, clon, lat, lon) };
  }
  if (!best) return null;
  if (best.km < 4) return 'in ' + best.name;
  return Math.round(best.km) + ' km ' + best.dir + ' of ' + best.name;
}

export function parseLatLon(text) {
  const m = String(text || '').match(/-?\d+(\.\d+)?/g);
  if (!m || m.length < 2) return null;
  const lat = +m[0], lon = +m[1];
  return isValidLatLon(lat, lon) ? { lat, lon } : null;
}

// Metres per screen pixel at a given latitude and zoom.
export function metresPerPixel(lat, z) {
  return (40075016.686 * Math.cos((lat * Math.PI) / 180)) / (256 * 2 ** z);
}
