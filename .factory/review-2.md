# Voice Riff Loop review 2 — Make a rhythm loop from your voice

- Work order: voice-riff-loop-review-2
- Reviewed: 2026-09-06 UTC
- Verdict: **FAIL**
- Findings: **1**
- Untested public claims: **0**
- Implementation candidate: `90933b01789364c7c493831cbaf9938308dde534`
- Documentation/report baseline: `0bdde6f6009dbd82bfa59ce10d7354d3eeb24d9f`
- Live URL: https://voice-riff-loop.sociobot.in

## Job, audience, and first action

The product makes a short rhythm loop from a person's voice.

It is for new electronic-music makers who want a first sketch before learning a DAW.

The first action is **Try it with sample data**. It says that it opens four ready-cut voice sounds.

Fresh unscrolled desktop (1440×960) and phone (390×844) browser contexts showed those three points and all three facts. On the phone, the fact bottoms were 611, 653, and 695 px, within the 844 px viewport. Neither context emitted a console or page error.

## Finding

1. **Low — the 404 page does not use plain words.** Both the static `/404.html` page and the SPA unknown-route page use the H1 **“This tape side is blank.”** That is a cassette metaphor, not a direct page heading, and violates the supplied plain-words requirement to use no metaphor or mood headings on every page. Use a direct heading such as **“Page not found.”** The page otherwise has the correct 404 status, title, main landmark, explanatory text, and return link.

## Demo and product checks

The live one-click demo opened four ready-cut pads: THUMP, TSS, AH, and HUM. It showed the persistent **Demo — sample data, separate from your project** label with Reset demo and Start for real. The enabled sample loop played, tempo changed, a trim changed, and the WAV export was a 1,411,244-byte RIFF file. Reset returned the tempo from 156 to 112 BPM; Start for real removed the demo label. The sample flow made only same-origin requests and had no page or console error.

The 76/156 BPM keyboard boundaries worked. Crossed trim handles remained synchronized at start 0.97, end 1.00, and `PAD 1 · 0.97–1.00 SEC`. An invalid project displayed a clear import error and Load sample sounds recovered four usable pads. A connected `/demo` visit reloaded offline in a new context with all four pads and no error.

There is no product backend, tenant database, health endpoint, or restart path. Backend tenant-isolation, persistence-after-restart, and live 429 checks do not apply to this static PWA.

## Claims and clean checkout

I cloned commit `0bdde6f` into a fresh directory, checked out the reviewed implementation content, and ran `npm ci` there. It installed 95 packages with zero reported vulnerabilities. The clean checkout passed:

| Command | Result |
| --- | --- |
| `npm test` | PASS — 2/2 |
| `npm run lint` | PASS |
| `npm run build` | PASS — creates `dist/index.html` |
| `npm run test:browser` | PASS — 23/23 |

Every exact command declared in `.factory/claims.json` passed independently: `sample-loop`, `wav-export`, `offline-reload`, `demo-isolation`, `microphone-on-tap`, `local-audio`, `free-core`, `checkout-unavailable`, `supporter-labels`, `project-storage`, `project-transfer`, `license-token`, and `license-first-paint`.

The production build is 22,339 B raw JavaScript (8.42 KB gzip), 9,990 B CSS (2.86 KB gzip), no web fonts, and a 52,570 B hero WebP. The landing copy, README, privacy, terms, demo, and supporter copy were cross-checked with the claim list. No unlisted, false, incomplete, or untested public claim was found.

## Live quality checks

- `/opt/fleet/lib/verify-url.sh` passed against live `/demo`: HTTP 200, title, language, one H1, main landmark, image alt text, named controls, and no page or console error.
- Axe Playwright scans found no serious or critical issue on `/`, `/demo`, `/privacy`, `/terms`, `/404.html`, or the designed unknown route at 390 px. Reduced motion disabled the record animation. Keyboard tempo Home/End selected 76 and 156 BPM.
- `/`, `/demo`, `/privacy`, `/terms`, `/manifest.webmanifest`, `/robots.txt`, `/sitemap.xml`, `/offline.html`, and `/404.html` returned 200. A deliberate unknown route returned the designed page with HTTP 404. Its network-console 404 line is expected for that deliberate response, not a product runtime error.
- Internal links from the live demo all returned 200. Live headers include CSP, HSTS, `nosniff`, and `strict-origin-when-cross-origin` referrer policy.
- Fresh local production output matched the live `index.html`, JavaScript, CSS, hero WebP, and service worker byte-for-byte by SHA-256. The documentation/report commits after `90933b0` contain no product-code change.

## Earlier findings

| Earlier finding group | Current disposition |
| --- | --- |
| Variable WAV duration or clipping; incomplete export test | Resolved; the independent 76, 112, and 156 BPM export claim passed. |
| Paid checkout wording, privacy wording, license first paint, and license disclosure | Resolved; purchases are explicitly unavailable, token-only validation is disclosed and tested, and first paint is tested. |
| Small targets, weak focus, reduced-motion pulse, keyboard focus, and mobile first-screen facts | Resolved; clean browser tests and fresh mobile checks passed. |
| Missing claims, missing transfer, invalid import, recording denial, and demo isolation | Resolved; 13 declared claims pass; live invalid-import recovery and isolated demo reset passed. |
| CSP fallback errors, unknown-route status, canonical URLs, headers, service-worker cache/update, and offline reload | Resolved; fresh live route, header, and offline checks passed. |
| Playback navigation error, trim-handle synchronization, and rapid demo-start race | Resolved; the complete 23-test browser suite passed and fresh trim/navigation checks had no error. |
| Variable mobile performance | No regression observed; the current build remains far below static JS/CSS/image budgets. |
| Plain words on the 404 page | **Open.** This review found the cassette-metaphor H1 described above. |

## Evidence

- `.factory/review-2/verify-live/verify.json`
- `.factory/review-2/live-home-desktop.png`
- `.factory/review-2/live-home-phone.png`
- Clean checkout command output from this review

**Final verdict: FAIL — 1 finding and zero untested public claims.**
