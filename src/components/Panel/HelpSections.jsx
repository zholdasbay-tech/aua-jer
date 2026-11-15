import { useEffect, useState } from 'react';
import { useStore } from '../../store/useStore';
import { SHORTCUTS } from '../../lib/constants';
import { scrollToId } from '../../lib/dom';
import s from './Panel.module.css';

function Section({ id, title, open, onToggle, children }) {
  return (
    <details className={s.details} id={'help-' + id} open={open} onToggle={(e) => onToggle(e.target.open)}>
      <summary>{title}</summary>
      <div className={s.more}>{children}</div>
    </details>
  );
}

export default function HelpSections() {
  const helpOpen = useStore((x) => x.helpOpen);
  const [open, setOpen] = useState({ method: false, data: false, keys: false });
  useEffect(() => {
    if (!helpOpen) return;
    setOpen((o) => ({ ...o, [helpOpen.id]: true }));
    setTimeout(() => scrollToId('help-' + helpOpen.id), 60);
  }, [helpOpen]);
  const set = (k) => (v) => setOpen((o) => (o[k] === v ? o : { ...o, [k]: v }));
  return (
    <>
      <Section id="method" title="How to read the radar" open={open.method} onToggle={set('method')}>
        <ul>
          <li>NISAR carries an L-band radar with a wavelength of about 24 cm. It works at night and through cloud, and returns to the same track every 12 days.</li>
          <li><b className="c-hh">HH</b> is strong over rough or wet ground and over buildings. <b className="c-hv">HV</b> comes from scattering inside vegetation.</li>
          <li>An echo usually gets <b className="c-up">brighter</b> when soil gets wetter, crops grow or a field is ploughed rough. It gets <b className="c-down">darker</b> when soil dries, crops are harvested, calm open water appears, or the ground freezes.</li>
          <li>One change on the map can have several causes. The weather chart is a hint, not proof.</li>
          <li>Watch for artefacts. A bright halo that switches on and off around a big city from pass to pass is an imaging effect, most likely radio interference, and not a change on the ground. Around Astana it is present in 4 of the 10 passes.</li>
        </ul>
      </Section>
      <Section id="data" title="Data and limits" open={open.data} onToggle={set('data')}>
        <ul>
          <li>Radar: NISAR L2 GCOV browse images (HH and HV), streamed live from NASA's Alaska Satellite Facility DAAC and found with the ASF Search API.</li>
          <li>Very dark open water can fall below the browse image's lowest value and then shows as no data.</li>
          <li>Browse images are about 200 m per pixel and 8-bit, scaled for display. The change map is a relative difference after removing the scene-wide median and aligning the two passes to the nearest pixel. It is not calibrated backscatter in dB. Point charts are relative to each scene's median for the same reason, so a change across the whole scene cannot be told apart from display scaling.</li>
          <li>Weather: NASA POWER daily values (MERRA-2 and GEOS) at the clicked coordinates. It is a model grid, not a station.</li>
          <li>Place names: OpenStreetMap Nominatim. Base maps: NASA GIBS Black Marble and Blue Marble, or OpenStreetMap. City markers are approximate.</li>
          <li>Next step: read the full-resolution GCOV HDF5 products for calibrated gamma-nought, and add ground readings from the Aua phone-barometer network.</li>
        </ul>
      </Section>
      <Section id="keys" title="Keyboard and mouse" open={open.keys} onToggle={set('keys')}>
        <ul>
          {SHORTCUTS.map((r) => <li key={r.what}>{r.keys.map((k, i) => <span className="kbd" key={i}>{k}</span>)} {r.what}</li>)}
          <li>On the map: drag to pan, scroll or pinch to zoom, double-click to zoom in, click a spot to read it, right-click or long-press for more options.</li>
        </ul>
      </Section>
    </>
  );
}
