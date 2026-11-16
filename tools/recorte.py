# Uso: python3 -I tools/recorte.py entrada.png saida.png x0 y0 x1 y1 TOL [TOL2]
#   TOL: diferença máxima para o pixel VIZINHO (segue degradê; 3–10). TOL2 (opcional): 2ª passada contra o fundo
#   estimado por linha (20–45). Redimensione antes para ~700–800 px de altura (é BFS em Python).
# recorte por crescimento de região: o fundo se espalha comparando cada pixel com o VIZINHO (segue degradê)
import sys, numpy as np
from PIL import Image, ImageFilter
from collections import deque
src, out, x0, y0, x1, y1, tol = sys.argv[1], sys.argv[2], *map(int, sys.argv[3:7]), float(sys.argv[7])
im = Image.open(src).convert('RGB').crop((x0, y0, x1, y1))
a = np.asarray(im.filter(ImageFilter.GaussianBlur(1.2))).astype(np.float32)
h, w, _ = a.shape; bg = np.zeros((h, w), bool); q = deque()
for x in range(w): q.append((0, x)); q.append((h - 1, x))
for y in range(h): q.append((y, 0)); q.append((y, w - 1))
for p in q: bg[p] = True
while q:
    y, x = q.popleft(); c = a[y, x]
    for dy, dx in ((1,0),(-1,0),(0,1),(0,-1)):
        ny, nx = y + dy, x + dx
        if 0 <= ny < h and 0 <= nx < w and not bg[ny, nx] and np.abs(a[ny, nx] - c).sum() < tol:
            bg[ny, nx] = True; q.append((ny, nx))
# fundo estimado por linha (interpolado entre a borda esquerda e a direita): tira blocos que sobraram
L = a[:, :4].mean(1); R = a[:, -4:].mean(1); t = np.linspace(0, 1, w)[None, :, None]
est = L[:, None, :] * (1 - t) + R[:, None, :] * t
if len(sys.argv) > 8:
    near = np.abs(a - est).sum(2) < float(sys.argv[8])
    q = deque(zip(*np.nonzero(bg)))
    while q:
        y, x = q.popleft()
        for dy, dx in ((1,0),(-1,0),(0,1),(0,-1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w and not bg[ny, nx] and near[ny, nx]:
                bg[ny, nx] = True; q.append((ny, nx))
al = Image.fromarray(np.where(bg, 0, 255).astype(np.uint8)).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.MinFilter(3)) if len(sys.argv) < 9 else Image.fromarray(np.where(bg, 0, 255).astype(np.uint8)).filter(ImageFilter.MinFilter(5)).filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.8))
o = im.convert('RGBA'); o.putalpha(al); o = o.crop(o.getbbox()); o.save(out)
