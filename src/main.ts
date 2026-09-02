import './style.css';
import './overrides.css';
import { createSampleWav, decodeAudio, defaultProject, type LoopProject, type Pad, renderLoop, pattern } from './audio';
import { loadProject, resetProject, saveProject } from './storage';
import hero from './assets/hero-cassette.webp';

type AppState = {
  demo: boolean; project: LoopProject;
  audio?: Blob; buffer?: AudioBuffer; selectedPad: number; playing: boolean;
  recording: boolean; recordingStarted?: number; message: string; activeStep: number;
};

type PortableProjectFile = {
  format: 'voice-riff-loop-project';
  version: 1;
  project: LoopProject;
  audio: { type: string; data: string };
};

let state: AppState;
let context: AudioContext | undefined;
let recorder: MediaRecorder | undefined;
let recordStream: MediaStream | undefined;
let loopTimer: number | undefined;
let loopStart = 0;
const activeVoices = new Set<{ source: AudioBufferSourceNode; gain: GainNode }>();
let paid = false;
let licenseMessage = '';
let updateAvailable = false;
let applyingUpdate = false;
let renderGeneration = 0;
let initialization: { demo: boolean; promise: Promise<AppState> } | undefined;

const app = document.querySelector<HTMLDivElement>('#app')!;
const isDemoPath = () => location.pathname === '/demo' || new URLSearchParams(location.search).get('demo') === '1';
const getContext = () => context ||= new AudioContext();
const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

function projectIsValid(project: unknown): project is LoopProject {
  if (!project || typeof project !== 'object') return false;
  const value = project as Record<string, unknown>;
  if (typeof value.tempo !== 'number' || !Number.isFinite(value.tempo) || value.tempo < 76 || value.tempo > 156) return false;
  const duration = value.duration;
  if (typeof duration !== 'number' || !Number.isFinite(duration) || duration <= .03) return false;
  if (!Array.isArray(value.pads) || value.pads.length !== 4) return false;
  return value.pads.every((pad, index) => {
    if (!pad || typeof pad !== 'object') return false;
    const item = pad as Record<string, unknown>;
    return item.id === index && typeof item.name === 'string' && item.name.length > 0 && item.name.length <= 10
      && typeof item.start === 'number' && Number.isFinite(item.start) && item.start >= 0
      && typeof item.end === 'number' && Number.isFinite(item.end) && item.end <= duration
      && item.end - item.start >= .03;
  });
}

function isPortableProjectFile(value: unknown): value is PortableProjectFile {
  if (!value || typeof value !== 'object') return false;
  const file = value as Record<string, unknown>;
  if (file.format !== 'voice-riff-loop-project' || file.version !== 1 || !projectIsValid(file.project)) return false;
  if (!file.audio || typeof file.audio !== 'object') return false;
  const audio = file.audio as Record<string, unknown>;
  return typeof audio.type === 'string' && typeof audio.data === 'string' && audio.data.length > 0;
}

function base64ToBlob(data: string, type: string): Blob {
  const binary = atob(data);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index++) bytes[index] = binary.charCodeAt(index);
  return new Blob([bytes], { type: type || 'application/octet-stream' });
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error || new Error('The recording could not be exported.'));
    reader.onload = () => {
      if (typeof reader.result !== 'string') { reject(new Error('The recording could not be exported.')); return; }
      resolve(reader.result.slice(reader.result.indexOf(',') + 1));
    };
    reader.readAsDataURL(blob);
  });
}

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function pageTitle(route: string) {
  if (route === '/privacy') return 'Privacy — Voice Riff Loop';
  if (route === '/terms') return 'Terms — Voice Riff Loop';
  if (route === '/demo') return 'Demo — Voice Riff Loop';
  return 'Voice Riff Loop — Make a voice rhythm loop';
}

function disposePlayback() {
  if (loopTimer !== undefined) window.clearTimeout(loopTimer);
  loopTimer = undefined;
  for (const voice of activeVoices) {
    try { voice.source.stop(); } catch { /* The source may already have ended. */ }
    voice.source.disconnect();
    voice.gain.disconnect();
  }
  activeVoices.clear();
  if (state) { state.playing = false; state.activeStep = -1; }
}

function navigate(path: string) {
  disposePlayback();
  history.pushState({}, '', path); void render(true);
}

function header() {
  return `<header class="site-header"><a class="wordmark" href="/" data-link>VOICE<br>RIFF<br>LOOP</a><nav aria-label="Main navigation"><a href="/demo" data-link>Demo</a><a href="/#maker" data-link>Loop maker</a><a href="/privacy" data-link>Privacy</a></nav>${updateAvailable ? '<button class="update-button" id="apply-update">Update available</button>' : ''}</header>`;
}
function footer() {
  return `<footer><p>Voice Riff Loop makes short voice rhythm sketches.</p><div><a href="/privacy" data-link>Privacy</a><a href="/terms" data-link>Terms</a><span>Built by Param Factory · v1</span></div></footer>`;
}
function notice(message: string) { return message ? `<p class="notice" role="status">${message}</p>` : ''; }

function privacyPage() {
  return `${header()}<main id="main" tabindex="-1" class="text-page"><h1>Your recordings stay in this browser</h1><p>Your audio, pad cuts, and tempo are stored in this browser's IndexedDB.</p><h2>License checks</h2><p>Restoring a supporter license sends only the license token to Sociobot for validation.</p><p>Voice recordings and loop data are never included in that request.</p><h2>Control your data</h2><p>Export a WAV whenever you want.</p><p>Export a project file to move your recording, cuts, labels, and tempo to another browser.</p></main>${footer()}`;
}
function termsPage() {
  return `${header()}<main id="main" tabindex="-1" class="text-page"><h1>Terms for using Voice Riff Loop</h1><p>Use this instrument to record sounds you have permission to use.</p><h2>Local tool</h2><p>This app runs in your browser. It does not promise identical microphone timing on every device.</p><h2>Past supporter licenses</h2><p>License validation is provided by Sociobot. Sociobot and Dodo are the merchant of record for past purchases.</p><p>Refunded licenses can be revoked. Contact the merchant shown on your purchase receipt for refunds.</p><h2>Service</h2><p>The app is provided as-is. Stop using it if it does not suit your recording setup.</p></main>${footer()}`;
}

function heroSection() {
  return `<section class="hero" aria-labelledby="hero-title"><div class="hero-copy"><p class="eyebrow">A local voice instrument</p><h1 id="hero-title">Make a rhythm loop from your voice</h1><p class="lede">For new electronic-music makers who want a first sketch before learning a DAW.</p><div class="hero-actions"><a class="button primary" href="/demo" data-link>Try it with sample data</a><span>It opens four ready-cut voice sounds.</span></div><div class="facts"><span>Audio stays in this browser</span><span>Works offline after first visit</span><span>Core loop tools are free</span></div></div><figure class="hero-art"><img src="${hero}" width="560" height="373" fetchpriority="high" decoding="async" alt="A black cassette on torn cream, orange, green, and yellow paper." /><figcaption>Original generated collage.</figcaption></figure></section>`;
}

function maker(state: AppState) {
  const selected = state.project.pads[state.selectedPad];
  const duration = state.project.duration || 4;
  const hasAudio = Boolean(state.buffer);
  const pads = state.project.pads.map((pad, index) => `<button class="pad ${index === state.selectedPad ? 'selected' : ''}" data-pad="${index}" aria-pressed="${index === state.selectedPad}"><b>${index + 1}</b><span>${pad.name}</span><small>${(pad.end - pad.start).toFixed(2)}s</small></button>`).join('');
  const strip = pattern.map((pad, index) => `<span class="step ${state.playing && state.activeStep === index ? 'on' : ''}" aria-hidden="true">${pad + 1}</span>`).join('');
  return `<section id="maker" class="maker" aria-labelledby="maker-title"><div class="maker-heading"><div><p class="eyebrow">${state.demo ? 'Sample loop' : 'Your local project'}</p><h2 id="maker-title">Record, cut, and loop four sounds</h2></div><label class="tempo">Tempo <output id="tempo-value">${state.project.tempo} BPM</output><input id="tempo" type="range" min="76" max="156" value="${state.project.tempo}" aria-label="Tempo in beats per minute" /></label></div>
    ${notice(state.message)}
    <div class="tape-machine"><div class="tape-label"><span>VOICE / 4 PAD LOOP</span><span>${hasAudio ? `${duration.toFixed(1)} SEC SOURCE` : 'NO RECORDING'}</span></div><div class="wave-wrap"><canvas id="wave" width="900" height="144" aria-label="Waveform showing the selected pad cut"></canvas><div class="cut-readout">PAD ${state.selectedPad + 1} · ${selected.start.toFixed(2)}–${selected.end.toFixed(2)} SEC</div></div><div class="trim-controls"><label>Start <input id="trim-start" type="range" min="0" max="${duration}" step="0.01" value="${selected.start}" ${hasAudio ? '' : 'disabled'} /></label><label>End <input id="trim-end" type="range" min="0" max="${duration}" step="0.01" value="${selected.end}" ${hasAudio ? '' : 'disabled'} /></label></div>
      <div class="record-row"><button id="record" class="record" ${state.recording ? 'aria-pressed="true"' : ''}>${state.recording ? 'Stop recording' : 'Record your voice'}</button><button id="load-sample" class="button secondary">Load sample sounds</button><span>${state.recording ? 'Recording locally. Tap stop when done.' : 'Microphone permission is requested only after you tap record.'}</span></div>
      <div class="pads" role="group" aria-label="Voice sound pads">${pads}</div>
      <label class="rename">Pad name ${paid ? `<input id="pad-name" value="${selected.name}" maxlength="10" aria-label="Name for selected pad" />` : `<input value="${selected.name}" aria-label="Name for selected pad" disabled />`} <small>${paid ? 'Saved locally with this project.' : 'Custom pad labels need a supporter license.'}</small></label>
      <div class="transport"><button id="play-loop" class="button primary" ${hasAudio ? '' : 'disabled'}>${state.playing ? 'Stop loop' : 'Play loop'}</button><button id="export" class="button secondary" ${hasAudio ? '' : 'disabled'}>Export 16-second WAV</button><div class="step-strip" role="img" aria-label="16-step loop pattern">${strip}</div></div>
      <div class="project-actions" role="group" aria-label="Project file actions"><button id="export-project" class="button secondary" ${hasAudio ? '' : 'disabled'}>Export project</button><label class="button secondary import-project">Import project<input id="import-project" class="project-file-input" type="file" accept="application/json,.voice-riff-loop.json,.json" /></label></div>
    </div><p class="maker-help">Tap a pad to hear it and select it. Move its two cut handles. The loop plays at the tempo above.</p></section>`;
}

function howItWorks() { return `<section class="how" aria-labelledby="how-title"><h2 id="how-title">How to make a first loop</h2><ol><li><b>Record a sound.</b><span>Hum, say “ah,” pop your lips, or make a hi-hat.</span></li><li><b>Cut four pads.</b><span>Choose each pad and move its start and end handles.</span></li><li><b>Play and export.</b><span>Hear the fixed rhythm, then save a 16-second WAV.</span></li></ol></section><section class="pricing" aria-labelledby="pricing-title"><h2 id="pricing-title">Supporter licenses</h2><p>New supporter purchases are unavailable. Recording, cutting, looping, and WAV export are free.</p>${paid ? '<p class="paid-state">A supporter license is active on this device.</p>' : `<div class="pricing-actions"><label>Restore a past license <input id="license-input" placeholder="Paste license token" aria-label="License token" /></label><button id="restore-license" class="button secondary">Restore purchase</button></div>`}<p class="license-note">Restoring sends your license token to Sociobot for validation. It never sends your audio.</p>${licenseMessage ? `<p class="notice" role="status">${licenseMessage}</p>` : ''}</section><section class="privacy-note" aria-labelledby="privacy-title"><h2 id="privacy-title">What this instrument does not do</h2><p>It does not upload your voice or publish your music.</p></section>`; }

function demoBanner() { return `<aside class="demo-banner" aria-label="Demo controls"><span><b>Demo</b> — sample data, separate from your project</span><button id="reset-demo">Reset demo</button><a href="/" data-link>Start for real</a></aside>`; }

async function render(moveFocus = false) {
  const generation = ++renderGeneration;
  const path = location.pathname;
  const route = isDemoPath() ? '/demo' : path;
  document.title = pageTitle(route);
  const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (canonical) canonical.href = new URL(route === '/' ? '/' : route, 'https://voice-riff-loop.sociobot.in').href;
  if (path === '/privacy') app.innerHTML = privacyPage();
  else if (path === '/terms') app.innerHTML = termsPage();
  else if (path !== '/' && path !== '/demo') app.innerHTML = `${header()}<main id="main" tabindex="-1" class="text-page"><h1>This tape side is blank</h1><p>That page is not part of Voice Riff Loop.</p><a class="button primary" href="/" data-link>Open the loop maker</a></main>${footer()}`;
  else {
    const demo = isDemoPath();
    const nextState = !state || state.demo !== demo ? await initialize(demo) : state;
    if (generation !== renderGeneration || demo !== isDemoPath()) return;
    state = nextState;
    app.innerHTML = `${header()}<main id="main" tabindex="-1">${demo ? '<h1 class="sr-only">Make a rhythm loop from your voice</h1>' + demoBanner() : heroSection()}${maker(state)}${demo ? '' : howItWorks()}</main>${footer()}`;
    drawWave();
  }
  bind();
  if (moveFocus) {
    const heading = document.querySelector<HTMLElement>('#main h1');
    if (heading) { heading.tabIndex = -1; heading.focus(); }
  }
}

async function createInitialState(demo: boolean): Promise<AppState> {
  const saved = await loadProject(demo).catch(() => undefined);
  const nextState: AppState = { demo, project: saved?.project || defaultProject(), audio: saved?.audio, selectedPad: 0, playing: false, recording: false, message: '', activeStep: -1 };
  if (saved?.audio) {
    try { nextState.buffer = await decodeAudio(saved.audio, getContext()); } catch { nextState.message = 'Your saved recording could not be read. Record a new sound.'; }
  }
  if (demo && !saved) {
    const audio = createSampleWav();
    const buffer = await decodeAudio(audio, getContext());
    nextState.audio = audio;
    nextState.buffer = buffer;
    nextState.project = defaultProject(buffer.duration);
    await persistState(nextState);
  }
  return nextState;
}

function initialize(demo: boolean, force = false): Promise<AppState> {
  if (!force && state?.demo === demo) return Promise.resolve(state);
  if (!force && initialization?.demo === demo) return initialization.promise;
  const promise = createInitialState(demo).finally(() => {
    if (initialization?.promise === promise) initialization = undefined;
  });
  initialization = { demo, promise };
  return promise;
}

async function persistState(current: AppState) {
  if (current.audio) await saveProject(current.demo, { project: current.project, audio: current.audio, savedAt: new Date().toISOString() });
}

async function persist() {
  await persistState(state);
}

async function verifyLicense(token: string) {
  try {
    const response = await fetch(`https://api.sociobot.in/api/v1/products/voice-riff-loop/verify?license=${encodeURIComponent(token)}`);
    const verdict = await response.json() as { valid?: boolean };
    paid = verdict.valid === true;
    localStorage.setItem('sb_license_verdict:voice-riff-loop', JSON.stringify({ valid: paid, checkedAt: Date.now() }));
    licenseMessage = paid ? 'License verified. Custom pad labels are active.' : 'That license is not active. New supporter purchases are unavailable.';
  } catch { licenseMessage = 'Your saved license will be checked when you are online.'; }
  await render();
}

function readLicenseFromUrl() {
  const url = new URL(location.href); const fromUrl = url.searchParams.get('license');
  if (fromUrl) { localStorage.setItem('sb_license:voice-riff-loop', fromUrl); url.searchParams.delete('license'); history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`); }
  return fromUrl || localStorage.getItem('sb_license:voice-riff-loop');
}

function restoreCachedLicense(token: string | null) {
  if (!token) return false;
  const cached = localStorage.getItem('sb_license_verdict:voice-riff-loop');
  if (cached) { const verdict = JSON.parse(cached) as { valid: boolean; checkedAt: number }; paid = verdict.valid; return Date.now() - verdict.checkedAt >= 86400000; }
  else paid = true;
  return true;
}

async function loadSample(silent = false) {
  const currentState = state;
  const blob = createSampleWav();
  const buffer = await decodeAudio(blob, getContext());
  if (state !== currentState) return;
  const nextState: AppState = { ...currentState, audio: blob, buffer, project: defaultProject(buffer.duration), selectedPad: 0 };
  if (!silent) nextState.message = 'Four sample sounds are ready. Tap any pad, then play the loop.';
  state = nextState;
  await persistState(nextState);
  if (state === nextState) await render();
}

function drawWave() {
  const canvas = document.querySelector<HTMLCanvasElement>('#wave');
  if (!canvas) return;
  const ctx = canvas.getContext('2d')!; const width = canvas.width; const height = canvas.height;
  ctx.fillStyle = '#171715'; ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = '#f3ecd8'; ctx.globalAlpha = .76; ctx.lineWidth = 2; ctx.beginPath();
  const samples = state.buffer?.getChannelData(0); const duration = state.project.duration || 1;
  for (let x = 0; x < width; x++) {
    const start = Math.floor(x / width * (samples?.length || 0)); const size = Math.max(1, Math.floor((samples?.length || 1) / width)); let peak = 0;
    for (let y = 0; y < size; y++) peak = Math.max(peak, Math.abs(samples?.[start + y] || (Math.sin(x / 13) * .1)));
    ctx.moveTo(x, height / 2 - peak * height * .42); ctx.lineTo(x, height / 2 + peak * height * .42);
  }
  ctx.stroke(); ctx.globalAlpha = 1;
  const pad = state.project.pads[state.selectedPad]; const left = pad.start / duration * width; const right = pad.end / duration * width;
  ctx.fillStyle = 'rgba(215,233,75,.27)'; ctx.fillRect(left, 0, right - left, height); ctx.strokeStyle = '#d7e94b'; ctx.strokeRect(left + 1, 1, right - left - 2, height - 2);
}

function syncTrimControls() {
  const pad = state.project.pads[state.selectedPad];
  const start = document.querySelector<HTMLInputElement>('#trim-start');
  const end = document.querySelector<HTMLInputElement>('#trim-end');
  if (start) start.value = pad.start.toFixed(2);
  if (end) end.value = pad.end.toFixed(2);
  const readout = document.querySelector('.cut-readout');
  if (readout) readout.textContent = `PAD ${state.selectedPad + 1} · ${pad.start.toFixed(2)}–${pad.end.toFixed(2)} SEC`;
  drawWave();
}

function playPad(id: number) {
  if (!state.buffer) return;
  const audio = getContext(); void audio.resume(); const pad = state.project.pads[id]; const source = audio.createBufferSource(); const gain = audio.createGain(); const voice = { source, gain };
  source.buffer = state.buffer; gain.gain.value = .85; source.connect(gain).connect(audio.destination);
  activeVoices.add(voice);
  source.addEventListener('ended', () => { activeVoices.delete(voice); source.disconnect(); gain.disconnect(); }, { once: true });
  source.start(0, pad.start, Math.max(.03, pad.end - pad.start));
}

function stopLoop() { disposePlayback(); }
function startLoop() {
  if (!state.buffer) return; stopLoop(); state.playing = true; loopStart = performance.now();
  const tick = () => {
    const stepMs = (60 / state.project.tempo / 4) * 1000; const step = Math.floor((performance.now() - loopStart) / stepMs) % pattern.length;
    if (step !== state.activeStep) { state.activeStep = step; playPad(pattern[step]); refreshTransport(); }
    loopTimer = window.setTimeout(tick, 18);
  }; tick();
}
function refreshTransport() {
  document.querySelector<HTMLButtonElement>('#play-loop')!.textContent = state.playing ? 'Stop loop' : 'Play loop';
  document.querySelectorAll<HTMLElement>('.step').forEach((step, index) => step.classList.toggle('on', state.playing && index === state.activeStep));
}

async function toggleRecording() {
  if (state.recording && recorder) { recorder.stop(); return; }
  if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) { state.message = 'This browser cannot record audio. Use a current mobile or desktop browser.'; await render(); return; }
  try {
    recordStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const chunks: BlobPart[] = []; recorder = new MediaRecorder(recordStream);
    recorder.ondataavailable = (event) => chunks.push(event.data);
    recorder.onstop = async () => {
      recordStream?.getTracks().forEach((track) => track.stop()); recordStream = undefined; state.recording = false;
      const audio = new Blob(chunks, { type: recorder?.mimeType || 'audio/webm' });
      try { state.buffer = await decodeAudio(audio, getContext()); state.audio = audio; state.project = defaultProject(state.buffer.duration); state.selectedPad = 0; state.message = 'Recording is ready. Cut each pad, then play the loop.'; await persist(); }
      catch { state.message = 'That recording could not be read. Try a shorter recording in this browser.'; }
      await render();
    };
    recorder.start(); state.recording = true; state.message = 'Recording locally. Tap stop when you have a sound.'; await render();
  } catch (error) { state.message = 'Microphone access was not granted. Allow it in your browser, then try recording again.'; await render(); }
}

function exportWav() {
  if (!state.buffer) return;
  download(renderLoop(state.buffer, state.project), 'voice-riff-loop.wav');
  state.message = 'Your 16-second WAV is downloading.';
  void render();
}

async function exportProject() {
  if (!state.audio) return;
  try {
    const file: PortableProjectFile = {
      format: 'voice-riff-loop-project',
      version: 1,
      project: {
        tempo: state.project.tempo,
        duration: state.project.duration,
        pads: state.project.pads.map((pad) => ({ ...pad }))
      },
      audio: { type: state.audio.type || 'application/octet-stream', data: await blobToBase64(state.audio) }
    };
    download(new Blob([JSON.stringify(file)], { type: 'application/json' }), 'voice-riff-loop-project.json');
    state.message = 'Your project file is downloading. It includes the recording, cuts, labels, and tempo.';
  } catch {
    state.message = 'This project could not be exported. Try recording or loading a sample again.';
  }
  await render();
}

async function importProject(file: File) {
  try {
    const parsed = JSON.parse(await file.text()) as unknown;
    if (!isPortableProjectFile(parsed)) throw new Error('invalid project');
    const audio = base64ToBlob(parsed.audio.data, parsed.audio.type);
    const buffer = await decodeAudio(audio, getContext());
    if (!parsed.project.pads.every((pad) => pad.end <= buffer.duration && pad.start < buffer.duration)) throw new Error('cut outside recording');
    state.audio = audio;
    state.buffer = buffer;
    state.project = {
      tempo: parsed.project.tempo,
      duration: buffer.duration,
      pads: parsed.project.pads.map((pad) => ({ ...pad }))
    };
    state.selectedPad = 0;
    await persist();
    state.message = 'Project imported. Your recording, cuts, labels, and tempo are ready.';
  } catch {
    state.message = 'That project file could not be imported. Choose a Voice Riff Loop project file.';
  }
  await render();
}

function bind() {
  app.querySelectorAll<HTMLAnchorElement>('[data-link]').forEach((link) => link.addEventListener('click', (event) => { if (link.origin === location.origin && !event.metaKey) { event.preventDefault(); navigate(link.pathname + link.search + link.hash); } }));
  app.querySelector<HTMLInputElement>('#tempo')?.addEventListener('input', async (event) => { state.project.tempo = Number((event.target as HTMLInputElement).value); const output = document.querySelector('#tempo-value'); if (output) output.textContent = `${state.project.tempo} BPM`; await persist(); });
  app.querySelectorAll<HTMLButtonElement>('[data-pad]').forEach((button) => button.addEventListener('click', async () => { state.selectedPad = Number(button.dataset.pad); playPad(state.selectedPad); await render(); }));
  for (const id of ['trim-start', 'trim-end']) app.querySelector<HTMLInputElement>(`#${id}`)?.addEventListener('input', async (event) => {
    const pad: Pad = state.project.pads[state.selectedPad];
    const n = Number((event.target as HTMLInputElement).value);
    if (id === 'trim-start') pad.start = clamp(n, 0, pad.end - .03);
    else pad.end = clamp(n, pad.start + .03, state.project.duration);
    syncTrimControls();
    await persist();
  });
  app.querySelector('#record')?.addEventListener('click', () => void toggleRecording());
  app.querySelector('#load-sample')?.addEventListener('click', () => void loadSample());
  app.querySelector('#play-loop')?.addEventListener('click', () => { state.playing ? stopLoop() : startLoop(); refreshTransport(); });
  app.querySelector('#export')?.addEventListener('click', exportWav);
  app.querySelector('#export-project')?.addEventListener('click', () => void exportProject());
  app.querySelector<HTMLInputElement>('#import-project')?.addEventListener('change', (event) => {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) void importProject(file);
  });
  app.querySelector('#apply-update')?.addEventListener('click', () => { applyingUpdate = true; void navigator.serviceWorker.getRegistration().then((registration) => registration?.waiting?.postMessage({ type: 'SKIP_WAITING' })); });
  app.querySelector<HTMLInputElement>('#pad-name')?.addEventListener('change', async (event) => { const value = (event.target as HTMLInputElement).value.trim().toUpperCase(); if (value) { state.project.pads[state.selectedPad].name = value; await persist(); await render(); } });
  app.querySelector('#restore-license')?.addEventListener('click', () => { const token = app.querySelector<HTMLInputElement>('#license-input')?.value.trim(); if (!token) { licenseMessage = 'Paste your license token, then restore your purchase.'; void render(); return; } localStorage.setItem('sb_license:voice-riff-loop', token); paid = true; void verifyLicense(token); });
  app.querySelector('#reset-demo')?.addEventListener('click', async () => {
    await resetProject(true);
    const resetState = await initialize(true, true);
    if (!isDemoPath()) return;
    state = resetState;
    await render();
  });
}

window.addEventListener('popstate', () => { disposePlayback(); void render(true); });
window.addEventListener('beforeunload', stopLoop);
if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').then((registration) => {
  const showUpdate = () => {
    if (navigator.serviceWorker.controller && registration.waiting) { updateAvailable = true; void render(); }
  };
  showUpdate();
  registration.addEventListener('updatefound', () => registration.installing?.addEventListener('statechange', showUpdate));
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (applyingUpdate) location.reload(); });
}).catch(() => undefined);
const initialLicense = readLicenseFromUrl();
const shouldVerifyInitialLicense = restoreCachedLicense(initialLicense);
void render().then(() => { if (initialLicense && shouldVerifyInitialLicense) void verifyLicense(initialLicense); });
