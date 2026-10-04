'use strict';

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { carregarPagina, armazenamentoFalso } = require('./ajuda');
const { iniciarAcessibilidade, NIVEIS_DE_ZOOM, CHAVE } = require('../acessibilidade');
const { iniciarMenu } = require('../menu');
const { iniciarCarrossel, visiveisPorLargura, totalDePosicoes, proximaPosicao } = require('../carrossel');

const clicar = (doc, el) => el.dispatchEvent(new doc.defaultView.MouseEvent('click', { bubbles: true, cancelable: true }));
const botao = (doc, acao) => doc.querySelector(`[data-acao="${acao}"]`);

describe('barra de acessibilidade', () => {
  test('aumentar/diminuir texto respeita os limites e desabilita o botão no extremo', () => {
    const { doc } = carregarPagina();
    iniciarAcessibilidade(doc, armazenamentoFalso());
    assert.equal(botao(doc, 'diminuir').disabled, true, 'começa no menor nível');
    for (let i = 0; i < 10; i++) clicar(doc, botao(doc, 'aumentar'));
    assert.equal(doc.body.style.zoom, String(NIVEIS_DE_ZOOM.at(-1)));
    assert.equal(botao(doc, 'aumentar').disabled, true);
    clicar(doc, botao(doc, 'diminuir'));
    assert.equal(doc.body.style.zoom, String(NIVEIS_DE_ZOOM.at(-2)));
  });

  test('alto contraste e pausar animações alternam classe e aria-pressed', () => {
    const { doc } = carregarPagina();
    iniciarAcessibilidade(doc, armazenamentoFalso());
    clicar(doc, botao(doc, 'contraste'));
    assert.ok(doc.body.classList.contains('alto-contraste'));
    assert.equal(botao(doc, 'contraste').getAttribute('aria-pressed'), 'true');
    clicar(doc, botao(doc, 'contraste'));
    assert.ok(!doc.body.classList.contains('alto-contraste'));
    clicar(doc, botao(doc, 'animacoes'));
    assert.ok(doc.body.classList.contains('animacoes-pausadas'));
  });

  test('as escolhas são lembradas e reaplicadas na próxima visita', () => {
    const arm = armazenamentoFalso();
    const a = carregarPagina().doc;
    iniciarAcessibilidade(a, arm);
    clicar(a, botao(a, 'aumentar'));
    clicar(a, botao(a, 'contraste'));

    const b = carregarPagina().doc;
    iniciarAcessibilidade(b, arm);
    assert.equal(b.body.style.zoom, String(NIVEIS_DE_ZOOM[1]));
    assert.ok(b.body.classList.contains('alto-contraste'));
  });

  test('valores adulterados ou lixo no localStorage não quebram a página', () => {
    for (const lixo of ['{isto não é json', '{"nivel": 999, "contraste": "sim"}', '{"nivel": -5}', 'null']) {
      const { doc } = carregarPagina();
      assert.doesNotThrow(() => iniciarAcessibilidade(doc, armazenamentoFalso({ [CHAVE]: lixo })), lixo);
      assert.ok(NIVEIS_DE_ZOOM.map(String).includes(doc.body.style.zoom || '1'));
    }
  });

  test('storage que lança erro (modo privado) não impede o uso', () => {
    const { doc } = carregarPagina();
    const quebrado = { getItem() { throw new Error('bloqueado'); }, setItem() { throw new Error('cheio'); } };
    assert.doesNotThrow(() => iniciarAcessibilidade(doc, quebrado));
    assert.doesNotThrow(() => clicar(doc, botao(doc, 'contraste')));
    assert.ok(doc.body.classList.contains('alto-contraste'));
  });
});

describe('menu', () => {
  test('clicar no gatilho abre o submenu, atualiza aria-expanded e fecha os outros', () => {
    const { doc } = carregarPagina();
    iniciarMenu(doc);
    const [governo, cidade] = doc.querySelectorAll('.menu-com-submenu');
    clicar(doc, governo.querySelector(':scope > a'));
    assert.ok(governo.classList.contains('aberto'));
    assert.equal(governo.querySelector(':scope > a').getAttribute('aria-expanded'), 'true');

    clicar(doc, cidade.querySelector(':scope > a'));
    assert.ok(cidade.classList.contains('aberto') && !governo.classList.contains('aberto'));
    assert.equal(governo.querySelector(':scope > a').getAttribute('aria-expanded'), 'false');
  });

  test('Esc fecha e clicar fora fecha', () => {
    const { doc } = carregarPagina();
    iniciarMenu(doc);
    const item = doc.querySelector('.menu-com-submenu');
    clicar(doc, item.querySelector(':scope > a'));
    item.dispatchEvent(new doc.defaultView.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    assert.ok(!item.classList.contains('aberto'));

    clicar(doc, item.querySelector(':scope > a'));
    clicar(doc, doc.querySelector('main'));
    assert.ok(!item.classList.contains('aberto'));
  });

  test('botão do menu no celular alterna a lista e aria-expanded', () => {
    const { doc } = carregarPagina();
    iniciarMenu(doc);
    const alternar = doc.querySelector('.menu-alternar');
    clicar(doc, alternar);
    assert.ok(doc.getElementById('menu-principal').classList.contains('menu-aberto'));
    assert.equal(alternar.getAttribute('aria-expanded'), 'true');
    clicar(doc, alternar);
    assert.equal(alternar.getAttribute('aria-expanded'), 'false');
  });

  test('links com href="#" não pulam para o topo da página', () => {
    const { doc } = carregarPagina();
    iniciarMenu(doc);
    const evento = new doc.defaultView.MouseEvent('click', { bubbles: true, cancelable: true });
    doc.querySelector('.redes a').dispatchEvent(evento);
    assert.equal(evento.defaultPrevented, true);
  });
});

describe('carrossel', () => {
  test('funções puras: quantos cards cabem, posições e rotação', () => {
    assert.equal(visiveisPorLargura(1130, 262, 10), 4);
    assert.equal(visiveisPorLargura(600, 262, 10), 2);
    assert.equal(visiveisPorLargura(100, 262, 10), 1, 'nunca menos que 1');
    assert.equal(visiveisPorLargura(500, 0, 10), 1, 'medida inválida');
    assert.equal(totalDePosicoes(6, 4), 3);
    assert.equal(totalDePosicoes(3, 4), 1, 'cabem todos: nada para rolar');
    assert.equal(proximaPosicao(2, 3), 0);
  });

  function montar(opcoes = {}) {
    const { doc } = carregarPagina();
    const c = iniciarCarrossel({ documento: doc, medidas: () => ({ disponivel: 1130, card: 262 }), reduzirMovimento: () => false, intervalo: 10_000_000, ...opcoes });
    return { doc, c };
  }

  test('gera uma bolinha-botão por posição, com rótulo, e marca a atual', () => {
    const { doc, c } = montar();
    const bolinhas = doc.querySelectorAll('.bolinhas button');
    assert.equal(bolinhas.length, 3);
    assert.match(bolinhas[0].getAttribute('aria-label'), /Ir para o grupo 1 de 3/);
    assert.equal(bolinhas[0].getAttribute('aria-current'), 'true');
    clicar(doc, bolinhas[2]);
    assert.equal(c.estado.posicao, 2);
    assert.equal(bolinhas[2].getAttribute('aria-current'), 'true');
    assert.equal(bolinhas[0].getAttribute('aria-current'), null);
    assert.equal(doc.querySelector('.carrossel-wrapper').style.transform, `translateX(${-2 * 272}px)`);
    c.parar();
  });

  test('avança sozinho e volta ao início no fim', () => {
    const { c } = montar();
    c.avancar(); c.avancar();
    assert.equal(c.estado.posicao, 2);
    c.avancar();
    assert.equal(c.estado.posicao, 0);
    c.parar();
  });

  test('o botão de pausa para a rotação e troca o rótulo (WCAG 2.2.2)', () => {
    const { doc, c } = montar();
    const pausa = doc.querySelector('.carrossel-pausa');
    clicar(doc, pausa);
    assert.equal(pausa.getAttribute('aria-pressed'), 'true');
    assert.match(pausa.getAttribute('aria-label'), /Retomar/);
    c.avancar();
    assert.equal(c.estado.posicao, 0, 'pausado: não avança');
    clicar(doc, pausa);
    c.avancar();
    assert.equal(c.estado.posicao, 1);
    c.parar();
  });

  test('pausa enquanto o mouse está sobre o carrossel e quando "pausar animações" está ligado', () => {
    const { doc, c } = montar();
    const area = doc.querySelector('.carrossel-noticias');
    area.dispatchEvent(new doc.defaultView.Event('mouseenter'));
    c.avancar();
    assert.equal(c.estado.posicao, 0);
    area.dispatchEvent(new doc.defaultView.Event('mouseleave'));
    doc.body.classList.add('animacoes-pausadas');
    c.avancar();
    assert.equal(c.estado.posicao, 0);
    doc.body.classList.remove('animacoes-pausadas');
    c.avancar();
    assert.equal(c.estado.posicao, 1);
    c.parar();
  });

  test('respeita a preferência do sistema por menos movimento', () => {
    const { c } = montar({ reduzirMovimento: () => true });
    c.avancar();
    assert.equal(c.estado.posicao, 0);
    c.parar();
  });

  test('em tela estreita mostra menos cards por vez e recalcula as posições', () => {
    let largura = 1130;
    const { doc, c } = montar({ medidas: () => ({ disponivel: largura, card: 262 }) });
    assert.equal(c.estado.visiveis, 4);
    largura = 300;
    c.recalcular();
    assert.equal(c.estado.visiveis, 1);
    assert.equal(doc.querySelectorAll('.bolinhas button').length, 6);
    c.parar();
  });

  test('cards fora da área visível ficam fora da tabulação e dos leitores de tela', () => {
    const { doc, c } = montar();
    const cards = [...doc.querySelectorAll('.card-noticia')];
    assert.deepEqual(cards.map((x) => x.getAttribute('aria-hidden')), ['false', 'false', 'false', 'false', 'true', 'true']);
    assert.equal(cards[5].querySelector('a').tabIndex, -1);
    c.irPara(2);
    assert.deepEqual(cards.map((x) => x.getAttribute('aria-hidden')), ['true', 'true', 'false', 'false', 'false', 'false']);
    c.parar();
  });
});
