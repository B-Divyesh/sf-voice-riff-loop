import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';

const files = await readdir('dist/assets');
const assets = files.filter((file) => /\.(js|css|webp|svg)$/.test(file)).map((file) => `/assets/${file}`);
const source = await readFile('public/sw.js', 'utf8');
const version = createHash('sha256').update(assets.join('|')).digest('hex').slice(0, 12);
await writeFile('dist/sw.js', source
  .replace("'__ASSETS__'", assets.map((asset) => `'${asset}'`).join(','))
  .replace('__VERSION__', version));
