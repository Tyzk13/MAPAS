# Exportar para mesa virtual (Universal VTT)

O botão **Exportar** gera, para a área escolhida:

- **Baixar PNG** — o mapa visto de cima, sem névoa, sem personagens, sem telhado e (por padrão) sem copas de árvore.
- **Universal VTT** — arquivo `.dd2vtt` (formato 0.3) com a mesma imagem embutida + paredes (linhas de visão),
  portas e luzes. `.dd2vtt`, `.df2vtt` e `.uvtt` são o mesmo formato com extensões diferentes; se a mesa só aceitar
  uma delas, basta renomear.

Opções: área (térreo / 2º andar / mapa todo…), **pixels por quadrado** (50/70/100/140; 1 quadrado = 1 m),
copas das árvores e sombras. O tamanho é limitado pela placa de vídeo (até 8192 px por lado e ~24 MP) — áreas
grandes reduzem os pixels por quadrado automaticamente; o valor usado aparece na janela.

Teste automático de todas as áreas: `npm run test:vtt` (gera `.dd2vtt` e prévias com paredes/portas/luzes
desenhadas em `capturas/vtt/`).

## Foundry VTT

O Foundry não lê Universal VTT sozinho; use o módulo **Universal Battlemap Importer** (`dd-import`, de Moo Man),
que tem versões para Foundry 12 (4.x), 13 (5.x) e 14.

1. Configurações → Módulos → Instalar módulo → procure *Universal Battlemap Importer* e ative no mundo.
2. Na aba **Cenas**, clique em **Universal Battlemap Import**, escolha o `.dd2vtt` e dê um nome à cena.
3. Confira: paredes nas paredes da igreja, portas na entrada/sacristia, luzes nos lustres e postes.
   As cores das luzes vão no formato `AARRGGBB` (o importador descarta os 2 primeiros caracteres).

Dica: a imagem já vem com a luz "pintada" (`baked_lighting: true`); se preferir a iluminação do Foundry,
deixe a escuridão da cena alta e as luzes importadas farão o trabalho.

## Roll20

- Importação nativa: ao criar uma página, **Upload Background** aceita arquivos UVTT (cria a página; não atualiza
  uma existente). Confira na documentação atual do Roll20, pois o recurso muda com frequência.
- Alternativa (conta Pro): script de API **UniversalVTTImporter** — passe o arquivo pelo *Universal VTT Import
  Sanitizer*, cole o texto nas notas do GM da imagem do mapa e rode `!uvtt`. Usuários relatam portas importadas
  como janelas; ajuste à mão se acontecer.

## Outras mesas

Mesas sem suporte a UVTT (Owlbear Rodeo, por exemplo) aceitam o **PNG**: configure a grade com o mesmo valor de
pixels por quadrado escolhido na exportação.

## Para quem cria mapas

As paredes, portas e luzes vêm de `M.vtt` no módulo do mapa (`walls`, `portals`, `lights`, `areas`), em metros do
mundo (x, z). Veja `docs/NOVO-MAPA.md`. Áreas com `lv: 2` mostram o 2º andar (`M.loft`).

Fontes: [Universal Battlemap Importer (Foundry)](https://foundryvtt.com/packages/dd-import/) ·
[UniversalVTTImporter (Roll20 Wiki)](https://wiki.roll20.net/Uvtt)
