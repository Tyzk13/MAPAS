# Guia do mestre — como usar os mapas na sessão

Tudo o que dá para fazer na mesa, do preparo à sessão. Para criar mapas, veja `docs/NOVO-MAPA.md`;
para hospedar e servidor, `docs/HOSPEDAGEM.md`; para Foundry/Roll20, `docs/VTT.md`.

## Os links

| Link | Abre em | Tem |
|---|---|---|
| [Igreja do Casamento](https://claude.ai/artifact/65XS5FnzDBvfneK5AnFXUh) | igreja | todos os mapas (troque pelo menu **Mapa**) |
| [San Judas de las Ánimas](https://claude.ai/artifact/55cVSvDE5dfVtg2Km2iR9K) | cidadezinha mexicana | todos os mapas |
| [Harlow, Texas](https://claude.ai/artifact/HHBUeQ8noXrMfhqAK6Q1PB) | delegacia de Harlow (O Caso Whitlock) | todos os mapas |
| [Greywater Falls](https://claude.ai/artifact/19Taut7URvhL67RnSA4MHg) | Greywater Falls (O Caso Ashdown) | todos os mapas |
| [Barud (Tormenta 20)](https://claude.ai/artifact/UpjK4X8KJrYW5LefuSuPUF) | Barud, capital de Lomatubar | todos os mapas |
| [Sul de Arton (Tormenta 20)](https://claude.ai/artifact/Dzxp7GFmcpc2X9SXJP2VYZ) | mapa da região em relevo | todos os mapas |

Mapas: **Igreja** (casamento), **San Judas** (México), **Harlow** (Texas, 1987 parado no tempo), **Greywater
Falls** (Ontário, 1975 — O Caso Ashdown, hotel de 3 andares) e **Campo** (exemplo). São privados: para outras
pessoas abrirem, use o menu **Compartilhar** da página. É a versão leve (texturas menores), que roda no celular.

**Sem internet**: o arquivo offline (HTML único, ~52 MB) abre direto no navegador do PC e funciona com os dois
monitores igual (como gerar: `docs/HISTORICO.md`).

## Montagem

### Dois monitores (recomendado)

1. Monitor 1: abra o link. Esta é a **janela do mestre** (botões, câmera, personagens).
2. Clique no botão dourado **TV dos jogadores** na barra (ou tecla **J**) — no seu site/arquivo offline ela abre
   sozinha. No claude.ai, se não abrir: abra **o mesmo link noutra janela** e nela escolha **Mais → Esta janela é a
   tela dos jogadores**. Leve-a ao monitor 2.
3. Dê **duplo clique** na janela dos jogadores: tela cheia e libera o som.
4. O botão fica verde (**TV ligada**) e o dock mostra um monitor verde quando as duas estão ligadas.

A janela dos jogadores não tem botões nem cursor e segue a sua: câmera (órbita, livre, cinema com barras e
legenda), mapa, clima, personagens, luz, névoa, lanterna, imagens e som. **H** nela volta a ser janela normal.
As duas precisam estar no **mesmo navegador** e na **mesma sala** (`?room=`, padrão `mesa1`).

Dica de desempenho: deixe a janela do mestre em **Qualidade Baixa** e a dos jogadores em **Alta** (Mais → Qualidade).

### Um monitor só (transmitindo a tela)

Use **Ocultar** no dock (ou **H**): tela limpa, sem botões, cursor some parado. H ou o canto inferior direito
trazem a interface de volta. Os atalhos abaixo funcionam com a tela limpa. Som: Mestre → Som ambiente →
**Nesta janela**.

### Jogadores em outros computadores

Cada um abre o link com a mesma `?room=` e o servidor de sincronização (`?ws=wss://…`, ver `docs/HOSPEDAGEM.md`)
— ou, dentro do claude.ai, a sincronização do próprio claude.ai. Com `?ro=1` eles só veem. O **Cinema** com
"Mostrar para todos" toca na tela de todos; quem entra no meio da cena também vê.

## Antes da sessão (preparo)

1. **Tomadas**: posicione a câmera (use a câmera **Livre**) e, no painel **Cinema**, *Gravar a câmera atual
   como tomada*. Elas viram as teclas **1 a 9**.
2. **Vilões/NPCs**: **Personagens → + Novo personagem** (imagem PNG; "remover fundo liso" ajuda). Selecione e
   aperte **Ocultar**: só você o vê (meio transparente) até revelar.
3. **Imagens**: Mestre → *Escolher imagem* (pista, foto, carta, mapa desenhado). Ficam como miniaturas.
4. **Notas e pistas**: cada vista pode ter **notas do mestre** (cartão no canto só na sua janela: o que há no local,
   segredos, NPCs, ganchos) e o mapa pode ter **documentos** (Mestre → Pistas do mapa, com tradução/nota).
5. **Cenas**: monte o momento (clima, câmera, legenda e estilo do cinema, luz, névoa, lanterna, vilões
   posicionados/ocultos) e Mestre → *Gravar a cena atual*. Na sessão, **.** e **,** passam as cenas como slides.

Tomadas e cenas ficam **neste navegador**, por mapa (outro navegador/computador não as vê).

## Durante a sessão

### Câmera

| Modo | Como |
|---|---|
| Órbita | arrastar gira, roda/pinça aproxima, botão direito/dois dedos move |
| Livre | WASD anda para onde olha, arrastar olha, Q/E (ou Espaço) desce/sobe, Shift rápido, roda muda a velocidade, **G** atravessa paredes; joystick e ▲▼ no celular |
| Vista | menu **Vista**: pontos prontos do mapa |
| Cinema | painel **Cinema** ou **P**: clique onde a câmera vai; ou toque uma tomada (**1–9**) |

### Documentos e pistas (lupa)

- Passe o mouse num papel, quadro ou cartaz da cena (aparece a **lupa**) e clique: abre ampliado e legível.
- **Mestre → Pistas do mapa**: abre qualquer documento só na sua tela, **sem mexer na câmera**, com a tradução ao lado.
- Na lupa: **Mostrar aos jogadores** (vai para a tela deles) ou **Levar a câmera até lá** (movimento de cinema).

### Personagens e aparições

- **Onde está cada um** (menu Personagens): lista com o lugar de cada um, busca, **Ir**, **Trazer**, **Levar para…**.
- **Aparição**: ao clicar **Mostrar** num personagem oculto (ou adicionar um vilão já visível), as duas janelas
  mostram uma introdução sinistra de ~4,6 s com a imagem dele (chiado, lampejos, avanço no rosto, corte para o preto).
- **Fichas vivas**: os personagens respiram e balançam de leve. Tamanho **Gigante** para vilões; dá para criar já
  oculto.

### Cinema (o momento "vilão aparece do nada")

- Estilos: **Suave** (grua), **Corte** (escurece e corta), **Susto** (chicote, zoom, tremida, clarão e golpe sonoro).
- **Legenda**: texto embaixo, como num filme. **Revelar**: o personagem escolhido aparece no ponto quando a câmera
  chega (e deixa de estar oculto).
- **Esc** (ou ✕) volta a câmera para onde estava — para todos.

### Atalhos (janela do mestre)

| Tecla | O que faz |
|---|---|
| **H** | tela limpa (ocultar a interface) |
| **P** | escolher o ponto do cinema |
| **1–9** | tocar as tomadas gravadas |
| **.** / **,** (ou Page Down/Up) | próxima / anterior **cena** |
| **K** | congelar a tela dos jogadores (você explora sem eles verem; ao soltar, desliza até a sua câmera) |
| **B** | escurecer a tela dos jogadores (sem 2ª janela: escurece a sua) |
| **O** | **a luz caiu**: lâmpadas e velas grandes piscam e apagam (O de novo: voltam) |
| **N** | névoa densa |
| **L** | lanterna na câmera |
| **R** | relâmpago (clarão + trovão) |
| **I** | mostrar / esconder a imagem |
| **J** | abrir/trazer a janela dos jogadores (TV) |
| **F9** | painel de diagnóstico das manchas na imagem (também em Mais) |
| **Esc** | sair do cinema / da câmera livre |

Na janela dos jogadores: **duplo clique** ou **F** = tela cheia; **H** = volta ao normal.

### Locais e fichas (Barud)
Botão **Locais** no dock (livro): lista dos lugares com busca e categorias; tocar num lugar abre a ficha (texto
para ler em voz alta, dono, NPCs, rumores, pistas). Os **segredos** só aparecem ao tocar em *Segredos ocultos*.
**Ir até lá** / **Ver por dentro** levam a câmera; aba **NPCs** traz as fichas com retrato. **Marcadores** mostra o
nome dos lugares sobre a cidade. Duplo clique num prédio abre a ficha dele. Nada disso aparece na tela dos
jogadores. Imagens novas: PNG com fundo transparente em `npcs-local/barud/<id>.png` (ids em `src/maps/barud/dados.ts`)
e cartazes em `npcs-local/barud/cartazes/01.png…`.
Fora das muralhas fica a **Mata dos Chifres**: no menu de vistas, *Trilha da Mata* (começo, na estrada do sul),
*Forca da Encruzilhada*, *Cabana do Lenhador* (e por dentro), *Círculo dos Chifres* (fim da trilha) e *Mata dos
Chifres (do alto)*. As fichas ficam na categoria **Ermo** do painel Locais; o Pastor de Chifres começa oculto.

### Sul de Arton (mapa da região)
Menu **Mapa → Tormenta 20 → Sul de Arton**. Abre inclinado a 50°, como uma mesa de relevo. Camadas (botão de
camadas): Nomes, Alfinetes, Fronteiras, Rotas de viagem e Marcos de altitude. No painel **Locais**, cada lugar tem:
- **Ir até lá** (teleporta a câmera), **Ver por dentro** (tavernas, castelo, masmorra, cavernas, catedral…);
- **Abrir mapa: …** (Barud abre o mapa da cidade; no mapa de Barud, a ficha da cidade volta para a região);
- **Levar o grupo para cá** (teleporta os personagens dos jogadores, dentro do interior se houver);
- **Distâncias** em linha reta, em km e dias de viagem (a pé ~30 km/dia, a cavalo ~50 km/dia; 1 unidade = 2 km).
Arrastar um personagem mostra a distância em km e dias. As placas nas rotas tracejadas trazem o caminho pela estrada.

**As cidades por dentro** (chegue perto com a roda do mouse: alfinetes e rotas ficam transparentes para não tapar):
- **Barud**: a mesma planta do mapa da cidade — Portão do Rei (sul) e Portão Leste, Via Real, Rua das Lanternas,
  canal com cais e pontes, Praça do Mercado com o poço, Fortaleza no alto, Templo de Lena, quartel da legião, tavernas
  do Javali e da Lanterna, forja de Durnak e o **Bairro Coral** atrás das barricadas, com o lazareto em ruínas.
- **Valkaria**: a deusa na praça do Panteão (20 estátuas e chafarizes), avenidas iluminadas até os cinco portões,
  bulevares em anel, Palácio Imperial, **Academia Arcana** (torre de luz violeta), **Arena Imperial**, Grande Mercado,
  jardins, torres dos nobres com viadutos, o rio com cais e pontes, barracos fora dos muros, lavouras e moinhos.
- **Giluk**: terraços na encosta com muros de arrimo, escadaria, **Salão do Jarl** com cabeças de dragão, círculo de
  runas com totem e braseiros, forja, paliçada com torres de vigia, curral dos mamutes e varais de peles.
- **Nova Malpetrim**: cidade branca na falésia, Mirante com o templo, **Macaco Caolho**, feira de Marah, Arena de
  Gideon, circo dos Thiannate, escadaria até o porto com píeres, navios, armazéns e guindastes; vinhedos ao norte.
- **Tiberus**: castro tapista em grade, **fórum com o Templo de Tauron e o colosso minotauro**, basílica, arena,
  quartéis com campo de treino, termas, aqueduto e os minotauros de pedra no portão sul.
- **Nimbarann**, **Porto de Deheon** e as vilas: ruas de terra, igreja ou capela, poço, hortas atrás das casas,
  lavouras, **moinhos que giram**, pomares, vinhedos (oeste), aldeias de neve com fogueira e vilas de pescadores.

### Desempenho (para o PC não travar enquanto mestra)
Menu **⋯ → Desempenho** (fica salvo neste navegador, muda na hora, sem recarregar):
- **30 /s · 60 /s · Livre**: limite de quadros por segundo. O padrão é 60 (um monitor de 144 Hz não precisa
  desenhar 144 vezes). Em PC fraco ou notebook esquentando, use **30**.
- **Mestre leve com a TV aberta** (ligado): quando a janela dos jogadores está aberta, a sua janela desenha a 24/s e
  sem os efeitos pesados — quem vê a cena bonita é a TV. Você continua controlando tudo.
- **Economizar quando parado** (ligado): 20 s sem mexer, a sua janela desenha só 10 vezes por segundo; o primeiro
  movimento do mouse, toque ou tecla volta ao normal. Câmera de cinema e caminhar nunca ficam lentos.
- **Modo leve (PC fraco)**: tira a oclusão de ambiente e a profundidade de campo e recalcula a sombra menos vezes.
- Embaixo aparece **Agora: N quadros/s · resolução %**. A resolução já cai sozinha quando o PC aperta e volta quando
  sobra folga. Os shaders são preparados no carregamento do mapa (menos engasgos na primeira volta da câmera).

### Painel Mestre

Cenas · tela dos jogadores (congelar, escurecer) · luz e clima (a luz caiu, névoa, lanterna, relâmpago,
relâmpagos automáticos em Terror/Noite) · **sons do mestre** (batida na porta, passos, sussurro, rangido, sino,
trovão) · som ambiente · mostrar imagem (com efeito de papel).

### Som

- **Ambiente** gerado na hora, conforme o clima: vento com rajadas, zumbido grave, trovões distantes, grilos à
  noite. **No lugar**: velas crepitando perto do altar, sino da torre de vez em quando, porta que range quando a
  câmera passa (volume e lado pela posição da câmera).
- Modo: **Jogadores** (padrão — toca só na janela dos jogadores), **Nesta janela** (um monitor) ou desligado;
  volume no mesmo painel.
- O navegador só libera som depois de um clique/tecla **naquela janela**.

### Personagens

Arraste para mover (encaixa na grade; o medidor mostra a distância). Setas movem o selecionado. Selecionado:
−/+ tamanho, ⇋ espelhar, **Ocultar/Mostrar**, Remover (os criados). Personagens → mostrar/esconder todos,
grade, voltar às posições iniciais.

### Mesa virtual

Mais → *Exportar para mesa virtual*: PNG visto de cima ou Universal VTT (`.dd2vtt`) com paredes, portas e luzes.
Ver `docs/VTT.md`.

## Problemas comuns

| Problema | Solução |
|---|---|
| Janela dos jogadores não liga | mesmo link, mesmo navegador, mesma sala; no claude.ai abra **o mesmo link** de novo (janela solta pela URL interna não liga) |
| Sem som | clique uma vez na janela que deve tocar; confira Mestre → Som ambiente (modo e volume) |
| Tomadas/cenas sumiram | ficam no navegador onde foram gravadas (outro navegador ou modo anônimo não tem) |
| Lento / PC travando | **⋯ → Desempenho**: 30 /s, Modo leve, e deixe ligados "Mestre leve com a TV aberta" e "Economizar quando parado"; se ainda pesar, Qualidade Baixa na janela do mestre (`?fps=1` mostra os números) |
| Jogador não consegue abrir o link | compartilhe pelo menu da página (links são privados) |
| Algo travou no carregamento | o erro aparece na tela; recarregue; em celular antigo use Qualidade Baixa |
| Manchas brancas/pretas em placas | **F9**: desligue uma coisa por vez (sombra, lua, céu, reflexos, luzes, névoa, pós) e diga ao Claude qual resolveu; fica salvo no navegador |
| Moradores de Greywater sem imagem | as imagens ficam fora do git (`npcs-local/`); use o link/arquivo offline gerado pela sessão que tem as imagens |
