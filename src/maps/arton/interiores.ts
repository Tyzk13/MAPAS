// (provisório) cenas de bolso: preenchido logo abaixo
import * as THREE from 'three';
import type { MapRuntime, View } from '../../core/types';
export function construirInteriores(_G: THREE.Group, _M: MapRuntime) {
  return { vistas: [] as View[], pisos: [] as THREE.Object3D[], solidos: [] as THREE.Object3D[], luzes: [] as { x: number; y: number; z: number; cor: number; n: number; dist: number }[], halos: [] as [number, number, number, number][], anim: [] as ((t: number) => void)[], areasVtt: [] as { n: string; b: [number, number, number, number]; lv: number }[], paredesVtt: [] as [number, number][][] };
}
export const dentroDeInterior = (p: THREE.Vector3) => p.y < -60;
