import { expect, test } from '@playwright/test';

async function downloadBytes(page: import('@playwright/test').Page) {
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export 16-second WAV' }).click();
  const download = await downloadPromise;
  const stream = await download.createReadStream();
  const parts: Uint8Array[] = [];
  for await (const part of stream!) parts.push(new Uint8Array(part));
  const bytes = new Uint8Array(parts.reduce((length, part) => length + part.length, 0));
  let offset = 0;
  for (const part of parts) { bytes.set(part, offset); offset += part.length; }
  return bytes;
}

test('loads four sample sounds without a recording @claim:sample-loop', async ({ page }) => {
  await page.goto('/demo');
  await expect(page.getByText('Demo — sample data, separate from your project')).toBeVisible();
  await expect(page.getByRole('button', { name: /play loop/i })).toBeEnabled();
  await expect(page.locator('[data-pad]')).toHaveCount(4);
});

test('exports an exact 16-second WAV at every tempo @claim:wav-export', async ({ page }) => {
  await page.goto('/demo');
  for (const tempo of [76, 112, 156]) {
    await page.getByLabel('Tempo in beats per minute').fill(String(tempo));
    const bytes = await downloadBytes(page);
    expect(String.fromCharCode(...bytes.subarray(0, 4))).toBe('RIFF');
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const byteRate = view.getUint32(28, true);
    const dataLength = view.getUint32(40, true);
    expect(dataLength / byteRate).toBe(16);
    let peak = 0;
    for (let offset = 44; offset < bytes.length; offset += 2) peak = Math.max(peak, Math.abs(view.getInt16(offset, true)));
    expect(peak).toBeLessThan(32767);
  }
});

test('keeps the demo available offline after its first visit @claim:offline-reload', async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4173/demo', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  await context.setOffline(true);
  await page.goto('http://127.0.0.1:4173/demo', { waitUntil: 'domcontentloaded', timeout: 8000 });
  await expect(page.getByRole('heading', { name: /record, cut, and loop four sounds/i })).toBeVisible();
  await context.setOffline(false);
  await context.close();
});

test('keeps demo changes separate and resets them @claim:demo-isolation', async ({ page }) => {
  await page.goto('/demo');
  await page.getByLabel('Tempo in beats per minute').fill('156');
  await page.getByRole('button', { name: 'Reset demo' }).click();
  await expect(page.locator('#tempo-value')).toHaveText('112 BPM');
  await page.getByRole('link', { name: 'Start for real' }).click();
  await expect(page.locator('#tempo-value')).toHaveText('112 BPM');
});

test('requests microphone access only after Record your voice is pressed @claim:microphone-on-tap', async ({ page }) => {
  await page.goto('/demo');
  await page.evaluate(() => {
    (window as unknown as { micCalls: number }).micCalls = 0;
    Object.defineProperty(navigator.mediaDevices, 'getUserMedia', { configurable: true, value: async () => {
      (window as unknown as { micCalls: number }).micCalls += 1;
      throw new DOMException('denied', 'NotAllowedError');
    }});
  });
  expect(await page.evaluate(() => (window as unknown as { micCalls: number }).micCalls)).toBe(0);
  await page.getByRole('button', { name: 'Record your voice' }).click();
  await expect.poll(() => page.evaluate(() => (window as unknown as { micCalls: number }).micCalls)).toBe(1);
});

test('keeps demo audio in the browser during the full sample flow @claim:local-audio', async ({ page }) => {
  const urls: string[] = [];
  page.on('request', (request) => urls.push(request.url()));
  await page.goto('/demo');
  await page.getByRole('button', { name: /play loop/i }).click();
  await page.getByLabel('Tempo in beats per minute').fill('120');
  await page.locator('#trim-start').fill('0.1');
  await downloadBytes(page);
  await page.getByRole('button', { name: 'Reset demo' }).click();
  expect(urls.every((url) => new URL(url).origin === 'http://127.0.0.1:4173')).toBeTruthy();
});

test('keeps recording, cuts, looping, and export usable without a license @claim:free-core', async ({ page }) => {
  await page.goto('/demo');
  await expect(page.getByRole('button', { name: /play loop/i })).toBeEnabled();
  await expect(page.getByRole('button', { name: 'Export 16-second WAV' })).toBeEnabled();
  await expect(page.getByLabel('Start')).toBeEnabled();
});

test('keeps the unavailable checkout out of the product @claim:checkout-unavailable', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('New supporter purchases are unavailable.')).toBeVisible();
  await expect(page.locator('a[href*="/checkout"]')).toHaveCount(0);
});

test('enables custom pad labels after a valid supporter license @claim:supporter-labels', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => { window.fetch = async () => new Response(JSON.stringify({ valid: true }), { headers: { 'Content-Type': 'application/json' } }); });
  await page.getByLabel('License token').fill('valid-token');
  await page.getByRole('button', { name: 'Restore purchase' }).click();
  await expect(page.getByLabel('Name for selected pad')).toBeEnabled();
});

test('keeps a saved project in this browser after reload @claim:project-storage', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Load sample sounds' }).click();
  await page.getByLabel('Tempo in beats per minute').fill('120');
  await page.reload();
  await expect(page.locator('#tempo-value')).toHaveText('120 BPM');
  await expect(page.getByRole('button', { name: /play loop/i })).toBeEnabled();
});

test('discloses and sends a license token only when restore is requested @claim:license-token', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    (window as unknown as { license?: { url: string; hasOptions: boolean } }).license = undefined;
    window.fetch = async (input, options) => {
      (window as unknown as { license?: { url: string; hasOptions: boolean } }).license = { url: String(input), hasOptions: options !== undefined };
      return new Response(JSON.stringify({ valid: false }), { headers: { 'Content-Type': 'application/json' } });
    };
  });
  await page.getByLabel('License token').fill('old-token');
  await page.getByRole('button', { name: 'Restore purchase' }).click();
  await expect.poll(() => page.evaluate(() => (window as unknown as { license?: { url: string; hasOptions: boolean } }).license?.url)).toContain('verify?license=old-token');
  expect(await page.evaluate(() => (window as unknown as { license?: { url: string; hasOptions: boolean } }).license?.hasOptions)).toBe(false);
  await page.goto('/privacy');
  await expect(page.getByText(/sends only the license token to Sociobot/i)).toBeVisible();
});

test('loads the app before a slow license check finishes @claim:license-first-paint', async ({ page }) => {
  await page.route('https://api.sociobot.in/api/v1/products/voice-riff-loop/verify?license=slow-token', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    await route.fulfill({ json: { valid: true } });
  });
  await page.goto('/?license=slow-token', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'Make a rhythm loop from your voice' })).toBeVisible({ timeout: 500 });
});
