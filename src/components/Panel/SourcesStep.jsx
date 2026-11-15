import { useStore } from '../../store/useStore';
import Step from './Step';
import s from './Panel.module.css';

function Line({ tag, sc }) {
  return (
    <div className={s.prov}>
      <b>{tag}</b> {sc.name}<br />
      {sc.pol} · {sc.col} · <a href={sc.png} target="_blank" rel="noopener">browse PNG</a> · <a href={sc.h5} target="_blank" rel="noopener">full HDF5</a>
    </div>
  );
}

export default function SourcesStep() {
  const scenes = useStore((x) => x.scenes), a = useStore((x) => x.a), b = useStore((x) => x.b);
  const A = scenes[a], B = scenes[b];
  return (
    <Step n="5" id="step-sources" title="Sources on screen" status={A && B ? 'done' : 'todo'}>
      {!A || !B ? <p className="hint">No passes loaded yet.</p> : (
        <>
          <Line tag="Before (A)" sc={A} />
          <Line tag="After (B)" sc={B} />
        </>
      )}
    </Step>
  );
}
