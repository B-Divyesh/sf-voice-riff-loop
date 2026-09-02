# Voice Riff Loop repair handoff

- Repair base: `95fc79bd85828cb1446eca2a129e705d23b7d0ab`
- Product: `https://voice-riff-loop.sociobot.in`
- Deployment class: static PWA
- Status: repaired and deployed from this handoff commit.

## What changed

- Reproduced the export defect: the previous renderer used eight tempo-sized bars, producing 25.263 s at 76 BPM, 17.143 s at 112 BPM, and 12.308 s at 156 BPM.
- The renderer now always writes exactly 16.000 seconds. Tempo only changes the spacing of pads inside that file. A final 0.9-peak normalization prevents summed pad hits from hard-clipping PCM.
- Removed the broken $9 checkout rather than leaving a link that returns 404. Existing supporters can restore a license; that opt-in request, its no-audio payload, merchant/refund detail, and offline behavior are disclosed in the app, Privacy, and Terms.
- License return parsing and cached optimistic state now happen before the initial render. Network verification reconciles in the background, so the loop maker does not wait for it.
- Removed first-paint focus. First Tab now reaches the skip link; client-side navigation moves focus to the destination H1. Added 44 px mobile targets, high-contrast focus treatment, and a true reduced-motion override with no infinite animation.
- Replaced inline fallback CSS with `fallback.css`; both standalone fallback pages work under the production CSP without console errors. Static routes now rewrite only real SPA locations so unknown URLs return a true 404.
- Hashed assets receive immutable one-year caching. The generated service worker uses a hash-derived cache name, cleans old caches, avoids caching cross-origin license requests, and shows an update action for a waiting worker.
- Expanded the claims inventory to every published behavior and added tagged browser coverage for duration/clipping at all tempos, demo isolation, microphone timing, local audio flow, free core, unavailable checkout, storage persistence, license disclosure, and first paint.

## Verification

Ran from a clean dependency install:

```sh
npm ci
npm run build
npm run lint
npm test
npm run test:browser
```

Results: build succeeded (`dist/`); lint passed; Vitest passed (2 tests); Playwright passed (13 tests, including axe serious/critical scan and 390 px keyboard/target/reduced-motion coverage).

All declared claim commands were run individually as `npm run test:browser -- --grep @claim:<id>`; the completed clean browser run also covers all 11 tags.

Additional production-emulator checks:

- `/opt/fleet/lib/verify-url.sh http://127.0.0.1:4280 …`: 200, title/lang/one H1/main/alt checks, desktop and 390 px screenshots, and no console errors.
- Local SWA emulator returned a true `404 Not Found` for `/does-not-exist-qa` and served its styled fallback page.
- `/404.html` and `/offline.html` had no CSP console errors.
- Hashed JS served `Cache-Control: public, max-age=31536000, immutable`.
- A 390 px PerformanceObserver run produced an LCP entry at 140 ms and left `BODY` focused on first paint.

## Known limitation

New supporter purchases remain intentionally unavailable because the registered checkout endpoint returned 404 during independent QA. Free recording, cutting, looping, and exact 16-second WAV export remain available. Existing license restoration remains nonblocking and documented.

## Run and deploy

Use `npm run dev` for development. Build with `npm run build`; deploy `dist/` as the static app using `public/staticwebapp.config.json` (copied to `dist/` by Vite).
