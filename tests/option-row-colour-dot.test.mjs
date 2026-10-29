import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { evaluateInPage, resolveChrome } from '../cdp.mjs';

const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';
const lib = pathToFileURL(fileURLToPath(new URL('../lib/all.js', import.meta.url))).href;

async function run(markup, body) {
  const file = join(mkdtempSync(join(tmpdir(), 'option-row-dot-')), 'page.html');
  writeFileSync(file, `<!doctype html><body style="--aha-deck-palette-1:rgb(10,20,30);--aha-deck-palette-2:rgb(40,50,60);--aha-deck-palette-3:rgb(70,80,90)">${markup}
<script type="module">import '${lib}'; await customElements.whenDefined('aha-option-row'); await customElements.whenDefined('aha-question-list'); await new Promise((r) => requestAnimationFrame(r)); window.ready = true;</script>`);
  return evaluateInPage(pathToFileURL(file).href, `(() => { ${body} })()`, { readyExpr: '!!window.ready' });
}

const dotOf = `const dot = (r) => r.shadowRoot.querySelector('.dot'); const fill = (r) => getComputedStyle(dot(r)).backgroundColor; const display = (r) => getComputedStyle(dot(r)).display;`;

test('the row padding leaves 4px on the right and 10px on the left, and a focused correct row keeps the content still', { skip }, async () => {
  const result = await run(`<aha-option-row id="a" value="A"></aha-option-row><aha-option-row id="b" correct value="B"></aha-option-row>`, `
    const box = (id) => document.getElementById(id).shadowRoot.querySelector('.row');
    const normal = getComputedStyle(box('a'));
    const before = box('b').getBoundingClientRect();
    const field = document.getElementById('b').shadowRoot.querySelector('.field');
    const contentLeft = () => field.getBoundingClientRect().left;
    const contentBefore = contentLeft();
    document.getElementById('b').focus();
    const focused = getComputedStyle(box('b'));
    return { normal: [normal.paddingTop, normal.paddingRight, normal.paddingBottom, normal.paddingLeft], focused: [focused.paddingTop, focused.paddingRight, focused.paddingBottom, focused.paddingLeft], moved: contentLeft() - contentBefore, height: box('b').getBoundingClientRect().height - before.height };
  `);
  assert.deepEqual(result.normal, ['3px', '4px', '3px', '10px']);
  assert.deepEqual(result.focused, ['2px', '3px', '2px', '9px']);
  assert.equal(result.moved, 0);
  assert.equal(result.height, 0);
});

test('colorindex maps to the deck palette variable, with a neutral fallback and no dot without colordot', { skip }, async () => {
  const result = await run(`
    <aha-option-row id="off" colorindex="1" value="x"></aha-option-row>
    <aha-option-row id="one" colordot colorindex="1" value="x"></aha-option-row>
    <aha-option-row id="two" colordot colorindex="2" correct correctable value="x"></aha-option-row>
    <aha-option-row id="none" colordot value="x"></aha-option-row>
    <aha-option-row id="beyond" colordot colorindex="9" value="x"></aha-option-row>`, `${dotOf}
    const r = (id) => document.getElementById(id);
    const dotNode = dot(r('one'));
    r('one').setAttribute('colorindex', '3');
    return { off: display(r('off')), one: display(r('one')), size: [getComputedStyle(dotNode).width, getComputedStyle(dotNode).height], radius: getComputedStyle(dotNode).borderTopLeftRadius,
      hidden: dotNode.getAttribute('aria-hidden'), samenode: dotNode === dot(r('one')), updated: fill(r('one')), two: fill(r('two')), none: fill(r('none')), beyond: fill(r('beyond')),
      order: [...r('two').shadowRoot.querySelector('.row').children].map((c) => c.className.split(' ')[0]) };
  `);
  assert.equal(result.off, 'none');
  assert.equal(result.one, 'block');
  assert.deepEqual(result.size, ['12px', '12px']);
  assert.equal(result.hidden, 'true');
  assert.equal(result.samenode, true);
  assert.equal(result.updated, 'rgb(70, 80, 90)');
  assert.equal(result.two, 'rgb(40, 50, 60)');
  assert.equal(result.none, result.beyond);
  assert.notEqual(result.none, 'rgba(0, 0, 0, 0)');
  assert.deepEqual(result.order.slice(0, 4), ['handle', 'correct', 'dot', 'field']);
});

test('a question list colours option n by position, cycling the palette size, and recomputes after add and delete', { skip }, async () => {
  const result = await run(`<aha-question-list id="list" colordots palette-size="3"></aha-question-list><aha-question-list id="plain"></aha-question-list>`, `${dotOf}
    const options = (n) => Array.from({ length: n }, (_, i) => ({ id: 'o' + (i + 1), text: 'Option ' + (i + 1) }));
    const list = document.getElementById('list');
    list.questions = [{ id: 'q1', prompt: 'Q', open: true, options: options(5) }];
    const indexes = () => [...list.shadowRoot.querySelectorAll('aha-option-row')].map((r) => r.getAttribute('colorindex'));
    const initial = indexes();
    const fills = [...list.shadowRoot.querySelectorAll('aha-option-row')].map(fill);
    list.questions = [{ id: 'q1', prompt: 'Q', open: true, options: options(5).filter((o) => o.id !== 'o2') }];
    const afterDelete = indexes();
    const plain = document.getElementById('plain');
    plain.questions = [{ id: 'q1', prompt: 'Q', open: true, options: options(2) }];
    const plainRow = plain.shadowRoot.querySelector('aha-option-row');
    return { initial, fills, afterDelete, plainDot: plainRow.hasAttribute('colordot') };
  `);
  assert.deepEqual(result.initial, ['1', '2', '3', '1', '2']);
  assert.deepEqual(result.fills.slice(0, 4), ['rgb(10, 20, 30)', 'rgb(40, 50, 60)', 'rgb(70, 80, 90)', 'rgb(10, 20, 30)']);
  assert.deepEqual(result.afterDelete, ['1', '2', '3', '1']);
  assert.equal(result.plainDot, false);
});
