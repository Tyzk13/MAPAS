// Exporta o mapa para Universal VTT (todas as áreas) e valida a estrutura do .dd2vtt.
// Uso: node tools/testar-vtt.mjs [--map=igreja] [--ppg=70]
import { createServer } from 'vite';
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
let pw; try { pw = require('playwright'); } catch { pw = require(path.join(execSync('npm root -g').toString().trim(), 'playwright')); }
const opt = Object.fromEntries(process.argv.slice(2).filter(a => a.startsWith('--')).map(a => { const [k, v] = a.slice(2).split('='); return [k, v ?? '1']; }));
const MAP = opt.map || 'igreja', PPG = +(opt.ppg || 70), out = path.join(root, 'capturas', 'vtt'); fs.mkdirSync(out, { recursive: true });
const server = await createServer({ root, logLevel: 'error', server: { port: 0, host: '127.0.0.1' } }); await server.listen();
const b = await pw.chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 800, height: 600 } });
await p.goto(`http://127.0.0.1:${server.httpServer.address().port}/?capture=1&ui=0&map=${MAP}&q=baixa`);
await p.waitForFunction(() => window.__capReady, null, { timeout: 600000 });
const count = await p.evaluate(() => document.querySelectorAll('#xa option').length);
const problems = [];
for (let i = 0; i < count; i++) {
  const r = await p.evaluate(([i, ppg]) => { const { png, json } = window.__cap.vtt(i, ppg); return { name: document.querySelectorAll('#xa option')[i].textContent, json }; }, [i, PPG]);
  const j = r.json, base = `${MAP}-${i}-${r.name.replace(/[^a-zA-Z0-9]+/g, '_')}`;
  // validação
  const need = ['format', 'resolution', 'line_of_sight', 'portals', 'lights', 'environment', 'image'];
  need.forEach(k => { if (!(k in j)) problems.push(`${base}: falta ${k}`); });
  const { x: W, y: H } = j.resolution.map_size;
  const inside = q => q.x >= -2 && q.y >= -2 && q.x <= W + 2 && q.y <= H + 2;
  j.line_of_sight.flat().forEach(q => { if (!inside(q)) problems.push(`${base}: parede fora do mapa (${q.x},${q.y})`); });
  j.lights.forEach(l => { if (!/^[0-9a-f]{8}$/i.test(l.color)) problems.push(`${base}: cor inválida ${l.color}`); });
  fs.writeFileSync(path.join(out, base + '.dd2vtt'), JSON.stringify(j));
  fs.writeFileSync(path.join(out, base + '.png'), Buffer.from(j.image, 'base64'));
  // prévia com paredes, portas e luzes desenhadas por cima
  const ppg = j.resolution.pixels_per_grid;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W * ppg}" height="${H * ppg}" style="position:absolute;left:0;top:0">${j.line_of_sight.map(w => `<polyline points="${w.map(q => q.x * ppg + ',' + q.y * ppg).join(' ')}" fill="none" stroke="#ff3b3b" stroke-width="4"/>`).join('')}${j.portals.map(d => `<line x1="${d.bounds[0].x * ppg}" y1="${d.bounds[0].y * ppg}" x2="${d.bounds[1].x * ppg}" y2="${d.bounds[1].y * ppg}" stroke="#3bc0ff" stroke-width="7"/>`).join('')}${j.lights.map(l => `<circle cx="${l.position.x * ppg}" cy="${l.position.y * ppg}" r="${l.range * ppg}" fill="#ffc06622" stroke="#ffc066"/>`).join('')}</svg>`;
  const pv = await b.newPage({ viewport: { width: Math.round(Math.min(2000, W * ppg)), height: Math.round(Math.min(2000, H * ppg)) } });
  await pv.setContent(`<body style="margin:0;position:relative"><img src="data:image/png;base64,${j.image}" style="display:block">${svg}</body>`);
  await pv.screenshot({ path: path.join(out, base + '_previa.jpg'), type: 'jpeg', quality: 80, fullPage: true }); await pv.close();
  console.log(`✓ ${base}: ${W}×${H} quadrados, ${ppg} px/quadrado, ${j.line_of_sight.length} paredes, ${j.portals.length} portas, ${j.lights.length} luzes`);
}
console.log(problems.length ? 'PROBLEMAS:\n  ' + problems.join('\n  ') : 'Estrutura válida em todas as áreas.');
await b.close(); await server.close();
