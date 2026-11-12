// Teste do servidor de sincronização: sobe um servidor temporário e confere sala, transmissão entre
// duas conexões, só-leitura, chave de edição, validação e persistência após reiniciar.
// Uso: cd server && npm install && npm test
import { spawn } from 'node:child_process';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import { fileURLToPath } from 'node:url';
import WebSocket from 'ws';

const dir = path.dirname(fileURLToPath(import.meta.url));
const DATA = fs.mkdtempSync(path.join(os.tmpdir(), 'mapa-sync-'));
const PORT = 20000 + Math.floor(Math.random() * 20000), KEY = 'k' + Date.now();
const res = []; const ok = (n, c, x = '') => res.push([c ? '✓' : '✗', n, x]);
const wait = ms => new Promise(r => setTimeout(r, ms));

function subir() {
  const p = spawn(process.execPath, [path.join(dir, 'servidor-sync.mjs')], { env: { ...process.env, PORT: String(PORT), DATA_DIR: DATA, EDIT_KEY: KEY, MAX_CHARS: '2' }, stdio: ['ignore', 'pipe', 'inherit'] });
  return new Promise(r => p.stdout.on('data', d => { if (/ativa/.test(d)) r(p); }));
}
function conectar(qs) {
  const ws = new WebSocket(`ws://127.0.0.1:${PORT}/?room=teste&${qs}`), msgs = [];
  ws.on('message', d => msgs.push(JSON.parse(d)));
  return new Promise((r, e) => { ws.on('open', () => r({ ws, msgs })); ws.on('error', e); });
}
const enviar = (c, m) => c.ws.send(JSON.stringify(m));
const parar = p => new Promise(r => { p.on('exit', r); p.kill('SIGTERM'); });

let srv = await subir();
try {
  const saude = await (await fetch(`http://127.0.0.1:${PORT}/saude?x=1`)).json();
  ok('/saude responde (com query string)', saude.ok === true);

  const a = await conectar('key=' + KEY), b = await conectar('key=' + KEY), ro = await conectar('ro=1&key=' + KEY), sem = await conectar('');
  await wait(200);
  ok('hello informa permissão', a.msgs[0]?.edit === true && ro.msgs[0]?.edit === false && sem.msgs[0]?.edit === false);

  enviar(a, { t: 'pos', map: 'igreja', id: 'dante', v: { x: 1.5, z: -2, y: 0.3, h: 1.8, f: 0 } });
  await wait(200);
  const pb = b.msgs.find(m => m.t === 'pos');
  ok('posição chega na outra conexão', pb?.v?.x === 1.5 && pb?.v?.z === -2);
  ok('posição chega para quem só vê', !!ro.msgs.find(m => m.t === 'pos'));

  enviar(ro, { t: 'pos', map: 'igreja', id: 'dante', v: { x: 99, z: 99 } });
  enviar(sem, { t: 'pos', map: 'igreja', id: 'dante', v: { x: 98, z: 98 } });
  await wait(200);
  ok('só-leitura e sem chave são ignorados', !a.msgs.some(m => m.t === 'pos' && m.v.x > 90));

  enviar(a, { t: 'pos', map: 'igreja', id: 'leo', v: { x: 'x', z: 1 } });
  enviar(a, { t: 'char', id: 'mal', v: { name: 'x', img: 'javascript:alert(1)' } });
  await wait(200);
  ok('mensagens inválidas são descartadas', !b.msgs.some(m => m.id === 'leo' || m.id === 'mal'));

  enviar(a, { t: 'cine', v: { a: 'play', p: [1, 2, 3], t: [0, 1, 0], fov: 40, e: 'susto', cap: 'Algo se move', map: 'igreja', de: 'gm' } });
  enviar(ro, { t: 'cine', v: { a: 'play', p: [9, 9, 9], t: [0, 0, 0], e: 'corte', map: 'igreja' } });
  enviar(a, { t: 'cine', v: { a: 'play', p: [1, 'x', 3], t: [0, 1, 0] } });
  await wait(200);
  const cines = ro.msgs.filter(m => m.t === 'cine');
  ok('câmera de cinema chega a quem só vê', cines.length === 1 && cines[0].v.e === 'susto' && cines[0].v.p[2] === 3 && cines[0].v.cap === 'Algo se move');
  const tarde = await conectar('ro=1'); await wait(200);
  ok('quem entra no meio da cena também vê', tarde.msgs.some(m => m.t === 'cine' && m.v.a === 'play'));
  enviar(a, { t: 'cine', v: { a: 'end', de: 'gm' } }); await wait(200);
  const depois = await conectar('ro=1'); await wait(200);
  ok('depois do fim, quem entra não vê cena', !depois.msgs.some(m => m.t === 'cine'));
  tarde.ws.close(); depois.ws.close();
  ok('cinema de quem só vê e inválido é ignorado', !b.msgs.some(m => m.t === 'cine' && (m.v.e === 'corte' || m.v.p?.includes(null))));

  const img = 'data:image/png;base64,iVBORw0KGgo=';
  for (const id of ['p1', 'p2', 'p3']) enviar(a, { t: 'char', id, v: { name: id, h: 1.7, c: 1, img } });
  await wait(200);
  ok('limite de personagens por sala (MAX_CHARS)', b.msgs.filter(m => m.t === 'char').length === 2);

  [a, b, ro, sem].forEach(c => c.ws.close());
  await wait(200);
  await parar(srv); srv = await subir();
  const c = await conectar('ro=1'); await wait(300);
  ok('estado persiste após reiniciar', c.msgs.some(m => m.t === 'pos' && m.id === 'dante') && c.msgs.filter(m => m.t === 'char').length === 2);
  c.ws.close();
} finally {
  await parar(srv);
  fs.rmSync(DATA, { recursive: true, force: true });
}
res.forEach(r => console.log(r.join(' ')));
process.exit(res.every(r => r[0] === '✓') ? 0 : 1);
