// Per-pixel change between two passes on the common grid.
import { BLOCK } from './constants';
import { ilon, ilat } from './geo';

const NODATA = -32768;
const pixels = (sc, g) => sc.cx.getImageData(0, 0, g.W, g.H).data;
const bandVal = (d, o, band) => (band === 'hh' ? d[o] : band === 'hv' ? d[o + 1] : (d[o] + d[o + 1]) >> 1);

// Co-register B to A: try whole-pixel shifts up to 2 px and keep the one with the smallest mean HH difference.
function bestShift(a, b, g) {
  let best = 1e18, bx = 0, by = 0, zero = null;
  for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
    let s = 0, n = 0;
    for (let j = 4; j < g.H - 4; j += 7) for (let i = 4; i < g.W - 4; i += 7) {
      const o = (j * g.W + i) * 4, q = ((j + dy) * g.W + i + dx) * 4;
      if (a[o + 3] < 128 || b[q + 3] < 128) continue;
      s += Math.abs(b[q] - a[o]); n++;
    }
    if (n > 500) {
      if (dx === 0 && dy === 0) zero = s / n;
      if (s / n < best - 1e-9) { best = s / n; bx = dx; by = dy; }
    }
  }
  if (zero !== null && best > zero * 0.97) return { dx: 0, dy: 0 };   // keep passes as they are unless a shift clearly helps
  return { dx: bx, dy: by };
}

export function computeChange(A, B, g, band, key) {
  const n = g.W * g.H, diff = new Int16Array(n), bg = new Uint8Array(n), hist = new Uint32Array(511);
  const a = pixels(A, g), b = pixels(B, g), sh = bestShift(a, b, g);
  let valid = 0;
  for (let j = 0; j < g.H; j++) for (let i = 0; i < g.W; i++) {
    const p = j * g.W + i, o = p * 4;
    if (i + sh.dx < 0 || i + sh.dx >= g.W || j + sh.dy < 0 || j + sh.dy >= g.H) { diff[p] = NODATA; continue; }
    const q = ((j + sh.dy) * g.W + i + sh.dx) * 4;
    if (a[o + 3] < 128 || b[q + 3] < 128) { diff[p] = NODATA; continue; }
    const d = bandVal(b, q, band) - bandVal(a, o, band);
    diff[p] = d; bg[p] = (b[q] + b[q + 1]) >> 1; hist[d + 255]++; valid++;
  }
  let acc = 0, med = 0;
  for (let p = 0; p < 511; p++) { acc += hist[p]; if (acc >= valid / 2) { med = p - 255; break; } }
  return { diff, med, valid, bg, sh, key, canvas: null };
}

// The six strongest 8 km blocks, spaced apart so one big event does not fill the list.
export function findHotspots(ch, g) {
  const bx = Math.floor(g.W / BLOCK), by = Math.floor(g.H / BLOCK), list = [];
  for (let Y = 0; Y < by; Y++) for (let X = 0; X < bx; X++) {
    let sum = 0, n = 0;
    for (let j = Y * BLOCK; j < (Y + 1) * BLOCK; j += 2) for (let i = X * BLOCK; i < (X + 1) * BLOCK; i += 2) {
      const d = ch.diff[j * g.W + i]; if (d === NODATA) continue; sum += d - ch.med; n++;
    }
    if (n < ((BLOCK * BLOCK) / 4) * 0.7) continue;
    list.push({ X, Y, m: sum / n });
  }
  list.sort((p, q) => Math.abs(q.m) - Math.abs(p.m));
  const out = [];
  for (let i = 0; i < list.length && out.length < 6; i++) {
    const c = list[i];
    if (out.some((o) => Math.abs(o.X - c.X) <= 2 && Math.abs(o.Y - c.Y) <= 2)) continue;
    c.lon = ilon(g.x0 + (((c.X + 0.5) * BLOCK) / g.W) * (g.x1 - g.x0));
    c.lat = ilat(g.y0 + (((c.Y + 0.5) * BLOCK) / g.H) * (g.y1 - g.y0));
    out.push(c);
  }
  return out;
}

// Paint the change map for a threshold into ch.canvas and return the area statistics.
export function paintChange(ch, g, T) {
  const out = new ImageData(g.W, g.H), od = out.data;
  let up = 0, down = 0, upA = 0, downA = 0;
  const dlon = ((g.e - g.w) / g.W) * 111.32;
  for (let j = 0; j < g.H; j++) {
    const side = dlon * Math.cos((ilat(g.y0 + ((j + 0.5) / g.H) * (g.y1 - g.y0)) * Math.PI) / 180), cell = side * side;
    for (let i = 0; i < g.W; i++) {
      const p = j * g.W + i; let d = ch.diff[p]; if (d === NODATA) continue;
      const o = p * 4; d -= ch.med; const gray = 14 + 0.4 * ch.bg[p];
      if (d > T) { const t = Math.min(1, 0.5 + (d - T) / 60); od[o] = gray + (255 - gray) * t; od[o + 1] = gray + (166 - gray) * t; od[o + 2] = gray + (43 - gray) * t; up++; upA += cell; }
      else if (d < -T) { const t = Math.min(1, 0.5 + (-d - T) / 60); od[o] = gray + (74 - gray) * t; od[o + 1] = gray + (168 - gray) * t; od[o + 2] = gray + (255 - gray) * t; down++; downA += cell; }
      else { od[o] = gray; od[o + 1] = gray; od[o + 2] = gray; }
      od[o + 3] = 255;
    }
  }
  if (!ch.canvas) { ch.canvas = document.createElement('canvas'); ch.canvas.width = g.W; ch.canvas.height = g.H; }
  ch.canvas.getContext('2d').putImageData(out, 0, 0);
  return { thr: T, pu: (100 * up) / ch.valid, pd: (100 * down) / ch.valid, upA, downA, med: ch.med, sh: ch.sh, key: ch.key, tick: Date.now() };
}

// Change at one grid pixel relative to the scene-wide shift. null outside the overlap.
export function changeAt(ch, g, i, j) {
  if (!ch) return null;
  const d = ch.diff[j * g.W + i];
  return d === NODATA ? null : d - ch.med;
}
