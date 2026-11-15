// Place names through OpenStreetMap Nominatim. Light use only: one request per search or click.
import { NOMINATIM } from './constants';

export async function searchPlace(q) {
  const u = NOMINATIM + '/search?format=jsonv2&limit=5&q=' + encodeURIComponent(q);
  const r = await fetch(u, { headers: { Accept: 'application/json' } });
  if (!r.ok) throw new Error('Place search answered HTTP ' + r.status);
  const j = await r.json();
  return (j || []).map((x) => ({ lat: +x.lat, lon: +x.lon, name: shortName(x.display_name), full: x.display_name, type: x.type }));
}

export async function reverseGeocode(lat, lon) {
  const u = NOMINATIM + '/reverse?format=jsonv2&zoom=10&lat=' + lat.toFixed(4) + '&lon=' + lon.toFixed(4);
  const r = await fetch(u, { headers: { Accept: 'application/json' } });
  if (!r.ok) return '';
  const j = await r.json();
  const a = j.address || {};
  const place = a.city || a.town || a.village || a.hamlet || a.municipality || a.county || a.district || '';
  const region = a.state || a.region || a.province || '';
  const country = a.country || '';
  return [place, region, country].filter(Boolean).filter((v, i, arr) => arr.indexOf(v) === i).slice(0, 2).join(', ');
}

function shortName(s) {
  const parts = String(s || '').split(',').map((x) => x.trim());
  return parts.length > 3 ? parts[0] + ', ' + parts[parts.length - 1] : parts.join(', ');
}
