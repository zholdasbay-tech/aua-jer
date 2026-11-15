// Load one NISAR browse image and resample it onto the common Mercator grid.
import { ilon, ilat } from './geo';

export function loadImage(url) {
  return new Promise((res, rej) => {
    const im = new Image();
    im.crossOrigin = 'anonymous';
    im.onload = () => res(im);
    im.onerror = () => rej(new Error('Could not load the radar image'));
    im.src = url;
  });
}

// Returns {canvas, cx, med, b, thumb}. Pure: the caller decides whether to attach the result to the scene.
export async function resampleScene(sc, g) {
  const im = await loadImage(sc.png);
  const sw = im.naturalWidth, sh = im.naturalHeight;
  const src = document.createElement('canvas');
  src.width = sw; src.height = sh;
  const sx = src.getContext('2d', { willReadFrequently: true });
  sx.drawImage(im, 0, 0);
  const sd = sx.getImageData(0, 0, sw, sh).data;
  const out = new ImageData(g.W, g.H), od = out.data;
  let b = sc.b;
  const col = new Int32Array(g.W), row = new Int32Array(g.H), hH = new Uint32Array(256), hV = new Uint32Array(256);
  let cnt = 0, i, j, c, r;

  if (b.approx) {
    // No KML: the footprint polygon covers only the opaque part of the image, so stretch it to the full frame.
    let bx0 = sw, bx1 = 0, by0 = sh, by1 = 0;
    for (j = 0; j < sh; j++) for (i = 0; i < sw; i++) {
      if (sd[(j * sw + i) * 4 + 3] > 127) { if (i < bx0) bx0 = i; if (i > bx1) bx1 = i; if (j < by0) by0 = j; if (j > by1) by1 = j; }
    }
    if (bx1 > bx0 && by1 > by0) {
      const dx = (b.e - b.w) / (bx1 - bx0 + 1), dy = (b.n - b.s) / (by1 - by0 + 1);
      b = { w: b.w - bx0 * dx, e: b.e + (sw - 1 - bx1) * dx, n: b.n + by0 * dy, s: b.s - (sh - 1 - by1) * dy, approx: true };
    }
  }
  for (i = 0; i < g.W; i++) { c = Math.floor(((ilon(g.x0 + ((i + 0.5) / g.W) * (g.x1 - g.x0)) - b.w) / (b.e - b.w)) * sw); col[i] = c >= 0 && c < sw ? c : -1; }
  for (j = 0; j < g.H; j++) { r = Math.floor(((b.n - ilat(g.y0 + ((j + 0.5) / g.H) * (g.y1 - g.y0))) / (b.n - b.s)) * sh); row[j] = r >= 0 && r < sh ? r : -1; }
  for (j = 0; j < g.H; j++) {
    r = row[j]; if (r < 0) continue;
    const ro = r * sw * 4, oo = j * g.W * 4;
    for (i = 0; i < g.W; i++) {
      c = col[i]; if (c < 0) continue;
      const p = ro + c * 4, o = oo + i * 4;
      if (sd[p + 3] < 128 || sd[p] + sd[p + 1] + sd[p + 2] < 6) continue;   // transparent or no-data
      od[o] = sd[p]; od[o + 1] = sd[p + 1]; od[o + 2] = sd[p + 2]; od[o + 3] = 255;
      hH[sd[p]]++; hV[sd[p + 1]]++; cnt++;
    }
  }
  // Browse images are scaled for display one by one, so point readings are taken against the scene median.
  let mh = 0, mv = 0, ah = 0, av = 0, fh = false, fv = false;
  for (let v = 0; v < 256; v++) {
    ah += hH[v]; av += hV[v];
    if (!fh && ah >= cnt / 2) { mh = v; fh = true; }
    if (!fv && av >= cnt / 2) { mv = v; fv = true; }
  }
  const canvas = document.createElement('canvas');
  canvas.width = g.W; canvas.height = g.H;
  const cx = canvas.getContext('2d', { willReadFrequently: true });
  cx.putImageData(out, 0, 0);
  return { canvas, cx, med: { hh: mh, hv: mv }, b, thumb: makeThumb(canvas, 120) };
}

function makeThumb(canvas, w) {
  const t = document.createElement('canvas');
  const h = Math.max(1, Math.round((canvas.height / canvas.width) * w));
  t.width = w; t.height = h;
  const x = t.getContext('2d');
  x.fillStyle = '#000'; x.fillRect(0, 0, w, h);
  x.drawImage(canvas, 0, 0, w, h);
  try { return t.toDataURL('image/jpeg', 0.7); } catch { return null; }
}

// Mean of a 5x5 window around a grid pixel, relative to the scene median. null where there is no data.
export function samplePoint(sc, i, j) {
  if (!sc.ready) return undefined;
  const d = sc.cx.getImageData(i - 2, j - 2, 5, 5).data;
  let n = 0, hh = 0, hv = 0;
  for (let o = 0; o < d.length; o += 4) { if (d[o + 3] < 128) continue; hh += d[o]; hv += d[o + 1]; n++; }
  return n ? { hh: hh / n - sc.med.hh, hv: hv / n - sc.med.hv } : null;
}

// Raw browse values of one pixel. null outside the data.
export function readPixel(sc, i, j) {
  if (!sc || !sc.ready) return null;
  const d = sc.cx.getImageData(i, j, 1, 1).data;
  return d[3] < 128 ? null : { hh: d[0], hv: d[1] };
}
