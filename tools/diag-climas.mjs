// Diagnóstico: o clima depende da ordem de troca? Mede o brilho médio de cada vista por clima,
// carregando direto e depois de passar pelos outros climas.
import { build, preview } from 'vite';
import { createRequire } from 'node:module';
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { chromium } = createRequire(import.meta.url)('playwright');
const out = process.argv[2] || path.join(root, '.cache', 'diag');
fs.mkdirSync(out, { recursive: true });
const outBuild = path.join(root, '.cache', 'diag-build');
if (!process.env.NOBUILD) await build({ root, logLevel: 'error', build: { outDir: outBuild, emptyOutDir: true } });
const port = 4900 + Math.floor(Math.random() * 400);
const server = await preview({ root, logLevel: 'error', build: { outDir: outBuild }, preview: { port, host: '127.0.0.1', strictPort: true } });
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 480, height: 270 }, deviceScaleFactor: 1 });
const errs = []; page.on('pageerror', e => errs.push(String(e))); page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
const VIEWS = (process.env.VIEWS || 'Cinema,Altar').split(',');
async function measure(tag) {
  const r = {};
  for (const v of VIEWS) {
    const d = await page.evaluate(async v => {
      const c = window.__cap; const f = c.allViews().find(x => x.n === v); c.view(f);
      const url = c.shot(true);
      const img = new Image(); img.src = url; await img.decode();
      const cv = document.createElement('canvas'); cv.width = img.width; cv.height = img.height;
      const g = cv.getContext('2d'); g.drawImage(img, 0, 0); const d = g.getImageData(0, 0, cv.width, cv.height).data;
      let s = 0; for (let i = 0; i < d.length; i += 4) s += (d[i] + d[i + 1] + d[i + 2]) / 3;
      return { m: s / (d.length / 4), url };
    }, v);
    r[v] = d.m.toFixed(1);
    fs.writeFileSync(path.join(out, `${tag}_${v}.png`), Buffer.from(d.url.split(',')[1], 'base64'));
  }
  console.log(tag.padEnd(26), JSON.stringify(r));
}
const start = +(process.env.START || 4);
await page.goto(`http://127.0.0.1:${port}/?capture=1&ui=0&map=${process.env.MAP || 'igreja'}&time=${start}&q=baixa`);
await page.waitForFunction(() => window.__capReady === true, null, { timeout: 600000 });
await measure(`t${start}-direto`);
for (const seq of (process.env.SEQ || '3,4|0,1,2,3,4|4|4').split('|')) {
  for (const i of seq.split(',')) await page.evaluate(i => window.__cap.time(+i), i);
  await measure(`t${seq.split(',').pop()}-apos-${seq}`);
}
if (errs.length) console.log('ERROS:', errs.slice(0, 10).join('\n'));
await browser.close(); await server.close(); process.exit(0);
