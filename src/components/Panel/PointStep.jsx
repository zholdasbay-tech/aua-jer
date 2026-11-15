import { useMemo } from 'react';
import { useStore } from '../../store/useStore';
import { buildInsight } from '../../lib/insight';
import { formatLatLon, nearCity } from '../../lib/geo';
import { signed } from '../../lib/format';
import { rainBefore, tminOn } from '../../lib/weather';
import { copyText, downloadBlob } from '../../lib/download';
import Icon from '../icons/Icon';
import Step from './Step';
import PointChart from './PointChart';
import s from './Panel.module.css';

const tone = (v) => (v > 8 ? 'c-up' : v < -8 ? 'c-down' : '');
const arrow = (v) => (v > 8 ? ' ↑' : v < -8 ? ' ↓' : ' →');

export default function PointStep() {
  const pt = useStore((x) => x.pt), ptLabel = useStore((x) => x.ptLabel), clearPoint = useStore((x) => x.clearPoint), showToast = useStore((x) => x.showToast);
  const scenes = useStore((x) => x.scenes), a = useStore((x) => x.a), b = useStore((x) => x.b), series = useStore((x) => x.series), wx = useStore((x) => x.wx);
  const insight = useMemo(() => buildInsight({ scenes, a, b, series, wx }), [scenes, a, b, series, wx]);
  const status = pt ? 'done' : scenes.length ? 'active' : 'todo';

  const csv = () => {
    const rows = ['date_utc,granule,hh_minus_scene_median,hv_minus_scene_median,rain_3d_before_mm,night_min_c'];
    scenes.forEach((sc, k) => {
      const q = series[k], t = Date.parse(sc.time), r = rainBefore(wx, t, 3), m = tminOn(wx, t);
      rows.push([sc.time, sc.name, q ? q.hh.toFixed(1) : '', q ? q.hv.toFixed(1) : '', r === null ? '' : r.toFixed(2), m === null ? '' : m.toFixed(2)].join(','));
    });
    rows.push('# point,' + pt.lat.toFixed(4) + ',' + pt.lon.toFixed(4) + ',radar: NISAR GCOV browse via ASF DAAC,weather: NASA POWER');
    downloadBlob('aua-jer-point.csv', new Blob([rows.join('\n')], { type: 'text/csv' }));
  };
  const copy = async () => { const ok = await copyText(pt.lat.toFixed(4) + ', ' + pt.lon.toFixed(4)); showToast(ok ? 'Coordinates copied' : 'Could not copy'); };

  let body;
  if (!pt) {
    body = (
      <div className={s.empty}>
        <div className={s.lead}><Icon name="target" /><span>Click anywhere on the radar image. You get that spot's echo in every pass, with NASA POWER rain and temperature underneath, and a plain-language reading of what it means.</span></div>
      </div>
    );
  } else {
    const r = insight.reading;
    body = (
      <>
        <div className={s.ptHead}>
          <div>
            <b>{ptLabel || nearCity(pt.lat, pt.lon) || 'Chosen spot'}</b>
            <span className={s.mono + ' mono'}>{formatLatLon(pt.lat, pt.lon, 4)}{!ptLabel && nearCity(pt.lat, pt.lon) ? '' : ''}</span>
          </div>
          <div className={s.btns}>
            <button type="button" className="btn icon sm" title="Copy coordinates" aria-label="Copy coordinates" onClick={copy}><Icon name="copy" /></button>
            <button type="button" className="btn icon sm" title="Clear this point  (Esc)" aria-label="Clear this point" onClick={clearPoint}><Icon name="close" /></button>
          </div>
        </div>
        {r && (
          <table className={s.table}>
            <caption>Echo relative to each scene's median, in browse units (0–255).</caption>
            <thead><tr><th scope="col">Channel</th><th scope="col"><i className="dot a" />Before</th><th scope="col"><i className="dot b" />After</th><th scope="col">Change</th></tr></thead>
            <tbody>
              <tr><th scope="row" className="c-hh">HH</th><td>{signed(r.hhA)}</td><td>{signed(r.hhB)}</td><td className={tone(r.dhh)}>{signed(r.dhh)}{arrow(r.dhh)}</td></tr>
              <tr><th scope="row" className="c-hv">HV</th><td>{signed(r.hvA)}</td><td>{signed(r.hvB)}</td><td className={tone(r.dhv)}>{signed(r.dhv)}{arrow(r.dhv)}</td></tr>
            </tbody>
          </table>
        )}
        <PointChart />
        <div className={s.insight} aria-live="polite">
          {insight.cause && <span className={s.cause + ' ' + s['tone_' + insight.cause.tone]}>{insight.cause.label}</span>}
          <p>{insight.text}</p>
          {insight.cause && <small>A hint, not proof. One change can have several causes, the weather is a model grid and the radar is 8-bit browse imagery.</small>}
        </div>
        <button type="button" className="btn wide" onClick={csv} style={{ marginTop: 10 }}><Icon name="download" />Download this spot as CSV</button>
      </>
    );
  }
  return <Step n="4" id="step-point" title="Ask about a spot" status={status} aside={pt ? formatLatLon(pt.lat, pt.lon) : ''}>{body}</Step>;
}
