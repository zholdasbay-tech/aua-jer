import { useEffect } from 'react';
import { useStore } from '../store/useStore';

// Global hotkeys. Typing in a field, or holding a modifier, never triggers them.
export function useKeyboard() {
  useEffect(() => {
    const onKey = (e) => {
      const tag = e.target && e.target.tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA' || e.metaKey || e.ctrlKey || e.altKey) return;
      const S = useStore.getState();
      if (e.key === 'Escape') {
        if (S.shortcutsOpen) S.setShortcuts(false);
        else if (S.menu) S.closeMenu();
        else S.clearPoint();
        return;
      }
      if (e.key === '?') { S.setShortcuts(!S.shortcutsOpen); e.preventDefault(); return; }
      if (S.heroOpen) { if (e.key === 'Enter') { S.setHero(false); e.preventDefault(); } return; }
      if (S.shortcutsOpen) return;
      switch (e.key) {
        case '1': S.setMode('single'); break;
        case '2': S.setMode('swipe'); break;
        case '3': S.setMode('blink'); break;
        case '4': S.setMode('change'); break;
        case 'ArrowRight': if (e.shiftKey) S.stepA(1); else S.stepB(1); e.preventDefault(); break;
        case 'ArrowLeft': if (e.shiftKey) S.stepA(-1); else S.stepB(-1); e.preventDefault(); break;
        case ' ': if (tag !== 'BUTTON') { S.togglePlay(); e.preventDefault(); } break;
        case 'f': case 'F': S.fit(); break;
        case '+': case '=': S.zoomBy(0.75); break;
        case '-': case '_': S.zoomBy(-0.75); break;
        default: break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}
