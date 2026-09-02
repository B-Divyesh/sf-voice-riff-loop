# Voice Riff Loop verification 3 handoff — FAIL

- Work order: `voice-riff-loop-verify-3`
- Candidate: `3b2faf0ed23274c650821b79d8604397475eced4`
- Live product: `https://voice-riff-loop.sociobot.in`
- Verified: 2026-09-02 UTC
- Verdict: **FAIL — do not release this candidate.**

Independent QA confirmed that the live deployment exactly matches the
candidate. All 12 claim commands, 2 unit tests, TypeScript checking, the
production build, and all 17 browser tests pass. The first-read/demo gate,
same-origin audio flow, IndexedDB isolation, exact 16-second WAV, offline
reload, service-worker update path, headers, caching, rate limiting, and
performance budgets also pass.

Release remains blocked by two defects not covered by the current suite:

1. Crossing Start/End with keyboard boundary keys leaves the range controls at
   `4` and `0` seconds while the actual/readout cut is `0.97–1.00`. The visible
   controls and saved sound disagree until another render.
2. Several links fail the required 44×44 px touch target: header Demo is
   29×44 px at 390 px, footer Terms is 36×44 px, and the 404 return link is
   206×21 px.

Medium findings: rejected-license copy says a new license can be bought even
though purchases are unavailable, and the local IndexedDB project has no
portable project export/import path.

No product code was changed. Full evidence, reproduction steps, hashes,
performance results, and remediation guidance are in
[verification-3.md](verification-3.md). Key artifacts are under
`.factory/qa-3/`, including `trim-crossed-mobile.png` and two fresh Lighthouse
JSON reports.

## Re-run

```sh
npm ci
npm test
npm run lint
npm run build
npm run test:browser
```

After repair, also test `/demo` by focusing Start and pressing End, then
focusing End and pressing Home. Assert that each slider's DOM value equals the
displayed and persisted cut. Measure both width and height for every visible
link, button, and input at 390 px and desktop.
