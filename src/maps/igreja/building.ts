// Arquitetura da igreja: base, paredes com vãos reais, vitrais, portal, contrafortes, telhado com tesouras,
// fachada com rosácea e cruz, torre sineira com sino e pináculo. Concreto por fora, reboco por dentro.
import * as THREE from 'three';
import { stainedGlass } from '../../core/procedural';
import { boxUV } from '../../core/pbr';
import {
  FLOOR, NX, NZ, WT, WH, TOP, RISE, WIN_Z, WIN, DOOR, TOWER, M, iron, brass,
  bx, mesh, cube, pointedArch, roundArch, circle, wallGeo, frameGeo, panelGeo,
} from './common';

export interface Building {
  walls: THREE.Group;   // camada "Paredes" (inclui torre e fachada)
  roof: THREE.Group;    // camada "Telhado"
  solids: THREE.Object3D[];
  glass: THREE.MeshStandardMaterial[];
  floors: THREE.Object3D[];
  doorLeaves: THREE.Object3D[];
}

export function buildChurch(G: THREE.Group): Building {
  const W = new THREE.Group(); W.name = 'paredes'; G.add(W);
  const RF = new THREE.Group(); RF.name = 'telhado'; G.add(RF);
  const solids: THREE.Object3D[] = [], floors: THREE.Object3D[] = [], glass: THREE.MeshStandardMaterial[] = [];
  const con = M.concrete(), conD = M.concreteDark(), trim = M.concreteTrim(), pla = M.plaster();
  const OX = NX + WT, OZ = NZ + WT; // faces externas

  // ---------- base (embasamento) e piso ----------
  const plinth = cube(OX * 2 + 0.5, FLOOR, OZ * 2 + 0.5, 0, FLOOR / 2, 0, conD, G); floors.push(plinth); plinth.userData.exterior = 1;
  const fl = mesh(boxUV(new THREE.PlaneGeometry(NX * 2, NZ * 2).rotateX(-Math.PI / 2)), M.floor(), 0, FLOOR + 0.005, 0, G);
  fl.castShadow = false; floors.push(fl);

  // ---------- vitrais ----------
  const glassMat = (kind: 'lanceta' | 'rosa', seed: number) => {
    const t = stainedGlass(kind, seed);
    const m = new THREE.MeshStandardMaterial({ map: t, emissiveMap: t, emissive: 0xffffff, emissiveIntensity: 1, color: 0x2a2a2a, roughness: 0.18, metalness: 0, side: THREE.DoubleSide, envMapIntensity: 1.2 });
    glass.push(m); return m;
  };
  const lancetMats = [glassMat('lanceta', 1), glassMat('lanceta', 2), glassMat('lanceta', 3)];
  const winPts = pointedArch(WIN.w, WIN.h);

  /** Monta parede de 2 camadas (concreto fora, reboco dentro) no plano local XY; frente externa = +z local. */
  function wall(w: number, h: number, holes: { pts: THREE.Vector2[]; x: number; y: number }[], top?: THREE.Vector2[]) {
    const g = new THREE.Group();
    const outer = mesh(wallGeo(w, h, WT * 0.6, holes, top), [con, con], 0, 0, WT * 0.4, g);
    const inner = mesh(wallGeo(w, h, WT * 0.4, holes, top), [pla, pla], 0, 0, 0, g);
    solids.push(outer, inner);
    return g;
  }
  /** Janela: vitral + moldura externa + peitoril, no plano local da parede. */
  function windowAt(parent: THREE.Object3D, pts: THREE.Vector2[], x: number, y: number, mat: THREE.Material, frameGrow = 0.16) {
    const gl = mesh(panelGeo(pts), mat, x, y, WT * 0.45, parent); gl.castShadow = false;
    const fr = mesh(frameGeo(pts, frameGrow, 0.08), trim, x, y, WT, parent); fr.castShadow = true;
    const w = Math.max(...pts.map(p => p.x)) * 2;
    cube(w + 0.4, 0.1, WT + 0.22, x, y - 0.06, WT / 2 + 0.06, trim, parent);
    // grade de chumbo/ferro protetora por fora (barras horizontais finas)
    for (let k = 1; k < 4; k++) cube(w, 0.018, 0.018, x, y + (WIN.h * k) / 4.6, WT * 0.8, iron(), parent);
  }

  // ---------- paredes laterais (com 5 janelas ogivais) ----------
  [-1, 1].forEach(s => {
    const holes = WIN_Z.map(z => ({ pts: winPts, x: z * s * -1, y: WIN.sill }));
    const g = wall(NZ * 2 + WT * 2, WH, holes);
    g.position.set(s * NX, FLOOR, 0); g.rotation.y = s * Math.PI / 2; W.add(g);
    WIN_Z.forEach((z, i) => windowAt(g, winPts, -z * s, WIN.sill, lancetMats[(i + (s > 0 ? 1 : 0)) % 3]));
    // contrafortes entre as janelas (fora)
    [-10.6, -6, -2, 2, 6, 10.6].forEach(z => {
      const b = new THREE.Group(); b.position.set(s * (OX + 0.35), 0, z); W.add(b);
      cube(0.7, FLOOR + 3.2, 0.62, 0, (FLOOR + 3.2) / 2, 0, con, b);
      cube(0.5, 2.6, 0.5, -s * 0.1, FLOOR + 3.2 + 1.3, 0, con, b);
      const cap = cube(0.82, 0.14, 0.74, 0, FLOOR + 3.25, 0, trim, b); cap.rotation.z = s * 0.35;
      const cap2 = cube(0.62, 0.12, 0.6, -s * 0.1, FLOOR + 5.85, 0, trim, b); cap2.rotation.z = s * 0.5;
      solids.push(...b.children);
    });
    // cornija no topo
    cube(0.34, 0.24, OZ * 2 + 0.3, s * (OX + 0.07), TOP - 0.05, 0, trim, W);
    // faixa de rodapé (concreto escuro)
    cube(0.12, 0.5, OZ * 2, s * (OX + 0.06), FLOOR + 0.25, 0, conD, W);
  });

  // ---------- fachada (frente, +z) ----------
  const gablePts = [new THREE.Vector2(-OX, 0), new THREE.Vector2(OX, 0), new THREE.Vector2(OX, WH), new THREE.Vector2(0, WH + RISE + 0.35), new THREE.Vector2(-OX, WH)];
  const doorPts = roundArch(DOOR.w, DOOR.h);
  const rosePts = circle(1.15, 40);
  const sidePts = pointedArch(1.0, 3.2);
  // contorno da fachada com o vão da porta recortado (um vão encostado na borda não pode ser "furo")
  const frontOutline = [new THREE.Vector2(-OX, 0), ...doorPts.slice().reverse(), new THREE.Vector2(OX, 0), new THREE.Vector2(OX, WH), new THREE.Vector2(0, WH + RISE + 0.35), new THREE.Vector2(-OX, WH)];
  const front = wall(OX * 2, WH, [
    { pts: rosePts, x: 0, y: 6.25 },
    { pts: sidePts, x: -3.5, y: 1.7 }, { pts: sidePts, x: 3.5, y: 1.7 },
  ], frontOutline);
  front.position.set(0, FLOOR, NZ); W.add(front);
  const roseMat = glassMat('rosa', 5);
  { // rosácea: vitral + moldura grossa + raios de pedra
    const gl = mesh(panelGeo(rosePts), roseMat, 0, 6.25, WT * 0.45, front); gl.castShadow = false;
    mesh(frameGeo(rosePts, 0.26, 0.12), trim, 0, 6.25, WT, front);
    for (let i = 0; i < 8; i++) { const r = cube(0.06, 2.2, 0.08, 0, 6.25, WT * 0.5, trim, front); r.rotation.z = (i / 8) * Math.PI; }
    windowAt(front, sidePts, -3.5, 1.7, lancetMats[1], 0.13); windowAt(front, sidePts, 3.5, 1.7, lancetMats[2], 0.13);
  }
  // portal: moldura em arco (arquivoltas) e verga
  mesh(frameGeo(doorPts, 0.32, 0.22), trim, 0, 0, WT, front);
  mesh(frameGeo(roundArch(DOOR.w + 0.64, DOOR.h + 0.32), 0.18, 0.12), trim, 0, -0.32 * 0.6, WT + 0.2, front);
  // frontão: cornija inclinada e cruz no alto
  const slope = Math.atan2(RISE + 0.35, OX);
  [-1, 1].forEach(s => { const c = cube(Math.hypot(OX, RISE + 0.35) + 0.4, 0.22, 0.4, s * OX / 2, WH + (RISE + 0.35) / 2 + 0.1, WT + 0.08, trim, front); c.rotation.z = -s * slope; });
  cube(OX * 2 + 0.3, 0.24, 0.5, 0, WH - 0.05, WT + 0.1, trim, front);
  const cross = new THREE.Group(); cross.position.set(0, WH + RISE + 0.35, WT * 0.5); front.add(cross);
  cube(0.5, 0.4, 0.5, 0, 0.2, 0, trim, cross);
  cube(0.16, 2.0, 0.16, 0, 1.4, 0, iron(), cross); cube(1.0, 0.16, 0.16, 0, 1.75, 0, iron(), cross);
  // nicho com imagem acima do portal (silhueta discreta)
  // (a imagem fica a cargo de um modelo; aqui só o nicho)
  // ---------- portas (duas folhas de madeira, abertas) ----------
  const doorLeaves: THREE.Object3D[] = [];
  [-1, 1].forEach(s => {
    const hw = DOOR.w / 2 - 0.02, leafPts: THREE.Vector2[] = [];
    const r = DOOR.w / 2, ys = DOOR.h - r;
    // folha: retângulo com quarto de arco (lado de fora no topo)
    const sx = -s; // a folha cresce do batente para o centro
    leafPts.push(new THREE.Vector2(0, 0), new THREE.Vector2(sx * hw, 0), new THREE.Vector2(sx * hw, ys));
    for (let i = 1; i <= 8; i++) { const a = (i / 8) * (Math.PI / 2); leafPts.push(new THREE.Vector2(sx * Math.cos(a) * hw, ys + Math.sin(a) * (r - 0.02))); }
    const geo = boxUV(new THREE.ExtrudeGeometry(new THREE.Shape(leafPts), { depth: 0.09, bevelEnabled: false }));
    const pivot = new THREE.Group(); pivot.position.set(s * (DOOR.w / 2 - 0.02), FLOOR, NZ + WT * 0.3); W.add(pivot);
    const leaf = mesh(geo, M.woodDark(), 0, 0, 0, pivot);
    // ferragens
    [0.6, 2.4].forEach(y => cube(hw * 0.9, 0.08, 0.02, -s * hw * 0.48, y, 0.1, iron(), pivot));
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.012, 6, 16), iron()); ring.position.set(-s * (hw - 0.2), 1.25, 0.12); pivot.add(ring);
    pivot.rotation.y = s * 1.4; // portas bem abertas para fora
    doorLeaves.push(pivot);
    solids.push(leaf);
  });
  // soleira
  cube(DOOR.w + 0.2, 0.06, WT + 0.2, 0, FLOOR + 0.03, NZ + WT / 2, trim, W);

  // ---------- parede do fundo (altar) com rosácea ----------
  const backRose = circle(1.45, 44);
  const back = wall(OX * 2, WH, [{ pts: backRose, x: 0, y: 5.0 }], gablePts);
  back.position.set(0, FLOOR, -NZ); back.rotation.y = Math.PI; W.add(back);
  { const m2 = glassMat('rosa', 9); const gl = mesh(panelGeo(backRose), m2, 0, 5.0, WT * 0.45, back); gl.castShadow = false; mesh(frameGeo(backRose, 0.24, 0.1), trim, 0, 5.0, WT, back); for (let i = 0; i < 6; i++) { const r = cube(0.06, 2.8, 0.08, 0, 5.0, WT * 0.5, trim, back); r.rotation.z = (i / 6) * Math.PI; } }
  [-1, 1].forEach(s => { const c = cube(Math.hypot(OX, RISE + 0.35) + 0.4, 0.22, 0.4, s * OX / 2, WH + (RISE + 0.35) / 2 + 0.1, WT + 0.08, trim, back); c.rotation.z = -s * slope; });
  { const cr = new THREE.Group(); cr.position.set(0, WH + RISE + 0.35, WT * 0.5); back.add(cr); cube(0.4, 0.3, 0.4, 0, 0.15, 0, trim, cr); cube(0.12, 1.3, 0.12, 0, 0.9, 0, iron(), cr); cube(0.7, 0.12, 0.12, 0, 1.15, 0, iron(), cr); }

  // ---------- interior: lambri de madeira e pilastras ----------
  [-1, 1].forEach(s => {
    cube(0.05, 1.15, NZ * 2, s * (NX - 0.025), FLOOR + 0.575, 0, M.woodDark(), W);
    cube(0.09, 0.07, NZ * 2, s * (NX - 0.045), FLOOR + 1.17, 0, M.woodBeam(), W);
    [-10, -6, -2, 2, 6, 10].forEach(z => {
      cube(0.22, WH - 0.4, 0.5, s * (NX - 0.11), FLOOR + (WH - 0.4) / 2, z, pla, W);
      cube(0.3, 0.22, 0.6, s * (NX - 0.15), TOP - 0.5, z, M.concreteTrim(), W);
    });
    cube(0.3, 0.3, NZ * 2, s * (NX - 0.15), TOP - 0.15, 0, M.woodBeam(), W); // frechal
  });
  [NZ, -NZ].forEach(z => cube(NX * 2, 1.15, 0.05, 0, FLOOR + 0.575, z - Math.sign(z) * 0.025, M.woodDark(), W));

  // ---------- telhado: ardósia por fora, forro de tábuas por dentro, tesouras aparentes ----------
  const span = OX + 0.7, ang = Math.atan2(RISE, OX);
  const fascia = M.woodDark(), slate = M.slate(), ceil = M.ceiling();
  const yEave = TOP - (span - OX) * Math.tan(ang), slabLen = span / Math.cos(ang);
  [-1, 1].forEach(s => {
    const g = boxUV(new THREE.BoxGeometry(slabLen + 0.1, 0.22, OZ * 2 + 1.2));
    const r = mesh(g, [fascia, fascia, slate, ceil, fascia, fascia], s * span / 2, (TOP + RISE + yEave) / 2 + 0.12, 0, RF);
    r.rotation.z = -s * ang; r.userData.exterior = 1;
    // calha
    const gut = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, OZ * 2 + 1.2, 8, 1, true, 0, Math.PI), iron());
    gut.rotation.x = Math.PI / 2; gut.position.set(s * (span + 0.02), yEave - 0.02, 0); gut.material.side = THREE.DoubleSide; RF.add(gut);
  });
  cube(0.34, 0.22, OZ * 2 + 1.25, 0, TOP + RISE + 0.08, 0, iron(), RF); // cumeeira
  // tubos de descida das calhas nas quatro quinas
  [-1, 1].forEach(s => [-1, 1].forEach(q => {
    if (s < 0 && q > 0) return; // quina da torre
    const x = s * (span + 0.02), z = q * (OZ + 0.45), h = yEave - 0.1;
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, h, 10), iron()); pipe.position.set(x, h / 2, z); pipe.castShadow = true; RF.add(pipe);
    const sh = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.3, 10), iron()); sh.rotation.x = q * 0.9; sh.position.set(x, 0.12, z + q * 0.12); RF.add(sh);
    for (let k = 1; k < 4; k++) cube(0.04, 0.03, 0.14, x, (h * k) / 4, z - q * 0.07, iron(), RF);
  }));
  // tesouras (tirante, pernas, pendural) a cada 4 m
  const beam = M.woodBeam();
  [-9, -5, -1, 3].forEach(z => {
    const t = new THREE.Group(); t.position.set(0, TOP, z); RF.add(t);
    cube(NX * 2, 0.26, 0.24, 0, 0.0, 0, beam, t);
    [-1, 1].forEach(s => { const rl = Math.hypot(NX, RISE - 0.4); const p = cube(rl, 0.24, 0.22, s * NX / 2, (RISE - 0.4) / 2, 0, beam, t); p.rotation.z = -s * Math.atan2(RISE - 0.4, NX); });
    cube(0.22, RISE - 0.5, 0.2, 0, (RISE - 0.5) / 2, 0, beam, t);
    [-1, 1].forEach(s => { const sl = cube(0.16, 2.2, 0.16, s * 1.1, 1.0, 0, beam, t); sl.rotation.z = s * 0.75; });
    // ferragem
    cube(0.3, 0.3, 0.26, 0, 0, 0, iron(), t);
  });

  // ---------- torre sineira ----------
  const T = TOWER, tx = (T.x0 + T.x1) / 2, tz = (T.z0 + T.z1) / 2, tw = T.x1 - T.x0, td = T.z1 - T.z0;
  const TG = new THREE.Group(); TG.position.set(tx, 0, tz); W.add(TG);
  const shaftH = T.h - 3.6;
  cube(tw + 0.5, FLOOR + 0.3, td + 0.5, 0, (FLOOR + 0.3) / 2, 0, conD, TG);
  const shaft = cube(tw, shaftH, td, 0, shaftH / 2, 0, con, TG); solids.push(shaft);
  // janelinhas estreitas no fuste (vidro escuro) e relógio antigo na frente
  const slitPts = pointedArch(0.45, 1.4);
  const darkGlass = glassMat('lanceta', 7);
  [[0, 3.6], [0, 6.6]].forEach(([, y]) => {
    [[0, td / 2 + 0.005, 0], [-tw / 2 - 0.005, 0, -Math.PI / 2]].forEach(([x, z, r]) => {
      const p = mesh(panelGeo(slitPts), darkGlass, x as number, y, z as number, TG); p.rotation.y = r as number; p.castShadow = false;
      const f = mesh(frameGeo(slitPts, 0.1, 0.06), trim, x as number, y, (z as number) + (r ? 0 : 0.0), TG); f.rotation.y = r as number;
    });
  });
  const clockFace = new THREE.Mesh(new THREE.CircleGeometry(0.75, 40), new THREE.MeshStandardMaterial({ color: 0x8e877a, roughness: 0.7 }));
  clockFace.position.set(0, shaftH - 1.6, td / 2 + 0.03); TG.add(clockFace);
  mesh(frameGeo(circle(0.75, 40), 0.12, 0.08), trim, 0, shaftH - 1.6, td / 2, TG);
  { const h1 = cube(0.04, 0.42, 0.02, 0, shaftH - 1.6 + 0.18, td / 2 + 0.06, iron(), TG); h1.rotation.z = -0.5; const h2 = cube(0.04, 0.6, 0.02, 0, shaftH - 1.6 + 0.25, td / 2 + 0.07, iron(), TG); h2.rotation.z = 2.4; h2.position.x = -0.2; }
  cube(tw + 0.4, 0.3, td + 0.4, 0, shaftH + 0.15, 0, trim, TG);
  // campanário: 4 faces com arco aberto
  const belPts = pointedArch(1.7, 2.6);
  for (let i = 0; i < 4; i++) {
    const f = new THREE.Group(); f.rotation.y = (i * Math.PI) / 2; TG.add(f);
    const w = i % 2 ? td : tw, d = i % 2 ? tw : td;
    const g = mesh(wallGeo(w, 3.3, 0.4, [{ pts: belPts, x: 0, y: 0.3 }]), [con, con], 0, shaftH + 0.3, d / 2 - 0.4, f); solids.push(g);
    mesh(frameGeo(belPts, 0.12, 0.06), trim, 0, shaftH + 0.6, d / 2, f);
    for (let k = 0; k < 6; k++) { const l = cube(1.6, 0.04, 0.22, 0, shaftH + 0.9 + k * 0.32, d / 2 - 0.25, M.woodBeam(), f); l.rotation.x = 0.6; } // venezianas
  }
  cube(tw + 0.5, 0.36, td + 0.5, 0, T.h + 0.18, 0, trim, TG);
  // sino
  const bellProfile = [[0, 1.0], [0.18, 0.98], [0.3, 0.9], [0.36, 0.6], [0.42, 0.3], [0.56, 0.06], [0.6, 0], [0.55, 0]].map(([x, y]) => new THREE.Vector2(x, y));
  const bell = new THREE.Mesh(new THREE.LatheGeometry(bellProfile, 24), new THREE.MeshStandardMaterial({ color: 0x5d4a30, metalness: 1, roughness: 0.5, side: THREE.DoubleSide }));
  bell.position.set(0, shaftH + 1.3, 0); bell.castShadow = true; TG.add(bell);
  cube(tw - 0.6, 0.18, 0.18, 0, shaftH + 2.4, 0, M.woodBeam(), TG);
  // pináculo de ardósia e cruz
  const spireH = 8.5;
  const spire = new THREE.Mesh(boxUV(new THREE.ConeGeometry((tw + 0.3) * 0.72, spireH, 4, 1)), slate);
  spire.rotation.y = Math.PI / 4; spire.position.set(0, T.h + 0.36 + spireH / 2, 0); spire.castShadow = spire.receiveShadow = true; TG.add(spire);
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => { const p = new THREE.Mesh(boxUV(new THREE.ConeGeometry(0.28, 1.6, 4)), slate); p.position.set(a * (tw / 2 + 0.05), T.h + 1.2, b * (td / 2 + 0.05)); p.rotation.y = Math.PI / 4; p.castShadow = true; TG.add(p); });
  const tc = new THREE.Group(); tc.position.set(0, T.h + 0.36 + spireH, 0); TG.add(tc);
  cube(0.18, 2.4, 0.18, 0, 1.1, 0, iron(), tc); cube(1.2, 0.18, 0.18, 0, 1.5, 0, iron(), tc);
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 8), brass()); ball.position.y = 0.1; tc.add(ball);

  return { walls: W, roof: RF, solids, glass, floors, doorLeaves };
}
