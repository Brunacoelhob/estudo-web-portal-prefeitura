/* Liga os módulos quando a página termina de carregar. */
document.addEventListener('DOMContentLoaded', function () {
  var armazenamento;
  try {
    armazenamento = window.localStorage;
  } catch (e) {
    armazenamento = { getItem: function () { return null; }, setItem: function () {} }; // storage bloqueado
  }
  Acessibilidade.iniciarAcessibilidade(document, armazenamento);
  Menu.iniciarMenu(document);
  Carrossel.iniciarCarrossel({ documento: document });
});
