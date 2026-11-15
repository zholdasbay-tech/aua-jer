// NISAR search through the ASF Search API, grouped into stacks that share one track, frame and direction.
import { ASF, GRID_W } from './constants';
import { mx, my } from './geo';

export async function searchStacks(lon, lat) {
  const u = ASF + '?dataset=NISAR&processingLevel=GCOV&intersectsWith=POINT(' + lon.toFixed(4) + '%20' + lat.toFixed(4) +
    ')&start=2025-08-01&maxResults=250&output=jsonlite';
  const r = await fetch(u);
  if (!r.ok) throw new Error('ASF search answered HTTP ' + r.status);
  const j = await r.json();
  const res = Array.isArray(j) ? j : j.results || [];
  const groups = {};
  res.forEach((g) => {
    const png = (g.browse || []).filter((x) => /_LATLON\.png$/.test(x))[0];
    if (!png || !g.startTime) return;
    const add = (g.nisar && g.nisar.additionalUrls) || [];
    const kml = add.filter((x) => /_LATLON\.kml$/.test(x))[0] || null;
    const key = g.path + '-' + g.frame + '-' + g.flightDirection, day = g.startTime.slice(0, 10);
    const col = g.collectionName || '', rank = /BETA/.test(col) ? 0 : /PROVISIONAL/.test(col) ? 1 : 2;
    const pol = (g.nisar && g.nisar.mainBandPolarization) || [];
    const sc = { name: g.granuleName, time: g.startTime, day, png, kml, wkt: g.wkt || '', rank, col, h5: g.downloadUrl, pol: pol.join ? pol.join('+') : String(pol) };
    if (!groups[key]) groups[key] = { key, path: g.path, frame: g.frame, dir: g.flightDirection, byDay: {} };
    const old = groups[key].byDay[day];
    if (!old || old.rank < sc.rank) groups[key].byDay[day] = sc;   // keep the best processing version per day
  });
  return Object.keys(groups).map((k) => {
    const G = groups[k];
    let sc = Object.values(G.byDay).sort((a, b) => (a.time < b.time ? -1 : 1));
    const dual = sc.filter((x) => /HV|VH/.test(x.pol));
    let skipped = 0;
    if (dual.length && dual.length < sc.length) { skipped = sc.length - dual.length; sc = dual; }   // one polarisation set per stack
    return { key: G.key, path: G.path, frame: G.frame, dir: G.dir, scenes: sc, skipped };
  }).sort((a, b) => b.scenes.length - a.scenes.length);
}

export function wktBox(wkt) {
  const m = wkt.match(/-?\d+(\.\d+)?/g) || [], lons = [], lats = [];
  for (let i = 0; i + 1 < m.length; i += 2) { lons.push(+m[i]); lats.push(+m[i + 1]); }
  if (!lons.length) return null;
  return { w: Math.min(...lons), e: Math.max(...lons), s: Math.min(...lats), n: Math.max(...lats) };
}

// The KML sidecar holds the exact image frame. Without it the WKT footprint is used and marked approximate.
export async function sceneBounds(sc) {
  const rough = () => { const b = wktBox(sc.wkt); if (b) b.approx = true; return b; };
  if (!sc.kml) return rough();
  try {
    const t = await (await fetch(sc.kml)).text();
    const m = t.match(/<coordinates>([^<]+)<\/coordinates>/);
    return m ? wktBox(m[1].replace(/,/g, ' ')) : rough();
  } catch { return rough(); }
}

export function makeGrid(scenes) {
  let w = 180, e = -180, s = 90, n = -90;
  scenes.forEach((sc) => { w = Math.min(w, sc.b.w); e = Math.max(e, sc.b.e); s = Math.min(s, sc.b.s); n = Math.max(n, sc.b.n); });
  const x0 = mx(w), x1 = mx(e), y0 = my(n), y1 = my(s);
  let W = GRID_W, H = Math.max(2, Math.round((W * (y1 - y0)) / (x1 - x0)));
  if (H > 2200) { W = Math.round((W * 2200) / H); H = 2200; }
  return { w, e, s, n, x0, x1, y0, y1, W, H };
}
