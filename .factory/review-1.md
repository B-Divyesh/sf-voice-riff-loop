# Voice Riff Loop review 1 — Make a rhythm loop from your voice

- Work order: voice-riff-loop-review-1
- Reviewed: 2026-09-05 UTC
- Verdict: **PASS**
- Findings: **0**
- Untested public claims: **0**
- Implementation candidate: 90933b01789364c7c493831cbaf9938308dde534
- Documentation baseline: 138b71902eb3a6e6cd97c0730b5a32864c32e613
- Evidence/report baseline: 834f1d84728798c38c1be18bda6bcb6f39797a88
- Live URL: https://voice-riff-loop.sociobot.in

## Job, audience, and first action

The product lets a person make a short rhythm loop from their own voice.

It is for new electronic-music makers who want a first sketch before learning a DAW.

The first action is **Try it with sample data**. It says that it opens four ready-cut voice sounds.

Fresh desktop and 390×844 phone visits showed the job, audience, action explanation, and all three facts before scrolling. On the phone, the action explanation and fact bottoms were 551, 611, 653, and 695 px, inside the 844 px viewport.

## Demo and core job

The one-click demo opened four ready-cut pads, THUMP, TSS, AH, and HUM. It displayed the persistent **Demo — sample data, separate from your project** label with Reset demo and Start for real.

Fresh direct-demo contexts opened only demo:voice-riff-loop before any real project was opened. Thirty direct-demo change-and-reset runs and ten landing-to-demo runs all reset 156 BPM back to 112 BPM with no errors.

A live sample flow played, changed tempo, adjusted a cut, exported a 1,411,244-byte RIFF WAV measuring exactly 16 seconds, reset, rejected a malformed project with a clear message, and recovered through Load sample sounds. The demo flow made only same-origin requests.

A fresh fake-device microphone run kept Play loop disabled before recording, started only after Record your voice, produced a 0.8-second source, enabled playback, and survived reload. A denied microphone displayed a clear next step and then recovered through sample loading. Live project export/import restored 120 BPM and a 0.12-second cut in a separate context and after reload. An invalid license response said that new supporter purchases are unavailable and showed no checkout link.

## Claims and clean checkout

I created a clean local clone at 834f1d8, installed prerequisites with npm ci, and ran every exact command in .factory/claims.json independently. All passed:

| Claims | Result |
|---|---|
| sample-loop, wav-export, offline-reload, demo-isolation | PASS |
| microphone-on-tap, local-audio, free-core, checkout-unavailable | PASS |
| supporter-labels, project-storage, project-transfer | PASS |
| license-token, license-first-paint | PASS |

The clean clone also passed npm test (2/2), npm run lint, npm run build, and npm run test:browser (23/23). The production build created dist/; it contains 22,339 B raw JavaScript (8.42 KB gzip), 9,990 B raw CSS (2.86 KB gzip), no web fonts, and a 52,570 B hero WebP.

The landing copy, README, privacy, terms, and app text were checked against .factory/claims.json. Every public promise has an observable claim check. No unlisted, false, incomplete, or untested public claim remains.

## Live quality checks

- The live HTML, JavaScript, CSS, and service worker matched the fresh implementation build byte-for-byte. SHA-256 matched for index.html, index-yEkv5dPx.js, index-DIBTEM4Q.css, and sw.js.
- verify-url.sh passed on live /demo: HTTP 200, no console or page errors, correct title, language, one H1, main landmark, image alt text, and named controls.
- Axe found no serious or critical issue on /, /demo, /privacy, /terms, the designed unknown route, or /404.html at 390 px. There was no horizontal overflow and no visible target smaller than 44×44 px. Keyboard checks confirmed the skip link first, 76/156 BPM Home/End limits, Space playback, visible 4 px focus, reduced-motion animation removal, and route-change H1 focus.
- /, /demo, /privacy, /terms, /manifest.webmanifest, /robots.txt, /sitemap.xml, /offline.html, and /404.html returned 200. The deliberate unknown route returned the designed 404 with HTTP 404. Route titles and canonical URLs were correct. The 404 and offline fallback pages emitted no console errors.
- After a connected visit, a new browser context reloaded live /demo offline with all four pads and no errors. The controlled update test against the exact candidate worker showed Update available, activated the replacement worker, removed the old cache, retained four pads, and emitted no page error.
- Live headers include CSP, HSTS, nosniff, and strict-origin referrer policy. Hashed assets use immutable caching and sw.js uses no-cache.
- Fresh mobile Lighthouse 13.0.1 scored 100 performance, 100 accessibility, 100 best practices, and 100 SEO. LCP was 0.2 s, TBT 0 ms, and CLS 0.

This is a static PWA with no product backend or tenant database. Backend tenant isolation, restart persistence, health endpoint, and live rate-limit checks do not apply.

## Earlier findings

| Earlier finding | Current disposition |
|---|---|
| Variable or too-short WAV export and its incomplete quantitative test | Resolved. The exact claim checks 76, 112, and 156 BPM; live export measured 16 seconds. |
| Broken supporter checkout | Resolved by removing new-purchase availability and testing that no checkout link is offered. |
| Absolute privacy wording omitted license-token traffic | Resolved. Privacy text states that only the license token is sent to Sociobot; sample audio flow stayed same-origin. |
| LCP suppression from initial focus | Resolved. Fresh Lighthouse has a normal LCP and scores 100. |
| Small targets, weak focus, and reduced-motion pulse | Resolved. Fresh target, focus, keyboard, reduced-motion, and axe checks pass. |
| Missing claim coverage | Resolved. Thirteen declared claims all passed independently. |
| CSP errors on fallback pages | Resolved. Fresh /404.html and /offline.html visits produced no console errors. |
| Unknown path returned 200 | Resolved. A deliberate unknown route returned the designed page with HTTP 404. |
| Missing service-worker update path and immutable asset caching | Resolved. Controlled update and live cache-header checks pass. |
| License validation blocked first paint or lacked legal disclosure | Resolved. The first-paint claim passes; terms and privacy disclose the remaining license flow. |
| Playback error during route change | Resolved. Live playback-to-Privacy navigation produced no error and focused the new H1. |
| Missing route-specific canonical URLs | Resolved. Live /demo, /privacy, and /terms canonical URLs match their routes. |
| Crossed trim handles desynchronised | Resolved. The claim suite and live trim flow keep the controls and readout synchronized. |
| Touch targets were below 44×44 px | Resolved. Fresh mobile and desktop target scans found none below the requirement. |
| Invalid-license message suggested unavailable purchase | Resolved. Fresh rejected-license state names the unavailable purchase status and has no checkout link. |
| No portable project export/import | Resolved. Fresh live transfer restored recording settings and survived reload. |
| Rapid demo-start keyboard race | Resolved. The 20-run regression passed in the clean browser suite; fresh reset stress also had no page error. |
| Required mobile facts were below the first screen | Resolved. All four required action/fact items fit in the fresh 390×844 first viewport. |
| Variable mobile performance | Resolved. Fresh live mobile Lighthouse scored 100. |

## Evidence

- .factory/review-1/verify-live/verify.json
- .factory/review-1/live-home-desktop.png
- .factory/review-1/live-home-phone.png
- .factory/review-1/live-demo-desktop.png
- .factory/review-1/live-demo-phone.png
- .factory/review-1/lighthouse-live-mobile.json

**Final verdict: PASS — zero findings and zero untested public claims.**
