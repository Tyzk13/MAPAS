# Catálogo de assets (Poly Haven, CC0)

**No projeto** = já está em `src/assets/` (só usar). **Reserva** = conferido na Poly Haven, ainda não
baixado: acrescente em `tools/assets.json` e rode `npm run assets`.
Uso: texturas → `pbr('<id>', { size })`; modelos → `place()` / `instance()` / `instanceVariants()`;
céus → campo `hdr` de um clima em `src/core/sky.ts`.

## Texturas

| Uso | No projeto (tamanho sugerido em m) | Reserva |
|---|---|---|
| Concreto de fachada | `concrete_wall_008` (3.4, cinza claro c/ marca de fôrma), `concrete_wall_006` (3.2, escuro), `concrete_wall_004` (2.2, base/rodapé) | `concrete_wall_007`, `concrete_moss`, `cracked_concrete`, `concrete_block_wall` |
| Reboco interno | `grey_plaster` (3) | `plastered_wall_04` (liso), `worn_plaster_wall` (descascado), `damaged_plaster`, `white_plaster_rough_01` |
| Madeira escura (portas, vigas, lambri) | `dark_wooden_planks` (2–3) | `dark_planks`, `wood_planks_dirt`, `medieval_wood` |
| Madeira de móvel (bancos, mesas) | `dark_wood` (1.4) | `wood_table_worn`, `lacquered_cherry_wood` |
| Madeira gasta / galpão | `weathered_brown_planks` (2) | `weathered_planks`, `raw_plank_wall`, `wood_peeling_paint_weathered` |
| Piso de madeira | `old_wooden_floor_02` (2.6) | `wood_floor_worn`, `old_wooden_floor_01`, `brown_planks_09` |
| Piso de pedra | `monastery_stone_floor` (2.5) | `marble_tiles`, `stone_tiles_02`, `floor_tiles_06` |
| Azulejo / hospital / banheiro | — | `long_white_tiles`, `dirty_tiles`, `interior_tiles`, `square_tiles_02`, `large_grey_tiles` |
| Telhado | `roof_slates_02` (2.2, ardósia) | `grey_roof_tiles`, `clay_roof_tiles_02`, `red_slate_roof_tiles_01`, `roof_planks` |
| Grama / chão de mata | `leafy_grass` (3, base), `sparse_grass`, `forest_ground_04` (2.5), `brown_mud_leaves_01` (2.6) | `forest_leaves_02`, `leaves_forest_ground`, `mud_forest`, `grass_path_2` |
| Caminho / calçamento | `grey_stone_path` (2.4) | `cobblestone_floor_08`, `mossy_cobblestone`, `concrete_pavers`, `brick_pavement` |
| Cascalho / asfalto | `gravel_floor_02` (2.2) | `gravel_road`, `worn_asphalt`, `asphalt_02` |
| Tecido (usar com `map:false` + cor) | `quatrefoil_jacquard_fabric` (0.5) | `fabric_pattern_05`, `denim_fabric` |
| Metal / ferrugem | `rusty_metal_02` (1.5) | `rusty_metal_sheet`, `green_metal_rust`, `metal_plate` |
| Tijolo (se o mapa pedir) | — | `brick_wall_001`, `church_bricks_02`, `dark_brick_wall` |

## Céus (HDRI "puresky" = só céu, sem chão)

| Clima | No projeto | Reserva |
|---|---|---|
| Terror (nublado quase noite) | `overcast_soil_puresky` (escurecido e frio) | `kloppenheim_01_puresky` |
| Anoitecer nublado | `kloppenheim_07_puresky` | `kloofendal_misty_morning_puresky` |
| Crepúsculo | `qwantani_dusk_2_puresky` | `qwantani_dusk_1_puresky`, `belfast_sunset_puresky` |
| Nublado de dia | `kloofendal_overcast_puresky` | `overcast_soil_puresky` (claro) |
| Noite | `qwantani_night_puresky` | `qwantani_moonrise_puresky` |
| Interiores | — | `abandoned_garage`, `lythwood_room` (só reflexo) |

## Modelos (todos já reduzidos para tempo real)

| Categoria | No projeto | Reserva |
|---|---|---|
| Árvores | `island_tree_01..03`, `tree_small_02`, `jacaranda_tree` (+ `_lod1`), `fir_tree_01` (3 variantes, floresta) | `pine_tree_01` (pesado demais; evite), `fir_sapling` |
| Arbustos / plantas | `shrub_01..04`, `fern_02`, `nettle_plant`, `grass_medium_01`, `moss_01` (cerca-viva) | `weed_plant_02`, `dandelion_01`, `periwinkle_plant` |
| Troncos / pedras | `dead_tree_trunk`, `tree_stump_01`, `root_cluster_01`, `rock_moss_set_01`, `boulder_01`, `dry_branches_medium_01` | `dead_tree_trunk_02`, `stone_01`, `namaqualand_boulder_02` |
| Iluminação | `Chandelier_03` (velas), `lantern_chandelier_01`, `street_lamp_01`, `wooden_lantern_01`, `Lantern_01`, `brass_candleholders` | `Chandelier_01`, `industrial_wall_lamp`, `caged_hanging_light`, `mounted_fluorescent_lights` (hospital/escritório), `vintage_oil_lamp`, `wooden_candlestick` |
| Móveis | `WoodenChair_01`, `GothicCabinet_01`, `painted_wooden_bench` | `GothicBed_01`, `gothic_coffee_table`, `vintage_cabinet_01`, `wooden_bookshelf_worn`, `metal_office_desk`, `old_bed_frame`, `wheelchair_01`, `SchoolDesk_01` |
| Exterior / props | `large_iron_gate`, `covered_car`, `gothic_statue`, `wine_barrel_01`, `wooden_crate_01`, `planter_pot_clay` | `wooden_picnic_table`, `security_light`, `fire_hydrant`, `water_manhole_cover`, `metal_trash_can`, `old_tyre`, `concrete_road_barrier`, `modular_chainlink_fence` |
| Clima de terror (objetos) | — | `vintage_telephone_wall_clock`, `vintage_grandfather_clock_01`, `old_gas_mask`, `wooden_ladder`, `rusted_spade_01`, `vintage_suitcase`, `ornate_mirror_01`, `fancy_picture_frame_01` |

## Feito em código (não há CC0 bom) — reutilize de `src/maps/igreja/`

Paredes com vãos e janelas ogivais (`wallGeo`, `pointedArch`, `roundArch`, `frameGeo`), vitrais
(`stainedGlass`), bancos de igreja (`pewGeometry`), rosas brancas (`roseGeometry`), quadros antigos
(`oldPainting`), telhado com tesouras, torre com sino, varais de lampadinhas (`garland` em grounds.ts),
gramado (`grassField`), poças, névoa, poeira, feixes de luz.

## Acrescentados no mapa do México (testados)

| Uso | Id (tamanho sugerido em m) | Observação |
|---|---|---|
| Fachada pintada (tingir por cor de vértice) | `painted_plaster_wall` (2.6) | base de todas as casas; ruína: mesmo id com `normalScale` 1.6 e mais sujeira |
| Tijolo aparecendo sob reboco | `rough_plaster_brick` (2.2) | escuro; clarear com cor |
| Telha de barro | `clay_roof_tiles_02` (1.8) | coreto, toldos, cúpulas |
| Rua de paralelepípedo | `cobblestone_floor_08` (2.2) | |
| Piso de lajota | `terracotta_floor_tiles` (2.4) | praça, igreja, mercado |
| Terreno de deserto | `dry_ground_01` (3.2) base, `sandy_gravel` (2.4), `dry_ground_rocks` (3) | estradas de terra pela máscara R |
| Arbusto do deserto | `searsia_lucida` (desbastado 9k), `wild_rooibos_bush` (3,5k) | só média/alta para o searsia |
| Pedra grande | `namaqualand_boulder_02` (simplificar 0.06 → 6k) | poucas; o resto em código |
| Props | `plastic_monobloc_chair_01` (3k), `propane_tank`, `rollershutter_door` (3,08 m de largura → escala 0.84), `street_lamp_02` (lanterna de parede, 2,6k após simplificar), `caged_hanging_light`, `Barrel_01`, `WoodenTable_01` (baixa: escala y 1.35), `metal_trash_can`, `old_tyre`, `trashbag` | |
| Descartados | `modular_electricity_poles` (200k, peças soltas), `othonna_cerarioides`, `wooden_candlestick` (212k), `dead_quiver_trunk` (2 m, fino), `boulder_01` espalhado, `wooden_crate_02`, `ceramic_vase_03` | fazer em código |
