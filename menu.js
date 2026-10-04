/**
 * Menu principal acessível:
 *  - submenus abrem por clique/toque e por teclado (Enter/Espaço), não só ao passar o mouse;
 *  - Esc fecha e devolve o foco; clicar fora fecha;
 *  - no celular, o botão "Menu" mostra/esconde a lista (aria-expanded).
 */
(function (raiz) {
  'use strict';

  function iniciarMenu(doc) {
    var alternar = doc.querySelector('.menu-alternar');
    var menu = doc.getElementById('menu-principal');
    var itens = Array.prototype.slice.call(doc.querySelectorAll('.menu-com-submenu'));

    function fecharTodos(exceto) {
      itens.forEach(function (item) {
        if (item === exceto) return;
        item.classList.remove('aberto');
        var gatilho = item.querySelector(':scope > a');
        if (gatilho) gatilho.setAttribute('aria-expanded', 'false');
      });
    }

    itens.forEach(function (item) {
      var gatilho = item.querySelector(':scope > a');
      if (!gatilho) return;
      gatilho.addEventListener('click', function (e) {
        e.preventDefault();
        var abrir = !item.classList.contains('aberto');
        fecharTodos(item);
        item.classList.toggle('aberto', abrir);
        gatilho.setAttribute('aria-expanded', String(abrir));
      });
      item.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && item.classList.contains('aberto')) {
          fecharTodos();
          gatilho.focus();
        }
      });
    });

    doc.addEventListener('click', function (e) {
      if (!e.target.closest || !e.target.closest('.menu-com-submenu')) fecharTodos();
    });

    if (alternar && menu) {
      alternar.addEventListener('click', function () {
        var aberto = menu.classList.toggle('menu-aberto');
        alternar.setAttribute('aria-expanded', String(aberto));
      });
    }

    // Links ainda sem página (href="#") não devem "pular" a tela para o topo.
    doc.querySelectorAll('a[href="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) { e.preventDefault(); });
    });
  }

  var api = { iniciarMenu: iniciarMenu };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else raiz.Menu = api;
})(typeof window !== 'undefined' ? window : globalThis);
