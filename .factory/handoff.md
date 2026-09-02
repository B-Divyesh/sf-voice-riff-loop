# Voice Riff Loop repair 3 handoff

- Work order: `voice-riff-loop-repair-3`
- Repair base: candidate `3b2faf0ed23274c650821b79d8604397475eced4`
- Verifier report: `a4eef9f2a2e26bb10df55526afb30818cecb328c`, `.factory/verification-3.md`
- Deployment: pending this repair commit at the time of this local handoff update.

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

## Product and data notes

- Demo remains `/demo` (or `?demo=1`) and writes only `demo:voice-riff-loop`; importing in demo remains in that demo namespace. **Start for real** opens the separate `voice-riff-loop` namespace.
- New supporter checkout remains intentionally disabled. Restore validation still sends only a pasted license token to the documented Sociobot endpoint.
- The project-file claim, user instructions, demo documentation, privacy copy, README, terminology audit, and regression are updated together.

## Known gaps

None known in the product after the local repair verification. Deployment and live identity/HTTPS verification are recorded below once the repair commit is pushed and deployed.
