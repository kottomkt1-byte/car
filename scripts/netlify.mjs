import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import './standalone.mjs';

// A manual upload needs only index.html. Core assets cannot be lost separately.
const html = await readFile('artifacts/chabunhi-preview.html', 'utf8');
if (/\.\/(?:src|public)\//.test(html) || !html.includes('<style>') || !html.includes('<script type="module">')) {
  throw new Error('Netlify bundle still depends on local assets or is missing inline CSS/JavaScript.');
}
await rm('netlify-dist', { recursive: true, force: true });
await mkdir('netlify-dist', { recursive: true });
await writeFile('netlify-dist/index.html', html);
console.log('Netlify bundle → netlify-dist/index.html (CSS, JavaScript and local images embedded)');
