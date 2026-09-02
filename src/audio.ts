export type Pad = { id: number; name: string; start: number; end: number };

export type LoopProject = {
  tempo: number;
  pads: Pad[];
  duration: number;
};

export const padNames = ['THUMP', 'TSS', 'AH', 'HUM'];
export const pattern = [0, 1, 3, 1, 0, 1, 2, 1, 0, 1, 3, 1, 0, 1, 2, 1];

export function defaultProject(duration = 4): LoopProject {
  return {
    tempo: 112,
    duration,
    pads: padNames.map((name, id) => ({ id, name, start: id * (duration / 4), end: (id + 1) * (duration / 4) }))
  };
}

export function createSampleWav(seconds = 4, rate = 44100): Blob {
  const frames = seconds * rate;
  const data = new Float32Array(frames);
  const segment = frames / 4;
  const random = (i: number) => Math.sin(i * 12.9898) * 43758.5453 % 1;
  for (let i = 0; i < frames; i++) {
    const block = Math.min(3, Math.floor(i / segment));
    const t = (i % segment) / rate;
    const envelope = Math.max(0, 1 - t * 1.9);
    const noise = random(i) * 2 - 1;
    if (block === 0) data[i] = Math.sin(t * 2 * Math.PI * 92) * envelope * .86;
    if (block === 1) data[i] = noise * envelope * .22;
    if (block === 2) data[i] = (Math.sin(t * 2 * Math.PI * 220) + Math.sin(t * 2 * Math.PI * 440) * .35) * envelope * .28;
    if (block === 3) data[i] = (Math.sin(t * 2 * Math.PI * 130) * .5 + noise * .04) * Math.max(0, 1 - t) * .38;
  }
  return wavBlob(data, rate);
}

export function wavBlob(data: Float32Array, sampleRate: number): Blob {
  const bytes = new ArrayBuffer(44 + data.length * 2);
  const view = new DataView(bytes);
  const text = (offset: number, value: string) => [...value].forEach((c, index) => view.setUint8(offset + index, c.charCodeAt(0)));
  text(0, 'RIFF'); view.setUint32(4, 36 + data.length * 2, true); text(8, 'WAVE'); text(12, 'fmt ');
  view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true); view.setUint32(28, sampleRate * 2, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true);
  text(36, 'data'); view.setUint32(40, data.length * 2, true);
  for (let i = 0; i < data.length; i++) view.setInt16(44 + i * 2, Math.max(-1, Math.min(1, data[i])) * 0x7fff, true);
  return new Blob([bytes], { type: 'audio/wav' });
}

export function renderLoop(buffer: AudioBuffer, project: LoopProject, bars = 8): Blob {
  const beat = 60 / project.tempo / 4;
  const frames = Math.ceil(pattern.length * beat * bars * buffer.sampleRate);
  const output = new Float32Array(frames);
  const source = buffer.getChannelData(0);
  for (let bar = 0; bar < bars; bar++) {
    pattern.forEach((padId, step) => {
      const pad = project.pads[padId];
      const from = Math.floor(pad.start * buffer.sampleRate);
      const length = Math.min(Math.floor((pad.end - pad.start) * buffer.sampleRate), frames);
      const at = Math.floor((bar * pattern.length + step) * beat * buffer.sampleRate);
      for (let frame = 0; frame < length && at + frame < frames; frame++) output[at + frame] += source[from + frame] || 0;
    });
  }
  return wavBlob(output, buffer.sampleRate);
}

export async function decodeAudio(blob: Blob, context: AudioContext): Promise<AudioBuffer> {
  return context.decodeAudioData(await blob.arrayBuffer());
}
