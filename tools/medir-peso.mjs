// Mede draws e triângulos de um mapa (Baixa e Alta); --lista mostra as 20 malhas mais pesadas. Uso: npx vite build --outDir .cache/capturas-build && node tools/medir-peso.mjs <mapa>
import { preview } from 'vite'; import { createRequire } from 'module';
const require = createRequire(import.meta.url); const { chromium } = require('playwright');
const root = process.cwd(), port = 4911, map = process.argv[2] || 'texas'; // --dist=dist-lite mede a versão leve (a publicada)
const srv = await preview({ root, logLevel: 'error', build: { outDir: root + '/' + ((process.argv.find(a => a.startsWith('--dist=')) || '').slice(7) || '.cache/capturas-build') }, preview: { port, host: '127.0.0.1' } });
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
for (const q of ['baixa', 'alta']) {
  const p = await b.newPage({ viewport: { width: 800, height: 450 } }); const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto(`http://127.0.0.1:${port}/?map=${map}&q=${q}&fps=1&ui=0`);
  await p.waitForFunction(() => document.getElementById('fps')?.textContent?.includes('draws'), null, { timeout: 300000 });
  await p.waitForTimeout(4000); console.log(q, await p.$eval('#fps', e => e.textContent), errs.slice(0, 3));
  if (process.argv.includes('--lista')) console.log(await p.evaluate(() => window.__peso(20))); await p.close();
}
await b.close(); srv.httpServer.close();
