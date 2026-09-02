import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('has no serious accessibility violations on the demo', async ({ page }) => {
  await page.goto('/demo');
  const report = await new AxeBuilder({ page }).analyze();
  const serious = report.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact || ''));
  expect(serious).toEqual([]);
});

test('keeps the skip link first, touch targets 44px, and motion disabled when requested', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/demo');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to loop maker' })).toBeFocused();
  const targets = page.locator('.site-header a, footer a, .demo-banner a, .demo-banner button, input[type=range]');
  for (const box of await targets.evaluateAll((elements) => elements.map((element) => {
    const rect = element.getBoundingClientRect();
    return { width: rect.width, height: rect.height };
  }))) expect(box.height).toBeGreaterThanOrEqual(44);
  await page.getByRole('button', { name: 'Record your voice' }).click();
  await expect(page.getByRole('button', { name: 'Record your voice' })).toBeVisible();
  expect(await page.locator('.record').evaluate((element) => getComputedStyle(element).animationName)).not.toBe('pulse');
});

test('stops and disposes playback before an internal route removes its controls', async ({ page }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));

  await page.goto('/demo');
  await page.getByRole('button', { name: 'Play loop' }).click();
  await page.waitForTimeout(250);
  await page.getByLabel('Main navigation').getByRole('link', { name: 'Privacy' }).click();
  await expect(page).toHaveURL('/privacy');
  await page.waitForTimeout(250);
  expect(pageErrors).toEqual([]);

  await page.goBack();
  await expect(page.getByRole('button', { name: 'Play loop' })).toBeVisible();
  expect(pageErrors).toEqual([]);
});

test('sets the title and canonical URL for every app route', async ({ page }) => {
  for (const [path, title] of [
    ['/demo', 'Demo — Voice Riff Loop'],
    ['/privacy', 'Privacy — Voice Riff Loop'],
    ['/terms', 'Terms — Voice Riff Loop'],
  ]) {
    await page.goto(path);
    await expect(page).toHaveTitle(title);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://voice-riff-loop.sociobot.in${path}`);
  }
});

test('keeps the first service worker install from shifting the mobile layout', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  let releaseImage = () => {};
  const imageBlocked = new Promise<void>((resolve) => { releaseImage = resolve; });
  await page.route('**/hero-cassette-*.webp', async (route) => { await imageBlocked; await route.continue(); });
  await page.addInitScript(() => {
    (window as unknown as { unexpectedLayoutShift: number }).unexpectedLayoutShift = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const shift = entry as PerformanceEntry & { hadRecentInput: boolean; value: number };
        if (!shift.hadRecentInput) (window as unknown as { unexpectedLayoutShift: number }).unexpectedLayoutShift += shift.value;
      }
    }).observe({ type: 'layout-shift', buffered: true });
  });

  await page.goto('http://127.0.0.1:4173/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.hero-art')).toBeVisible();
  expect((await page.locator('.hero-art').boundingBox())?.width).toBeGreaterThanOrEqual(350);
  releaseImage();
  await page.locator('.hero-art img').evaluate((image: HTMLImageElement) => image.decode());
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.waitForTimeout(300);
  await expect(page.getByRole('button', { name: 'Update available' })).toHaveCount(0);
  expect(await page.evaluate(() => (window as unknown as { unexpectedLayoutShift: number }).unexpectedLayoutShift)).toBeLessThan(0.1);
  await context.close();
});
