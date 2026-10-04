'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { carregarPagina, RAIZ } = require('./ajuda');

const { doc, html } = carregarPagina();

const arquivosLocais = [...doc.querySelectorAll('[src], link[href]')]
  .map((e) => e.getAttribute('src') ?? e.getAttribute('href'))
  .filter((u) => u && !/^(https?:)?\/\//.test(u) && !u.startsWith('#') && !u.startsWith('data:'));

test('todos os arquivos referenciados existem, com a MESMA caixa de letras (Linux/GitHub Pages diferenciam)', () => {
  assert.ok(arquivosLocais.length >= 10);
  for (const url of arquivosLocais) {
    const caminho = path.join(RAIZ, url);
    assert.ok(fs.existsSync(caminho), `não existe: ${url}`);
    // existsSync é "frouxo" no Windows/macOS; confere o nome exato listando a pasta.
    const pasta = path.dirname(caminho);
    assert.ok(fs.readdirSync(pasta).includes(path.basename(caminho)), `caixa diferente no disco: ${url}`);
  }
});

test('não restam imagens sem uso nem arquivos de imagem fora do padrão (minúsculas, sem espaços)', () => {
  const usadas = new Set(arquivosLocais.filter((u) => u.startsWith('img/') || u.startsWith('./img/')).map((u) => path.basename(u)));
  for (const arquivo of fs.readdirSync(path.join(RAIZ, 'img'))) {
    assert.match(arquivo, /^[a-z0-9-]+\.(png|jpg|svg)$/, `nome fora do padrão: ${arquivo}`);
    assert.ok(usadas.has(arquivo), `imagem não usada: ${arquivo}`);
  }
});

test('toda imagem tem atributo alt; as de conteúdo têm texto descritivo e único', () => {
  const imagens = [...doc.querySelectorAll('img')];
  assert.ok(imagens.length > 0);
  const alts = [];
  for (const img of imagens) {
    assert.ok(img.hasAttribute('alt'), `<img> sem alt: ${img.getAttribute('src')}`);
    if (img.closest('.card-noticia, .card-noticia-principal')) {
      const alt = img.getAttribute('alt').trim();
      assert.ok(alt.length >= 8, `alt curto demais: "${alt}"`);
      alts.push(alt);
    }
  }
  assert.equal(new Set(alts).size, alts.length, 'textos alternativos repetidos entre notícias');
});

test('todo botão e todo link têm nome acessível', () => {
  for (const el of doc.querySelectorAll('button, a[href]')) {
    const nome = (el.getAttribute('aria-label') || el.textContent || '').trim();
    assert.ok(nome.length > 0, `sem nome acessível: ${el.outerHTML.slice(0, 90)}`);
  }
});

test('todo campo de formulário tem rótulo', () => {
  for (const campo of doc.querySelectorAll('input, select, textarea')) {
    const temRotulo = campo.hasAttribute('aria-label') || campo.id && doc.querySelector(`label[for="${campo.id}"]`) || campo.closest('label');
    assert.ok(temRotulo, `campo sem rótulo: ${campo.outerHTML.slice(0, 90)}`);
  }
});

test('botões não-submit declaram type e os ícones decorativos ficam escondidos de leitores de tela', () => {
  for (const b of doc.querySelectorAll('button')) assert.ok(b.hasAttribute('type'), `botão sem type: ${b.outerHTML.slice(0, 80)}`);
  for (const i of doc.querySelectorAll('button i.fas, button i.fab, a i.fas, a i.fab')) {
    // ícones dentro de textos visíveis podem ficar; os de botões/links sem texto precisam de aria-hidden
    const semTexto = !(i.parentElement.textContent || '').trim();
    if (semTexto) assert.equal(i.getAttribute('aria-hidden'), 'true', i.parentElement.outerHTML.slice(0, 90));
  }
});

test('estrutura: idioma, título, um único h1, skip link, marcos e ids únicos', () => {
  assert.equal(doc.documentElement.lang, 'pt-br');
  assert.ok(doc.title.length > 5);
  assert.equal(doc.querySelectorAll('h1').length, 1);
  const alvo = doc.querySelector('.pular-conteudo').getAttribute('href').slice(1);
  assert.ok(doc.getElementById(alvo), 'o link "pular conteúdo" aponta para um id que existe');
  for (const marco of ['header', 'nav[aria-label]', 'main', 'footer']) assert.ok(doc.querySelector(marco), `falta ${marco}`);
  const ids = [...doc.querySelectorAll('[id]')].map((e) => e.id);
  assert.equal(new Set(ids).size, ids.length, 'ids duplicados');
});

test('sem script inline nem manipuladores inline; Font Awesome com SRI; CSP definida', () => {
  assert.ok(![...doc.querySelectorAll('script')].some((s) => !s.src), 'script inline encontrado');
  assert.ok(!/\son(click|load|error|mouseover)=/i.test(html), 'manipulador inline encontrado');
  const fa = doc.querySelector('link[href*="font-awesome"]');
  assert.match(fa.getAttribute('integrity'), /^sha512-/);
  assert.equal(fa.getAttribute('crossorigin'), 'anonymous');
  const csp = doc.querySelector('meta[http-equiv="Content-Security-Policy"]').content;
  assert.match(csp, /script-src 'self'/);
  assert.match(csp, /default-src 'self'/);
});

test('o site avisa que é um projeto de estudo sem vínculo oficial', () => {
  assert.match(doc.body.textContent, /sem vínculo oficial/i);
  assert.ok(!/Todos os direitos reservados/i.test(doc.body.textContent), 'não reivindica direitos autorais alheios');
});
