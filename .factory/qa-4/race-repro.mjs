import { chromium } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

const browser = await chromium.launch();
const runs = [];
for (let index = 0; index < 20; index++) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.stack || error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(`console: ${message.text()}`); });
  try {
    await page.goto('https://voice-riff-loop.sociobot.in/demo');
    const checkpoints = { afterGoto: errors.length };
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    checkpoints.afterSkip = errors.length;
    const tempo = page.getByLabel('Tempo in beats per minute');
    await tempo.focus();
    await page.keyboard.press('Home');
    await page.keyboard.press('End');
    await page.waitForTimeout(25);
    checkpoints.afterTempo = errors.length;
    const play = page.getByRole('button', { name: 'Play loop' });
    await play.waitFor();
    await play.focus();
    await page.keyboard.press('Space');
    await page.waitForTimeout(200);
    const stopVisible = await page.getByRole('button', { name: 'Stop loop' }).isVisible().catch(() => false);
    if (stopVisible) await page.keyboard.press('Space');
    await page.waitForTimeout(100);
    checkpoints.afterPlay = errors.length;
    runs.push({ index, stopVisible, checkpoints, errors });
  } catch (error) { runs.push({ index, harnessError: error.stack || String(error), errors }); }
  await context.close();
}
await browser.close();
await writeFile('.factory/qa-4/race-repro.json', JSON.stringify(runs, null, 2));
const failures = runs.filter(run => run.errors.length || run.harnessError || !run.stopVisible);
console.log(JSON.stringify({ total: runs.length, failures }, null, 2));
if (failures.length) process.exitCode = 1;
