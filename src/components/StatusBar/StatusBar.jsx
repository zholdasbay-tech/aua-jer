import { useStore } from '../../store/useStore';
import { useClock } from '../../hooks/useClock';
import { dirWord } from '../../lib/format';
import s from './StatusBar.module.css';

export default function StatusBar() {
  const t = useClock();
  const archive = useStore((x) => x.archive);
  const stacks = useStore((x) => x.stacks);
  const idx = useStore((x) => x.stackIndex);
  const scenes = useStore((x) => x.scenes);
  useStore((x) => x.loadedTick);
  const st = stacks[idx];
  const ok = scenes.filter((sc) => sc.ready).length, failed = scenes.filter((sc) => sc.failed).length;
  return (
    <footer className={s.bar}>
      <span>Clock <b className={s.mono}>{t} UTC</b></span>
      <span>Archive {archive === 'online' ? <b className={s.ok}>● ASF DAAC online</b> : archive === 'offline' ? <b className={s.bad}>ASF DAAC unreachable</b> : <b className={s.wait}>connecting</b>}</span>
      <span>Track <b>{st ? st.path + ' · frame ' + st.frame + ' · ' + dirWord(st.dir) : '—'}</b></span>
      <span>Passes <b>{scenes.length ? ok + ' of ' + scenes.length + ' loaded' + (failed ? ', ' + failed + ' failed' : '') : '—'}</b></span>
      <span>Weather <b>NASA POWER</b></span>
    </footer>
  );
}
