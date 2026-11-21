// Montagem comum dos mapas de cidade em escala de gente (Tiberus, Malpetrim…): conjunto de luzes perto da câmera,
// fumaça das chaminés, névoa baixa, fichas do mestre (locais/NPCs/notas por vista), NPCs arrastáveis com as artes do
// dono e o povo das ruas, VTT, passagem de volta ao Sul de Arton e a animação (tremular das luzes, fumaça, névoa).
import * as THREE from 'three';
import type { MapRuntime, View, LocalInfo, NpcInfo } from '../../core/types';
import type { TokenDef } from '../../core/tokens';
import { mistTex } from '../../core/kit';
import { S, cam } from '../../core/engine';
import { fatorLuzes } from '../../core/sky';
import { Q } from '../barud/common';
import { LUZES } from '../barud/cidade';
import { SPEC, retDe, type Predio } from '../barud/edificios';
import type { LocalFicha, NpcFicha } from '../barud/dados';
import { retratoArton } from '../arton/retratos';
import { rnd, pick } from './kit';

export const P3 = (v: THREE.Vector3 | number[]) => (Array.isArray(v) ? v : [v.x, v.y, v.z]).map(n => +(+n).toFixed(2)) as [number, number, number];
/** ponto local de um prédio com interior → mundo */
export const mundoP = (id: string, x: number, z: number, y = 0) => { const p = SPEC[id], m = new THREE.Matrix4().compose(new THREE.Vector3(p.x, p.base ?? 0, p.z), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), p.ry), new THREE.Vector3(1, 1, 1)); return new THREE.Vector3(x, y, z).applyMatrix4(m); };
/** vista de fora (na frente do prédio, a dist m, altura alt) */
export const vistaFora = (n: string, id: string, dist: number, alt: number, fov = 55): View => { const p = SPEC[id], fx = Math.sin(p.ry), fz = Math.cos(p.ry); return { n, p: P3([p.x + fx * (p.d / 2 + dist), alt + (p.base ?? 0), p.z + fz * (p.d / 2 + dist)]), t: P3([p.x, (p.base ?? 0) + Math.min(6, p.h * p.andares * 0.6), p.z]), fov }; };
export const vistaDentro = (n: string, id: string, a: [number, number, number], b: [number, number, number], fov = 66): View => ({ n, p: P3(mundoP(id, a[0], a[2], a[1])), t: P3(mundoP(id, b[0], b[2], b[1])), fov });

export interface Povo { imgs: string[]; nome: string; h: number; peso: number }
export interface OpMontagem {
  chamines: THREE.Vector3[]; nevoa?: { x: number; z: number; y?: number; cor?: number; op?: number }[];
  vistas: View[]; predios: Predio[]; locais: LocalFicha[]; npcs: NpcFicha[]; imgs: Record<string, string>; prefixo: string;
  areaDe?: (id: string) => [number, number, number, number] | undefined; marcaDe?: (id: string) => [number, number, number] | undefined;
  povo?: { grupos: Povo[]; lugares: [number, number, number][]; n: number; dist?: number };
  vtt: { areas: { n: string; b: [number, number, number, number]; lv: number }[]; walls: [number, number][][]; portals: NonNullable<MapRuntime['vtt']['portals']> };
  volta?: MapRuntime['volta']; spawn: [number, number]; luar?: number; corFumaca?: number;
}

export function montar(M: MapRuntime, o: OpMontagem) {
  const G = M.G;
  // ---------- luzes ----------
  const pool = Array.from({ length: Q.luzes }, () => { const l = new THREE.PointLight(0xffffff, 0, 0, 2); G.add(l); const e = { l, d: 0, n: 0 }; M.lights.push(e); return e; });
  const alvo: (typeof LUZES[number] | null)[] = [];
  let ult = -1; const posEsc = new THREE.Vector3(1e9, 0, 0);
  const escolher = () => {
    const c = cam.position, f = fatorLuzes();
    const l = LUZES.map(r => ({ r, s: Math.hypot(r.x - c.x, (r.y - c.y) * 1.5, r.z - c.z) - r.prio * 3 })).sort((a, b) => a.s - b.s).slice(0, pool.length);
    pool.forEach((e, i) => { const r = l[i]?.r || null; alvo[i] = r; if (!r) { e.n = 0; e.l.intensity = 0; return; } e.l.position.set(r.x, r.y, r.z); e.l.color.setHex(r.cor); e.l.distance = r.dist * 1.6; e.n = r.n; e.l.intensity = r.n * f; });
  };
  escolher();
  // ---------- fumaça ----------
  const cham = o.chamines.slice().sort(() => rnd() - 0.5).slice(0, Q.fumaca + 10);
  const NP = 7, fum = new THREE.BufferGeometry(), fp = new Float32Array(cham.length * NP * 3), fs = new Float32Array(cham.length * NP);
  fum.setAttribute('position', new THREE.BufferAttribute(fp, 3)); fum.setAttribute('size', new THREE.BufferAttribute(fs, 1));
  const fumMat = new THREE.ShaderMaterial({
    uniforms: { map: { value: mistTex() }, uScale: { value: 400 }, uCor: { value: new THREE.Color(o.corFumaca ?? 0x5a5650) } },
    vertexShader: 'attribute float size; uniform float uScale; varying float vA; void main(){ vec4 mv = modelViewMatrix*vec4(position,1.0); gl_PointSize = size*uScale/-mv.z; vA = clamp(1.0 - size/6.0, 0.0, 1.0); gl_Position = projectionMatrix*mv; }',
    fragmentShader: 'uniform sampler2D map; uniform vec3 uCor; varying float vA; void main(){ vec4 c = texture2D(map, gl_PointCoord); gl_FragColor = vec4(uCor, c.a * 0.5 * vA); }',
    transparent: true, depthWrite: false,
  });
  const fumPts = new THREE.Points(fum, fumMat); fumPts.frustumCulled = false; fumPts.userData.ns = 1; fumPts.userData.noExport = 1; G.add(fumPts);
  fumPts.onBeforeRender = r => { fumMat.uniforms.uScale.value = r.getDrawingBufferSize(new THREE.Vector2()).y / (2 * Math.tan(THREE.MathUtils.degToRad(cam.fov) / 2)); };
  const fase = cham.map(() => rnd() * 10);
  // ---------- névoa ----------
  const mist: THREE.Sprite[] = [];
  for (const n of (o.nevoa ?? []).slice(0, Q.luzes > 8 ? 30 : 14)) {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: mistTex(), color: n.cor ?? 0xb8b8c0, transparent: true, depthWrite: false, opacity: n.op ?? 0.08 }));
    const sc = 12 + rnd() * 12; sp.scale.set(sc, sc * 0.22, 1); sp.position.set(n.x, (n.y ?? 0) + sc * 0.07 + 0.2, n.z); sp.userData.v = 0.1 + rnd() * 0.2; sp.userData.ns = 1; sp.userData.noExport = 1; sp.userData.x0 = n.x;
    G.add(sp); mist.push(sp); M.mist.push(sp);
  }
  // ---------- vistas e fichas ----------
  M.views = o.vistas;
  const tokId = (id: string) => o.prefixo + id, retrato = (id: string) => (o.imgs[id] ? retratoArton(o.imgs[id]) : undefined);
  M.fichas = o.npcs.map(n => ({ ...n, img: retrato(n.id), tok: tokId(n.id) }) as NpcInfo);
  M.locais = o.locais.map(l => {
    const p = o.predios.find(q => q.id === l.id);
    const area = o.areaDe?.(l.id) ?? (p ? retDe(p) : undefined);
    const marca = o.marcaDe?.(l.id) ?? (p ? P3(mundoP(p.id, 0, 0, p.andares * p.h + Math.min(p.w, p.d) * 0.42 + 2)) : undefined);
    return { ...l, area, marca } as LocalInfo;
  });
  M.notas = {};
  for (const l of o.locais) { const npcs = l.npcs.map(id => o.npcs.find(n => n.id === id)?.n).filter(Boolean).join(', '); const txt = `${l.tipo.toUpperCase()} — ${l.dono}\n${l.publico}${npcs ? '\nNPCs: ' + npcs : ''}\n(Ficha completa e segredos: botão Locais)`; M.notas[l.vista] = txt; if (l.dentro) M.notas[l.dentro] = txt; }
  // ---------- NPCs e povo ----------
  M.npcs = async (): Promise<TokenDef[]> => {
    const out: TokenDef[] = o.npcs.map(n => {
      const v = n.pos.p ? mundoP(n.pos.p, n.pos.x, n.pos.z, (n.pos.andar ?? 0) * (SPEC[n.pos.p]?.h ?? 3) + 0.06) : new THREE.Vector3(n.pos.x, 0.05, n.pos.z);
      return { id: tokId(n.id), name: n.n, h: n.h ?? 1.75, c: /vil[ãa]o?\b/.test(n.n) ? 0x9a1a14 : 0x5a4a3a, img: retrato(n.id) || silhueta(), npc: true, pos: { x: v.x, z: v.z, y: v.y, oc: !!n.oculto } } as TokenDef;
    });
    if (o.povo) {
      let k = 0; const tot = o.povo.grupos.reduce((a, g) => a + g.peso, 0);
      for (let i = 0; i < o.povo.n; i++) {
        let q = rnd() * tot, g = o.povo.grupos[0]; for (const gg of o.povo.grupos) { q -= gg.peso; if (q <= 0) { g = gg; break; } }
        const im = retratoArton(pick(g.imgs)); if (!im) continue; const L = pick(o.povo.lugares);
        out.push({ id: o.prefixo + 'povo' + (k++), name: g.nome, h: g.h, c: 0x6a5a4a, img: im, npc: true, pos: { x: L[0] + (rnd() - 0.5) * 2 * L[2], z: L[1] + (rnd() - 0.5) * 2 * L[2], y: 0.05 } } as TokenDef);
      }
    }
    return out;
  };
  M.npcVisivel = t => cam.position.distanceTo(t.g.position) < (o.povo?.dist ?? 110);
  M.vtt = { ...o.vtt, lights: LUZES.filter(r => r.vtt).map(r => [+r.x.toFixed(2), +r.z.toFixed(2), r.vtt!, 0.8, r.cor.toString(16).padStart(6, '0')] as [number, number, number, number, string]) };
  M.volta = o.volta;
  M.spawn = i => ({ x: o.spawn[0] + (i % 3) * 1.2, z: o.spawn[1] - Math.floor(i / 3) * 1.2, y: 0.05 });
  M.walkStart = { x: o.spawn[0], z: o.spawn[1] };
  // ---------- animação ----------
  const luar = new THREE.HemisphereLight(0x9aa4d8, 0x2a2430, 0); luar.userData.noExport = 1; G.add(luar);
  let fogBase = 0.008, lampsOn = true;
  M.onTime = p => { lampsOn = p.lamps > 0; fogBase = (S.fog as THREE.FogExp2 | null)?.density ?? fogBase; luar.intensity = (o.luar ?? 1) * (p.n === 'Noite' ? 6 : p.bg < 0.15 ? 2.2 : p.bg < 0.4 ? 0.9 : 0.15); escolher(); };
  M.tick = (_dt, t) => {
    if (Math.floor(t * 3) !== ult || cam.position.distanceToSquared(posEsc) > 25) { ult = Math.floor(t * 3); posEsc.copy(cam.position); escolher(); }
    const f = fatorLuzes();
    if (f) pool.forEach((e, k) => { const r = alvo[k]; if (r && e.l.intensity > 0) e.l.intensity = r.n * f * (0.86 + 0.14 * Math.sin(t * 12 + k * 7) * Math.sin(t * 7.1 + k)); });
    if (lampsOn) M.lamps.forEach((m, i) => { const b = m.userData.base; if (b) m.color.copy(b).multiplyScalar(0.9 + 0.1 * Math.sin(t * 9 + i * 2.1) * Math.sin(t * 5.3 + i)); });
    cham.forEach((c, i) => { for (let k = 0; k < NP; k++) { const u = ((t * 0.12 + fase[i] + k / NP) % 1), j = (i * NP + k); fp[j * 3] = c.x + u * 2.5 + Math.sin(t * 0.7 + k) * 0.3; fp[j * 3 + 1] = c.y + u * 7; fp[j * 3 + 2] = c.z + u * 1.2; fs[j] = 1.2 + u * 4; } });
    fum.attributes.position.needsUpdate = true; (fum.attributes.size as THREE.BufferAttribute).needsUpdate = true;
    const baixo = cam.position.y < 45;
    mist.forEach(m => { m.visible = baixo; m.position.x = m.userData.x0 + Math.sin(t * 0.05 * m.userData.v * 10) * 6; });
    const fg = S.fog as THREE.FogExp2 | null; if (fg && fg.isFogExp2) fg.density = fogBase / (1 + Math.max(0, cam.position.y - 8) / 20);
  };
}

/** silhueta escura (sem a arte do dono) */
export function silhueta() {
  const c = document.createElement('canvas'); c.width = 160; c.height = 320; const g = c.getContext('2d')!;
  g.fillStyle = '#1e1a17'; g.beginPath(); g.arc(80, 62, 34, 0, 7); g.fill();
  g.beginPath(); g.moveTo(20, 300); g.quadraticCurveTo(22, 120, 80, 112); g.quadraticCurveTo(138, 120, 140, 300); g.closePath(); g.fill();
  g.strokeStyle = '#c9a45c88'; g.lineWidth = 3; g.stroke();
  return c.toDataURL('image/png');
}
