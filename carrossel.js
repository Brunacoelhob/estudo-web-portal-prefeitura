/**
 * Carrossel de notícias.
 *  - responsivo: quantos cards cabem é calculado pela largura disponível (antes eram fixos 4 × 262 px);
 *  - acessível (WCAG 2.2.2): botão de pausa, pausa ao passar o mouse/focar e respeito a "reduzir movimento";
 *  - bolinhas são botões com rótulo (antes eram <span> sem função para teclado).
 */
(function (raiz) {
  'use strict';

  var INTERVALO_PADRAO = 4000;

  /** Quantos cards inteiros cabem na largura disponível (mínimo 1). */
  function visiveisPorLargura(larguraDisponivel, larguraDoCard, espaco) {
    if (!(larguraDoCard > 0)) return 1;
    return Math.max(1, Math.floor((larguraDisponivel + espaco) / (larguraDoCard + espaco)));
  }

  /** Quantas posições o carrossel tem (0 = nada para rolar). */
  function totalDePosicoes(totalDeCards, visiveis) {
    return Math.max(1, totalDeCards - visiveis + 1);
  }

  function proximaPosicao(atual, total) {
    return (atual + 1) % total;
  }

  function iniciarCarrossel(opcoes) {
    var doc = opcoes.documento;
    var janela = doc.defaultView;
    var intervalo = opcoes.intervalo || INTERVALO_PADRAO;
    var espaco = opcoes.espaco == null ? 10 : opcoes.espaco;

    var raizEl = doc.querySelector('.carrossel-noticias');
    var faixa = doc.querySelector('.carrossel-wrapper');
    var cards = Array.prototype.slice.call(doc.querySelectorAll('.card-noticia'));
    var containerDots = doc.querySelector('.bolinhas');
    var botaoPausa = doc.querySelector('.carrossel-pausa');
    if (!raizEl || !faixa || cards.length === 0) return null;

    var medidas = opcoes.medidas || function () {
      return { disponivel: raizEl.parentElement.clientWidth, card: cards[0].offsetWidth };
    };
    var reduzirMovimento = opcoes.reduzirMovimento || function () {
      return janela.matchMedia && janela.matchMedia('(prefers-reduced-motion: reduce)').matches;
    };

    var estado = { posicao: 0, total: 1, visiveis: 1, pausadoPeloUsuario: false, pausadoTemporario: false, passo: 0 };
    var temporizador = null;

    function pausadoGlobalmente() {
      return doc.body.classList.contains('animacoes-pausadas');
    }

    function rodando() {
      return !estado.pausadoPeloUsuario && !estado.pausadoTemporario && !pausadoGlobalmente() && !reduzirMovimento();
    }

    function desenhar() {
      faixa.style.transform = 'translateX(' + -(estado.posicao * estado.passo) + 'px)';
      var bolinhas = containerDots ? containerDots.querySelectorAll('button') : [];
      Array.prototype.forEach.call(bolinhas, function (b, i) {
        var ativa = i === estado.posicao;
        b.classList.toggle('active', ativa);
        if (ativa) b.setAttribute('aria-current', 'true');
        else b.removeAttribute('aria-current');
      });
      // Só o que está visível entra na ordem de tabulação / leitor de tela.
      cards.forEach(function (card, i) {
        var visivel = i >= estado.posicao && i < estado.posicao + estado.visiveis;
        card.setAttribute('aria-hidden', visivel ? 'false' : 'true');
        Array.prototype.forEach.call(card.querySelectorAll('a'), function (a) { a.tabIndex = visivel ? 0 : -1; });
      });
    }

    function atualizarBotao() {
      if (!botaoPausa) return;
      var parado = !rodando();
      botaoPausa.setAttribute('aria-pressed', String(estado.pausadoPeloUsuario));
      botaoPausa.setAttribute('aria-label', estado.pausadoPeloUsuario ? 'Retomar rotação das notícias' : 'Pausar rotação das notícias');
      var icone = botaoPausa.querySelector('i');
      if (icone) icone.className = 'fas ' + (estado.pausadoPeloUsuario ? 'fa-play' : 'fa-pause');
      botaoPausa.dataset.rodando = String(!parado);
    }

    function irPara(posicao) {
      estado.posicao = Math.min(Math.max(posicao, 0), estado.total - 1);
      desenhar();
    }

    function recalcular() {
      var m = medidas();
      estado.visiveis = visiveisPorLargura(m.disponivel, m.card, espaco);
      estado.total = totalDePosicoes(cards.length, estado.visiveis);
      estado.passo = m.card + espaco;
      if (containerDots) {
        containerDots.textContent = '';
        for (var i = 0; i < estado.total; i++) {
          (function (indice) {
            var b = doc.createElement('button');
            b.type = 'button';
            b.className = 'dot';
            b.setAttribute('aria-label', 'Ir para o grupo ' + (indice + 1) + ' de ' + estado.total);
            b.addEventListener('click', function () { irPara(indice); });
            containerDots.appendChild(b);
          })(i);
        }
        containerDots.hidden = estado.total <= 1;
      }
      irPara(estado.posicao);
    }

    function avancar() {
      if (!rodando()) return;
      irPara(proximaPosicao(estado.posicao, estado.total));
    }

    if (botaoPausa) {
      botaoPausa.addEventListener('click', function () {
        estado.pausadoPeloUsuario = !estado.pausadoPeloUsuario;
        atualizarBotao();
      });
    }

    // Pausa enquanto o mouse está em cima ou o foco está dentro (quem está lendo não é interrompido).
    ['mouseenter', 'focusin'].forEach(function (nome) {
      raizEl.addEventListener(nome, function () { estado.pausadoTemporario = true; });
    });
    ['mouseleave', 'focusout'].forEach(function (nome) {
      raizEl.addEventListener(nome, function () { estado.pausadoTemporario = false; });
    });
    doc.addEventListener('acessibilidade:mudou', atualizarBotao);
    janela.addEventListener('resize', recalcular);

    recalcular();
    atualizarBotao();
    temporizador = janela.setInterval(avancar, intervalo);

    return {
      estado: estado,
      irPara: irPara,
      avancar: avancar,
      recalcular: recalcular,
      parar: function () { janela.clearInterval(temporizador); },
    };
  }

  var api = { iniciarCarrossel: iniciarCarrossel, visiveisPorLargura: visiveisPorLargura, totalDePosicoes: totalDePosicoes, proximaPosicao: proximaPosicao };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else raiz.Carrossel = api;
})(typeof window !== 'undefined' ? window : globalThis);
