# Voice Riff Loop repair 5 handoff

- Work order: `voice-riff-loop-repair-5`
- Result: **PASS — the review 2 finding is resolved**
- Implementation SHA: `0b9443e3d619202448d8b576bf7ab80b8da14eab`
- Prior review/report SHA: `da8d56434b81586dc13df17a195b058f3bcac0b0`
- Live URL: https://voice-riff-loop.sociobot.in

## What changed

The static 404 page and the in-app unknown-route page now use the direct H1
**“Page not found.”** Both also use the route title **“Page not found — Voice
Riff Loop.”** The explanation and **Open the loop maker** recovery link remain.

An outcome-based Playwright regression opens both missing-page paths and checks
the title, visible H1, and working home link. It does not inspect source text.

## Clean-checkout verification

Commit `0b9443e` was checked out into a new temporary clone before testing.

| Command | Result |
| --- | --- |
| `npm ci` | PASS — 95 packages, 0 vulnerabilities |
| `npm test` | PASS — 2/2 unit tests |
| `npm run lint` | PASS — TypeScript check |
| `npm run build` | PASS — `dist/index.html` created |
| `npm run test:browser` | PASS — 24/24 browser tests |

Every exact command in `.factory/claims.json` was then run independently from
that clean clone. All 13 passed: sample loop, WAV export, offline reload, demo
isolation, microphone-on-tap, local audio, free core, unavailable checkout,
supporter labels, project storage, project transfer, license token, and license
first paint.

The production build contains 22,375 bytes of JavaScript (8,399 bytes gzip),
9,987 bytes of CSS (2,875 bytes gzip), no web fonts, and a 52,570-byte hero
image.

## Live verification

- Fresh 390×844 phone and 1440×960 desktop contexts showed the job, audience,
  sample action, action explanation, and all three facts before scrolling.
- The first action opened THUMP, TSS, AH, and HUM in one click. The demo label,
  Reset demo, and Start for real stayed visible.
- The live sample played, accepted an edit, and exported a valid 1,411,244-byte
  RIFF WAV lasting exactly 16 seconds. Reset restored 112 BPM and all four pads.
- Only `demo:voice-riff-loop` existed before and after the demo flow. The real
  project database was never opened, and the flow made no cross-origin request.
- A warmed fresh context reloaded `/demo` offline with four pads and an active
  service worker cache.
- Keyboard order, 76/156 BPM limits, a 4 px focus outline, and reduced-motion
  behavior passed.
- Axe found no serious or critical issue on `/`, `/demo`, `/privacy`, `/terms`,
  `/404.html`, or an unknown URL. Those routes had no undersized visible target
  and no horizontal overflow at 390 px.
- `/privacy` and `/terms` return 200 with route-specific titles. `/404.html`
  returns 200 as a direct fallback asset. A real unknown URL returns the same
  direct missing-page content with the expected HTTP 404 status.
- `verify-url.sh` passed on the live demo with no page or console errors.
- Fresh mobile Lighthouse 13.0.1 scored 100 performance, 100 accessibility,
  100 best practices, and 100 SEO. LCP was 1.06 seconds, TBT was 56 ms, CLS was
  0, and total transfer was 67,207 bytes.

Evidence is under `.factory/evidence/repair-5-live/`.

## Deployment identity

The interrupted portion of this same repair work order had already pushed and
deployed implementation `0b9443e`; the live files report a 2026-09-06 03:16:45
UTC modification time. The resumed run did not replace that identical build.
Fresh local and live SHA-256 values match:

| File | SHA-256 |
| --- | --- |
| `index.html` | `d83428e225ebd3cb06d9e6e8c4d42c8da37f6ae720d319bc35780038ad237201` |
| `assets/index-D084w0Jv.js` | `e2bd5757f8f0692392a42685bb687081e38051faea47787e99b7f17b52d61344` |
| `assets/index-DIBTEM4Q.css` | `f34d78418764fc4e8612f731e4d152e4efa9193bd6f16c44fa1f20d3836d085a` |
| `sw.js` | `3a26277396fde3d39370b824f4102096253c52e2d73048003282286a8e5a247c` |
| `404.html` | `c5a49fb14a803fff6ddd5ab7ce312718805fb813b3aa89362ed4c24c62eb443c` |

The live response retains CSP, HSTS, `nosniff`, and strict-origin referrer
headers. The service worker is `no-cache`; hashed assets are immutable for one
year.

## Earlier findings

All earlier review and verification records were read. Their findings remain
resolved: fixed-duration unclipped WAV export; honest checkout and privacy
copy; non-blocking license validation; initial focus and LCP; touch targets;
focus contrast; reduced motion; complete claim coverage; fallback CSP; real
404 status; update handling and caches; playback cleanup; canonical URLs;
crossed trim controls; invalid-license recovery; project transfer; demo-start
serialization; mobile first-screen facts; and performance variability.

The final open item from review 2—the metaphorical 404 H1—is now resolved on
both implementations and covered by the new browser regression.

## Product scope and known dependency

This remains a static, local-first PWA with no product backend, tenant store,
health endpoint, or server restart path. Backend isolation, persistence, and
429 checks therefore do not apply. Demo data uses its separate IndexedDB
namespace, while real projects use `voice-riff-loop`.

New supporter purchases remain unavailable because there is no registered live
offer. The paid custom-label feature and past-license restore/validation remain
in place; the free recording, cutting, looping, project transfer, and WAV
export features are unchanged. No checkout is advertised, so no billing offer
metadata was invented. Registration remains an external billing-operator step.

No other known product gap remains.
