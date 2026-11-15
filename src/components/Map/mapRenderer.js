// Canvas renderer for the map. It reads the store directly and redraws on request, outside React.
import { BASES, CITIES, BLOCK } from '../../lib/constants';
import { mx, my, ilat, metresPerPixel } from '../../lib/geo';

export function createRenderer(canvas, getState) {
  const ctx = canvas.getContext('2d');
  const tiles = {};
  let VW = 0, VH = 0, DPR = 1, dirty = false, dragging = false, raf = 0, dead = false;

  function tile(url) {
    let t = tiles[url];
    if (t) return t;
    t = tiles[url] = { ok: false, img: new Image() };
    t.img.crossOrigin = 'anonymous';
    t.img.onload = () => { t.ok = true; invalidate(); };
    t.img.src = url;
    return t;
  }
  function drawTiles(spec, view) {
    const z = view.z, tz = Math.max(0, Math.min(spec.max, Math.round(z))), n = 2 ** tz, ts = 256 * 2 ** (z - tz), W = 256 * 2 ** z;
    const left = view.cx * W - VW / 2, top = view.cy * W - VH / 2;
    const xa = Math.floor(left / ts), xb = Math.floor((left + VW) / ts), ya = Math.max(0, Math.floor(top / ts)), yb = Math.min(n - 1, Math.floor((top + VH) / ts));
    ctx.globalAlpha = spec.dim;
    for (let y = ya; y <= yb; y++) for (let x = xa; x <= xb; x++) {
      const xx = ((x % n) + n) % n, t = tile(spec.url.replace('{z}', tz).replace('{x}', xx).replace('{y}', y));
      if (!t.ok) continue;
      const px = Math.round(x * ts - left), py = Math.round(y * ts - top);
      ctx.drawImage(t.img, px, py, Math.round((x + 1) * ts - left) - px, Math.round((y + 1) * ts - top) - py);
    }
    ctx.globalAlpha = 1;
  }
  const scr = (view, lon, lat) => { const W = 256 * 2 ** view.z; return { x: (mx(lon) - view.cx) * W + VW / 2, y: (my(lat) - view.cy) * W + VH / 2 }; };
  const gridRect = (view, g) => { const W = 256 * 2 ** view.z; return { x: (g.x0 - view.cx) * W + VW / 2, y: (g.y0 - view.cy) * W + VH / 2, w: (g.x1 - g.x0) * W, h: (g.y1 - g.y0) * W }; };

  function draw() {
    dirty = false;
    if (dead) return;
    const S = getState(), view = S.view;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, VW, VH);
    ctx.imageSmoothingEnabled = true;
    drawTiles(BASES[S.base] || BASES.night, view);
    if (S.grid && S.scenes.length) {
      const r = gridRect(view, S.grid), A = S.scenes[S.a], B = S.scenes[S.b];
      ctx.imageSmoothingEnabled = r.w / S.grid.W < 3;
      ctx.globalAlpha = S.opa;
      if (!dragging && S.opa > 0.2) { ctx.shadowColor = 'rgba(90,160,255,.55)'; ctx.shadowBlur = 28; }
      const img = (sc) => { if (sc && sc.canvas) ctx.drawImage(sc.canvas, r.x, r.y, r.w, r.h); };
      if (S.mode === 'change') { if (S.change && S.change.canvas) ctx.drawImage(S.change.canvas, r.x, r.y, r.w, r.h); }
      else if (S.mode === 'swipe') {
        const sx = S.swipe * VW;
        if (A && A.canvas) { ctx.save(); ctx.beginPath(); ctx.rect(0, 0, sx, VH); ctx.clip(); img(A); ctx.restore(); }
        if (B && B.canvas) { ctx.save(); ctx.beginPath(); ctx.rect(sx, 0, VW - sx, VH); ctx.clip(); img(B); ctx.restore(); }
      } else if (S.mode === 'blink') img(S.blinkPhase ? B : A && A.canvas ? A : B);
      else img(B);
      ctx.shadowBlur = 0; ctx.globalAlpha = 1; ctx.imageSmoothingEnabled = true;
      if (S.mode === 'change' && S.change) drawHotspots(S, r);
    }
    if (S.labels) drawCities(view);
    if (S.pt) drawPoint(scr(view, S.pt.lon, S.pt.lat));
    drawScale(S);
  }

  function drawHotspots(S, r) {
    const bw = (BLOCK / S.grid.W) * r.w, bh = (BLOCK / S.grid.H) * r.h;
    ctx.font = '11px "JetBrains Mono",ui-monospace,Menlo,Consolas,monospace'; ctx.textBaseline = 'bottom'; ctx.textAlign = 'left';
    S.hot.forEach((c, k) => {
      const hot = S.hoverHot === k;
      const x0 = Math.round(r.x + c.X * bw) - 4.5, y0 = Math.round(r.y + c.Y * bh) - 4.5;
      const w = Math.max(10, Math.round(bw) + 9), h = Math.max(10, Math.round(bh) + 9), L = Math.max(5, Math.min(w, h) * 0.3);
      const col = c.m > 0 ? '#ffd08a' : '#a9d6ff', glow = c.m > 0 ? 'rgba(255,166,43,.9)' : 'rgba(74,168,255,.9)';
      if (hot) { ctx.fillStyle = c.m > 0 ? 'rgba(255,166,43,.22)' : 'rgba(74,168,255,.22)'; ctx.fillRect(x0, y0, w, h); }
      ctx.strokeStyle = col; ctx.lineWidth = hot ? 2.4 : 1.6; ctx.shadowColor = glow; ctx.shadowBlur = hot ? 16 : 8;
      ctx.beginPath();
      if (hot) ctx.rect(x0, y0, w, h);
      else {
        ctx.moveTo(x0, y0 + L); ctx.lineTo(x0, y0); ctx.lineTo(x0 + L, y0); ctx.moveTo(x0 + w - L, y0); ctx.lineTo(x0 + w, y0); ctx.lineTo(x0 + w, y0 + L);
        ctx.moveTo(x0 + w, y0 + h - L); ctx.lineTo(x0 + w, y0 + h); ctx.lineTo(x0 + w - L, y0 + h); ctx.moveTo(x0 + L, y0 + h); ctx.lineTo(x0, y0 + h); ctx.lineTo(x0, y0 + h - L);
      }
      ctx.stroke(); ctx.shadowBlur = 0;
      const t = String(k + 1), tw = ctx.measureText(t).width + 10;
      ctx.fillStyle = hot ? col : 'rgba(4,8,20,.85)'; ctx.fillRect(x0, y0 - 18, tw, 15);
      ctx.fillStyle = hot ? '#061020' : '#fff'; ctx.fillText(t, x0 + 5, y0 - 5);
    });
  }
  function drawCities(view) {
    ctx.font = '10.5px "JetBrains Mono",ui-monospace,Menlo,monospace'; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
    CITIES.forEach((c) => {
      const k = scr(view, c[2], c[1]);
      if (k.x < -80 || k.y < -20 || k.x > VW + 20 || k.y > VH + 20) return;
      ctx.fillStyle = '#000'; ctx.fillRect(k.x - 3, k.y - 3, 6, 6); ctx.fillStyle = '#fff'; ctx.fillRect(k.x - 2, k.y - 2, 4, 4);
      ctx.shadowColor = '#000'; ctx.shadowBlur = 4; ctx.fillText(c[0], k.x + 8, k.y + 0.5); ctx.fillText(c[0], k.x + 8, k.y + 0.5); ctx.shadowBlur = 0;
    });
  }
  function drawPoint(q) {
    const px = Math.round(q.x) + 0.5, py = Math.round(q.y) + 0.5;
    const gr = ctx.createRadialGradient(px, py, 0, px, py, 30);
    gr.addColorStop(0, 'rgba(124,196,255,.45)'); gr.addColorStop(1, 'rgba(124,196,255,0)');
    ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(px, py, 30, 0, 7); ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,.8)'; ctx.beginPath(); ctx.arc(px, py, 9, 0, 7); ctx.stroke();
    ctx.lineWidth = 1.5; ctx.strokeStyle = '#fff'; ctx.beginPath(); ctx.arc(px, py, 9, 0, 7);
    ctx.moveTo(px - 17, py); ctx.lineTo(px - 4, py); ctx.moveTo(px + 4, py); ctx.lineTo(px + 17, py); ctx.moveTo(px, py - 17); ctx.lineTo(px, py - 4); ctx.moveTo(px, py + 4); ctx.lineTo(px, py + 17); ctx.stroke();
  }
  function drawScale(S) {
    if (VW < 500) return;
    const lat = ilat(S.view.cy), mpp = metresPerPixel(lat, S.view.z), target = mpp * 110;
    const p = 10 ** Math.floor(Math.log10(target)), n = target / p, step = n >= 5 ? 5 : n >= 2 ? 2 : 1, m = step * p, px = m / mpp;
    const x = Math.round(VW - 24 - px) + 0.5, y = VH - 58.5 - (S.mode === 'change' ? 92 : 0), lbl = m >= 1000 ? m / 1000 + ' km' : m + ' m';
    const bar = () => { ctx.beginPath(); ctx.moveTo(x, y - 5); ctx.lineTo(x, y); ctx.lineTo(x + px, y); ctx.lineTo(x + px, y - 5); ctx.stroke(); };
    ctx.strokeStyle = 'rgba(0,0,0,.6)'; ctx.lineWidth = 3; bar();
    ctx.strokeStyle = '#dbe8ff'; ctx.lineWidth = 1.2; bar();
    ctx.font = '10.5px "JetBrains Mono",ui-monospace,monospace'; ctx.textAlign = 'right'; ctx.textBaseline = 'bottom'; ctx.fillStyle = '#dbe8ff'; ctx.shadowColor = '#000'; ctx.shadowBlur = 4;
    ctx.fillText(lbl, x + px, y - 8); ctx.textAlign = 'left'; ctx.fillText('N ↑', x, y - 8); ctx.shadowBlur = 0;
  }

  function invalidate() { if (dirty || dead) return; dirty = true; raf = requestAnimationFrame(draw); }
  function resize() {
    DPR = Math.min(2, window.devicePixelRatio || 1); VW = canvas.clientWidth; VH = canvas.clientHeight;
    canvas.width = Math.max(1, Math.round(VW * DPR)); canvas.height = Math.max(1, Math.round(VH * DPR));
    invalidate();
    return { w: VW, h: VH };
  }
  function setDragging(v) { if (dragging !== v) { dragging = v; invalidate(); } }
  function destroy() { dead = true; cancelAnimationFrame(raf); }
  function toBlob(cb) { canvas.toBlob(cb); }
  return { invalidate, resize, setDragging, destroy, toBlob };
}
