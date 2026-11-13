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
const falhou = !st?.aberto || errs.length; console.log(falhou ? '✗ lupa falhou' : '✓ lupa abre documentos e mostra aos jogadores'); process.exitCode = falhou ? 1 : 0;
await b.close(); await server.close();
