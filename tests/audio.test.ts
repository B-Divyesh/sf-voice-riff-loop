import { describe, expect, it } from 'vitest';
import { createSampleWav, defaultProject, renderLoop } from '../src/audio';

describe('audio helpers', () => {
  it('creates a standard WAV sample', async () => {
    const blob = createSampleWav(1, 8000);
    expect(blob.type).toBe('audio/wav');
    expect(new Uint8Array(await blob.arrayBuffer()).slice(0, 4)).toEqual(new Uint8Array([82, 73, 70, 70]));
  });

  it('renders a 16-second-or-longer loop', async () => {
    const rate = 8000;
    const data = new Float32Array(rate * 4); data.fill(.1);
    const audio = { sampleRate: rate, getChannelData: () => data } as unknown as AudioBuffer;
    const wav = renderLoop(audio, defaultProject(4), 8);
    const view = new DataView(await wav.arrayBuffer());
    const byteRate = view.getUint32(28, true);
    const size = view.getUint32(40, true);
    expect(size / byteRate).toBeGreaterThanOrEqual(15);
  });
});
