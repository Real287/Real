import { h, raw, cleanText, safePhoto, resizeImage, toast, icon } from './ui.js';
import { state, save, wipe } from './store.js';
import { backend } from './api.js';

const CONSENT_VERSION = '2026-09-draft';
const $ = s => document.querySelector(s);
const screen = $('#screen'), app = $('#app');
let step = 0, deferredInstall = null;
const draft = { age: false, bio: false, terms: false, name: '', country: '', photo: '' };

const regions = 'NG GH KE ZA EG MA ET TZ UG SN US CA MX BR AR CO CL PE GB IE FR DE ES IT NL SE PL TR IN PK BD ID PH VN TH CN JP KR AU NZ SA AE'.split(' ');
let names; try { const dn = new Intl.DisplayNames(['en'], { type: 'region' }); names = regions.map(c => dn.of(c)); } catch { names = regions; }
const countries = names.sort();
const SAMPLES = [{ id: 's1', place: 'Canada', hue: 0 }, { id: 's2', place: 'Ghana', hue: 1 }, { id: 's3', place: 'Brazil', hue: 2 }];

const photoBtn = (src, short) => { const p = safePhoto(src); return h`<button class="upload ${short ? 'short' : ''}" data-act="pick" aria-label="Choose a photo">${p ? h`<img src="${p}" alt="Your photo">` : h`<div>${icon('camera')}<b>Add your photo</b><br><small>Choose a clear photo of your face</small></div>`}</button>`; };
const countrySelect = sel => h`<select class="input" id="country" name="country"><option value="">Prefer not to say</option>${countries.map(c => h`<option value="${c}" ${c === sel ? raw('selected') : ''}>${c}</option>`)}</select>`;
const readCountry = () => { const v = $('#country')?.value; return countries.includes(v) ? v : ''; };
const empty = (ic, title, text, btn) => h`<div class="empty"><div class="ico">${icon(ic)}</div><h2>${title}</h2><p class="muted">${text}</p>${btn || ''}</div>`;
const banner = () => h`<div class="preview-banner"><b>Preview Mode.</b> Everything below is sample content. These are not real people, and no face matching has been run.</div>`;
const avatar = hue => h`<div class="avatar h${hue}">${icon('user')}</div>`;

// ---------- Onboarding ----------
function onboarding() {
  const dots = h`<div class="dots">${[0, 1, 2].map(i => h`<i class="${i <= step ? 'on' : ''}"></i>`)}</div>`;
  if (step === 0) return h`${dots}<section class="welcome"><div class="logo">${icon('logo')}</div><h1>Meet someone who looks like you.</h1><p class="lead">MirrorMatch is being built to connect people with strikingly similar faces, only when both sides say yes.</p><div class="card notice"><b>Early preview</b><p class="muted">Face matching is not live yet. You can set up your profile and explore sample screens while the secure backend is built.</p></div><button class="primary" data-act="next">Get started</button></section>`;
  if (step === 1) return h`${dots}<h2>Before you begin</h2><p class="lead">Face photos are sensitive biometric data. Please confirm each point.</p><div class="card">
    <label class="check"><input type="checkbox" data-draft="age" ${draft.age ? raw('checked') : ''}><span>I am 18 or older.</span></label>
    <label class="check"><input type="checkbox" data-draft="bio" ${draft.bio ? raw('checked') : ''}><span>I agree that MirrorMatch may create a face profile from my photo to find similar faces once matching is live. I can withdraw this and delete my data at any time.</span></label>
    <label class="check"><input type="checkbox" data-draft="terms" ${draft.terms ? raw('checked') : ''}><span>I only upload photos of myself, and I agree to the terms and privacy notice.</span></label></div>
    <p class="muted">Draft terms. They will be reviewed before public launch. For now, everything you enter stays on this device.</p>
    <button class="primary" id="next" data-act="next" ${draft.age && draft.bio && draft.terms ? '' : raw('disabled')}>Agree and continue</button><button class="secondary" data-act="back">Back</button>`;
  return h`${dots}<h2>Set up your profile</h2><p class="lead">Only your display name and country are ever shown to others. You can skip the photo for now.</p><div class="card">${photoBtn(draft.photo)}<label for="name">Display name</label><input class="input" id="name" maxlength="40" autocomplete="nickname" placeholder="What should people call you?" value="${draft.name}"><label for="country">Country (optional)</label>${countrySelect(draft.country)}</div><button class="primary" data-act="finish">Finish setup</button><button class="secondary" data-act="back">Back</button>`;
}

// ---------- Main screens ----------
function discover() {
  const p = state.profile;
  return h`<section class="hero"><h1>Meet someone who looks like you.</h1><p class="lead">Add a photo, and once matching is live you will see people who look like you. Nobody can contact you unless you both agree.</p></section>
  <div class="card notice"><b>Face matching is not live yet</b><p class="muted">Your photo stays on this device and has not been analysed. Nothing on this screen is a real match.</p></div>
  <div class="card">${photoBtn(p.photo)}<button class="primary" data-act="find">Find my lookalikes</button></div>
  <div class="card"><div class="row"><b>How it will work</b><span class="pill">Private by design</span></div><ul class="steps">
  <li><span>1</span><div><b>Add your photo</b><div class="muted">Available now, stored on your device only.</div></div></li>
  <li><span>2</span><div><b>Create a face profile</b><div class="muted">Coming with live launch.</div></div></li>
  <li><span>3</span><div><b>See similar people</b><div class="muted">Coming with live launch.</div></div></li>
  <li><span>4</span><div><b>Connect if you both agree</b><div class="muted">Coming with live launch.</div></div></li></ul></div>`;
}
function matches() {
  if (!state.preview) return h`<h2>Your lookalikes</h2>${empty('heart', 'No lookalikes yet', 'Face matching is not switched on, so there are no results to show. When it launches, real matches will appear here.', h`<button class="secondary" data-act="preview-on">Preview how this will look</button>`)}`;
  return h`<h2>Your lookalikes</h2>${banner()}${SAMPLES.map((s, i) => h`<div class="card match">${avatar(s.hue)}<div><h3>Sample profile ${i + 1}</h3><div class="muted">${s.place}</div><span class="pill sample">Sample</span></div><div class="end"><button class="secondary small" data-act="request" data-id="${s.id}" ${state.sent[s.id] ? raw('disabled') : ''}>${state.sent[s.id] ? 'Requested' : 'Request'}</button></div></div>`)}<p class="muted">No similarity scores are shown because none are calculated. In the live app, chat opens only after both people accept.</p>`;
}
function messages() {
  if (!state.preview) return h`<h2>Messages</h2>${empty('chat', 'No conversations yet', 'When two people both accept a connection, your chat will appear here.', h`<button class="secondary" data-act="preview-on">Preview how this will look</button>`)}`;
  return h`<h2>Messages</h2>${banner()}<div class="card"><div class="match">${avatar(0)}<div><h3>Sample profile 1</h3><span class="pill sample">Sample conversation</span></div></div>
  <div class="bubble">Hi! This is a sample message, so you can see how chats will look.</div><div class="bubble me">Nice. And this is what your reply would look like.</div><div class="bubble">Real chats will only open after you both accept a connection.</div>
  <div class="composer"><input class="input" disabled placeholder="Chat is off in preview" aria-label="Message"><button class="primary small" disabled>Send</button></div></div>`;
}
function profile() {
  const p = state.profile;
  return h`<h2>Your profile</h2><div class="card">${photoBtn(p.photo, true)}<label for="name">Display name</label><input class="input" id="name" maxlength="40" value="${p.name}" placeholder="Your display name"><label for="country">Country</label>${countrySelect(p.country)}<button class="primary" data-act="save">Save profile</button></div>
  <div class="card"><div class="row"><b>Privacy</b><span class="pill">${icon('shield')}</span></div><p class="muted">Your photo is stored on this device only. It is shrunk and re-saved without location data. Your exact location is never collected. Connections will always need both people to agree.</p><button class="danger" data-act="wipe">Delete my data</button></div>`;
}
function settings() {
  const c = state.consent;
  return h`<h2>Settings</h2><div class="card"><label class="toggle"><span><b>Preview Mode</b><div class="muted">Show clearly labelled sample profiles and chats.</div></span><input type="checkbox" role="switch" data-pref="preview" ${state.preview ? raw('checked') : ''}></label></div>
  <div class="card"><b>Status</b><p class="muted">Backend: ${backend.label}. Face matching: off. Your data: on this device only.</p>${c ? h`<p class="muted">Consent recorded on this device: ${new Date(c.at).toLocaleDateString()} (terms ${c.version}).</p>` : ''}</div>
  <div class="card"><b>Install the app</b><p class="muted">${deferredInstall ? 'Add MirrorMatch to your home screen.' : 'On iPhone: tap Share, then Add to Home Screen. On Android: open the browser menu and choose Install app.'}</p>${deferredInstall ? h`<button class="primary" data-act="install">Install</button>` : ''}</div>
  <button class="danger" data-act="wipe">Delete my data</button>`;
}
const routes = { discover, matches, messages, profile, settings };
const TABS = [['discover', 'Discover', 'discover'], ['matches', 'Matches', 'heart'], ['messages', 'Messages', 'chat'], ['profile', 'Profile', 'user']];

// ---------- Shell ----------
$('#top').innerHTML = h`<div class="logo">${icon('logo')}</div><div><b>MirrorMatch</b><small>Early preview. Matching not live yet.</small></div><button class="iconbtn" data-go="settings" aria-label="Settings">${icon('sliders')}</button>`.s;
$('#nav').innerHTML = h`${TABS.map(t => h`<button data-go="${t[0]}">${icon(t[2])}<span>${t[1]}</span></button>`)}`.s;

function render() {
  app.classList.toggle('onboarding', !state.onboarded);
  if (!state.onboarded) { screen.innerHTML = onboarding().s; return; }
  const r = location.hash.replace('#/', ''), route = routes[r] ? r : 'discover';
  document.querySelectorAll('nav button').forEach(b => b.classList.toggle('active', b.dataset.go === route));
  screen.innerHTML = routes[route]().s;
  window.scrollTo(0, 0);
}
function sync() { // keep unsaved field edits when the screen redraws
  const n = $('#name'); if (!n) return;
  const target = state.onboarded ? state.profile : draft;
  target.name = cleanText(n.value); target.country = readCountry();
}

const actions = {
  next() { step++; render(); },
  back() { step--; render(); },
  pick() { $('#file').click(); },
  finish() {
    sync(); if (!draft.name) return toast('Add a display name to continue.');
    state.profile = { name: draft.name, country: draft.country, photo: draft.photo };
    state.consent = { age18: true, biometric: true, terms: true, at: new Date().toISOString(), version: CONSENT_VERSION };
    state.onboarded = true; if (!save()) toast('Could not save on this device. Check your browser storage settings.');
    location.hash = '#/discover'; render();
  },
  find() { if (!state.profile.photo) return toast('Add a photo first.'); location.hash = '#/matches'; toast('Face matching is not live yet, so there are no results.'); },
  'preview-on'() { state.preview = true; save(); render(); },
  request(id) { if (SAMPLES.some(s => s.id === id)) { state.sent[id] = true; save(); render(); toast('Sample request only. Nobody was contacted.'); } },
  save() { sync(); save(); toast('Profile saved.'); },
  install() { deferredInstall?.prompt(); deferredInstall = null; render(); },
  wipe() {
    if (!confirm('Delete your profile, photo and consent from this device? This cannot be undone.')) return;
    wipe(); step = 0; Object.assign(draft, { age: false, bio: false, terms: false, name: '', country: '', photo: '' });
    location.hash = ''; render(); toast('Your data was deleted from this device.');
  }
};
document.addEventListener('click', e => {
  const go = e.target.closest('[data-go]'); if (go) { location.hash = '#/' + go.dataset.go; return; }
  const el = e.target.closest('[data-act]'); if (el) actions[el.dataset.act]?.(el.dataset.id);
});
document.addEventListener('change', e => {
  const d = e.target.dataset;
  if (d.draft) { draft[d.draft] = e.target.checked; const n = $('#next'); if (n) n.disabled = !(draft.age && draft.bio && draft.terms); }
  if (d.pref === 'preview') { state.preview = e.target.checked; save(); }
});
$('#file').addEventListener('change', async e => {
  const f = e.target.files[0]; e.target.value = ''; if (!f) return;
  try {
    const url = await resizeImage(f); sync();
    if (state.onboarded) { state.profile.photo = url; save(); } else draft.photo = url;
    render();
  } catch (err) { toast(err.message); }
});
window.addEventListener('hashchange', render);
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredInstall = e; });
if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
render();
