# Independent verification 4 — FAIL

- Candidate commit: `e31da83054534fc2c154854253d0485ec5aa7451`
- Live URL: `https://voice-riff-loop.sociobot.in`
- Verified: 2026-09-02 UTC
- Work order: `voice-riff-loop-verify-4`
- Verdict: **FAIL — do not release this candidate.**

The candidate fixes the defects from verification 3, and its declared claims,
clean build, core recording/export flow, privacy behavior, accessibility,
offline behavior, and deployment identity all pass. It still has a reproducible
initialization race on the live demo. Fast keyboard interaction with the tempo
control throws an uncaught page error in 11 of 20 fresh runs. A no-page-error
quality gate is part of the release contract, so this is release blocking.

## Mandatory first checks

`.factory/claims.json` exists and contains 13 entries. In the untouched clone,
the exact commands initially could not start because dependencies were not yet
installed (`ERR_MODULE_NOT_FOUND: @playwright/test`). After the required
`npm ci`, every listed command was rerun separately and passed:

| Claim | Result |
|---|---|
| `sample-loop` | PASS — four named sample pads |
| `wav-export` | PASS — 76, 112, and 156 BPM; exact 16-second WAV and unclipped PCM |
| `offline-reload` | PASS — separate context and offline reload |
| `demo-isolation` | PASS — reset and real/demo separation |
| `microphone-on-tap` | PASS — no request before the Record action |
| `local-audio` | PASS — sample flow made only same-origin requests |
| `free-core` | PASS — record/cut/play/WAV controls available without a license |
| `checkout-unavailable` | PASS — notice present and no checkout link |
| `supporter-labels` | PASS — fixture-valid license enables labels |
| `project-storage` | PASS — audio, cuts, and tempo survive reload |
| `project-transfer` | PASS — recording, cuts, labels, and tempo transfer and persist |
| `license-token` | PASS — only the token is sent to Sociobot validation |
| `license-first-paint` | PASS — delayed validation does not block the app |

The cold first-read gate passes. On desktop and at 390×844, the first viewport
states the job (“Make a rhythm loop from your voice”), the audience (“For new
electronic-music makers…”), and the first action (“Try it with sample data”).
The action is visible at 390 px and opens `/demo` in one click with THUMP, TSS,
AH, and HUM ready to play. Direct `/demo` creates only the
`demo:voice-riff-loop` IndexedDB database. Evidence: `qa-4/cold-desktop.png`,
`qa-4/cold-mobile-390.png`, and `qa-4/demo-mobile-390.png`.

## Clean local gates

| Gate | Result |
|---|---|
| `npm ci` | PASS — 95 packages installed; 0 vulnerabilities |
| `npm test` | PASS — 2/2 Vitest tests |
| `npm run lint` | PASS — TypeScript `--noEmit` |
| `npm run build` | PASS — exact production build generated `dist/` |
| `npm run test:browser` | PASS — 21/21 Playwright tests |
| `/opt/fleet/lib/verify-url.sh https://voice-riff-loop.sociobot.in/demo ...` | PASS — 593 ms, no errors, correct title/lang/H1/main/alt |

The build contains 21,930 B JavaScript (8.22 KB gzip), 9,940 B CSS
(2.84 KB gzip), no web fonts, and a 52,570 B hero WebP. These are well below
the 200 KB JS, 50 KB CSS, 120 KB font, and 300 KB hero budgets.

## Deployment identity, routes, and headers

The live artifact is byte-identical to the production build from the tested
commit:

| File | Local and live SHA-256 |
|---|---|
| `index.html` | `b9acdaeb50c8050ea7302b1be10c6453f294dc4f8549e8fab2f52ed5219cfafd` |
| `assets/index-aMkriVeh.js` | `121da2393c7080f871eec46c4e95fe367e73a3ae0fedd418d41411cb7f0baa18` |
| `assets/index-Cmh5SwOF.css` | `94414544a816ec9a1eebfcbf1e3c09c3e408e2f388bf027818b495b3b0509d55` |
| hero WebP | `aa24eff4322402cb13b616f243dca5a23d4699dae3eeb17940e39152b46fc7b9` |
| `sw.js` | `a57f67e8eeac0641d1b303de9c1d1e840947e132452afcfa9b4cca32688fa599` |

- `/`, `/demo`, `/privacy`, `/terms`, the manifest, robots, and sitemap return
  200. An unknown path returns the styled 404 with HTTP 404.
- HTML sends CSP, HSTS, `nosniff`, and strict-origin referrer policy headers.
  CSP permits only self plus the documented Sociobot API connection.
- Hashed assets use `max-age=31536000, immutable`; `sw.js` uses `no-cache`.
- Chromium parsed the manifest with zero errors. Route titles, canonical URLs,
  one H1, `lang=en`, and route-change H1 focus are correct.

## End-to-end and boundary evidence

- A fresh live browser with a fake microphone recorded 0.84 seconds of Opus,
  stored a non-empty 5,890-byte blob with four pads, and restored an enabled
  loop after reload.
- The live demo exported a valid 1,411,244-byte RIFF WAV with an exact
  16-second duration. Local claim coverage repeated this at 76, 112, and 156
  BPM and checked that PCM did not clip.
- Tempo keyboard limits are 76 and 156 BPM. The repaired crossed-trim sequence
  stays synchronized at start `0.97`, end `1`, and readout
  `PAD 1 · 0.97–1.00 SEC`.
- A malformed project shows the specific import error; loading sample sounds
  recovers. A real exported project restored tempo `120`, cut start `0.12`,
  source audio, and pad state in a separate browser context and survived reload.
- Denied microphone permission produces an actionable error, after which the
  sample loader still works.
- Starting playback, navigating to Privacy, and returning causes no error and
  leaves the transport usable.

## Privacy and API boundary

The complete live sample/edit/play/export/navigation flow requested only the
product origin. No analytics, CDN, audio upload, or third-party script request
was observed. License restore made exactly one GET to the documented Sociobot
verification endpoint, carried the entered token in the query, had no body,
and received origin-specific CORS plus `Cache-Control: no-store`. No audio was
sent.

The public license verifier enforces a 30-request client burst allowance.
Requests 1–30 returned 200; request 31 and later returned 429. The first 429
included `Retry-After: 3` and `X-RateLimit-After: 3`.

## Accessibility, responsive behavior, and performance

- Axe reported zero serious or critical findings on `/`, `/demo`, `/privacy`,
  `/terms`, the SPA unknown route, and `/404.html`, at both 390 and 1440 px.
- The same route matrix had no horizontal overflow and no visible target below
  44×44 px.
- The skip link is first in keyboard order. Home/End operate Tempo; Space
  operates playback; focus is a visible 4 px outline with 3 px offset.
- Reduced motion removes the recording animation and step transitions.
- Three fresh Lighthouse 13.0.1 mobile runs scored **89, 94, and 98**
  performance (median 94); all scored 100 accessibility, best practices, and
  SEO. LCP was 1.2–1.3 s, CLS was 0, total transfer was 65 KiB, and an explicit
  live interaction sample measured 24 ms.

The live service worker activated cache `voice-riff-loop-8101b50f6a78`; a
warmed `/demo` reloaded offline with all four pads. A controlled old-worker to
candidate-worker test against the exact production build displayed the
**Update available** action, activated the candidate worker, removed the old
cache, and retained all four demo pads. Evidence is under `.factory/qa-4/`.

## Defects

### High severity — release blocking

1. **Rapid keyboard use during demo startup can throw an uncaught page error.**
   In a fresh 390 px context, open `/demo`, press Tab then Enter to use the skip
   link, focus Tempo, press Home then End, and use Space on Play. In a 20-run
   stress check, 11 runs emitted:

   ```text
   TypeError: Cannot read properties of undefined (reading 'duration')
       at H (.../assets/index-aMkriVeh.js:9:4002)
       at async W (.../assets/index-aMkriVeh.js:9:2834)
       at async p (.../assets/index-aMkriVeh.js:9:2278)
   ```

   Checkpoints show no error after navigation or the skip link; it appears by
   the rapid Tempo Home/End step. The minified `H` frame maps to `loadSample`,
   where the code awaits audio decoding and then reads the mutable global
   `state.buffer.duration`. Concurrent initialization/rendering can replace
   that global state while the decode is pending. The visible loop often
   recovers, but an unhandled page exception violates the explicit no-console-
   error release gate and risks loading or saving the wrong initialization.
   Evidence: `qa-4/race-repro.json`.

### Medium severity

2. **The three required plain facts are below the first mobile viewport.** At
   390×844, the H1, audience sentence, and demo button are visible, so the
   explicit first-read pass/fail gate passes. However, the sentence explaining
   the click ends at y=853 and the privacy/offline/free facts occupy
   y=879–997. This misses the attached plain-words requirement that the action
   explanation and three facts appear on the first screen. The hero art comes
   first on mobile and consumes most of the viewport.

### Low severity

3. **Mobile Lighthouse performance is marginally variable.** One of three
   runs scored 89, below the stated 90 target; the other two scored 94 and 98,
   giving a passing median of 94. Core budgets remain healthy (LCP 1.2–1.3 s,
   CLS 0, 65 KiB transfer, 24 ms measured interaction).

## Release decision

**FAIL.** Serialize or otherwise guard demo initialization so concurrent
renders cannot replace `state` while `loadSample` awaits decoding; add a
regression that performs the immediate keyboard sequence and asserts zero page
errors across repeated fresh contexts. Then move or compress the mobile hero
so the click explanation and three plain facts fit in the initial 390×844
viewport, and repeat the complete verification.
