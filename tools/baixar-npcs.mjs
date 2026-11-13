// Baixa as imagens da pasta "NPCs anos 80" do Pinterest do mestre para npcs-local/ (fora do git: são artes de
// terceiros). O mapa de Harlow usa npcs-local/NN.* se existir; senão mostra uma silhueta.
// Uso: node tools/baixar-npcs.mjs [link da pasta]   (precisa de pin.it, pinterest.com e i.pinimg.com liberados)
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
// curl em vez de fetch: respeita HTTPS_PROXY
const get = (u, out) => execFileSync('curl', ['-sSL', '-A', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36', ...(out ? ['-o', out] : []), u], { maxBuffer: 64e6 }).toString();
const url = process.argv[2] || 'https://pin.it/2WoKlt9NP';
const html = get(url);
const urls = [...new Set(html.match(/https:\/\/i\.pinimg\.com\/originals\/[^"\\ ]+\.(?:jpg|png|webp)/g) || [])];
if (!urls.length) { console.error('nenhuma imagem achada (link certo? hosts liberados?)'); process.exit(1); }
fs.mkdirSync('npcs-local', { recursive: true });
let i = 0;
for (const u of urls) {
  const n = String(++i).padStart(2, '0'), ext = u.split('.').pop();
  get(u, `npcs-local/${n}.${ext}`);
  console.log(n, u);
}
console.log(urls.length, 'imagens em npcs-local/ (a ordem é a da pasta; a 01 é o logo do Instagram e não é usada)');
