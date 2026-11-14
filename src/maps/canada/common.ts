// Greywater Falls, Ontário (novembro de 1965) — cidade de fábrica de papel à beira de um rio escuro.
// Planta em metros (1 quadrado = 1 m; chão y=0; +z = sul). Reaproveita materiais, lote (Batch), casca de prédio,
// placas e luzes pedidas do mapa do Texas.
export { Batch, mtx, rnd, reseed, pick, sm, sign, signTexture, lod, Q, TM, shell, gableRoof, bxM, light, LREQ, neonTexture, rect } from '../texas/common';

// ---------- planta ----------
/** Main Street corre norte–sul em x = 0; as lojas começam em |x| = ROW0 */
export const ROW0 = 10.5, ROWD = 14;
/** ruas transversais (eixo z) */
export const KING = -40, QUEEN = 30;
/** ruas residenciais norte–sul */
export const ELM = -64, BIRCH = 64, CEDAR = 104;
/** ruas residenciais leste–oeste (cortadas pelo centro comercial) */
export const MAPLE = -84, SPRUCE = 84;
/** extensão das ruas */
export const EXT = 130, NORTH = -108, SOUTH = 128;
/** rio (corre leste–oeste ao norte da cidade) */
export const RIVER = { z: -128, w: 26, y: -2.2 };
export const riverZ = (x: number) => RIVER.z + Math.sin(x * 0.018 + 0.6) * 5 + Math.sin(x * 0.047) * 1.6;
/** ferrovia e estação (sul) */
export const RAIL = 142;
export const STATION = { x0: 16, x1: 36, z0: 130, z1: 137 };
/** Hotel Laurentian: esquina da Main St com a King St, lado leste; fachada principal para a Main St (oeste) */
export const HOTEL = { x0: ROW0, x1: ROW0 + 20, z0: KING + 8, z1: KING + 34 };
/** Necrotério do distrito: Queen St, lado oeste; frente para a rua (norte) */
export const MORGUE = { x0: -44, x1: -26, z0: QUEEN + 8, z1: QUEEN + 24 };
/** Igreja anglicana de St. Columba e cemitério (oeste da King St) */
export const CHURCH = { x: -96, z: -64, w: 11, d: 22 };
export const CEMETERY = { x0: -126, x1: -104, z0: -76, z1: -48 };
/** casa da Elm Street — onde Margaret Ashdown morreu (dezembro de 1964) */
export const ASHDOWN = { x: ELM - 12, z: -8 };
/** fábrica de papel (outro lado do rio) */
export const MILL = { x0: 18, x1: 74, z0: -196, z1: -162 };
/** posto e lanchonete na Queen St leste */
export const GAS = { x: 46, z: QUEEN + 14 };
export const DINER = { x0: 82, x1: 98, z0: QUEEN + 8, z1: QUEEN + 18 };
export type { Opening } from '../texas/common';
