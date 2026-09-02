# Voice Riff Loop verification 4 handoff — FAIL

- Work order: `voice-riff-loop-verify-4`
- Candidate: `e31da83054534fc2c154854253d0485ec5aa7451`
- Live URL: `https://voice-riff-loop.sociobot.in`
- Full report: `.factory/verification-4.md`
- Verdict: **FAIL — do not release this candidate.**

## Release blocker

A fresh live `/demo` can throw an uncaught initialization error when a keyboard
user acts as soon as the controls appear. Reproduction: at 390 px, press Tab,
Enter, focus Tempo, press Home then End, and use Space on Play. Eleven of 20
fresh runs emitted `TypeError: Cannot read properties of undefined (reading
'duration')` from the minified `loadSample → initialize → render` path. The
visible controls often recover, but the explicit no-page-error gate fails.

The likely race is `loadSample` awaiting decode and then reading the mutable
global `state.buffer.duration` after another initialization/render has replaced
`state`. Fix by making initialization single-flight or by keeping decoded audio
in a local variable before committing one coherent state. Add a repeated
keyboard-startup regression that listens for `pageerror`.

## Additional findings

- At 390×844, the required privacy/offline/free fact lines are below the first
  viewport, and the click explanation ends nine pixels below it. The explicit
  first-read gate still passes because the job, audience, and demo action are
  visible.
- Lighthouse performance was 89, 94, and 98 (median 94). Accessibility, best
  practices, and SEO were 100 in every run; LCP was 1.2–1.3 s and CLS was 0.

## What passed

- All 13 claim commands passed after `npm ci`.
- `npm test`: 2/2; `npm run lint`: pass; `npm run build`: pass;
  `npm run test:browser`: 21/21.
- Live build bytes exactly match the candidate production build.
- Live microphone recording and reload persistence, 16-second WAV export,
  project export/import, boundary tempo/trim handling, invalid-input recovery,
  and denied-permission recovery passed.
- Core flows made same-origin requests only. License restore sent one token-only
  GET to Sociobot with no body and `no-store`; audio was not sent.
- The license endpoint allowed 30 requests, then returned 429 with
  `Retry-After` (3 seconds observed).
- Axe found no serious/critical issue on six routes at 390 and 1440 px. Touch
  targets, keyboard operation, focus, reduced motion, and overflow passed.
- Live offline reload passed. A controlled update from an old worker to the
  exact candidate worker displayed the update action, activated it, removed
  the old cache, and preserved the demo.

## Reproduce

```sh
npm ci
npm test
npm run lint
npm run build
npm run test:browser
node .factory/qa-4/race-repro.mjs
node .factory/qa-4/platform-qa.mjs
node .factory/qa-4/update-qa.mjs
```

Evidence is in `.factory/qa-4/`. No product source or deployment was changed.
