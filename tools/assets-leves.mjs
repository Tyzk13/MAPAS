// Gera src/assets-lite/: versão reduzida dos assets usada pelo `npm run build:single`
// (texturas em 512 px, árvores sempre no LOD1). Rode depois de `npm run assets`.
import fs from 'node:fs'; import path from 'node:path'; import sharp from 'sharp';
const A = 'src/assets', L = 'src/assets-lite';
fs.rmSync(L, { recursive: true, force: true });
for (const id of fs.readdirSync(`${A}/textures`)) {
  fs.mkdirSync(`${L}/textures/${id}`, { recursive: true });
  for (const f of fs.readdirSync(`${A}/textures/${id}`))
    await sharp(`${A}/textures/${id}/${f}`).resize(512, 512, { fit: 'inside' }).webp({ quality: f.startsWith('nor') ? 88 : 78 }).toFile(`${L}/textures/${id}/${f}`);
}
fs.mkdirSync(`${L}/models`, { recursive: true });
for (const f of fs.readdirSync(`${A}/models`)) {
  if (f.endsWith('_lod1.glb')) continue;
  const lod1 = `${A}/models/${f.replace('.glb', '_lod1.glb')}`;
  fs.copyFileSync(fs.existsSync(lod1) ? lod1 : `${A}/models/${f}`, `${L}/models/${f}`);
}
fs.cpSync(`${A}/hdri`, `${L}/hdri`, { recursive: true });
fs.cpSync(`${A}/tokens`, `${L}/tokens`, { recursive: true });
const size = d => fs.readdirSync(d, { recursive: true }).reduce((a, f) => { const p = path.join(d, f); return a + (fs.statSync(p).isFile() ? fs.statSync(p).size : 0); }, 0);
console.log('assets-lite:', (size(L) / 1e6).toFixed(1), 'MB (completo:', (size(A) / 1e6).toFixed(1), 'MB)');
