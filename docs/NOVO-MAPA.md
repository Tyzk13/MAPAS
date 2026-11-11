# Como adicionar um mapa novo

Cada mapa é um módulo em `src/maps/` com uma função `build(M)`. O núcleo (`src/core/`) cuida de
render, câmera, clima, personagens, caminhar, rede e exportação — **não é preciso mexer nele**.

## 1. Criar o módulo

`src/maps/meu-mapa.ts` (ou uma pasta `src/maps/meu-mapa/index.ts` para mapas grandes, como a igreja):

```ts
import * as THREE from 'three';
import type { MapRuntime } from '../core/types';
import { begin, halo } from '../core/kit';
import { makeTerrain } from '../core/terrain';
import { pbr, boxUV } from '../core/pbr';
import { place, instance, instanceVariants } from '../core/models';

export async function build(M: MapRuntime) {
  begin(M);                       // obrigatório: liga o kit (halo, PL…) a este mapa
  const G = M.G;                  // tudo do mapa vai dentro de M.G

  // chão: terreno com 3 materiais misturados + colisor leve
  const ter = makeTerrain({ size: 120, seg: 120, height: () => 0, mask: () => [0, 0],
    base: { id: 'sparse_grass', size: 3 }, r: { id: 'forest_ground_04', size: 2.5 }, g: { id: 'brown_mud_leaves_01', size: 2.5 } });
  G.add(ter.mesh, ter.collider);
  M.walk.push(ter.collider);      // superfícies onde personagens pisam (raycast)

  // peça com material PBR (UVs em metros)
  const parede = new THREE.Mesh(boxUV(new THREE.BoxGeometry(6, 3, 0.3)), pbr('concrete_wall_006', { size: 3 }));
  parede.position.set(0, 1.5, -4); parede.castShadow = parede.receiveShadow = true; G.add(parede);

  // modelos .glb (src/assets/models)
  await place('wooden_crate_01', 1, 0, 0, 0.3, 1, G);
  await instance('fir_tree_01', [{ x: 20, y: 0, z: 5 }, { x: -18, y: 0, z: 9, s: 1.2 }], G, { variant: 0 });

  // luz que acende com os climas noturnos: n = intensidade (candelas) quando acesa
  const l = new THREE.PointLight(0xffa860, 0, 0, 2); l.position.set(0, 2.5, 0); G.add(l);
  M.lights.push({ l, d: 0, n: 8 }); halo(0, 2.5, 0, 1);

  // obrigatório: vistas (a 1ª é a inicial)
  M.views = [{ n: 'Geral', p: [0, 15, 20], t: [0, 0, 0] }, { n: 'Tática', p: [0, 40, 0.1], t: [0, 0, 0] }];

  // opcionais
  M.solid = () => [parede];                         // colisão ao caminhar
  M.layers = [{ n: 'Paredes', o: parede, v: true }]; // botões em "Camadas"
  M.spawn = i => ({ x: i * 1.2, z: 2 });             // onde os personagens aparecem
  M.walkStart = { x: 0, z: 5 };
  M.shadowRadius = 30;                               // área coberta pela sombra do sol (m)
  M.vtt = {
    areas: [{ n: 'Mapa todo', b: [-20, 20, -20, 20], lv: 1 }],   // [xmin, xmax, zmin, zmax]
    walls: [[[-3, -4.15], [3, -4.15]]],                         // linhas de visão (x, z)
    portals: [],                                                // portas: {p, a, b}
    lights: [[0, 0, 6, 0.8, 'ffa860']],                         // [x, z, alcance, intensidade, cor]
  };
  M.exportHide = () => [];                           // o que esconder na imagem vista de cima
  M.tick = (dt, t) => {};                            // animação a cada quadro
}
```

## 2. Registrar no manifesto

Em `src/maps/manifest.ts`, uma linha:

```ts
meuMapa: { id: 'meuMapa', n: 'Meu mapa', build: async M => (await import('./meu-mapa')).build(M) },
```

Pronto: o botão **Mapa** passa a alternar para ele, e `?map=meuMapa` abre direto nele. O
`postMessage({cmd:'map', id:'meuMapa'})` também funciona.

## 3. Conferir com capturas

Defina vistas com os nomes usados pelo script (ou passe outros) e rode:

```bash
npm run capturas -- teste --map=meuMapa
```

## Efeitos prontos para usar

| Função | Arquivo | Para quê |
|---|---|---|
| `instance(id, lista, G, { wind })` | `core/models.ts` | espalhar modelos; `wind: { amp, freq, flutter }` faz balançar (sombra acompanha) |
| `grassField({ count, area, allow, height })` | `core/grass.ts` | gramado denso de touceiras com vento |
| `makeTerrain({ … })` | `core/terrain.ts` | chão com 3 materiais misturados por máscara + colisor leve |
| `pbr(id, { size })` / `boxUV(geo)` | `core/pbr.ts` | material PBR da Poly Haven com UV em metros |
| `weather(material)` | `core/weathering.ts` | sujeira, musgo e escorridos em fachadas |
| `EnvProbe` | `core/probe.ts` | reflexo/luz rebatida própria de um interior |
| `dustMotes(caixa)` / `lightShaft(…)` | `core/anim.ts` | poeira no ar e feixes de luz |
| `halo(x, y, z, tamanho)` | `core/kit.ts` | brilho em volta de lâmpadas (some de dia) |

Animação por quadro: `M.tick = (dt, t) => { … }`. Efeitos de shader usam `anim.time` (já atualizado
pelo núcleo). Nas capturas automáticas o tempo é fixo, para as imagens serem comparáveis.

## Unidades e convenções

- 1 unidade = 1 metro = 1 quadrado da grade. O chão fica em y = 0; frente do mapa = +z.
- Intensidades de luz em unidades físicas (candelas para luzes pontuais, decaimento 2).
- Malhas com `userData.ns = 1` não ganham sombra automática; `userData.canopy = 1` some na exportação
  VTT (copas de árvore), a menos que a opção "Mostrar copas" esteja marcada.

## Assets

- Texturas PBR: `src/assets/textures/<id>/{diff,nor,arm}.webp` → `pbr('<id>', { size })`.
- Modelos: `src/assets/models/<id>.glb` (Meshopt + WebP) → `place()`, `instance()`, `instanceVariants()`.
- HDRIs: `src/assets/hdri/<id>_1k.hdr` (usados pelos climas em `src/core/sky.ts`).
- Para baixar novos da Poly Haven: acrescente em `tools/assets.json` e rode `npm run assets`
  (os créditos em `CREDITS.md` são atualizados sozinhos). Modelos pesados: `tools/orcamento.sh`.

## Importar um .glb pronto (botão "Importar 3D")

Também é possível abrir um `.glb` do computador como mapa, sem programar. Convenção de nomes das peças
(nome do objeto no Blender/glTF, sem diferenciar maiúsculas):

| Nome contém | Efeito |
|---|---|
| `floor`, `piso`, `chao`, `chão`, `ground`, `terreno`, `walk` | personagens pisam aqui (se nenhuma peça tiver esses nomes, todas servem de chão) |
| `wall`, `parede`, `solid`, `colis` | colide ao caminhar |
| `roof`, `telhado`, `teto`, `ceiling`, `cobertura` | vai para a camada "Telhado" (escondida por padrão e na exportação VTT) |

Use metros, Y para cima, frente para +Z. Compressão Meshopt é aceita.
