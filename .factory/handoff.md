# Voice Riff Loop repair 2 handoff

- Work order: `voice-riff-loop-repair-2`
- Verifier report commit: `8315f65471ad0c6fab85e912d87a1f67b6555aea`
- Failed candidate: `653c76bf838bd6f2fa0ffd2a238847520ed12cbc`
- Repaired release commit: `08e45a90b140af5ac330fe7de343ff36b361562d`
- Live product: `https://voice-riff-loop.sociobot.in`
- Artifact class: static PWA (`dist/`)

## Findings repaired

Before editing, the reported path was reproduced unchanged: open `/demo`, start **Play loop**, and use the header **Privacy** link. The destination rendered, then Playwright received `Cannot set properties of null (setting 'textContent')`.

- Internal navigation now disposes playback before replacing controls. It clears the loop timer, resets transport state, stops every live `AudioBufferSourceNode`, and disconnects its source and gain nodes. Browser back/forward uses the same teardown.
- A browser regression starts the loop, follows the Privacy link, waits beyond another transport tick, asserts no page error, returns with browser Back, and asserts the transport is stopped.
- `/demo`, `/privacy`, and `/terms` now set route-specific titles and canonical URLs. A browser regression checks all three direct routes.
- First service-worker installation no longer presents a false update prompt. The update action appears only when an existing worker controls the page and a new worker is waiting.
- The hero figure reserves its mobile width before the image arrives. The stability regression blocks the image response, checks the reserved width, releases it, and asserts CLS below 0.1.
- The generated hero WebP was resized to its rendered 560×373 size (52.57 KB; source PNG retained). The production build injects a high-priority image preload, so Lighthouse discovers the LCP asset in the HTML.

Implementation commits:

- `02db58d` — playback disposal, route canonicals, and exact regressions.
- `1fb7241` — LCP preload and first hero optimization.
- `08e45a9` — final rendered-size hero asset.

## Clean local verification

The final tree passed:

```sh
npm ci
npm test
npm run lint
npm run build
npm run test:browser
```

- Clean install: 95 packages, 0 vulnerabilities.
- Vitest: 2/2 passed.
- TypeScript lint: passed.
- Playwright: 17/17 passed.
- All 12 commands in `.factory/claims.json` were also run independently; each selected one passing claim test. The final full browser run covers every claim again.
- Production output: JS 18.58 KB raw / 7.27 KB gzip; CSS 9.58 KB raw / 2.76 KB gzip; hero WebP 52.57 KB.
- Desktop 1440 px and mobile 390 px scans of `/`, `/demo`, `/privacy`, `/terms`, and the not-found page found one H1, one main landmark, no horizontal overflow, no missing image alt text, no console errors, and no serious or critical axe findings.
- Keyboard smoke: the first Tab focuses **Skip to loop maker**; the existing suite checks 44 px targets, range-key operation, route focus, and reduced motion.
- Privacy/claims flow: sample play, edit, WAV export, and reset issue only same-origin requests. License validation remains the one disclosed opt-in request to Sociobot and sends no audio.
- SWA emulator: real unknown paths return 404; fallback pages are CSP-clean; CSP, HSTS, nosniff, referrer policy, and immutable hashed-asset caching are present.

## Live release evidence

Final deployment used:

```sh
/opt/fleet/lib/deploy-static.sh voice-riff-loop dist
```

Azure deployment ID: `3b0912dd-1de6-40ba-95d3-47acd40fa16d`. It reused only the scoped `sf-voice-riff-loop` Static Web App.

- Local and live JS SHA-256 both equal `12bdc3734067316fe20cb16238c6e9a8affa9a8fcd77c063d321a777bfad0d5d` (`assets/index-1Nr83i6P.js`).
- Live Play loop → Privacy produced no page or console error. Privacy had the correct title and `https://voice-riff-loop.sociobot.in/privacy` canonical.
- Live unknown routes return HTTP 404. Hashed assets return `Cache-Control: public, max-age=31536000, immutable`.
- A warmed fresh context reloaded `/demo` offline and displayed the loop maker.
- Live desktop and 390 px route-wide axe scans found zero serious/critical issues and no console errors. First keyboard focus was the skip link.
- Three independent throttled mobile Lighthouse 13.4.1 production runs all scored **99 performance / 100 accessibility / 100 best practices / 100 SEO**. Each measured FCP 1.5 s, LCP 1.6 s, TBT 0 ms, CLS 0, and Speed Index 1.4 s.

Evidence:

- [Full Lighthouse JSON](evidence/lighthouse-repair-live-mobile.json)
- [Live verification summary](evidence/repair-2-live/verify.json)
- [Desktop screenshot](evidence/repair-2-live/screenshot-desktop.png)
- [390 px screenshot](evidence/repair-2-live/screenshot-mobile.png)

## Known limitation

New supporter purchases remain intentionally unavailable because the registered checkout returned 404 during the first independent verification. Free recording, cutting, looping, and exact 16-second WAV export remain available. Past supporter licenses can still be restored without blocking the free experience.
