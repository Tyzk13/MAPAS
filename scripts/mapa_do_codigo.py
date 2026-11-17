#!/usr/bin/env python3
"""Gera docs/MAPA_DO_CODIGO.md: o índice do repositório para o Claude achar as coisas gastando pouco limite.
Lista cada arquivo de código com tamanho e as funções/classes/exports com o número da linha,
as pastas pesadas (imagens, modelos, vídeos) que não devem ser abertas e as linhas gigantes.
Uso (na raiz do repositório):  python3 -I scripts/mapa_do_codigo.py"""
import re, subprocess, pathlib, collections
root = pathlib.Path(__file__).resolve().parent.parent
files = subprocess.run(['git', 'ls-files'], cwd=root, capture_output=True, text=True).stdout.split('\n')
files = [f for f in files if f and (root / f).is_file()]
CODE = {'.ts', '.tsx', '.js', '.mjs', '.cjs', '.jsx', '.py', '.html', '.css', '.sh', '.vue', '.svelte'}
SKIP = {'package-lock.json', 'docs/MAPA_DO_CODIGO.md'}
PAT = [  # (regex, como mostrar)
    re.compile(r'^\s*(?:export\s+)?(?:default\s+)?(?:async\s+)?function\*?\s+(\w+)\s*\('),
    re.compile(r'^\s*(?:export\s+)?(?:default\s+)?(?:abstract\s+)?class\s+(\w+)'),
    re.compile(r'^\s*(?:export\s+)?(?:const|let)\s+(\w+)\s*=\s*(?:async\s*)?(?:\([^)]*\)|\w+)\s*(?::[^=]+)?=>'),
    re.compile(r'^\s*export\s+(?:const|let|type|interface|enum)\s+(\w+)'),
    re.compile(r'^(?:async\s+)?def\s+(\w+)\s*\('),          # python, nível do topo
    re.compile(r'^class\s+(\w+)'),
    re.compile(r'^    (?:async\s+)?def\s+(\w+)\s*\('),       # métodos python
    re.compile(r'^(\w+)\s*\(\)\s*\{'),                       # funções shell
]
METH = re.compile(r'^\s{2,4}(?:public\s+|private\s+|protected\s+|static\s+|async\s+|get\s+|set\s+)*(\w+)\s*\([^)]*\)\s*(?::\s*[\w<>\[\]|, .]+)?\s*\{\s*$')
NOT = {'if', 'for', 'while', 'switch', 'catch', 'return', 'function', 'constructor'}
code, heavy, big = [], collections.Counter(), []
hsize = collections.Counter()
for f in files:
    p = root / f; ext = p.suffix.lower(); sz = p.stat().st_size
    if f in SKIP: continue
    if ext in CODE or (ext in {'.json', '.md', '.txt', '.srt', '.yml', '.yaml', '.toml'} and sz < 200_000):
        code.append((f, sz))
    else:
        if sz < 4096 and ext not in {'.png', '.jpg', '.jpeg', '.webp', '.gif', '.glb', '.mp3', '.mp4', '.wav'}: continue  # arquivinhos sem extensão (LICENSE etc.)
        parts = f.split('/')[:-1]
        d = '/'.join(parts[:2] if parts and parts[0] in ('src', 'public', 'assets') else parts[:1]) if parts else '(raiz)'
        heavy[d] += 1; hsize[d] += sz
out = ['# Mapa do código', '',
       'Gerado por `scripts/mapa_do_codigo.py` — rode de novo depois de criar, mover ou mudar arquivos.',
       'Para ler uma função: Read com `offset` = linha e `limit` ≈ 40–80. Não leia arquivos inteiros sem necessidade.', '']
if heavy:
    out += ['## Pastas pesadas (binários: imagens, modelos, áudio, vídeo) — não abrir', '', '| Pasta | Arquivos | Tamanho |', '|---|---|---|']
    for d, n in sorted(heavy.items(), key=lambda x: -hsize[x[0]]):
        out.append(f'| `{d}/` | {n} | {hsize[d]/1e6:.1f} MB |')
    out.append('')
detail = []
for f, sz in sorted(code):
    p = root / f
    try: L = p.read_text(encoding='utf-8').split('\n')
    except Exception: continue
    for i, l in enumerate(L, 1):
        if len(l) > 2000: big.append((f, i, len(l), l.strip()[:40].replace('|', '/')))
    if p.suffix.lower() not in CODE: continue
    syms = []
    for i, l in enumerate(L, 1):
        if len(l) > 2000: continue
        for rx in PAT:
            m = rx.match(l)
            if m: syms.append((i, m.group(1))); break
        else:
            m = METH.match(l)
            if m and m.group(1) not in NOT and p.suffix.lower() in {'.ts', '.tsx', '.js', '.mjs'}: syms.append((i, m.group(1) + '()'))
    detail.append((f, sz, len(L), syms))
if big:
    out += ['## Linhas GIGANTES (dados embutidos) — grep sempre com `| cut -c1-200`', '', '| Arquivo | Linha | Tamanho | Início |', '|---|---|---|---|']
    out += [f'| `{f}` | {i} | {n//1024} KB | {s} |' for f, i, n, s in big] + ['']
out += ['## Arquivos de texto/código', '', '| Arquivo | Linhas | Tamanho |', '|---|---|---|']
out += [f'| `{f}` | {n} | {sz/1024:.0f} KB |' for f, sz, n, _ in detail]
docs = [f for f, sz in code if (root / f).suffix.lower() not in CODE]
if docs: out += ['', 'Outros textos: ' + ', '.join(f'`{f}`' for f in docs)]
out += ['', '## Funções, classes e exports (linha)', '']
for f, sz, n, syms in detail:
    if not syms: continue
    out.append(f'### `{f}`')
    out.append(' · '.join(f'`{s}` {i}' for i, s in syms[:150]) + (f' · … +{len(syms)-150}' if len(syms) > 150 else ''))
    out.append('')
(root / 'docs').mkdir(exist_ok=True)
(root / 'docs' / 'MAPA_DO_CODIGO.md').write_text('\n'.join(out) + '\n', encoding='utf-8')
print(f'docs/MAPA_DO_CODIGO.md: {len(detail)} arquivos de código, {sum(len(s) for *_, s in detail)} símbolos, {len(big)} linhas gigantes')
