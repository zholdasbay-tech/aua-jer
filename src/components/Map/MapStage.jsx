import { useEffect, useRef } from 'react';
import { useStore } from '../../store/useStore';
import { createRenderer } from './mapRenderer';
import { useMapPointer } from './useMapPointer';
import { Corners, ProgressBar, PassTags, SwipeHandle, MapTools, LayerBar, Legend, Hud, BusyPill, ContextMenu } from './MapOverlays';
import Hero from '../Hero/Hero';
import s from './Map.module.css';

// Store keys whose change means the canvas must be redrawn.
const DRAW_KEYS = ['view', 'mode', 'a', 'b', 'loadedTick', 'change', 'changeStats', 'opa', 'base', 'labels', 'swipe', 'pt', 'hot', 'hoverHot', 'blinkPhase', 'grid', 'scenes'];

export default function MapStage() {
  const canvasRef = useRef(null), stageRef = useRef(null), rendRef = useRef(null);
  const mode = useStore((x) => x.mode);

  useEffect(() => {
    const canvas = canvasRef.current;
    const R = createRenderer(canvas, useStore.getState);
    rendRef.current = R;
    const ro = new ResizeObserver(() => { const { w, h } = R.resize(); useStore.getState().setViewport(w, h); });
    ro.observe(canvas);
    const unsub = useStore.subscribe((cur, prev) => { if (DRAW_KEYS.some((k) => cur[k] !== prev[k])) R.invalidate(); });
    return () => { unsub(); ro.disconnect(); R.destroy(); };
  }, []);

  useEffect(() => {
    if (mode !== 'blink') return undefined;
    const id = setInterval(() => useStore.getState().tickBlink(), 650);
    return () => clearInterval(id);
  }, [mode]);

  useMapPointer(canvasRef, rendRef);

  return (
    <main className={s.stage} ref={stageRef} aria-label="Map">
      <canvas ref={canvasRef} className={s.map} aria-label="Radar map. Drag to pan, scroll to zoom, click a spot to read its history, right-click for more options." />
      <ProgressBar />
      <Corners />
      <SwipeHandle stageRef={stageRef} />
      <PassTags />
      <MapTools rendRef={rendRef} />
      <LayerBar />
      <Legend />
      <Hud />
      <BusyPill />
      <ContextMenu />
      <Hero />
    </main>
  );
}
