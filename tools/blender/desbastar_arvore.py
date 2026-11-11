# Desbaste de árvores fotorrealistas (Poly Haven) para tempo real.
# Uso:
#   blender -b --python tools/blender/desbastar_arvore.py -- entrada.gltf saida.glb [faces_folhagem] [faces_tronco]
# - Folhagem (materiais com transparência: folhas, galhinhos, agulhas): cada folha é uma "ilha" de malha.
#   Mantém só uma fração das ilhas (sorteio fixo) e aumenta as que ficam, para preservar volume e silhueta.
# - Tronco/casca: Decimate (collapse) até o orçamento de faces.
# - Cada objeto (variante) é recentrado na origem, com a base em z=0.
import bpy, sys, numpy as np

argv = sys.argv[sys.argv.index('--') + 1:]
src, dst = argv[0], argv[1]
FOL = int(argv[2]) if len(argv) > 2 else 24000
BARK = int(argv[3]) if len(argv) > 3 else 5000
# modo 'alpha': todo material com transparência é folhagem (grama, arbustos, samambaias)
ALPHA_MODE = len(argv) > 4 and argv[4] == 'alpha'

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=src, merge_vertices=True)
rng = np.random.default_rng(7)


def is_leaf(m):
    """Folhas/agulhas: sorteadas e depois simplificadas."""
    if m is None:
        return False
    n = m.name.lower()
    if ALPHA_MODE and m.blend_method != 'OPAQUE' and not any(k in n for k in ('bark', 'trunk', 'stem', 'wood')):
        return True
    return any(k in n for k in ('leaf', 'leaves', 'twig', 'needle', 'foliage')) or m.blend_method == 'BLEND'


def is_foliage(m):
    """Tudo que pode ser sorteado por ilhas (folhas e galhos finos). Ilhas grandes são sempre mantidas."""
    return is_leaf(m) or (m is not None and 'branch' in m.name.lower())

THIN_MULT = 6  # mantém 6x o orçamento de folhas e depois simplifica cada folha


def thin(o):
    me = o.data
    nv, nf, nl = len(me.vertices), len(me.polygons), len(me.loops)
    co = np.empty(nv * 3, np.float32); me.vertices.foreach_get('co', co); co = co.reshape(-1, 3)
    ls = np.empty(nf, np.int64); me.polygons.foreach_get('loop_start', ls)
    lt = np.empty(nf, np.int64); me.polygons.foreach_get('loop_total', lt)
    mi = np.empty(nf, np.int64); me.polygons.foreach_get('material_index', mi)
    lv = np.empty(nl, np.int64); me.loops.foreach_get('vertex_index', lv)
    fol_mat = np.array([is_foliage(m) for m in me.materials] or [False])
    ffol = fol_mat[mi]
    nfol = int(ffol.sum())
    print(f'  {o.name}: {nf} faces, folhagem {nfol}')
    if nfol == 0:
        return
    # componentes conexas só da folhagem (propagação de rótulos)
    lface = np.repeat(np.arange(nf), lt)
    nxt = np.arange(nl) + 1
    last = ls + lt - 1
    nxt[last] = ls
    m = ffol[lface]
    a, b = lv[m], lv[nxt][m]
    lab = np.arange(nv)
    for _ in range(200):
        old = lab.copy()
        mn = np.minimum(lab[a], lab[b])
        np.minimum.at(lab, a, mn); np.minimum.at(lab, b, mn)
        lab = lab[lab]
        if np.array_equal(old, lab):
            break
    fv = lv[ls]  # um vértice por face
    isl = lab[fv]
    ids = np.unique(isl[ffol])
    faces_per_island = nfol / max(1, len(ids))
    frac = min(1.0, FOL * THIN_MULT / nfol)
    # tamanho (faces) de cada ilha; as grandes (tronco, galhos grossos) ficam sempre
    fsz = np.zeros(nv, np.int64); np.add.at(fsz, isl[ffol], 1)
    big = ids[fsz[ids] > max(150, np.percentile(fsz[ids], 90) * 4)]
    keep_ids = ids[rng.random(len(ids)) < frac]
    keep = np.zeros(nv, bool); keep[keep_ids] = True; keep[big] = True
    print(f'    ilhas estruturais protegidas: {len(big)}')
    print(f'    ilhas {len(ids)} (~{faces_per_island:.0f} faces cada), mantendo {frac:.3f}')
    # aumenta as ilhas mantidas em torno do próprio centro
    vfol = np.zeros(nv, bool); vfol[a] = True
    bigm = np.zeros(nv, bool); bigm[big] = True
    vk = vfol & keep[lab] & ~bigm[lab]
    if frac < 1:
        k = frac ** -0.36
        sums = np.zeros((nv, 3)); cnt = np.zeros(nv)
        np.add.at(sums, lab[vk], co[vk]); np.add.at(cnt, lab[vk], 1)
        c = sums[lab[vk]] / cnt[lab[vk]][:, None]
        co[vk] = c + (co[vk] - c) * k
        me.vertices.foreach_set('co', co.ravel())
    # apaga faces de folhagem não mantidas
    dele = ffol & ~keep[isl]
    me.polygons.foreach_set('select', dele)
    me.vertices.foreach_set('select', np.zeros(nv, bool))
    me.edges.foreach_set('select', np.zeros(len(me.edges), bool))
    me.update()
    bpy.context.view_layer.objects.active = o
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_mode(type='FACE')
    bpy.ops.object.mode_set(mode='OBJECT')
    me.polygons.foreach_set('select', dele)
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.delete(type='FACE')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.mesh.delete_loose()
    bpy.ops.object.mode_set(mode='OBJECT')


def decimate_all(objs):
    """Separa por material e decima cada pedaço; orçamento dividido proporcionalmente por categoria."""
    parts = []
    for o in objs:
        bpy.ops.object.select_all(action='DESELECT')
        o.select_set(True); bpy.context.view_layer.objects.active = o
        bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.separate(type='MATERIAL'); bpy.ops.object.mode_set(mode='OBJECT')
        parts += [x for x in bpy.context.selected_objects if x.type == 'MESH']
    for leaf, budget in ((False, BARK), (True, FOL)):
        grp = [x for x in parts if x.data.materials and is_leaf(x.data.materials[0]) == leaf]
        tot = sum(len(x.data.polygons) for x in grp)
        if tot <= budget or tot == 0:
            continue
        for x in grp:
            mod = x.modifiers.new('dec', 'DECIMATE'); mod.ratio = budget / tot; mod.use_collapse_triangulate = True
            bpy.context.view_layer.objects.active = x
            bpy.ops.object.modifier_apply(modifier='dec')
        print(f'    {"folhas" if leaf else "casca"}: {tot} → {sum(len(x.data.polygons) for x in grp)}')


meshes = [o for o in bpy.data.objects if o.type == 'MESH']
for o in meshes:
    bpy.ops.object.select_all(action='DESELECT')
    o.select_set(True)
    bpy.context.view_layer.objects.active = o
    # aplica transformação e recentra na origem com a base em z=0 (Blender: Z para cima)
    o.parent = None
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    v = np.empty(len(o.data.vertices) * 3, np.float32); o.data.vertices.foreach_get('co', v); v = v.reshape(-1, 3)
    cx, cy = (v[:, 0].min() + v[:, 0].max()) / 2, (v[:, 1].min() + v[:, 1].max()) / 2
    v -= np.array([cx, cy, v[:, 2].min()], np.float32)
    o.data.vertices.foreach_set('co', v.ravel()); o.data.update()
    o.location = (0, 0, 0)
    thin(o)
decimate_all(meshes)
print('    final', sum(len(o.data.polygons) for o in bpy.data.objects if o.type == 'MESH'), 'faces')

# remove objetos vazios (nós de LOD etc.)
for o in list(bpy.data.objects):
    if o.type != 'MESH':
        bpy.data.objects.remove(o)
bpy.ops.export_scene.gltf(filepath=dst, export_format='GLB', export_apply=True, export_yup=True)
