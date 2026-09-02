import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('has no serious accessibility violations on the demo', async ({ page }) => {
  await page.goto('/demo');
  const report = await new AxeBuilder({ page }).analyze();
  const serious = report.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact || ''));
  expect(serious).toEqual([]);
});
