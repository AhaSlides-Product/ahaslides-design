import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { evaluateInPage, resolveChrome } from '../cdp.mjs';

const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';
const lib = pathToFileURL(fileURLToPath(new URL('../lib/aha-avatar.js', import.meta.url))).href;

const group = (attrs, tooltips) => `<aha-avatar-group ${attrs}>
  <aha-avatar name="Ada Lovelace"${tooltips ? ' tooltip' : ''}></aha-avatar>
  <aha-avatar name="Grace Hopper"${tooltips ? ' tooltip="Grace Hopper (owner)"' : ''}></aha-avatar>
  <aha-avatar name="Alan Turing"${tooltips ? ' tooltip' : ''}></aha-avatar>
  <aha-avatar name="Katherine Johnson"${tooltips ? ' tooltip' : ''}></aha-avatar>
</aha-avatar-group>`;

const page = `<!doctype html><body style="padding:80px">
<div id="plain">${group('max="2"', false)}</div>
<div id="tipped">${group('max="2" overflow-tooltip', true)}</div>
<div id="custom">${group('max="3" overflow-tooltip="1 more person"', true)}</div>
<div id="adder">${group('max="2" add add-label="Add collaborators" add-tooltip', false)}</div>
<div id="adder-plain">${group('max="2" add add-label="Add collaborators"', false)}</div>
<script type="module">import '${lib}'; window.ready = true;</script>`;

test('avatar tooltip shows the shared Tooltip on hover and keyboard focus without changing the group', { skip }, async () => {
  const file = join(mkdtempSync(join(tmpdir(), 'avatar-tooltip-')), 'page.html');
  writeFileSync(file, page);
  const result = await evaluateInPage(pathToFileURL(file).href, `(async () => {
    const frame = () => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)));
    await frame();
    const groupOf = (id) => document.querySelector('#' + id + ' aha-avatar-group');
    const kids = (id) => [...groupOf(id).querySelectorAll('aha-avatar')];
    const chip = (id) => groupOf(id).shadowRoot.querySelector('.overflow');
    const face = (avatar) => avatar.shadowRoot.querySelector('.avatar');
    const tipOf = (avatar) => avatar.shadowRoot.querySelector('aha-tooltip');
    const shown = (avatar) => getComputedStyle(tipOf(avatar).shadowRoot.querySelector('.bubble')).visibility === 'visible';
    const layout = (id) => ({
      shown: kids(id).map((k) => k.style.display !== 'none'),
      grounds: kids(id).slice(0, 2).map((k) => getComputedStyle(face(k), '::before').backgroundColor),
      lefts: kids(id).slice(0, 2).map((k) => Math.round(k.getBoundingClientRect().left - groupOf(id).getBoundingClientRect().left)),
      chip: chip(id).getAttribute('name'),
    });
    const [ada, grace] = kids('tipped');
    const plainAda = kids('plain')[0];

    tipOf(ada).dispatchEvent(new PointerEvent('pointerenter', { pointerType: 'mouse' })); await frame();
    const hover = shown(ada);
    tipOf(ada).dispatchEvent(new PointerEvent('pointerleave', { pointerType: 'mouse' })); await frame();
    tipOf(ada).dispatchEvent(new PointerEvent('pointerenter', { pointerType: 'touch' })); await frame();
    const tap = shown(ada);
    tipOf(ada).dispatchEvent(new PointerEvent('pointerleave', { pointerType: 'touch' }));

    face(grace).focus(); await frame();
    const keyboard = { focusVisible: face(grace).matches(':focus-visible'), shown: shown(grace), raised: getComputedStyle(grace).zIndex };
    face(grace).blur(); await frame();

    chip('tipped').shadowRoot.querySelector('.avatar').focus(); await frame();
    const chipShown = shown(chip('tipped'));

    const addOf = (id) => groupOf(id).shadowRoot.querySelector('button.add');
    const addLeft = (id) => Math.round(addOf(id).getBoundingClientRect().left - groupOf(id).getBoundingClientRect().left);
    const addTip = addOf('adder').parentElement;
    const addShown = () => getComputedStyle(addTip.shadowRoot.querySelector('.bubble')).visibility === 'visible';
    addTip.dispatchEvent(new PointerEvent('pointerenter', { pointerType: 'mouse' })); await frame();
    const addHover = addShown();
    addTip.dispatchEvent(new PointerEvent('pointerleave', { pointerType: 'mouse' })); await frame();
    addOf('adder').focus(); await frame();
    const addKeyboard = addShown();
    addOf('adder').blur(); await frame();
    const add = {
      text: addTip.tagName + ':' + addTip.getAttribute('text'),
      hover: addHover, keyboard: addKeyboard, afterBlur: addShown(),
      sameSpot: addLeft('adder') === addLeft('adder-plain'),
      plainParent: addOf('adder-plain').parentElement.className,
    };

    return {
      add,
      same: JSON.stringify(layout('plain')) === JSON.stringify(layout('tipped')),
      layout: layout('tipped'),
      plain: { tabindex: face(plainAda).getAttribute('tabindex'), tooltip: !!tipOf(plainAda), chipTooltip: chip('plain').hasAttribute('tooltip'), chipTabindex: face(chip('plain')).getAttribute('tabindex') },
      texts: [ada, grace].map((k) => tipOf(k).getAttribute('text')),
      tabindex: face(ada).getAttribute('tabindex'),
      hover, tap, keyboard, chipShown,
      afterBlur: shown(grace),
      chipText: chip('tipped').getAttribute('tooltip'),
      customChipText: chip('custom').getAttribute('tooltip'),
    };
  })()`, { readyExpr: '!!window.ready && !!customElements.get("aha-avatar") && !!customElements.get("aha-tooltip")' });
  assert.deepEqual(result, {
    add: { text: 'AHA-TOOLTIP:Add collaborators', hover: true, keyboard: true, afterBlur: false, sameSpot: true, plainParent: 'stack slight' },
    same: true,
    layout: { shown: [true, true, false, false], grounds: ['rgba(231, 14, 104, 0.05)', 'rgb(227, 227, 227)'], lefts: [0, 30], chip: '+2' },
    plain: { tabindex: null, tooltip: false, chipTooltip: false, chipTabindex: null },
    texts: ['Ada Lovelace', 'Grace Hopper (owner)'],
    tabindex: '0',
    hover: true,
    tap: false,
    keyboard: { focusVisible: true, shown: true, raised: '999' },
    chipShown: true,
    afterBlur: false,
    chipText: 'Alan Turing, Katherine Johnson',
    customChipText: '1 more person',
  });
});
