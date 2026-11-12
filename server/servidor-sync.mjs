// Servidor de sincronização do mapa 3D: salas por WebSocket, com persistência simples em arquivo JSON.
//
// Uso:   cd server && npm install && npm start            (porta 8080, ou PORT=xxxx)
// Página: https://seu-site/mapa/?room=mesa1&ws=wss://SEU-SERVIDOR
//
// Variáveis de ambiente (todas opcionais):
//   PORT=8080                 porta HTTP/WebSocket
//   DATA_DIR=./dados          onde salvar as salas (um .json por sala)
//   EDIT_KEY=segredo          se definida, só quem conecta com &key=segredo pode mover/criar/apagar
//   ALLOWED_ORIGINS=https://meusite.com,https://outro.com   (vazio = aceita qualquer origem)
//   MAX_ROOMS=200             limite de salas em memória
//   MAX_CHARS=60              limite de personagens por sala
//   MAX_POS=3000              limite de posições guardadas por sala
//
// Mensagens (JSON):  {t:'pos', map, id, v}  {t:'char', id, v}  {t:'delchar', id}
// Conexões com ?ro=1 (ou sem a chave, quando EDIT_KEY existe) só recebem: o servidor ignora o que enviarem.
import { WebSocketServer } from 'ws';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const PORT = +(process.env.PORT || 8080);
const DATA_DIR = path.resolve(process.env.DATA_DIR || './dados');
const EDIT_KEY = process.env.EDIT_KEY || '';
const ORIGINS = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
const MAX_ROOMS = +(process.env.MAX_ROOMS || 200);
const MAX_CHARS = +(process.env.MAX_CHARS || 60);
const MAX_POS = +(process.env.MAX_POS || 3000);
const MAX_MSG = 2 * 1024 * 1024; // personagens com imagem embutida
const RATE = { perSec: 40 };

fs.mkdirSync(DATA_DIR, { recursive: true });
const safe = s => String(s || 'mesa1').replace(/[^a-zA-Z0-9-]/g, '-').slice(0, 40) || 'mesa1';
const fileOf = room => path.join(DATA_DIR, room + '.json');
/** número finito limitado (evita NaN/Infinity, que viram null no JSON) */
const num = (v, lim = 1e5, def = 0) => (typeof v === 'number' && Number.isFinite(v) ? Math.max(-lim, Math.min(lim, v)) : def);

/** @type {Map<string, {pos:Record<string,any>, chars:Record<string,any>, set:Set<any>, dirty:boolean, last:number}>} */
const rooms = new Map();
function getRoom(name) {
  let R = rooms.get(name);
  if (R) return R;
  if (rooms.size >= MAX_ROOMS) evict();
  R = { pos: {}, chars: {}, set: new Set(), dirty: false, last: Date.now() };
  try { const d = JSON.parse(fs.readFileSync(fileOf(name), 'utf8')); R.pos = d.pos || {}; R.chars = d.chars || {}; } catch { /* sala nova */ }
  rooms.set(name, R);
  return R;
}
function evict() { // descarrega a sala vazia mais antiga
  let old = null;
  for (const [k, R] of rooms) if (!R.set.size && (!old || R.last < rooms.get(old).last)) old = k;
  if (old) { flush(old); rooms.delete(old); }
}
function flush(name) {
  const R = rooms.get(name); if (!R || !R.dirty) return;
  const tmp = fileOf(name) + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify({ pos: R.pos, chars: R.chars, salvo: new Date().toISOString() }));
  fs.renameSync(tmp, fileOf(name)); R.dirty = false;
}
setInterval(() => { for (const k of rooms.keys()) flush(k); }, 3000).unref();
for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => { for (const k of rooms.keys()) flush(k); process.exit(0); });

// HTTP: saúde (para Render/Fly) e lista resumida de salas
const server = http.createServer((req, res) => {
  const rota = (req.url || '/').split('?')[0];
  if (rota === '/' || rota === '/saude') {
    res.writeHead(200, { 'content-type': 'application/json', 'access-control-allow-origin': '*' });
    res.end(JSON.stringify({ ok: true, salas: rooms.size, conexoes: [...rooms.values()].reduce((a, R) => a + R.set.size, 0) }));
    return;
  }
  res.writeHead(404); res.end();
});

const wss = new WebSocketServer({
  server, maxPayload: MAX_MSG,
  verifyClient: ({ origin }, cb) => cb(!ORIGINS.length || ORIGINS.includes(origin), 403, 'Origem não permitida'),
});

wss.on('connection', (ws, req) => {
  const q = new URL(req.url, 'http://x').searchParams;
  const room = safe(q.get('room')), R = getRoom(room);
  const canEdit = q.get('ro') !== '1' && (!EDIT_KEY || q.get('key') === EDIT_KEY);
  R.set.add(ws); R.last = Date.now();
  // estado atual para quem chega
  for (const id in R.chars) ws.send(JSON.stringify({ t: 'char', id, v: R.chars[id] }));
  for (const k in R.pos) { const i = k.indexOf('|'); ws.send(JSON.stringify({ t: 'pos', map: k.slice(0, i), id: k.slice(i + 1), v: R.pos[k] })); }
  ws.send(JSON.stringify({ t: 'hello', room, edit: canEdit }));

  let tokens = RATE.perSec, lastFill = Date.now();
  ws.on('message', data => {
    if (!canEdit) return; // só leitura imposto no servidor
    const now = Date.now(); tokens = Math.min(RATE.perSec, tokens + ((now - lastFill) / 1000) * RATE.perSec); lastFill = now;
    if (tokens < 1) return; tokens -= 1;
    let m; try { m = JSON.parse(data); } catch { return; }
    if (!m || typeof m !== 'object' || typeof m.id !== 'string' || m.id.length > 64) return;
    if (m.t === 'pos') {
      const v = m.v; if (!v || !Number.isFinite(v.x) || !Number.isFinite(v.z)) return;
      const map = String(m.map || '').replace(/\|/g, '-').slice(0, 40), k = map + '|' + m.id;
      if (!(k in R.pos) && Object.keys(R.pos).length >= MAX_POS) return;
      R.pos[k] = { x: num(v.x), z: num(v.z), y: num(v.y), h: num(v.h, 20), f: v.f ? 1 : 0 };
      m = { t: 'pos', map, id: m.id, v: R.pos[map + '|' + m.id] };
    } else if (m.t === 'char') {
      const v = m.v; if (!v || typeof v.img !== 'string' || !/^data:image\/(png|webp|jpeg|gif);/.test(v.img)) return;
      if (!(m.id in R.chars) && Object.keys(R.chars).length >= MAX_CHARS) return;
      R.chars[m.id] = { name: String(v.name || '').slice(0, 24), h: num(v.h, 20, 1.7) || 1.7, c: num(v.c, 0xffffff, 0x8a8f98) | 0, img: v.img };
      m = { t: 'char', id: m.id, v: R.chars[m.id] };
    } else if (m.t === 'delchar') {
      delete R.chars[m.id];
      for (const k in R.pos) if (k.endsWith('|' + m.id)) delete R.pos[k];
    } else return;
    R.dirty = true; R.last = now;
    const out = JSON.stringify(m);
    R.set.forEach(c => c.readyState === 1 && c.send(out));
  });
  ws.on('close', () => { R.set.delete(ws); R.last = Date.now(); if (!R.set.size) flush(room); });
});

// mantém conexões vivas atrás de proxies (Render/Fly derrubam conexões ociosas)
setInterval(() => wss.clients.forEach(c => { if (c.isAlive === false) return c.terminate(); c.isAlive = false; c.ping(); }), 30000).unref();
wss.on('connection', c => { c.isAlive = true; c.on('pong', () => (c.isAlive = true)); });

server.listen(PORT, () => console.log(`Sincronização ativa na porta ${PORT} · dados em ${DATA_DIR}${EDIT_KEY ? ' · edição com chave' : ''}`));
