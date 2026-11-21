// Mapa: Valkaria, capital do Reinado (Tormenta 20) — o coração da cidade em escala de gente, no nível de Barud:
// prédios com interior (Palácio, Catedral, Grande Biblioteca, Grifo Dourado, estalagem, botica, armaria, guilda,
// quartel), a deusa colossal na praça do Panteão, avenidas, rio, muralha; luzes perto da câmera, fumaça, névoa no rio,
// vistas, fichas do mestre, NPCs (artes do dono) e o povo nas ruas. Liga ao Sul de Arton pela passagem (core/passagem.ts).
import * as THREE from 'three';
import type { MapRuntime, View, LocalInfo, NpcInfo } from '../../core/types';
import type { TokenDef } from '../../core/tokens';
import { begin, mistTex } from '../../core/kit';
import { S, cam } from '../../core/engine';
import { fatorLuzes } from '../../core/sky';
import { Batch, MAT, Q } from '../barud/common';
import { LUZES } from '../barud/cidade';
import { construirPredio, retDe, SPEC } from '../barud/edificios';
import { PREDIOS_V, mobiliarV, mundoV } from './predios';
import { construirCidadeV } from './cidade';
import { LOCAIS_V, NPCS_V, IMG_V } from './dados';
import { retratoArton } from '../arton/retratos';
import { type V, PI, rnd, pick, reseed, polar, caixa, Ocupacao, R_MURO, AVENIDAS, RIO, rioX, PRACA_R } from './plano';

const P3 = (v: THREE.Vector3 | number[]) => (Array.isArray(v) ? v : [v.x, v.y, v.z]).map(n => +(+n).toFixed(2)) as [number, number, number];

export async function build(M: MapRuntime) {
  begin(M, 47); reseed(990); LUZES.length = 0;
  const G = M.G, Mt = MAT(); M.lamps.push(Mt.aceso, Mt.vitral);
  const B = new Batch('predios-valkaria'), BR = new Batch('telhados-predios'), roofs = new THREE.Group(); roofs.name = 'Telhados dos prédios';

  // ---------- prédios com interior ----------
  const floors: THREE.Object3D[] = [], solids: THREE.Object3D[] = [], vttWalls: V[][] = [], portals: NonNullable<MapRuntime['vtt']['portals']> = [];
  for (const p of PREDIOS_V) { const c = construirPredio(B, BR, G, p); floors.push(...c.floors); solids.push(...c.solids); vttWalls.push(...c.vtt); portals.push(...c.portals); mobiliarV(B, p.id); }

  // ---------- o que a cidade não pode cobrir (prédios grandes, mercado, frentes) ----------
  const ocup = new Ocupacao();
  const reservados = PREDIOS_V.map(p => {
    const fx = Math.sin(p.ry), fz = Math.cos(p.ry);
    if (p.id === 'v-palacio') return { id: p.id, B: caixa(p.x + fx * 6, p.z + fz * 6, p.w + 14, p.d + 24, p.ry) };
    if (p.id === 'v-catedral') return { id: p.id, B: caixa(p.x + fx * 2, p.z + fz * 2, p.w + 14, p.d + 6, p.ry) };
    return { id: p.id, B: caixa(p.x + fx * 1.2, p.z + fz * 1.2, p.w + 2, p.d + 3.4, p.ry) };
  });
  { const [x, z] = polar(PI / 2, 70); reservados.push({ id: 'mercado', B: caixa(x, z, 32, 24, 0) }); }
  { const [x, z] = polar(0, 64); reservados.push({ id: 'academia', B: caixa(x, z, 19, 19, 0) }); const [ox, oz] = polar(-0.42, 66); reservados.push({ id: 'observatorio', B: caixa(ox, oz, 14, 14, 0) }); }
  for (const [a, r, w, d] of [[PI, 52.5, 18, 7], [0, 52.5, 16, 7]] as number[][]) { const [x, z] = polar(a, r); reservados.push({ id: 'frente', B: caixa(x, z, d, w, 0) }); }
  reservados.forEach(r => ocup.ocupar(r.B));

  // ---------- a cidade ----------
  const C = await construirCidadeV(G, ocup, reservados, PREDIOS_V);
  floors.push(...C.floors); vttWalls.push(...C.vttWalls);
  B.build(G); BR.build(roofs); G.add(roofs);
  const solidos = [...solids, C.colliders];
  M.solid = () => solidos;
  M.walk.push(...floors);
  M.layers = [{ n: 'Telhados', o: C.roofs, v: true }, { n: 'Telhados dos prédios', o: roofs, v: true }];

  // ---------- luzes: um punhado de PointLights vai para as luzes pedidas mais perto da câmera ----------
  const pool = Array.from({ length: Q.luzes }, () => { const l = new THREE.PointLight(0xffffff, 0, 0, 2); G.add(l); const e = { l, d: 0, n: 0 }; M.lights.push(e); return e; });
  const alvo: (typeof LUZES[number] | null)[] = [];
  let ult = -1; const posEsc = new THREE.Vector3(1e9, 0, 0);
  const escolher = () => {
    const c = cam.position, f = fatorLuzes();
    const l = LUZES.map(r => ({ r, s: Math.hypot(r.x - c.x, (r.y - c.y) * 1.5, r.z - c.z) - r.prio * 3 })).sort((a, b) => a.s - b.s).slice(0, pool.length);
    pool.forEach((e, i) => { const r = l[i]?.r || null; alvo[i] = r; if (!r) { e.n = 0; e.l.intensity = 0; return; } e.l.position.set(r.x, r.y, r.z); e.l.color.setHex(r.cor); e.l.distance = r.dist * 1.6; e.n = r.n; e.l.intensity = r.n * f; });
  };
  escolher();

  // ---------- fumaça das chaminés ----------
  const cham = C.chamines.slice().sort(() => rnd() - 0.5).slice(0, Q.fumaca + 10);
  const NP = 7, fum = new THREE.BufferGeometry(), fp = new Float32Array(cham.length * NP * 3), fs = new Float32Array(cham.length * NP);
  fum.setAttribute('position', new THREE.BufferAttribute(fp, 3)); fum.setAttribute('size', new THREE.BufferAttribute(fs, 1));
  const fumMat = new THREE.ShaderMaterial({
    uniforms: { map: { value: mistTex() }, uScale: { value: 400 }, uCor: { value: new THREE.Color(0x6a6870) } },
    vertexShader: 'attribute float size; uniform float uScale; varying float vA; void main(){ vec4 mv = modelViewMatrix*vec4(position,1.0); gl_PointSize = size*uScale/-mv.z; vA = clamp(1.0 - size/6.0, 0.0, 1.0); gl_Position = projectionMatrix*mv; }',
    fragmentShader: 'uniform sampler2D map; uniform vec3 uCor; varying float vA; void main(){ vec4 c = texture2D(map, gl_PointCoord); gl_FragColor = vec4(uCor, c.a * 0.5 * vA); }',
    transparent: true, depthWrite: false,
  });
  const fumPts = new THREE.Points(fum, fumMat); fumPts.frustumCulled = false; fumPts.userData.ns = 1; fumPts.userData.noExport = 1; G.add(fumPts);
  fumPts.onBeforeRender = r => { fumMat.uniforms.uScale.value = r.getDrawingBufferSize(new THREE.Vector2()).y / (2 * Math.tan(THREE.MathUtils.degToRad(cam.fov) / 2)); };
  const fase = cham.map(() => rnd() * 10);

  // ---------- névoa baixa sobre o rio e entre as casas ----------
  const mist: THREE.Sprite[] = [];
  for (let i = 0; i < (Q.luzes > 8 ? 30 : 14); i++) {
    const noRioI = i % 2 === 0, z = (rnd() - 0.5) * 300, x = noRioI ? rioX(z) : (rnd() - 0.5) * 280;
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: mistTex(), color: noRioI ? 0xc0c4d0 : 0xc8c4d0, transparent: true, depthWrite: false, opacity: noRioI ? 0.12 : 0.06 }));
    const sc = 12 + rnd() * 12; sp.scale.set(sc, sc * 0.22, 1); sp.position.set(x, noRioI ? RIO.agua + sc * 0.06 : sc * 0.08 + 0.2, z); sp.userData.v = 0.1 + rnd() * 0.2; sp.userData.ns = 1; sp.userData.noExport = 1; sp.userData.x0 = x;
    G.add(sp); mist.push(sp); M.mist.push(sp);
  }

  // ---------- vistas ----------
  const fora = (id: string, dist: number, alt: number, lado = 0): View => { const p = SPEC[id], fx = Math.sin(p.ry), fz = Math.cos(p.ry), rx = Math.cos(p.ry); const pos = new THREE.Vector3(p.x + fx * (p.d / 2 + dist) + rx * lado, alt + (p.base ?? 0), p.z + fz * (p.d / 2 + dist) - Math.sin(p.ry) * lado); return { n: '', p: P3(pos), t: P3(new THREE.Vector3(p.x, (p.base ?? 0) + Math.min(6, p.h * p.andares * 0.6), p.z)), fov: 55 }; };
  const dentro = (id: string, px: number, py: number, pz: number, tx: number, ty: number, tz: number, fov = 66): View => ({ n: '', p: P3(mundoV(id, px, pz, py)), t: P3(mundoV(id, tx, tz, ty)), fov });
  const nome = (v: View, n: string) => ({ ...v, n });
  const pg = C.portoes.find(p => p.n === 'Portão dos Peregrinos')!, [ix, iz] = polar(pg.a, R_MURO - 22);
  const vistas: View[] = [
    { n: 'Geral', p: [150, 150, 230], t: [0, 20, 0], fov: 50 },
    { n: 'Cinema', p: [-120, 40, 170], t: [0, 40, 0], fov: 45 },
    { n: 'Praça do Panteão', p: [32, 2.0, 7.8], t: [0, 7, -4], fov: 66 },
    { n: 'A deusa', p: [70, 30, 92], t: [0, 42, 0], fov: 60 },
    nome(fora('v-palacio', 30, 6), 'Palácio Imperial'), nome(dentro('v-palacio', 0, 1.8, 13.5, 0, 3.4, -12, 64), 'Sala do Trono'),
    nome(fora('v-catedral', 26, 4), 'Catedral'), nome(dentro('v-catedral', 0, 1.8, 13.5, 0, 4.5, -12, 64), 'Catedral · nave'),
    { n: 'Academia Arcana', p: P3([polar(0, 40)[0], 3, 18]), t: P3([64, 30, 0]), fov: 62 },
    nome(fora('v-biblioteca', 14, 2.2), 'Grande Biblioteca'), nome(dentro('v-biblioteca', -9.5, 1.7, 5.8, 6, 1.4, -4), 'Grande Biblioteca · salão'),
    { n: 'Grande Mercado', p: P3([polar(PI / 2, 50)[0] + 8, 3.2, polar(PI / 2, 50)[1]]), t: P3([0, 1.2, 70]), fov: 62 },
    nome(fora('v-grifo', 12, 2.2), 'Grifo Dourado'), nome(dentro('v-grifo', 6.5, 1.7, 5, -6, 1.2, -1.5), 'Grifo Dourado · salão'),
    nome(fora('v-estalagem', 12, 2.2), 'Estalagem da Deusa'), nome(dentro('v-estalagem', 6, 1.7, 5, -5, 1.2, 0), 'Estalagem · sala'),
    nome(fora('v-botica', 9, 2), 'Botica da Lua Violeta'), nome(dentro('v-botica', 3.5, 1.7, 3.5, -2, 1.1, -3), 'Botica · balcão'),
    nome(fora('v-armaria', 9, 2), 'Armaria Barba-de-Ferro'), nome(dentro('v-armaria', 4.5, 1.7, 3.5, -2.5, 1.1, -3), 'Armaria · loja'),
    nome(fora('v-guilda', 12, 2.2), 'Casa dos Heróis'), nome(dentro('v-guilda', 8, 1.7, 5.5, -6, 1.3, -1), 'Casa dos Heróis · salão'),
    nome(fora('v-quartel', 12, 2.2), 'Quartel da Guarda'), nome(dentro('v-quartel', 1.3, 1.7, 6.3, -7, 1.1, 1.2), 'Quartel · pátio'),
    { n: 'Bairro do Cais', p: P3([rioX(-20) - 24, 4, -2]), t: P3([rioX(20), 0, 30]), fov: 58 },
    { n: 'Portão dos Peregrinos', p: P3([ix, 2.2, iz]), t: P3([pg.x, 8, pg.z]), fov: 58 },
    ...C.portoes.filter(p => p !== pg).map(p => { const [x, z] = polar(p.a, R_MURO - 26); return { n: p.n, p: P3([x, 3, z]), t: P3([p.x, 8, p.z]), fov: 58 } as View; }),
    { n: 'Muralha e torres', p: P3([polar(2.2, R_MURO + 40)[0], 18, polar(2.2, R_MURO + 40)[1]]), t: P3([0, 10, 0]), fov: 55 },
    { n: 'Tática', p: [0, 360, 0.1], t: [0, 0, 0], fov: 50 },
  ];
  M.views = vistas;

  // ---------- fichas do mestre e notas por vista ----------
  const tokId = (id: string) => 'vk_' + id;
  const retrato = (id: string) => (IMG_V[id] ? retratoArton(IMG_V[id]) : undefined);
  M.fichas = NPCS_V.map(n => ({ ...n, img: retrato(n.id), tok: tokId(n.id) }) as NpcInfo);
  const MAR: Record<string, [number, number, number]> = {};
  for (const [k, v] of Object.entries(C.marcos)) MAR[k] = P3(v);
  M.locais = LOCAIS_V.map(l => {
    const p = PREDIOS_V.find(q => q.id === l.id);
    const area: [number, number, number, number] | undefined = p ? retDe(p) : l.id === 'praca' ? [-PRACA_R, PRACA_R, -PRACA_R, PRACA_R] : l.id === 'mercado' ? [-16, 16, 58, 82] : l.id === 'academia' ? [54, 74, -10, 10] : l.id === 'rio' ? [rioX(0) - 20, rioX(0) + 30, -60, 60] : undefined;
    const marca: [number, number, number] | undefined = MAR[l.id] ?? (p ? P3(mundoV(p.id, 0, 0, p.andares * p.h + Math.min(p.w, p.d) * 0.42 + 2)) : l.id === 'praca' ? [0, 8, 30] : l.id === 'rio' ? [rioX(0), 6, 0] : l.id === 'cidade' ? [0, 125, 0] : undefined);
    return { ...l, area, marca } as LocalInfo;
  });
  M.notas = {};
  for (const l of LOCAIS_V) {
    const npcs = l.npcs.map(id => NPCS_V.find(n => n.id === id)?.n).filter(Boolean).join(', ');
    const txt = `${l.tipo.toUpperCase()} — ${l.dono}\n${l.publico}${npcs ? '\nNPCs: ' + npcs : ''}\n(Ficha completa e segredos: botão Locais)`;
    M.notas[l.vista] = txt; if (l.dentro) M.notas[l.dentro] = txt;
  }

  // ---------- NPCs com ficha e o povo nas ruas (todos os povos; humanos na maioria) ----------
  const HUMANOS = ['m11', 'm12', 'm13', 'm14', 'm15', 'm16', 'w10', 'w16', 'v11', 'v13', 'v14', 'w21', 'w03', 'v07', 'v12'];
  const POVO: [string[], string, number][] = [
    [HUMANOS, 'Valkariano', 1.75], [['a1-02', 'a1-04', 'a1-06', 'a1-08', 'a1-10', 'a1-12'], 'Elfo', 1.78], [['a2-02', 'a2-04', 'c1-03', 'c1-05', 'c1-09'], 'Anão', 1.35],
    [['b7-05', 'b7-07', 'b7-09', 'b7-11'], 'Tiefling', 1.75], [['b6-03', 'b6-05', 'c6-03', 'c6-06'], 'Dracônico', 1.95], [['a6-02', 'a6-04', 'a6-06'], 'Meio-orc', 1.85],
    [['m01', 'm02', 'm20'], 'Minotauro', 2.3], [['a3-02', 'a3-05'], 'Goblin', 1.0],
  ];
  const lugaresPovo: [number, number, number][] = [[0, 0, 0], [0, 70, 9], [-60, 58, 0], [70, -40, 0], [rioX(30) - 10, 30, 0], [-104, 104, 0]];
  M.npcs = async (): Promise<TokenDef[]> => {
    const out: TokenDef[] = NPCS_V.map(n => {
      const v = n.pos.p ? mundoV(n.pos.p, n.pos.x, n.pos.z, (n.pos.andar ?? 0) * (SPEC[n.pos.p]?.h ?? 3) + 0.06) : new THREE.Vector3(n.pos.x, 0.05, n.pos.z);
      const img = retrato(n.id);
      return { id: tokId(n.id), name: n.n, h: n.h ?? 1.75, c: /vil[ãa]o?/.test(n.n) ? 0x9a1a14 : 0x5a4a6a, img: img || silhueta(), npc: true, pos: { x: v.x, z: v.z, y: v.y, oc: !!n.oculto } } as TokenDef;
    });
    reseed(4242); let k = 0;
    for (let i = 0; i < 46; i++) {
      const q = rnd(), [imgs, nm, h] = q < 0.5 ? POVO[0] : POVO[1 + ((rnd() * (POVO.length - 1)) | 0)];
      const im = retratoArton(pick(imgs)); if (!im) continue;
      const [cx, cz] = i < 18 ? polar(rnd() * PI * 2, PRACA_R - 6 - rnd() * 14) : (() => { const L = pick(lugaresPovo.slice(1)); return [L[0] + (rnd() - 0.5) * 22, L[1] + (rnd() - 0.5) * 22] as V; })();
      out.push({ id: 'vk_povo' + (k++), name: nm, h, c: 0x6a5a4a, img: im, npc: true, pos: { x: cx, z: cz, y: 0.05 } } as TokenDef);
    }
    return out;
  };
  M.npcVisivel = t => cam.position.distanceTo(t.g.position) < 110;

  // ---------- VTT, sons, câmera ----------
  M.sons = [{ ...P3m(mundoV('v-catedral', 0, -9, 1.2)), tipo: 'velas' }, { ...P3m(mundoV('v-catedral', 12, 14, 24)), tipo: 'sino' }, { ...P3m(mundoV('v-grifo', -2, 6, 1.4)), tipo: 'porta' }];
  M.vtt = {
    areas: [
      { n: 'Cidade inteira', b: [-R_MURO - 8, R_MURO + 8, -R_MURO - 8, R_MURO + 8], lv: 1 },
      { n: 'Praça do Panteão', b: [-PRACA_R - 6, PRACA_R + 6, -PRACA_R - 6, PRACA_R + 6], lv: 1 },
      { n: 'Grande Mercado', b: [-30, 30, 50, 92], lv: 1 },
      { n: 'Bairro do Cais', b: [rioX(0) - 25, R_MURO, -80, 80], lv: 1 },
      ...PREDIOS_V.map(p => { const r = retDe(p); return { n: LOCAIS_V.find(l => l.id === p.id)?.n ?? p.id, b: [r[0] - 2, r[1] + 2, r[2] - 2, r[3] + 2] as [number, number, number, number], lv: 1 }; }),
    ],
    walls: vttWalls, portals,
    lights: LUZES.filter(r => r.vtt).map(r => [+r.x.toFixed(2), +r.z.toFixed(2), r.vtt!, 0.8, r.cor.toString(16).padStart(6, '0')] as [number, number, number, number, string]),
  };
  M.exportHide = () => [C.roofs, roofs];
  M.shadowRadius = Q.luzes > 8 ? 110 : 75;
  M.walkLimit = 330; M.camMax = 460; M.fogScale = 0.4;
  M.volta = { mapa: 'arton', vista: 'Valkaria', n: 'Sul de Arton' };
  M.spawn = i => ({ x: ix + (i % 3) * 1.2, z: iz - Math.floor(i / 3) * 1.2, y: 0.05 });
  M.walkStart = { x: ix, z: iz };
  void AVENIDAS;

  // ---------- animação ----------
  const luar = new THREE.HemisphereLight(0x9aa4d8, 0x2a2430, 0); luar.userData.noExport = 1; G.add(luar);
  let fogBase = 0.008, lampsOn = true;
  M.onTime = p => { lampsOn = p.lamps > 0; fogBase = (S.fog as THREE.FogExp2 | null)?.density ?? fogBase; luar.intensity = p.n === 'Noite' ? 6 : p.bg < 0.15 ? 2.2 : p.bg < 0.4 ? 0.9 : 0.15; escolher(); };
  M.tick = (dt, t) => {
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

const P3m = (v: THREE.Vector3) => ({ x: v.x, y: v.y, z: v.z });
/** silhueta escura (sem a arte do dono) */
function silhueta() {
  const c = document.createElement('canvas'); c.width = 160; c.height = 320; const g = c.getContext('2d')!;
  g.fillStyle = '#1e1a22'; g.beginPath(); g.arc(80, 62, 34, 0, 7); g.fill();
  g.beginPath(); g.moveTo(20, 300); g.quadraticCurveTo(22, 120, 80, 112); g.quadraticCurveTo(138, 120, 140, 300); g.closePath(); g.fill();
  g.strokeStyle = '#b89ae088'; g.lineWidth = 3; g.stroke();
  return c.toDataURL('image/png');
}
