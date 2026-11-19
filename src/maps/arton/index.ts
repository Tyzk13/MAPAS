// Mapa: Sul de Arton (Tormenta 20) — mapa regional de mesa em relevo: Uivantes, Floresta de Tollon, Lomatubar,
// parte de Deheon, costa oeste (Nova Malpetrim) e o Mar Negro com suas ilhas. Miniaturas de cada povo, fronteiras
// que brilham, alfinetes, nomes, rotas com distância, moldura de pergaminho sobre a mesa. Barud abre o mapa
// detalhado da cidade; os lugares com interior ficam em "cenas de bolso" longe da mesa (interiores.ts).
import * as THREE from 'three';
import type { MapRuntime, View, LocalInfo } from '../../core/types';
import { begin, halo, mistTex } from '../../core/kit';
import { S, cam, ctl } from '../../core/engine';
import { sun, fatorLuzes, aplicarLuzes, PRE } from '../../core/sky';
import { st } from '../../core/state';
import { mapHooks } from '../../core/maps';
import { CFG } from '../../core/config';
import { type P, W, Y, Ysolo, LUGARES, LIM, KM_POR_UNIDADE, UIVANTES, TOLLON, LOMATUBAR, DEHEON, PANTANO, TAIGAS, lugar } from './geo';
import { construirRelevo, construirMar, construirAguasEcaminhos, construirFronteiras, construirMoldura, tempo } from './terreno';
import { construirMiniaturas } from './miniaturas';
import { construirNatureza } from './natureza';
import { construirSimbolos, altPino } from './simbolos';
import { FICHAS } from './dados';
import { construirInteriores, dentroDeInterior } from './interiores';

const Q = CFG.quality;
const P3 = (v: THREE.Vector3 | number[]) => (Array.isArray(v) ? v : [v.x, v.y, v.z]).map(n => +(+n).toFixed(2)) as [number, number, number];
/** câmera olhando um alvo: distância, elevação (graus) e azimute (0 = do sul, 90 = do leste) */
function vistaDe(n: string, x: number, z: number, dist: number, el = 32, az = 25, fov = 50, alt = 1.5): View {
  const y = Ysolo(x, z) + alt, e = THREE.MathUtils.degToRad(el), a = THREE.MathUtils.degToRad(az);
  return { n, p: P3([x + Math.sin(a) * Math.cos(e) * dist, y + Math.sin(e) * dist, z + Math.cos(a) * Math.cos(e) * dist]), t: P3([x, y, z]), fov };
}
const bbox = (P: P[]): [number, number, number, number] => { let a = 1e9, b = -1e9, c = 1e9, d = -1e9; for (const [x, z] of P) { a = Math.min(a, x); b = Math.max(b, x); c = Math.min(c, z); d = Math.max(d, z); } return [a, b, c, d]; };

// câmera: este mapa é grande (vê até 2600 unidades e não deixa a câmera passar para baixo da mesa)
let gancho = false;
function ganchoCamera() {
  if (gancho) return; gancho = true;
  mapHooks.push(M => { const g = M.id === 'arton'; cam.near = g ? 0.3 : 0.1; cam.far = g ? 2600 : 700; cam.updateProjectionMatrix(); ctl.maxPolarAngle = g ? 1.42 : 1.78; });
}

export async function build(M: MapRuntime) {
  begin(M, 51); ganchoCamera();
  // a mesa (mapa regional) e as cenas de bolso (interiores) ficam em grupos separados: só um aparece de cada vez
  const G = M.G, mesa = new THREE.Group(), cenas = new THREE.Group(); mesa.name = 'Mesa'; cenas.name = 'Cenas de bolso'; cenas.visible = false; G.add(mesa, cenas);

  // ---------- terreno, água, caminhos, fronteiras, moldura ----------
  const { colisores } = construirRelevo(mesa);
  construirMar(mesa);
  construirAguasEcaminhos(mesa);
  const fronteiras = construirFronteiras(mesa);
  construirMoldura(mesa);
  const mini = construirMiniaturas(mesa, M);
  const nat = construirNatureza(mesa, M);
  const sim = construirSimbolos(mesa);
  const inter = construirInteriores(cenas, M);

  // ---------- auréolas (janelas, faróis, magia) ----------
  for (const [x, y, z, s] of mini.halos) halo(x, y, z, s);
  for (const [x, y, z, s] of inter.halos) halo(x, y, z, s);

  // ---------- luzes: um punhado de PointLights vai para as luzes pedidas mais perto da câmera ----------
  const LUZES = [...mini.luzes, ...inter.luzes];
  const pool = Array.from({ length: Q === 'alta' ? 14 : Q === 'media' ? 10 : 6 }, () => { const l = new THREE.PointLight(0xffffff, 0, 0, 2); G.add(l); return l; });
  const alvo: (typeof LUZES[number] | null)[] = [];
  const escolher = () => {
    // dentro (fogo de lareira, velas, tochas) a luz não depende do clima
    const c = cam.position, f = dentroDeInterior(c) ? 1 : fatorLuzes();
    const l = LUZES.map(r => ({ r, s: Math.hypot(r.x - c.x, (r.y - c.y) * 1.3, r.z - c.z) })).sort((a, b) => a.s - b.s).slice(0, pool.length);
    pool.forEach((pl, i) => { const r = l[i]?.r ?? null; alvo[i] = r; if (!r || l[i].s > r.dist * 6) { pl.intensity = 0; alvo[i] = null; return; } pl.position.set(r.x, r.y, r.z); pl.color.setHex(r.cor); pl.distance = r.dist * 1.6; pl.intensity = r.n * f; });
  };
  escolher();
  let ult = -1; const posEsc = new THREE.Vector3(1e9, 0, 0);

  // ---------- fumaça das chaminés ----------
  const cham = mini.fumaca.slice(0, Q === 'alta' ? 160 : Q === 'media' ? 100 : 50), NP = 6;
  const fum = new THREE.BufferGeometry(), fp = new Float32Array(cham.length * NP * 3), fs = new Float32Array(cham.length * NP);
  fum.setAttribute('position', new THREE.BufferAttribute(fp, 3)); fum.setAttribute('size', new THREE.BufferAttribute(fs, 1));
  const fumMat = new THREE.ShaderMaterial({
    uniforms: { map: { value: mistTex() }, uScale: { value: 400 }, uCor: { value: new THREE.Color(0x6a6662) } },
    vertexShader: 'attribute float size; uniform float uScale; varying float vA; void main(){ vec4 mv = modelViewMatrix*vec4(position,1.0); gl_PointSize = size*uScale/-mv.z; vA = clamp(1.0 - size/2.6, 0.0, 1.0); gl_Position = projectionMatrix*mv; }',
    fragmentShader: 'uniform sampler2D map; uniform vec3 uCor; varying float vA; void main(){ vec4 c = texture2D(map, gl_PointCoord); gl_FragColor = vec4(uCor, c.a * 0.6 * vA); }',
    transparent: true, depthWrite: false,
  });
  const fumPts = new THREE.Points(fum, fumMat); fumPts.frustumCulled = false; fumPts.userData.ns = 1; fumPts.userData.noExport = 1; mesa.add(fumPts);
  fumPts.onBeforeRender = r => { fumMat.uniforms.uScale.value = r.getDrawingBufferSize(new THREE.Vector2()).y / (2 * Math.tan(THREE.MathUtils.degToRad(cam.fov) / 2)); };
  const fase = cham.map((_c, i) => (i * 0.618) % 1 * 10);

  // ---------- névoa presa nos vales, na mata e no pântano ----------
  const mist: THREE.Sprite[] = [];
  const nevoa = (x: number, z: number, esc: number, cor = 0xc8ccd4, op = 0.12) => { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: mistTex(), color: cor, transparent: true, depthWrite: false, opacity: op })); sp.scale.set(esc, esc * 0.3, 1); sp.position.set(x, Ysolo(x, z) + esc * 0.07 + 0.5, z); sp.userData = { x0: x, v: 0.5 + Math.random(), op, ns: 1, noExport: 1 }; mesa.add(sp); mist.push(sp); M.mist.push(sp); };
  const [tx0, tx1, tz0, tz1] = bbox(TOLLON); for (let i = 0; i < (Q === 'baixa' ? 5 : 10); i++) nevoa(tx0 + Math.random() * (tx1 - tx0), tz0 + Math.random() * (tz1 - tz0), 26 + Math.random() * 18, 0xb8c4bc, 0.16);
  TAIGAS.forEach(t => nevoa(t.x, t.z, 22, 0xdce8f4, 0.14));
  for (let i = 0; i < 4; i++) nevoa(PANTANO.x + (Math.random() - 0.5) * 14, PANTANO.z + (Math.random() - 0.5) * 14, 16, 0xa8b0a0, 0.18);
  for (let i = 0; i < (Q === 'baixa' ? 4 : 8); i++) { const [x, z] = W(60 + i * (Q === 'baixa' ? 200 : 100), 1215 + Math.random() * 40); nevoa(x, z + 6, 30, 0xc0ccd0, 0.1); }

  // ---------- vistas ----------
  const vistas: View[] = [
    { n: 'Visão do Mestre (50°)', p: [0, 414, 357], t: [0, 0, 10], fov: 50 },
    { n: 'Tática (de cima)', p: [0, 760, 0.1], t: [0, 0, 0], fov: 50 },
    vistaDe('Uivantes', ...W(400, 770), 190, 32, 20, 50, 10), vistaDe('Floresta de Tollon', ...W(340, 1130), 95, 36, 25, 50, 3),
    vistaDe('Lomatubar', ...W(540, 1185), 110, 34, 10), vistaDe('Deheon', ...W(720, 1000), 125, 34, -20), vistaDe('Costa Oeste', ...W(160, 1080), 115, 34, 15),
    vistaDe('Mar Negro', ...W(450, 1430), 150, 26, 0, 50, 0), vistaDe('Ilha Grande', ...W(640, 1385), 62, 30, 20, 50, 4),
  ];
  const DIST: Record<string, number> = { giluk: 42, valkaria: 62, tiberus: 46, barud: 30, malpetrim: 34, catedral: 34, beluhga: 44, nimbarann: 24, asidon: 18, korl: 15, velha: 22, azazel: 24, zolkan: 18, covariel: 18, ancora: 13, centauros: 20, kobolds: 26, pantano: 30, boasorte: 22, pescadores: 22, ilhasul: 30, porto: 24 };
  const AZ: Record<string, number> = { malpetrim: 0, velha: 10, catedral: 35, beluhga: 200, giluk: 10, tiberus: 30 };
  for (const l of LUGARES) if (l.rot && l.tipo !== 'nada' || ['pantano', 'boasorte'].includes(l.id)) vistas.push(vistaDe(l.n, l.x, l.z, DIST[l.id] ?? 15, 30, AZ[l.id] ?? 25, 50, l.id === 'valkaria' ? 8 : l.id === 'beluhga' ? 0 : 1.5));
  vistas.push(...inter.vistas);
  const unicas = new Map<string, View>(); vistas.forEach(v => { if (!unicas.has(v.n)) unicas.set(v.n, v); });
  M.views = [...unicas.values()];

  // ---------- fichas do mestre ----------
  const areaReg: Record<string, [number, number, number, number]> = {
    'reg-uivantes': bbox(UIVANTES), 'reg-tollon': bbox(TOLLON), 'reg-lomatubar': bbox(LOMATUBAR), 'reg-deheon': bbox(DEHEON),
    'reg-oeste': [LIM.x0, -95, -100, 95], 'reg-mar': [LIM.x0, LIM.x1, 120, LIM.z1],
  };
  const marcaReg: Record<string, P> = { 'reg-uivantes': W(400, 760), 'reg-tollon': W(340, 1120), 'reg-lomatubar': W(545, 1205), 'reg-deheon': W(760, 1070), 'reg-oeste': W(95, 1040), 'reg-mar': W(330, 1430) };
  M.locais = FICHAS.map(fi => {
    const l = LUGARES.find(q => q.id === fi.id), id = fi.id === 'pescadores' ? 'pescadores' : fi.id;
    if (l) { const r = ['valkaria', 'giluk', 'tiberus'].includes(id) ? 16 : ['barud', 'malpetrim', 'kobolds', 'pantano'].includes(id) ? 9 : 5; return { ...fi, area: [l.x - r, l.x + r, l.z - r, l.z + r], marca: [l.x, Ysolo(l.x, l.z) + (l.pin ? altPino(l.id) + 6 : 4), l.z] } as LocalInfo; }
    const m = marcaReg[fi.id]; return { ...fi, area: areaReg[fi.id], marca: m ? [m[0], Math.max(8, Y(m[0], m[1]) + 6), m[1]] : undefined } as LocalInfo;
  });
  M.notas = {}; for (const fi of FICHAS) { const t = `${fi.tipo.toUpperCase()} — ${fi.dono}\n${fi.publico}\n(Ficha completa: botão Locais)`; M.notas[fi.vista] = t; if (fi.dentro) M.notas[fi.dentro] = t; }
  // distâncias (painel Locais, régua ao arrastar personagens)
  M.medida = (d: number) => { const km = d * KM_POR_UNIDADE; return `${Math.round(km)} km · ${Math.max(1, Math.round(km / 30))} dia(s) a pé · ${Math.max(1, Math.round(km / 50))} a cavalo`; };

  // ---------- caminhar, personagens, VTT ----------
  M.walk.push(...colisores, ...inter.pisos);
  const solidos = [...inter.solidos]; M.solid = () => solidos;
  const br = lugar('barud');
  M.spawn = i => ({ x: br.x - 1.2 + (i % 3) * 1.2, z: br.z + 9.5 + Math.floor(i / 3) * 1.2, y: Ysolo(br.x, br.z + 9.5) });
  M.walkStart = { x: br.x, z: br.z + 10 };
  M.walkLimit = 280; M.camMax = 900; M.fogScale = 0.09; M.shadowRadius = 360;
  M.layers = [
    { n: 'Nomes', o: sim.nomes, v: true }, { n: 'Alfinetes', o: sim.alfinetes, v: true }, { n: 'Fronteiras', o: fronteiras, v: true },
    { n: 'Rotas de viagem', o: sim.rotas, v: true }, { n: 'Marcos de altitude', o: sim.marcos, v: true },
  ];
  M.vtt = {
    areas: [{ n: 'Sul de Arton (inteiro)', b: [LIM.x0, LIM.x1, LIM.z0, LIM.z1], lv: 1 }, ...(['reg-uivantes', 'reg-tollon', 'reg-lomatubar', 'reg-deheon'] as const).map(k => ({ n: FICHAS.find(f => f.id === k)!.n, b: areaReg[k], lv: 1 })), ...inter.areasVtt],
    walls: inter.paredesVtt, portals: [], lights: [],
  };
  M.exportHide = () => [sim.nomes, sim.alfinetes, sim.rotas, fronteiras];

  // ---------- clima ----------
  const preenche = new THREE.HemisphereLight(0x9aa8c8, 0x2a2622, 0); preenche.userData.noExport = 1; G.add(preenche);
  let solBase = 1, estavaDentro = false;
  M.onTime = p => {
    // sol bem longe: a câmera de sombra cobre o mapa inteiro (sombras longas das montanhas)
    sun.position.normalize().multiplyScalar(720); sun.target.position.set(0, 0, 0); solBase = p.si; if (estavaDentro) { sun.intensity = 0; M.halos.forEach(h => (h.material.opacity = 0.22)); }
    preenche.intensity = p.n === 'Noite' ? 2.4 : p.bg < 0.1 ? 1.7 : p.bg < 0.25 ? 0.7 : p.bg < 0.4 ? 0.5 : 0.25;
    preenche.color.setHex(p.n === 'Noite' ? 0x8a9ad8 : 0xb0b4bc);
    mist.forEach(m => (m.material.opacity = m.userData.op));
    escolher();
  };

  // ---------- nomes e placas: tamanho acompanha a distância (legíveis de longe, discretos de perto) ----------
  const sprites: THREE.Sprite[] = []; [sim.nomes, sim.rotas].forEach(g => g.traverse((o: any) => { if (o.isSprite && o.userData.base) sprites.push(o); }));
  const ajustarNomes = (dentro: boolean) => {
    for (const s of sprites) {
      if (dentro) { s.visible = false; continue; }
      const d = s.position.distanceTo(cam.position), u = s.userData;
      if (u.reg) { const op = Math.min(1, Math.max(0, (d - 95) / 60)); s.material.opacity = op; s.visible = op > 0.01; continue; }
      const hh = Math.min(u.base * 1.2, Math.max(0.5, d * 0.013)); s.scale.set(hh * u.asp, hh, 1); s.visible = true;
    }
  };
  // ---------- animação ----------
  const fogo = new THREE.Vector3();
  M.tick = (dt, t) => {
    // teleporte: entre a mesa e uma cena de bolso a câmera corta direto (sem voar pelo vazio debaixo da mesa)
    const an = st.anim; if (an && (an.tp.y < -60) !== (ctl.target.y < -60)) { cam.position.copy(an.cp); ctl.target.copy(an.tp); st.anim = null; ctl.update(); }
    tempo.value = t; ajustarNomes(dentroDeInterior(cam.position));
    if (Math.floor(t * 3) !== ult || cam.position.distanceToSquared(posEsc) > 25) { ult = Math.floor(t * 3); posEsc.copy(cam.position); escolher(); }
    const f = estavaDentro ? 1 : fatorLuzes();
    if (f) pool.forEach((pl, k) => { const r = alvo[k]; if (r && pl.intensity > 0) pl.intensity = r.n * f * (0.86 + 0.14 * Math.sin(t * 11 + k * 7) * Math.sin(t * 6.3 + k)); });
    M.lamps.forEach((m, i) => { const b = m.userData.base; if (b && f) m.color.copy(b).multiplyScalar(f * (0.88 + 0.12 * Math.sin(t * 8 + i * 2.1))); });
    nat.anim.forEach(a => a(t)); inter.anim.forEach(a => a(t));
    cham.forEach((c, i) => { for (let k = 0; k < NP; k++) { const u = (t * 0.1 + fase[i] + k / NP) % 1, j = i * NP + k; fp[j * 3] = c.x + u * 1.2 + Math.sin(t * 0.6 + k) * 0.15; fp[j * 3 + 1] = c.y + u * 3.2; fp[j * 3 + 2] = c.z + u * 0.5; fs[j] = 0.45 + u * 2.1; } });
    fum.attributes.position.needsUpdate = true; (fum.attributes.size as THREE.BufferAttribute).needsUpdate = true;
    mist.forEach(m => { m.position.x = m.userData.x0 + Math.sin(t * 0.03 * m.userData.v) * 5; });
    // dentro das cenas de bolso não há sol (ficam longe da mesa)
    // dentro das cenas de bolso não há sol nem o preenchimento do céu (só muda na troca, para não apagar os relâmpagos)
    const dentro = dentroDeInterior(cam.position); if (dentro !== estavaDentro) { estavaDentro = dentro; sun.intensity = dentro ? 0 : solBase; sun.castShadow = !dentro; preenche.visible = !dentro; mesa.visible = !dentro; cenas.visible = dentro; if (dentro) M.halos.forEach(h => (h.material.opacity = 0.22)); else aplicarLuzes(undefined, true); escolher(); }
    // na mesa a câmera não desce abaixo do horizonte (não vê embaixo da mesa); nos interiores pode olhar reto
    ctl.maxPolarAngle = ctl.target.y < -60 ? 1.78 : 1.42;
    void fogo; void S; void PRE;
  };
}
