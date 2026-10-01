// Local, on-device state. When a backend is connected, profile and consent
// move to the server and this file keeps only UI preferences.
const KEY = 'mm:v2';
const blank = () => ({ v: 2, onboarded: false, consent: null, profile: { name: '', country: '', photo: '' }, preview: false, sent: {} });
function load() {
  try { const s = JSON.parse(localStorage.getItem(KEY)); return s && s.v === 2 ? { ...blank(), ...s } : blank(); }
  catch { return blank(); }
}
export const state = load();
export function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); return true; } catch { return false; }
}
export function wipe() {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
  Object.assign(state, blank());
}
