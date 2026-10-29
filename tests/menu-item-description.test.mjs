import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { evaluateInPage, resolveChrome } from '../cdp.mjs';

const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';
const libUrl = (name) => pathToFileURL(fileURLToPath(new URL(`../lib/${name}.js`, import.meta.url))).href;
const items = JSON.stringify([
  { key: 'editor', label: 'Editor', description: 'Edit and present' },
  { key: 'presenter', label: 'Presenter' },
  { key: 'remove', label: 'Remove', description: 'Loses access', danger: true },
]).replace(/"/g, '&quot;');

const page = `<!doctype html><body>
<aha-menu id="menu" value="editor" items="${items}"></aha-menu>
<aha-dropdown id="dd" label="Share" items="${items}"></aha-dropdown>
<script type="module">import '${libUrl('aha-menu')}'; import '${libUrl('aha-dropdown')}'; window.ready = true;</script>`;

test('an item description renders as a second line linked by aria-describedby; plain rows are unchanged', { skip }, async () => {
  const file = join(mkdtempSync(join(tmpdir(), 'menu-description-')), 'page.html');
  writeFileSync(file, page);
  const result = await evaluateInPage(pathToFileURL(file).href, `(() => {
    const read = (id) => {
      const root = document.getElementById(id).shadowRoot;
      const [editor, presenter, remove] = root.querySelectorAll('.item');
      const description = (row) => row.querySelector('.description');
      const target = (row) => root.getElementById(row.getAttribute('aria-describedby') || '');
      return {
        text: description(editor) && description(editor).textContent,
        part: description(editor) && description(editor).getAttribute('part'),
        describedBy: target(editor) === description(editor),
        smaller: description(editor) && parseFloat(getComputedStyle(description(editor)).fontSize) < parseFloat(getComputedStyle(editor.querySelector('.label')).fontSize),
        plainHasNone: !description(presenter) && !presenter.hasAttribute('aria-describedby') && !presenter.classList.contains('has-description') && presenter.querySelectorAll('.text').length === 0,
        dangerKeeps: remove.classList.contains('danger') && !!description(remove),
      };
    };
    return { menu: read('menu'), dropdown: read('dd') };
  })()`, { readyExpr: '!!window.ready && !!customElements.get("aha-menu") && !!customElements.get("aha-dropdown")' });
  for (const which of ['menu', 'dropdown']) {
    assert.equal(result[which].text, 'Edit and present', which);
    assert.equal(result[which].part, 'description', which);
    assert.equal(result[which].describedBy, true, which);
    assert.equal(result[which].smaller, true, which);
    assert.equal(result[which].plainHasNone, true, which);
    assert.equal(result[which].dangerKeeps, true, which);
  }
});
