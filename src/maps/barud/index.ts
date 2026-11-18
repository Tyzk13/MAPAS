// Mapa: Barud, capital de Lomatubar (Tormenta 20). Cidade murada dark fantasy marcada pela Praga Coral.
// Monta prédios com interior, a cidade, a praça; luzes perto da câmera; fumaça; vistas; fichas do mestre; NPCs; cartazes.
import * as THREE from 'three';
import type { MapRuntime, View, LocalInfo, NpcInfo } from '../../core/types';
import type { TokenDef } from '../../core/tokens';
import { begin, mistTex, halo } from '../../core/kit';
import { S, cam } from '../../core/engine';
import { place } from '../../core/models';
import { fatorLuzes } from '../../core/sky';
import { Batch, MAT, mtx, cx, cil, rnd, pick, reseed, Q, PRACA, FORTALEZA, CORAL, PORTAO_SUL, CANAL, coral, signTexture } from './common';
import { construirCidade, LUZES, luz } from './cidade';
import { PREDIOS, construirPredio, mobiliar, construirFortaleza, retDe, mundo, SPEC } from './edificios';
import { mesa, caixote, barril, sacos, peca } from './mobilia';
import { LOCAIS, NPCS } from './dados';
import { docPlane } from '../canada/interior';

// imagens opcionais (fora do git): retratos dos NPCs e cartazes que o mestre enviar
const RETRATOS = import.meta.glob('../../../npcs-local/barud/*.{png,jpg,jpeg,webp}', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const CARTAZES = import.meta.glob('../../../npcs-local/barud/cartazes/*.{png,jpg,jpeg,webp}', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const retrato = (id: string) => Object.entries(RETRATOS).find(([k]) => k.split('/').pop()!.replace(/\.\w+$/, '') === id)?.[1];

const P3 = (v: THREE.Vector3) => [+v.x.toFixed(2), +v.y.toFixed(2), +v.z.toFixed(2)] as [number, number, number];

export async function build(M: MapRuntime) {
  begin(M, 31); reseed(31); LUZES.length = 0;
  const G = M.G, Mt = MAT(); M.lamps.push(Mt.aceso, Mt.vitral);
  const B = new Batch('predios'), BR = new Batch('telhados-predios'), roofs = new THREE.Group(); roofs.name = 'Telhados dos prédios';
  const docs: NonNullable<MapRuntime['docs']> = [];

  // ---------- fortaleza e prédios com interior ----------
  const F = construirFortaleza(B, BR, G);
  const floors: THREE.Object3D[] = [...F.floors], solids: THREE.Object3D[] = [...F.solids];
  const vttWalls: [number, number][][] = [], portals: NonNullable<MapRuntime['vtt']['portals']> = [];
  for (const p of PREDIOS) {
    const c = construirPredio(B, BR, G, p); floors.push(...c.floors); solids.push(...c.solids); vttWalls.push(...c.vtt); portals.push(...c.portals);
    mobiliar(B, G, p.id, docs);
  }
  const reservados = [...PREDIOS.map(retDe), FORTALEZA, PRACA];

  // ---------- cidade ----------
  const C = construirCidade(G, reservados);
  floors.push(...C.floors); vttWalls.push(...C.vttWalls);

  // ---------- praça do mercado: barracas, monumento, poço, pelourinho, quadro de avisos ----------
  {
    const barraca = (x: number, z: number, ry: number, cor: number) => {
      const m = mtx(x, 0, z, ry);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) cx(B, Mt.madeira, 0.1, sz > 0 ? 2.2 : 2.6, 0.1, sx * 1.3, sz > 0 ? 1.1 : 1.3, sz * 0.9, 0x3a2818, m);
      const g = new THREE.BoxGeometry(2.9, 0.04, 2.2); g.rotateX(-0.18); g.translate(0, 2.45, 0); g.applyMatrix4(m); B.add(Mt.tecido, g, cor);
      mesa(B, m, 0, 0.5, 0, 2.4, 0.9);
      const P = peca(B, m, 0, 0.8, 0.5);
      for (let i = 0; i < 7; i++) P.cx(Mt.plain, 0.2 + rnd() * 0.15, 0.12 + rnd() * 0.12, 0.2, -1 + i * 0.32, 0.08, (rnd() - 0.5) * 0.4, pick([0x8a3a2a, 0x6a7a3a, 0xa08040, 0x5a4a30, 0x7a2a3a]));
      if (rnd() < 0.6) caixote(B, m, 1.6, -0.6, 0, 0.55); if (rnd() < 0.5) sacos(B, m, -1.7, -0.4, 3);
    };
    const cores = [0x4a1a20, 0x3a2e22, 0x5a3a1a, 0x2a2a30, 0x4a2a1e, 0x3a1a1a];
    [[-15, -28, 0], [-9, -28, 0], [9, -28, 0], [15, -28, 0], [-17, -2, Math.PI], [-11, -2, Math.PI], [11, -2, Math.PI], [17, -2, Math.PI], [-18, -18, Math.PI / 2], [18, -20, -Math.PI / 2]]
      .forEach(([x, z, r], i) => barraca(x, z, r, cores[i % cores.length]));
    // monumento aos caídos (pedestal + estátua sem rosto)
    cx(B, Mt.pedra, 3.4, 1.2, 3.4, 0, 0.6, -15, 0x6e6860); cx(B, Mt.pedra, 2.4, 1.4, 2.4, 0, 1.9, -15, 0x7a746c);
    place('gothic_statue', 0, 2.6, -15, Math.PI, 1.15, G).catch(() => {});
    for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; const v = new THREE.Vector3(Math.cos(a) * 1.9, 1.22, -15 + Math.sin(a) * 1.9); if (i % 3 === 0) { cil(B, Mt.plain, 0.03, 0.14, v.x, v.y, v.z, 0xe8dcc0, 6); cx(B, Mt.aceso, 0.03, 0.05, 0.03, v.x, v.y + 0.17, v.z); } }
    luz(0, 1.6, -13, 2, 3, 0xffb060, 6); halo(0, 1.5, -13.1, 0.4);
    // poço
    cil(B, Mt.pedra, 1.1, 0.9, -6, 0, -8, 0x6a645c, 14); cil(B, Mt.escuro, 0.85, 0.02, -6, 0.9, -8, 0xffffff, 14);
    for (const s of [-1, 1]) cx(B, Mt.madeira, 0.12, 2.2, 0.12, -6 + s * 1.0, 1.1, -8, 0x2a1e14); cx(B, Mt.madeira, 2.3, 0.14, 0.14, -6, 2.2, -8, 0x2a1e14);
    // pelourinho
    { const m = mtx(8, 0, -9, 0.3); cx(B, Mt.madeira, 0.25, 2.2, 0.25, 0, 1.1, 0, 0x2a1e14, m); cx(B, Mt.madeira, 1.4, 0.3, 0.18, 0, 1.6, 0, 0x2a1e14, m); cx(B, Mt.pedra, 1.4, 0.3, 1.4, 0, 0.15, 0, 0x5a544c, m); }
    // quadro de avisos com cartazes de procurados (o mestre pode trocar por imagens próprias)
    const qx = -20.6, qz = -14;
    cx(B, Mt.madeira, 0.15, 2.6, 0.15, qx, 1.3, qz - 1.3, 0x2a1e14); cx(B, Mt.madeira, 0.15, 2.6, 0.15, qx, 1.3, qz + 1.3, 0x2a1e14);
    cx(B, Mt.tabuas, 0.08, 1.5, 2.8, qx, 1.8, qz, 0x4a3424); cx(B, Mt.telha, 0.6, 0.06, 3.2, qx, 2.65, qz, 0x5a3a30);
    const imgsC = Object.entries(CARTAZES).sort(([a], [b]) => a.localeCompare(b)).map(([, u]) => u);
    const nomes = ['RUFO "O ESFOLADOR"', 'IRMÃ CINZA', 'O HOMEM DE CORAL', 'GARRA-NEGRA', 'VIÚVA DO CANAL'];
    const premios = ['500 Tibares de Ouro', '300 Tibares', 'Vivo — 1.000 TO', '200 Tibares', '250 Tibares'];
    nomes.forEach((n, i) => {
      const t = cartaz(n, premios[i], imgsC[i]);
      docPlane(G, docs, t, 0.48, 0.66, qx + 0.06, 1.75 + (i % 2 ? -0.32 : 0.3), qz - 1.05 + i * 0.52, Math.PI / 2, 'Cartaz: ' + n.replace(/"/g, ''));
    });
    for (const d of docs) { d.onde = 'Praça do Mercado'; d.pt = 'Cartaz de procurado. Troque a imagem pondo PNGs em npcs-local/barud/cartazes/ (01.png, 02.png…).'; }
    // aviso da quarentena e decreto do regente
    docPlane(G, docs, aviso('DECRETO DO PRETOR', ['Toque de recolher após o sino da noite.', 'É proibido atravessar as barricadas', 'do Bairro Isolado sob pena de morte.', 'Humanos não portam armas nas ruas.', '', '— Cássio Taurano, Pretor de Lomatubar']), 0.7, 0.9, qx + 0.06, 1.8, qz + 1.25 + 0.1, Math.PI / 2, 'Decreto do Pretor');
    docs[docs.length - 1].onde = 'Praça do Mercado'; docs[docs.length - 1].pt = 'Decreto público. Odric (escrivão) sabe que o selo deste decreto é diferente dos antigos.';
  }
  // quadro de procurados no quartel e diário no lazareto
  {
    const v = mundo('quartel', -5.2, 0.24, 1.6), ry = SPEC.quartel.ry;
    docPlane(G, docs, cartaz('O HOMEM DE CORAL', 'Informações: Capitão Renno Valk', Object.values(CARTAZES)[2]), 0.5, 0.7, v.x, v.y, v.z, ry, 'Cartaz no quartel: o Homem de Coral');
    docs[docs.length - 1].onde = 'Quartel da Guarda';
    const d = mundo('lazareto', 4.6, -4.4, 0.83);
    docPlane(G, docs, aviso('Diário do Curandeiro-Chefe', ['…dia 41. Os que se cristalizam', 'por inteiro não morrem.', 'Eles esperam. E ouvem.', 'O menino ainda respira sob a pedra.', 'Que Lena me perdoe: fechei a porta.']), 0.42, 0.32, d.x, d.y, d.z, SPEC.lazareto.ry, 'Diário do curandeiro (lazareto)', true);
    docs[docs.length - 1].onde = 'Lazareto'; docs[docs.length - 1].pt = 'Prova de que os cristalizados estão vivos — e de que o herdeiro foi levado ao lazareto.';
  }

  // ---------- montagem das malhas ----------
  B.build(G); BR.build(roofs); G.add(roofs);
  const solidos = [...solids, C.colliders];
  M.solid = () => solidos;
  M.walk.push(...floors);
  M.layers = [{ n: 'Telhados', o: C.roofs, v: true }, { n: 'Telhados dos prédios', o: roofs, v: true }];

  // ---------- luzes: N PointLights vão para as luzes pedidas mais perto da câmera ----------
  const pool = Array.from({ length: Q.luzes }, () => { const l = new THREE.PointLight(0xffffff, 0, 0, 2); G.add(l); const e = { l, d: 0, n: 0 }; M.lights.push(e); return e; });
  const alvo: (typeof LUZES[number] | null)[] = [];
  let ult = -1; const posEsc = new THREE.Vector3(1e9, 0, 0);
  const escolher = () => {
    const c = cam.position, f = fatorLuzes();
    const l = LUZES.map(r => ({ r, s: Math.hypot(r.x - c.x, (r.y - c.y) * 1.5, r.z - c.z) - r.prio * 3 })).sort((a, b) => a.s - b.s).slice(0, pool.length);
    pool.forEach((e, i) => { const r = l[i]?.r || null; alvo[i] = r; if (!r) { e.n = 0; e.l.intensity = 0; return; } e.l.position.set(r.x, r.y, r.z); e.l.color.setHex(r.cor); e.l.distance = r.dist * 1.6; e.n = r.n; e.l.intensity = r.n * f; });
  };
  escolher();

  // ---------- fumaça das chaminés (pontos subindo) ----------
  const cham = C.chamines.slice().sort(() => rnd() - 0.5).slice(0, Q.fumaca);
  const forja = mundo('forja', -2.2, -3.0, 4.6); cham.push(forja, forja.clone().add(new THREE.Vector3(0.2, 0, 0.1)));
  const NP = 7, fum = new THREE.BufferGeometry(), fp = new Float32Array(cham.length * NP * 3), fs = new Float32Array(cham.length * NP);
  fum.setAttribute('position', new THREE.BufferAttribute(fp, 3)); fum.setAttribute('size', new THREE.BufferAttribute(fs, 1));
  const fumMat = new THREE.ShaderMaterial({
    uniforms: { map: { value: mistTex() }, uScale: { value: 400 }, uCor: { value: new THREE.Color(0x4a4642) } },
    vertexShader: 'attribute float size; uniform float uScale; varying float vA; void main(){ vec4 mv = modelViewMatrix*vec4(position,1.0); gl_PointSize = size*uScale/-mv.z; vA = clamp(1.0 - size/6.0, 0.0, 1.0); gl_Position = projectionMatrix*mv; }',
    fragmentShader: 'uniform sampler2D map; uniform vec3 uCor; varying float vA; void main(){ vec4 c = texture2D(map, gl_PointCoord); gl_FragColor = vec4(uCor, c.a * 0.55 * vA); }',
    transparent: true, depthWrite: false,
  });
  const fumPts = new THREE.Points(fum, fumMat); fumPts.frustumCulled = false; fumPts.userData.ns = 1; fumPts.userData.noExport = 1; G.add(fumPts);
  fumPts.onBeforeRender = (r) => { fumMat.uniforms.uScale.value = r.getDrawingBufferSize(new THREE.Vector2()).y / (2 * Math.tan(THREE.MathUtils.degToRad(cam.fov) / 2)); };
  const fase = cham.map(() => rnd() * 10);

  // ---------- névoa baixa à deriva (mais densa no Bairro Coral e no canal) ----------
  const mist: THREE.Sprite[] = [];
  for (let i = 0; i < (Q.luzes > 8 ? 30 : 14); i++) {
    const naCoral = i < 8, x = naCoral ? CORAL[0] + rnd() * (CORAL[1] - CORAL[0]) : (rnd() - 0.5) * 200, z = naCoral ? CORAL[2] + rnd() * (CORAL[3] - CORAL[2]) : i < 14 ? CANAL.z0 + rnd() * 10 : (rnd() - 0.5) * 200;
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: mistTex(), color: naCoral ? 0xb08080 : 0xb8b8c0, transparent: true, depthWrite: false, opacity: 0.08 }));
    const sc = 10 + rnd() * 10; sp.scale.set(sc, sc * 0.25, 1); sp.position.set(x, sc * 0.08 + 0.2, z); sp.userData.v = 0.1 + rnd() * 0.2; sp.userData.ns = 1; sp.userData.noExport = 1; sp.userData.x0 = x;
    G.add(sp); mist.push(sp); M.mist.push(sp);
  }

  // ---------- vistas ----------
  const vistas: View[] = [
    { n: 'Cinema', p: [70, 48, 150], t: [0, 6, -10], fov: 45 },
    { n: 'Geral', p: [0, 120, 170], t: [0, 0, 0], fov: 50 },
    { n: 'Portão do Rei', p: [PORTAO_SUL.x + 6, 1.7, PORTAO_SUL.z + 16], t: [PORTAO_SUL.x, 6, PORTAO_SUL.z - 4], fov: 55 },
    { n: 'Via Real', p: [2.5, 1.7, 58], t: [0, 8, -60], fov: 55 },
    { n: 'Praça do Mercado', p: [16, 2.2, 2], t: [-4, 3, -18], fov: 60 },
    { n: 'Canal', p: [-20, 1.9, 27.4], t: [20, 0.4, 18], fov: 58 },
    { n: 'Muralha', p: [62, 12, 72], t: [20, 4, 95], fov: 55 },
  ];
  for (const p of PREDIOS) {
    const L = LOCAIS.find(l => l.id === p.id); if (!L) continue;
    const fora = mundo(p.id, 3, p.d / 2 + (p.id === 'templo' || p.id === 'salao' ? 16 : 9), 1.8), alvoF = mundo(p.id, 0, 0, Math.min(5, p.h));
    vistas.push({ n: L.vista, p: P3(fora), t: P3(alvoF), fov: 55 });
    if (L.dentro) {
      const grande = p.id === 'templo' || p.id === 'salao';
      let dp = grande ? mundo(p.id, 0, p.d / 2 - 1.2, 1.75) : mundo(p.id, p.w / 2 - 0.9, p.d / 2 - 0.9, 1.65), dt = grande ? mundo(p.id, 0, -p.d / 2, 2.6) : mundo(p.id, -p.w * 0.25, -p.d * 0.3, 1.2);
      if (p.vd) { dp = mundo(p.id, p.vd[2] * 0 + p.vd[0], p.vd[2], p.vd[1]); dt = mundo(p.id, p.vd[3], p.vd[5], p.vd[4]); }
      vistas.push({ n: L.dentro, p: P3(dp), t: P3(dt), fov: grande ? 60 : 68 });
    }
  }
  vistas.push({ n: 'Bairro Coral', p: [-38, 16, 4], t: [-74, 1, -38], fov: 55 });
  vistas.push({ n: 'Fortaleza', p: [0, 6, -30], t: [0, 12, -80], fov: 55 });
  // as do Javali e do Cálice já entram pelo laço; a Fortaleza tem vista própria (o salão é "Salão do Conselho")
  const unicas = new Map<string, View>(); vistas.forEach(v => { if (!unicas.has(v.n)) unicas.set(v.n, v); });
  M.views = [...unicas.values(), { n: 'Tática', p: [0, 210, 0.1], t: [0, 0, 0] }];

  // ---------- fichas do mestre e notas por vista ----------
  const tokId = (id: string) => 'bd_' + id;
  M.fichas = NPCS.map(n => ({ ...n, img: retrato(n.id), tok: tokId(n.id) }) as NpcInfo);
  M.locais = LOCAIS.map(l => {
    const p = PREDIOS.find(q => q.id === l.id);
    const area = p ? retDe(p) : l.id === 'praca' ? PRACA : l.id === 'coral' ? CORAL : l.id === 'portao' ? [PORTAO_SUL.x - 10, PORTAO_SUL.x + 10, PORTAO_SUL.z - 6, PORTAO_SUL.z + 6] as [number, number, number, number] : undefined;
    const marca = p ? P3(mundo(p.id, 0, 0, p.andares * p.h + Math.min(p.w, p.d) * 0.42 + 1.5)) : l.id === 'praca' ? [0, 6, -15] : l.id === 'coral' ? [-75, 8, -40] : l.id === 'portao' ? [PORTAO_SUL.x, 18, PORTAO_SUL.z] : undefined;
    return { ...l, area, marca } as LocalInfo;
  });
  M.notas = {};
  for (const l of LOCAIS) {
    const npcs = l.npcs.map(id => NPCS.find(n => n.id === id)?.n).filter(Boolean).join(', ');
    const txt = `${l.tipo.toUpperCase()} — ${l.dono}\n${l.publico}${npcs ? '\nNPCs: ' + npcs : ''}\n(Ficha completa e segredos: botão Locais)`;
    M.notas[l.vista] = txt; if (l.dentro) M.notas[l.dentro] = txt;
  }

  // ---------- NPCs como personagens arrastáveis (o Vigia de Coral nasce oculto) ----------
  M.npcs = async (): Promise<TokenDef[]> => NPCS.map(n => {
    const v = n.pos.p ? mundo(n.pos.p, n.pos.x, n.pos.z, (n.pos.andar ?? 0) * (SPEC[n.pos.p]?.h ?? 3) + 0.06) : new THREE.Vector3(n.pos.x, 0.03, n.pos.z);
    return { id: tokId(n.id), name: n.n, h: n.h ?? 1.7, c: 0x5a4a3a, img: retrato(n.id) || silhuetaPng(n.n), npc: true, pos: { x: v.x, z: v.z, y: v.y, oc: !!n.oculto } };
  });

  // ---------- docs, sons, VTT, câmera ----------
  M.docs = docs;
  M.sons = [
    { ...mundoXYZ('templo', 0, -8.6, 1.2), tipo: 'velas' }, { ...mundoXYZ('templo', 6.2, -9, 16), tipo: 'sino' },
    { ...mundoXYZ('javali', -2, 6, 1.4), tipo: 'porta' }, { ...mundoXYZ('lanterna', 2.5, 5, 1.4), tipo: 'porta' }, { x: 0, y: 1.4, z: -13, tipo: 'velas' },
  ];
  M.vtt = {
    areas: [
      { n: 'Cidade inteira', b: [-110, 110, -110, 110], lv: 1 },
      { n: 'Praça do Mercado', b: [PRACA[0] - 8, PRACA[1] + 16, PRACA[2] - 4, PRACA[3] + 8], lv: 1 },
      { n: 'Portão do Rei e Javali Rubro', b: [-20, 30, 60, 106], lv: 1 },
      { n: 'Canal e cais', b: [-60, 60, 4, 44], lv: 1 },
      { n: 'Alto da Coroa e Fortaleza', b: [-40, 40, -96, -36], lv: 1 },
      { n: 'Bairro Coral', b: [CORAL[0] - 4, CORAL[1] + 6, CORAL[2] - 4, CORAL[3] + 6], lv: 1 },
      ...PREDIOS.map(p => { const r = retDe(p); return { n: LOCAIS.find(l => l.id === p.id)?.n ?? p.id, b: [r[0] - 2, r[1] + 2, r[2] - 2, r[3] + 2] as [number, number, number, number], lv: 1 }; }),
    ],
    walls: vttWalls, portals,
    lights: LUZES.filter(r => r.vtt).map(r => [+r.x.toFixed(2), +r.z.toFixed(2), r.vtt!, 0.8, r.cor.toString(16).padStart(6, '0')] as [number, number, number, number, string]),
  };
  M.exportHide = () => [C.roofs, roofs];
  M.shadowRadius = Q.luzes > 8 ? 90 : 60;
  M.walkLimit = 200; M.camMax = 260; M.fogScale = 0.5;
  M.spawn = i => ({ x: -2 + (i % 3) * 1.2, z: 86 + Math.floor(i / 3) * 1.2, y: 0.03 });
  M.walkStart = { x: 0, z: 88 };

  // ---------- animação ----------
  // luar/luz do céu extra só em Barud: pedra escura e ruas estreitas sumiam nos climas escuros
  const luar = new THREE.HemisphereLight(0x8a9ac8, 0x2a2420, 0); luar.userData.noExport = 1; G.add(luar);
  let fogBase = 0.01, lampsOn = true;
  M.onTime = p => { lampsOn = p.lamps > 0; fogBase = (S.fog as THREE.FogExp2 | null)?.density ?? fogBase; luar.intensity = p.n === 'Noite' ? 7 : p.bg < 0.15 ? 2.6 : p.bg < 0.4 ? 1.1 : 0.2; luar.color.setHex(p.n === 'Noite' ? 0x8a9ad8 : 0x9a9a9a); escolher(); };
  M.tick = (dt, t) => {
    if (Math.floor(t * 3) !== ult || cam.position.distanceToSquared(posEsc) > 25) { ult = Math.floor(t * 3); posEsc.copy(cam.position); escolher(); }
    const f = fatorLuzes();
    if (f) pool.forEach((e, k) => { const r = alvo[k]; if (r && e.l.intensity > 0) e.l.intensity = r.n * f * (0.84 + 0.16 * Math.sin(t * 12 + k * 7) * Math.sin(t * 7.1 + k)); });
    if (lampsOn) M.lamps.forEach((m, i) => { const b = m.userData.base; if (b) m.color.copy(b).multiplyScalar(0.88 + 0.12 * Math.sin(t * 9 + i * 2.1) * Math.sin(t * 5.3 + i)); });
    // fumaça
    cham.forEach((c, i) => { for (let k = 0; k < NP; k++) { const u = ((t * 0.12 + fase[i] + k / NP) % 1), j = (i * NP + k); fp[j * 3] = c.x + u * 2.5 + Math.sin(t * 0.7 + k) * 0.3; fp[j * 3 + 1] = c.y + u * 7; fp[j * 3 + 2] = c.z + u * 1.2; fs[j] = 1.2 + u * 5; } });
    fum.attributes.position.needsUpdate = true; (fum.attributes.size as THREE.BufferAttribute).needsUpdate = true;
    const baixo = cam.position.y < 35;
    mist.forEach(m => { m.visible = baixo; m.position.x = m.userData.x0 + Math.sin(t * 0.05 * m.userData.v * 10) * 6; });
    const fg = S.fog as THREE.FogExp2 | null; if (fg && fg.isFogExp2) fg.density = fogBase / (1 + Math.max(0, cam.position.y - 8) / 16);
  };
  void coral; void barril; void signTexture;
}

const mundoXYZ = (id: string, x: number, z: number, y: number) => { const v = mundo(id, x, z, y); return { x: v.x, y: v.y, z: v.z }; };

/** silhueta escura com o nome embaixo (até o mestre mandar a imagem do NPC) */
function silhuetaPng(nome: string) {
  const c = document.createElement('canvas'); c.width = 160; c.height = 320; const g = c.getContext('2d')!;
  g.fillStyle = '#1e1a17'; g.beginPath(); g.arc(80, 62, 34, 0, 7); g.fill();
  g.beginPath(); g.moveTo(20, 300); g.quadraticCurveTo(22, 120, 80, 112); g.quadraticCurveTo(138, 120, 140, 300); g.closePath(); g.fill();
  g.strokeStyle = '#c9a45c88'; g.lineWidth = 3; g.stroke();
  void nome; return c.toDataURL('image/png');
}

/** cartaz de procurado em papel envelhecido (com a imagem enviada pelo mestre, se houver) */
function cartaz(nome: string, premio: string, img?: string) {
  const c = document.createElement('canvas'); c.width = 480; c.height = 660; const g = c.getContext('2d')!;
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  const desenhar = (im?: HTMLImageElement) => {
    const gr = g.createRadialGradient(240, 330, 60, 240, 330, 420); gr.addColorStop(0, '#d8c8a2'); gr.addColorStop(1, '#8a7650'); g.fillStyle = gr; g.fillRect(0, 0, 480, 660);
    g.fillStyle = '#2a1a10'; g.textAlign = 'center'; g.font = 'bold 74px Georgia, serif'; g.fillText('PROCURADO', 240, 92);
    g.font = 'italic 24px Georgia, serif'; g.fillText('por ordem do Pretor de Lomatubar', 240, 128);
    g.fillStyle = '#3a2a1a'; g.fillRect(70, 150, 340, 320);
    if (im) { const r = Math.min(336 / im.width, 316 / im.height), w = im.width * r, h = im.height * r; g.drawImage(im, 240 - w / 2, 310 - h / 2, w, h); }
    else { g.fillStyle = '#1a120c'; g.beginPath(); g.arc(240, 270, 62, 0, 7); g.fill(); g.fillRect(150, 340, 180, 130); g.fillStyle = '#8a7650'; g.font = 'bold 90px Georgia'; g.fillText('?', 240, 300); }
    g.fillStyle = '#2a1a10'; g.font = 'bold 34px Georgia, serif'; g.fillText(nome, 240, 520);
    g.font = '26px Georgia, serif'; g.fillText('Recompensa: ' + premio, 240, 566);
    for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(60,40,20,${Math.random() * 0.12})`; g.fillRect(Math.random() * 480, Math.random() * 660, 2 + Math.random() * 8, 2 + Math.random() * 8); }
    t.needsUpdate = true;
  };
  desenhar();
  if (img) { const im = new Image(); im.onload = () => desenhar(im); im.src = img; }
  return t;
}
function aviso(titulo: string, linhas: string[]) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 660; const g = c.getContext('2d')!;
  g.fillStyle = '#d6c8a6'; g.fillRect(0, 0, 512, 660); g.strokeStyle = '#5a1420'; g.lineWidth = 10; g.strokeRect(18, 18, 476, 624);
  g.fillStyle = '#5a1420'; g.textAlign = 'center'; g.font = 'bold 38px Georgia, serif'; g.fillText(titulo, 256, 90);
  g.fillStyle = '#2a1a10'; g.font = '26px Georgia, serif'; linhas.forEach((l, i) => g.fillText(l, 256, 170 + i * 46));
  g.fillStyle = '#7a1a20'; g.beginPath(); g.arc(256, 560, 40, 0, 7); g.fill();
  for (let i = 0; i < 200; i++) { g.fillStyle = `rgba(60,40,20,${Math.random() * 0.1})`; g.fillRect(Math.random() * 512, Math.random() * 660, 3 + Math.random() * 7, 3 + Math.random() * 7); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
