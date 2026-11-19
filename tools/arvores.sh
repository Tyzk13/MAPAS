#!/usr/bin/env bash
# Desbasta as árvores (Blender) e otimiza (gltf-transform). Gera <id>.glb (perto) e <id>_lod1.glb (longe).
# Requer: assets baixados (npm run assets) e Blender (variável BLENDER ou no PATH).
set -euo pipefail
cd "$(dirname "$0")/.."
B="${BLENDER:-blender}"
mkdir -p assets-src/thin src/assets/models
# id  folhas_LOD0 casca_LOD0 folhas_LOD1 casca_LOD1
while read -r id f0 b0 f1 b1; do
  [ -z "$id" ] && continue
  src="assets-src/models/$id/$id.gltf"
  for lod in 0 1; do
    if [ $lod = 0 ]; then f=$f0; b=$b0; out=$id; else f=$f1; b=$b1; out=${id}_lod1; fi
    "$B" -b --python tools/blender/desbastar_arvore.py -- "$src" "assets-src/thin/$out.glb" "$f" "$b" > "assets-src/thin/$out.log" 2>&1
    tsz=1024; [ $lod = 1 ] && tsz=512
    npx gltf-transform optimize "assets-src/thin/$out.glb" "src/assets/models/$out.glb" --compress meshopt --texture-compress webp --texture-size $tsz --simplify false --join true --instance false >/dev/null
    echo "✓ $out  $(grep 'final' assets-src/thin/$out.log | awk '{print $2}') faces  $(du -h src/assets/models/$out.glb | cut -f1)"
  done
done <<'LIST'
island_tree_01 30000 8000 5000 1500
island_tree_02 30000 8000 5000 1500
island_tree_03 30000 8000 5000 1500
tree_small_02 30000 8000 5000 1500
jacaranda_tree 36000 9000 6000 1800
fir_tree_01 90000 15000 15000 3000
LIST

# floresta distante: 3º nível (bem leve) só para o abeto
"$B" -b --python tools/blender/desbastar_arvore.py -- assets-src/models/fir_tree_01/fir_tree_01.gltf assets-src/thin/fir_tree_01_lod2.glb 3600 900 > assets-src/thin/fir_tree_01_lod2.log 2>&1
npx gltf-transform optimize assets-src/thin/fir_tree_01_lod2.glb src/assets/models/fir_tree_01_lod2.glb --compress meshopt --texture-compress webp --texture-size 256 --simplify false --join true --instance false >/dev/null
echo "✓ fir_tree_01_lod2"
