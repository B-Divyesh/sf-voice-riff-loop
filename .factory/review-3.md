# Voice Riff Loop review 3 — Make a rhythm loop from your voice

- Work order: `voice-riff-loop-review-3`
- Reviewed: 2026-09-06 UTC
- Verdict: **PASS**
- Findings: **0**
- Untested public claims: **0**
- Implementation candidate reviewed: `0b9443e3d619202448d8b576bf7ab80b8da14eab`
- Documentation/report baseline: `31e6e650e6038b3039e66e6b7b712d63993cb028`
- Live URL: https://voice-riff-loop.sociobot.in

**Final verdict: PASS — zero findings and zero untested public claims.**

## Job, audience, and first action

Voice Riff Loop makes a rhythm loop from a person's voice. It is for new
electronic-music makers who want a first sketch before learning a DAW. The
first action is **Try it with sample data**; it says that it opens four
ready-cut voice sounds.

Fresh unscrolled live browsers at desktop (1440×960) and phone (390×844) both
showed the job, audience, action, action explanation, and all three facts.
There was one H1 and no page or console error in either context.

## Clean candidate and claims

A new clone was checked out at the implementation SHA, then `npm ci` installed
95 packages with zero reported vulnerabilities. The clean checkout passed:

| Command | Result |
| --- | --- |
| `npm test` | PASS — 2/2 |
| `npm run lint` | PASS |
| `npm run build` | PASS — produced `dist/index.html` |
| `npm run test:browser` | PASS — 24/24 |

Every exact command declared in `.factory/claims.json` was then run separately
and passed: `sample-loop`, `wav-export`, `offline-reload`, `demo-isolation`,
`microphone-on-tap`, `local-audio`, `free-core`, `checkout-unavailable`,
`supporter-labels`, `project-storage`, `project-transfer`, `license-token`,
and `license-first-paint`.

The landing page, loop maker, README, Privacy, Terms, and demo copy were
cross-checked against the claim list. All visitor-relevant promises have an
observable declared check; none is missing, false, incomplete, or untested.
The build contains 22,375 B JavaScript (8,399 B gzip), 9,987 B CSS (2,875 B
gzip), no web fonts, and a 52,570 B hero image.

## Live product checks

- The live `index.html`, JavaScript, CSS, service worker, and `404.html`
  match the fresh candidate build byte-for-byte by SHA-256.
- A direct one-click demo created only `demo:voice-riff-loop`, opened THUMP,
  TSS, AH, and HUM, and kept the persistent **Demo — sample data, separate
  from your project** label, Reset demo, and Start for real controls visible.
  Reset restored 112 BPM after a change; Start for real returned to the real
  project space.
- The live sample exported a 1,411,244-byte RIFF WAV lasting exactly 16
  seconds. An invalid project file gave the specific import error and
  recovered through Load sample sounds. A denied microphone likewise gave a
  clear next step and recovered through sample loading.
- The sample/edit/export/reset flow made only same-origin requests. It sent no
  audio to another origin. The separate license-token claim covers the only
  disclosed Sociobot validation request.
- The skip link was first, Home/End set Tempo to 76/156, Space toggled the
  loop, focus remained visible, and reduced motion removed the record pulse.
- Axe found no serious or critical issues on `/`, `/demo`, `/privacy`,
  `/terms`, `/404.html`, and an unknown route at both 390 and 1440 px. There
  was no horizontal overflow or visible target below 44×44 px.
- `/opt/fleet/lib/verify-url.sh` passed against live `/demo` with no browser
  errors, a correct title/language/H1/main landmark, alt text, and labelled
  controls. `/`, `/demo`, `/privacy`, `/terms`, `/404.html`, `/offline.html`,
  manifest, robots, and sitemap returned 200. An unknown route returned the
  designed **Page not found** page with HTTP 404, which is expected.
- After a connected visit, a fresh context reloaded `/demo` offline with all
  four sample pads and an active service worker cache. A controlled
  old-worker-to-candidate-worker check showed **Update available**, activated
  the candidate worker, removed the old cache, and kept four pads.
- A fresh Lighthouse 13.0.1 mobile audit scored 100 performance, 100
  accessibility, 100 best practices, and 100 SEO; LCP was 1.206 s, TBT 61 ms,
  and CLS was 0. Chromium reported `TARGET_CRASHED` only while collecting its
  final full-page screenshot after the category audits; it did not alter the
  completed audit scores. The raw report is retained as evidence.

## Earlier findings

| Earlier finding | Current disposition |
| --- | --- |
| Variable/clipped WAV output and incomplete duration coverage | Resolved; the three-tempo claim and live 16-second RIFF output pass. |
| Checkout, privacy, and license-first-paint wording | Resolved; purchases are honestly unavailable, token-only validation is disclosed, and first paint is covered. |
| Small targets, weak focus, reduced-motion pulse, and mobile first-screen facts | Resolved; fresh mobile checks, keyboard checks, and axe pass. |
| Missing claim coverage, demo isolation, denied recording, invalid import, and project transfer | Resolved; all 13 claims pass and the live recovery/isolation paths pass. |
| Fallback CSP, false 404, canonical routes, cache/update path, and offline reload | Resolved; live headers/routes and fresh offline/update checks pass. |
| Playback on navigation, crossed trim handles, and rapid demo initialization | Resolved; the 24-test suite includes the regression coverage and live interaction checks have no error. |
| Variable mobile performance | Resolved; the fresh completed audit is 100/100/100/100 and all static budgets remain well below their limits. |
| Metaphorical 404 heading from review 2 | Resolved; both unknown-route implementations use **Page not found** and provide the home recovery link. |

This is a static, local-first PWA. It has no product backend, tenant store,
health endpoint, or product restart path, so backend tenant-isolation,
restart-persistence, and 429 checks do not apply.

## Evidence

- `.factory/review-3/verify-url/verify.json`
- `.factory/review-3/verify-url/screenshot-desktop.png`
- `.factory/review-3/verify-url/screenshot-mobile.png`
- `.factory/review-3/lighthouse-live-mobile-13.0.1.json`
