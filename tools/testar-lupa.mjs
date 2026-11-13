// Testa a lupa de documentos (core/docs.ts) no mapa do Texas: abre na delegacia, vai à vista "Quadro do caso",
// clica no centro, confere que o documento abriu ampliado e que "Mostrar aos jogadores" exibe a imagem.
// Uso: npm run test:lupa
import { createServer } from 'vite'; import { createRequire } from 'module'; import fs from 'fs';
const require = createRequire(import.meta.url); const pw = require('playwright');
const server = await createServer({ root: process.cwd(), logLevel: 'error', server: { port: 0, host: '127.0.0.1' } }); await server.listen();
const b = await pw.chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1280, height: 720 } }); const errs = []; p.on('pageerror', e => errs.push(String(e)));
await p.goto(`http://127.0.0.1:${server.httpServer.address().port}/?map=texas&q=baixa`);
await p.waitForFunction(() => window.__cap || document.querySelector('#load')?.style.display === 'none' || !document.querySelector('#load:not(.off)'), null, { timeout: 600000 });
await p.waitForTimeout(8000);
console.log('vista inicial:', await p.$eval('#bv', e => e.textContent));
await p.waitForTimeout(800);
const nota = await p.evaluate(() => { const n = document.getElementById('nota'); return n && !n.hidden ? n.querySelector('b').textContent : null; });
console.log('cartão de notas:', nota);
// lista de pistas no painel do Mestre → abre sem mexer na câmera
await p.click('#mdir'); await p.waitForTimeout(500);
const nPistas = await p.$$eval('#dpistas button', b => b.length); console.log('pistas no painel:', nPistas);
const cam0 = await p.evaluate(() => window.__docsDbg(640, 330).cam);
await p.evaluate(() => [...document.querySelectorAll('#dpistas button')].find(b => b.textContent.includes('Carta de Elias'))?.click());
await p.waitForTimeout(800);
const pista = await p.evaluate(() => { const l = document.getElementById('lupa'); return l && !l.hidden ? { nome: l.querySelector('figcaption').textContent, nota: !l.querySelector('aside').hidden && l.querySelector('aside p').textContent.slice(0, 40) } : null; });
const cam1 = await p.evaluate(() => window.__docsDbg(640, 330).cam);
console.log('pista aberta:', JSON.stringify(pista), '· câmera parada:', JSON.stringify(cam0) === JSON.stringify(cam1));
fs.mkdirSync('capturas/lupa', { recursive: true }); await p.screenshot({ path: 'capturas/lupa/pista.jpg', type: 'jpeg' });
await p.click('#lupac'); await p.waitForFunction(() => { const c = window.__docsDbg(640, 330).cam; return Math.hypot(c[0] - 12.95, c[2] - 73.5) < 2.5; }, null, { timeout: 120000 }).then(() => console.log('câmera levada até a carta: ok')).catch(() => console.log('câmera NÃO chegou na carta', JSON.stringify(window.__docsDbg)));
const okPistas = nota && nPistas >= 20 && pista && pista.nota;
await p.keyboard.press('Escape'); await p.waitForTimeout(800);
// leva a câmera ao quadro do caso pelo menu Vista
await p.click('#mv'); await p.waitForTimeout(500);
const ok = await p.evaluate(() => { const b = [...document.querySelectorAll('#pl button')].find(x => x.textContent.includes('Quadro do caso')); if (b) b.click(); return !!b; });
console.log('achou vista Quadro do caso:', ok); await p.waitForFunction(() => window.__docsDbg(640, 330).cam[2] > 90, null, { timeout: 120000 }).catch(() => {}); await p.waitForTimeout(1500);
console.log('elemento no ponto:', await p.evaluate(() => { const e = document.elementFromPoint(640, 330); return e.tagName + '#' + e.id + '.' + e.className; }));
console.log('pl aberto:', await p.$eval('#pl', e => !e.hidden));
await p.keyboard.press('Escape'); await p.waitForTimeout(300);
console.log('elemento depois do Esc:', await p.evaluate(() => { const e = document.elementFromPoint(640, 330); return e.tagName + '#' + e.id; }));
console.log('dbg:', JSON.stringify(await p.evaluate(() => window.__docsDbg(640, 330))));
console.log('alvo no centro:', await p.evaluate(() => window.__docsAlvo(640, 330)));
await p.mouse.click(640, 330); await p.waitForTimeout(1500);
const st = await p.evaluate(() => { const l = document.getElementById('lupa'); return l ? { aberto: !l.hidden, nome: l.querySelector('figcaption').textContent, w: l.querySelector('img').naturalWidth } : null; });
console.log('lupa:', JSON.stringify(st));
fs.mkdirSync('capturas/lupa', { recursive: true }); await p.screenshot({ path: 'capturas/lupa/lupa.jpg', type: 'jpeg' });
if (st?.aberto) { await p.click('#lupaj'); await p.waitForTimeout(800); console.log('handout aberto:', await p.$eval('#handout', e => e.classList.contains('on'))); }
console.log('erros:', errs.slice(0, 3));
// janela dos jogadores: nada de nota nem lupa
const pj = await b.newPage({ viewport: { width: 960, height: 540 } }); await pj.goto(`http://127.0.0.1:${server.httpServer.address().port}/?map=texas&q=baixa&tela=jogadores`);
await pj.waitForTimeout(15000);
const vazamento = await pj.evaluate(() => { const n = document.getElementById('nota'), l = document.getElementById('lupa'); const vis = e => !!e && getComputedStyle(e).display !== 'none' && !e.hidden; return { nota: vis(n), lupa: vis(l), dock: vis(document.getElementById('dock')) }; });
console.log('janela dos jogadores mostra:', JSON.stringify(vazamento));
const falhou = !st?.aberto || errs.length || !okPistas || vazamento.nota || vazamento.lupa || vazamento.dock; console.log(falhou ? '✗ lupa falhou' : '✓ lupa abre documentos e mostra aos jogadores'); process.exitCode = falhou ? 1 : 0;
await b.close(); await server.close();
