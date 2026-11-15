import { useRef, useState } from 'react';
import { useStore } from '../../store/useStore';
import { fmtDay, fmtShort } from '../../lib/format';
import s from './Panel.module.css';

// Passes on a time axis. Click a dot to set B, shift-click to set A, or drag the A and B handles.
export default function Timeline() {
  const scenes = useStore((x) => x.scenes), a = useStore((x) => x.a), b = useStore((x) => x.b), mode = useStore((x) => x.mode);
  useStore((x) => x.loadedTick);
  const setAB = useStore((x) => x.setAB);
  const ref = useRef(null);
  const [drag, setDrag] = useState(null);   // { which: 'a' | 'b', idx }
  const [tip, setTip] = useState(null);     // { idx }
  const n = scenes.length;
  if (!n) return null;

  const t0 = Date.parse(scenes[0].time), t1 = Date.parse(scenes[n - 1].time), span = Math.max(1, t1 - t0);
  const xOf = (i) => (n === 1 ? 50 : ((Date.parse(scenes[i].time) - t0) / span) * 100);
  const nearest = (clientX) => {
    const r = ref.current.getBoundingClientRect(), p = ((clientX - r.left) / r.width) * 100;
    let best = 0, bd = 1e9;
    for (let i = 0; i < n; i++) { const d = Math.abs(xOf(i) - p); if (d < bd) { bd = d; best = i; } }
    return best;
  };
  const down = (which) => (e) => {
    e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId);
    const idx = which === 'a' ? a : b;
    setDrag({ which, idx }); setTip({ idx });
  };
  const move = (e) => {
    if (!drag) return;
    const idx = nearest(e.clientX);
    if (idx !== drag.idx) { setDrag({ ...drag, idx }); setTip({ idx }); }
  };
  const up = (e) => {
    if (!drag) return;
    const idx = nearest(e.clientX);
    if (drag.which === 'a') setAB(idx, b); else setAB(a, idx);
    setDrag(null); setTip(null);
  };
  const showA = mode !== 'single';
  const ai = drag && drag.which === 'a' ? drag.idx : a, bi = drag && drag.which === 'b' ? drag.idx : b;
  const tipSc = tip ? scenes[tip.idx] : null;

  return (
    <>
      <div className={s.tl} ref={ref} aria-label="Timeline of passes">
        <div className={s.tlTrack} />
        {showA && n > 1 && <div className={s.tlRange} style={{ left: Math.min(xOf(ai), xOf(bi)) + '%', width: Math.abs(xOf(bi) - xOf(ai)) + '%' }} />}
        {scenes.map((sc, i) => (
          <button key={sc.name} type="button" className={s.tlDot + (sc.ready ? ' ' + s.ok : '') + (sc.failed ? ' ' + s.failed : '')} style={{ left: xOf(i) + '%' }}
            aria-label={'Pass of ' + fmtDay(sc.time) + '. Click sets After, shift-click sets Before.'}
            onMouseEnter={() => !drag && setTip({ idx: i })} onMouseLeave={() => !drag && setTip(null)}
            onFocus={() => setTip({ idx: i })} onBlur={() => setTip(null)}
            onClick={(e) => (e.shiftKey ? setAB(i, b) : setAB(a, i))} />
        ))}
        {showA && (
          <button type="button" className={s.tlHandle + ' ' + s.a + (drag && drag.which === 'a' ? ' ' + s.drag : '')} style={{ left: xOf(ai) + '%' }} aria-label={'Before (A): ' + fmtDay(scenes[ai].time) + '. Drag to change.'}
            onPointerDown={down('a')} onPointerMove={move} onPointerUp={up} onPointerCancel={() => { setDrag(null); setTip(null); }}>A</button>
        )}
        <button type="button" className={s.tlHandle + ' ' + s.b + (drag && drag.which === 'b' ? ' ' + s.drag : '')} style={{ left: xOf(bi) + '%' }} aria-label={'After (B): ' + fmtDay(scenes[bi].time) + '. Drag to change.'}
          onPointerDown={down('b')} onPointerMove={move} onPointerUp={up} onPointerCancel={() => { setDrag(null); setTip(null); }}>B</button>
        <span className={s.tlLab} style={{ left: 0 }}>{fmtShort(scenes[0].time)}</span>
        {n > 1 && <span className={s.tlLab} style={{ left: '100%', transform: 'translateX(-100%)' }}>{fmtShort(scenes[n - 1].time)}</span>}
        {tipSc && (
          <div className={s.tlTip} style={{ left: Math.max(16, Math.min(84, xOf(tip.idx))) + '%' }} role="tooltip">
            <b>{fmtDay(tipSc.time)}</b>
            {tipSc.thumb ? <img src={tipSc.thumb} alt="" /> : null}
            <small>{tipSc.failed ? 'Failed to load' : tipSc.ready ? 'Loaded' : 'Loading…'}{drag ? ' · release to set ' + (drag.which === 'a' ? 'Before' : 'After') : ''}</small>
          </div>
        )}
      </div>
      <p className={s.tlHint}>Drag the A and B handles, or click a dot to set After and shift-click to set Before.</p>
    </>
  );
}
