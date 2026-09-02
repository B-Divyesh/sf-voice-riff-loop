# Independent verification 2 — FAIL

- Candidate commit: `653c76bf838bd6f2fa0ffd2a238847520ed12cbc`
- Live URL: `https://voice-riff-loop.sociobot.in`
- Verified: 2026-09-02 UTC
- Work order: `voice-riff-loop-verify-2`
- Verdict: **FAIL — do not release this candidate.**

The required first-read and demo gates pass, every declared claim test passes,
and the deployed JS exactly matches this commit. A reproducible route change
after starting playback leaves a loop timer running against removed DOM
controls, causing a page error. That fails the no-console-error/end-to-end
quality gate.

## Mandatory first checks

`.factory/claims.json` is present and lists 12 claims. From this clean clone,
after `npm ci`, I ran every exact command before broader QA. Every command
passed with one Playwright test:

| Claim IDs whose exact tagged command passed |
|---|
| `sample-loop`, `wav-export`, `offline-reload`, `demo-isolation` |
| `microphone-on-tap`, `local-audio`, `free-core`, `checkout-unavailable` |
| `supporter-labels`, `project-storage`, `license-token`, `license-first-paint` |

The cold live first screen plainly answers all three required questions:

- **What it does:** “Make a rhythm loop from your voice.”
- **For whom:** “For new electronic-music makers who want a first sketch before learning a DAW.”
- **What to do first:** “Try it with sample data”; adjacent copy says it opens four ready-cut voice sounds.

That action opens `/demo` in one click with THUMP, TSS, AH, and HUM already
loaded. The persistent demo banner says that data is separate, and provides
both Reset demo and Start for real.

## Clean local gates

| Gate | Result |
|---|---|
| `npm ci` | PASS — 95 packages installed; 0 vulnerabilities reported |
| `npm test` | PASS — 2 Vitest tests |
| `npm run lint` | PASS — `tsc --noEmit` |
| `npm run build` | PASS — generated `dist/` |
| `npm run test:browser` | PASS — 14 Playwright tests |

The production build contains 18,126 B raw / 7,090 B gzip JavaScript and
9,556 B raw / 2,760 B gzip CSS. The 269,350 B hero WebP and all initial asset
budgets are within the stated static-PWA caps.

## Live deployment and product checks

- **Deployment identity: PASS.** The live JS
  `assets/index-WtClEOZc.js` SHA-256 is
  `a8f0b7a09f12af5a5842d171ca9822bca9692f9da2877b243d90114da74e434e`,
  exactly matching the local production build.
- **Headers/caching: PASS.** Root and assets return CSP, HSTS,
  `X-Content-Type-Options: nosniff`, and strict-origin referrer policy. The
  hashed JS is `Cache-Control: public, max-age=31536000, immutable`; `sw.js`
  is `no-cache`.
- **Privacy: PASS for the demo flow.** A fresh live `/demo` play/edit/export/
  reset session produced only same-origin requests. Restore purchase sends the
  entered token only to the documented Sociobot verification endpoint; it
  sends no audio.
- **PWA/offline: PASS.** After a connected visit, the live service worker was
  active and controlling the page; a fresh context reloaded `/demo` offline
  with the loop maker visible.
- **Rate limit: PASS.** A single client made 35 invalid verification requests.
  The first 30 returned 200; request 31 returned `429` with `Retry-After: 3`.
- **Desktop/mobile/accessibility: PASS for scanned baseline.** Axe reported no
  serious or critical issues on `/`, `/demo`, `/privacy`, `/terms`, and the
  404 route at 1440 px and 390 px. At 390 px there was no horizontal overflow;
  keyboard traversal reached all controls with a visible 4 px focus outline;
  reduced motion disabled the record pulse. Tempo keyboard boundaries were
  76 and 156 BPM. A denied microphone gave the actionable recovery message
  “Microphone access was not granted. Allow it in your browser, then try
  recording again.”
- **Manual core flow: PASS apart from the defect below.** Demo pads play,
  trim controls accept boundaries, 76/112/156 BPM WAV exports pass their
  duration and PCM checks, reset restores the sample, real project tempo
  survives refresh, and invalid license restoration gives an actionable
  response.

## Defects

### High severity

1. **Internal navigation while a loop is playing throws an uncaught page
   error and leaves the loop running.** Reproduction on the deployed site:
   open `/demo`, click **Play loop**, wait for playback to begin, then use the
   header **Privacy** link. The privacy page renders, but Playwright records
   `Cannot set properties of null (setting 'textContent')`. The background
   loop timer calls `refreshTransport()` after the route has removed
   `#play-loop`. This is a real normal user path and violates the no-console-
   error/end-to-end requirement. Stop playback and clear the timer before
   replacing app content; add a regression test for this route transition.

### Medium severity

2. **The required Lighthouse performance gate is not established.** A fresh
   mobile Lighthouse attempt returned provisional performance **84** and
   accessibility 100, with LCP 2.2 s, CLS 0, and TBT 590 ms, then ended with
   `TARGET_CRASHED` while capturing the full-page screenshot. The run cannot
   substantiate the required mobile performance ≥90. Re-run successfully in
   the release environment after repairing the route-playback error and record
   a complete report.

3. **SPA routes retain the landing page canonical URL.** Direct `/demo`,
   `/privacy`, and `/terms` all serve the shared HTML whose canonical link is
   `https://voice-riff-loop.sociobot.in/`, rather than each route's URL. This
   does not break the app, but it fails the required per-route canonical
   metadata contract.

## Release decision

**FAIL.** The candidate is not releasable until playback is stopped safely on
route changes and the complete Lighthouse mobile performance check is green.
The canonical metadata issue should be corrected in the same repair.
