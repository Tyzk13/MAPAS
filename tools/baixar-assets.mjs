// Baixa e otimiza os assets listados em tools/assets.json (Poly Haven, CC0).
//   node tools/baixar-assets.mjs            → baixa o que falta
//   node tools/baixar-assets.mjs --force    → refaz tudo
// Brutos ficam em assets-src/ (fora do git); prontos para o site em src/assets/ (texturas WebP, modelos .glb
// com Meshopt + WebP). Também regenera a tabela automática em CREDITS.md.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cfg = JSON.parse(fs.readFileSync(path.join(root, 'tools/assets.json'), 'utf8'));
const FORCE = process.argv.includes('--force');
const ONLY = (process.argv.find(a => a.startsWith('--only=')) || '').slice(7).split(',').filter(Boolean);
const SRC = path.join(root, 'assets-src'), OUT = path.join(root, 'src/assets');
const api = p => fetchJson('https://api.polyhaven.com/' + p);

async function fetchJson(u) { for (let i = 0; i < 4; i++) { try { const r = await fetch(u); if (r.ok) return r.json(); } catch (_) { /* tenta de novo */ } await sleep(1000 * 2 ** i); } throw new Error('falhou ' + u); }
async function download(u, file) {
  if (fs.existsSync(file) && !FORCE) return;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  for (let i = 0; i < 4; i++) {
    try { const r = await fetch(u); if (r.ok) { fs.writeFileSync(file, Buffer.from(await r.arrayBuffer())); return; } } catch (_) { /* tenta de novo */ }
    await sleep(1000 * 2 ** i);
  }
  throw new Error('falhou ' + u);
}
const sleep = ms => new Promise(r => setTimeout(r, ms));
const want = id => !ONLY.length || ONLY.includes(id);
const credits = [];

async function info(id, kind) {
  const i = await api('info/' + id);
  credits.push({ id, kind, name: i.name || id, authors: Object.keys(i.authors || {}).join(', ') });
}

// ---------- texturas: diff (cor), nor_gl (normal), arm (AO/rugosidade/metal) ----------
for (const [id, res] of Object.entries(cfg.textures)) {
  await info(id, 'textura');
  if (!want(id)) continue;
  const outDir = path.join(OUT, 'textures', id);
  if (fs.existsSync(path.join(outDir, 'arm.webp')) && !FORCE) { console.log('· textura', id); continue; }
  const f = await api('files/' + id);
  const pick = k => f[k]?.[res]?.jpg?.url || f[k]?.['1k']?.jpg?.url;
  const maps = { diff: pick('Diffuse'), nor: pick('nor_gl'), arm: pick('arm') };
  fs.mkdirSync(outDir, { recursive: true });
  for (const [k, u] of Object.entries(maps)) {
    if (!u) { console.log('  (sem', k, 'para', id + ')'); continue; }
    const raw = path.join(SRC, 'textures', id, `${k}_${res}.jpg`);
    await download(u, raw);
    await sharp(raw).webp({ quality: k === 'nor' ? 90 : 82, effort: 5 }).toFile(path.join(outDir, `${k}.webp`));
  }
  console.log('✓ textura', id, res);
}

// ---------- HDRIs ----------
for (const [id, res] of Object.entries(cfg.hdris)) {
  await info(id, 'HDRI');
  if (!want(id)) continue;
  const out = path.join(OUT, 'hdri', `${id}_${res}.hdr`);
  if (fs.existsSync(out) && !FORCE) { console.log('· hdri', id); continue; }
  const f = await api('files/' + id);
  await download(f.hdri[res].hdr.url, out);
  console.log('✓ hdri', id, res);
}

// ---------- modelos: glTF 1k → .glb otimizado (Meshopt + WebP, texturas limitadas) ----------
const cli = path.join(root, 'node_modules/.bin/gltf-transform');
for (const [id, size] of Object.entries(cfg.models)) {
  await info(id, 'modelo');
  if (!want(id)) continue;
  const out = path.join(OUT, 'models', `${id}.glb`);
  if (fs.existsSync(out) && !FORCE) { console.log('· modelo', id); continue; }
  const f = await api('files/' + id);
  const g = f.gltf['1k'].gltf, dir = path.join(SRC, 'models', id), main = path.join(dir, id + '.gltf');
  await download(g.url, main);
  for (const [rel, v] of Object.entries(g.include || {})) await download(v.url, path.join(dir, rel));
  fs.mkdirSync(path.dirname(out), { recursive: true });
  execFileSync(cli, ['optimize', main, out, '--compress', 'meshopt', '--texture-compress', 'webp', '--texture-size', String(size), '--simplify', 'false', '--instance', 'false', '--flatten', 'false', '--join', 'false'], { stdio: 'pipe' });
  console.log('✓ modelo', id, (fs.statSync(out).size / 1e6).toFixed(2) + ' MB');
}

// ---------- créditos ----------
const cp = path.join(root, 'CREDITS.md');
let txt = fs.readFileSync(cp, 'utf8');
const begin = '<!-- polyhaven:inicio -->', end = '<!-- polyhaven:fim -->';
const table = [begin, '', '### Poly Haven (CC0 — domínio público)', '', '| Asset | Tipo | Autor(es) | Licença | Link |', '|---|---|---|---|---|',
  ...credits.map(c => `| ${c.name} (\`${c.id}\`) | ${c.kind} | ${c.authors} | CC0 | https://polyhaven.com/a/${c.id} |`), '', end].join('\n');
txt = txt.includes(begin) ? txt.replace(new RegExp(begin + '[\\s\\S]*' + end), table) : txt.trimEnd() + '\n\n' + table + '\n';
fs.writeFileSync(cp, txt);
console.log('CREDITS.md atualizado com', credits.length, 'assets');
