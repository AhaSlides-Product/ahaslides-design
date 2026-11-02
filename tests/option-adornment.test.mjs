import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { evaluateInPage, resolveChrome } from '../cdp.mjs';

const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';
const lib = pathToFileURL(fileURLToPath(new URL('../lib/all.js', import.meta.url))).href;

const page = `<!doctype html><body>
<div role="radiogroup" aria-label="Mode">
  <aha-radio id="a" name="m" value="a" checked help="Plain tip">A</aha-radio>
  <aha-radio id="b" name="m" value="b" locked plan="essential" feature-key="b_key">B</aha-radio>
  <aha-radio id="c" name="m" value="c">C</aha-radio>
</div>
<aha-radio id="card" name="k" value="x" variant="card" help="Card tip" description="Desc">Card</aha-radio>
<aha-radio id="btn" name="v" value="x" variant="button" help="Button tip">Btn</aha-radio>
<aha-checkbox id="ck" help="Checkbox tip">Tick me</aha-checkbox>
<aha-checkbox id="lk" locked>Locked tick</aha-checkbox>
<aha-checkbox id="plain">Plain</aha-checkbox>
<script type="module">import '${lib}'; window.ready = true;</script>`;

test('help and locked options on radio and checkbox never select or tick; locked opens the paywall', { skip }, async () => {
  const file = join(mkdtempSync(join(tmpdir(), 'option-adornment-')), 'page.html');
  writeFileSync(file, page);
  const result = await evaluateInPage(pathToFileURL(file).href, `(() => new Promise((resolve) => {
    const $ = (id) => document.getElementById(id);
    const shown = (el, sel) => getComputedStyle(el.shadowRoot.querySelector(sel)).display !== 'none';
    const events = [];
    document.addEventListener('change', (e) => events.push(e.target.id));
    const a = $('a'), b = $('b'), c = $('c'), ck = $('ck'), lk = $('lk');
    const out = {};
    out.helpShown = shown(a, '.help'); out.helpHiddenOnPlain = !shown(c, '.help');
    out.lockShown = shown(b, '.lock'); out.lockReplacesHelp = !shown(b, '.help');
    out.description = [a.getAttribute('aria-description'), b.getAttribute('aria-description'), ck.getAttribute('aria-description'), $('plain').getAttribute('aria-description')];
    out.helpTabStop = a.shadowRoot.querySelector('.help').shadowRoot.querySelector('button').tabIndex;
    a.shadowRoot.querySelector('.help').shadowRoot.querySelector('button').click();
    ck.shadowRoot.querySelector('.help').shadowRoot.querySelector('button').click();
    out.afterHelpClick = { a: a.checked, ck: ck.checked };
    $('card').click(); $('btn').click();
    out.cardBtnStillSelect = [$('card').checked, $('btn').checked];
    b.click();
    out.lockedRadio = { checked: b.checked, aChecked: a.checked, paywallOpen: b.shadowRoot.querySelector('.lock').open };
    b.shadowRoot.querySelector('.lock').open = false;
    lk.shadowRoot.querySelector('label').click();
    out.lockedCheckbox = { checked: lk.checked, paywallOpen: lk.shadowRoot.querySelector('.lock').open };
    lk.shadowRoot.querySelector('.lock').open = false;
    lk.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true, composed: true }));
    out.lockedCheckboxSpace = { checked: lk.checked, paywallOpen: lk.shadowRoot.querySelector('.lock').open };
    b.shadowRoot.querySelector('.lock').open = false;
    b.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true, composed: true }));
    out.lockedRadioSpace = { checked: b.checked, paywallOpen: b.shadowRoot.querySelector('.lock').open };
    a.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, composed: true }));
    out.arrowSkipsLocked = { b: b.checked, c: c.checked };
    out.tabindex = [a.tabIndex, b.tabIndex, c.tabIndex];
    out.paywall = { plan: b.shadowRoot.querySelector('.lock').getAttribute('required-plan'), key: b.shadowRoot.querySelector('.lock').getAttribute('feature-key') };
    out.plainUnchanged = !$('plain').hasAttribute('has-help') && !$('plain').hasAttribute('aria-description');
    ck.shadowRoot.querySelector('label').click();
    out.checkboxStillTicks = ck.checked;
    out.events = events;
    setTimeout(() => resolve(out), 20);
  }))()`, { readyExpr: '!!window.ready && !!customElements.get("aha-radio") && !!customElements.get("aha-checkbox")' });

  assert.equal(result.helpShown, true);
  assert.equal(result.helpHiddenOnPlain, true);
  assert.equal(result.lockShown, true);
  assert.equal(result.lockReplacesHelp, true);
  assert.deepEqual(result.description, ['Plain tip', 'Requires the Essential plan.', 'Checkbox tip', null]);
  assert.equal(result.helpTabStop, -1);
  assert.deepEqual(result.afterHelpClick, { a: true, ck: false });
  assert.deepEqual(result.cardBtnStillSelect, [true, true]);
  assert.deepEqual(result.lockedRadio, { checked: false, aChecked: true, paywallOpen: true });
  assert.deepEqual(result.lockedCheckbox, { checked: false, paywallOpen: true });
  assert.deepEqual(result.lockedCheckboxSpace, { checked: false, paywallOpen: true });
  assert.deepEqual(result.lockedRadioSpace, { checked: false, paywallOpen: true });
  assert.deepEqual(result.arrowSkipsLocked, { b: false, c: true });
  assert.deepEqual(result.tabindex, [-1, 0, 0]);
  assert.deepEqual(result.paywall, { plan: 'essential', key: 'b_key' });
  assert.equal(result.plainUnchanged, true);
  assert.equal(result.checkboxStillTicks, true);
  assert.deepEqual(result.events, ['card', 'btn', 'c', 'ck']);
});
