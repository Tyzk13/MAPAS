// O Caso Whitlock — pistas espalhadas por Harlow (ver docs/casos/harlow-caso-whitlock.md).
// Tudo sutil: sigilos inventados, recortes de jornal, uma cova aberta, um brilho vermelho no porão.
import * as THREE from 'three';
import { halo } from '../../core/kit';
import { mtx, rnd, reseed, TM, light, CROP, CEMETERY, FARM, RAIL, TOWERW, DINER, MOTEL, CHURCH } from './common';

const tex = (w: number, h: number, draw: (g: CanvasRenderingContext2D) => void) => {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d')!);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
};
/** sigilo inventado (círculo, raios e marcas) — o mesmo desenho aparece em vários lugares */
function sigil(g: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string, lw: number, jitter = 2) {
  reseed(1986);
  g.strokeStyle = color; g.lineWidth = lw; g.lineCap = 'round';
  const j = () => (rnd() - 0.5) * jitter;
  const ring = (rr: number) => { g.beginPath(); for (let i = 0; i <= 60; i++) { const a = i / 60 * Math.PI * 2; g.lineTo(cx + Math.cos(a) * (rr + j()), cy + Math.sin(a) * (rr + j())); } g.stroke(); };
  ring(r); ring(r * 0.42);
  for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2 - Math.PI / 2; g.beginPath(); g.moveTo(cx + Math.cos(a) * r * 0.42, cy + Math.sin(a) * r * 0.42); g.lineTo(cx + Math.cos(a) * r * 1.18 + j(), cy + Math.sin(a) * r * 1.18 + j()); g.stroke();
    g.beginPath(); g.arc(cx + Math.cos(a) * r * 0.72, cy + Math.sin(a) * r * 0.72, r * 0.07, 0, 7); g.stroke(); }
  g.beginPath(); g.moveTo(cx - r * 0.25, cy + r * 0.15); g.lineTo(cx, cy - r * 0.28); g.lineTo(cx + r * 0.25, cy + r * 0.15); g.closePath(); g.stroke();
  g.beginPath(); g.arc(cx, cy, r * 0.06, 0, 7); g.fillStyle = color; g.fill();
}
const plane = (G: THREE.Object3D, t: THREE.Texture, w: number, h: number, x: number, y: number, z: number, ry: number, o: THREE.MeshStandardMaterialParameters = {}) => {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: t, roughness: 0.85, transparent: true, depthWrite: false, ...o }));
  m.position.set(x, y, z); m.rotation.y = ry; m.userData.ns = 1; G.add(m); return m;
};

export function buildMystery(G: THREE.Group, lamps: THREE.MeshBasicMaterial[]) {
  const m = TM();

  // 1) Cemitério: lápide de Clara ao lado da cova aberta (o caixão de memória estava vazio)
  { const x = CEMETERY.x1 - 4, z = CEMETERY.z0 + 2.7;
    const st = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.0, 0.18), m.stone); st.position.set(x, 0.5, z); st.rotation.x = -0.08; st.castShadow = true; G.add(st);
    plane(G, tex(256, 320, g => { g.fillStyle = '#9a968e'; g.fillRect(0, 0, 256, 320); g.fillStyle = '#3a3630'; g.textAlign = 'center';
      g.font = 'bold 26px Georgia'; g.fillText('CLARA MAE', 128, 80); g.fillText('WHITLOCK', 128, 115); g.font = '22px Georgia'; g.fillText('1970 — 1986', 128, 165);
      g.font = 'italic 19px Georgia'; g.fillText('Until you come home', 128, 215); sigil(g, 128, 270, 26, 'rgba(120,20,15,0.8)', 3); }), 0.76, 0.95, x, 0.5, z + 0.1, 0, { transparent: false, depthWrite: true }); }

  // 2) Fazenda: mural de recortes com barbante vermelho na sala do ritual
  { const fx = FARM.x, z = FARM.z - 5 + 0.27;
    plane(G, tex(512, 320, g => {
      g.fillStyle = '#6a5440'; g.fillRect(0, 0, 512, 320);
      const cards: [number, number, number, number, string][] = [[20, 20, 140, 100, 'GIRL, 16, MISSING'], [190, 30, 130, 90, 'SEARCH CALLED OFF'], [350, 20, 140, 110, 'LIGHTS OVER PRUITT FARM?'], [40, 170, 120, 120, 'photo'], [200, 160, 120, 130, 'map'], [350, 170, 140, 110, 'UNDERTAKER LEAVES TOWN']];
      cards.forEach(([x, y, w, h, t]) => { g.save(); g.translate(x + w / 2, y + h / 2); g.rotate((rnd() - 0.5) * 0.12); g.fillStyle = t === 'photo' ? '#3a3a3a' : '#e0d8c4'; g.fillRect(-w / 2, -h / 2, w, h);
        g.fillStyle = '#2a2420'; if (t === 'photo') { g.fillStyle = '#7a7a7a'; g.beginPath(); g.ellipse(0, -8, 28, 36, 0, 0, 7); g.fill(); g.fillRect(-40, 28, 80, 30); }
        else if (t === 'map') { g.strokeStyle = '#4a4030'; g.lineWidth = 2; for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(-w / 2, -h / 2 + i * 22); g.lineTo(w / 2, -h / 2 + i * 22 + 10); g.stroke(); } sigil(g, 15, 10, 22, '#8a1a12', 2); }
        else { g.font = 'bold 15px Georgia'; g.textAlign = 'center'; const ws = t.split(' '), h2 = Math.ceil(ws.length / 2); [ws.slice(0, h2).join(' '), ws.slice(h2).join(' ')].forEach((ln, k) => g.fillText(ln, 0, -h / 2 + 24 + k * 18)); g.fillStyle = '#9a9488'; for (let k = 0; k < 4; k++) g.fillRect(-w / 2 + 10, h / 2 - 40 + k * 8, w - 20, 3); }
        g.restore(); g.fillStyle = '#b02020'; g.beginPath(); g.arc(x + w / 2, y + 6, 4, 0, 7); g.fill(); });
      g.strokeStyle = '#b02020'; g.lineWidth = 2; const pins = cards.map(([x, y, w]) => [x + w / 2, y + 6]); [[0, 3], [3, 4], [4, 2], [4, 5], [1, 4]].forEach(([a, b]) => { g.beginPath(); g.moveTo(pins[a][0], pins[a][1]); g.lineTo(pins[b][0], pins[b][1]); g.stroke(); });
    }), 2.4, 1.5, fx - 3.2, 1.75, z, 0, { transparent: false, depthWrite: true }); }

  // 3) Porão de tempestade: brilho vermelho vindo de baixo (Sangue)
  { const cx = FARM.x + 9, cz = FARM.z + 7;
    const glow = new THREE.MeshBasicMaterial({ color: 0x5a0806, toneMapped: false }); lamps.push(glow);
    const p = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 1.9).rotateX(-Math.PI / 2), glow); p.position.set(cx, 0.4, cz); G.add(p);
    light(cx, 0.9, cz, 3, 6, 0xff2a1a, { flick: 1, vtt: 3 }); }

  // 4) Milharal: círculo amassado e queimado com o sigilo (visível na vista tática)
  { const t = tex(1024, 1024, g => { g.fillStyle = 'rgba(40,30,18,0.85)'; g.beginPath(); g.arc(512, 512, 500, 0, 7); g.fill(); sigil(g, 512, 512, 330, 'rgba(15,8,5,0.9)', 26, 10); sigil(g, 512, 512, 330, 'rgba(120,30,15,0.5)', 6, 10); });
    const d = new THREE.Mesh(new THREE.CircleGeometry(CROP.r, 40).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: t, transparent: true, depthWrite: false, roughness: 1 }));
    d.position.set(CROP.x, 0.06, CROP.z); d.userData.ns = 1; G.add(d);
    // talos caídos em espiral
    const g = new THREE.CylinderGeometry(0.015, 0.02, 1.6, 4); g.rotateZ(Math.PI / 2);
    const n = 160, im = new THREE.InstancedMesh(g, m.veg, n);
    for (let i = 0; i < n; i++) { const a = i * 0.35, r = 1 + (i / n) * (CROP.r - 1.2); im.setMatrixAt(i, mtx(CROP.x + Math.cos(a) * r, 0.05, CROP.z + Math.sin(a) * r, -a + Math.PI / 2 + 0.6)); im.setColorAt(i, new THREE.Color(0x6a5a3a)); }
    im.computeBoundingSphere(); G.add(im);
    light(CROP.x, 0.8, CROP.z, 2, 4, 0xff3a2a, { flick: 1, vtt: 5 }); }

  // 5) Vagão de carga abandonado nos trilhos com o sigilo pintado na porta
  { const x = -64, z = RAIL;
    const car = new THREE.Group(); car.position.set(x, 0, z); G.add(car);
    const body = new THREE.Mesh(new THREE.BoxGeometry(13, 3.4, 3.0), m.rust); body.position.y = 2.6; body.castShadow = body.receiveShadow = true; car.add(body);
    const roof = new THREE.Mesh(new THREE.BoxGeometry(13.2, 0.2, 3.2), m.rust); roof.position.y = 4.4; car.add(roof);
    [-4.2, 4.2].forEach(o => [-0.9, 0.9].forEach(s => { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.2, 14), m.iron); w.rotation.x = Math.PI / 2; w.position.set(o + s, 0.55, 0.72); car.add(w); const w2 = w.clone(); w2.position.z = -0.72; car.add(w2); }));
    [-4.2, 4.2].forEach(o => { const t = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.5, 2.2), m.iron); t.position.set(o, 0.75, 0); car.add(t); });
    const door = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.8, 0.1), m.rust); door.position.set(0.9, 2.5, 1.55); car.add(door);
    plane(car, tex(512, 512, g => sigil(g, 256, 256, 170, 'rgba(230,226,215,0.85)', 9, 6)), 2.2, 2.2, 0.9, 2.5, 1.61, 0);
    plane(car, tex(512, 128, g => { g.font = 'bold 70px Georgia'; g.fillStyle = 'rgba(220,215,200,0.8)'; g.textAlign = 'center'; g.fillText('T & P  41077', 256, 90); }), 4, 1, -4, 3.7, 1.52, 0); }

  // 6) Caixa-d'água: o sigilo pichado (dá para ver da cidade)
  plane(G, tex(512, 512, g => sigil(g, 256, 256, 180, 'rgba(140,20,15,0.85)', 14, 8)), 2.6, 2.6, TOWERW.x, 20.3, TOWERW.z + 3.62, 0);

  // 7) Lanchonete: cartaz de desaparecida na parede, mesa posta para alguém que não veio
  plane(G, tex(256, 340, g => { g.fillStyle = '#e8e0cc'; g.fillRect(0, 0, 256, 340); g.fillStyle = '#1a1a1a'; g.font = 'bold 34px Arial'; g.textAlign = 'center'; g.fillText('MISSING', 128, 46);
    g.fillStyle = '#5a5a5a'; g.fillRect(58, 64, 140, 170); g.fillStyle = '#3a3a3a'; g.beginPath(); g.ellipse(128, 140, 42, 54, 0, 0, 7); g.fill();
    g.fillStyle = '#1a1a1a'; g.font = 'bold 22px Arial'; g.fillText('CLARA WHITLOCK', 128, 268); g.font = '16px Arial'; g.fillText('Last seen Oct 31, 1986', 128, 294); g.fillText('near Pruitt Rd.', 128, 316); }),
    0.5, 0.66, DINER.x0 + 4, 1.8, DINER.z0 + 0.27, 0, { transparent: false, depthWrite: true });

  // 8) Motel, quarto 7: polaroid sobre a cama
  { const rx = MOTEL.x0 + 8 + 6 * 4;
    const pol = plane(G, tex(128, 150, g => { g.fillStyle = '#f0ece0'; g.fillRect(0, 0, 128, 150); g.fillStyle = '#2a2622'; g.fillRect(10, 10, 108, 100); g.fillStyle = '#5a1a14'; g.globalAlpha = 0.6; g.beginPath(); g.ellipse(64, 64, 18, 30, 0, 0, 7); g.fill(); g.globalAlpha = 1; g.fillStyle = '#3a3430'; g.font = 'italic 14px Georgia'; g.textAlign = 'center'; g.fillText('10·31·86', 64, 136); }),
      0.11, 0.13, rx + 2.4, 0.66, MOTEL.z0 + 1.6, 0, { transparent: false, depthWrite: true });
    pol.rotation.set(-Math.PI / 2, 0, 0.5); }

  // 9) Igreja: quadro de hinos com a data
  { const z = CHURCH.z - CHURCH.d / 2 + 0.27;
    plane(G, tex(128, 200, g => { g.fillStyle = '#4a3020'; g.fillRect(0, 0, 128, 200); g.fillStyle = '#e8e0d0'; g.font = 'bold 15px Georgia'; g.textAlign = 'center'; g.fillText('HYMNS', 64, 26); g.font = 'bold 36px Georgia'; ['10', '31', '86'].forEach((s, i) => g.fillText(s, 64, 72 + i * 46)); }),
      0.5, 0.8, CHURCH.x + 3.2, 2.4, z, 0, { transparent: false, depthWrite: true }); }

  // brilho no túmulo e no círculo
  halo(CROP.x, 0.5, CROP.z, 1.6);
}
