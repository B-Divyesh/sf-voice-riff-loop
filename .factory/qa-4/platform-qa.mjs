import { chromium } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

const base = 'https://voice-riff-loop.sociobot.in';
const browser = await chromium.launch({ args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'] });
const result = { recording: {}, transfer: {}, license: {}, metadata: {}, navigation: {}, interaction: {}, errors: [] };
const assert = (condition, message) => { if (!condition) throw new Error(message); };
try {
  const context = await browser.newContext({ acceptDownloads: true, permissions: ['microphone'], viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.stack || error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto(base + '/');
  assert(!(await page.getByRole('button', { name: 'Play loop' }).isEnabled()), 'play unexpectedly enabled before recording');
  await page.getByRole('button', { name: 'Record your voice' }).click();
  await page.getByRole('button', { name: 'Stop recording' }).waitFor();
  await page.waitForTimeout(800);
  await page.getByRole('button', { name: 'Stop recording' }).click();
  await page.getByText('Recording is ready. Cut each pad, then play the loop.').waitFor({ timeout: 10000 });
  result.recording = await page.evaluate(async () => {
    const db = await new Promise((resolve, reject) => { const request = indexedDB.open('voice-riff-loop'); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
    const stored = await new Promise((resolve, reject) => { const request = db.transaction('projects', 'readonly').objectStore('projects').get('current'); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
    return { audioType: stored.audio.type, audioSize: stored.audio.size, duration: stored.project.duration, pads: stored.project.pads.length };
  });
  await page.reload();
  result.recording.playEnabledAfterReload = await page.getByRole('button', { name: 'Play loop' }).isEnabled();
  assert(result.recording.audioSize > 0 && result.recording.duration > 0 && result.recording.pads === 4 && result.recording.playEnabledAfterReload, 'recorded project did not persist');

  await page.getByRole('button', { name: 'Load sample sounds' }).click();
  await page.getByLabel('Tempo in beats per minute').fill('120');
  await page.locator('#trim-start').fill('0.12');
  const projectDownloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export project' }).click();
  const projectDownload = await projectDownloadPromise;
  const projectPath = await projectDownload.path();
  const destinationContext = await browser.newContext();
  const destination = await destinationContext.newPage();
  await destination.goto(base + '/');
  await destination.setInputFiles('#import-project', projectPath);
  await destination.getByText('Project imported. Your recording, cuts, labels, and tempo are ready.').waitFor();
  result.transfer = { tempo: await destination.locator('#tempo').inputValue(), start: await destination.locator('#trim-start').inputValue(), playEnabled: await destination.getByRole('button', { name: 'Play loop' }).isEnabled() };
  await destination.reload();
  result.transfer.survivedReload = await destination.locator('#trim-start').inputValue() === '0.12';
  assert(result.transfer.tempo === '120' && result.transfer.start === '0.12' && result.transfer.playEnabled && result.transfer.survivedReload, 'live project transfer failed');
  await destinationContext.close();

  const licenseRequests = [];
  page.on('request', request => { if (request.url().includes('/verify?license=')) licenseRequests.push({ url: request.url(), method: request.method(), postData: request.postData() }); });
  let licenseResponse;
  page.on('response', response => { if (response.url().includes('/verify?license=')) licenseResponse = response; });
  await page.goto(base + '/');
  await page.getByLabel('License token').fill('qa-browser-e31da830');
  await page.getByRole('button', { name: 'Restore purchase' }).click();
  await page.getByText('That license is not active. New supporter purchases are unavailable.').waitFor({ timeout: 10000 });
  result.license = { requests: licenseRequests, status: licenseResponse?.status(), headers: await licenseResponse?.allHeaders(), urlAfter: page.url() };
  assert(licenseRequests.length === 1 && licenseRequests[0].method === 'GET' && licenseRequests[0].postData === null, 'license validation request shape failed');

  const cdp = await context.newCDPSession(page);
  const manifest = await cdp.send('Page.getAppManifest');
  result.metadata = { manifestUrl: manifest.url, manifestErrors: manifest.errors, title: await page.title(), lang: await page.locator('html').getAttribute('lang'), h1Count: await page.locator('h1').count() };
  assert(manifest.errors.length === 0, 'manifest has Chromium parse errors');

  await page.getByLabel('Main navigation').getByRole('link', { name: 'Privacy' }).click();
  result.navigation.privacy = { url: page.url(), title: await page.title(), focused: await page.evaluate(() => document.activeElement?.tagName + ':' + document.activeElement?.textContent?.trim()) };
  await page.goBack();
  result.navigation.back = { url: page.url(), title: await page.title() };

  await page.evaluate(() => {
    window.__events = [];
    new PerformanceObserver(list => { for (const entry of list.getEntries()) window.__events.push(entry.duration); }).observe({ type: 'event', durationThreshold: 16 });
  });
  await page.getByRole('button', { name: 'Play loop' }).click();
  await page.waitForTimeout(250);
  await page.getByRole('button', { name: 'Stop loop' }).click();
  result.interaction.maxEventDuration = await page.evaluate(() => Math.max(0, ...window.__events));
  result.errors = errors;
  await context.close();
} catch (error) {
  result.errors.push(error.stack || String(error));
  process.exitCode = 1;
} finally {
  await browser.close();
  await writeFile('.factory/qa-4/platform-qa.json', JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
}
