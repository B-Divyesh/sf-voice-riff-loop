# Independent verification — FAIL

- Candidate: `9e25c68e7b8b780456144367092976a42298ddd1`
- Live URL: `https://voice-riff-loop.sociobot.in`
- Verified: 2026-09-02 UTC
- Work order: `voice-riff-loop-verify-1`
- Verdict: **FAIL — do not release this candidate**

The first-read and demo gates pass, and the basic local suites are green. Release-blocking product, claims, payment, privacy, accessibility, and performance defects remain.

## Mandatory first checks

### Declared claims

`.factory/claims.json` exists. From the clean candidate clone, after `npm ci`, every exact command was run before broader QA:

| Claim | Exact command | Command result | Acceptance result |
|---|---|---:|---|
| `sample-loop` | `npm run test:browser -- --grep @claim:sample-loop` | 1 passed | PASS; `/demo` has four named, cut pads and an enabled loop control. |
| `wav-export` | `npm run test:browser -- --grep @claim:wav-export` | 1 passed | **FAIL**; the test only checks that a download exists. It never measures the claimed 16-second duration. The live WAV is 17.143 s at 112 BPM, 25.263 s at 76 BPM, and 12.308 s at 156 BPM. |
| `offline-reload` | `npm run test:browser -- --grep @claim:offline-reload` | 1 passed | PASS; a warmed `/demo` reloads offline with four pads and persisted tempo. |
| `local-only` | `npm run test:browser -- --grep @claim:local-only` | 1 passed | **FAIL as written**; the narrow demo test is same-origin-only, but the product-wide claim and privacy page say “Nothing” leaves the device. Restore purchase sends the license token to `api.sociobot.in`. |

The claims suite does not satisfy the claims contract for the quantitative WAV promise. It also checks only 100 ms of loop playback for `local-only`, rather than the whole product flow.

Unlisted claim-like promises appear in the landing page and README without one corresponding test each: real-project IndexedDB persistence, demo namespace isolation/reset, microphone permission only after a tap, absence of accounts/analytics/third-party scripts/sample packs, the $9 custom-label purchase, and free core features. This is independently release-blocking under the supplied claims contract.

### Cold first-read test

PASS. At 1440×900 the cold first screen says:

- what it does: “Make a rhythm loop from your voice”;
- who it is for: new electronic-music makers making a first sketch before learning a DAW;
- what to click: “Try it with sample data,” with “It opens four ready-cut voice sounds.”

One click opens `/demo`, already populated with THUMP, TSS, AH, and HUM pads, plus the persistent demo notice and reset/start-real controls. Evidence: [desktop first read](evidence/live-first-read-desktop.png), [one-click demo](evidence/live-demo-one-click.png), [390 px home](evidence/mobile-home.png), and [390 px demo](evidence/mobile-demo.png).

## Clean local gates

| Gate | Result |
|---|---|
| `npm ci` | PASS; 95 packages installed, 0 vulnerabilities |
| `npm test` | PASS; 2 unit tests |
| Type check | PASS through `tsc --noEmit` in the build |
| Lint | Not available; no lint script/configuration exists |
| `npm run build` | PASS; exact production build produced `dist/` |
| `npm run test:browser` | PASS; 5 Playwright tests |

Build sizes: 17.49 KB JS raw / 6.85 KB gzip, 8.76 KB CSS raw / 2.65 KB gzip, and 269.35 KB hero WebP. JS, CSS, and hero budgets pass.

## Candidate/deployment identity

PASS. The live HTML names the same hashed assets produced locally. SHA-256 values match byte-for-byte for the JS, CSS, hero image, and service worker:

- JS: `ad1a3dfd7a679cb88a30c7e79902e871e53dea67c34ae7d59adc0166e93bc383`
- CSS: `9bc270496f1b7ea60bd3edd0f0c8d15c6fffd428a3f67b4ae7f7d0a98c1334ce`
- hero: `718685bf4cef9bd01e4da732b52e548587705677c0dc517ca60134d6ff6b06d0`
- service worker: `6ef294c0173970f7b131c2e800bb36b49382e02274dcb9a5a2ac00df92d49f4b`

See [live response headers](evidence/live-root-headers.txt) and [live HTML](evidence/live-index.html).

## End-to-end product exercise

PASS for the free core path with an important export defect described below. In a fresh browser with a fake microphone:

1. Play/export began disabled.
2. Record started only after the explicit button and permission grant.
3. Stop produced a decodable 0.8-second recording.
4. A pad could be selected, its cut adjusted by keyboard, tempo changed, loop started, and WAV downloaded.
5. `voice-riff-loop` IndexedDB was created and the project survived reload.

The denied-microphone path says what happened and what to do next. Demo mode created only `demo:voice-riff-loop`; reset restored 112 BPM. An invalid license produced an actionable message. The exported demo file has valid RIFF/WAVE headers and non-silent PCM.

Boundary evidence exposes the core export defect: the fastest 156 BPM setting exports 12.308 seconds, below the researched brief's 15-second minimum. The default sample export also clips 28,704 of 756,000 PCM samples (3.797%), indicating audible hard clipping.

## Defects

### High severity

1. **The advertised 16-second WAV is not 16 seconds, and its claim test is invalid.** Duration changes with tempo: 17.143 s at default, 25.263 s at minimum, and 12.308 s at maximum. The maximum also violates the brief's 15–60 second output range. The test asserts only filename/readability.

2. **The paid purchase is live but broken.** “Buy supporter edition for $9” calls `https://api.sociobot.in/api/v1/products/voice-riff-loop/checkout`, which returns HTTP 404 with `{"error":"enabled factory product","status":404}`. The advertised path cannot complete end to end.

3. **The absolute privacy promise is false and incompletely tested.** The privacy route says “What leaves the device: Nothing,” while Restore purchase sends the entered license token in a query string to `api.sociobot.in`. The privacy page does not disclose this request. The full demo audio/edit/play/export/reset flow itself remained same-origin-only.

4. **Lighthouse performance is 0/100 because the app suppresses LCP measurement.** Lighthouse 12.8.2 returned `NO_LCP`; accessibility, best practices, and SEO were 100. The app automatically focuses `<main>` on initial render, terminating LCP observation and making the first Tab skip the skip link/header. Suppressing only that programmatic initial focus produced an H1 LCP entry at 356 ms. Raw report: [Lighthouse JSON](evidence/lighthouse-live-mobile.json).

5. **The non-negotiable accessibility baseline fails manual checks.** At 390 px, header/footer links are 18–39 px high, tempo/trim sliders are 28 px high, demo reset/exit controls are 36 px high, and text inputs are 42 px high; all are below 44 px. The acid focus outline against paper is only 1.14:1, below 3:1. Under reduced motion, the recording control still has `pulse` at `0.00001s` with `infinite` iterations instead of disabling the looping effect.

6. **Claim coverage is incomplete.** Multiple landing/README promises listed above have no claim entries or tagged observable tests, which the supplied contract explicitly defines as a failed review.

### Medium severity

7. **CSP breaks both standalone fallback pages.** `/404.html` and `/offline.html` use inline `<style>` while `style-src` allows only self. Both emit a console error and render unstyled. The warmed service worker's offline fallback reproduces the same error.

8. **Unknown routes are not real 404 responses.** `/does-not-exist-qa` returns HTTP 200 through the SPA fallback and keeps the landing-page title, although the body renders not-found copy.

9. **PWA update handling is incomplete.** The service worker activates and offline reload works, but there is no update-available UI. The cache version is fixed at `voice-riff-loop-v1`, so changed hashed assets can accumulate in the same cache.

10. **Hashed assets are not cached immutably.** Live JS, CSS, and hero responses all send `Cache-Control: public, must-revalidate, max-age=30`, not long-lived immutable caching.

11. **Paid-flow disclosures and first paint do not meet the supplied contract.** Privacy/terms omit license verification and merchant/refund details. With a new `?license=` token and a delayed verification response, `#app` stayed empty after 500 ms and meaningful content appeared only after 3.415 s; the free experience is blocked on verification.

## Accessibility, privacy, network, and PWA evidence

- Axe: zero serious/critical findings on `/`, `/demo`, `/privacy`, `/terms`, and an unknown route at desktop and 390 px.
- Structure: each tested SPA route had `lang="en"`, one `h1`, and one `main`; no horizontal overflow at 390 px.
- Keyboard: tempo responds to Arrow keys; Enter starts the loop; native buttons/pads are operable. Initial focus and focus contrast still fail as documented.
- Console: no errors on the main SPA routes. Standalone 404/offline pages each log the CSP style violation.
- Requests: the whole demo flow made only same-origin requests. License restore made the documented external verification request.
- Headers: HSTS, CSP, `X-Content-Type-Options: nosniff`, and `Referrer-Policy: strict-origin-when-cross-origin` are present.
- Rate limiting: in a rapid single-client burst, 30 verify requests were allowed and the 31st returned 429 with `Retry-After: 3` and `X-RateLimit-After: 3`.
- Manifest: Chromium parsed the manifest without errors; name, standalone display, start URL, theme colors, and 192/512 maskable icons are present.
- Service worker: activated and controlled the page; warmed `/demo` reloaded offline with four pads and persisted 120 BPM state.
- Live page/script console: no errors on ordinary online routes.

## Release decision

**FAIL.** Do not release candidate `9e25c68e7b8b780456144367092976a42298ddd1`. At minimum, correct and genuinely test the export duration, register or remove the broken paid offer, make privacy copy match license traffic, restore valid LCP/initial keyboard order, fix manual accessibility failures, and cover every published claim. The CSP fallback errors are also required to be fixed before the no-console-error gate can pass.
