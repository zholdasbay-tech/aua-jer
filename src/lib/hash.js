// Every view has a shareable URL: #lat,lon/track-frame-dir/dayA/dayB/mode
export function writeHash(s) {
  if (!s.scenes.length || !s.scenes[s.a] || !s.scenes[s.b]) return;
  const h = '#' + s.lat.toFixed(3) + ',' + s.lon.toFixed(3) + '/' + s.stackKey + '/' + s.scenes[s.a].day + '/' + s.scenes[s.b].day + '/' + s.mode;
  try { history.replaceState(null, '', h); } catch { /* ignore */ }
}
export function readHash() {
  const m = (location.hash || '').match(/^#(-?[\d.]+),(-?[\d.]+)\/([^/]+)\/(\d{4}-\d\d-\d\d)\/(\d{4}-\d\d-\d\d)\/(single|swipe|blink|change)$/);
  if (!m) return null;
  return { lat: +m[1], lon: +m[2], key: m[3], a: m[4], b: m[5], mode: m[6] };
}
