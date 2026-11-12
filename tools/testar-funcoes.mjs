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

// câmera livre: entra pelo botão, anda para frente e sobe; Esc volta para a órbita
await fr.evaluate(() => document.getElementById('blv').click());
await fr.evaluate(() => { dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyW', key: 'w' })); dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyE', key: 'e' })); });
await fr.waitForFunction(() => (window.__freeState?.().moved ?? 0) > 1, null, { timeout: 120000, polling: 500 }).catch(() => {});
await fr.evaluate(() => { dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyW', key: 'w' })); dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyE', key: 'e' })); });
const fpos = await fr.evaluate(() => window.__freeState?.());
ok('câmera livre move a câmera', !!fpos && fpos.moved > 1, fpos ? `moveu ${fpos.moved.toFixed(1)} m` : 'sem estado');
await fr.evaluate(() => dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape', key: 'Escape' })));
ok('Esc volta para a órbita', await fr.evaluate(() => document.getElementById('bmo').classList.contains('act')));

// menus do dock: abrir Clima lista os 5 climas
await fr.evaluate(() => document.getElementById('mn').click());
ok('menu Clima lista as opções', (await fr.evaluate(() => document.querySelectorAll('#pl button').length)) === 5);
await fr.evaluate(() => document.getElementById('mn').click());

// câmera de cinema pela página que incorpora: barras aparecem, câmera chega ao ponto; cine-sair devolve
await p.evaluate(() => document.getElementById('f').contentWindow.postMessage({ cmd: 'cine', p: [6, 2, 26], t: [0, 2, 12], estilo: 'corte', legenda: 'Algo se move' }, '*'));
await fr.waitForFunction(() => (window.__cineState?.().on && window.__cineState().dist < 1.5), null, { timeout: 180000, polling: 500 }).catch(() => {});
const cs = await fr.evaluate(() => ({ ...window.__cineState?.(), barras: document.body.classList.contains('cine'), leg: document.getElementById('lcap').textContent }));
ok('cinema leva a câmera ao ponto', cs.on && cs.dist < 1.5 && cs.barras && cs.leg === 'Algo se move', `dist ${cs.dist?.toFixed(2)}`);
await p.evaluate(() => document.getElementById('f').contentWindow.postMessage({ cmd: 'cine-sair' }, '*'));
await fr.waitForFunction(() => !window.__cineState?.().on, null, { timeout: 180000, polling: 500 }).catch(() => {});
ok('sair do cinema devolve a câmera', await fr.evaluate(() => !window.__cineState().on && !document.body.classList.contains('cine') && !document.getElementById('bmo').hidden));

// painel de cinema: gravar a câmera atual cria uma tomada
await fr.evaluate(() => document.getElementById('mcine').click());
await fr.evaluate(() => document.getElementById('csave').click());
ok('gravar tomada aparece na lista', (await fr.evaluate(() => document.querySelectorAll('#clist .it').length)) >= 1);
await fr.evaluate(() => document.getElementById('mcine').click());

// tela limpa (H) esconde a interface; tecla 1 toca a tomada gravada mesmo assim; Esc sai; H traz a interface
const tecla = code => fr.evaluate(c => dispatchEvent(new KeyboardEvent('keydown', { code: c, key: c })), code);
await tecla('KeyH');
ok('tela limpa esconde a interface', await fr.evaluate(() => document.body.classList.contains('limpa') && getComputedStyle(document.getElementById('dock')).display === 'none' && getComputedStyle(document.getElementById('ros')).display === 'none'));
await tecla('Digit1');
await fr.waitForFunction(() => window.__cineState?.().on, null, { timeout: 60000, polling: 300 }).catch(() => {});
ok('tecla 1 toca a tomada gravada', await fr.evaluate(() => window.__cineState().on && getComputedStyle(document.getElementById('cinex')).display === 'none'));
await tecla('Escape');
await fr.waitForFunction(() => !window.__cineState().on, null, { timeout: 180000, polling: 500 }).catch(() => {});
await tecla('KeyH');
ok('H traz a interface de volta', await fr.evaluate(() => !document.body.classList.contains('limpa') && getComputedStyle(document.getElementById('dock')).display !== 'none'));

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
