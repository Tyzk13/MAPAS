// Kit de interiores de Greywater Falls (hotel e necrotério): paredes internas com vãos, papel de parede com
// lambri, móveis em código (cama, cômoda, cadeira, mesa, aquecedor, abajur) e documentos legíveis (canvas).
import * as THREE from 'three';
import { pbr } from '../../core/pbr';
import { Batch, mtx, rnd, TM, bxM } from './common';

export interface Interior { docs: { o: THREE.Object3D; n: string }[]; solids: THREE.Object3D[]; floors: THREE.Object3D[]; roofs: THREE.Group; vttWalls: [number, number][][]; portals: { p: [number, number]; a: [number, number]; b: [number, number] }[]; lamps: THREE.MeshBasicMaterial[]; layers: { n: string; o: THREE.Object3D; v: boolean }[] }

type G2 = CanvasRenderingContext2D;
export const canvasTex = (w: number, h: number, draw: (g: G2) => void, repeat = false) => {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d')!);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
};

let _mt: ReturnType<typeof makeMats> | null = null;
function makeMats() {
  // papel de parede listrado com florzinhas (claro; a cor vem do vértice) — 1 repetição por metro
  const wp = canvasTex(256, 256, g => {
    g.fillStyle = '#f2ece0'; g.fillRect(0, 0, 256, 256);
    for (let x = 0; x < 256; x += 64) { g.fillStyle = 'rgba(90,70,50,0.16)'; g.fillRect(x, 0, 22, 256); g.fillStyle = 'rgba(90,70,50,0.08)'; g.fillRect(x + 26, 0, 4, 256); }
    for (let y = 16; y < 256; y += 64) for (let x = 43; x < 256; x += 64) { g.fillStyle = 'rgba(120,60,50,0.22)'; g.beginPath(); for (let k = 0; k < 5; k++) { const a = k / 5 * 6.283; g.ellipse(x + Math.cos(a) * 4, y + 16 + Math.sin(a) * 4, 3.5, 2, a, 0, 7); } g.fill(); }
    for (let i = 0; i < 1500; i++) { g.fillStyle = `rgba(${rnd() < 0.5 ? '80,60,30' : '255,250,240'},${rnd() * 0.06})`; g.fillRect(rnd() * 256, rnd() * 256, 2, 2); }
  }, true);
  // linóleo xadrez (necrotério, cozinha, banheiro)
  const lino = canvasTex(256, 256, g => { for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { g.fillStyle = (x + y) % 2 ? '#d8d4c8' : '#3a3c3a'; g.fillRect(x * 32, y * 32, 32, 32); } for (let i = 0; i < 2500; i++) { g.fillStyle = `rgba(${rnd() < 0.5 ? '40,30,20' : '255,255,245'},${rnd() * 0.08})`; g.fillRect(rnd() * 256, rnd() * 256, 3, 3); } }, true);
  lino.repeat.set(0.5, 0.5);
  // azulejo branco (paredes do necrotério e banheiro)
  const tile = canvasTex(256, 256, g => { g.fillStyle = '#9a9a92'; g.fillRect(0, 0, 256, 256); for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { g.fillStyle = `rgb(${226 + rnd() * 12},${226 + rnd() * 10},${214 + rnd() * 10})`; g.fillRect(x * 32 + 1.5, y * 32 + 1.5, 29, 29); } for (let i = 0; i < 300; i++) { g.fillStyle = `rgba(110,90,50,${rnd() * 0.12})`; g.fillRect(rnd() * 256, rnd() * 256, 2 + rnd() * 10, 2 + rnd() * 30); } }, true);
  const paper = new THREE.MeshStandardMaterial({ map: wp, vertexColors: true, roughness: 0.85, envMapIntensity: 0.4 });
  const linoM = new THREE.MeshStandardMaterial({ map: lino, roughness: 0.4, envMapIntensity: 0.6 });
  const tileM = new THREE.MeshStandardMaterial({ map: tile, vertexColors: true, roughness: 0.25, envMapIntensity: 0.7 });
  return {
    paper, lino: linoM, tile: tileM,
    stone: pbr('monastery_stone_floor', { size: 2.2, color: 0xb8b0a0, envMapIntensity: 0.6 }),
    carpet: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, envMapIntensity: 0.2 }),
    cloth: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, envMapIntensity: 0.3 }),
    steel: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.3, metalness: 0.85, envMapIntensity: 1.0 }),
    brass: new THREE.MeshStandardMaterial({ color: 0xb08a3a, roughness: 0.35, metalness: 0.9, envMapIntensity: 1.0, vertexColors: true }),
    mirror: new THREE.MeshStandardMaterial({ color: 0x8a9094, roughness: 0.04, metalness: 1, envMapIntensity: 1.4 }),
    bottle: new THREE.MeshStandardMaterial({ color: 0x1e3a22, roughness: 0.1, metalness: 0.2, envMapIntensity: 1.2, transparent: true, opacity: 0.85 }),
    ice: new THREE.MeshStandardMaterial({ color: 0xc8dce4, roughness: 0.15, metalness: 0, envMapIntensity: 1.2, transparent: true, opacity: 0.7 }),
  };
}
export const IM = () => (_mt ||= makeMats());

/**
 * Construtor de interior: paredes internas e móveis num lote, em coordenadas do mundo.
 * `wallZ`: parede ao longo de z em x fixo; `wallX`: ao longo de x em z fixo; vãos = [centro, largura, altura].
 */
export class Kit {
  B: Batch; D: Batch; F: Batch;
  constructor(public G: THREE.Object3D, name: string, public IT = 0.14) { this.B = new Batch(name + '-paredes'); this.D = new Batch(name + '-moveis'); this.F = new Batch(name + '-piso'); }
  /** parede com papel e lambri de madeira (lambri = altura; 0 = sem) */
  private seg(along: 'x' | 'z', fixed: number, a: number, b: number, y: number, h: number, col: number, mat: THREE.Material, lambri: number, lambriCol: number) {
    const len = b - a; if (len <= 0.02) return;
    const c = (a + b) / 2, m = TM();
    if (along === 'z') { this.B.box(mat, this.IT, h, len, fixed, y + h / 2, c, col); if (lambri) this.B.box(m.woodDark, this.IT + 0.04, lambri, len, fixed, y + lambri / 2, c, lambriCol); }
    else { this.B.box(mat, len, h, this.IT, c, y + h / 2, fixed, col); if (lambri) this.B.box(m.woodDark, len, lambri, this.IT + 0.04, c, y + lambri / 2, fixed, lambriCol); }
  }
  wall(along: 'x' | 'z', fixed: number, a: number, b: number, y: number, h: number, gaps: [number, number, number][] = [], o: { col?: number; mat?: THREE.Material; lambri?: number; lambriCol?: number; frame?: number } = {}) {
    const col = o.col ?? 0xe0d4bc, mat = o.mat ?? IM().paper, lam = o.lambri ?? 0.95, lc = o.lambriCol ?? 0x5a3e2a;
    const gs = gaps.slice().sort((p, q) => p[0] - q[0]); let t = a;
    for (const [gc, gw, gh] of gs) {
      this.seg(along, fixed, t, gc - gw / 2, y, h, col, mat, lam, lc);
      if (gh < h) this.seg(along, fixed, gc - gw / 2, gc + gw / 2, y + gh, h - gh, col, mat, 0, lc);
      // batente
      const fc = o.frame ?? 0x3a2a1e, m = TM();
      if (along === 'z') { [-1, 1].forEach(s => this.D.box(m.woodDark, this.IT + 0.06, gh, 0.08, fixed, y + gh / 2, gc + s * (gw / 2 + 0.04), fc)); this.D.box(m.woodDark, this.IT + 0.06, 0.1, gw + 0.16, fixed, y + gh + 0.05, gc, fc); }
      else { [-1, 1].forEach(s => this.D.box(m.woodDark, 0.08, gh, this.IT + 0.06, gc + s * (gw / 2 + 0.04), y + gh / 2, fixed, fc)); this.D.box(m.woodDark, gw + 0.16, 0.1, this.IT + 0.06, gc, y + gh + 0.05, fixed, fc); }
      t = gc + gw / 2;
    }
    this.seg(along, fixed, t, b, y, h, col, mat, lam, lc);
  }
  /** porta entreaberta (folha girada) num vão; ry = ângulo da folha; hinge = ponto da dobradiça */
  door(hx: number, y: number, hz: number, ry: number, w = 0.9, h = 2.1, col = 0x4a3222, num?: string) {
    const M = mtx(hx, y, hz, ry);
    bxM(this.D, TM().woodDark, w, h, 0.05, w / 2, h / 2, 0, col, M);
    bxM(this.D, IM().brass, 0.08, 0.08, 0.12, w - 0.1, 1.0, 0, 0xffffff, M);
    if (num) { const p = new THREE.Vector3(w / 2, 1.62, -0.04).applyMatrix4(M); const s = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.09), new THREE.MeshStandardMaterial({ map: canvasTex(128, 56, g => { g.fillStyle = '#b08a3a'; g.fillRect(0, 0, 128, 56); g.fillStyle = '#2a1e10'; g.font = 'bold 40px Georgia'; g.textAlign = 'center'; g.fillText(num, 64, 42); }), roughness: 0.4, metalness: 0.6 })); s.position.copy(p); s.rotation.y = ry + Math.PI; s.userData.ns = 1; this.G.add(s); }
  }
  // ---------- móveis (M = referencial: frente do móvel = +z local) ----------
  bed(M: THREE.Matrix4, o: { blanket?: number; messy?: boolean; w?: number } = {}) {
    const m = TM(), I = IM(), w = o.w ?? 1.4, bl = o.blanket ?? 0x6a2a2a;
    bxM(this.D, m.woodDark, w, 1.15, 0.07, 0, 0.58, 0.04, 0x3a2618, M);            // cabeceira
    bxM(this.D, m.woodDark, w, 0.7, 0.06, 0, 0.35, 2.05, 0x3a2618, M);             // pés
    bxM(this.D, m.woodDark, w, 0.18, 2.0, 0, 0.3, 1.05, 0x3a2618, M);              // estrado
    bxM(this.D, I.cloth, w - 0.06, 0.2, 1.94, 0, 0.49, 1.05, 0xe8e2d6, M);         // colchão
    bxM(this.D, I.cloth, w * 0.36, 0.12, 0.42, -w * 0.22, 0.65, 0.32, 0xf0ece4, M); // travesseiros
    bxM(this.D, I.cloth, w * 0.36, 0.12, 0.42, w * 0.22, 0.65, 0.32, 0xf0ece4, M);
    if (o.messy) { bxM(this.D, I.cloth, w + 0.02, 0.06, 1.2, 0.1, 0.62, 1.3, bl, M, 0.08, 0.06); bxM(this.D, I.cloth, 0.9, 0.05, 0.6, -0.4, 0.6, 2.3, bl, M, 0, 0.9); }
    else { bxM(this.D, I.cloth, w + 0.04, 0.05, 1.45, 0, 0.61, 1.3, bl, M); bxM(this.D, I.cloth, w + 0.06, 0.4, 0.03, 0, 0.42, 2.03, bl, M); [-1, 1].forEach(s => bxM(this.D, I.cloth, 0.03, 0.4, 1.45, s * (w / 2 + 0.02), 0.42, 1.3, bl, M)); }
  }
  nightstand(M: THREE.Matrix4, lamp = true) {
    const m = TM();
    bxM(this.D, m.woodDark, 0.45, 0.6, 0.4, 0, 0.3, 0, 0x4a3020, M);
    bxM(this.D, m.woodDark, 0.4, 0.12, 0.02, 0, 0.45, 0.205, 0x3a2418, M);
    if (lamp) this.lamp(M, 0, 0.6, 0);
  }
  lamp(M: THREE.Matrix4, x: number, y: number, z: number) {
    const g = new THREE.CylinderGeometry(0.06, 0.08, 0.3, 8); g.translate(x, y + 0.15, z); g.applyMatrix4(M); this.D.add(IM().brass, g, 0xffffff);
    const s = new THREE.CylinderGeometry(0.11, 0.17, 0.2, 10, 1, true); s.translate(x, y + 0.38, z); s.applyMatrix4(M); this.D.add(TM().lit, s, 0xffffff);
  }
  dresser(M: THREE.Matrix4, mirror = true, col = 0x4a3020) {
    const m = TM();
    bxM(this.D, m.woodDark, 1.2, 0.85, 0.5, 0, 0.43, 0.25, col, M);
    for (let i = 0; i < 3; i++) { bxM(this.D, m.woodDark, 1.1, 0.22, 0.02, 0, 0.18 + i * 0.25, 0.51, 0x3a2418, M); bxM(this.D, IM().brass, 0.12, 0.03, 0.03, 0, 0.18 + i * 0.25, 0.53, 0xffffff, M); }
    if (mirror) { bxM(this.D, m.woodDark, 0.8, 0.9, 0.04, 0, 1.35, 0.04, col, M); bxM(this.D, IM().mirror as unknown as THREE.Material, 0.68, 0.78, 0.02, 0, 1.35, 0.065, 0xffffff, M); }
  }
  chair(M: THREE.Matrix4, col = 0x4a3020, seat = 0x6a3a2a) {
    const m = TM();
    [[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]].forEach(([x, z]) => bxM(this.D, m.woodDark, 0.04, 0.45, 0.04, x, 0.225, z, col, M));
    bxM(this.D, IM().cloth, 0.46, 0.06, 0.46, 0, 0.47, 0, seat, M);
    bxM(this.D, m.woodDark, 0.44, 0.5, 0.04, 0, 0.75, -0.21, col, M);
  }
  armchair(M: THREE.Matrix4, col = 0x5a3a30) {
    const I = IM();
    bxM(this.D, I.cloth, 0.8, 0.42, 0.75, 0, 0.21, 0, col, M); bxM(this.D, I.cloth, 0.8, 0.6, 0.18, 0, 0.7, -0.3, col, M);
    [-1, 1].forEach(s => bxM(this.D, I.cloth, 0.14, 0.25, 0.7, s * 0.36, 0.55, 0, col, M));
  }
  table(M: THREE.Matrix4, w: number, d: number, h = 0.76, col = 0x4a3020, cloth?: number) {
    const m = TM();
    bxM(this.D, m.woodDark, w, 0.05, d, 0, h - 0.025, 0, col, M);
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => bxM(this.D, m.woodDark, 0.05, h - 0.05, 0.05, a * (w / 2 - 0.06), (h - 0.05) / 2, b * (d / 2 - 0.06), col, M));
    if (cloth !== undefined) { bxM(this.D, IM().cloth, w + 0.1, 0.01, d + 0.1, 0, h + 0.005, 0, cloth, M); [-1, 1].forEach(s => { bxM(this.D, IM().cloth, w + 0.1, 0.25, 0.01, 0, h - 0.12, s * (d / 2 + 0.05), cloth, M); bxM(this.D, IM().cloth, 0.01, 0.25, d + 0.1, s * (w / 2 + 0.05), h - 0.12, 0, cloth, M); }); }
  }
  radiator(M: THREE.Matrix4, w = 0.9) {
    for (let x = -w / 2; x <= w / 2; x += 0.07) bxM(this.D, IM().steel, 0.04, 0.6, 0.14, x, 0.38, 0, 0xb8b4a8, M);
    bxM(this.D, IM().steel, w, 0.04, 0.06, 0, 0.12, 0, 0x8a8478, M);
  }
  rug(M: THREE.Matrix4, w: number, d: number, col = 0x6a2a24) { bxM(this.F, IM().carpet, w, 0.012, d, 0, 0.006, 0, col, M); bxM(this.F, IM().carpet, w - 0.2, 0.014, d - 0.2, 0, 0.007, 0, new THREE.Color(col).multiplyScalar(0.7).getHex(), M); }
  bottle(M: THREE.Matrix4, x: number, y: number, z: number, lying = false) {
    const g = new THREE.CylinderGeometry(0.04, 0.04, 0.24, 8); const n = new THREE.CylinderGeometry(0.014, 0.025, 0.09, 6); n.translate(0, 0.165, 0);
    [g, n].forEach(q => { if (lying) q.rotateZ(Math.PI / 2); q.translate(x, y + (lying ? 0.04 : 0.12), z); q.applyMatrix4(M); this.D.add(IM().bottle, q, 0xffffff); });
  }
  /** figura humana coberta com lençol (sem nada à mostra): volume arredondado + pano caído dos lados */
  covered(M: THREE.Matrix4, y: number, col = 0xe8e4dc) {
    const I = IM(), add = (g: THREE.BufferGeometry) => { g.applyMatrix4(M); this.D.add(I.cloth, g, col); };
    { const g = new THREE.CapsuleGeometry(0.24, 1.15, 6, 12); g.rotateX(Math.PI / 2); g.scale(1.15, 0.5, 1); g.translate(0, y + 0.1, 1.05); add(g); }
    { const g = new THREE.SphereGeometry(0.15, 12, 8); g.scale(1, 0.75, 1.1); g.translate(0, y + 0.1, 0.12); add(g); }
    [-0.09, 0.09].forEach(x => { const g = new THREE.SphereGeometry(0.07, 8, 6); g.scale(1, 1.6, 1); g.translate(x, y + 0.14, 1.92); add(g); });
    [-1, 1].forEach(s => { const g = new THREE.BoxGeometry(0.02, 0.32, 2.0); g.rotateZ(s * 0.25); g.translate(s * 0.4, y - 0.04, 1.0); add(g); });
    { const g = new THREE.BoxGeometry(0.62, 0.3, 0.02); g.rotateX(0.3); g.translate(0, y - 0.05, 2.05); add(g); }
  }
  build(shadow = true) {
    const walls = this.B.build(this.G);
    this.D.build(this.G, { shadow });
    const floors = this.F.build(this.G, { shadow: false });
    return { walls, floors };
  }
}

/** documento em plano (ry 0 olha +z); flat = deitado sobre a mesa */
/** glow > 0: a escrita brilha de leve sozinha (marca dourada do Conhecimento) */
export function docPlane(G: THREE.Object3D, list: { o: THREE.Object3D; n: string }[], t: THREE.Texture, w: number, h: number, x: number, y: number, z: number, ry: number, name?: string, flat = false, glow = 0) {
  const mm = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: t, roughness: 0.85, envMapIntensity: 0.3, polygonOffset: true, polygonOffsetFactor: -2, transparent: true, ...(glow ? { emissive: 0xffffff, emissiveMap: t, emissiveIntensity: glow } : {}) }));
  mm.position.set(x, y, z); if (flat) mm.rotation.set(-Math.PI / 2, 0, ry); else mm.rotation.y = ry;
  mm.userData.ns = 1; mm.userData.cullDist = 40; mm.geometry.computeBoundingSphere(); G.add(mm);
  if (name) list.push({ o: mm, n: name });
  return mm;
}

/** sigilo do Conhecimento inventado para o caso: olho dentro de um livro aberto com raios (em dourado) */
export function sigilKnow(g: G2, cx: number, cy: number, r: number, color = 'rgba(214,170,60,0.9)', lw = 4) {
  g.save(); g.strokeStyle = color; g.lineWidth = lw; g.lineCap = 'round';
  g.beginPath(); g.moveTo(cx - r, cy + r * 0.35); g.quadraticCurveTo(cx - r * 0.5, cy + r * 0.1, cx, cy + r * 0.4); g.quadraticCurveTo(cx + r * 0.5, cy + r * 0.1, cx + r, cy + r * 0.35); g.stroke();
  g.beginPath(); g.moveTo(cx - r, cy + r * 0.35); g.lineTo(cx - r, cy - r * 0.1); g.quadraticCurveTo(cx - r * 0.5, cy - r * 0.35, cx, cy - r * 0.05); g.quadraticCurveTo(cx + r * 0.5, cy - r * 0.35, cx + r, cy - r * 0.1); g.lineTo(cx + r, cy + r * 0.35); g.stroke();
  g.beginPath(); g.moveTo(cx, cy - r * 0.05); g.lineTo(cx, cy + r * 0.4); g.stroke();
  g.beginPath(); g.ellipse(cx, cy - r * 0.55, r * 0.42, r * 0.2, 0, 0, 7); g.stroke();
  g.beginPath(); g.arc(cx, cy - r * 0.55, r * 0.09, 0, 7); g.fillStyle = color; g.fill();
  for (let i = 0; i < 9; i++) { const a = Math.PI + (i / 8) * Math.PI; g.beginPath(); g.moveTo(cx + Math.cos(a) * r * 0.55, cy - r * 0.55 + Math.sin(a) * r * 0.32); g.lineTo(cx + Math.cos(a) * r * 0.85, cy - r * 0.55 + Math.sin(a) * r * 0.6); g.stroke(); }
  g.restore();
}

/** caligrafia rabiscada repetida (paredes "escritas") */
export function scrawl(g: G2, text: string, w: number, h: number, color = 'rgba(200,160,60,0.55)', n = 40, size = 26) {
  g.save(); g.fillStyle = color; g.font = `italic ${size}px "Brush Script MT", "Segoe Script", cursive`;
  for (let i = 0; i < n; i++) { g.save(); g.translate(rnd() * w, rnd() * h); g.rotate((rnd() - 0.5) * 0.4); g.globalAlpha = 0.4 + rnd() * 0.6; g.fillText(text, 0, 0); g.restore(); }
  g.restore();
}
