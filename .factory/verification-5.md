# Verify Voice Riff Loop — PASS

- Work order: `voice-riff-loop-verify-5`
- Verified: 2026-09-05 UTC
- Verdict: **PASS**
- Findings: **0**
- Untested public claims: **0**
- Implementation candidate reviewed: `90933b01789364c7c493831cbaf9938308dde534`
- Documentation commit reviewed: `138b71902eb3a6e6cd97c0730b5a32864c32e613`
- Live URL: `https://voice-riff-loop.sociobot.in`

The live JavaScript, CSS, hero image, HTML, and service worker match a fresh
production build from the reviewed implementation. The documentation commit
adds release evidence only; it does not change the product image.

## First screen and sample

Before scrolling, a fresh desktop and 390×844 phone browser both state:

- **Job:** “Make a rhythm loop from your voice.”
- **Audience:** new electronic-music makers who want a first sketch before learning a DAW.
- **First action:** “Try it with sample data”; it says it opens four ready-cut voice sounds.

All three facts are visible in the first phone viewport. Their bottom edges
were 611, 653, and 695 px, within the 844 px viewport. The one-click action
opens `/demo` with THUMP, TSS, AH, and HUM, a persistent “Demo — sample data,
separate from your project” label, Reset demo, and Start for real.

## Claims and clean setup

After `npm ci` (95 packages; zero reported vulnerabilities), every command
declared in `.factory/claims.json` passed independently. Each selected its one
tagged browser test.

| Claim IDs | Result |
|---|---|
| `sample-loop`, `wav-export`, `offline-reload`, `demo-isolation` | PASS |
| `microphone-on-tap`, `local-audio`, `free-core`, `checkout-unavailable` | PASS |
| `supporter-labels`, `project-storage`, `project-transfer` | PASS |
| `license-token`, `license-first-paint` | PASS |

The public copy and README claims are represented by these declared checks.
No public claim was missing, false, incomplete, or untested.

`npm test` passed 2/2 unit tests, `npm run lint` passed, `npm run build`
created `dist/`, and `npm run test:browser` passed 23/23 browser tests. The
production build contains 22,339 B JavaScript (8.42 KB gzip), 9,990 B CSS
(2.86 KB gzip), no web fonts, and a 52,570 B hero WebP.

## Live paths

- The full sample flow produced only same-origin product requests. It played,
  changed tempo, adjusted a cut, exported a valid 1,411,244-byte 16-second
  RIFF WAV, reset, and showed no console or page errors.
- The crossed trim boundary remains synchronized: start `0.97`, end `1`, and
  `PAD 1 · 0.97–1.00 SEC`.
- Invalid project import gives a clear error and Load sample sounds recovers.
  A denied microphone gives a clear recovery message and sample loading still
  works.
- A fresh fake-microphone recording stored a 5,890-byte Opus source, four
  pads, and an enabled loop that survived reload. Project export/import
  restored a 120 BPM project and a 0.12-second cut in a separate browser and
  survived another reload.
- Demo uses `demo:voice-riff-loop`; a direct demo visit did not open the real
  `voice-riff-loop` store. Reset restores the sample and Start for real leaves
  demo mode.
- License restoration sends one GET containing only the supplied token to the
  documented Sociobot verifier, with no request body or audio. The response
  has `Cache-Control: no-store` and origin-specific CORS. A 35-request invalid
  burst allowed requests 1–30, then returned HTTP 429 with `Retry-After: 4`.
- This is a static PWA with no product backend, tenant database, or restart
  path. Backend tenant-isolation and restart-persistence checks do not apply.

## Accessibility, routes, and PWA

`/opt/fleet/lib/verify-url.sh` passed against live `/demo`: status 200, no
console or page errors, correct title/language/one H1/main/alt text, and named
buttons. Live axe coverage found no serious or critical issues on `/`, `/demo`,
`/privacy`, `/terms`, an unknown route, and `/404.html` at both 390 and 1440
px. No scanned interactive target was under 44×44 px and there was no
horizontal overflow.

Keyboard checks passed: the skip link is first, Home/End set tempo to 76/156,
Space starts and stops playback, route changes focus the new H1, and focus is
a visible 4 px outline. Reduced motion removes recording animation and step
transitions. The live 20-run rapid mobile startup sequence had zero page and
console errors.

`/`, `/demo`, `/privacy`, and `/terms` return 200; the intentional unknown
route returns the designed 404 with HTTP 404. Manifest, robots, sitemap, legal
pages, and fallback pages load. Route titles and canonical URLs are correct.
Headers include CSP, HSTS, `nosniff`, and strict-origin referrer policy.

After a connected demo visit, a fresh context reloaded `/demo` offline with
four pads. The service worker cache was `voice-riff-loop-1fe54d9cbe7e`. The
controlled old-worker test displayed Update available, reloaded safely with a
waiting worker, activated the new worker, removed the old cache, and retained
all four pads.

Fresh live Lighthouse 13.0.1 mobile scored 100 performance, 100
accessibility, 100 best practices, and 100 SEO. LCP was 1.1 s, TBT 50 ms, CLS
0, and total transfer 64 KiB.

## Earlier findings

All earlier findings are resolved and rechecked: WAV duration/clipping, paid
purchase copy and privacy disclosure, LCP/focus behavior, target sizes,
reduced motion, fallback CSP, real 404, service-worker update/caching, project
transfer, trim boundary synchronization, invalid-license copy, playback during
navigation, canonical URLs, the demo startup race, first-phone-screen facts,
and variable mobile performance. The 20-run live startup regression and the
fresh Lighthouse result specifically confirm the last repair.

## Evidence

- `.factory/qa-5/verify-live/verify.json` and screenshots: fresh live page check.
- `.factory/qa-5/lighthouse-live-mobile.json`: fresh live Lighthouse report.
- `.factory/qa-4/live-qa.json`: live sample, accessibility, keyboard, offline, and recovery checks rerun against this deployment.
- `.factory/qa-4/platform-qa.json`, `race-repro.json`, and `update-qa.json`: recording/transfer/license, 20-run startup, and update checks rerun against this deployment.
