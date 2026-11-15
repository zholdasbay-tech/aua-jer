import { useState } from 'react';
import { useStore } from '../../store/useStore';
import { PRESETS } from '../../lib/constants';
import { parseLatLon, formatLatLon, ilat, ilon } from '../../lib/geo';
import { searchPlace } from '../../lib/geocode';
import { fmtDay, dirWord, plural } from '../../lib/format';
import Icon from '../icons/Icon';
import Step from './Step';
import s from './Panel.module.css';

function describeStack(st, scenes) {
  if (!st || !scenes.length) return '';
  const n = scenes.length, first = scenes[0], last = scenes[n - 1];
  let cadence = '';
  if (n > 2) {
    const gaps = [];
    for (let i = 1; i < n; i++) gaps.push(Math.round((Date.parse(scenes[i].time) - Date.parse(scenes[i - 1].time)) / 864e5));
    gaps.sort((a, b) => a - b);
    cadence = ', about every ' + gaps[Math.floor(gaps.length / 2)] + ' days';
  }
  let t = plural(n, 'pass', 'passes') + (n > 1 ? ' between ' + fmtDay(first.time) + ' and ' + fmtDay(last.time) : ' on ' + fmtDay(first.time)) + cadence + '. L-band ' + (first.pol || '') + '.';
  if (st.skipped) t += ' ' + plural(st.skipped, 'single-polarisation pass was', 'single-polarisation passes were') + ' left out.';
  if (first.b && first.b.approx) t += ' Position fitted from the footprint, good to about one pixel.';
  return t;
}

export default function PlaceStep() {
  const goTo = useStore((x) => x.goTo), setBusy = useStore((x) => x.setBusy);
  const lat = useStore((x) => x.lat), lon = useStore((x) => x.lon), label = useStore((x) => x.placeLabel), presetId = useStore((x) => x.presetId);
  const stacks = useStore((x) => x.stacks), stackIndex = useStore((x) => x.stackIndex), useStack = useStore((x) => x.useStack);
  const scenes = useStore((x) => x.scenes);
  const [q, setQ] = useState('');
  const [searching, setSearching] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const t = q.trim();
    if (!t) return;
    const c = parseLatLon(t);
    if (c) { goTo(c.lat, c.lon); return; }
    setSearching(true);
    try {
      const res = await searchPlace(t);
      if (!res.length) { setBusy('No place called "' + t + '" was found. Try a bigger town, or type coordinates.', 'err'); return; }
      goTo(res[0].lat, res[0].lon, { label: res[0].name });
    } catch (err) {
      setBusy('Place search failed: ' + err.message, 'err');
    } finally { setSearching(false); }
  };
  const myLocation = () => {
    if (!navigator.geolocation) { setBusy('This browser has no location service.', 'err'); return; }
    setBusy('Asking the browser for your location');
    navigator.geolocation.getCurrentPosition(
      (p) => goTo(p.coords.latitude, p.coords.longitude),
      () => setBusy('Could not get your location. Type a place instead.', 'err'),
      { timeout: 10000 }
    );
  };
  const centre = () => { const { view } = useStore.getState(); goTo(ilat(view.cy), ilon(view.cx)); };

  const st = stacks[stackIndex];
  return (
    <Step n="1" id="step-place" title="Where to look" status={scenes.length ? 'done' : 'active'} aside={label || formatLatLon(lat, lon)}>
      <form className={s.row} onSubmit={submit}>
        <input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Town, region, or latitude, longitude" aria-label="Place name or coordinates" autoComplete="off" />
        <button className="btn" type="submit" disabled={searching} title="Find NISAR passes at this place"><Icon name="search" />{searching ? 'Looking' : 'Search'}</button>
      </form>
      <div className={s.chips} aria-label="Example places">
        {PRESETS.map((p) => (
          <button key={p.id} type="button" className={s.chip + (p.id === presetId ? ' ' + s.chipOn : '')} title={p.why + ' · ' + p.region}
            onClick={() => goTo(p.lat, p.lon, { label: p.name + ', ' + p.region, presetId: p.id })}>{p.name}</button>
        ))}
      </div>
      <div className={s.row2}>
        <button type="button" className="btn sm ghost" onClick={centre} title="Search NISAR passes at the centre of the map"><Icon name="target" />Search at the map centre</button>
        <button type="button" className="btn sm ghost" onClick={myLocation}><Icon name="pin" />My location</button>
      </div>
      {stacks.length > 0 && (
        <div className={s.field}>
          <label className="label" htmlFor="stack">Orbit track {stacks.length > 1 && <span className={s.soft}>· {stacks.length} tracks see this point</span>}</label>
          <select id="stack" className="select" value={stackIndex} onChange={(e) => useStack(+e.target.value)}>
            {stacks.map((x, i) => <option key={x.key} value={i}>{'Track ' + x.path + ', frame ' + x.frame + ' · ' + dirWord(x.dir) + ' · ' + plural(x.scenes.length, 'pass', 'passes')}</option>)}
          </select>
          <p className="hint">{describeStack(st, scenes)}</p>
        </div>
      )}
    </Step>
  );
}
