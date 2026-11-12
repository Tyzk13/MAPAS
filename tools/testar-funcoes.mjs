// Teste de fumaça das funções do mapa (sem olhar a imagem): carrega a página normal (laço ligado),
// caminha com o teclado, arrasta um personagem, troca clima e mapa, confere o postMessage do iframe.
// Uso: node tools/testar-funcoes.mjs
import { build, preview } from 'vite';
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import path from 'node:path'; import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
let pw; try { pw = require('playwright'); } catch { pw = require(path.join(execSync('npm root -g').toString().trim(), 'playwright')); }
const outBuild = path.join(root, '.cache', 'teste-build');
await build({ root, logLevel: 'error', build: { outDir: outBuild, emptyOutDir: true } });
const port = 4800 + Math.floor(Math.random() * 300);
const server = await preview({ root, logLevel: 'error', build: { outDir: outBuild }, preview: { port, host: '127.0.0.1', strictPort: true } });
const b = await pw.chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 640, height: 400 } });
const errs = []; p.on('pageerror', e => errs.push(String(e)));
const res = []; const ok = (name, cond, extra = '') => { res.push([cond ? '✓' : '✗', name, extra]); };

// página que incorpora num iframe, para testar o postMessage
const url = `http://127.0.0.1:${port}/`;
await p.setContent(`<iframe id=f src="${url}?q=media&room=t1" style="width:600px;height:380px"></iframe><script>window.msgs=[];addEventListener('message',e=>msgs.push(e.data))</script>`);
await p.waitForFunction(() => window.msgs.some(m => m && m.evt === 'ready'), null, { timeout: 600000 });
ok('iframe recebe {evt:"ready"}', true);
const fr = p.frames().find(f => f.url().startsWith(url));
await fr.waitForFunction(() => !document.getElementById('load'), null, { timeout: 120000 }).catch(() => {});
ok('tela de carregamento some', await fr.evaluate(() => !document.getElementById('load') || document.getElementById('load').classList.contains('done')));

// caminhar: entra no modo, anda para frente (-z) a partir do caminho, deve subir a escada e entrar
await fr.evaluate(() => document.getElementById('bwk').click());
// teclas disparadas dentro do iframe (o canvas não recebe foco de teclado)
await fr.evaluate(() => dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyW', key: 'w' })));
// espera até andar ~1 m (sem GPU o navegador faz poucos quadros por segundo; o tempo fixo deixava o teste instável)
await fr.waitForFunction(() => (window.__walkState?.().moved ?? 0) > 1, null, { timeout: 120000, polling: 500 }).catch(() => {});
await fr.evaluate(() => dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyW', key: 'w' })));
const wpos = await fr.evaluate(() => (window).__walkState?.());
ok('caminhar move o personagem', !!wpos && wpos.moved > 0.3, wpos ? `andou ${wpos.moved.toFixed(1)} m, y=${wpos.y.toFixed(2)}` : 'sem estado');
await fr.evaluate(() => document.getElementById('bwk').click());

// clima e mapa por postMessage
await p.evaluate(() => document.getElementById('f').contentWindow.postMessage({ cmd: 'time', i: 4 }, '*'));
await p.waitForTimeout(1500);
ok('postMessage time → Noite', (await fr.evaluate(() => document.getElementById('bn').textContent)) === 'Noite');
await p.evaluate(() => document.getElementById('f').contentWindow.postMessage({ cmd: 'map', id: 'campo' }, '*'));
await fr.waitForFunction(() => document.getElementById('bmap').textContent.includes('Campo'), null, { timeout: 120000 }).catch(() => {});
ok('postMessage map → campo', (await fr.evaluate(() => document.getElementById('bmap').textContent)).includes('Campo'));
await p.evaluate(() => document.getElementById('f').contentWindow.postMessage({ cmd: 'map', id: 'igreja' }, '*'));
await fr.waitForFunction(() => document.getElementById('bmap').textContent.includes('Igreja'), null, { timeout: 120000 }).catch(() => {});
ok('volta para a igreja', (await fr.evaluate(() => document.getElementById('bmap').textContent)).includes('Igreja'));

ok('sem erros de página', errs.length === 0, errs.slice(0, 3).join(' | '));
res.forEach(r => console.log(r[0], r[1], r[2] ? '— ' + r[2] : ''));
await b.close(); await server.close();
process.exit(res.some(r => r[0] === '✗') ? 1 : 0);
