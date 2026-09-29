# MirrorMatch (early preview)

A mobile-first web app (PWA). No build step: plain HTML, CSS and JavaScript.
Face matching is NOT live. Preview Mode shows labelled sample content only.

## Try it on a computer
Run `python3 -m http.server 8000` in this folder and open http://localhost:8000
(opening index.html directly will not work, because the app uses modules).

## Free deployment (pick one)
**Cloudflare Pages** (pages.cloudflare.com): Create project, Upload assets, drag this folder in. No build command.
**Netlify** (app.netlify.com/drop): drag this folder onto the page.
You get an https address; open it on your phone and use Add to Home Screen.

## Updating later
Change `VERSION` in `sw.js` on every release so installed apps refresh.

## Structure
index.html, manifest.webmanifest, sw.js, _headers (security headers),
css/style.css, js/app.js (screens), js/ui.js (safe rendering), js/store.js (local data),
js/api.js (backend connection point), icons/, docs/BACKEND.md
