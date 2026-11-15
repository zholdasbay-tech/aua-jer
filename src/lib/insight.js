// Turn the radar readings and the weather at a point into a plain-language hint.
import { rainBefore, tminOn } from './weather';
import { signed } from './format';

export const CAUSES = {
  frozen:   { label: 'Likely frozen ground', tone: 'down' },
  wetter:   { label: 'Likely wetter soil', tone: 'up' },
  drier:    { label: 'Likely drier soil', tone: 'down' },
  surface:  { label: 'Surface itself changed', tone: 'up' },
  lessveg:  { label: 'Less vegetation', tone: 'down' },
  moreveg:  { label: 'More vegetation', tone: 'up' },
  none:     { label: 'No clear change', tone: 'flat' },
  unknown:  { label: 'Changed, cause unclear', tone: 'flat' }
};

export function buildInsight({ scenes, a, b, series, wx }) {
  const A = scenes[a], B = scenes[b], sa = series[a], sb = series[b];
  if (!A || !B) return { status: 'idle' };
  if (sa === null || sb === null) return { status: 'nodata', text: 'This point has no radar data in pass A or pass B.' };
  if (!sa || !sb) return { status: 'loading', text: 'Reading this spot in pass A and pass B.' };

  const dhh = sb.hh - sa.hh, dhv = sb.hv - sa.hv, d = (dhh + dhv) / 2;
  const lines = [];
  let cause = null;

  if (wx && wx.error) {
    lines.push('Weather is unavailable (' + wx.error + ').');
  } else if (wx) {
    const ra = rainBefore(wx, Date.parse(A.time), 3), rb = rainBefore(wx, Date.parse(B.time), 3);
    const ta = tminOn(wx, Date.parse(A.time)), tb = tminOn(wx, Date.parse(B.time));
    if (ra !== null && rb !== null) lines.push('Rain in the 3 days before each pass: ' + ra.toFixed(1) + ' mm before A, ' + rb.toFixed(1) + ' mm before B.');
    if (ta !== null && tb !== null) lines.push('Night minimum: ' + ta.toFixed(1) + ' °C at A, ' + tb.toFixed(1) + ' °C at B.');

    if (tb !== null && ta !== null && tb < -1 && ta > 1 && dhh < -8 && dhv < -8) { cause = 'frozen'; lines.push('The ground was probably frozen at B and not at A. Frozen soil darkens the echo.'); }
    else if (ra !== null && rb !== null && rb - ra > 3 && d > 8) { cause = 'wetter'; lines.push('More rain before B fits a brighter echo from wetter soil.'); }
    else if (ra !== null && rb !== null && ra - rb > 3 && d < -8) { cause = 'drier'; lines.push('More rain before A fits a darker echo at B as the soil dried out.'); }
    else if (ra !== null && rb !== null && rb <= ra + 1 && dhh > 20) { cause = 'surface'; lines.push('HH rose although it was not wetter before B. That points to the surface itself changing, for example tillage after harvest.'); }
    else if (dhv < -12 && dhh > -10) { cause = 'lessveg'; lines.push('HV fell while HH held. That fits less standing vegetation, for example after a harvest.'); }
    else if (dhv > 12 && dhh < 6) { cause = 'moreveg'; lines.push('HV rose while HH held. That fits more vegetation volume.'); }
    else if (Math.abs(d) <= 8) { cause = 'none'; lines.push('The change is within the noise of browse imagery.'); }
    else { cause = 'unknown'; lines.push('The echo changed, but the weather does not point to one reason.'); }
  } else {
    lines.push('Fetching NASA POWER weather for these dates.');
  }

  return {
    status: 'ready',
    cause: cause ? CAUSES[cause] : null,
    reading: { hhA: sa.hh, hhB: sb.hh, hvA: sa.hv, hvB: sb.hv, dhh, dhv },
    summary: 'HH went ' + signed(sa.hh) + ' → ' + signed(sb.hh) + ', HV ' + signed(sa.hv) + ' → ' + signed(sb.hv) + ' from A to B.',
    text: lines.join(' ')
  };
}
