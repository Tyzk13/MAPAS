import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import path from 'node:path';
import fs from 'node:fs';
import type { Plugin } from 'vite';

// Para páginas hospedadas que só aceitam tipos padrão da web (ex.: claude.ai): modelos .glb e céus .hdr
// viram módulos .js com o conteúdo em base64; os carregadores (src/core/binario.ts) decodificam.
function binariosComoJs(): Plugin {
  return {
    name: 'binarios-como-js', enforce: 'pre', apply: 'build',
    load(id) {
      const m = id.match(/^(.*\.(glb|hdr))\?url$/);
      if (!m) return null;
      const file = m[1], b64 = fs.readFileSync(file).toString('base64');
      const ref = this.emitFile({ type: 'asset', name: path.basename(file) + '.js', source: `export default "${b64}";\n` });
      return `export default import.meta.ROLLUP_FILE_URL_${ref};`;
    },
  };
}

// `npm run build`        → dist/ (vários arquivos, ideal para hospedar com cache)
// `npm run build:single` → dist-single/index.html (tudo embutido num HTML só)
export default defineConfig(({ mode }) => {
  const single = mode === 'single';
  // 'lite': vários arquivos com os assets leves (para celular / página hospedada)
  const lite = single || mode === 'lite';
  return {
    base: './',
    // HTML único usa a versão leve dos assets (texturas 512 px, árvores LOD1): tools/assets-leves.mjs
    resolve: { alias: { '@assets': path.resolve(__dirname, lite ? 'src/assets-lite' : 'src/assets') } },
    build: single
      ? { outDir: 'dist-single', assetsInlineLimit: () => true, chunkSizeWarningLimit: 100000 }
      : { outDir: mode === 'lite' ? 'dist-lite' : 'dist', chunkSizeWarningLimit: 4000 },
    plugins: single ? [viteSingleFile({ removeViteModuleLoader: true })] : mode === 'lite' ? [binariosComoJs()] : [],
    server: { host: true },
  };
});
