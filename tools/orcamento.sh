#!/usr/bin/env bash
# Reduz modelos pesados para um orçamento de triângulos (depois de `npm run assets`).
#  - vegetação (folhas com transparência): desbaste por ilhas no Blender (tools/blender/desbastar_arvore.py, modo alpha)
#  - objetos sólidos: simplificação do meshoptimizer (gltf-transform simplify)
set -euo pipefail
cd "$(dirname "$0")/.."
B="${BLENDER:-blender}"
mkdir -p assets-src/thin
opt() { npx gltf-transform optimize "$1" "$2" --compress meshopt --texture-compress webp --texture-size "$3" --simplify false --join true --instance false >/dev/null; }
# id  folhas  tronco  textura
while read -r id f b t; do
  [ -z "$id" ] && continue
  "$B" -b --python tools/blender/desbastar_arvore.py -- "assets-src/models/$id/$id.gltf" "assets-src/thin/$id.glb" "$f" "$b" alpha > "assets-src/thin/$id.log" 2>&1
  opt "assets-src/thin/$id.glb" "src/assets/models/$id.glb" "$t"
  echo "✓ vegetação $id  $(grep 'final' assets-src/thin/$id.log | awk '{print $2}') faces"
done <<'LIST'
grass_medium_01 900 100 512
shrub_01 5000 1200 512
shrub_02 3500 800 512
shrub_03 3000 800 512
shrub_04 3500 800 512
nettle_plant 2000 400 512
fern_02 1500 300 512
LIST
# id  razão  textura
while read -r id r t; do
  [ -z "$id" ] && continue
  npx gltf-transform simplify "assets-src/models/$id/$id.gltf" "assets-src/thin/$id.glb" --ratio "$r" --error 0.004 >/dev/null
  opt "assets-src/thin/$id.glb" "src/assets/models/$id.glb" "$t"
  echo "✓ sólido $id (razão $r)"
done <<'LIST'
root_cluster_01 0.015 512
rock_moss_set_01 0.07 1024
boulder_01 0.06 512
dead_tree_trunk 0.06 512
tree_stump_01 0.08 512
dry_branches_medium_01 0.2 512
Lantern_01 0.15 512
street_lamp_01 0.2 512
brass_candleholders 0.3 512
LIST
