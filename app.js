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
