// Small helpers over the NASA POWER daily series.
export function rainBefore(wx, t, days) {
  if (!wx || !wx.length) return null;
  const day = Math.floor(t / 864e5) * 864e5;
  let sum = 0, n = 0;
  wx.forEach((d) => { if (d.t < day && d.t >= day - days * 864e5 && d.rain !== null) { sum += d.rain; n++; } });
  return n ? sum : null;
}
export function tminOn(wx, t) {
  if (!wx || !wx.length) return null;
  const day = Math.floor(t / 864e5) * 864e5;
  let r = null;
  wx.forEach((d) => { if (d.t === day) r = d.tmin; });
  return r;
}
