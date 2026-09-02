import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

async function expectMinimumTouchTargets(page: import('@playwright/test').Page, path: string) {
  await page.goto(path);
  const targets = await page.locator('a, button, input, select, textarea').evaluateAll((elements) => elements
    .filter((element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
    })
    .map((element) => {
      const rect = element.getBoundingClientRect();
      return {
        name: element.getAttribute('aria-label') || element.textContent?.trim() || element.id || element.tagName,
        width: rect.width,
        height: rect.height
      };
    }));
  for (const target of targets) {
    expect(target.width, `${path}: ${target.name} is narrower than 44px`).toBeGreaterThanOrEqual(44);
    expect(target.height, `${path}: ${target.name} is shorter than 44px`).toBeGreaterThanOrEqual(44);
  }
}

test('has no serious accessibility violations on every route at desktop and mobile', async ({ page }) => {
  for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 960 }]) {
    await page.setViewportSize(viewport);
    for (const path of ['/', '/demo', '/privacy', '/terms', '/not-a-route', '/404.html']) {
      await page.goto(path);
      const report = await new AxeBuilder({ page }).analyze();
      const serious = report.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact || ''));
      expect(serious, `${path} at ${viewport.width}px`).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `${path} at ${viewport.width}px overflows horizontally`).toBeTruthy();
    }
  }
});

test('keeps the skip link first and motion disabled when requested', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/demo');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to loop maker' })).toBeFocused();
  await page.getByRole('button', { name: 'Record your voice' }).click();
  await expect(page.getByRole('button', { name: 'Record your voice' })).toBeVisible();
  expect(await page.locator('.record').evaluate((element) => getComputedStyle(element).animationName)).not.toBe('pulse');
});

test('gives every visible link and control a 44 by 44 px target on mobile and desktop', async ({ page }) => {
  for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 960 }]) {
    await page.setViewportSize(viewport);
    for (const path of ['/', '/demo', '/privacy', '/terms', '/not-a-route', '/404.html']) await expectMinimumTouchTargets(page, path);
  }
});

test('synchronizes crossed trim handles in the DOM, readout, and saved project', async ({ page }) => {
  await page.goto('/demo');
  const start = page.locator('#trim-start');
  const end = page.locator('#trim-end');

  await start.focus();
  await page.keyboard.press('End');
  await expect(start).toHaveValue('0.97');
  await expect(end).toHaveValue('1');
  await expect(page.locator('.cut-readout')).toHaveText('PAD 1 · 0.97–1.00 SEC');

  await end.focus();
  await page.keyboard.press('Home');
  await expect(start).toHaveValue('0.97');
  await expect(end).toHaveValue('1');
  await expect(page.locator('.cut-readout')).toHaveText('PAD 1 · 0.97–1.00 SEC');

  await expect.poll(() => page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('demo:voice-riff-loop');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    return await new Promise<{ start: number; end: number }>((resolve, reject) => {
      const request = db.transaction('projects', 'readonly').objectStore('projects').get('current');
      request.onsuccess = () => resolve({ start: request.result.project.pads[0].start, end: request.result.project.pads[0].end });
      request.onerror = () => reject(request.error);
    });
  })).toEqual({ start: .97, end: 1 });
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
