// Capturas automáticas: abre a cena em câmeras fixas e climas e salva em capturas/<rodada>/.
// Uso:  npm run capturas -- [rótulo] [--map=igreja] [--q=alta] [--w=1280] [--h=720] [--only=cinema,altar] [--times=0,1] [--png]
// Gera também uma folha comparativa com as imagens de referencias/.
import { build, preview } from 'vite';
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
function loadPlaywright() {
  try { return require('playwright'); } catch (_) {
    const g = execSync('npm root -g').toString().trim();
    return require(path.join(g, 'playwright'));
  }
}
const { chromium } = loadPlaywright();

const args = process.argv.slice(2);
const opt = Object.fromEntries(args.filter(a => a.startsWith('--')).map(a => { const [k, v] = a.slice(2).split('='); return [k, v ?? '1']; }));
const label = args.find(a => !a.startsWith('--')) || 'rodada';
const MAP = opt.map || 'igreja';
const W = +(opt.w || 1280), H = +(opt.h || 720);
const TIMES = (opt.times || '0,1').split(',').map(Number);
const TIME_NAMES = ['terror', 'anoitecer', 'crepusculo', 'nublado', 'noite'];

// Câmeras fixas de captura. As 4 primeiras usam as vistas do mapa pelo nome; "terceira" usa o modo caminhar.
const SHOTS = [
  { id: 'cinema', view: 'Cinema' },
  { id: 'fachada', view: 'Fachada' },
  { id: 'altar', view: 'Altar' },
  { id: 'coro', view: 'Coro' },
  { id: 'terceira', third: { x: 0.7, z: 18, yaw: 0, pitch: -0.08 } },
].filter(s => !opt.only || opt.only.split(',').includes(s.id));

const stamp = new Date().toISOString().replace(/[-:]/g, '').slice(0, 13).replace('T', '-');
// grava numa pasta temporária (ignorada pelo git) e renomeia no fim
const finalDir = path.join(root, 'capturas', `${stamp}-${label}`);
const outDir = path.join(root, 'capturas', `_em-andamento-${stamp}-${label}`);
fs.mkdirSync(outDir, { recursive: true });

// build de produção numa pasta temporária (imune a edições durante a captura)
const outBuild = path.join(root, '.cache', 'capturas-build');
await build({ root, logLevel: 'error', build: { outDir: outBuild, emptyOutDir: true } });
const port = 4300 + Math.floor(Math.random() * 500);
const server = await preview({ root, logLevel: 'error', build: { outDir: outBuild }, preview: { port, host: '127.0.0.1', strictPort: true } });

const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
const errors = [];
page.on('pageerror', e => errors.push(String(e)));
page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errors.push(`[${m.type()}] ${m.text()}`); });

const files = [];
const t0 = Date.now();
for (const time of TIMES) {
  const url = `http://127.0.0.1:${port}/?capture=1&ui=0&map=${MAP}&time=${time}&q=${opt.q || 'alta'}`;
  await page.goto(url);
  const tl = Date.now();
  await page.waitForFunction(() => window.__capReady === true, null, { timeout: 600000 });
  console.log(`  cena pronta em ${((Date.now() - tl) / 1000).toFixed(0)} s`);
  for (const s of SHOTS) {
    const ok = await page.evaluate(({ s }) => {
      const c = window.__cap;
      if (s.third) { c.third(s.third); return true; }
      const all = c.allViews();
      const f = all.find(x => x.n === s.view);
      if (!f) return false;
      c.view(f); return true;
    }, { s });
    if (!ok) { console.log(`(sem vista "${s.view}" no mapa ${MAP})`); continue; }
    const t1 = Date.now();
    const data = await page.evaluate(png => window.__cap.shot(png), !!opt.png);
    const file = path.join(outDir, `${s.id}_${TIME_NAMES[time] || time}.${opt.png ? 'png' : 'jpg'}`);
    fs.writeFileSync(file, Buffer.from(data.split(',')[1], 'base64'));
    files.push({ file, s: s.id, time });
    console.log(`✓ ${path.relative(root, file)}  (${((Date.now() - t1) / 1000).toFixed(1)} s)`);
  }
}

// ---------- folha comparativa (capturas + referências) ----------
const refs = fs.existsSync(path.join(root, 'referencias')) ? fs.readdirSync(path.join(root, 'referencias')).filter(f => /\.(png|jpe?g)$/i.test(f)).sort() : [];
const img = f => 'data:image/' + (f.endsWith('.png') ? 'png' : 'jpeg') + ';base64,' + fs.readFileSync(f).toString('base64');
for (const time of TIMES) {
  const row = files.filter(f => f.time === time);
  if (!row.length) continue;
  const html = `<html><body style="margin:0;background:#111;font:13px system-ui;color:#ddd">
  <div style="padding:8px 12px">Rodada <b>${label}</b> · ${MAP} · clima <b>${TIME_NAMES[time]}</b> · ${stamp}</div>
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:4px;padding:0 4px">
  ${row.map(f => `<figure style="margin:0;position:relative"><img src="${img(f.file)}" style="width:100%;display:block"><figcaption style="position:absolute;left:0;top:0;background:#000a;padding:2px 6px">${f.s}</figcaption></figure>`).join('')}
  </div>
  <div style="padding:8px 12px">Referências</div>
  <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:4px;padding:0 4px 4px;align-items:start">
  ${refs.map(r => `<img src="${img(path.join(root, 'referencias', r))}" style="width:100%;display:block">`).join('')}
  </div></body></html>`;
  const p2 = await browser.newPage({ viewport: { width: 1800, height: 900 } });
  await p2.setContent(html, { waitUntil: 'load' });
  await p2.screenshot({ path: path.join(outDir, `folha_${TIME_NAMES[time]}.jpg`), fullPage: true, type: 'jpeg', quality: 85 });
  await p2.close();
}

if (errors.length) fs.writeFileSync(path.join(outDir, 'erros.txt'), errors.join('\n'));
fs.rmSync(finalDir, { recursive: true, force: true }); fs.renameSync(outDir, finalDir);
console.log(`\n${files.length} capturas em ${((Date.now() - t0) / 1000).toFixed(0)} s → ${path.relative(root, finalDir)}`);
if (errors.length) console.log(`${errors.length} avisos/erros do navegador (ver erros.txt):\n  ` + errors.slice(0, 8).join('\n  '));
await browser.close();
await server.close();
process.exit(0);
