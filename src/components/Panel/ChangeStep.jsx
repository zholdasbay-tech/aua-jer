import { useStore } from '../../store/useStore';
import { BANDS } from '../../lib/constants';
import { fmtDay, fmtShort, signed, num } from '../../lib/format';
import { formatLatLon, nearCity } from '../../lib/geo';
import { scrollToId } from '../../lib/dom';
import Icon from '../icons/Icon';
import Step from './Step';
import s from './Panel.module.css';

function Hotspots() {
  const hot = useStore((x) => x.hot), hoverHot = useStore((x) => x.hoverHot), setHoverHot = useStore((x) => x.setHoverHot);
  const flyTo = useStore((x) => x.flyTo), inspect = useStore((x) => x.inspect);
  if (!hot.length) return <p className="hint">No block of 8 km stands out at this sensitivity.</p>;
  const go = (c) => { flyTo(c.lat, c.lon, 9.3); inspect(c.lon, c.lat); setTimeout(() => scrollToId('step-point'), 50); };
  return (
    <>
      <h3 className={s.sub}>Biggest changes <span>8 km blocks · hover to find one on the map</span></h3>
      <ol className={s.hot} aria-label="Strongest change hotspots">
        {hot.map((c, k) => (
          <li key={k}>
            <button type="button" className={hoverHot === k ? s.on : ''} title="Fly there and read its history"
              onMouseEnter={() => setHoverHot(k)} onMouseLeave={() => setHoverHot(null)} onFocus={() => setHoverHot(k)} onBlur={() => setHoverHot(null)} onClick={() => go(c)}>
              <span className={s.n}>{k + 1}</span>
              <span className={c.m > 0 ? 'c-up' : 'c-down'}>{c.m > 0 ? 'Brighter' : 'Darker'} {signed(c.m)}</span>
              <span className={s.where}>{nearCity(c.lat, c.lon) || formatLatLon(c.lat, c.lon, 2)}</span>
              <Icon name="arrow" size={14} />
            </button>
          </li>
        ))}
      </ol>
    </>
  );
}

export default function ChangeStep() {
  const mode = useStore((x) => x.mode), setMode = useStore((x) => x.setMode);
  const scenes = useStore((x) => x.scenes), a = useStore((x) => x.a), b = useStore((x) => x.b);
  const band = useStore((x) => x.band), setBand = useStore((x) => x.setBand), thr = useStore((x) => x.thr), setThr = useStore((x) => x.setThr);
  const st = useStore((x) => x.changeStats);
  const A = scenes[a], B = scenes[b], isChange = mode === 'change';
  const status = !scenes.length ? 'todo' : isChange && st ? 'done' : isChange ? 'active' : 'todo';
  const aside = isChange && A && B && a !== b ? fmtShort(A.time) + ' → ' + fmtShort(B.time) : '';

  let body;
  if (!isChange) {
    body = (
      <div className={s.empty}>
        <div className={s.lead}><Icon name="change" /><span>Switch to the <b>Change</b> view to colour everything that got brighter or darker between A and B.</span></div>
        <button type="button" className="btn sm ice" onClick={() => setMode('change')} disabled={!scenes.length}>Show the change map</button>
      </div>
    );
  } else if (a === b) {
    body = <div className={s.empty}><div className={s.lead}><Icon name="info" /><span>Pick two different passes for A and B in step 2.</span></div></div>;
  } else {
    body = (
      <>
        <div className={s.ctl}>
          <label>
            <span className="label">Channel</span>
            <select className="select" value={band} onChange={(e) => setBand(e.target.value)}>{BANDS.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}</select>
            <p className="hint">{(BANDS.find((x) => x.id === band) || BANDS[0]).hint}</p>
          </label>
          <label>
            <span className={s.sliderHead}><span className="label">Sensitivity</span><output>±{thr} units</output></span>
            <input type="range" min="8" max="90" value={thr} onChange={(e) => setThr(+e.target.value)} aria-label="Flag changes larger than this many browse units" />
            <span className={s.ends}><span>Flag subtle changes</span><span>Only strong changes</span></span>
          </label>
        </div>
        {!st ? <p className="hint">Comparing the two passes pixel by pixel…</p> : (
          <>
            <div className={s.kpis}>
              <div className={s.kpi + ' ' + s.up}><b>{st.pu.toFixed(1)}%</b><small>got brighter<br />≈ {num(st.upA)} km²</small></div>
              <div className={s.kpi + ' ' + s.down}><b>{st.pd.toFixed(1)}%</b><small>got darker<br />≈ {num(st.downA)} km²</small></div>
            </div>
            <p className={s.stats}>
              Between <b>{fmtDay(A.time)}</b> and <b>{fmtDay(B.time)}</b>, {(st.pu + st.pd) < 1 ? 'almost nothing changed by more than' : (st.pu + st.pd).toFixed(0) + '% of the overlap changed by more than'} <b>{thr} units</b>.
              A scene-wide shift of <b>{signed(st.med)}</b> was removed first{st.sh.dx || st.sh.dy ? <>, and pass B was nudged by <b>{st.sh.dx}, {st.sh.dy} px</b> to line up</> : ''}.
            </p>
            <Hotspots />
          </>
        )}
      </>
    );
  }
  return <Step n="3" id="step-change" title="What changed" status={status} aside={aside}>{body}</Step>;
}
