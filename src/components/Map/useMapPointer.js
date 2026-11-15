// Pan, pinch, wheel zoom, click to ask, hover readout, right-click and long-press menus.
import { useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { ilon, ilat, mx, my } from '../../lib/geo';
import { readPixel } from '../../lib/scene';
import { changeAt } from '../../lib/change';

function readout(S, lon, lat, px) {
  const g = S.grid;
  if (!g || !S.scenes.length) return { lon, lat, inside: false };
  const i = Math.floor(((mx(lon) - g.x0) / (g.x1 - g.x0)) * g.W), j = Math.floor(((my(lat) - g.y0) / (g.y1 - g.y0)) * g.H);
  if (i < 0 || j < 0 || i >= g.W || j >= g.H) return { lon, lat, inside: false };
  const A = S.scenes[S.a], B = S.scenes[S.b];
  const onA = S.mode === 'swipe' ? px < S.swipe * S.vp.w : S.mode === 'blink' ? !S.blinkPhase : false;
  return {
    lon, lat, inside: true, onA,
    a: S.mode === 'single' ? null : readPixel(A, i, j),
    b: readPixel(B, i, j),
    d: S.mode === 'change' && S.change ? changeAt(S.change, g, i, j) : undefined   // undefined: not in change view; null: no overlap
  };
}

export function useMapPointer(canvasRef, rendRef) {
  useEffect(() => {
    const cv = canvasRef.current, R = rendRef.current;
    if (!cv || !R) return undefined;
    const ptrs = {};
    let moved = 0, pinch = 0, wheelT = 0, pressT = 0, hoverRaf = 0, last = null;
    const S = () => useStore.getState();
    const toLonLat = (px, py) => {
      const { view, vp } = S(), W = 256 * 2 ** view.z;
      return { lon: ilon(view.cx + (px - vp.w / 2) / W), lat: ilat(view.cy + (py - vp.h / 2) / W) };
    };
    const openMenuAt = (px, py) => { const { lon, lat } = toLonLat(px, py); S().openMenu({ x: px, y: py, lon, lat }); };
    const hover = (px, py) => {
      last = { px, py };
      if (hoverRaf) return;
      hoverRaf = requestAnimationFrame(() => {
        hoverRaf = 0;
        const st = S(), { lon, lat } = toLonLat(last.px, last.py);
        st.setCursor(readout(st, lon, lat, last.px));
      });
    };

    const onDown = (e) => {
      S().closeMenu();
      if (e.button !== 0 && e.pointerType !== 'touch') return;
      cv.setPointerCapture(e.pointerId);
      ptrs[e.pointerId] = { x: e.offsetX, y: e.offsetY };
      moved = 0; pinch = 0; R.setDragging(true);
      clearTimeout(pressT);
      if (e.pointerType === 'touch') pressT = setTimeout(() => { if (moved < 8 && ptrs[e.pointerId] && Object.keys(ptrs).length === 1) openMenuAt(e.offsetX, e.offsetY); }, 550);
    };
    const onMove = (e) => {
      const p = ptrs[e.pointerId];
      if (!p) { if (e.pointerType !== 'touch') hover(e.offsetX, e.offsetY); return; }
      const ids = Object.keys(ptrs);
      if (ids.length === 1) {
        const dx = e.offsetX - p.x, dy = e.offsetY - p.y;
        moved += Math.abs(dx) + Math.abs(dy);
        if (moved > 4) { cv.style.cursor = 'grabbing'; S().closeMenu(); }
        S().panBy(dx, dy);
        p.x = e.offsetX; p.y = e.offsetY;
      } else if (ids.length === 2) {
        p.x = e.offsetX; p.y = e.offsetY;
        const a = ptrs[ids[0]], b = ptrs[ids[1]], dist = Math.hypot(a.x - b.x, a.y - b.y);
        if (pinch) S().zoomAt((a.x + b.x) / 2, (a.y + b.y) / 2, Math.log2(dist / pinch));
        pinch = dist; moved = 99;
      }
    };
    const onUp = (e) => {
      const p = ptrs[e.pointerId];
      delete ptrs[e.pointerId];
      clearTimeout(pressT);
      cv.style.cursor = '';
      R.setDragging(Object.keys(ptrs).length > 0);
      if (p && moved < 5 && e.type === 'pointerup' && !S().menu) {
        const { lon, lat } = toLonLat(e.offsetX, e.offsetY);
        S().inspect(lon, lat);
      }
    };
    const onLeave = () => { S().setCursor(null); };
    const onWheel = (e) => {
      e.preventDefault();
      R.setDragging(true); clearTimeout(wheelT); wheelT = setTimeout(() => R.setDragging(false), 180);
      S().zoomAt(e.offsetX, e.offsetY, Math.max(-0.6, Math.min(0.6, -e.deltaY * 0.0022)));
    };
    const onDbl = (e) => S().zoomAt(e.offsetX, e.offsetY, 1);
    const onCtx = (e) => { e.preventDefault(); openMenuAt(e.offsetX, e.offsetY); };

    cv.addEventListener('pointerdown', onDown);
    cv.addEventListener('pointermove', onMove);
    cv.addEventListener('pointerup', onUp);
    cv.addEventListener('pointercancel', onUp);
    cv.addEventListener('pointerleave', onLeave);
    cv.addEventListener('wheel', onWheel, { passive: false });
    cv.addEventListener('dblclick', onDbl);
    cv.addEventListener('contextmenu', onCtx);
    return () => {
      cancelAnimationFrame(hoverRaf); clearTimeout(pressT); clearTimeout(wheelT);
      cv.removeEventListener('pointerdown', onDown);
      cv.removeEventListener('pointermove', onMove);
      cv.removeEventListener('pointerup', onUp);
      cv.removeEventListener('pointercancel', onUp);
      cv.removeEventListener('pointerleave', onLeave);
      cv.removeEventListener('wheel', onWheel);
      cv.removeEventListener('dblclick', onDbl);
      cv.removeEventListener('contextmenu', onCtx);
    };
  }, [canvasRef, rendRef]);
}
