# Voice Riff Loop repair 4 handoff

- Work order: `voice-riff-loop-repair-4`
- Repair base: verifier report commit `504e241ca3fbdcdfac6fdd95817d3a15c03ca952`
- Repaired candidate: `e31da83054534fc2c154854253d0485ec5aa7451`
- Verifier report: `.factory/verification-4.md`
- Product repair commit: `90933b0` (`fix: serialize demo startup state`), pushed to `origin/main`
- Production deployment: Azure Static Web Apps deployment `cb9e490b-375d-4b94-8329-ba619f0fcfea`, completed successfully on 2026-09-02 UTC
- Live URL: `https://voice-riff-loop.sociobot.in`

## Repaired findings

1. **Demo startup is now race-safe.** Initialization builds a complete `AppState` locally, decodes audio into a local buffer, and persists that local snapshot before exposing it. Concurrent renders for the same mode share one initialization promise. A render generation guard prevents an older async render from replacing a newer route. Manual sample loading also commits its blob, decoded buffer, cuts, and selection together only if the initiating state is still current.
2. **The verifier's keyboard startup sequence has exact stress coverage.** `handles immediate keyboard input across repeated fresh demo starts without page errors` opens 20 separate 390×844 contexts, uses the skip link, sends Home then End to Tempo, operates Play with Space, and rejects any page or console error. The deployed repair passed all 20 runs; the unmodified candidate failed 8 of 20 when reproduced before the fix.
3. **The required first-screen facts fit on a 390×844 phone.** Mobile layout now puts the task, audience, action, click explanation, and three facts before the decorative cassette. Their deployed bottom edges are 551, 611, 653, and 695 px. `keeps the action explanation and three facts in the first mobile viewport` protects the requirement.
4. **The variable performance result was rechecked.** Three local Lighthouse mobile runs scored 100. Three deployed runs scored 100, 99, and 100. All six runs scored 100 for accessibility, best practices, and SEO. Live LCP was 1.1–1.2 seconds, TBT 60–100 ms, and CLS 0.

## Clean local verification

Run from a clean checkout:

```sh
npm ci
npm test
npm run lint
npm run build
npm run test:browser
```

Results:

- `npm ci`: 95 packages installed; 0 vulnerabilities.
- `npm test`: 2/2 Vitest audio tests passed.
- `npm run lint`: TypeScript `--noEmit` passed.
- `npm run build`: passed and produced `dist/index.html`.
- `npm run test:browser`: 23/23 Playwright tests passed.
- Every one of the 13 commands in `.factory/claims.json` passed independently.
- Browser accessibility coverage ran axe on `/`, `/demo`, `/privacy`, `/terms`, an SPA unknown route, and `/404.html` at 390 and 1440 px. It found zero serious or critical issues, no target under 44×44 px, and no horizontal overflow.
- Keyboard, visible focus, route-focus movement, reduced motion, denied-microphone recovery, local-only sample traffic, demo isolation, project persistence/transfer, and offline reload passed.
- The controlled update check started with an old worker, displayed **Update available**, reloaded safely with the worker waiting, activated the new worker, removed the old cache, and retained four demo pads. The resulting cache is `voice-riff-loop-1fe54d9cbe7e`.
- `/opt/fleet/lib/verify-url.sh http://127.0.0.1:4173/demo .factory/evidence/repair-4-local` passed in 528 ms with no console or page errors and correct title, language, H1, main, alt, and button-name checks.
- Three local Lighthouse 13.0.1 mobile reports scored 100/100/100/100 for performance/accessibility/best practices/SEO, with LCP 1.5 seconds, TBT 0 ms, and CLS 0.
- Production budget: JavaScript 22,339 bytes raw / 8.42 KB gzip; CSS 9,990 bytes raw / 2.86 KB gzip; hero WebP 52,570 bytes. No fonts, analytics, or remote scripts load.

Local evidence is in `.factory/evidence/repair-4-local/`.

## Live verification

- `/opt/fleet/lib/verify-url.sh https://voice-riff-loop.sociobot.in/demo .factory/evidence/repair-4-live` passed in 617 ms with no console or page errors.
- The exact rapid keyboard sequence passed 20/20 fresh live contexts with zero page or console errors.
- The live 390×844 first screen includes the action explanation and all three fact lines above y=844.
- A fake-device microphone recording stored a 5,890-byte Opus blob, a 0.84-second source, and four pads; playback remained enabled after reload.
- Live project export/import restored tempo `120`, cut start `0.12`, audio, and pad state in a separate browser context and survived reload.
- Live WAV export produced a valid 1,411,244-byte RIFF file with an exact 16-second duration.
- The crossed-trim boundary remains synchronized at start `0.97`, end `1`, with `PAD 1 · 0.97–1.00 SEC`.
- Invalid project import, microphone denial, and navigation during playback all recover without page errors.
- The live core flow contacted only `https://voice-riff-loop.sociobot.in`. License restore made one token-only GET to the documented Sociobot verifier, with no request body; the response used origin-specific CORS and `Cache-Control: no-store`.
- Chromium parsed the manifest without errors. Route changes update title and focus. The live demo reloads offline with four pads from cache `voice-riff-loop-1fe54d9cbe7e`.
- Three live Lighthouse 13.0.1 mobile runs scored performance 100/99/100 and 100 for accessibility, best practices, and SEO. LCP was 1.1–1.2 seconds, TBT was 60–100 ms, and CLS was 0.

Live evidence is in `.factory/evidence/repair-4-live/`.

## Deployment identity and response policy

- `/`, `/demo`, `/privacy`, `/terms`, the manifest, robots, and sitemap return 200. `/not-a-route` returns the designed 404 with status 404.
- HTML responses include the expected CSP, HSTS, `X-Content-Type-Options: nosniff`, and `Referrer-Policy: strict-origin-when-cross-origin` headers. The CSP permits only self plus the documented Sociobot API connection.
- `sw.js` sends `Cache-Control: no-cache`; hashed JavaScript sends `Cache-Control: public, max-age=31536000, immutable`.
- The deployed artifact matches local `dist/` byte for byte:
  - `index.html`: `05389c4d061cc2eaecaa27ed41c212251065455619fd9d063a65fd13e33a202f`
  - `assets/index-yEkv5dPx.js`: `87203c3415f5529a3ed727480c7f24dc1b5eb6605698f003f34c311a973e4a41`
  - `assets/index-DIBTEM4Q.css`: `f34d78418764fc4e8612f731e4d152e4efa9193bd6f16c44fa1f20d3836d085a`
  - `sw.js`: `c9a2115ba15ea3a1b978ffea0802123ceeb47f554b0695d6ae8743a8e34a060d`

## Product and data notes

- The artifact remains a static offline PWA. No infrastructure, DNS ownership, billing, other products, shared services, or databases were changed beyond deploying `sf-voice-riff-loop` through the factory static deployment script.
- Demo data remains isolated in `demo:voice-riff-loop`; real projects remain in `voice-riff-loop`.
- New supporter purchases remain unavailable. Existing license validation behavior and every previously passing claim are preserved.

## Known gaps

None known after local and production verification.
