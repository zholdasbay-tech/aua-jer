import { useStore } from '../../store/useStore';
import { SHORTCUTS } from '../../lib/constants';
import Icon from '../icons/Icon';
import s from './Overlays.module.css';

export default function ShortcutsDialog() {
  const open = useStore((x) => x.shortcutsOpen);
  const setOpen = useStore((x) => x.setShortcuts);
  if (!open) return null;
  return (
    <div className={s.backdrop} onClick={() => setOpen(false)}>
      <div className={s.dialog} role="dialog" aria-modal="true" aria-labelledby="sc-title" onClick={(e) => e.stopPropagation()}>
        <div className={s.dialogHead}>
          <h2 id="sc-title">Keyboard shortcuts</h2>
          <button className="btn icon sm" aria-label="Close" onClick={() => setOpen(false)} autoFocus><Icon name="close" /></button>
        </div>
        <div className={s.rows}>
          {SHORTCUTS.map((r) => (
            <div className={s.row} key={r.what}>
              <span className={s.keys}>{r.keys.map((k, i) => <span className="kbd" key={i}>{k}</span>)}</span>
              <span>{r.what}</span>
            </div>
          ))}
        </div>
        <p className={s.tip}>On the map: drag to pan, scroll or pinch to zoom, double-click to zoom in, click a spot to read its history, right-click or long-press for more options.</p>
      </div>
    </div>
  );
}
