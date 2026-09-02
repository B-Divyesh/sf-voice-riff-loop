import { expect, test } from '@playwright/test';

test('loads four sample sounds without a recording @claim:sample-loop', async ({ page }) => {
  await page.goto('/demo');
  await expect(page.getByText('Demo — sample data, nothing is saved')).toBeVisible();
  await expect(page.getByRole('button', { name: /play loop/i })).toBeEnabled();
  await expect(page.locator('[data-pad]')).toHaveCount(4);
});

test('exports a 16-second WAV from the sample @claim:wav-export', async ({ page }) => {
  await page.goto('/demo');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export 16-second WAV' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('voice-riff-loop.wav');
  expect((await download.createReadStream())?.readable).toBeTruthy();
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

test('sends no third-party request while using sample data @claim:local-only', async ({ page }) => {
  const urls: string[] = [];
  page.on('request', (request) => urls.push(request.url()));
  await page.goto('/demo');
  await page.getByRole('button', { name: /play loop/i }).click();
  await page.waitForTimeout(100);
  expect(urls.every((url) => new URL(url).origin === 'http://127.0.0.1:4173')).toBeTruthy();
});
