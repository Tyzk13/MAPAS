// Lista triângulos e tamanho de cada .glb em src/assets/models.
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptDecoder } from 'meshoptimizer';
import fs from 'node:fs';
await MeshoptDecoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder });
const dir = 'src/assets/models', rows = [];
for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.glb'))) {
  const doc = await io.read(`${dir}/${f}`); let t = 0;
  for (const m of doc.getRoot().listMeshes()) for (const p of m.listPrimitives()) t += (p.getIndices() ? p.getIndices().getCount() : p.getAttribute('POSITION').getCount()) / 3;
  rows.push([f, Math.round(t), (fs.statSync(`${dir}/${f}`).size / 1e6).toFixed(2)]);
}
rows.sort((a, b) => b[1] - a[1]).forEach(r => console.log(String(r[1]).padStart(9), r[2].padStart(6), 'MB', r[0]));
