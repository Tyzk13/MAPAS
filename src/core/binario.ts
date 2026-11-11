// Busca um arquivo binário (modelo .glb, céu .hdr). Na versão para páginas hospedadas, o arquivo vem como
// módulo .js com base64 (ver vite.config.ts); aqui ele é importado e decodificado. Avisa o gerenciador de
// carregamento para a barra de progresso continuar correta.
import * as THREE from 'three';

export async function fetchBinary(url: string): Promise<ArrayBuffer> {
  const mgr = THREE.DefaultLoadingManager;
  mgr.itemStart(url);
  try {
    if (/\.js(\?|$)/.test(url)) {
      const mod = await import(/* @vite-ignore */ new URL(url, document.baseURI).href);
      const bin = atob(mod.default as string), out = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
      return out.buffer;
    }
    const r = await fetch(url);
    if (!r.ok) throw new Error(`não consegui baixar ${url} (${r.status})`);
    return await r.arrayBuffer();
  } catch (e) { mgr.itemError(url); throw e; } finally { mgr.itemEnd(url); }
}
