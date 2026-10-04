'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

const RAIZ = path.join(__dirname, '..');

function carregarPagina() {
  const html = fs.readFileSync(path.join(RAIZ, 'index.html'), 'utf8');
  const dom = new JSDOM(html, { url: 'http://localhost/' });
  return { dom, doc: dom.window.document, html };
}

/** localStorage falso para os testes. */
function armazenamentoFalso(inicial = {}) {
  const dados = { ...inicial };
  return {
    dados,
    getItem: (k) => (k in dados ? dados[k] : null),
    setItem: (k, v) => { dados[k] = String(v); },
  };
}

module.exports = { RAIZ, carregarPagina, armazenamentoFalso };
