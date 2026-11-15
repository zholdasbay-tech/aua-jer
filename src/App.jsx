import { useEffect } from 'react';
import { useStore } from './store/useStore';
import { useKeyboard } from './hooks/useKeyboard';
import { readHash } from './lib/hash';
import { PRESETS } from './lib/constants';
import TopBar from './components/TopBar/TopBar';
import MapStage from './components/Map/MapStage';
import Panel from './components/Panel/Panel';
import StatusBar from './components/StatusBar/StatusBar';
import Toast from './components/Overlays/Toast';
import ShortcutsDialog from './components/Overlays/ShortcutsDialog';

let booted = false;

export default function App() {
  useKeyboard();
  useEffect(() => {
    if (booted) return;
    booted = true;
    const S = useStore.getState();
    const h = readHash();
    if (h) { S.setHero(false); S.goTo(h.lat, h.lon, { want: { key: h.key, a: h.a, b: h.b, mode: h.mode } }); }
    else { const p = PRESETS[0]; S.goTo(p.lat, p.lon, { label: p.name + ', ' + p.region, presetId: p.id }); }
  }, []);
  return (
    <div className="app">
      <TopBar />
      <MapStage />
      <Panel />
      <StatusBar />
      <Toast />
      <ShortcutsDialog />
    </div>
  );
}
