# Prepara as imagens dos personagens do Sul de Arton: lê os ids usados em src/maps/arton/npcs.ts (listas L('a1', [..])
# e nomes soltos como 'm11', 'b1-17'), pega o recorte em npcs-local/arton/cortes/<folha>/<id>.png, reduz para 300 px de
# altura e grava WebP em npcs-local/arton/usar/ (pasta fora do git; o build embute essas imagens no código).
# Uso: python3 -I tools/npcs-arton.py
import os, re, glob
from PIL import Image
raiz = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src = open(os.path.join(raiz, 'src/maps/arton/npcs.ts'), encoding='utf8').read()
ids = set(re.findall(r"'([mvws]\d\d|[abc]\d-\d\d)'", src))
for pre, ns in re.findall(r"L\('([abc]\d)', \[([\d, ]+)\]\)", src):
    ids |= {f'{pre}-{int(k):02d}' for k in ns.split(',')}
out = os.path.join(raiz, 'npcs-local/arton/usar'); os.makedirs(out, exist_ok=True)
for f in glob.glob(os.path.join(out, '*.webp')): os.remove(f)
ok = 0; falta = []
for i in sorted(ids):
    pasta = i[0] if '-' in i else i[0]
    cand = glob.glob(os.path.join(raiz, f'npcs-local/arton/cortes/{pasta}/{i}.png'))
    if not cand: falta.append(i); continue
    im = Image.open(cand[0]).convert('RGBA')
    if im.height > 300: im = im.resize((max(1, round(im.width * 300 / im.height)), 300), Image.LANCZOS)
    im.save(os.path.join(out, i + '.webp'), 'WEBP', quality=82, method=6); ok += 1
tot = sum(os.path.getsize(f) for f in glob.glob(os.path.join(out, '*.webp')))
print(ok, 'imagens,', round(tot / 1024), 'KB; faltando:', falta)
