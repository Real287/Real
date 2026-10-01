// The ONLY place the app talks to a backend. Screens never call a server
// directly, so connecting a real backend later means editing this file only.
// See docs/BACKEND.md for the plan. Until then everything reports "not live".
const notLive = async () => { throw new Error('The MirrorMatch backend is not connected yet.'); };
export const backend = {
  live: false,
  label: 'Not connected',
  signIn: notLive,          // email / phone login
  saveConsent: notLive,     // store consent record server-side
  uploadPhoto: notLive,     // private storage + face embedding
  listMatches: notLive,     // similarity search results (real ones only)
  requestConnection: notLive, // mutual-consent handshake
  sendMessage: notLive,     // only allowed after mutual acceptance
  deleteAccount: notLive    // erase profile, photo and embedding
};
