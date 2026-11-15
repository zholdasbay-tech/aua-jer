export function fmtDay(t) {
  return new Date(t).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
}
export function fmtShort(t) {
  return new Date(t).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
}
export function ymd(ms) {
  const d = new Date(ms);
  return '' + d.getUTCFullYear() + ('0' + (d.getUTCMonth() + 1)).slice(-2) + ('0' + d.getUTCDate()).slice(-2);
}
export function daysBetween(t0, t1) {
  return Math.round(Math.abs(Date.parse(t1) - Date.parse(t0)) / 864e5);
}
export const signed = (v, digits = 0) => (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v).toFixed(digits);
export const num = (v) => Math.round(v).toLocaleString('en-US');
export const plural = (n, one, many) => n + ' ' + (n === 1 ? one : many || one + 's');
export function dirWord(dir) {
  return dir === 'ASCENDING' ? 'northbound' : dir === 'DESCENDING' ? 'southbound' : String(dir || '').toLowerCase();
}
