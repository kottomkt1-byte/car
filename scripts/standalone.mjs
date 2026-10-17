import { mkdir, readFile, writeFile } from 'node:fs/promises';
// One local file that also runs over file://; it contains no external requests.
let html = await readFile('index.html', 'utf8');
const css = await readFile('src/styles.css', 'utf8');
const scripts = await Promise.all(['calculator', 'affiliates', 'share', 'app'].map(name => readFile(`src/${name}.js`, 'utf8')));
const js = scripts.map(source => source.replace(/^import .*?;\n/gm, '').replace(/^export /gm, '')).join('\n');
html = html.replace('<link rel="stylesheet" href="./src/styles.css">', () => `<style>${css}</style>`);
html = html.replace('<script type="module" src="./src/app.js"></script>', () => `<script type="module">${js}</script>`);
for (const file of ['car.svg', 'favicon.svg']) {
  const svg = await readFile(`public/${file}`);
  html = html.replaceAll(`./public/${file}`, `data:image/svg+xml;base64,${svg.toString('base64')}`);
}
await mkdir('artifacts', { recursive: true });
await writeFile('artifacts/chabunhi-preview.html', html);
console.log('Standalone preview → artifacts/chabunhi-preview.html');
