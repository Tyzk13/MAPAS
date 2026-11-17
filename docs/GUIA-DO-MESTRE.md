# Guia do mestre — como usar os mapas na sessão

Tudo o que dá para fazer na mesa, do preparo à sessão. Para criar mapas, veja `docs/NOVO-MAPA.md`;
para hospedar e servidor, `docs/HOSPEDAGEM.md`; para Foundry/Roll20, `docs/VTT.md`.

## Os links

| Link | Abre em | Tem |
|---|---|---|
| [Igreja do Casamento](https://claude.ai/artifact/65XS5FnzDBvfneK5AnFXUh) | igreja | todos os mapas (troque pelo menu **Mapa**) |
| [San Judas de las Ánimas](https://claude.ai/artifact/55cVSvDE5dfVtg2Km2iR9K) | cidadezinha mexicana | todos os mapas |

São privados: para outras pessoas abrirem, use o menu **Compartilhar** da página. É a versão leve (texturas
menores), que roda também no celular.

## Montagem

### Dois monitores (recomendado)

1. Monitor 1: abra o link. Esta é a **janela do mestre** (botões, câmera, personagens).
2. Abra **o mesmo link noutra janela**, leve-a ao monitor 2 e nela escolha **Mais → Esta janela é a tela dos
   jogadores**. (No seu próprio site, **Mais → Abrir janela dos jogadores** abre sozinha.)
3. Dê **duplo clique** na janela dos jogadores: tela cheia e libera o som.
4. O dock da janela do mestre mostra um **monitor verde** quando as duas estão ligadas.

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
4. **Cenas**: monte o momento (clima, câmera, legenda e estilo do cinema, luz, névoa, lanterna, vilões
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
| **Esc** | sair do cinema / da câmera livre |

Na janela dos jogadores: **duplo clique** ou **F** = tela cheia; **H** = volta ao normal.

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
| Lento | Qualidade Baixa na janela do mestre; a resolução já cai sozinha quando o FPS cai (`?fps=1` mostra) |
| Jogador não consegue abrir o link | compartilhe pelo menu da página (links são privados) |
| Algo travou no carregamento | o erro aparece na tela; recarregue; em celular antigo use Qualidade Baixa |
