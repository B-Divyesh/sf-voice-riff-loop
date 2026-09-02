import { chromium } from '@playwright/test';
import { createServer } from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';

const log = message => process.stdout.write(message + '\n');
const candidateWorker = await readFile('dist/sw.js', 'utf8');
const oldWorker = `const VERSION='voice-riff-loop-qa-old';self.addEventListener('install',e=>e.waitUntil(caches.open(VERSION).then(c=>c.addAll(['/','/demo']))));self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));self.addEventListener('fetch',e=>{if(e.request.method==='GET'&&new URL(e.request.url).origin===self.location.origin)e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)))})`;
let candidate = false;
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json' };
const server = createServer(async (request, response) => {
  const pathname = new URL(request.url || '/', 'http://127.0.0.1').pathname;
  if (pathname === '/sw.js') {
    response.writeHead(200, { 'Content-Type': 'text/javascript', 'Cache-Control': 'no-cache' });
    response.end(candidate ? candidateWorker : oldWorker);
    return;
  }
  const relative = ['/', '/demo', '/privacy', '/terms'].includes(pathname) ? 'index.html' : pathname.replace(/^\//, '');
  try { const body = await readFile(join('dist', relative)); response.writeHead(200, { 'Content-Type': mime[extname(relative)] || 'application/octet-stream' }); response.end(body); }
  catch { response.writeHead(404); response.end('not found'); }
});
await new Promise(resolve => server.listen(4175, '127.0.0.1', resolve));
log('server ready');
const browser = await chromium.launch();
const context = await browser.newContext();
const page = await context.newPage();
page.on('console', message => log(`console ${message.type()}: ${message.text()}`));
page.on('pageerror', error => log(`pageerror: ${error.message}`));
const result = {};
try {
  await page.goto('http://127.0.0.1:4175/demo', { waitUntil: 'domcontentloaded', timeout: 10000 });
  log('page loaded');
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null || document.readyState === 'complete', null, { timeout: 10000 });
  await page.evaluate(() => Promise.race([navigator.serviceWorker.ready, new Promise((_, reject) => setTimeout(() => reject(new Error('ready timeout')), 10000))]));
  log('worker ready');
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 10000 });
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null, null, { timeout: 10000 });
  log('old worker controlling');
  result.oldCaches = await page.evaluate(() => caches.keys());
  candidate = true;
  await page.evaluate(async () => { const registration = await navigator.serviceWorker.getRegistration(); await registration.update(); });
  log('update requested');
  await page.getByRole('button', { name: 'Update available' }).waitFor({ timeout: 10000 });
  result.updateShown = true;
  log('update shown');
  const errors = [];
  page.on('pageerror', error => errors.push(error.stack || error.message));
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 10000 });
  await page.getByRole('button', { name: 'Update available' }).waitFor({ timeout: 10000 });
  await page.waitForTimeout(500);
  result.reloadWithWaitingWorkerErrors = errors;
  log(`waiting-worker reload errors: ${errors.length}`);
  await page.getByRole('button', { name: 'Update available' }).click({ noWaitAfter: true });
  await page.waitForFunction(() => !caches.keys().then(names => names.includes('voice-riff-loop-qa-old')), null, { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(1000);
  result.newCaches = await page.evaluate(() => caches.keys());
  result.pads = await page.locator('[data-pad]').count();
  result.activeScript = await page.evaluate(async () => (await navigator.serviceWorker.getRegistration())?.active?.scriptURL);
  await writeFile('.factory/qa-4/update-qa.json', JSON.stringify(result, null, 2));
  log(JSON.stringify(result));
} finally {
  await context.close();
  await browser.close();
  server.closeAllConnections();
  server.close();
}
