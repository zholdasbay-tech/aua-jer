import { useStore } from '../../store/useStore';
import { MODES, PLAY_SPEEDS } from '../../lib/constants';
import { fmtDay, daysBetween, plural } from '../../lib/format';
import Icon from '../icons/Icon';
import Step from './Step';
import Timeline from './Timeline';
import s from './Panel.module.css';

function ViewSwitch() {
  const mode = useStore((x) => x.mode), setMode = useStore((x) => x.setMode), n = useStore((x) => x.scenes.length);
  return (
    <div className={s.seg} role="group" aria-label="View">
      {MODES.map((m) => (
        <button key={m.id} type="button" aria-pressed={mode === m.id} title={m.hint + '  (' + m.key + ')'} onClick={() => setMode(m.id)} disabled={!n}>
          <Icon name={m.id} />{m.label}
        </button>
      ))}
    </div>
  );
}

export default function PassesStep() {
  const scenes = useStore((x) => x.scenes), a = useStore((x) => x.a), b = useStore((x) => x.b), setAB = useStore((x) => x.setAB);
  const playing = useStore((x) => x.playing), togglePlay = useStore((x) => x.togglePlay);
  const playSpeed = useStore((x) => x.playSpeed), setPlaySpeed = useStore((x) => x.setPlaySpeed);
  useStore((x) => x.loadedTick);
  const n = scenes.length, ok = scenes.filter((sc) => sc.ready).length, A = scenes[a], B = scenes[b];
  const status = !n ? 'todo' : ok ? 'done' : 'active';
  let gap = null;
  if (A && B) {
    if (a === b) gap = <>These are the same pass. Pick two different dates to see a change.</>;
    else gap = <><b>{plural(daysBetween(A.time, B.time), 'day')}</b> apart{a > b ? '. A comes after B, so the change map reads backwards in time.' : '.'}</>;
  }
  return (
    <Step n="2" id="step-passes" title="Pick two passes to compare" status={status} aside={n ? ok + ' of ' + n + ' loaded' : ''}>
      <div className={s.ab}>
        <label><span className="label"><i className="dot a" />Before (A)</span>
          <select className="select" value={a} onChange={(e) => setAB(+e.target.value, b)} disabled={!n} aria-label="Pass A, before">
            {scenes.map((sc, i) => <option key={sc.name} value={i}>{fmtDay(sc.time) + (sc.failed ? ' (failed)' : '')}</option>)}
          </select>
        </label>
        <label><span className="label"><i className="dot b" />After (B)</span>
          <select className="select" value={b} onChange={(e) => setAB(a, +e.target.value)} disabled={!n} aria-label="Pass B, after">
            {scenes.map((sc, i) => <option key={sc.name} value={i}>{fmtDay(sc.time) + (sc.failed ? ' (failed)' : '')}</option>)}
          </select>
        </label>
      </div>
      {gap && <p className={s.gap}>{gap}</p>}
      <Timeline />
      <ViewSwitch />
      <div className={s.playRow}>
        <button type="button" className={'btn' + (playing ? ' on' : '')} onClick={togglePlay} disabled={n < 2} title="Animate every pass in order  (Space)">
          <Icon name={playing ? 'stop' : 'play'} />{playing ? 'Stop' : 'Play all passes'}
        </button>
        <div className={s.speed} role="group" aria-label="Play speed">
          {PLAY_SPEEDS.map((p) => <button key={p.id} type="button" aria-pressed={playSpeed === p.id} onClick={() => setPlaySpeed(p.id)}>{p.label}</button>)}
        </div>
      </div>
      <p className="hint"><b className="c-hh">Magenta</b> is the HH channel, <b className="c-hv">green</b> is HV. Every pass here comes from one orbit track and frame, so the radar looks at the ground from the same angle each time.</p>
    </Step>
  );
}
