import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const base = 'https://voice-riff-loop.sociobot.in';
const out = '.factory/qa-4';
await mkdir(out, { recursive: true });

const result = {
  firstRead: {}, demo: {}, e2e: {}, accessibility: [], mobile: {},
  keyboard: {}, privacy: {}, pwa: {}, errors: []
};
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const browser = await chromium.launch();

try {
  const context = await browser.newContext({ acceptDownloads: true, viewport: { width: 1440, height: 960 } });
  const page = await context.newPage();
  const requests = [];
  const consoleErrors = [];
  const pageErrors = [];
  page.on('request', request => requests.push({ url: request.url(), method: request.method(), type: request.resourceType() }));
  page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  page.on('pageerror', error => pageErrors.push(error.message));

  const response = await page.goto(base + '/', { waitUntil: 'networkidle' });
  result.firstRead = {
    status: response?.status(),
    title: await page.title(),
    h1: await page.locator('h1').allTextContents(),
    audience: await page.locator('.lede').textContent(),
    primary: await page.getByRole('link', { name: 'Try it with sample data' }).textContent(),
    primaryVisible: await page.getByRole('link', { name: 'Try it with sample data' }).isVisible(),
    primaryInViewport: await page.getByRole('link', { name: 'Try it with sample data' }).evaluate(el => el.getBoundingClientRect().bottom <= innerHeight)
  };
  assert(result.firstRead.h1.length === 1, 'home must have exactly one h1');
  assert(result.firstRead.primaryVisible && result.firstRead.primaryInViewport, 'sample demo action must be visible in first screen');
  await page.screenshot({ path: out + '/cold-desktop.png', fullPage: true });

  await page.getByRole('link', { name: 'Try it with sample data' }).click();
  await page.waitForURL(base + '/demo');
  const padNames = await page.locator('[data-pad] span').allTextContents();
  result.demo = {
    url: page.url(),
    banner: await page.getByText(/Demo — sample data/).textContent(),
    pads: padNames,
    playEnabled: await page.getByRole('button', { name: 'Play loop' }).isEnabled(),
    databasesAfterHome: await page.evaluate(async () => (await indexedDB.databases()).map(db => db.name))
  };
  assert(padNames.join(',') === 'THUMP,TSS,AH,HUM', 'one-click demo must load four named sample pads');
  assert(result.demo.databasesAfterHome.includes('demo:voice-riff-loop'), 'demo storage must exist');

  await page.getByLabel('Tempo in beats per minute').fill('76');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export 16-second WAV' }).click();
  const download = await downloadPromise;
  const stream = await download.createReadStream();
  const chunks = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  const wav = Buffer.concat(chunks);
  result.e2e.wav = {
    filename: download.suggestedFilename(), bytes: wav.length,
    signature: wav.subarray(0, 4).toString('ascii'),
    seconds: wav.readUInt32LE(40) / wav.readUInt32LE(28)
  };
  assert(result.e2e.wav.signature === 'RIFF' && result.e2e.wav.seconds === 16, 'live WAV must be a 16-second RIFF');

  await page.getByLabel('Tempo in beats per minute').fill('156');
  await page.locator('#trim-start').focus();
  await page.keyboard.press('End');
  await page.locator('#trim-end').focus();
  await page.keyboard.press('Home');
  result.e2e.crossedTrim = {
    start: await page.locator('#trim-start').inputValue(),
    end: await page.locator('#trim-end').inputValue(),
    readout: await page.locator('.cut-readout').textContent()
  };
  assert(result.e2e.crossedTrim.start === '0.97' && result.e2e.crossedTrim.end === '1', 'crossed trim controls must stay synchronized');

  await page.setInputFiles('#import-project', { name: 'broken.json', mimeType: 'application/json', buffer: Buffer.from('{"wrong":true}') });
  await page.getByText('That project file could not be imported. Choose a Voice Riff Loop project file.').waitFor();
  result.e2e.invalidImportRecovery = await page.locator('.notice').textContent();
  await page.getByRole('button', { name: 'Load sample sounds' }).click();
  await page.getByText('Four sample sounds are ready. Tap any pad, then play the loop.').waitFor();

  await page.getByRole('button', { name: 'Play loop' }).click();
  await page.waitForTimeout(250);
  await page.getByLabel('Main navigation').getByRole('link', { name: 'Privacy' }).click();
  await page.waitForURL(base + '/privacy');
  await page.waitForTimeout(250);
  await page.goBack();
  await page.getByRole('button', { name: 'Play loop' }).waitFor();
  result.e2e.routeWhilePlaying = 'no page error';

  const seenOrigins = [...new Set(requests.map(r => new URL(r.url).origin))];
  result.privacy = { requestCount: requests.length, origins: seenOrigins, requests, consoleErrors, pageErrors };
  assert(seenOrigins.every(origin => origin === base), 'core flow made a cross-origin request');
  assert(consoleErrors.length === 0 && pageErrors.length === 0, 'core flow produced console/page errors');
  await context.close();

  const directDemoContext = await browser.newContext();
  const directDemoPage = await directDemoContext.newPage();
  await directDemoPage.goto(base + '/demo');
  result.demo.directDatabases = await directDemoPage.evaluate(async () => (await indexedDB.databases()).map(db => db.name));
  assert(result.demo.directDatabases.includes('demo:voice-riff-loop') && !result.demo.directDatabases.includes('voice-riff-loop'), 'direct demo opened real project storage');
  await directDemoContext.close();

  const deniedContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const deniedPage = await deniedContext.newPage();
  await deniedPage.goto(base + '/');
  await deniedPage.evaluate(() => Object.defineProperty(navigator.mediaDevices, 'getUserMedia', { configurable: true, value: async () => { throw new DOMException('denied', 'NotAllowedError'); } }));
  await deniedPage.getByRole('button', { name: 'Record your voice' }).click();
  await deniedPage.getByText('Microphone access was not granted. Allow it in your browser, then try recording again.').waitFor();
  await deniedPage.getByRole('button', { name: 'Load sample sounds' }).click();
  await deniedPage.getByText('Four sample sounds are ready. Tap any pad, then play the loop.').waitFor();
  result.e2e.permissionDenialRecovery = 'clear error followed by successful sample load';
  await deniedContext.close();

  for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 960 }]) {
    const axeContext = await browser.newContext({ viewport });
    const axePage = await axeContext.newPage();
    for (const path of ['/', '/demo', '/privacy', '/terms', '/not-a-route', '/404.html']) {
      await axePage.goto(base + path);
      const report = await new AxeBuilder({ page: axePage }).analyze();
      const serious = report.violations.filter(v => ['serious', 'critical'].includes(v.impact || ''));
      const targetFailures = await axePage.locator('a, button, input, select, textarea').evaluateAll(elements => elements.filter(el => {
        const rect = el.getBoundingClientRect(); const style = getComputedStyle(el);
        return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0 && (rect.width < 44 || rect.height < 44);
      }).map(el => { const rect = el.getBoundingClientRect(); return { name: el.getAttribute('aria-label') || el.textContent?.trim() || el.id, width: rect.width, height: rect.height }; }));
      const overflow = await axePage.evaluate(() => document.documentElement.scrollWidth > innerWidth);
      result.accessibility.push({ viewport: viewport.width, path, serious: serious.map(v => v.id), targetFailures, overflow });
      assert(serious.length === 0, `axe serious/critical on ${path} at ${viewport.width}`);
      assert(targetFailures.length === 0, `touch target failure on ${path} at ${viewport.width}`);
      assert(!overflow, `horizontal overflow on ${path} at ${viewport.width}`);
    }
    await axeContext.close();
  }

  // Use a fresh browser process so this real-user mobile pass is not affected
  // by AudioContexts created by the preceding multi-route axe sweep.
  const mobileBrowser = await chromium.launch();
  const mobileContext = await mobileBrowser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  const mobilePage = await mobileContext.newPage();
  const mobileErrors = [];
  mobilePage.on('console', msg => { if (msg.type() === 'error') mobileErrors.push(msg.text()); });
  mobilePage.on('pageerror', error => mobileErrors.push(error.stack || error.message));
  await mobilePage.goto(base + '/demo');
  await mobilePage.keyboard.press('Tab');
  result.keyboard.firstTab = await mobilePage.evaluate(() => document.activeElement?.textContent?.trim());
  await mobilePage.keyboard.press('Enter');
  result.keyboard.skipTarget = await mobilePage.evaluate(() => location.hash);
  const tempo = mobilePage.getByLabel('Tempo in beats per minute');
  await tempo.focus(); await mobilePage.keyboard.press('Home');
  result.keyboard.tempoHome = await tempo.inputValue();
  await mobilePage.keyboard.press('End');
  result.keyboard.tempoEnd = await tempo.inputValue();
  await mobilePage.getByRole('button', { name: 'Play loop' }).focus();
  result.keyboard.focusStyle = await mobilePage.getByRole('button', { name: 'Play loop' }).evaluate(el => ({ outline: getComputedStyle(el).outline, outlineOffset: getComputedStyle(el).outlineOffset }));
  await mobilePage.keyboard.press('Space');
  await mobilePage.getByRole('button', { name: 'Stop loop' }).waitFor();
  await mobilePage.keyboard.press('Space');
  await mobilePage.getByRole('button', { name: 'Play loop' }).waitFor();
  result.keyboard.playSpace = true;
  result.mobile = {
    viewport: await mobilePage.evaluate(() => [innerWidth, innerHeight]),
    scrollWidth: await mobilePage.evaluate(() => document.documentElement.scrollWidth),
    recordingAnimation: await mobilePage.locator('.record').evaluate(el => getComputedStyle(el).animationName),
    transitionDuration: await mobilePage.locator('.step').first().evaluate(el => getComputedStyle(el).transitionDuration),
    errors: mobileErrors
  };
  assert(result.keyboard.firstTab === 'Skip to loop maker', 'skip link must be first tab stop');
  assert(result.keyboard.tempoHome === '76' && result.keyboard.tempoEnd === '156', 'tempo keyboard boundaries failed');
  await mobilePage.screenshot({ path: out + '/demo-mobile-390.png', fullPage: true });
  await mobileContext.close();
  await mobileBrowser.close();
  assert(result.mobile.scrollWidth <= 390 && mobileErrors.length === 0, 'mobile overflow or errors');

  const offlineContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const offlinePage = await offlineContext.newPage();
  await offlinePage.goto(base + '/demo', { waitUntil: 'domcontentloaded' });
  await offlinePage.evaluate(() => navigator.serviceWorker.ready);
  await offlinePage.reload();
  await offlinePage.waitForFunction(() => navigator.serviceWorker.controller !== null);
  const cacheNamesBefore = await offlinePage.evaluate(() => caches.keys());
  await offlineContext.setOffline(true);
  await offlinePage.reload({ waitUntil: 'domcontentloaded', timeout: 10000 });
  result.pwa.offline = {
    heading: await offlinePage.getByRole('heading', { name: /record, cut, and loop four sounds/i }).textContent(),
    pads: await offlinePage.locator('[data-pad]').count(), cacheNamesBefore
  };
  assert(result.pwa.offline.pads === 4, 'offline demo lost sample pads');
  await offlineContext.setOffline(false);
  await offlineContext.close();

  result.pwa.update = { evidence: 'update-qa.json' };
} catch (error) {
  result.errors.push(error.stack || String(error));
  process.exitCode = 1;
} finally {
  await browser.close();
  await writeFile(out + '/live-qa.json', JSON.stringify(result, null, 2));
}
