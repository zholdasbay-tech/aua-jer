// Everything that floats over the map canvas: pass tags, swipe divider, tools, layer bar, legend, HUD, busy pill, context menu.
import { useEffect, useRef } from 'react';
import { useStore } from '../../store/useStore';
import { BASES } from '../../lib/constants';
import { fmtDay, signed } from '../../lib/format';
import { formatLatLon, ilat, ilon, nearCity } from '../../lib/geo';
import { copyText, downloadBlob } from '../../lib/download';
import Icon from '../icons/Icon';
import s from './Map.module.css';

export function Corners() {
  return <><i className={s.cn + ' ' + s.cnA} /><i className={s.cn + ' ' + s.cnB} /><i className={s.cn + ' ' + s.cnC} /><i className={s.cn + ' ' + s.cnD} /></>;
}

export function ProgressBar() {
  const scenes = useStore((x) => x.scenes);
  useStore((x) => x.loadedTick);
  const n = scenes.length, ok = scenes.filter((sc) => sc.ready || sc.failed).length;
  return <div className={s.prog} style={{ width: (n ? (100 * ok) / n : 0) + '%', opacity: n && ok === n ? 0 : 1 }} />;
}

export function PassTags() {
  const scenes = useStore((x) => x.scenes);
  const a = useStore((x) => x.a), b = useStore((x) => x.b), mode = useStore((x) => x.mode), phase = useStore((x) => x.blinkPhase);
  const A = scenes[a], B = scenes[b];
  if (!A || !B) return null;
  const g = s.tag + ' ' + s.glass;
  if (mode === 'single') return <div className={g + ' ' + s.tagB}><i className="dot b" />{fmtDay(B.time)}</div>;
  if (mode === 'change') return <div className={g + ' ' + s.tagA}><i className="dot a" />Change · {fmtDay(A.time)} <Icon name="arrow" size={13} /> {fmtDay(B.time)}</div>;
  if (mode === 'blink') {
    return <div className={g + ' ' + s.tagA + ' ' + s.tagBlink + (phase ? ' ' + s.phaseB : '')}><i className={'dot ' + (phase ? 'b' : 'a')} />{phase ? 'After (B) · ' + fmtDay(B.time) : 'Before (A) · ' + fmtDay(A.time)}</div>;
  }
  return (
    <>
      <div className={g + ' ' + s.tagA}><i className="dot a" />Before (A) · {fmtDay(A.time)}</div>
      <div className={g + ' ' + s.tagB}><i className="dot b" />After (B) · {fmtDay(B.time)}</div>
    </>
  );
}

export function SwipeHandle({ stageRef }) {
  const mode = useStore((x) => x.mode), swipe = useStore((x) => x.swipe), setSwipe = useStore((x) => x.setSwipe), n = useStore((x) => x.scenes.length);
  const on = useRef(false);
  if (mode !== 'swipe' || !n) return null;
  const move = (e) => { if (!on.current || !stageRef.current) return; const r = stageRef.current.getBoundingClientRect(); setSwipe((e.clientX - r.left) / r.width); };
  return (
    <div className={s.swipe} style={{ left: swipe * 100 + '%' }}>
      <button
        className={s.knob} aria-label="Drag to compare pass A and pass B" title="Drag to compare. Double-click to centre."
        onPointerDown={(e) => { on.current = true; e.currentTarget.setPointerCapture(e.pointerId); e.preventDefault(); }}
        onPointerMove={move} onPointerUp={() => { on.current = false; }} onPointerCancel={() => { on.current = false; }}
        onDoubleClick={() => setSwipe(0.5)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft') { setSwipe(swipe - 0.03); e.preventDefault(); e.stopPropagation(); }
          if (e.key === 'ArrowRight') { setSwipe(swipe + 0.03); e.preventDefault(); e.stopPropagation(); }
        }}>
        <Icon name="grip" />
      </button>
    </div>
  );
}

export function MapTools({ rendRef }) {
  const zoomBy = useStore((x) => x.zoomBy), fit = useStore((x) => x.fit), setBusy = useStore((x) => x.setBusy), hasGrid = useStore((x) => !!x.grid);
  const snap = () => {
    try { rendRef.current.toBlob((b) => { if (b) downloadBlob('aua-jer-map.png', b); }); }
    catch { setBusy('This browser blocked saving the map image.', 'err'); }
  };
  return (
    <div className={s.tools}>
      <button className="btn" aria-label="Zoom in" title="Zoom in  (+)" onClick={() => zoomBy(0.75)}><Icon name="plus" /></button>
      <button className="btn" aria-label="Zoom out" title="Zoom out  (−)" onClick={() => zoomBy(-0.75)}><Icon name="minus" /></button>
      <button className="btn" aria-label="Fit the radar footprint" title="Fit the radar footprint  (F)" onClick={() => fit()} disabled={!hasGrid}><Icon name="fit" /></button>
      <hr />
      <button className="btn" aria-label="Save the map as PNG" title="Save the map as PNG" onClick={snap}><Icon name="download" /></button>
    </div>
  );
}

export function LayerBar() {
  const base = useStore((x) => x.base), setBase = useStore((x) => x.setBase);
  const opa = useStore((x) => x.opa), setOpa = useStore((x) => x.setOpa);
  const labels = useStore((x) => x.labels), setLabels = useStore((x) => x.setLabels);
  return (
    <div className={s.layers + ' ' + s.glass}>
      <label>Base map
        <select className="select" value={base} onChange={(e) => setBase(e.target.value)} aria-label="Base map">
          {Object.entries(BASES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </label>
      <label className={s.opa}>Radar <input type="range" min="0" max="100" value={Math.round(opa * 100)} onChange={(e) => setOpa(e.target.value / 100)} aria-label="Radar layer opacity" title="Radar layer opacity" /></label>
      <label><input type="checkbox" checked={labels} onChange={(e) => setLabels(e.target.checked)} /> City names</label>
    </div>
  );
}

export function Legend() {
  const mode = useStore((x) => x.mode), thr = useStore((x) => x.thr), has = useStore((x) => !!x.changeStats);
  if (mode !== 'change' || !has) return null;
  return (
    <div className={s.legend + ' ' + s.glass}>
      <div className={s.lab}><span>Change from A to B</span><b>±{thr} units</b></div>
      <div className={s.bar} />
      <div className={s.lab}><span className="c-down">Darker</span><span>No change</span><span className="c-up">Brighter</span></div>
    </div>
  );
}

export function Hud() {
  const cursor = useStore((x) => x.cursor), view = useStore((x) => x.view), base = useStore((x) => x.base);
  const mode = useStore((x) => x.mode), thr = useStore((x) => x.thr);
  let left;
  if (!cursor) {
    left = <>Centre {formatLatLon(ilat(view.cy), ilon(view.cx))}<span className={s.sep}>·</span>zoom {view.z.toFixed(1)}</>;
  } else if (!cursor.inside) {
    left = <>{formatLatLon(cursor.lat, cursor.lon)}<span className={s.sep}>·</span>outside the radar footprint</>;
  } else {
    const v = (p) => (p ? <>HH <b>{p.hh}</b> HV <b>{p.hv}</b></> : 'no data');
    let body;
    if (mode === 'change' && cursor.d !== undefined) body = cursor.d === null ? 'no overlap between A and B here' : <>Change <b>{signed(cursor.d)}</b> {cursor.d > thr ? 'brighter' : cursor.d < -thr ? 'darker' : 'within noise'}<span className={s.sep}>·</span>after: {v(cursor.b)}</>;
    else if (mode === 'single') body = v(cursor.b);
    else body = <>Before {v(cursor.a)}<span className={s.sep}>→</span>After {v(cursor.b)}</>;
    left = <>{formatLatLon(cursor.lat, cursor.lon)}<span className={s.sep}>·</span>{body}</>;
  }
  return (
    <div className={s.hud}>
      <span>{left}</span>
      <span>{(BASES[base] || BASES.night).att} · Radar: NISAR (NASA/ISRO) via ASF DAAC</span>
    </div>
  );
}

export function BusyPill() {
  const busy = useStore((x) => x.busy);
  if (!busy) return null;
  return <div className={s.busy + (busy.kind === 'err' ? ' ' + s.err : busy.kind === 'ok' ? ' ' + s.ok : '')} role="status" aria-live="polite">{busy.msg}</div>;
}

export function ContextMenu() {
  const menu = useStore((x) => x.menu), close = useStore((x) => x.closeMenu), vp = useStore((x) => x.vp);
  const ref = useRef(null);
  useEffect(() => {
    if (!menu) return undefined;
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) close(); };
    window.addEventListener('pointerdown', onDown, true);
    return () => window.removeEventListener('pointerdown', onDown, true);
  }, [menu, close]);
  if (!menu) return null;
  const S = useStore.getState();
  const left = Math.min(menu.x, Math.max(0, vp.w - 250)), top = Math.min(menu.y, Math.max(0, vp.h - 230));
  const act = (fn) => () => { close(); fn(); };
  const near = nearCity(menu.lat, menu.lon);
  return (
    <div className={s.menu + ' ' + s.glass} ref={ref} style={{ left, top }} role="menu">
      <div className={s.menuHead}>{near || 'This spot'}<b>{formatLatLon(menu.lat, menu.lon, 4)}</b></div>
      <button role="menuitem" onClick={act(() => S.inspect(menu.lon, menu.lat))}><Icon name="target" />Ask about this spot</button>
      <button role="menuitem" onClick={act(() => S.goTo(menu.lat, menu.lon))}><Icon name="search" />Search passes here</button>
      <button role="menuitem" onClick={act(() => S.zoomAt(menu.x, menu.y, 1.5))}><Icon name="zoomin" />Zoom in here</button>
      <button role="menuitem" onClick={act(async () => { const ok = await copyText(menu.lat.toFixed(4) + ', ' + menu.lon.toFixed(4)); S.showToast(ok ? 'Coordinates copied' : 'Could not copy'); })}><Icon name="copy" />Copy coordinates</button>
    </div>
  );
}
