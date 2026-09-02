# Independent verification 3 — FAIL

- Candidate commit: `3b2faf0ed23274c650821b79d8604397475eced4`
- Live URL: `https://voice-riff-loop.sociobot.in`
- Verified: 2026-09-02 UTC
- Work order: `voice-riff-loop-verify-3`
- Verdict: **FAIL — do not release this candidate.**

The first-read gate, all 12 declared claim tests, clean local gates, deployment
identity, privacy checks, PWA update/offline checks, and performance budgets
pass. The candidate still fails the required core boundary and touch-target
checks: crossing the trim handles leaves the controls visibly inconsistent
with the cut that will play/export, and several links are narrower than the
mandatory 44 px target.

## Mandatory first checks

`.factory/claims.json` exists with 12 claims and exactly one matching
`@claim:<id>` test per entry. After the clean-clone dependency install, every
listed command was run separately before broader QA. Each selected one test
and passed:

| Claim | Exact test result |
|---|---|
| `sample-loop` | PASS — 1 test |
| `wav-export` | PASS — 1 test; checks 76, 112, and 156 BPM, 16-second duration, and unclipped PCM |
| `offline-reload` | PASS — 1 test in its own browser context |
| `demo-isolation` | PASS — 1 test |
| `microphone-on-tap` | PASS — 1 test |
| `local-audio` | PASS — 1 test over play/edit/export/reset traffic |
| `free-core` | PASS — 1 test |
| `checkout-unavailable` | PASS — 1 test |
| `supporter-labels` | PASS — 1 test with the fixture verification response |
| `project-storage` | PASS — 1 test |
| `license-token` | PASS — 1 test |
| `license-first-paint` | PASS — 1 test |

The cold live first screen passes. It says what the product does (“Make a
rhythm loop from your voice”), who it is for (“new electronic-music makers”),
and what to click first (“Try it with sample data”). The adjacent sentence
says that the action opens four ready-cut voice sounds. One click opens
`/demo`, already populated with THUMP, TSS, AH, and HUM, plus the persistent
demo/reset/start-real banner. Evidence: [cold desktop](qa-3/live-cold-desktop.png)
and [live 390 px demo](qa-3/live-demo-mobile.png).

## Clean local gates

| Gate | Result |
|---|---|
| `npm ci` | PASS — 95 packages installed; 0 vulnerabilities |
| `npm test` | PASS — 2 Vitest tests |
| `npm run lint` | PASS — `tsc --noEmit` |
| `npm run build` | PASS — exact production build generated `dist/` |
| `npm run test:browser` | PASS — 17 Playwright tests |
| `/opt/fleet/lib/verify-url.sh` | PASS — title, `lang`, one H1, main landmark, image alt, and no page/console errors |

The production build is 18,583 B raw / 7.27 KB gzip JavaScript, 9,577 B raw /
2.76 KB gzip CSS, and a 52,570 B hero WebP. There are no downloaded fonts.
These are comfortably inside the 200 KB JS, 50 KB CSS, 120 KB font, and
300 KB hero budgets.

## Deployment identity and platform checks

The deployed artifact matches the candidate's fresh production build
byte-for-byte:

| File | Local and live SHA-256 |
|---|---|
| `index.html` | `6ac9e38af2c0a8b51b6667e2a12a730a91306ef5c9567e746481aa826c6262f5` |
| `assets/index-1Nr83i6P.js` | `12bdc3734067316fe20cb16238c6e9a8affa9a8fcd77c063d321a777bfad0d5d` |
| `assets/index--zBXXhJk.css` | `f58396cbe840381dc9df84b868a447780b544269cd787313dd932c1756cbd2df` |
| hero WebP | `aa24eff4322402cb13b616f243dca5a23d4699dae3eeb17940e39152b46fc7b9` |
| `sw.js` | `e974af3160e3ca9edf94fddcd674a046d15595de7e222ae134a9329e8462b65f` |

- `/`, `/demo`, `/privacy`, and `/terms` return 200. An unknown route returns
  a styled 404 response with a way home. All discovered links return 200.
- Route titles and canonical URLs are correct. The manifest parses through
  Chromium with no errors and supplies standalone mode plus 192/512 maskable
  icons.
- HTML sends CSP, HSTS, `nosniff`, and strict-origin referrer policy headers.
  Hashed assets are cached for one year with `immutable`; `sw.js` is
  `no-cache`.
- A fresh service worker activated with cache
  `voice-riff-loop-f5570de086aa`. A warmed `/demo` reloaded offline with four
  pads and an enabled loop. An update test started with an intercepted older
  worker, requested the actual live worker, observed the **Update available**
  action, activated it, removed the old cache, reloaded, and kept the demo
  intact without errors.

## End-to-end and privacy evidence

- A fresh live session with a fake microphone began with play/export disabled.
  Record then stop produced a decodable one-second source, enabled pad play and
  export, and survived reload in IndexedDB.
- Tempo accepted its 76 and 156 BPM boundaries. The downloaded 44.1 kHz WAV
  was exactly 16 seconds, 1,411,244 bytes, and peaked at 29,490 rather than
  clipping.
- Starting playback, navigating to Privacy, and going Back produced no page
  error and returned with transport stopped.
- Direct `/demo` opened only `demo:voice-riff-loop`. Reset restored 112 BPM and
  the 0.00–1.00 pad-one cut. Starting for real then opened the separate
  `voice-riff-loop` database with no demo banner and no sample loaded.
- Cold load and the complete record/play/edit/export/navigation/reload flow
  made only same-origin requests. No analytics, CDN, audio upload, or other
  third-party request was observed.
- Restore purchase made one GET to the documented Sociobot verification URL,
  with the entered token in the query, no request body, and no audio. The API
  returned `Cache-Control: no-store` and origin-specific CORS.
- The verification endpoint enforces a per-client burst allowance: in the
  first isolated burst, requests 1–30 returned 200 and request 31 returned
  429. A 429 response included `Retry-After` (observed value: 1 second) and
  `X-RateLimit-After`.

## Accessibility, mobile, and performance

- Axe found zero serious/critical findings on `/`, `/demo`, `/privacy`,
  `/terms`, and the 404 page at 1440 px and 390 px. Normal application routes
  had no console or page errors and no horizontal overflow.
- Keyboard order begins with the skip link. Tempo reaches 76/156 with
  Home/End; Space/Enter operate playback; route changes focus the destination
  H1. Every sampled focus indicator was a visible 4 px blue or acid outline.
- With reduced motion requested, recording animation is `none`, step
  transitions are `0s`, and smooth scrolling is disabled.
- Fresh throttled mobile Lighthouse 13.0.1 runs scored 90 and 94 performance;
  both scored 100 accessibility, best practices, and SEO. LCP was 1.2 s, CLS
  was 0, and total transfer was 64 KiB. A direct interaction sample observed a
  maximum Event Timing duration of 32 ms, below the 200 ms interaction budget.
  Evidence: [run 1](qa-3/lighthouse-live-mobile.json) and
  [run 2](qa-3/lighthouse-live-mobile-2.json).

## Defects

### High severity — release blocking

1. **The core trim controls desynchronise at crossed boundary values.** On
   live `/demo`, focus **Start** and press End. The Start input reports `4`
   seconds while End reports `1`, but the cut readout says `0.97–1.00 SEC`.
   Focus **End** and press Home; the controls now visibly show Start at the far
   right and End at the far left (`4` and `0`) while the saved/readout cut
   remains `0.97–1.00`. The app clamps only its model and does not write the
   clamped value back to the active range input. Selecting another pad and
   returning repairs the display, but no feedback explains that recovery.
   This fails boundary-value, keyboard-feedback, and manual-trim requirements
   in the product's core job. Evidence: [crossed handles](qa-3/trim-crossed-mobile.png).

2. **Required 44×44 px touch targets are not consistently provided.** The
   header **Demo** link measures 29×44 px at 390 px and 34×44 px on desktop;
   the footer **Terms** link is 36×44 px; the 404 page's **Open the loop maker**
   link is 206×21 px. These are the actual clickable boxes, not just glyph
   bounds. Axe does not flag this rule, but it violates the attached
   non-negotiable accessibility and site-structure contracts.

### Medium severity

3. **Invalid-license recovery points to an unavailable purchase.** The page
   says “New supporter purchases are unavailable” and provides no checkout
   link, but a rejected token produces “You can buy a new supporter edition
   license.” The error offers an action the product cannot perform.

4. **Stored projects have no project export/import path.** WAV export preserves
   the rendered sound, but not the source recording, four cuts, labels, or
   tempo. The attached PWA contract calls for explicit export/import of local
   project data so the IndexedDB project is portable.

## Release decision

**FAIL.** Repair the crossed-handle state and all undersized touch targets,
then add regressions that exercise the keyboard boundary path and measure both
dimensions of every interactive target. Correct the invalid-license recovery
copy and add a portable project export/import flow before another acceptance
run.
