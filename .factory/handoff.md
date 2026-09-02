# Voice Riff Loop repair 3 handoff

- Work order: `voice-riff-loop-repair-3`
- Repair base: candidate `3b2faf0ed23274c650821b79d8604397475eced4`
- Verifier report: `a4eef9f2a2e26bb10df55526afb30818cecb328c`, `.factory/verification-3.md`
- Repair commit: `d6b48fa` (`fix: repair trim controls and portable projects`), pushed to `origin/main`.
- Deployment: Azure Static Web Apps production deployment `6280114b-4700-43ab-8b79-9cde63772f84` succeeded on 2026-09-02 UTC at `https://voice-riff-loop.sociobot.in`.

## Repaired findings

1. **Crossed trim handles now stay truthful.** The verifier sequence was first reproduced on the unmodified candidate at 390 px: `Start → End` left the range DOM at `4`/`1` while the cut said `0.97–1.00 SEC`; `End → Home` left it at `4`/`0`. The trim input handler now resolves the cut once, writes the resolved value to **both** range DOM controls, redraws the visible readout, then saves the project. The same sequence now yields `0.97`/`1` and `PAD 1 · 0.97–1.00 SEC` after each key. `synchronizes crossed trim handles in the DOM, readout, and saved project` exercises Start→End, End→Home, and reads the `demo:voice-riff-loop` IndexedDB record.
2. **Every visible target is at least 44×44 px.** Links receive an explicit 44 px minimum target in the app and fallback 404 stylesheet. This covers the header Demo link, footer links, demo controls, and the static 404 return link. `gives every visible link and control a 44 by 44 px target on mobile and desktop` measures width and height on `/`, `/demo`, `/privacy`, `/terms`, the SPA 404, and `/404.html`, at 390 px and 1440 px.
3. **Invalid-license recovery is accurate.** A rejected token now says that the license is not active and new supporter purchases are unavailable; it no longer tells a visitor to buy something the product cannot sell. The regression also asserts that no checkout link exists.
4. **Projects are portable.** `Export project` downloads a JSON file containing the source recording, four cuts, pad labels, and tempo. `Import project` validates the product format, cut boundaries, and audio before storing it in the current real or demo IndexedDB namespace. The transfer is local and does not send audio anywhere. The new `@claim:project-transfer` browser test exports a changed sample into a separate browser context, imports it, checks audio/cut/label/tempo restoration, and reloads to prove persistence.

## Verification

Run from a clean install:

```sh
npm ci
npm test
npm run lint
npm run build
npm run test:browser
```

Results for this repair:

- `npm ci`: 95 packages installed, 0 vulnerabilities.
- `npm test`: 2/2 Vitest audio tests passed.
- `npm run lint`: TypeScript `--noEmit` passed.
- `npm run build`: passed and produced `dist/index.html`.
- `npm run test:browser`: 21/21 Playwright tests passed.
- Every one of the 13 `.factory/claims.json` commands was run separately and passed, including the isolated offline-reload, local-audio, license, and new project-transfer flows.
- Browser accessibility coverage runs axe on six product/fallback routes at both 390 px and 1440 px: zero serious or critical findings, no horizontal overflow, keyboard skip-link and reduced-motion checks pass.
- `/opt/fleet/lib/verify-url.sh http://127.0.0.1:4173/demo` passed: title, `lang`, one H1, main landmark, image alt, and no page or console errors. The generated [verification report](evidence/repair-3-local/verify.json) recorded a 533 ms local demo load.
- Local Lighthouse 13.0.1 mobile against the production build: Performance 100, Accessibility 100, Best Practices 100, SEO 100; LCP 1.5 s and CLS 0. The report is [saved here](evidence/repair-3-local/lighthouse-mobile.json).
- Build budgets: JavaScript 21,930 B raw / 8,220 B gzip; CSS 9,940 B raw / 2,840 B gzip; decorative hero WebP 52,570 B. No remote fonts or analytics.

## Live deployment verification

- `/opt/fleet/lib/verify-url.sh https://voice-riff-loop.sociobot.in/demo` passed with a 636 ms page load, no page or console errors, correct title/lang/H1/main/alt checks, and desktop/mobile screenshots in [live evidence](evidence/repair-3-live/verify.json).
- `/`, `/demo`, `/privacy`, and `/terms` return 200. The intentional unknown-route fallback returns its styled “This tape side is blank” page with HTTP 404.
- The deployed build is byte-identical to local `dist/`: index `b9acdaeb50c8050ea7302b1be10c6453f294dc4f8549e8fab2f52ed5219cfafd`; JS `121da2393c7080f871eec46c4e95fe367e73a3ae0fedd418d41411cb7f0baa18`; CSS `94414544a816ec9a1eebfcbf1e3c09c3e408e2f388bf027818b495b3b0509d55`; hero `aa24eff4322402cb13b616f243dca5a23d4699dae3eeb17940e39152b46fc7b9`; service worker `a57f67e8eeac0641d1b303de9c1d1e840947e132452afcfa9b4cca32688fa599`.
- Live response policy is active: CSP restricts scripts/styles/media/connect sources to the documented product origins, HSTS is enabled, `nosniff` and strict-origin referrer policy are present, `sw.js` is `no-cache`, and hashed JS is immutable for one year.
- A fresh 390 px live browser session ran the repaired Start→End then End→Home sequence and reported range DOM `0.97`/`1` with `PAD 1 · 0.97–1.00 SEC`. It found no target below 44×44 px on the five live routes checked. After service-worker activation, `/demo` reloaded offline with its loop maker visible.

## Product and data notes

- Demo remains `/demo` (or `?demo=1`) and writes only `demo:voice-riff-loop`; importing in demo remains in that demo namespace. **Start for real** opens the separate `voice-riff-loop` namespace.
- New supporter checkout remains intentionally disabled. Restore validation still sends only a pasted license token to the documented Sociobot endpoint.
- The project-file claim, user instructions, demo documentation, privacy copy, README, terminology audit, and regression are updated together.

## Known gaps

None known after local and live repair verification.
