// Mede custo por quadro (chamadas de desenho, triângulos) em algumas vistas. Uso: node tools/medir.mjs [--q=media]
import { build, preview } from 'vite';
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import path from 'node:path'; import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
let pw; try { pw = require('playwright'); } catch { pw = require(path.join(execSync('npm root -g').toString().trim(), 'playwright')); }
const q = (process.argv.find(a => a.startsWith('--q=')) || '--q=media').slice(4);
const out = path.join(root, '.cache', 'medir-build');
await build({ root, logLevel: 'error', build: { outDir: out, emptyOutDir: true } });
const port = 5100 + Math.floor(Math.random() * 300);
const server = await preview({ root, logLevel: 'error', build: { outDir: out }, preview: { port, host: '127.0.0.1', strictPort: true } });
const b = await pw.chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 960, height: 540 } });
p.on('console', m => { if (/juntadas/.test(m.text())) console.log(m.text()); });
await p.goto(`http://127.0.0.1:${port}/?capture=1&ui=0&q=${q}&time=1`);
await p.waitForFunction(() => window.__capReady, null, { timeout: 600000 });
for (const n of ['Cinema', 'Fachada', 'Altar']) {
  const r = await p.evaluate(n => { const c = window.__cap; c.view(c.allViews().find(v => v.n === n)); const t = performance.now(); const s = c.stats(); s.ms = Math.round(performance.now() - t); return s; }, n);
  console.log(n.padEnd(8), JSON.stringify(r));
}
await p.evaluate(() => { const c = window.__cap; c.view(c.allViews().find(v => v.n === 'Cinema')); c.frames(1); });
console.log('sem sombra:', JSON.stringify(await p.evaluate(() => { const c = window.__cap; const R = c.renderer(); R.shadowMap.enabled = false; const s = c.stats(); R.shadowMap.enabled = true; return s; })));
console.log('sem pós:', JSON.stringify(await p.evaluate(() => { const c = window.__cap; const R = c.renderer(); const S = c.scene(); const cam = c.camera(); R.info.reset(); R.info.autoReset = false; R.render(S, cam); const r = { calls: R.info.render.calls, tri: R.info.render.triangles }; R.info.autoReset = true; return r; })));
console.log('por grupo:', JSON.stringify(await p.evaluate(() => {
  const c = window.__cap, R = c.renderer(), S = c.scene(), cam = c.camera(); R.shadowMap.enabled = false;
  const G = S.children.find(o => o.isGroup && o.children.length > 4); const kids = G.children; const vis = kids.map(k => k.visible); const out = {};
  const ext = kids.find(k => k.name === 'exterior');
  const tri = () => { R.info.reset(); R.info.autoReset = false; R.render(S, cam); R.info.autoReset = true; return R.info.render.triangles; };
  kids.forEach(k => k.visible = false); out.nada = tri();
  kids.forEach((k, i) => { k.visible = vis[i]; out[(k.name || k.type) + i] = tri() - out.nada; k.visible = false; });
  if (ext) { ext.visible = true; const ec = ext.children, ev = ec.map(x => x.visible); ec.forEach(x => x.visible = false);
    const base = tri(); const rows = ec.map((x, i) => { x.visible = ev[i]; const t = tri() - base; x.visible = false; return [(x.name || x.type) + ':' + (x.material?.name || x.material?.type || x.children.length), t]; });
    ec.forEach((x, i) => x.visible = ev[i]); const whole = tri(); const loo = ec.map((x, i) => { if (!ev[i]) return ['-', 0]; x.visible = false; const t = whole - tri(); x.visible = true; return [(x.name || x.type) + ':' + (x.material?.name || x.material?.type || x.children.length) + '#' + i, t]; }); out.loo = loo.sort((a, b) => b[1] - a[1]).slice(0, 8); out.whole = whole; const agg = {}; rows.forEach(([k, t]) => { agg[k] = (agg[k] || 0) + t; }); out.extTop = Object.entries(agg).sort((a, b) => b[1] - a[1]).slice(0, 14); out.extSum = rows.reduce((a, r) => a + r[1], 0); out.extN = rows.length; }
  kids.forEach((k, i) => k.visible = vis[i]); R.shadowMap.enabled = true; return out; })));
const top = await p.evaluate(() => {
  const rows = {};
  window.__cap.scene().traverse(o => { if (!o.isMesh || !o.visible) return; const g = o.geometry, t = (g.index ? g.index.count : g.attributes.position.count) / 3 * (o.isInstancedMesh ? o.count : 1);
    const k = (o.isInstancedMesh ? 'inst ' : '') + (Array.isArray(o.material) ? 'multi' : (o.material.name || o.material.type)) + (o.castShadow ? ' [sombra]' : '');
    rows[k] = rows[k] || [0, 0]; rows[k][0] += t; rows[k][1]++; });
  return Object.entries(rows).sort((a, b) => b[1][0] - a[1][0]).slice(0, 15).map(([k, [t, n]]) => `${String(Math.round(t / 1000)).padStart(6)}k tri ${String(n).padStart(4)} malhas  ${k}`);
});
console.log(top.join('\n'));
const loose = await p.evaluate(() => { const r = {}; window.__cap.scene().traverse(o => { if (o.isMesh && !o.isInstancedMesh && o.visible) { let p = o.parent, path = []; while (p && path.length < 3) { path.push(p.name || p.type); p = p.parent; } const k = path.join('<') + ' ' + (Array.isArray(o.material) ? 'multi' : o.material.type); r[k] = (r[k] || 0) + 1; } }); return Object.entries(r).sort((a, b) => b[1] - a[1]).slice(0, 12); });
console.log('malhas soltas:', JSON.stringify(loose));
await b.close(); await server.close(); process.exit(0);
