# Voice Riff Loop handoff

## What shipped

- A mobile-first, local-first PWA for recording a voice, cutting four pads, playing a fixed-tempo 16-step loop, and exporting a 16-second WAV.
- IndexedDB persistence for audio and pad settings. Demo mode is isolated in `demo:voice-riff-loop` and has a reset control.
- Explicit microphone permission flow, useful empty/error states, keyboard-native controls, privacy and terms routes, manifest, service worker, offline page, social metadata, sitemap, and static deployment headers.
- An optional $9 one-time Sociobot supporter edition for custom pad labels. The free instrument retains recording, cuts, looping, and WAV export.
- Original cassette-zine hero art at `src/assets/hero-cassette.webp` (269 KB). Prompt and factory-image provenance are stored in `src/assets/hero-cassette.json` and design notes in `design.md`.

## Verify

```sh
npm install
npm test
npm run build
npm run test:browser
```

Verified locally on 2026-09-02:

- `npm test`: 2 passing unit tests.
- `npm run build`: passes; `dist/index.html` is at the deploy root.
- `npm run test:browser`: 5 passing tests for sample loading, WAV download, offline demo reload, same-origin-only requests, and axe accessibility.
- Production bundle: JS 6.85 KB gzip, CSS 2.65 KB gzip, hero 269 KB WebP. This meets the static budgets.

## Known gaps

- Browser microphone formats and live timing vary by device. If decode fails, the app tells the maker to try a shorter recording.
- The loop is browser-scheduled, so it is intentionally a sketch instrument rather than a latency guarantee.
- Lighthouse was not run in this container. The Playwright axe scan passes with no serious or critical findings.

## Next steps

- Factory deployment should use `dist/` and retain `staticwebapp.config.json` headers.
- Register the paid product with the factory billing flow before exposing the checkout link publicly.
