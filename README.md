# Estudo: portal de prefeitura (HTML, CSS e JavaScript acessíveis)

[![CI](https://github.com/Brunacoelhob/estudo-web-portal-prefeitura/actions/workflows/ci.yml/badge.svg)](https://github.com/Brunacoelhob/estudo-web-portal-prefeitura/actions/workflows/ci.yml)
![License](https://img.shields.io/badge/c%C3%B3digo-MIT-blue)

> **Projeto de estudo.** É uma réplica de *layout* inspirada no portal da Prefeitura de Mirassol-SP, feita para praticar HTML semântico, acessibilidade e responsividade. **Não tem vínculo oficial** com a Prefeitura nem com a Instar Tecnologia (desenvolvedora do portal original). Os links internos são ilustrativos.

## O que o site tem

- Cabeçalho em três faixas, menu com submenus, busca, botões de acesso rápido e redes sociais
- Seção de notícias (3 destaques) e **carrossel** de mais notícias
- Rodapé com contatos e informações institucionais
- **Barra de acessibilidade funcional**: aumentar/diminuir texto, alto contraste e pausar animações (as escolhas ficam salvas)

## Como ver

Sem dependências: abra o `index.html` ou rode um servidor local.

```bash
npm install
npm start      # http://localhost:8080
```

## Melhorias em relação à primeira versão

| Antes | Agora |
|---|---|
| Imagem da notícia principal **não carregava** em Linux/GitHub Pages (`grota.jpg` × `Grota.jpg`) | Arquivos em minúsculas, e um teste confere a caixa exata de cada referência |
| Botões de acessibilidade eram `<div>` sem função | 4 recursos reais, com `aria-pressed`, persistência e limites |
| Menu só abria com o **mouse** | Abre por teclado e toque, `aria-expanded`, Esc fecha; botão "Menu" no celular |
| Carrossel girava sem poder parar, com largura fixa e bolinhas `<span>` | Botão de pausa (WCAG 2.2.2), pausa ao focar/passar o mouse, respeita "reduzir movimento", responsivo, bolinhas-botão com rótulo |
| **Sem nenhuma regra responsiva**; margem fixa de 420px quebrava telas menores (rolagem horizontal) | Layout fluido, *media queries*, validado em Chrome (desktop 1280 px e celular 390 px, sem rolagem horizontal) |
| `alt` genérico/repetido ("Parque da Grota" em 3 fotos) e campos sem rótulo | Textos alternativos descritivos e únicos; rótulos e nomes acessíveis em todos os controles |
| Sem "pular para o conteúdo", sem foco visível, sem marcos de navegação | Skip link, foco visível, `<nav aria-label>`, `<main>` |
| Font Awesome sem integridade; sem política de segurança | SRI no CDN + Content-Security-Policy restritiva (sem script inline) |
| Rodapé reivindicava "© Instar … todos os direitos reservados" | Crédito honesto + aviso de projeto de estudo |
| Sem testes | 26 testes (arquivos e acessibilidade do HTML + comportamento dos scripts) e `html-validate` |

## Testes

```bash
npm test             # estrutura/acessibilidade do HTML + barra, menu e carrossel (jsdom)
npm run lint:html    # validação do HTML
```

## Estrutura

```
index.html                página
styles.css                visual original
acessivel-responsivo.css  acessibilidade, alto contraste e responsividade
acessibilidade.js · menu.js · carrossel.js · inicio.js
img/                      imagens (propriedade dos respectivos autores)
test/
```

## Licença e créditos

O **código** deste repositório é [MIT](LICENSE). As imagens, o brasão e a logomarca pertencem à Prefeitura de Mirassol e aos respectivos autores e estão aqui apenas para fins de estudo.
