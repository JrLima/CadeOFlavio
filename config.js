/*
 * Cadê o Flávio? — configuração
 * Edite este arquivo para trocar textos, cores e parâmetros do jogo.
 * Variáveis disponíveis nos textos: {acertos}, {media}, {melhor}, {url}
 */
window.FLAVIO_CONFIG = {
  locale: "pt-BR",

  site: {
    url: "https://JrLima.github.io/CadeOFlavio",
    title: "Cadê o Flávio?",
    description: "Ache o Flávio, o único de paletó e gravata, no meio da multidão espalhada pelo mundo."
  },

  texts: {
    start: {
      titleBefore: "Cadê o",
      titleName: "Flávio?",
      lead: "Ele é o único de paletó e gravata.",
      instruction: "Toque nele o mais rápido que puder!",
      play: "Jogar",
      fullscreenHint: "Melhor em tela cheia, com o celular deitado.",
      memoryNote: "Seu placar fica só nesta aba. Recarregou, zerou."
    },
    rotate: {
      title: "Gire o celular",
      body: "O mapa-múndi é largo. Deite o celular para jogar."
    },
    hud: {
      hits: "Acertos",
      average: "Média",
      last: "Último",
      best: "Melhor",
      misses: "Erros",
      empty: "–",
      secondsSuffix: "s",
      share: "Compartilhar",
      fullscreen: "Tela cheia",
      exitFullscreen: "Sair da tela cheia",
      help: "Como jogar"
    },
    feedback: {
      hit: "Achou!",
      miss: "Opa, não é ele!",
      plusOne: "+1"
    },
    share: {
      modalTitle: "Compartilhe seu resultado",
      whatsapp: "WhatsApp",
      x: "X",
      instagram: "Instagram",
      save: "Salvar imagem",
      close: "Fechar",
      generating: "Gerando imagem…",
      noHitsYet: "Ache o Flávio pelo menos uma vez para compartilhar!",
      disclaimer: "Este é um jogo de ficção. Não há referências a pessoas reais e quaisquer semelhanças são meras coincidências.",
      instagramHint: "Salve a imagem e poste nos seus stories do Instagram.",
      saveHint: "Se o download não começar, toque e segure a imagem (ou clique com o botão direito) para salvar.",
      saved: "Imagem salva!",
      // Imagem 1080x1920
      imageTitleBefore: "Cadê o",
      imageTitleName: "Flávio?",
      imageHits: "Achei o Flávio {acertos} vezes",
      imageHitsOne: "Achei o Flávio 1 vez",
      imageAverage: "Média",
      imageBest: "Melhor",
      imageHere: "Ele estava aqui!",
      imageCta: "Cadê o Flávio? Procure você também em",
      imageUrl: "https://JrLima.github.io/CadeOFlavio"
    }
  },

  share: {
    // Texto enviado junto (X, WhatsApp, status). Mantenha a URL no fim.
    text: "Cadê o Flávio? Achei ele {acertos}x com média de {media}! Procure você também em {url}",
    // Sem acertos ainda (não usado por padrão, o botão pede 1 acerto)
    textFallback: "Cadê o Flávio? Procure você também em {url}",
    title: "Cadê o Flávio?",
    fileName: "cade-o-flavio.png",
    width: 1080,
    height: 1920,
    whatsappUrl: "https://wa.me/?text={text}",
    xUrl: "https://x.com/intent/post?text={text}"
  },

  game: {
    // Tamanho do boneco = fração da altura do mapa na tela.
    // 0.036 → ~12 px de altura num celular deitado, ~20 px num monitor.
    personHeightRatio: 0.036,
    minPersonHeight: 10,    // px CSS (limite inferior para legibilidade)
    cellW: 0.95,            // espaçamento da grade (em larguras de boneco)
    cellH: 0.75,            // (em alturas de boneco)
    jitter: 0.35,           // deslocamento aleatório (fração da célula)
    emptyRate: 0.04,        // fração de vagas vazias
    hitPadding: 8,          // margem extra de toque ao redor do Flávio (mouse), px CSS
    hitPaddingCoarse: 14,   // idem para telas de toque
    successMs: 450,         // duração do feedback de acerto
    missBlinks: 3,          // piscadas vermelhas no erro
    missBlinkMs: 1000,      // duração total das piscadas
    showMisses: false,      // mostrar contador de erros no HUD
    maxDpr: 2
  },

  colors: {
    sand: "#F6E7C8",
    cream: "#FFFDF7",
    ink: "#1E2A3A",
    map: "#1E3F7A",
    mapLine: "#FFFFFF",
    suit: "#141B2E",
    shirtV: "#FFFFFF",
    tie: "#1E3F7A",
    flavioSkin: "#F5D6B8", // Flávio: sempre pele clara
    flavioHair: "#5A3A22", // Flávio: sempre cabelo castanho-escuro
    accent: "#F07A1A",
    error: "#E2382E",
    success: "#2FBF71",
    skins: ["#F5D6B8", "#F2C9A0", "#D9A274", "#C68A5E", "#A86B45", "#7A4A2E"],
    // Nada de azul-marinho, preto ou cinza-chumbo aqui: o terno é exclusivo do Flávio.
    shirts: ["#2F6FB3", "#E2574C", "#3E9E6A", "#F2B134", "#1F8A8A", "#C94F7C", "#5C8D2F", "#8FB8DE", "#FFFFFF", "#F07A1A", "#7B5BD6"],
    hairs: ["#2B1D14", "#5A3A22", "#8C5A2B", "#1A1A1A", "#C9A14A", "#9A9A9A"]
  },

  map: {
    lineWidth: 1,       // px CSS
    lineAlpha: 0.75,
    landAlpha: 0.06,    // véu branco sobre os continentes (0 = desliga)
    grid: true,         // meridianos/paralelos tracejados
    gridAlpha: 0.12,
    gridStepDeg: 30
  }
};
