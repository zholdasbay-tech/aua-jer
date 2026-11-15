// Inline stroke icons. One component, keyed by name, so every button shares the same look.
const PATHS = {
  search: <><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4.5 4.5" /></>,
  target: <><circle cx="12" cy="12" r="3" /><path d="M12 2v4M12 18v4M2 12h4M18 12h4" /></>,
  pin: <><path d="M12 21s-6-5.3-6-11a6 6 0 0 1 12 0c0 5.7-6 11-6 11z" /><circle cx="12" cy="10" r="2.2" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  fit: <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />,
  download: <><path d="M12 4v11M7 10l5 5 5-5M5 20h14" /></>,
  link: <><path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" /><path d="M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" /></>,
  play: <path d="M7 5l12 7-12 7z" />,
  stop: <rect x="6" y="6" width="12" height="12" rx="1.5" />,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7.5v.5" /></>,
  single: <rect x="4" y="4" width="16" height="16" rx="2" />,
  swipe: <><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M12 4v16" /></>,
  blink: <><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M8 12h8M12 8v8" opacity=".5" /><circle cx="12" cy="12" r="2.5" /></>,
  change: <><path d="M4 17l5-5 4 4 7-8" /><path d="M15 8h5v5" /></>,
  grip: <path d="M9 6l-6 6 6 6M15 6l6 6-6 6" />,
  copy: <><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a1 1 0 0 1 1-1h10" /></>,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  check: <path d="M5 12l5 5 9-10" />,
  keyboard: <><rect x="3" y="6" width="18" height="12" rx="2" /><path d="M7 10h.01M11 10h.01M15 10h.01M7 14h10" /></>,
  layers: <><path d="M12 4l9 5-9 5-9-5z" /><path d="M3 14l9 5 9-5" /></>,
  chevron: <path d="M9 6l6 6-6 6" />,
  zoomin: <><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4.5 4.5M11 8v6M8 11h6" /></>,
  trash: <><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" /></>,
  sparkle: <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" />
};

export default function Icon({ name, size, className = '', style }) {
  const s = size ? { width: size, height: size, ...style } : style;
  return (
    <svg className={'i ' + className} viewBox="0 0 24 24" aria-hidden="true" style={s}>
      {PATHS[name] || null}
    </svg>
  );
}
