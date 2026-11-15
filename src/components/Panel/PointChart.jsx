import { useEffect, useRef, useState } from 'react';
import { useStore } from '../../store/useStore';
import { fmtDay, signed } from '../../lib/format';
import { rainBefore, tminOn } from '../../lib/weather';
import s from './Panel.module.css';

// Radar echo per pass (top) over NASA POWER temperature and rain (bottom). Hover for values; click sets B, shift-click sets A.
export default function PointChart() {
  const scenes = useStore((x) => x.scenes), series = useStore((x) => x.series), wx = useStore((x) => x.wx);
  const a = useStore((x) => x.a), b = useStore((x) => x.b), setAB = useStore((x) => x.setAB);
  const ref = useRef(null), geo = useRef(null);
  const [hover, setHover] = useState(null);   // index of the hovered pass

  useEffect(() => {
    const c = ref.current;
    if (!c || !scenes.length) return undefined;
    const draw = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1), w = c.clientWidth, h = c.clientHeight;
      if (!w) return;
      c.width = Math.round(w * dpr); c.height = Math.round(h * dpr);
      const x = c.getContext('2d');
      x.setTransform(dpr, 0, 0, dpr, 0, 0); x.clearRect(0, 0, w, h);
      const n = scenes.length, t0 = Date.parse(scenes[0].time) - 10 * 864e5, t1 = Date.parse(scenes[n - 1].time) + 3 * 864e5;
      const L = 32, R = w - 36, T1 = 20, B1 = Math.round(h * 0.48), T2 = Math.round(h * 0.62), B2 = h - 18;
      const X = (t) => L + ((t - t0) / (t1 - t0)) * (R - L);
      x.font = '10px ui-monospace,Menlo,Consolas,monospace'; x.textBaseline = 'middle';
      let d = new Date(t0); d = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1));
      x.strokeStyle = 'rgba(255,255,255,.12)'; x.fillStyle = '#8b9098'; x.lineWidth = 1; x.textAlign = 'center';
      while (d.getTime() < t1) {
        const gx = Math.round(X(d.getTime())) + 0.5;
        x.beginPath(); x.moveTo(gx, T1); x.lineTo(gx, B2); x.stroke();
        x.fillText(d.toLocaleDateString('en-GB', { month: 'short', timeZone: 'UTC' }), gx, h - 7);
        d = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1));
      }
      x.strokeStyle = 'rgba(255,255,255,.3)'; x.strokeRect(L + 0.5, T1 + 0.5, R - L, B1 - T1); x.strokeRect(L + 0.5, T2 + 0.5, R - L, B2 - T2);
      [[a, '#4aa8ff', 'A'], [b, '#ffa62b', 'B']].forEach((m) => {
        const sc = scenes[m[0]]; if (!sc) return;
        const gx = Math.round(X(Date.parse(sc.time))) + 0.5;
        x.strokeStyle = m[1]; x.setLineDash([3, 3]); x.beginPath(); x.moveTo(gx, T1); x.lineTo(gx, B2); x.stroke(); x.setLineDash([]);
        x.fillStyle = m[1]; x.textAlign = 'center'; x.fillText(m[2], gx, B1 + 9);
      });
      let lo = 255, hi = 0;
      series.forEach((q) => { if (!q) return; lo = Math.min(lo, q.hh, q.hv); hi = Math.max(hi, q.hh, q.hv); });
      if (lo > hi) { lo = -30; hi = 30; }
      lo = Math.floor(lo / 10) * 10 - 10; hi = Math.ceil(hi / 10) * 10 + 10;
      const Y1 = (v) => B1 - ((v - lo) / (hi - lo)) * (B1 - T1);
      x.fillStyle = '#8b9098'; x.textAlign = 'right'; x.fillText((hi > 0 ? '+' : '') + hi, L - 5, T1 + 4); x.fillText((lo > 0 ? '+' : '') + lo, L - 5, B1 - 3);
      if (lo < 0 && hi > 0) { const y0 = Math.round(Y1(0)) + 0.5; x.strokeStyle = 'rgba(255,255,255,.45)'; x.setLineDash([2, 3]); x.beginPath(); x.moveTo(L, y0); x.lineTo(R, y0); x.stroke(); x.setLineDash([]); }
      x.textAlign = 'left'; x.fillStyle = '#c9cdd3'; x.fillText('Radar echo vs scene median', L, T1 - 10);
      [['hh', '#ec74dc', 'rgba(236,116,220,'], ['hv', '#74dd74', 'rgba(116,221,116,']].forEach((bd) => {
        const pts = [];
        scenes.forEach((sc, k) => { const q = series[k]; if (q) pts.push([X(Date.parse(sc.time)), Y1(q[bd[0]])]); });
        if (pts.length > 1) {
          const g = x.createLinearGradient(0, T1, 0, B1); g.addColorStop(0, bd[2] + '.28)'); g.addColorStop(1, bd[2] + '0)');
          x.fillStyle = g; x.beginPath(); x.moveTo(pts[0][0], B1); pts.forEach((q) => x.lineTo(q[0], q[1])); x.lineTo(pts[pts.length - 1][0], B1); x.closePath(); x.fill();
        }
        x.shadowColor = bd[1]; x.shadowBlur = 8; x.strokeStyle = bd[1]; x.fillStyle = bd[1]; x.lineWidth = 1.8;
        x.beginPath(); pts.forEach((q, i) => (i ? x.lineTo(q[0], q[1]) : x.moveTo(q[0], q[1]))); x.stroke();
        pts.forEach((q) => { x.beginPath(); x.arc(q[0], q[1], 3, 0, 7); x.fill(); });
        x.shadowBlur = 0;
      });
      if (hover !== null && scenes[hover]) {
        const hx = Math.round(X(Date.parse(scenes[hover].time))) + 0.5;
        x.strokeStyle = 'rgba(255,255,255,.7)'; x.lineWidth = 1; x.beginPath(); x.moveTo(hx, T1); x.lineTo(hx, B2); x.stroke();
      }
      x.textAlign = 'right'; x.fillStyle = '#ec74dc'; x.fillText('HH', R - 24, T1 - 10); x.fillStyle = '#74dd74'; x.fillText('HV', R, T1 - 10);
      x.textAlign = 'left'; x.fillStyle = '#c9cdd3'; x.fillText('NASA POWER air temp °C', L, T2 - 10); x.textAlign = 'right'; x.fillStyle = '#4aa8ff'; x.fillText('rain mm/day', R, T2 - 10);
      if (wx && wx.length) {
        let tl = 99, th = -99, rm = 1;
        wx.forEach((q) => { if (q.tmin !== null) tl = Math.min(tl, q.tmin); if (q.tmax !== null) th = Math.max(th, q.tmax); if (q.rain !== null) rm = Math.max(rm, q.rain); });
        if (tl > th) { tl = -10; th = 30; }
        tl = Math.floor(tl / 5) * 5; th = Math.ceil(th / 5) * 5; if (th === tl) th = tl + 5;
        const Y2 = (v) => B2 - ((v - tl) / (th - tl)) * (B2 - T2);
        const bw = Math.max(1, (R - L) / ((t1 - t0) / 864e5) - 0.5);
        x.fillStyle = 'rgba(74,168,255,.75)';
        wx.forEach((q) => { if (q.rain === null || q.rain <= 0) return; const bh = (q.rain / rm) * (B2 - T2) * 0.9; x.fillRect(X(q.t) - bw / 2, B2 - bh, bw, bh); });
        x.fillStyle = 'rgba(255,166,43,.14)'; x.beginPath(); let first = true;
        wx.forEach((q) => { if (q.tmax === null) return; if (first) { x.moveTo(X(q.t), Y2(q.tmax)); first = false; } else x.lineTo(X(q.t), Y2(q.tmax)); });
        for (let k = wx.length - 1; k >= 0; k--) { const q = wx[k]; if (q.tmin === null) continue; x.lineTo(X(q.t), Y2(q.tmin)); }
        if (!first) { x.closePath(); x.fill(); }
        x.strokeStyle = '#ffa62b'; x.lineWidth = 1.4; x.beginPath(); first = true;
        wx.forEach((q) => { if (q.tavg === null) return; if (first) { x.moveTo(X(q.t), Y2(q.tavg)); first = false; } else x.lineTo(X(q.t), Y2(q.tavg)); });
        x.stroke();
        if (tl < 0 && th > 0) { const zy = Math.round(Y2(0)) + 0.5; x.strokeStyle = '#fff'; x.lineWidth = 1; x.setLineDash([2, 3]); x.beginPath(); x.moveTo(L, zy); x.lineTo(R, zy); x.stroke(); x.setLineDash([]); }
        x.fillStyle = '#8b9098'; x.textAlign = 'right'; x.fillText(th, L - 5, T2 + 4); x.fillText(tl, L - 5, B2 - 3);
        x.textAlign = 'left'; x.fillStyle = '#4aa8ff'; x.fillText(rm.toFixed(0), R + 5, T2 + 4); x.fillText('0', R + 5, B2 - 3);
      } else {
        x.fillStyle = '#8b9098'; x.textAlign = 'left'; x.fillText(wx && wx.error ? 'Weather unavailable' : 'Loading weather…', L + 8, (T2 + B2) / 2);
      }
      geo.current = { X, L, R, w };
    };
    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(c);
    return () => ro.disconnect();
  }, [scenes, series, wx, a, b, hover]);

  const onMove = (e) => {
    const g = geo.current; if (!g) return;
    const rc = ref.current.getBoundingClientRect(), mxp = e.clientX - rc.left;
    let best = null, bd = 1e9;
    scenes.forEach((sc, k) => { const d = Math.abs(g.X(Date.parse(sc.time)) - mxp); if (d < bd) { bd = d; best = k; } });
    setHover(best === null || bd > 24 || mxp < g.L - 10 || mxp > g.R + 10 ? null : best);
  };
  const onClick = (e) => { if (hover === null) return; if (e.shiftKey) setAB(hover, b); else setAB(a === hover ? 0 : a, hover); };

  let tip = null;
  if (hover !== null && scenes[hover] && geo.current) {
    const sc = scenes[hover], q = series[hover], t = Date.parse(sc.time), r = rainBefore(wx, t, 3), m = tminOn(wx, t);
    const tx = geo.current.X(t), flip = tx + 150 > geo.current.w;
    tip = (
      <div className={s.tip} style={{ top: 18, left: flip ? undefined : tx + 12, right: flip ? geo.current.w - tx + 12 : undefined }}>
        <b>{fmtDay(sc.time)}</b>{hover === a ? ' · A' : hover === b ? ' · B' : ''}<br />
        <span className="c-hh">HH {q ? signed(q.hh) : '—'}</span> &nbsp;<span className="c-hv">HV {q ? signed(q.hv) : '—'}</span><br />
        {r !== null && <>Rain 3 d before: {r.toFixed(1)} mm<br /></>}
        {m !== null && <>Night min: {m.toFixed(1)} °C</>}
      </div>
    );
  }
  return (
    <div className={s.chartWrap}>
      <canvas ref={ref} className={s.chart} onPointerMove={onMove} onPointerLeave={() => setHover(null)} onClick={onClick} aria-label="Radar echo and weather over time" />
      {tip}
      <p className={s.chartHint}>Hover for values. Click a pass to set it as After, shift-click for Before.</p>
    </div>
  );
}
