import { useEffect, useRef } from 'react';
import s from './Hero.module.css';

// A slowly turning disc of particles, drawn in code. Stops when the hero is hidden or motion is reduced.
export default function ParticleField({ run }) {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return undefined;
    const n = window.innerWidth < 700 ? 900 : 2200, parts = [];
    for (let i = 0; i < n; i++) {
      const r = Math.pow(Math.random(), 0.6);
      parts.push({ r, a: Math.random() * Math.PI * 2, s: (0.0009 + 0.003 * (1 - r)) * (Math.random() < 0.5 ? 1 : 1.15), z: Math.random(), h: Math.random() });
    }
    const still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0, on = run && !still;
    const frame = () => {
      const d = Math.min(2, window.devicePixelRatio || 1), w = c.clientWidth, h = c.clientHeight;
      if (!w) { if (on) raf = requestAnimationFrame(frame); return; }
      if (c.width !== Math.round(w * d)) { c.width = Math.round(w * d); c.height = Math.round(h * d); }
      const x = c.getContext('2d');
      x.setTransform(d, 0, 0, d, 0, 0);
      x.globalCompositeOperation = 'source-over'; x.fillStyle = 'rgba(2,4,10,.22)'; x.fillRect(0, 0, w, h);
      x.globalCompositeOperation = 'lighter';
      const cx = w > 900 ? w * 0.68 : w * 0.5, cy = w > 900 ? h * 0.5 : h * 0.34, R = Math.min(w > 900 ? w * 0.36 : w * 0.62, h * 0.62);
      const tilt = 0.38, rot = -0.35, cr = Math.cos(rot), sr = Math.sin(rot);
      const core = x.createRadialGradient(cx, cy, 0, cx, cy, R * 0.35);
      core.addColorStop(0, 'rgba(180,215,255,.10)'); core.addColorStop(1, 'rgba(40,80,200,0)');
      x.fillStyle = core; x.beginPath(); x.arc(cx, cy, R * 0.35, 0, 7); x.fill();
      parts.forEach((q) => {
        q.a += q.s;
        const rr = q.r * R, ex = Math.cos(q.a) * rr, ey = Math.sin(q.a) * rr * tilt;
        const px = cx + ex * cr - ey * sr, py = cy + ex * sr + ey * cr, b = 0.35 + 0.65 * (1 - q.r);
        const col = q.h < 0.72 ? 'rgba(110,175,255,' : q.h < 0.9 ? 'rgba(190,225,255,' : 'rgba(185,150,255,';
        x.fillStyle = col + (0.25 + 0.6 * b * q.z) + ')';
        const sz = 0.6 + 1.6 * q.z * b;
        x.fillRect(px, py, sz, sz);
      });
      x.globalCompositeOperation = 'source-over';
      if (on) raf = requestAnimationFrame(frame);
    };
    if (run && still) { for (let k = 0; k < 40; k++) frame(); } else if (on) raf = requestAnimationFrame(frame);
    return () => { on = false; cancelAnimationFrame(raf); };
  }, [run]);
  return <canvas ref={ref} className={s.fx} aria-hidden="true" />;
}
