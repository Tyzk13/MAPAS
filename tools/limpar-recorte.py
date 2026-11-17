# Limpeza depois do tools/recorte.py (usada nas fichas de Greywater e nos jogadores).
# Uso: python3 -I tools/limpar-recorte.py arquivo.png [--pe] [--entre-pernas] [--chao-escuro]
#   (sempre) mantém só o maior pedaço da figura (tira fumaça, respingos, sobras do fundo)
#   --pe            apaga sombra branca/cinza neutra nos 10% de baixo (cuidado com tênis branco)
#   --entre-pernas  apaga áreas brancas neutras grandes na metade de baixo (o vão entre as pernas)
#   --chao-escuro   figura escura em fundo escuro com chão: a partir do transparente, apaga pixels escuros
#                   com limiar que cresce para baixo (o chão é mais claro que o fundo)
import sys
import numpy as np
from PIL import Image
from collections import deque

f = sys.argv[1]; op = set(sys.argv[2:])
a = np.array(Image.open(f).convert('RGBA')); h, w = a.shape[:2]
viz = ((1, 0), (-1, 0), (0, 1), (0, -1))

def componentes(m):
    lab = np.zeros((h, w), np.int32); n = 0; tam = [0]
    for y in range(h):
        for x in range(w):
            if m[y, x] and not lab[y, x]:
                n += 1; q = deque([(y, x)]); lab[y, x] = n; c = 0
                while q:
                    yy, xx = q.popleft(); c += 1
                    for dy, dx in viz:
                        ny, nx = yy + dy, xx + dx
                        if 0 <= ny < h and 0 <= nx < w and m[ny, nx] and not lab[ny, nx]: lab[ny, nx] = n; q.append((ny, nx))
                tam.append(c)
    return lab, tam

rgb = a[..., :3].astype(int)
if '--chao-escuro' in op:
    lum = rgb.max(2); thr = np.clip((np.arange(h) - h * 0.55) / (h * 0.2), 0, 1) * 44
    cand = lum < thr[:, None]; bg = a[..., 3] <= 40; q = deque(zip(*np.nonzero(bg)))
    while q:
        y, x = q.popleft()
        for dy, dx in viz:
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w and not bg[ny, nx] and cand[ny, nx]: bg[ny, nx] = True; q.append((ny, nx))
    a[..., 3][bg] = 0
if '--pe' in op:
    y0 = int(h * 0.9); n = (rgb[y0:].min(2) > 205) & ((rgb[y0:].max(2) - rgb[y0:].min(2)) < 22); a[y0:, :, 3][n] = 0
if '--entre-pernas' in op:
    b = (rgb.min(2) > 212) & ((rgb.max(2) - rgb.min(2)) < 20) & (a[..., 3] > 40); b[:int(h * 0.45)] = False
    lab, tam = componentes(b)
    for i, t in enumerate(tam):
        if i and t > 120: a[..., 3][lab == i] = 0
lab, tam = componentes(a[..., 3] > 40); maior = max(tam)
a[..., 3][~np.isin(lab, [i for i, t in enumerate(tam) if i and t > maior * 0.02])] = 0
o = Image.fromarray(a); o.crop(o.getbbox()).save(f)
print(f, 'ok')
