import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { evaluateInPage, resolveChrome, withPage } from '../cdp.mjs';

const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';
const lib = pathToFileURL(fileURLToPath(new URL('../lib/all.js', import.meta.url))).href;

async function run(body) {
  const file = join(mkdtempSync(join(tmpdir(), 'question-list-header-')), 'page.html');
  writeFileSync(file, `<!doctype html><body style="width:420px">
<aha-question-list id="list" min="1" questions='[
  {"id":"q1","prompt":"First","options":[{"text":"A"},{"text":"B"}]},
  {"id":"q2","prompt":"Second","status":{"message":"Only 2s after Q1.","tone":"warning"},"options":[{"text":"A"},{"text":"B"}]},
  {"id":"q3","prompt":"Third","status":{"message":"Heads up"},"options":[{"text":"A"},{"text":"B"}]},
  {"id":"q4","prompt":"Fourth","status":{"message":"Broken","tone":"error"},"options":[{"text":"A"},{"text":"B"}]}]'>
  <span slot="before-q1" id="tag">00:23</span>
  <span slot="after-q1">after</span>
  <span slot="marker-q2" id="icon">*</span>
  <span slot="start-q3" id="start">s</span>
  <span slot="end-q3" id="end1">e1</span><span slot="end-q3" id="end2">e2</span>
</aha-question-list>
<script type="module">import '${lib}'; await customElements.whenDefined('aha-question-list'); await new Promise((r) => requestAnimationFrame(r)); window.ready = true;</script>`);
  return evaluateInPage(pathToFileURL(file).href, `(async () => { const frame = () => new Promise((done) => setTimeout(done, 250)); ${body} })()`, { readyExpr: '!!window.ready', timeout: 45000 });
}

test('status survives normalise with tone defaulting to info, and round-trips in the change event', { skip }, async () => {
  const result = await run(`
    const list = document.getElementById('list');
    let detail;
    list.addEventListener('change', (e) => { detail = e.detail.questions; });
    list.shadowRoot.querySelector('aha-counted-input').dispatchEvent(new CustomEvent('input', { bubbles: true, composed: true, detail: { value: 'First!' } }));
    return { status: list.questions.map((q) => q.status || null), emitted: detail.map((q) => q.status || null) };
  `);
  const expected = [null, { message: 'Only 2s after Q1.', tone: 'warning' }, { message: 'Heads up', tone: 'info' }, { message: 'Broken', tone: 'error' }];
  assert.deepEqual(result.status, expected);
  assert.deepEqual(result.emitted, expected);
});

test('header slots are keyed per question; the marker slot keeps a "Question N" name', { skip }, async () => {
  const result = await run(`
    const list = document.getElementById('list');
    const header = (i) => list.shadowRoot.querySelectorAll('.question')[i];
    const holder = (i, cls) => header(i).querySelector('.' + cls);
    return {
      beforeQ1: holder(0, 'before').hasAttribute('data-filled'),
      afterQ1: holder(0, 'after').hasAttribute('data-filled'),
      beforeQ2: holder(1, 'before').hasAttribute('data-filled'),
      markerQ1Filled: holder(0, 'marker').hasAttribute('data-filled'),
      markerQ2Filled: holder(1, 'marker').hasAttribute('data-filled'),
      tagAssignedTo: document.getElementById('tag').assignedSlot && document.getElementById('tag').assignedSlot.name,
      nameVisible: getComputedStyle(holder(1, 'marker').querySelector('.name')).display,
      nameHiddenWhenNumber: getComputedStyle(holder(0, 'marker').querySelector('.name')).display,
      statusCount: list.shadowRoot.querySelectorAll('aha-field-error').length,
      startQ3: holder(2, 'start').hasAttribute('data-filled'),
      endQ3Children: [...holder(2, 'end').querySelector('slot').assignedNodes()].map((n) => n.id),
      endGap: getComputedStyle(holder(2, 'end')).columnGap,
      endLast: (() => { const line = holder(2, 'end').parentElement; return line.lastElementChild === holder(2, 'end') && holder(2, 'end').getBoundingClientRect().right <= line.getBoundingClientRect().right + 0.5; })(),
      endNeverShrinks: getComputedStyle(holder(2, 'end')).flexShrink,
      promptClamp: getComputedStyle(holder(0, 'prompt')).webkitLineClamp + '/' + getComputedStyle(holder(0, 'prompt')).whiteSpace,
    };
  `);
  assert.deepEqual(result, {
    beforeQ1: true, afterQ1: true, beforeQ2: false, markerQ1Filled: false, markerQ2Filled: true,
    startQ3: true, endQ3Children: ['end1', 'end2'], endGap: '6px', endLast: true, endNeverShrinks: '0', tagAssignedTo: 'before-q1', nameVisible: 'block', nameHiddenWhenNumber: 'none', statusCount: 3, promptClamp: '2/normal',
  });
});

test('delete is hidden at rest, revealed on hover or keyboard focus like OptionRow, and is a Tab stop', { skip }, async () => {
  const file = join(mkdtempSync(join(tmpdir(), 'question-list-delete-')), 'page.html');
  writeFileSync(file, `<!doctype html><body style="width:420px;margin:40px">
<aha-question-list id="list" min="1" questions='[{"id":"q1","prompt":"First","options":[{"text":"A"},{"text":"B"}]},{"id":"q2","prompt":"Second","options":[{"text":"A"},{"text":"B"}]}]'></aha-question-list>
<script type="module">import '${lib}'; await customElements.whenDefined('aha-question-list'); await new Promise((r) => requestAnimationFrame(r)); window.ready = true;</script>`);
  const read = (command, expression) => command('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }).then((r) => r.result.value);
  const opacity = "getComputedStyle(document.getElementById('list').shadowRoot.querySelector('.question .delete')).opacity";
  const settle = "new Promise((done) => setTimeout(done, 250))";
  const result = await withPage(pathToFileURL(file).href, async (command) => {
    const out = {};
    out.tabIndex = await read(command, "document.getElementById('list').shadowRoot.querySelector('.question .delete aha-button').shadowRoot.querySelector('button').tabIndex");
    out.rest = await read(command, opacity);
    const box = await read(command, "(() => { const r = document.getElementById('list').shadowRoot.querySelector('.question aha-collapse').getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + 20 }; })()");
    await command('Input.dispatchMouseEvent', { type: 'mouseMoved', x: box.x, y: box.y });
    await read(command, settle);
    out.hover = await read(command, opacity);
    await command('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 5, y: 5 });
    await read(command, settle);
    out.afterLeave = await read(command, opacity);
    await command('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Shift', code: 'ShiftLeft' });
    await command('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Shift', code: 'ShiftLeft' });
    await read(command, "document.getElementById('list').shadowRoot.querySelector('.question aha-collapse').shadowRoot.querySelector('button').focus()");
    await read(command, settle);
    out.headerFocus = await read(command, opacity);
    await read(command, "document.getElementById('list').shadowRoot.querySelector('.question .delete aha-button').shadowRoot.querySelector('button').focus()");
    await read(command, settle);
    out.deleteFocus = await read(command, opacity);
    out.deleteReached = await read(command, "document.getElementById('list').shadowRoot.activeElement === document.getElementById('list').shadowRoot.querySelector('.question .delete aha-button')");
    await read(command, "(() => { window.seen = []; document.getElementById('list').addEventListener('change', () => window.seen.push(1)); document.getElementById('list').shadowRoot.querySelector('.question .delete aha-button').shadowRoot.querySelector('button').click(); })()");
    out.countAfterDelete = await read(command, "document.getElementById('list').shadowRoot.querySelectorAll('.question').length");
    return out;
  }, { readyExpr: '!!window.ready' });
  assert.deepEqual(result, { tabIndex: 0, rest: '0', hover: '1', afterLeave: '0', headerFocus: '1', deleteFocus: '1', deleteReached: true, countAfterDelete: 1 });
});

test('warning and error cards recolour the border with the status tokens; info and none keep the default', { skip }, async () => {
  const result = await run(`
    const list = document.getElementById('list');
    const cards = [...list.shadowRoot.querySelectorAll('.question')];
    const border = (card) => getComputedStyle(card.querySelector('aha-collapse').shadowRoot.querySelector('.panel')).borderTopColor;
    const probe = document.createElement('div');
    document.body.append(probe);
    const resolve = (name) => { probe.style.color = 'var(' + name + ', #1A1A1A)'; return getComputedStyle(probe).color; };
    return {
      tones: cards.map((card) => card.dataset.tone || null),
      parts: cards.map((card) => card.getAttribute('part')),
      distinctFromDefault: [border(cards[1]) !== border(cards[0]), border(cards[3]) !== border(cards[0]), border(cards[2]) === border(cards[0])],
      warningToken: border(cards[1]) === resolve('--aha-border-warning'),
      errorToken: border(cards[3]) === resolve('--aha-border-error'),
      width: getComputedStyle(cards[1].querySelector('aha-collapse').shadowRoot.querySelector('.panel')).borderTopWidth,
    };
  `);
  assert.deepEqual(result.tones, [null, 'warning', null, 'error']);
  assert.deepEqual(result.parts, ['question', 'question question-warning', 'question', 'question question-error']);
  assert.equal(result.width, '1px');
  assert.equal(result.warningToken, true);
  assert.equal(result.errorToken, true);
});

test('body-<id> slot: interactive, inert for the collapse, above the Question row, follows its id', { skip }, async () => {
  const result = await run(`
    const list = document.getElementById('list');
    const input = document.createElement('input');
    input.id = 'time'; input.slot = 'body-q1';
    const stale = document.createElement('input');
    stale.slot = 'body-gone';
    list.append(input, stale);
    await frame();
    const cards = () => [...list.shadowRoot.querySelectorAll('.question')];
    const collapse = () => cards()[0].querySelector('aha-collapse');
    const holder = (i) => cards()[i].querySelector('.body-slot');
    const out = {};
    out.filled = [holder(0).hasAttribute('data-filled'), holder(1).hasAttribute('data-filled')];
    out.closedHidden = getComputedStyle(holder(0)).visibility;
    collapse().shadowRoot.querySelector('button').click();
    await frame();
    out.opened = collapse().hasAttribute('open');
    out.openVisible = getComputedStyle(holder(0)).visibility;
    const fields = holder(0).parentElement;
    out.firstInFields = fields.firstElementChild === holder(0);
    out.aboveQuestionRow = input.getBoundingClientRect().bottom <= fields.querySelector('aha-setting-row').getBoundingClientRect().top;
    out.staleAssigned = stale.assignedSlot;
    let hostEvents = 0;
    list.addEventListener('input', () => hostEvents++);
    input.focus();
    out.focused = document.activeElement === input;
    input.click();
    for (const key of ['Enter', ' ']) input.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, composed: true }));
    input.value = '1:05';
    input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    await frame();
    out.stillOpen = collapse().hasAttribute('open');
    out.hostSawInput = hostEvents;
    const model = list.questions;
    model.reverse(); list.questions = model;
    await frame();
    out.afterReorder = [input.assignedSlot && input.assignedSlot.closest(".question") === cards()[3], input.isConnected];
    model.push({ id: 'q5', options: [{}, {}] }); list.questions = model;
    await frame();
    out.afterAdd = input.assignedSlot !== null;
    list.questions = model.filter((q) => q.id !== 'q1');
    await frame();
    out.afterDelete = input.assignedSlot;
    return out;
  `);
  assert.deepEqual(result, {
    filled: [true, false], closedHidden: 'hidden', opened: true, openVisible: 'visible', firstInFields: true, aboveQuestionRow: true, staleAssigned: null,
    focused: true, stillOpen: true, hostSawInput: 1, afterReorder: [true, true], afterAdd: true, afterDelete: null,
  });
});
