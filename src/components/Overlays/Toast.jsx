import { useStore } from '../../store/useStore';
import s from './Overlays.module.css';

export default function Toast() {
  const msg = useStore((x) => x.toast);
  return <div className={s.toast + (msg ? ' ' + s.show : '')} role="status" aria-live="polite">{msg || ''}</div>;
}
