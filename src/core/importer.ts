// Importar 3D (.glb) e HDRI (.hdr) do computador.
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import * as THREE from 'three';
import { $ } from './state';
import { applyHdr } from './sky';
import { loadMap } from './maps';
import { MAPS } from '../maps/manifest';
import { buildGlb } from './glbmap';

async function importGlb() {
  const f = $('if').files[0], m = $('im');
  if (!f) { m.textContent = 'Escolha um arquivo .glb'; return; }
  m.textContent = 'Carregando…';
  try {
    const buf = await f.arrayBuffer();
    const ld = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
    const gl: any = await new Promise((ok, no) => ld.parse(buf, '', ok, no));
    const id = 'glb' + Date.now().toString(36), k = +$('is').value || 1, dr = $('igd').checked;
    MAPS[id] = { id, n: f.name.replace(/\.[^.]+$/, ''), build: M => buildGlb(M, gl.scene, k, dr) };
    await loadMap(id); $('imp').hidden = true; m.textContent = '';
  } catch (e) { console.error(e); m.textContent = 'Não consegui abrir esse arquivo (.glb com Draco ainda não é aceito)'; }
}
async function importHdr() {
  const f = $('ih').files[0], m = $('im');
  if (!f) { m.textContent = 'Escolha um arquivo .hdr'; return; }
  m.textContent = 'Carregando…';
  try {
    const buf = await f.arrayBuffer();
    const ld = new HDRLoader().setDataType(THREE.HalfFloatType);
    const data: any = ld.parse(buf);
    const tex = new THREE.DataTexture(data.data, data.width, data.height, THREE.RGBAFormat, data.type);
    tex.colorSpace = THREE.LinearSRGBColorSpace; tex.minFilter = THREE.LinearFilter; tex.magFilter = THREE.LinearFilter; tex.generateMipmaps = false; tex.flipY = true; tex.needsUpdate = true;
    applyHdr(tex); m.textContent = 'HDRI aplicado';
  } catch (e) { console.error(e); m.textContent = 'Não consegui abrir esse HDRI (use .hdr)'; }
}
export function initImporter() {
  $('bim').onclick = () => { $('imp').hidden = false; };
  $('ix').onclick = () => { $('imp').hidden = true; };
  $('ig').onclick = importGlb; $('ihb').onclick = importHdr;
  $('inh').onclick = () => { applyHdr(null); $('im').textContent = 'HDRI removido'; };
}
