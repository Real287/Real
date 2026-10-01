// Safe rendering helpers. Every value placed in a template is HTML-escaped
// unless it was explicitly marked with raw() (only our own static markup).
class Raw { constructor(s) { this.s = s; } }
export const raw = s => new Raw(s);
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const part = x => Array.isArray(x) ? x.map(part).join('') : x instanceof Raw ? x.s : esc(x);
export function h(st, ...v) { let o = st[0]; v.forEach((x, i) => { o += part(x) + st[i + 1]; }); return new Raw(o); }

// Text from inputs: strip control chars and angle brackets, trim, cap length.
export const cleanText = (s, n = 40) => String(s || '').replace(/[\u0000-\u001f\u007f<>]/g, '').trim().slice(0, n);
// Only accept photos this app itself produced.
export const safePhoto = s => /^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(s || '') ? s : '';

const P = {
  camera: '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>',
  discover: '<circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>',
  heart: '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>',
  chat: '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>',
  user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  sliders: '<line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
  logo: '<path d="M8 3l5 9-5 9-5-9z"/><path d="M16 3l5 9-5 9"/>'
};
export const icon = n => raw(`<svg viewBox="0 0 24 24" aria-hidden="true">${P[n]}</svg>`);

export function toast(msg) {
  const t = document.createElement('div');
  t.className = 'toast'; t.textContent = msg;
  document.getElementById('toasts').appendChild(t);
  setTimeout(() => t.remove(), 3200);
}

// Centre-crop to a square, shrink, and re-encode as JPEG. This also strips
// EXIF data (including GPS location) from the photo.
export async function resizeImage(file, max = 512) {
  if (!file.type.startsWith('image/')) throw new Error('Please choose an image file.');
  if (file.size > 20e6) throw new Error('That image is too large. Try one under 20 MB.');
  let bmp;
  try { bmp = await createImageBitmap(file); } catch { throw new Error('That image could not be read. Try a JPG or PNG.'); }
  const s = Math.min(bmp.width, bmp.height), size = Math.min(max, s);
  const c = document.createElement('canvas'); c.width = c.height = size;
  c.getContext('2d').drawImage(bmp, (bmp.width - s) / 2, (bmp.height - s) / 2, s, s, 0, 0, size, size);
  return c.toDataURL('image/jpeg', 0.85);
}
