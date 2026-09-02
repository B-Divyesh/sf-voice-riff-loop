import { describe, expect, it } from 'vitest';
import { createSampleWav, defaultProject, renderLoop } from '../src/audio';

describe('audio helpers', () => {
  it('creates a standard WAV sample', async () => {
    const blob = createSampleWav(1, 8000);
    expect(blob.type).toBe('audio/wav');
    expect(new Uint8Array(await blob.arrayBuffer()).slice(0, 4)).toEqual(new Uint8Array([82, 73, 70, 70]));
  });

  it('renders exactly 16 seconds at every supported tempo without PCM clipping', async () => {
    const rate = 8000;
    const data = new Float32Array(rate * 4); data.fill(.8);
    const audio = { sampleRate: rate, getChannelData: () => data } as unknown as AudioBuffer;
    for (const tempo of [76, 112, 156]) {
      const project = defaultProject(4); project.tempo = tempo;
      const wav = renderLoop(audio, project);
      const view = new DataView(await wav.arrayBuffer());
      const byteRate = view.getUint32(28, true);
      const size = view.getUint32(40, true);
      expect(size / byteRate).toBe(16);
      for (let offset = 44; offset < 44 + size; offset += 2) expect(Math.abs(view.getInt16(offset, true))).toBeLessThan(32767);
    }
  });
});
