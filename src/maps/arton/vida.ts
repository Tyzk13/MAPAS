// Sul de Arton — o mapa vivo: a Rainha Dragoa voando sobre as Uivantes, bandos de corvos e gaivotas, caravanas,
// cavaleiros, patrulhas e peregrinos andando pelas estradas, neve caindo nas montanhas, tempestade com raios no
// Mar Negro, nuvens baixas passando e os feixes dos faróis girando à noite. Tudo leve: instâncias e shaders.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { CFG } from '../../core/config';
import { mistTex } from '../../core/kit';
import { cam } from '../../core/engine';
import { fatorLuzes, type Preset } from '../../core/sky';
import { type P, W, Y, Ysolo, ESTRADAS, cidadeEm, BATALHAS, FAROIS, UIVANTES, LIM, lugar, rnd, reseed } from './geo';
import { tempo } from './terreno';

const Q = CFG.quality;
type Anim = (t: number, dt: number) => void;
/** brilho do céu agora (0 = noite fechada, 1 = dia nublado): partículas e nuvens sem luz própria seguem isso */
const ceu = { k: 1 };
const pinta = (g: THREE.BufferGeometry, c: [number, number, number]) => { const x = g.index ? g.toNonIndexed() : g, n = x.attributes.position.count, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) a.set(c, i * 3); x.setAttribute('color', new THREE.BufferAttribute(a, 3)); x.deleteAttribute('uv'); return x; };
const juntar = (ps: THREE.BufferGeometry[]) => { const g = mergeGeometries(ps)!; g.computeVertexNormals(); return g; };

// ---------- a Rainha Dragoa em voo ----------
function dragoaVoando(Gr: THREE.Group, anim: Anim[]) {
  const corpoM = new THREE.MeshStandardMaterial({ color: 0xe4f2ff, roughness: 0.45, metalness: 0.05, envMapIntensity: 0.9 });
  const membM = new THREE.MeshStandardMaterial({ color: 0x9ab8d4, roughness: 0.6, side: THREE.DoubleSide, transparent: true, opacity: 0.9 });
  const raiz = new THREE.Group(); raiz.name = 'Beluhga em voo';
  const tubo = (pts: number[][], r: number) => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p))), 14, r, 7);
  const corpo = new THREE.SphereGeometry(1, 14, 10); corpo.scale(0.55, 0.5, 1.25);
  const pesc = tubo([[0, 0.1, 0.9], [0, 0.45, 1.6], [0, 0.55, 2.3]], 0.22), cab = new THREE.ConeGeometry(0.26, 0.9, 7); cab.rotateX(Math.PI / 2); cab.translate(0, 0.55, 2.75);
  const cauda = tubo([[0, 0, -1.1], [0, -0.1, -2.2], [0.3, 0.05, -3.4], [0.9, 0.2, -4.2]], 0.16);
  const chifres = [-1, 1].map(s => { const c = new THREE.ConeGeometry(0.05, 0.55, 5); c.rotateX(-1.2); c.rotateZ(s * 0.35); c.translate(s * 0.13, 0.8, 2.45); return c; });
  const patas = [-1, 1].flatMap(s => [-0.5, 0.5].map(z => { const c = new THREE.CylinderGeometry(0.06, 0.09, 0.6, 5); c.rotateX(0.9); c.translate(s * 0.35, -0.45, z); return c; }));
  const corpoG = mergeGeometries([corpo, pesc, cab, cauda, ...chifres, ...patas].map(g => { const x = g.index ? g.toNonIndexed() : g; x.deleteAttribute('uv'); return x; }))!; corpoG.computeVertexNormals();
  const cm = new THREE.Mesh(corpoG, corpoM); cm.castShadow = true; raiz.add(cm);
  const olhos = new THREE.Mesh(juntar([-1, 1].map(s => pinta(new THREE.SphereGeometry(0.05, 6, 4).translate(s * 0.12, 0.66, 2.95), [0.6, 0.9, 1]))), new THREE.MeshBasicMaterial({ color: 0x9fe8ff })); raiz.add(olhos);
  const asas: THREE.Group[] = [];
  for (const s of [-1, 1]) {
    const piv = new THREE.Group(); piv.position.set(s * 0.4, 0.3, 0.4); raiz.add(piv); asas.push(piv);
    const co = new THREE.Vector3(s * 1.6, 0.35, -0.2), dedos = [new THREE.Vector3(s * 3.6, 0.6, -0.4), new THREE.Vector3(s * 4.1, 0.1, -1.4), new THREE.Vector3(s * 3.3, -0.2, -2.3)], base = new THREE.Vector3(s * 0.2, -0.1, -1.5), om = new THREE.Vector3();
    const tri = [om, co, dedos[0], co, dedos[0], dedos[1], co, dedos[1], dedos[2], co, dedos[2], base, om, co, base];
    const m = new THREE.BufferGeometry(); m.setAttribute('position', new THREE.Float32BufferAttribute(tri.flatMap(v => [v.x, v.y, v.z]), 3)); m.computeVertexNormals();
    const mm = new THREE.Mesh(m, membM); mm.castShadow = true; piv.add(mm);
    const ossos = [[om, co, 0.09], ...dedos.map(d => [co, d, 0.045])].map(([a, b, r]) => { const A = a as THREE.Vector3, Bv = b as THREE.Vector3, L = A.distanceTo(Bv), g = new THREE.CylinderGeometry((r as number) * 0.6, r as number, L, 5); g.translate(0, L / 2, 0); g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), Bv.clone().sub(A).normalize())); g.translate(A.x, A.y, A.z); g.deleteAttribute('uv'); return g.toNonIndexed(); });
    const om2 = new THREE.Mesh(mergeGeometries(ossos)!, corpoM); om2.castShadow = true; piv.add(om2);
  }
  raiz.scale.setScalar(1.6); Gr.add(raiz);
  // voo: elipse larga em volta dos picos, subindo e descendo; inclina nas curvas; bate as asas e às vezes plana
  const c = lugar('beluhga'), R = [44, 30], fase0 = 0.7;
  const pos = (a: number) => new THREE.Vector3(c.x + 8 + Math.cos(a) * R[0], 50 + 5 * Math.sin(a * 2) + 3 * Math.sin(a * 5), c.z + 6 + Math.sin(a) * R[1]);
  anim.push(t => {
    const a = fase0 + t * 0.055, p = pos(a), q = pos(a + 0.02);
    raiz.position.copy(p); raiz.lookAt(q); raiz.rotateZ(-0.38);
    const plana = Math.sin(t * 0.21) > 0.55, bat = plana ? 0.12 * Math.sin(t * 1.3) : Math.sin(t * 3.4) * 0.6;
    asas[0].rotation.z = -bat - 0.08; asas[1].rotation.z = bat + 0.08;
  });
}

// ---------- bandos de aves ----------
function bandos(Gr: THREE.Group, anim: Anim[]) {
  const forma = (cor: [number, number, number]) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0.12, -0.32, 0.1, -0.08, 0, 0, -0.04, 0, 0, 0.12, 0, 0, -0.04, 0.32, 0.1, -0.08], 3)); g.computeVertexNormals(); return pinta(g, cor); };
  const B: { c: THREE.Vector3; r: number; v: number; f: number; h: number }[] = [], G: typeof B = [];
  const corvos: P[] = [...BATALHAS, [lugar('zolkan').x, lugar('zolkan').z], [lugar('azazel').x, lugar('azazel').z], [lugar('velha').x, lugar('velha').z], [lugar('pantano').x, lugar('pantano').z]];
  const gaivotas: P[] = [[lugar('malpetrim').x, lugar('malpetrim').z + 4], [lugar('porto').x, lugar('porto').z + 3], [lugar('pescadores').x, lugar('pescadores').z], W(640, 1395), W(235, 1495)];
  reseed(4711);
  const encher = (lista: P[], L: typeof B, n: number) => lista.forEach(([x, z]) => { const h = Math.max(Y(x, z), 0) + 6 + rnd() * 4; for (let i = 0; i < n; i++) L.push({ c: new THREE.Vector3(x + (rnd() - 0.5) * 3, h + (rnd() - 0.5) * 2, z + (rnd() - 0.5) * 3), r: 2.5 + rnd() * 4, v: (0.35 + rnd() * 0.3) * (rnd() < 0.5 ? 1 : -1), f: rnd() * 6.28, h }); });
  encher(corvos, B, Q === 'baixa' ? 6 : 10); encher(gaivotas, G, Q === 'baixa' ? 5 : 8);
  const mk = (L: typeof B, cor: [number, number, number], nome: string) => { const im = new THREE.InstancedMesh(forma(cor), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8, side: THREE.DoubleSide }), L.length); im.name = nome; im.frustumCulled = false; im.userData.ns = 1; Gr.add(im); return im; };
  const ic = mk(B, [0.05, 0.05, 0.06], 'Corvos'), ig = mk(G, [0.92, 0.93, 0.95], 'Gaivotas');
  const o = new THREE.Object3D();
  const mover = (im: THREE.InstancedMesh, L: typeof B, esc: number) => (t: number) => {
    L.forEach((b, i) => { const a = b.f + t * b.v, r = b.r * (1 + 0.25 * Math.sin(t * 0.3 + b.f)); o.position.set(b.c.x + Math.cos(a) * r, b.c.y + Math.sin(t * 0.7 + b.f) * 0.6, b.c.z + Math.sin(a) * r);
      o.rotation.set(0, -a + (b.v > 0 ? 0 : Math.PI), b.v > 0 ? 0.35 : -0.35); const bat = 0.55 + 0.45 * Math.sin(t * 9 + b.f * 3); o.scale.set(esc, esc * bat, esc); o.updateMatrix(); im.setMatrixAt(i, o.matrix); });
    im.instanceMatrix.needsUpdate = true;
  };
  anim.push(mover(ic, B, 1.5), mover(ig, G, 1.7));
}

// ---------- caravanas, cavaleiros, patrulhas e peregrinos nas estradas ----------
function viajantes(Gr: THREE.Group, anim: Anim[]) {
  const caixa = (w: number, h: number, d: number, x: number, y: number, z: number, c: [number, number, number]) => pinta(new THREE.BoxGeometry(w, h, d).translate(x, y, z), c);
  const cil = (r: number, h: number, x: number, y: number, z: number, c: [number, number, number], rx = 0) => { const g = new THREE.CylinderGeometry(r, r, h, 6); if (rx) g.rotateZ(rx); g.translate(x, y, z); return pinta(g, c); };
  const cavalo = (dz: number, c: [number, number, number] = [0.32, 0.2, 0.12]) => [caixa(0.16, 0.16, 0.42, 0, 0.34, dz, c), caixa(0.08, 0.2, 0.08, 0, 0.5, dz + 0.22, c), ...[-0.06, 0.06].flatMap(x => [-0.15, 0.15].map(z => caixa(0.04, 0.26, 0.04, x, 0.13, dz + z, c)))];
  const tipos: Record<string, THREE.BufferGeometry> = {
    carroca: juntar([caixa(0.36, 0.22, 0.6, 0, 0.34, -0.2, [0.45, 0.32, 0.2]), caixa(0.4, 0.06, 0.66, 0, 0.47, -0.2, [0.75, 0.68, 0.52]), ...[-1, 1].flatMap(s => [-0.4, 0].map(z => cil(0.11, 0.04, s * 0.2, 0.12, z - 0.0, [0.25, 0.18, 0.12], Math.PI / 2))), ...cavalo(0.45)]),
    cavaleiro: juntar([...cavalo(0, [0.18, 0.12, 0.08]), caixa(0.12, 0.26, 0.1, 0, 0.6, -0.02, [0.5, 0.12, 0.1]), caixa(0.08, 0.08, 0.08, 0, 0.77, -0.02, [0.8, 0.65, 0.5])]),
    patrulha: juntar([-0.25, 0, 0.25].flatMap(dz => [caixa(0.16, 0.34, 0.12, 0, 0.27, dz, [0.45, 0.08, 0.06]), caixa(0.12, 0.12, 0.12, 0, 0.5, dz, [0.3, 0.22, 0.16]), cil(0.012, 0.6, 0.1, 0.4, dz, [0.6, 0.6, 0.62])])),
    peregrinos: juntar([-0.2, 0.05, 0.3].flatMap(dz => [caixa(0.12, 0.3, 0.12, 0, 0.17, dz, [0.55, 0.55, 0.58]), caixa(0.08, 0.08, 0.08, 0, 0.36, dz, [0.85, 0.8, 0.75])])),
  };
  type V = { tipo: string; rota: P[]; acc: number[]; tot: number; s: number; v: number; dir: number };
  const comp = (r: P[]) => { const a = [0]; for (let i = 1; i < r.length; i++) a.push(a[i - 1] + Math.hypot(r[i][0] - r[i - 1][0], r[i][1] - r[i - 1][1])); return a; };
  const vs: V[] = []; reseed(2077);
  const n = Q === 'baixa' ? 14 : 26;
  for (let i = 0; i < n; i++) {
    const rota = ESTRADAS[i % ESTRADAS.length], acc = comp(rota), tot = acc[acc.length - 1]; if (tot < 10) continue;
    const tipo = i % ESTRADAS.length === 11 ? 'peregrinos' : ['carroca', 'cavaleiro', 'carroca', 'patrulha'][i % 4];
    vs.push({ tipo, rota, acc, tot, s: rnd() * tot, v: tipo === 'cavaleiro' ? 1.6 : tipo === 'patrulha' ? 0.9 : 0.7, dir: rnd() < 0.5 ? 1 : -1 });
  }
  const por: Record<string, V[]> = {}; vs.forEach(v => (por[v.tipo] ||= []).push(v));
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85 });
  const ims = Object.entries(por).map(([tipo, L]) => { const im = new THREE.InstancedMesh(tipos[tipo], mat, L.length); im.name = 'Viajantes: ' + tipo; im.frustumCulled = false; im.castShadow = Q !== 'baixa'; im.userData.ns = 1; Gr.add(im); return { im, L }; });
  const o = new THREE.Object3D(), esc = 2.2;
  anim.push((_t, dt) => {
    for (const { im, L } of ims) {
      L.forEach((v, k) => {
        v.s += v.v * v.dir * Math.min(dt, 0.1); if (v.s > v.tot) { v.s = v.tot; v.dir = -1; } if (v.s < 0) { v.s = 0; v.dir = 1; }
        let i = 1; while (i < v.acc.length - 1 && v.acc[i] < v.s) i++;
        const a = v.rota[i - 1], b = v.rota[i], f = (v.s - v.acc[i - 1]) / Math.max(1e-6, v.acc[i] - v.acc[i - 1]), x = a[0] + (b[0] - a[0]) * f, z = a[1] + (b[1] - a[1]) * f;
        o.position.set(x, Ysolo(x, z) + 0.05, z); o.rotation.set(0, Math.atan2((b[0] - a[0]) * v.dir, (b[1] - a[1]) * v.dir), 0); o.scale.setScalar(cidadeEm(x, z, 0.3) ? 0.001 : esc); o.updateMatrix(); im.setMatrixAt(k, o.matrix); // dentro dos muros some (a cidade tem as próprias ruas)
      });
      im.instanceMatrix.needsUpdate = true;
    }
  });
}

// ---------- neve caindo nas Uivantes (só na GPU) ----------
function neve(Gr: THREE.Group) {
  const n = { baixa: 1800, media: 4000, alta: 7000 }[Q], pos = new Float32Array(n * 3), seed = new Float32Array(n), base = new Float32Array(n);
  let a = 1e9, b = -1e9, c = 1e9, d = -1e9; for (const [x, z] of UIVANTES) { a = Math.min(a, x); b = Math.max(b, x); c = Math.min(c, z); d = Math.max(d, z); }
  reseed(99); for (let i = 0; i < n; i++) { const x = a + rnd() * (b - a), z = c + rnd() * (d - c); base[i] = Math.max(0, Y(x, z)); pos.set([x, base[i] + rnd() * 40, z], i * 3); seed[i] = rnd() * 100; }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('seed', new THREE.BufferAttribute(seed, 1)); g.setAttribute('base', new THREE.BufferAttribute(base, 1));
  const m = new THREE.ShaderMaterial({
    uniforms: { uT: tempo, uOp: { value: 0.9 }, uK: { value: 1 } }, transparent: true, depthWrite: false,
    vertexShader: `attribute float seed, base; uniform float uT; varying float vA;
      void main() { vec3 p = position; float h = 40.0, y = mod(position.y - base - uT * (1.6 + fract(seed) * 1.2), h); p.y = base + y;
        p.x += sin(uT * 0.6 + seed) * 1.2; p.z += cos(uT * 0.5 + seed * 1.7) * 1.0;
        vec4 mv = modelViewMatrix * vec4(p, 1.0); gl_PointSize = clamp(60.0 / -mv.z, 0.6, 5.0);
        vA = smoothstep(0.0, 3.0, y) * smoothstep(h, h - 6.0, y) * smoothstep(900.0, 250.0, -mv.z);
        gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform float uOp, uK; varying float vA; void main() { float r = length(gl_PointCoord - 0.5); gl_FragColor = vec4(vec3(0.95, 0.97, 1.0) * (0.35 + 0.65 * uK), smoothstep(0.5, 0.1, r) * uOp * (0.25 + 0.5 * uK) * vA); }`,
  });
  climas.push(() => (m.uniforms.uK.value = ceu.k));
  const p = new THREE.Points(g, m); p.name = 'Neve'; p.frustumCulled = false; p.userData.ns = 1; p.userData.noExport = 1; Gr.add(p);
}

// ---------- tempestade no Mar Negro: nuvem escura, chuva e raios ----------
function tempestade(Gr: THREE.Group, anim: Anim[]) {
  const [cx, cz] = W(560, 1470), R = 30, nuvens: THREE.Sprite[] = [];
  for (let i = 0; i < 12; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: mistTex(), color: 0x2a2c32, transparent: true, depthWrite: false, opacity: 0.75 })); const a = (i / 12) * 6.28, r = rnd() * R * 0.8, sc = 28 + rnd() * 22; s.scale.set(sc, sc * 0.45, 1); s.position.set(cx + Math.cos(a) * r, 34 + rnd() * 8, cz + Math.sin(a) * r * 0.7); s.userData = { ns: 1, noExport: 1, a, r }; Gr.add(s); nuvens.push(s); }
  // chuva: riscos caindo (posição calculada na GPU)
  const n = Q === 'baixa' ? 500 : 1400, pos = new Float32Array(n * 6), sd = new Float32Array(n * 2), off = new Float32Array(n * 2);
  for (let i = 0; i < n; i++) { const a = rnd() * 6.28, r = Math.sqrt(rnd()) * R, x = cx + Math.cos(a) * r, z = cz + Math.sin(a) * r * 0.7, y = rnd() * 34, k = rnd() * 50; pos.set([x, y, z, x, y, z], i * 6); sd[i * 2] = k; sd[i * 2 + 1] = k; off[i * 2] = 0; off[i * 2 + 1] = 1.6; }
  const gl = new THREE.BufferGeometry(); gl.setAttribute('position', new THREE.BufferAttribute(pos, 3)); gl.setAttribute('seed', new THREE.BufferAttribute(sd, 1)); gl.setAttribute('off', new THREE.BufferAttribute(off, 1));
  const ml = new THREE.ShaderMaterial({ uniforms: { uT: tempo, uK: { value: 1 } }, transparent: true, depthWrite: false,
    vertexShader: `attribute float seed, off; uniform float uT; void main() { vec3 p = position; p.y = 1.6 + mod(p.y - uT * 26.0 - seed, 32.4) - off; p.x += off * 0.18; vec4 mv = modelViewMatrix * vec4(p, 1.0); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform float uK; void main() { gl_FragColor = vec4(vec3(0.55, 0.6, 0.66) * (0.3 + 0.7 * uK), 0.16); }` });
  climas.push(() => (ml.uniforms.uK.value = ceu.k));
  const chuva = new THREE.LineSegments(gl, ml); chuva.name = 'Chuva'; chuva.frustumCulled = false; chuva.userData.ns = 1; chuva.userData.noExport = 1; Gr.add(chuva);
  // raio: linha quebrada brilhante + clarão (uma PointLight só da tempestade)
  const raioG = new THREE.BufferGeometry(), raioP = new Float32Array(16 * 3); raioG.setAttribute('position', new THREE.BufferAttribute(raioP, 3));
  const raio = new THREE.Line(raioG, new THREE.LineBasicMaterial({ color: new THREE.Color(2.4, 2.4, 3.2), transparent: true })); raio.visible = false; raio.frustumCulled = false; raio.userData.ns = 1; raio.userData.noExport = 1; Gr.add(raio);
  const clarao = new THREE.PointLight(0xc8d8ff, 0, 160, 1.2); clarao.position.set(cx, 30, cz); Gr.add(clarao);
  let prox = 4, fim = -1;
  anim.push(t => {
    nuvens.forEach((s, i) => { const a = s.userData.a + t * 0.01; s.position.x = cx + Math.cos(a) * s.userData.r; s.position.z = cz + Math.sin(a) * s.userData.r * 0.7; (s.material as THREE.SpriteMaterial).color.setHex(t < fim ? 0x8a90a8 : 0x2a2c32); void i; });
    if (t > prox) {
      const x0 = cx + (rnd() - 0.5) * R, z0 = cz + (rnd() - 0.5) * R * 0.6; let x = x0, z = z0;
      for (let k = 0; k < 16; k++) { const y = 34 - (34 * k) / 15; raioP.set([x, y, z], k * 3); x += (rnd() - 0.5) * 2.4; z += (rnd() - 0.5) * 2.4; }
      raioG.attributes.position.needsUpdate = true; raio.visible = true; fim = t + 0.35; prox = t + 5 + rnd() * 9; clarao.position.set(x0, 26, z0);
    }
    const on = t < fim, pisca = on && Math.sin(t * 60) > -0.3;
    raio.visible = pisca; clarao.intensity = on ? (pisca ? 2600 : 600) : 0;
  });
}

// ---------- nuvens baixas passando ----------
function nuvensBaixas(Gr: THREE.Group, anim: Anim[]) {
  const ns: THREE.Sprite[] = [], n = Q === 'baixa' ? 8 : 14; reseed(321);
  for (let i = 0; i < n; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: mistTex(), color: 0xe8ecf0, transparent: true, depthWrite: false, opacity: 0 })); const sc = 45 + rnd() * 45; s.scale.set(sc, sc * 0.38, 1); s.position.set(LIM.x0 + rnd() * (LIM.x1 - LIM.x0), 38 + rnd() * 26, LIM.z0 + rnd() * 380); s.userData = { ns: 1, noExport: 1, v: 0.6 + rnd() * 0.8, op: 0.22 + rnd() * 0.2 }; Gr.add(s); ns.push(s); }
  climas.push(() => ns.forEach(s => (s.material as THREE.SpriteMaterial).color.setRGB(0.18 + 0.75 * ceu.k, 0.19 + 0.76 * ceu.k, 0.22 + 0.74 * ceu.k)));
  anim.push((_t, dt) => ns.forEach(s => { s.position.x += s.userData.v * Math.min(dt, 0.1); if (s.position.x > LIM.x1 + 60) s.position.x = LIM.x0 - 60; const d = s.position.distanceTo(cam.position); (s.material as THREE.SpriteMaterial).opacity = s.userData.op * Math.min(1, Math.max(0, (d - 60) / 80)); }));
}

// ---------- feixes dos faróis (só quando as luzes estão acesas) ----------
function farois(Gr: THREE.Group, anim: Anim[]) {
  const um = new THREE.ConeGeometry(2.6, 16, 16, 1, true); um.translate(0, -8, 0); um.rotateX(-Math.PI / 2); // ponta na lanterna, abre para +z
  const geo = mergeGeometries([um, um.clone().rotateY(Math.PI)])!; // dois feixes opostos numa malha só
  const m = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, uniforms: { uI: { value: 1 } },
    vertexShader: `varying float vL; void main() { vL = clamp(abs(position.z) / 16.0, 0.0, 1.0); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `uniform float uI; varying float vL; void main() { gl_FragColor = vec4(vec3(1.0, 0.86, 0.55) * pow(1.0 - vL, 2.0) * 0.32 * uI, 1.0); }` });
  const feixes = FAROIS.map(([x, z]) => { const a = new THREE.Mesh(geo, m); a.position.set(x, Ysolo(x, z) + 3.1, z); a.userData.ns = 1; a.userData.noExport = 1; a.frustumCulled = false; Gr.add(a); return a; });
  anim.push(t => { const f = fatorLuzes(); m.uniforms.uI.value = f; feixes.forEach((p, i) => { p.visible = f > 0.05; p.rotation.y = t * 0.7 + i * 1.3; }); });
}

const climas: (() => void)[] = [];
export function construirVida(Gr: THREE.Group) {
  climas.length = 0;
  const anim: Anim[] = [], grupo = new THREE.Group(); grupo.name = 'Vida'; Gr.add(grupo);
  dragoaVoando(grupo, anim); bandos(grupo, anim); viajantes(grupo, anim); neve(grupo); tempestade(grupo, anim); nuvensBaixas(grupo, anim); farois(grupo, anim);
  /** chamado pelo onTime: escurece neve, chuva e nuvens conforme o céu */
  const clima = (p: Preset) => { ceu.k = Math.min(1, Math.max(0, (p.bg - 0.05) / 0.5)); climas.forEach(f => f()); };
  return { grupo, anim, clima };
}
