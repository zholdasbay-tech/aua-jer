// One store for the whole explorer. Heavy objects (scene canvases, change buffers) live inside it as
// mutable refs; a tick counter is bumped whenever one of them changes so subscribers can react.
import { create } from 'zustand';
import { PRESETS, PLAY_SPEEDS } from '../lib/constants';
import { mx, my, clamp, isValidLatLon, formatLatLon } from '../lib/geo';
import { fmtDay } from '../lib/format';
import { searchStacks, sceneBounds, makeGrid } from '../lib/asf';
import { resampleScene, samplePoint } from '../lib/scene';
import { computeChange, findHotspots, paintChange } from '../lib/change';
import { fetchPower } from '../lib/power';
import { reverseGeocode } from '../lib/geocode';
import { writeHash } from '../lib/hash';
import { loadPrefs, savePrefs } from '../lib/storage';

const prefs = loadPrefs();
let busyTimer = 0, toastTimer = 0, playTimer = 0, animRaf = 0;

export const useStore = create((set, get) => ({
  /* ---------- place ---------- */
  lat: PRESETS[0].lat, lon: PRESETS[0].lon, placeLabel: '', presetId: PRESETS[0].id,
  stacks: [], stackIndex: 0, stackKey: '', passesHere: null,
  scenes: [], grid: null, loadedTick: 0,
  want: null, token: 0,

  /* ---------- comparison ---------- */
  a: 0, b: 0, mode: 'swipe',
  thr: prefs.thr || 26, band: prefs.band || 'mix',
  change: null, changeStats: null, hot: [], hoverHot: null,

  /* ---------- layers ---------- */
  opa: 1, base: prefs.base || 'night', labels: prefs.labels !== false, swipe: 0.5,

  /* ---------- asked point ---------- */
  pt: null, ptLabel: '', series: [], wx: null,

  /* ---------- map view ---------- */
  view: { cx: mx(PRESETS[0].lon), cy: my(PRESETS[0].lat), z: 5 }, vp: { w: 0, h: 0 },
  cursor: null,

  /* ---------- ui ---------- */
  heroOpen: true, busy: null, toast: null, menu: null, shortcutsOpen: false, helpOpen: null,
  playing: false, playSpeed: prefs.playSpeed || 'normal', blinkPhase: 0,
  archive: 'connecting',

  /* ================= feedback ================= */
  setBusy(msg, kind) {
    clearTimeout(busyTimer);
    if (!msg) { set({ busy: null }); return; }
    set({ busy: { msg, kind: kind || 'load' } });
    if (kind === 'err' || kind === 'ok') busyTimer = setTimeout(() => set({ busy: null }), kind === 'err' ? 6000 : 2200);
  },
  showToast(msg) {
    clearTimeout(toastTimer);
    set({ toast: msg });
    toastTimer = setTimeout(() => set({ toast: null }), 2600);
  },
  setHero(open) { set({ heroOpen: open }); if (open) get().stopPlay(); },
  setShortcuts(open) { set({ shortcutsOpen: open }); },
  openHelp(id) { set({ helpOpen: id ? { id, at: Date.now() } : null }); },
  openMenu(menu) { set({ menu }); },
  closeMenu() { if (get().menu) set({ menu: null }); },
  setHoverHot(i) { if (get().hoverHot !== i) set({ hoverHot: i }); },
  setCursor(c) { set({ cursor: c }); },

  /* ================= place and stack ================= */
  async goTo(lat, lon, opts = {}) {
    const S = get();
    if (!isValidLatLon(lat, lon)) { S.setBusy('Type coordinates as: latitude, longitude', 'err'); return; }
    S.stopPlay();
    const token = S.token + 1;
    set({ lat, lon, token, placeLabel: opts.label || '', presetId: opts.presetId || '', want: opts.want || null, passesHere: null });
    S.setBusy('Searching the NISAR archive near ' + (opts.label || formatLatLon(lat, lon)));
    if (!opts.label) reverseGeocode(lat, lon).then((name) => { if (get().token === token && name) set({ placeLabel: name }); }).catch(() => {});
    try {
      const stacks = await searchStacks(lon, lat);
      if (get().token !== token) return;
      const total = stacks.reduce((n, s) => n + s.scenes.length, 0);
      set({ stacks, archive: 'online', passesHere: total });
      if (!stacks.length) {
        set({ scenes: [], grid: null, stackKey: '', change: null, changeStats: null, hot: [], pt: null, series: [], wx: null });
        get().flyTo(lat, lon, 6);
        S.setBusy('No public NISAR passes cover this point yet. Try another place.', 'err');
        return;
      }
      let idx = 0;
      const want = get().want;
      if (want) stacks.forEach((x, k) => { if (x.key === want.key) idx = k; });
      await get().useStack(idx);
    } catch (e) {
      if (get().token === token) { set({ archive: 'offline' }); S.setBusy('NISAR search failed: ' + e.message, 'err'); }
    }
  },

  async useStack(i) {
    const st = get().stacks[i];
    if (!st) return;
    get().stopPlay();
    const token = get().token + 1, want = get().want;
    set({ token, want: null, stackIndex: i, stackKey: st.key, scenes: [], grid: null, change: null, changeStats: null, hot: [], hoverHot: null, series: [], wx: null, pt: null, ptLabel: '' });
    get().setBusy('Reading the footprints of ' + st.scenes.length + ' passes');
    try {
      await Promise.all(st.scenes.map((sc) => (sc.b ? sc.b : sceneBounds(sc).then((b) => { sc.b = b; }))));
      if (get().token !== token) return;
      const scenes = st.scenes.filter((sc) => sc.b);
      if (!scenes.length) throw new Error('No usable footprint for this track');
      scenes.forEach((sc) => { sc.ready = false; sc.canvas = null; sc.cx = null; sc.loading = null; sc.failed = false; sc.thumb = null; });
      const grid = makeGrid(scenes);
      let a = 0, b = scenes.length - 1, mode = get().mode;
      if (want) { scenes.forEach((sc, k) => { if (sc.day === want.a) a = k; if (sc.day === want.b) b = k; }); mode = want.mode; }
      set({ scenes, grid, a, b, mode, loadedTick: get().loadedTick + 1 });
      get().fit(false);
      writeHash(get());
      await get().showPasses();
      if (get().token === token) get().preloadRest(token);
    } catch (e) {
      if (get().token === token) get().setBusy(e.message, 'err');
    }
  },

  loadScene(i) {
    const { scenes, grid } = get();
    const sc = scenes[i];
    if (!sc) return Promise.reject(new Error('No such pass'));
    if (sc.ready) return Promise.resolve(sc);
    if (sc.loading) return sc.loading;
    sc.loading = resampleScene(sc, grid).then((r) => {
      sc.loading = null;
      if (get().grid !== grid) return sc;   // the stack changed while this was loading
      Object.assign(sc, r, { ready: true });
      set((s) => ({ loadedTick: s.loadedTick + 1 }));
      return sc;
    }).catch((e) => {
      sc.loading = null; sc.failed = true;
      set((s) => ({ loadedTick: s.loadedTick + 1 }));
      throw e;
    });
    return sc.loading;
  },

  preloadRest(token) {
    let i = 0;
    const next = () => {
      const { scenes } = get();
      if (get().token !== token) return;
      while (i < scenes.length && (scenes[i].ready || scenes[i].failed)) i++;
      if (i >= scenes.length) return;
      get().loadScene(i).then(next, next);
    };
    next();
  },

  /* ================= passes and modes ================= */
  async showPasses() {
    const S = get(), token = S.token;
    if (!S.scenes.length) return;
    const need = S.mode === 'single' ? [S.b] : [...new Set([S.a, S.b])];
    S.setBusy('Loading ' + (need.length > 1 ? 'passes ' : 'pass ') + need.map((i) => fmtDay(S.scenes[i].time)).join(' and '));
    try {
      await Promise.all(need.map((i) => get().loadScene(i)));
      if (get().token !== token) return;
      if (get().mode === 'change') await get().ensureChange();
      if (get().token === token) get().setBusy(null);
    } catch (e) {
      if (get().token === token) get().setBusy(e.message, 'err');
    }
  },

  setMode(m) {
    get().stopPlay();
    if (get().mode !== m) set({ mode: m, cursor: null });
    writeHash(get());
    return get().showPasses();
  },

  setAB(a, b) {
    get().stopPlay();
    const S = get();
    if (a === S.a && b === S.b) return Promise.resolve();
    set({ a, b });
    if (S.mode !== 'change') set({ change: null, changeStats: null, hot: [], hoverHot: null });
    writeHash(get());
    return get().showPasses();
  },
  stepB(d) { const { a, b, scenes } = get(); if (scenes.length) get().setAB(a, clamp(b + d, 0, scenes.length - 1)); },
  stepA(d) { const { a, b, scenes } = get(); if (scenes.length) get().setAB(clamp(a + d, 0, scenes.length - 1), b); },

  async ensureChange() {
    const S = get();
    if (S.a === S.b) { set({ change: null, changeStats: null, hot: [], hoverHot: null }); return; }
    const key = S.a + '|' + S.b + '|' + S.band;
    if (S.change && S.change.key === key) { get().repaintChange(); return; }
    const token = S.token;
    await Promise.all([get().loadScene(S.a), get().loadScene(S.b)]);
    if (get().token !== token) return;
    get().setBusy('Comparing the two passes pixel by pixel');
    await new Promise((r) => setTimeout(r, 30));   // let the busy message paint before the heavy loop
    const { scenes, a, b, grid, band } = get();
    if (get().token !== token || a + '|' + b + '|' + band !== key) return;
    const change = computeChange(scenes[a], scenes[b], grid, band, key);
    const hot = findHotspots(change, grid);
    set({ change, hot, hoverHot: null });
    get().repaintChange();
  },
  repaintChange() {
    const { change, grid, thr } = get();
    if (!change) return;
    set({ changeStats: paintChange(change, grid, thr) });
  },

  setBand(band) { set({ band, change: null, changeStats: null, hot: [] }); savePrefs({ band }); if (get().mode === 'change') get().showPasses(); },
  setThr(thr) { set({ thr }); savePrefs({ thr }); if (get().mode === 'change' && get().change) get().repaintChange(); },
  setOpa(opa) { set({ opa }); },
  setBase(base) { set({ base }); savePrefs({ base }); },
  setLabels(labels) { set({ labels }); savePrefs({ labels }); },
  setSwipe(v) { set({ swipe: clamp(v, 0.03, 0.97) }); },

  /* ================= play through all passes ================= */
  togglePlay() {
    const S = get();
    if (S.playing) { S.stopPlay(); return; }
    if (S.scenes.length < 2) return;
    set({ mode: 'single', playing: true });
    writeHash(get());
    const step = async () => {
      const s = get();
      if (!s.playing) return;
      const nx = (s.b + 1) % s.scenes.length;
      try { await get().loadScene(nx); } catch { /* skip failed passes */ }
      if (!get().playing) return;
      set({ b: nx });
      writeHash(get());
      const sp = PLAY_SPEEDS.find((p) => p.id === get().playSpeed) || PLAY_SPEEDS[1];
      playTimer = setTimeout(step, sp.ms);
    };
    step();
  },
  stopPlay() { clearTimeout(playTimer); if (get().playing) set({ playing: false }); },
  setPlaySpeed(playSpeed) { set({ playSpeed }); savePrefs({ playSpeed }); },
  tickBlink() { set((s) => ({ blinkPhase: s.blinkPhase ? 0 : 1 })); },

  /* ================= map view ================= */
  setViewport(w, h) { const { vp } = get(); if (vp.w !== w || vp.h !== h) set({ vp: { w, h } }); },
  setView(view) { cancelAnimationFrame(animRaf); set({ view }); },
  panBy(dx, dy) {
    cancelAnimationFrame(animRaf);
    const { view } = get(), W = 256 * 2 ** view.z;
    set({ view: { z: view.z, cx: view.cx - dx / W, cy: clamp(view.cy - dy / W, 0.02, 0.98) } });
  },
  zoomAt(px, py, dz) {
    cancelAnimationFrame(animRaf);
    const { view, vp } = get(), z0 = view.z, z1 = clamp(z0 + dz, 2, 13);
    if (z1 === z0) return;
    const W0 = 256 * 2 ** z0, W1 = 256 * 2 ** z1;
    const wx = view.cx + (px - vp.w / 2) / W0, wy = view.cy + (py - vp.h / 2) / W0;
    set({ view: { z: z1, cx: wx - (px - vp.w / 2) / W1, cy: clamp(wy - (py - vp.h / 2) / W1, 0.02, 0.98) } });
  },
  zoomBy(dz) { const { vp } = get(); get().zoomAt(vp.w / 2, vp.h / 2, dz); },
  flyTo(lat, lon, z, animate = true) {
    const { view } = get();
    get().animateTo({ cx: mx(lon), cy: my(lat), z: z || view.z }, animate);
  },
  fit(animate = true) {
    const { grid: g, vp } = get();
    if (!g || !vp.w) return;
    const z = clamp(Math.log2(Math.min(vp.w / ((g.x1 - g.x0) * 256), vp.h / ((g.y1 - g.y0) * 256))) - 0.08, 2, 12);
    get().animateTo({ cx: (g.x0 + g.x1) / 2, cy: (g.y0 + g.y1) / 2, z }, animate);
  },
  animateTo(target, animate) {
    cancelAnimationFrame(animRaf);
    const still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!animate || still) { set({ view: target }); return; }
    const from = get().view, t0 = performance.now(), dur = 650;
    const frame = (now) => {
      const u = clamp((now - t0) / dur, 0, 1), e = u < 0.5 ? 2 * u * u : 1 - (-2 * u + 2) ** 2 / 2;
      set({ view: { cx: from.cx + (target.cx - from.cx) * e, cy: from.cy + (target.cy - from.cy) * e, z: from.z + (target.z - from.z) * e } });
      if (u < 1) animRaf = requestAnimationFrame(frame);
    };
    animRaf = requestAnimationFrame(frame);
  },

  /* ================= ask a point ================= */
  inspect(lon, lat) {
    const S = get(), g = S.grid;
    if (!g || !S.scenes.length) { S.setBusy('Search a place first, then click inside the radar image.', 'err'); return; }
    const i = Math.floor(((mx(lon) - g.x0) / (g.x1 - g.x0)) * g.W), j = Math.floor(((my(lat) - g.y0) / (g.y1 - g.y0)) * g.H);
    if (i < 0 || j < 0 || i >= g.W || j >= g.H) { S.setBusy('Click inside the radar footprint.', 'err'); return; }
    const token = S.token;
    const pt = { lon, lat, i, j, id: Date.now() };
    set({ pt, ptLabel: '', series: new Array(S.scenes.length).fill(undefined), wx: null });
    reverseGeocode(lat, lon).then((name) => { if (get().pt === pt && name) set({ ptLabel: name }); }).catch(() => {});
    S.scenes.forEach((sc, k) => {
      get().loadScene(k).then(() => {
        if (get().pt !== pt || get().token !== token) return;
        const series = get().series.slice();
        series[k] = samplePoint(sc, i, j);
        set({ series });
      }).catch(() => {});
    });
    const t0 = Date.parse(S.scenes[0].time) - 10 * 864e5;
    const t1 = Math.min(Date.now(), Date.parse(S.scenes[S.scenes.length - 1].time) + 864e5);
    fetchPower(lat, lon, t0, t1)
      .then((wx) => { if (get().pt === pt && get().token === token) set({ wx }); })
      .catch((e) => { if (get().pt === pt) set({ wx: { error: e.message } }); });
  },
  clearPoint() { if (get().pt) set({ pt: null, ptLabel: '', series: [], wx: null }); }
}));

// Debug handle, same as the original single-file app exposed.
if (typeof window !== 'undefined') window.AuaJer = useStore;
