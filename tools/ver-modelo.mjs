// Renderiza um .glb de 3 ângulos e salva uma imagem lado a lado.
// Uso: node tools/ver-modelo.mjs caminho/modelo.glb [saida.jpg]
import { createServer } from 'vite';
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
let pw; try { pw = require('playwright'); } catch { pw = require(path.join(execSync('npm root -g').toString().trim(), 'playwright')); }
const glb = path.resolve(process.argv[2]), out = process.argv[3] || glb.replace(/\.glb$/, '.jpg');
const server = await createServer({ root, logLevel: 'error', server: { port: 0, host: '127.0.0.1', fs: { allow: [root] } } });
await server.listen(); const port = server.httpServer.address().port;
const b = await pw.chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 600, height: 600 } });
p.on('pageerror', e => console.log('erro:', String(e)));
await p.goto(`http://127.0.0.1:${port}/tools/visualizador.html?glb=/@fs${glb}`);
await p.waitForFunction(() => window.__ready, null, { timeout: 180000 });
const info = await p.evaluate(() => window.__info);
const shots = []; for (const a of [0.6, 2.4, 4.2]) shots.push(await p.evaluate(a => window.__shot(a), a));
const html = `<body style="margin:0;background:#111;color:#ddd;font:13px system-ui"><div style="padding:6px">${path.basename(glb)} · ${info.tris.toLocaleString()} triângulos · ${info.size.join(' × ')} m · ${(fs.statSync(glb).size / 1e6).toFixed(2)} MB</div><div style="display:flex">${shots.map(s => `<img src="${s}" width=600>`).join('')}</div></body>`;
const p2 = await b.newPage({ viewport: { width: 1800, height: 640 } }); await p2.setContent(html);
await p2.screenshot({ path: out, type: 'jpeg', quality: 85 });
console.log(out, info);
await b.close(); await server.close();
