// Exportar para mesa virtual (VTT): PNG visto de cima + Universal VTT (.dd2vtt) com paredes, portas e luzes.
import * as THREE from 'three';
import { R, S, cv, fit } from './engine';
import { st, $ } from './state';
import { hemi, sun, dome } from './sky';
import { helpers } from './tokens';

export function fillAreas() {
  $('xa').innerHTML = st.MP!.vtt.areas.map((x, i) => '<option value="' + i + '">' + x.n + '</option>').join('');
  xinfo();
}
export function xcalc(areaIdx?: number, ppgIn?: number) {
  const A = st.MP!.vtt.areas[areaIdx ?? (+$('xa').value || 0)], b = A.b, Wd = +(b[1] - b[0]).toFixed(3), Hd = +(b[3] - b[2]).toFixed(3);
  const mx = Math.min(8192, R.capabilities.maxTextureSize || 4096);
  let g = ppgIn ?? (+$('xp').value || 70);
  g = Math.max(20, Math.floor(Math.min(g, mx / Wd, mx / Hd, Math.sqrt(24e6 / (Wd * Hd)))));
  return { A, b, ppg: g, Wd, Hd, w: Math.round(Wd * g), h: Math.round(Hd * g) };
}
function xinfo() { const c = xcalc(); $('xi').textContent = c.Wd + '×' + c.Hd + ' quadrados · ' + c.w + '×' + c.h + ' px (' + c.ppg + ' px por quadrado)'; }

export function xrender(c: ReturnType<typeof xcalc>, opt: { canopy?: boolean; shadows?: boolean } = {}) {
  const M = st.MP!, b = c.b, cx = (b[0] + b[1]) / 2, cz = (b[2] + b[3]) / 2;
  const oc = new THREE.OrthographicCamera(-c.Wd / 2, c.Wd / 2, c.Hd / 2, -c.Hd / 2, 0.1, 300);
  oc.position.set(cx, 120, cz); oc.up.set(0, 0, -1); oc.lookAt(cx, 0, cz);
  const hid: THREE.Object3D[] = [], hide = (o: THREE.Object3D) => { if (o.visible) { o.visible = false; hid.push(o); } };
  const sv = { fog: S.fog, bg: S.background, ex: R.toneMappingExposure, hi: hemi.intensity, si: sun.intensity, sc: sun.castShadow, sp: sun.position.clone(), pr: R.getPixelRatio(), tm: R.toneMapping, ei: S.environmentIntensity, ly: M.layers.map(l => l.o.visible), lf: M.loft ? M.loft.visible : null };
  try {
    const shown: THREE.Object3D[] = []; M.G.traverse(o => { if (o.userData.autoHide && !o.visible) { o.visible = true; shown.push(o); } });
    for (const k in st.T) hide(st.T[k].g);
    [...helpers, dome].forEach(hide); M.mist.forEach(hide); M.halos.forEach(hide); M.lights.forEach(q => hide(q.l));
    M.G.traverse(o => { if ((o as any).isPointLight || (o as any).isSpotLight || (o as any).isRectAreaLight || o.userData.noExport || (o as any).isSprite || (o as any).isPoints) hide(o); });
    M.layers.forEach(l => { if (/Telhado/.test(l.n)) l.o.visible = false; });
    if (M.loft) M.loft.visible = c.A.lv === 2;
    M.exportHide().forEach(hide);
    if (!opt.canopy) M.G.traverse(o => { if (o.userData.canopy) hide(o); });
    S.fog = null; S.background = new THREE.Color(0x101010); R.toneMappingExposure = 1.25; R.toneMapping = THREE.ACESFilmicToneMapping; S.environmentIntensity = 0.9;
    hemi.intensity = Math.PI; sun.intensity = 0.5 * Math.PI; sun.position.set(-20, 80, 12); sun.castShadow = !!opt.shadows;
    R.setPixelRatio(1); R.setSize(c.w, c.h, false); R.render(S, oc);
    return cv.toDataURL('image/png');
  } finally {
    hid.forEach(o => { o.visible = true; });
    M.layers.forEach((l, i) => { l.o.visible = sv.ly[i]; });
    if (M.loft) M.loft.visible = sv.lf!;
    S.fog = sv.fog; S.background = sv.bg; R.toneMappingExposure = sv.ex; R.toneMapping = sv.tm; S.environmentIntensity = sv.ei; hemi.intensity = sv.hi; sun.intensity = sv.si; sun.castShadow = sv.sc; sun.position.copy(sv.sp);
    fit();
  }
}

/** Recorta uma polilinha no retângulo [x0,x1]×[z0,z1] (Liang–Barsky); devolve os trechos que ficam dentro. */
function clipPolyline(pts: [number, number][], x0: number, x1: number, z0: number, z1: number) {
  const out: [number, number][][] = []; let cur: [number, number][] = [];
  const push = (p: [number, number]) => { const l = cur[cur.length - 1]; if (!l || Math.hypot(l[0] - p[0], l[1] - p[1]) > 1e-6) cur.push(p); };
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, az] = pts[i], [bx, bz] = pts[i + 1], dx = bx - ax, dz = bz - az;
    let t0 = 0, t1 = 1, ok = true;
    for (const [p, q] of [[-dx, ax - x0], [dx, x1 - ax], [-dz, az - z0], [dz, z1 - az]] as [number, number][]) {
      if (Math.abs(p) < 1e-12) { if (q < 0) { ok = false; break; } continue; }
      const r = q / p; if (p < 0) { if (r > t1) { ok = false; break; } if (r > t0) t0 = r; } else { if (r < t0) { ok = false; break; } if (r < t1) t1 = r; }
    }
    if (!ok) { if (cur.length > 1) out.push(cur); cur = []; continue; }
    const A: [number, number] = [ax + dx * t0, az + dz * t0], B: [number, number] = [ax + dx * t1, az + dz * t1];
    if (t0 > 0 && cur.length) { if (cur.length > 1) out.push(cur); cur = []; }
    push(A); push(B);
    if (t1 < 1) { if (cur.length > 1) out.push(cur); cur = []; }
  }
  if (cur.length > 1) out.push(cur);
  return out;
}

/** Monta o JSON Universal VTT (formato 0.3) para a área calculada. */
export function dd2vtt(c: ReturnType<typeof xcalc>, png: string) {
  const b = c.b, VT = st.MP!.vtt;
  const inb = (q: readonly any[]) => q[0] >= b[0] - 2 && q[0] <= b[1] + 2 && q[1] >= b[2] - 2 && q[1] <= b[3] + 2;
  const P = (q: readonly any[]) => ({ x: +(q[0] - b[0]).toFixed(3), y: +(q[1] - b[2]).toFixed(3) });
  return {
    format: 0.3,
    resolution: { map_origin: { x: 0, y: 0 }, map_size: { x: c.Wd, y: c.Hd }, pixels_per_grid: c.ppg },
    line_of_sight: VT.walls.flatMap(w => clipPolyline(w, b[0], b[1], b[2], b[3])).map(w => w.map(P)),
    objects_line_of_sight: [],
    portals: VT.portals.filter(q => inb(q.p)).map(q => ({ position: P(q.p), bounds: [P(q.a), P(q.b)], rotation: 0, closed: true, freestanding: false })),
    environment: { baked_lighting: true, ambient_light: 'ffffffff' },
    // cores no formato AARRGGBB (o importador do Foundry descarta os 2 primeiros caracteres)
    lights: VT.lights.filter(inb).map(l => ({ position: P(l), range: l[2], intensity: l[3], color: 'ff' + l[4], shadows: true })),
    image: png.split(',')[1],
  };
}

function dl(name: string, href: string) { const a = document.createElement('a'); a.href = href; a.download = name; document.body.appendChild(a); a.click(); a.remove(); }

export function initVtt() {
  $('bx').onclick = () => { fillAreas(); $('exp').hidden = false; };
  $('xx').onclick = () => { $('exp').hidden = true; };
  $('xa').onchange = xinfo; $('xp').onchange = xinfo;
  const opt = () => ({ canopy: $('xc').checked, shadows: $('xs').checked });
  $('xpng').onclick = () => { const c = xcalc(); dl(st.MP!.id + '-' + c.w + 'x' + c.h + '.png', xrender(c, opt())); };
  $('xvtt').onclick = () => {
    const c = xcalc(), j = dd2vtt(c, xrender(c, opt()));
    dl(st.MP!.id + '-' + c.w + 'x' + c.h + '.dd2vtt', URL.createObjectURL(new Blob([JSON.stringify(j)], { type: 'application/json' })));
  };
}
