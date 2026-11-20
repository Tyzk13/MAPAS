# Recorta as figuras de uma folha de personagens com FUNDO ESCURO (fumaça marrom, faixas com o nome da raça).
# Uso: python3 -I tools/fatiar-folha-escura.py folha.png pasta_saida [prefixo]
# 1) bordas (Sobel) mostram onde há desenho: o fundo de fumaça é liso. A projeção por linha acha as faixas de
#    personagens; dentro de cada faixa, a projeção por coluna acha os vãos entre as figuras.
# 2) o fundo atrás de cada figura é estimado ligando os vãos da esquerda e da direita (linha a linha);
#    figura = pixel longe desse fundo, ou contorno escuro, ou borda forte; buracos fechados viram figura.
# 3) só o maior pedaço (mais os grandes) fica; salva <prefixo><linha>-<n>.png (linha = raça) e _folha.png.
import sys, os
import numpy as np
from PIL import Image, ImageFilter, ImageDraw
from collections import deque
src, out = sys.argv[1], sys.argv[2]; pre = sys.argv[3] if len(sys.argv) > 3 else ''
os.makedirs(out, exist_ok=True)
im = Image.open(src).convert('RGB'); a = np.asarray(im).astype(np.float32); H, W, _ = a.shape
g = np.asarray(im.convert('L').filter(ImageFilter.GaussianBlur(1))).astype(np.float32)
gx = np.zeros_like(g); gy = np.zeros_like(g); gx[:, 1:-1] = g[:, 2:] - g[:, :-2]; gy[1:-1] = g[2:] - g[:-2]
borda = np.hypot(gx, gy) > 22
ativ = borda | (g < 26)

def runs(v, lim, junta, minimo):
    on = v > lim; rs = []; i = 0
    while i < len(v):
        if on[i]:
            j = i
            while j < len(v) and on[j]: j += 1
            rs.append([i, j]); i = j
        else: i += 1
    m = []
    for r in rs:
        if m and r[0] - m[-1][1] <= junta: m[-1][1] = r[1]
        else: m.append(r)
    return [r for r in m if r[1] - r[0] >= minimo]

def suaviza(v, k):
    return np.convolve(v, np.ones(k) / k, mode='same')

linhas = runs(suaviza(ativ[:, int(W * 0.13):].mean(axis=1), 9), 0.045, 3, int(H * 0.06))  # sem a coluna das faixas de nome
pecas = []
for li, (y0, y1) in enumerate(linhas, 1):
    banda = ativ[y0:y1]; col = suaviza(banda.mean(axis=0), 3)
    cols = runs(col, 0.035, 2, 8)
    # pares grudados: corrida bem mais larga que a típica é cortada na coluna mais vazia do meio
    if cols:
        tip = float(np.median([b - a for a, b in cols])); sep = []
        for (xa, xb) in cols:
            pend = [(xa, xb)]
            while pend:
                u, v = pend.pop(0)
                if v - u > tip * 1.65:
                    i0, i1 = u + int((v - u) * 0.3), u + int((v - u) * 0.7); cx = i0 + int(np.argmin(col[i0:i1]))
                    pend += [(u, cx), (cx, v)]
                else: sep.append((u, v))
        cols = sorted(sep)
    for (x0, x1) in cols:
        # fundo atrás: interpola, linha a linha, a média dos vãos à esquerda e à direita
        xe0, xe1 = max(0, x0 - 6), max(1, x0 - 1); xd0, xd1 = min(W - 1, x1 + 1), min(W, x1 + 6)
        fe = a[y0:y1, xe0:xe1].mean(axis=1) if xe1 > xe0 else a[y0:y1, xd0:xd1].mean(axis=1)
        fd = a[y0:y1, xd0:xd1].mean(axis=1) if xd1 > xd0 else fe
        t = np.linspace(0, 1, x1 - x0)[None, :, None]
        fundo = fe[:, None, :] * (1 - t) + fd[:, None, :] * t
        c = a[y0:y1, x0:x1]; dif = np.abs(c - fundo).max(axis=2)
        m = (dif > 20) | (g[y0:y1, x0:x1] < 26) | borda[y0:y1, x0:x1]
        # fecha buracos: o que não é alcançável da borda do recorte (passando por não-figura) é figura
        hh, ww = m.shape; fora = np.zeros_like(m); q = deque()
        for yy in range(hh):
            for xx in (0, ww - 1):
                if not m[yy, xx]: fora[yy, xx] = True; q.append((yy, xx))
        for xx in range(ww):
            for yy in (0, hh - 1):
                if not m[yy, xx] and not fora[yy, xx]: fora[yy, xx] = True; q.append((yy, xx))
        while q:
            yy, xx = q.popleft()
            for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                ny, nx = yy + dy, xx + dx
                if 0 <= ny < hh and 0 <= nx < ww and not fora[ny, nx] and not m[ny, nx]: fora[ny, nx] = True; q.append((ny, nx))
        m = ~fora
        # maior pedaço (+ pedaços grandes: lança, cajado)
        lb = np.zeros(m.shape, np.int32); k = 0; tam = {}
        for yy in range(hh):
            for xx in range(ww):
                if m[yy, xx] and not lb[yy, xx]:
                    k += 1; q = deque([(yy, xx)]); lb[yy, xx] = k; tt = 0
                    while q:
                        p0, p1 = q.popleft(); tt += 1
                        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                            ny, nx = p0 + dy, p1 + dx
                            if 0 <= ny < hh and 0 <= nx < ww and m[ny, nx] and not lb[ny, nx]: lb[ny, nx] = k; q.append((ny, nx))
                    tam[k] = tt
        if not tam: continue
        mx = max(tam, key=tam.get)
        if tam[mx] < 500: continue
        keep = np.isin(lb, [kk for kk, tt in tam.items() if tt >= tam[mx] * 0.2])
        ys, xs = np.where(keep)
        ya, yb, xa, xb = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
        if (yb - ya) < (y1 - y0) * 0.45 or (xb - xa) > (yb - ya) * 1.4: continue  # faixa do nome, pedaço solto
        rgba = np.dstack([c[ya:yb, xa:xb].astype(np.uint8), np.where(keep[ya:yb, xa:xb], 255, 0).astype(np.uint8)])
        pecas.append((y0, x0, Image.fromarray(rgba, 'RGBA'), li))
pecas.sort(key=lambda p: (p[0], p[1]))
prev = []
cont = {}
for _, _, o, li in pecas:
    cont[li] = cont.get(li, 0) + 1; nome = f'{pre}{li}-{cont[li]:02d}.png'; o.save(os.path.join(out, nome)); prev.append((nome, o))
cw = 96; ch = 170; cols = 18; rows = (len(prev) + cols - 1) // cols
fol = Image.new('RGB', (cw * cols, ch * max(1, rows)), (200, 210, 220)); d = ImageDraw.Draw(fol)
for j, (nome, o) in enumerate(prev):
    t = o.copy(); t.thumbnail((cw - 6, ch - 20)); x = (j % cols) * cw; y = (j // cols) * ch
    fol.paste(t, (x + 3, y + 3), t); d.text((x + 4, y + ch - 15), nome[:-4], fill=(0, 0, 0))
fol.save(os.path.join(out, '_folha.png'))
print(len(prev), 'figuras em', out, '· linhas:', [(int(y0), int(y1)) for y0, y1 in linhas])
