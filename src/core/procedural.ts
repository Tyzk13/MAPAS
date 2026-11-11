// Geometrias e texturas geradas por código que não existem como asset CC0: vitrais, rosas, pétalas.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

let seed = 1;
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

/** Vitral: vidro colorido envelhecido com malha de chumbo. kind: 'lanceta' (vertical) ou 'rosa' (circular). */
export function stainedGlass(kind: 'lanceta' | 'rosa', s = 3) {
  seed = s * 97 + 13;
  const W = 256, H = kind === 'rosa' ? 256 : 640;
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d')!;
  // paleta apagada: âmbar, vinho, azul profundo, verde garrafa, creme
  const P = ['#b5873a', '#7a2a2a', '#26406b', '#2f5a45', '#d8c39a', '#8c5a2b', '#4d3a6b'];
  const pane = (path: () => void, col: string) => {
    g.save(); path(); g.clip();
    g.fillStyle = col; g.fillRect(0, 0, W, H);
    // variação dentro do vidro (bolhas, espessura)
    for (let i = 0; i < 40; i++) {
      const x = rnd() * W, y = rnd() * H, r = 6 + rnd() * 30, gr = g.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, `rgba(255,240,210,${0.05 + rnd() * 0.12})`); gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr; g.fillRect(x - r, y - r, 2 * r, 2 * r);
    }
    g.restore();
  };
  g.fillStyle = '#0d0b09'; g.fillRect(0, 0, W, H);
  g.lineJoin = 'round';
  if (kind === 'rosa') {
    const cx = W / 2, cy = H / 2;
    for (let ring = 3; ring >= 0; ring--) {
      const r0 = ring * 30, r1 = r0 + 30, n = ring === 0 ? 1 : 8 * ring;
      for (let i = 0; i < n; i++) {
        const a0 = (i / n) * Math.PI * 2, a1 = ((i + 1) / n) * Math.PI * 2;
        pane(() => { g.beginPath(); g.arc(cx, cy, r1, a0, a1); g.arc(cx, cy, r0, a1, a0, true); g.closePath(); }, P[(ring * 3 + (i % 3)) % P.length]);
      }
    }
    g.strokeStyle = '#141009'; g.lineWidth = 5;
    for (let ring = 1; ring <= 4; ring++) { g.beginPath(); g.arc(cx, cy, ring * 30, 0, 7); g.stroke(); }
    for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2; g.beginPath(); g.moveTo(cx + Math.cos(a) * 30, cy + Math.sin(a) * 30); g.lineTo(cx + Math.cos(a) * 120, cy + Math.sin(a) * 120); g.stroke(); }
  } else {
    // lanceta: borda + losangos + medalhão central
    const bw = 22;
    for (let y = 0; y < H; y += 32) {
      pane(() => { g.beginPath(); g.rect(0, y, bw, 32); }, P[(y / 32) % 2 ? 1 : 0]);
      pane(() => { g.beginPath(); g.rect(W - bw, y, bw, 32); }, P[(y / 32) % 2 ? 1 : 0]);
    }
    const cw = (W - bw * 2) / 3, ch = 46;
    for (let y = 0; y < H; y += ch) for (let x = 0; x < 3; x++) {
      const x0 = bw + x * cw, col = rnd() < 0.55 ? P[4] : P[(rnd() * P.length) | 0];
      pane(() => { g.beginPath(); g.moveTo(x0 + cw / 2, y); g.lineTo(x0 + cw, y + ch / 2); g.lineTo(x0 + cw / 2, y + ch); g.lineTo(x0, y + ch / 2); g.closePath(); }, col);
      pane(() => { g.beginPath(); g.moveTo(x0, y); g.lineTo(x0 + cw / 2, y); g.lineTo(x0, y + ch / 2); g.closePath(); }, P[2]);
    }
    const my = H * 0.42, mr = W * 0.3;
    pane(() => { g.beginPath(); g.arc(W / 2, my, mr, 0, 7); }, P[0]);
    pane(() => { g.beginPath(); g.arc(W / 2, my, mr * 0.62, 0, 7); }, P[1]);
    // cruz no medalhão
    pane(() => { g.beginPath(); g.rect(W / 2 - 8, my - mr * 0.5, 16, mr); g.rect(W / 2 - mr * 0.35, my - mr * 0.2, mr * 0.7, 16); }, P[4]);
    g.strokeStyle = '#141009'; g.lineWidth = 4;
    g.beginPath(); g.arc(W / 2, my, mr, 0, 7); g.stroke(); g.beginPath(); g.arc(W / 2, my, mr * 0.62, 0, 7); g.stroke();
    g.lineWidth = 3;
    for (let y = 0; y < H; y += ch) { g.beginPath(); g.moveTo(bw, y); g.lineTo(W - bw, y); g.stroke(); }
    g.strokeRect(bw, 0, W - 2 * bw, H);
  }
  // sujeira/escurecimento nas bordas
  const v = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.2, W / 2, H / 2, Math.max(W, H) * 0.7);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(20,14,8,0.55)'); g.fillStyle = v; g.fillRect(0, 0, W, H);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}

/** Rosa branca (~150 triângulos): pétalas curvas em 3 anéis + botão. Base em y=0, raio ~0.05 m. */
export function roseGeometry() {
  const parts: THREE.BufferGeometry[] = [];
  const petal = (len: number, wid: number, curl: number) => {
    const g = new THREE.PlaneGeometry(wid, len, 3, 3);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i) + len / 2, t = y / len;
      p.setXYZ(i, x * (1 - 0.35 * t * t), y, -curl * (x * x) * 18 - curl * t * t * 0.6);
    }
    g.computeVertexNormals(); return g;
  };
  const rings = [{ n: 5, len: 0.055, wid: 0.05, tilt: 1.05, curl: 0.03 }, { n: 5, len: 0.045, wid: 0.042, tilt: 0.7, curl: 0.04 }, { n: 4, len: 0.035, wid: 0.032, tilt: 0.35, curl: 0.05 }];
  rings.forEach((r, k) => {
    for (let i = 0; i < r.n; i++) {
      const g = petal(r.len, r.wid, r.curl);
      g.rotateX(-r.tilt); g.translate(0, 0, 0.006 * (3 - k)); g.rotateY((i / r.n) * Math.PI * 2 + k * 0.6);
      parts.push(g);
    }
  });
  const bud = new THREE.SphereGeometry(0.014, 8, 6); bud.scale(1, 1.4, 1); bud.translate(0, 0.02, 0);
  bud.deleteAttribute('uv'); parts.forEach(p => p.deleteAttribute('uv'));
  return mergeGeometries([...parts.map(p => p.toNonIndexed()), bud.toNonIndexed()]);
}

/** Folha simples (para arranjos e guirlandas). */
export function leafGeometry() {
  const g = new THREE.PlaneGeometry(0.035, 0.08, 2, 3);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i) + 0.04, t = y / 0.08; p.setXYZ(i, x * Math.sin(Math.PI * Math.min(1, t * 1.05)), y, -x * x * 8 - t * 0.015); }
  g.deleteAttribute('uv'); g.computeVertexNormals(); return g;
}

/** Pétala solta no chão. */
export function looseePetalGeometry() {
  const g = new THREE.CircleGeometry(0.03, 7); g.scale(1, 0.7, 1); g.rotateX(-Math.PI / 2);
  const p = g.attributes.position; for (let i = 0; i < p.count; i++) p.setY(i, (p.getX(i) ** 2 + p.getZ(i) ** 2) * 6);
  g.computeVertexNormals(); return g;
}

/** Pintura a óleo antiga e escura (para quadros da Via-Sacra): figuras vagas, verniz amarelado, craquelado. */
export function oldPainting(s = 1) {
  seed = s * 131 + 7;
  const W = 160, H = 200, c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d')!;
  const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#2a2016'); bg.addColorStop(0.6, '#1b140d'); bg.addColorStop(1, '#100b07');
  g.fillStyle = bg; g.fillRect(0, 0, W, H);
  // céu/arco de fundo
  g.fillStyle = 'rgba(120,96,60,0.35)'; g.beginPath(); g.arc(W / 2, H * 0.35, W * 0.42, Math.PI, 0); g.fill();
  // figuras: silhuetas alongadas
  const n = 2 + ((rnd() * 3) | 0);
  for (let i = 0; i < n; i++) {
    const x = W * (0.2 + 0.6 * (i + rnd() * 0.5) / n), h = H * (0.45 + rnd() * 0.2), w = W * 0.12;
    g.fillStyle = ['#4a2a1c', '#2c3446', '#5a4630', '#3a2018'][(rnd() * 4) | 0];
    g.beginPath(); g.ellipse(x, H - h * 0.45 - 10, w * 0.5, h * 0.42, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#8a6a4a'; g.beginPath(); g.arc(x, H - h * 0.9 - 6, w * 0.22, 0, Math.PI * 2); g.fill();
  }
  // cruz ao fundo em algumas
  if (rnd() < 0.6) { g.fillStyle = '#3a2a1a'; g.fillRect(W * 0.62, H * 0.18, 6, H * 0.5); g.fillRect(W * 0.62 - 18, H * 0.28, 42, 6); }
  // verniz amarelado e vinheta
  g.fillStyle = 'rgba(160,120,40,0.12)'; g.fillRect(0, 0, W, H);
  const v = g.createRadialGradient(W / 2, H / 2, 20, W / 2, H / 2, W * 0.75); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.6)'); g.fillStyle = v; g.fillRect(0, 0, W, H);
  // craquelado
  g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = 0.6;
  for (let i = 0; i < 60; i++) { let x = rnd() * W, y = rnd() * H; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 4; k++) { x += (rnd() - 0.5) * 14; y += (rnd() - 0.5) * 14; g.lineTo(x, y); } g.stroke(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
