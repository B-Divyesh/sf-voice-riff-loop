# Demo sandbox

- **URL:** `/demo` or `/?demo=1`
- **Sample:** a four-second, locally generated WAV with four opinionated pads: THUMP, TSS, AH, and HUM. It is generated from deterministic waveform code, not an external sample.
- **Isolation:** demo data is stored only in the IndexedDB database named `demo:voice-riff-loop`. Real projects use `voice-riff-loop`; demo mode never opens that database.
- **Reset:** use **Reset demo** in the persistent demo banner. **Start for real** leaves the demo and opens the real project space.
- **Portable files:** **Export project** downloads the source recording, cuts, labels, and tempo as a local JSON file. **Import project** restores that file into the current demo or real-project storage namespace.
- **Offline:** visit `/demo` once while connected, then reload offline. The service worker has cached the shell and the generated sample needs no network resource.
