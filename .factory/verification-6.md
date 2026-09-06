# Verify Voice Riff Loop — PASS

- Work order: `voice-riff-loop-verify-6`
- Verified: 2026-09-06 UTC
- Verdict: **PASS**
- Findings: **0**
- Untested public claims: **0**
- Implementation candidate reviewed: `0b9443e3d619202448d8b576bf7ab80b8da14eab`
- Documentation baseline reviewed: `1d7458d9a97a6b80e8ac8b139515012bcf54e39f`
- Live URL: https://voice-riff-loop.sociobot.in

**Final verdict: PASS — zero findings and zero untested public claims.**

## Job, audience, and first action

Voice Riff Loop makes a rhythm loop from a person's voice. It is for new electronic-music makers who want a first sketch before learning a DAW. The first action is **Try it with sample data**; it explains that it opens four ready-cut voice sounds.

Fresh live phone (390×844) and desktop (1440×960) browsers showed all of this without scrolling. On the phone, the three fact bottoms were 611, 653, and 695 px inside the 844 px viewport. There were no page or console errors.

## Clean candidate verification

I created a fresh clone, checked out implementation `0b9443e`, ran `npm ci`, and ran the declared commands there.

| Command | Result |
| --- | --- |
| `npm ci` | PASS — 95 packages, 0 reported vulnerabilities |
| `npm test` | PASS — 2/2 unit tests |
| `npm run lint` | PASS |
| `npm run build` | PASS — produced `dist/index.html` |
| `npm run test:browser` | PASS — 24/24 browser tests |

Every exact command declared in `.factory/claims.json` was run separately and passed: `sample-loop`, `wav-export`, `offline-reload`, `demo-isolation`, `microphone-on-tap`, `local-audio`, `free-core`, `checkout-unavailable`, `supporter-labels`, `project-storage`, `project-transfer`, `license-token`, and `license-first-paint`.

The production build contains 22,375 B JavaScript (8,399 B gzip), 9,987 B CSS (2,875 B gzip), no web fonts, and a 52,570 B hero image. The landing, README, legal, demo, supporter, and app copy were cross-checked against the claim list; no unlisted, false, incomplete, or untested public claim remains.

## Live product verification

- The live HTML, JS, CSS, service worker, and 404 asset match the fresh candidate byte-for-byte by SHA-256.
- One click opened THUMP, TSS, AH, and HUM with an enabled loop control and persistent **Demo — sample data, separate from your project** banner. Reset restored 112 BPM after an edit and retained only `demo:voice-riff-loop`; direct demo entry never opened the real project DB.
- The live sample exported a 1,411,244-byte RIFF WAV lasting exactly 16 seconds. Crossed trim inputs remained `0.97` and `1.00`; malformed project import and denied microphone both gave a clear recovery path.
- A fake-device recording produced a 0.84-second local Opus recording with four pads, survived reload, and portable export/import restored 120 BPM and a 0.12-second cut in another browser context.
- The complete sample/edit/play/export/reset flow made only same-origin product requests. License restoration made one GET containing only the entered token to the disclosed Sociobot validation endpoint; it sent no audio and did not block first paint.
- A warmed fresh context reloaded `/demo` offline with four pads. A controlled old-worker-to-candidate-worker check showed **Update available**, removed the old cache, and retained all four pads.
- `/opt/fleet/lib/verify-url.sh` passed on live `/demo`. Axe Playwright scans found no serious or critical issue on `/`, `/demo`, `/privacy`, `/terms`, an unknown route, or `/404.html` at both 390 and 1440 px. There was no horizontal overflow or visible target below 44×44 px. Keyboard and reduced motion checks passed: skip link first, Tempo Home/End = 76/156, Space toggles playback, focus has a 4 px outline, and reduced motion removes the record animation and transitions.
- `/`, `/demo`, `/privacy`, `/terms`, `/404.html`, `/offline.html`, manifest, robots, and sitemap returned 200 with correct route titles. An unknown URL returned the designed **Page not found** page with HTTP 404; that deliberate response is expected, not a defect.
- Fresh mobile Lighthouse 13.0.1 scored 100 performance, 100 accessibility, 100 best practices, and 100 SEO. LCP was 1.208 s, TBT 70 ms, CLS 0, and total transfer 67,234 B.

## Earlier findings

All earlier review and verification findings, including the minor ones, were inspected. Their current disposition is:

| Earlier finding | Current disposition |
| --- | --- |
| Variable/clipped WAV and incomplete duration test | Resolved; the three-tempo claim and live 16-second RIFF export pass. |
| Broken new-purchase checkout and inaccurate privacy wording | Resolved; purchases are clearly unavailable, and token-only validation is disclosed and tested. |
| License first paint and legal disclosure | Resolved; the loop maker loads before a delayed validation check, and Privacy/Terms explain the token and merchant role. |
| Initial focus/LCP, small targets, weak focus, reduced motion | Resolved; Lighthouse, target scan, keyboard, focus, and reduced-motion checks pass. |
| Missing claims, demo isolation, recording denial, transfer/import | Resolved; all 13 claims pass and live recovery/isolation/transfer paths pass. |
| Fallback CSP errors, fake 404, canonical routes, caching/update | Resolved; fallback pages are clean, unknown routes are HTTP 404, route canonicals work, and offline/update checks pass. |
| Playback during navigation, trim synchronization, demo-start race | Resolved; live route playback and trim checks pass; the 24-test suite includes the repeated startup regression. |
| Mobile first-screen facts and variable performance | Resolved; facts fit at 390 px and the fresh completed Lighthouse run is 100. |
| Metaphorical missing-page heading | Resolved; static and in-app missing pages use the direct words **Page not found** and provide the home recovery link. |

This is a static local-first PWA. It has no product backend, tenant store, health endpoint, or restart path, so backend tenant-isolation, restart-persistence, and 429 checks do not apply.

## Known dependency

New supporter purchases remain unavailable until the external billing operator registers the live offer. This is honestly labelled and has a passing claim; free recording, cutting, looping, transfer, and WAV export remain available.
