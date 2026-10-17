import { mkdir, readFile, writeFile } from 'node:fs/promises';
// Bundled local HTML. Optional remote car images and font still require internet.
let html=await readFile('index.html','utf8');
const css=await readFile('src/styles.css','utf8');
const scripts=await Promise.all(['car-media','car-images','calculator','affiliates','share','app'].map(name=>readFile(`src/${name}.js`,'utf8')));
const js=scripts.map(source=>source.replace(/^import .*?;\n/gm,'').replace(/^export /gm,'')).join('\n');
html=html.replace(/<link rel="stylesheet" href="\.\/src\/styles\.css(?:\?[^\"]*)?">/,()=>`<style>${css}</style>`);
html=html.replace(/<script type="module" src="\.\/src\/app\.js(?:\?[^\"]*)?"><\/script>/,()=>`<script type="module">${js}</script>`);
for(const [file,mime] of [['favicon.svg','image/svg+xml'],['showroom.png','image/png']]){
 const buffer=await readFile(`public/${file}`);html=html.replaceAll(`./public/${file}`,`data:${mime};base64,${buffer.toString('base64')}`);
}
await mkdir('artifacts',{recursive:true});await writeFile('artifacts/chabunhi-preview.html',html);
console.log('Standalone preview → artifacts/chabunhi-preview.html');
