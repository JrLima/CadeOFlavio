# Cadê o Flávio?

Um joguinho de navegador no estilo "Onde está o Wally?": uma multidão de bonequinhos se espalha pelos países de um mapa-múndi, e só um deles está de **paletó e gravata**. Esse é o Flávio. Ache e toque nele o mais rápido que puder.

**Jogue:** https://JrLima.github.io/CadeOFlavio

## Como funciona

- Cada acerto soma um ponto, e o placar mostra a média e o melhor tempo.
- Errou? O Flávio pisca em vermelho para mostrar onde estava, e uma nova rodada começa. Os erros não contam no placar.
- O placar fica só na memória: recarregou a página, zerou.
- Dá para compartilhar o resultado com uma imagem no formato stories (WhatsApp, X, Instagram).
- Feito para celular na horizontal, mas também funciona no computador.

## Como foi feito

- HTML, CSS e JavaScript puros, sem framework, sem build e sem servidor. Basta abrir o `index.html`.
- Tudo é desenhado em `<canvas>`, em estilo flat e geométrico: os bonecos são feitos de três formas (cabeça, cabelo e corpo).
- O mapa usa uma projeção equiretangular, com traço branco fino sobre azul-marinho, inspirado nas "plantas" dos desenhos animados clássicos.
- Cada boneco é posicionado de forma que caiba inteiro dentro de um único país.
- Desenvolvido com a ajuda do [Claude](https://claude.ai) (Anthropic).

### Estrutura

| Arquivo | O que tem |
|---|---|
| `index.html` | Estrutura da página e das telas |
| `style.css` | Visual |
| `config.js` | **Todos os textos, cores e ajustes do jogo** (edite aqui) |
| `map-data.js` | Contornos do mapa-múndi já projetados |
| `game.js` | Lógica do jogo |

## Créditos

- Dados do mapa: [Natural Earth](https://www.naturalearthdata.com/) (domínio público), via [world-atlas](https://github.com/topojson/world-atlas) (licença ISC).
- Fontes: [Lilita One](https://fonts.google.com/specimen/Lilita+One) e [Nunito](https://fonts.google.com/specimen/Nunito), pelo Google Fonts (SIL Open Font License).

## Aviso

Este é um projeto de ficção, feito apenas para entretenimento. O personagem "Flávio" e todos os demais bonecos são fictícios e genéricos. **Não há referência a pessoas reais, vivas ou mortas, e qualquer semelhança com nomes, pessoas, aparências ou situações reais é mera coincidência.** O jogo não tem nenhuma intenção de ofender, satirizar ou difamar quem quer que seja.

O mapa é apenas ilustrativo, e as fronteiras desenhadas não representam nenhuma posição política sobre territórios.

O jogo não coleta, armazena nem envia dados pessoais.

## Licença

[MIT](LICENSE). O software é fornecido "como está", sem garantias de qualquer tipo.
