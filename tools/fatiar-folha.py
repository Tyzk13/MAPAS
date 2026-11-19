# Recorta as figuras de uma folha de personagens (fundo branco) em PNGs com transparência.
# Uso: python3 -I tools/fatiar-folha.py folha.png pasta_saida [prefixo] [colunas linhas]
#   com colunas/linhas: corta pela grade (folhas organizadas em grade regular) em vez de procurar os blocos
# Acha os blocos de pixels não brancos (com dilatação), ordena por linha e coluna e salva NN.png;
# o fundo branco vira transparente por inundação a partir da borda de cada recorte e só fica o maior pedaço.
import sys, os
import numpy as np
from PIL import Image
from collections import deque
src, out = sys.argv[1], sys.argv[2]; pre = sys.argv[3] if len(sys.argv) > 3 else ''
os.makedirs(out, exist_ok=True)
im = Image.open(src).convert('RGB'); a = np.asarray(im).astype(np.int16); H, W, _ = a.shape
branco = (a.min(axis=2) > 228) & ((a.max(axis=2) - a.min(axis=2)) < 22)
S = 4; h, w = H // S, W // S
m = (~branco[:h * S, :w * S]).reshape(h, S, w, S).mean(axis=(1, 3)) > 0.3
# dilata 2 células para juntar partes da mesma figura (lança, rabo)
d = m.copy()
for _ in range(1):
    e = d.copy(); e[1:] |= d[:-1]; e[:-1] |= d[1:]; e[:, 1:] |= d[:, :-1]; e[:, :-1] |= d[:, 1:]; d = e
lab = np.zeros((h, w), np.int32); n = 0; caixas = []
for y in range(h):
    for x in range(w):
        if d[y, x] and not lab[y, x]:
            n += 1; q = deque([(y, x)]); lab[y, x] = n; y0 = y1 = y; x0 = x1 = x; cnt = 0
            while q:
                cy, cx = q.popleft(); cnt += 1
                y0 = min(y0, cy); y1 = max(y1, cy); x0 = min(x0, cx); x1 = max(x1, cx)
                for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    ny, nx = cy + dy, cx + dx
                    if 0 <= ny < h and 0 <= nx < w and d[ny, nx] and not lab[ny, nx]: lab[ny, nx] = n; q.append((ny, nx))
            caixas.append((cnt, y0 * S, y1 * S + S, x0 * S, x1 * S + S))
caixas = [c for c in caixas if c[0] > (h * w) * 0.004]
if len(sys.argv) > 5:
    nc, nl = int(sys.argv[4]), int(sys.argv[5])
    caixas = [(1, int(r * H / nl), int((r + 1) * H / nl), int(k * W / nc), int((k + 1) * W / nc)) for r in range(nl) for k in range(nc)]
# ordena por linha (centro em y agrupado) e depois x
caixas.sort(key=lambda c: (c[1] + c[2]) / 2)
linhas = []
for c in caixas:
    cy = (c[1] + c[2]) / 2
    if linhas and abs(cy - linhas[-1][0]) < (c[2] - c[1]) * 0.35: linhas[-1][1].append(c)
    else: linhas.append([cy, [c]])
ordem = [c for _, cs in linhas for c in sorted(cs, key=lambda c: c[3])]
for i, (_, y0, y1, x0, x1) in enumerate(ordem, 1):
    p = 6; y0 = max(0, y0 - p); x0 = max(0, x0 - p); y1 = min(H, y1 + p); x1 = min(W, x1 + p)
    c = a[y0:y1, x0:x1]; b = branco[y0:y1, x0:x1]; ch, cw = b.shape
    fundo = np.zeros_like(b); q = deque()
    for yy in range(ch):
        for xx in (0, cw - 1):
            if b[yy, xx]: q.append((yy, xx))
    for xx in range(cw):
        for yy in (0, ch - 1):
            if b[yy, xx]: q.append((yy, xx))
    while q:
        yy, xx = q.popleft()
        if fundo[yy, xx] or not b[yy, xx]: continue
        fundo[yy, xx] = True
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = yy + dy, xx + dx
            if 0 <= ny < ch and 0 <= nx < cw and not fundo[ny, nx] and b[ny, nx]: q.append((ny, nx))
    alfa = np.where(fundo, 0, 255).astype(np.uint8)
    # só o maior pedaço opaco (tira pontas de figuras vizinhas que entraram na célula)
    op = alfa > 0; lb = np.zeros(op.shape, np.int32); k = 0; tam = {}
    for yy in range(0, ch):
        for xx in range(0, cw):
            if op[yy, xx] and not lb[yy, xx]:
                k += 1; q = deque([(yy, xx)]); lb[yy, xx] = k; t = 0
                while q:
                    a1, b1 = q.popleft(); t += 1
                    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                        ny, nx = a1 + dy, b1 + dx
                        if 0 <= ny < ch and 0 <= nx < cw and op[ny, nx] and not lb[ny, nx]: lb[ny, nx] = k; q.append((ny, nx))
                tam[k] = t
    if tam:
        mx = max(tam, key=tam.get); keep = (lb == mx)
        for kk, t in tam.items():
            if t > tam[mx] * 0.25: keep |= (lb == kk)   # partes grandes separadas (lança, caneca) ficam
        alfa = np.where(keep, 255, 0).astype(np.uint8)
    ys, xs = np.where(alfa > 0)
    if len(ys): c = c[ys.min():ys.max() + 1, xs.min():xs.max() + 1]; alfa = alfa[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    rgba = np.dstack([c.astype(np.uint8), alfa])
    nome = os.path.join(out, f'{pre}{i:02d}.png'); Image.fromarray(rgba, 'RGBA').save(nome)
print(len(ordem), 'figuras em', out)
