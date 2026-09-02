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
