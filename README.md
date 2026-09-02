# Voice Riff Loop

Record a voice sound, cut it into four pads, and export a short rhythm loop.

Voice Riff Loop is for new electronic-music makers who want to catch an idea before opening a full DAW. It runs locally in the browser. Recordings, pad cuts, and tempo stay in IndexedDB on the same device.

## Use it

1. Open `/` and tap **Record your voice**. The browser asks before it uses the microphone.
2. Stop recording. Tap a pad, then move its start and end handles to make a cut.
3. Tap **Play loop** and use **Export 16-second WAV** when it sounds right.

Try the isolated sample project at `/demo`. Demo data uses the `demo:voice-riff-loop` IndexedDB database and never reads or writes real projects.

## Develop

```sh
npm install
npm run dev
npm test
npm run build
npm run test:browser
```

`npm run build` writes the static PWA to `dist/`, with `index.html` at its root. Deploy that directory as a static site with the included `staticwebapp.config.json` headers and rewrite rules.

## Privacy and support

The app has no account, upload, analytics, third-party scripts, or sample pack. Read [Privacy](/privacy) and [Terms](/terms).

Recording, cutting, looping, and WAV export are free. The optional $9 one-time supporter edition enables custom pad labels through a Sociobot license. A license is stored only in this browser and can be restored by pasting it.

## Offline

After the first visit, the service worker caches the app shell and demo assets. Saved projects are local browser data. If a browser clears site storage, exported WAV files remain wherever the browser saved them.

## License

[MIT](LICENSE)
