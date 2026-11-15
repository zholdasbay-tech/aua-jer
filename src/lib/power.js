// NASA POWER daily weather at a point (MERRA-2 / GEOS model grid).
import { POWER } from './constants';
import { ymd } from './format';

export async function fetchPower(lat, lon, t0, t1) {
  const u = POWER + '?parameters=T2M,T2M_MIN,T2M_MAX,PRECTOTCORR&community=AG&longitude=' + lon.toFixed(3) +
    '&latitude=' + lat.toFixed(3) + '&start=' + ymd(t0) + '&end=' + ymd(t1) + '&format=JSON';
  const r = await fetch(u);
  if (!r.ok) throw new Error('NASA POWER answered HTTP ' + r.status);
  const j = await r.json();
  const P = j.properties && j.properties.parameter;
  if (!P || !P.T2M) throw new Error('NASA POWER returned no data');
  const v = (x) => (x === undefined || x <= -900 ? null : x);
  return Object.keys(P.T2M).sort().map((k) => ({
    t: Date.UTC(+k.slice(0, 4), +k.slice(4, 6) - 1, +k.slice(6, 8)),
    tavg: v(P.T2M[k]), tmin: v(P.T2M_MIN && P.T2M_MIN[k]), tmax: v(P.T2M_MAX && P.T2M_MAX[k]), rain: v(P.PRECTOTCORR && P.PRECTOTCORR[k])
  }));
}
