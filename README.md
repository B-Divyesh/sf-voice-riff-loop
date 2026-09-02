# Voice Riff Loop

Record a voice sound, cut it into four pads, and export a 16-second rhythm loop.

Voice Riff Loop is for new electronic-music makers who want to catch an idea before opening a full DAW. It runs locally in the browser. Recordings, pad cuts, and tempo stay in IndexedDB on the same device.

## Use it

1. Open `/` and tap **Record your voice**. The browser asks for microphone access after that tap.
2. Stop recording. Tap a pad, then move its start and end handles to make a cut.
3. Tap **Play loop** and use **Export 16-second WAV** when it sounds right.

Try the isolated sample project at `/demo`. It opens four ready-cut synthetic sounds. Demo changes use the separate `demo:voice-riff-loop` IndexedDB database. **Reset demo** restores the sample project.

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

Audio, cuts, and tempo stay in this browser. Restoring a past supporter license sends its token to Sociobot for validation; it never sends audio. Read [Privacy](/privacy) and [Terms](/terms).

Recording, cutting, looping, and WAV export are free. New supporter purchases are currently unavailable. Past supporter licenses can be restored by pasting a token.

## Offline

After the first visit, the service worker caches the app shell and demo assets. The loop maker stays available offline.

## License

[MIT](LICENSE)
