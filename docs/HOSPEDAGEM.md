# Hospedagem e incorporação no site

## 1. A página do mapa

```bash
npm install
npm run build          # gera dist/ — suba a pasta inteira para qualquer hospedagem estática
npm run build:single   # gera dist-single/index.html — um arquivo só (maior; bom para colar em qualquer lugar)
```

`dist/` funciona em GitHub Pages, Netlify, Vercel, Cloudflare Pages, S3 ou num servidor comum
(caminhos relativos, sem configuração). Prefira `dist/` (os assets ficam em cache no navegador);
use o HTML único só quando não puder subir uma pasta.

### Versão leve (celular / páginas que só aceitam tipos padrão da web)

`npm run build:leve` gera `dist-lite/` com texturas de 512 px e árvores simplificadas, e empacota os modelos
(`.glb`) e céus (`.hdr`) como módulos `.js` — útil em hospedagens que recusam esses tipos de arquivo
(é o caso da página hospedada no claude.ai).

## 2. Incorporar por iframe

```html
<iframe
  src="https://seu-site.com/mapa/?room=mesa1&ws=wss://sync.seu-site.com&ro=1"
  allow="fullscreen; xr-spatial-tracking"
  allowfullscreen
  style="width:100%;height:80vh;border:0;border-radius:12px"></iframe>
```

- `allow="fullscreen"` é necessário para o botão de tela cheia funcionar dentro do iframe.
- Parâmetros úteis: `?ui=0` (sem botões), `?ro=1` (só ver), `?chars=0`, `?time=1`, `?q=baixa`.
- Controle pela página que incorpora:

```js
const f = document.querySelector('iframe').contentWindow;
f.postMessage({ cmd: 'map', id: 'campo' }, '*');
f.postMessage({ cmd: 'time', i: 2 }, '*');
addEventListener('message', e => { if (e.data?.evt === 'ready') console.log('mapas:', e.data.maps); });
```

### Política de segurança (CSP)

Se o site que incorpora usa CSP, permita o iframe: `frame-src https://seu-site.com/mapa/`.
Na página do mapa, se você definir CSP, ela precisa de:

```
default-src 'self'; img-src 'self' data: blob:; connect-src 'self' wss://sync.seu-site.com blob: data:;
script-src 'self' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; worker-src 'self' blob:
```

(`data:`/`blob:` são usados por texturas, personagens adicionados e importação de .glb/.hdr;
`'unsafe-inline'` em `script-src` só é necessário no HTML único.) Para impedir que outros sites
incorporem o mapa: `frame-ancestors https://seu-site.com`.

## 3. Servidor de sincronização (vários jogadores)

O servidor fica em `server/` (Node 18+, uma dependência: `ws`). Ele guarda as salas em
`DATA_DIR/<sala>.json`, então posições e personagens sobrevivem a reinícios.

Variáveis: `PORT`, `DATA_DIR`, `EDIT_KEY` (só quem abrir com `&key=...` pode mover; os demais só veem),
`ALLOWED_ORIGINS` (lista de sites que podem conectar), `MAX_ROOMS`, `MAX_CHARS` (personagens por sala, padrão 60),
`MAX_POS` (posições guardadas por sala, padrão 3000).

O servidor descarta números inválidos (NaN/infinito), imagens que não sejam PNG/WebP/JPEG/GIF e mensagens acima
de 40 por segundo por conexão. Teste automático: `npm run test:servidor` (na raiz) ou `npm test` (em `server/`).

### Docker (qualquer hospedagem)

```bash
docker build -t mapa-sync server/
docker run -d --restart=always -p 8080:8080 -v mapa-dados:/data \
  -e EDIT_KEY=segredo -e ALLOWED_ORIGINS=https://seu-site.com mapa-sync
```

O `Dockerfile` já usa `DATA_DIR=/data` (monte um volume ali), roda sem root e tem verificação de saúde em `/saude`.

### Render.com

1. New → Web Service → este repositório. **Root Directory:** `server`.
2. Build: `npm install` · Start: `npm start`.
3. Adicione um **Disk** (ex.: 1 GB) montado em `/var/data` e defina `DATA_DIR=/var/data`
   (sem disco, as salas somem a cada deploy).
4. Use a URL `wss://<nome>.onrender.com` no parâmetro `?ws=`.

### Fly.io

```bash
cd server
fly launch --no-deploy            # escolha um nome; usa o Dockerfile de server/
fly volumes create dados --size 1
# em fly.toml:  [mounts] source="dados" destination="/data"   e   [env] DATA_DIR="/data"
fly deploy
```

### VPS (Ubuntu) com HTTPS

```bash
cd /opt && git clone <repo> mapa && cd mapa/server && npm install
sudo tee /etc/systemd/system/mapa-sync.service <<'EOF'
[Unit]
Description=Mapa 3D sync
After=network.target
[Service]
WorkingDirectory=/opt/mapa/server
Environment=PORT=8080 DATA_DIR=/opt/mapa/server/dados ALLOWED_ORIGINS=https://seu-site.com
ExecStart=/usr/bin/node servidor-sync.mjs
Restart=always
User=www-data
[Install]
WantedBy=multi-user.target
EOF
sudo systemctl enable --now mapa-sync
```

Nginx na frente (para `wss://`):

```nginx
location / {
  proxy_pass http://127.0.0.1:8080;
  proxy_http_version 1.1;
  proxy_set_header Upgrade $http_upgrade;
  proxy_set_header Connection "upgrade";
  proxy_read_timeout 1h;
}
```

### Testar

`https://seu-servidor/saude` responde `{"ok":true,...}`. Abra a página em duas abas com o mesmo
`?room=` e `?ws=`: arrastar um personagem numa aba move na outra.
