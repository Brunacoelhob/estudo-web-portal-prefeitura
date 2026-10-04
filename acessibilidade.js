/**
 * Barra de acessibilidade: aumentar/diminuir texto, alto contraste e pausar animações.
 * As escolhas são lembradas (localStorage) e reaplicadas ao abrir a página.
 *
 * O arquivo funciona no navegador (script comum) e também em Node (testes com jsdom).
 */
(function (raiz) {
  'use strict';

  // O CSS do site usa px, então ampliamos com `zoom` (suportado por todos os navegadores atuais).
  var NIVEIS_DE_ZOOM = [1, 1.1, 1.25, 1.5];
  var CHAVE = 'portal.acessibilidade.v1';

  function lerPreferencias(armazenamento) {
    try {
      var salvo = JSON.parse(armazenamento.getItem(CHAVE) || '{}');
      var nivel = Number.isInteger(salvo.nivel) ? salvo.nivel : 0;
      return {
        nivel: Math.min(Math.max(nivel, 0), NIVEIS_DE_ZOOM.length - 1), // valor adulterado no storage não quebra nada
        contraste: salvo.contraste === true,
        pausado: salvo.pausado === true,
      };
    } catch (e) {
      return { nivel: 0, contraste: false, pausado: false };
    }
  }

  function salvarPreferencias(armazenamento, prefs) {
    try {
      armazenamento.setItem(CHAVE, JSON.stringify(prefs));
    } catch (e) {
      /* modo privado / storage cheio: a preferência só vale nesta visita */
    }
  }

  function iniciarAcessibilidade(doc, armazenamento) {
    var prefs = lerPreferencias(armazenamento);
    var corpo = doc.body;

    function aplicar() {
      corpo.style.zoom = NIVEIS_DE_ZOOM[prefs.nivel] === 1 ? '' : String(NIVEIS_DE_ZOOM[prefs.nivel]);
      corpo.classList.toggle('alto-contraste', prefs.contraste);
      corpo.classList.toggle('animacoes-pausadas', prefs.pausado);

      var contraste = doc.querySelector('[data-acao="contraste"]');
      var animacoes = doc.querySelector('[data-acao="animacoes"]');
      if (contraste) contraste.setAttribute('aria-pressed', String(prefs.contraste));
      if (animacoes) animacoes.setAttribute('aria-pressed', String(prefs.pausado));

      var aumentar = doc.querySelector('[data-acao="aumentar"]');
      var diminuir = doc.querySelector('[data-acao="diminuir"]');
      if (aumentar) aumentar.disabled = prefs.nivel === NIVEIS_DE_ZOOM.length - 1;
      if (diminuir) diminuir.disabled = prefs.nivel === 0;

      doc.dispatchEvent(new doc.defaultView.CustomEvent('acessibilidade:mudou', { detail: { pausado: prefs.pausado } }));
    }

    var acoes = {
      aumentar: function () { prefs.nivel = Math.min(prefs.nivel + 1, NIVEIS_DE_ZOOM.length - 1); },
      diminuir: function () { prefs.nivel = Math.max(prefs.nivel - 1, 0); },
      contraste: function () { prefs.contraste = !prefs.contraste; },
      animacoes: function () { prefs.pausado = !prefs.pausado; },
    };

    doc.querySelectorAll('[data-acao]').forEach(function (botao) {
      botao.addEventListener('click', function () {
        var acao = acoes[botao.getAttribute('data-acao')];
        if (!acao) return;
        acao();
        salvarPreferencias(armazenamento, prefs);
        aplicar();
      });
    });

    aplicar();
    return { prefs: prefs };
  }

  var api = { iniciarAcessibilidade: iniciarAcessibilidade, lerPreferencias: lerPreferencias, NIVEIS_DE_ZOOM: NIVEIS_DE_ZOOM, CHAVE: CHAVE };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else raiz.Acessibilidade = api;
})(typeof window !== 'undefined' ? window : globalThis);
