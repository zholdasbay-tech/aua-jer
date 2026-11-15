import { useStore } from '../../store/useStore';
import { PRESETS } from '../../lib/constants';
import Icon from '../icons/Icon';
import ParticleField from './ParticleField';
import s from './Hero.module.css';

export default function Hero() {
  const open = useStore((x) => x.heroOpen);
  const setHero = useStore((x) => x.setHero);
  const openHelp = useStore((x) => x.openHelp);
  const goTo = useStore((x) => x.goTo);
  const n = useStore((x) => x.passesHere);
  const label = useStore((x) => x.placeLabel);

  const jump = (p) => { setHero(false); goTo(p.lat, p.lon, { label: p.name + ', ' + p.region, presetId: p.id }); };

  return (
    <div className={s.hero + (open ? '' : ' ' + s.off)} aria-hidden={!open}>
      <ParticleField run={open} />
      <div className={s.in}>
        <div className={s.chips}>
          <span className={s.chip + ' ' + s.live}>Live NISAR archive</span>
          <span className={s.chip}>L-band radar</span>
          <span className={s.chip}>Open data</span>
        </div>
        <h1>The ground moves.<i>Watch it every 12 days.</i></h1>
        <p>Aua Jer compares two NISAR radar passes over any place on Earth, maps what changed on the ground, and checks the weather for a reason.</p>
        <div className={s.cta}>
          <button className="btn primary" onClick={() => setHero(false)} disabled={!open}>Open the explorer <Icon name="arrow" /></button>
          <button className="btn ghost" onClick={() => { setHero(false); openHelp('method'); }} disabled={!open}><Icon name="info" />How radar sees the ground</button>
        </div>
        <div className={s.jump}>
          <span>Or jump straight to</span>
          {PRESETS.map((p) => <button key={p.id} onClick={() => jump(p)} title={p.why} disabled={!open}>{p.name}</button>)}
        </div>
        <div className={s.facts}>
          <div><b>24 cm</b>Radar wavelength</div>
          <div><b>12 days</b>Repeat cycle</div>
          <div><b>{n == null ? '—' : n}</b>{n == null ? 'Passes found' : 'Passes near ' + (label ? label.split(',')[0] : 'here')}</div>
        </div>
      </div>
    </div>
  );
}
