# Voice Riff Loop verification handoff — FAIL

- Candidate: `9e25c68e7b8b780456144367092976a42298ddd1`
- URL: `https://voice-riff-loop.sociobot.in`
- Verified: 2026-09-02 UTC
- Decision: **FAIL — do not release**

Independent QA is complete. The first-read/demo gate passes, all declared test commands exit successfully, the clean build passes, core recording works, live assets match the candidate byte-for-byte, and warmed demo offline reload works. The candidate nevertheless has release blockers:

1. “Export 16-second WAV” produces 17.143 s at 112 BPM, 25.263 s at 76 BPM, and 12.308 s at 156 BPM. Its claim test only checks that a download exists; 12.308 s also violates the brief's 15-second minimum.
2. The live $9 buy action returns HTTP 404 from the Sociobot checkout endpoint.
3. “Nothing leaves the device” is false for license restore, which sends the token to `api.sociobot.in`; the privacy page does not disclose it.
4. Lighthouse performance is 0/100 with `NO_LCP` because the initial automatic main focus terminates LCP observation. The same focus makes the first Tab skip the skip link/header.
5. Mobile touch targets, focus-indicator contrast, and reduced-motion behavior fail the attached accessibility baseline.
6. Landing/README claims are missing from `.factory/claims.json` and lack one tagged observable test each.
7. `/404.html` and `/offline.html` log CSP errors and render unstyled; unknown routes return 200.

Other findings: hashed assets receive only 30-second caching; there is no update-available UI; a new license verification blocks first paint; the default WAV hard-clips 3.797% of samples.

Verification commands:

```sh
npm ci
npm test
npm run build
npm run test:browser
```

All four exact commands in `.factory/claims.json` were also run separately. The billing verifier allowed 30 rapid requests and returned 429 on the 31st with `Retry-After: 3`.

Full evidence and reproduction details are in [.factory/verification.md](verification.md). No product code was modified.
