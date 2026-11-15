// Remembered preferences. Everything is optional: a blocked localStorage just means defaults.
const KEY = 'aua-jer.prefs';
export function loadPrefs() {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch { return {}; }
}
export function savePrefs(patch) {
  try { localStorage.setItem(KEY, JSON.stringify({ ...loadPrefs(), ...patch })); } catch { /* ignore */ }
}
