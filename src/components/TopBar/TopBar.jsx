import { useStore } from '../../store/useStore';
import { writeHash } from '../../lib/hash';
import { copyText } from '../../lib/download';
import { scrollToId } from '../../lib/dom';
import Icon from '../icons/Icon';
import s from './TopBar.module.css';

const NAV = [
  { id: 'explore', label: 'Explorer' },
  { id: 'method', label: 'How to read it' },
  { id: 'data', label: 'Data' },
  { id: 'about', label: 'About' }
];

function Logo() {
  return (
    <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden="true">
      <defs><linearGradient id="lg" x1="0" x2="1"><stop offset="0" stopColor="#7cc4ff" /><stop offset="1" stopColor="#c7a8ff" /></linearGradient></defs>
      <rect x=".5" y=".5" width="31" height="31" rx="8" fill="#050b1a" stroke="rgba(124,196,255,.4)" />
      <path d="M5 20c5-7 9-7 13-2s7 4 10-3" fill="none" stroke="url(#lg)" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M5 25c5-5 9-5 13-1s7 3 10-2" fill="none" stroke="rgba(124,196,255,.45)" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="23" cy="9" r="2.6" fill="#fff" />
    </svg>
  );
}

export default function TopBar() {
  const setHero = useStore((x) => x.setHero);
  const openHelp = useStore((x) => x.openHelp);
  const showToast = useStore((x) => x.showToast);
  const setShortcuts = useStore((x) => x.setShortcuts);

  const go = (id) => (e) => {
    e.preventDefault();
    setHero(false);
    if (id === 'method' || id === 'data') openHelp(id);
    else scrollToId(id === 'explore' ? 'step-place' : 'about', id === 'explore' ? 'start' : 'end');
  };
  const share = async () => {
    writeHash(useStore.getState());
    const ok = await copyText(location.href);
    showToast(ok ? 'Link to this exact view copied' : location.href);
  };

  return (
    <header className={s.top}>
      <a className={s.logo} href="#" onClick={(e) => { e.preventDefault(); setHero(true); }} aria-label="Aua Jer, back to the start">
        <Logo /> Aua Jer <small>NISAR</small>
      </a>
      <nav className={s.nav} aria-label="Sections">
        {NAV.map((n) => <a key={n.id} href={'#' + n.id} onClick={go(n.id)}>{n.label}</a>)}
      </nav>
      <div className={s.actions}>
        <button className="btn icon" title="Keyboard shortcuts  (?)" aria-label="Keyboard shortcuts" onClick={() => setShortcuts(true)}><Icon name="keyboard" /></button>
        <button className="btn ice" onClick={share} title="Copy a link to exactly this view"><Icon name="link" />Copy link</button>
      </div>
    </header>
  );
}
