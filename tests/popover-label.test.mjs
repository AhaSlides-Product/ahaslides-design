import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { evaluateInPage, resolveChrome } from '../cdp.mjs';

const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';
const lib = pathToFileURL(fileURLToPath(new URL('../lib/aha-popover.js', import.meta.url))).href;

const page = `<!doctype html><body>
<aha-popover id="bare"><button slot="trigger">t</button>Hi</aha-popover>
<aha-popover id="titled" title="Help"><button slot="trigger">t</button>Hi</aha-popover>
<script type="module">import '${lib}'; window.ready = true;</script>`;

test('a popover with no title gives its panel no accessible name; a title names it', { skip }, async () => {
  const file = join(mkdtempSync(join(tmpdir(), 'popover-label-')), 'page.html');
  writeFileSync(file, page);
  const result = await evaluateInPage(pathToFileURL(file).href, `(() => {
    const label = (id) => document.getElementById(id).shadowRoot.querySelector('.pop').getAttribute('aria-label');
    document.getElementById('titled').removeAttribute('title');
    return { bare: label('bare'), removed: label('titled') };
  })()`, { readyExpr: '!!window.ready && !!customElements.get("aha-popover")' });
  assert.deepEqual(result, { bare: null, removed: null });
});

const rolePage = `<!doctype html><body>
<aha-popover id="named" title="Help" aria-label="Sharing help"><button slot="trigger">t</button>Hi</aha-popover>
<aha-popover id="menu"><button slot="trigger">t</button> <aha-menu aria-label="Actions"></aha-menu> </aha-popover>
<aha-popover id="role-menu"><button slot="trigger">t</button><div role="menu" aria-label="Add"></div></aha-popover>
<aha-popover id="mixed" title="Options"><button slot="trigger">t</button><aha-menu></aha-menu><p>More</p></aha-popover>
<aha-popover id="unnamed"><button slot="trigger">t</button><p>Rich content</p></aha-popover>
<script type="module">
  window.warnings = [];
  console.warn = (message) => window.warnings.push(String(message));
  await import('${lib}');
  window.ready = true;
</script>`;

test('a menu-only body drops the dialog role, a dialog is named by aria-label over title, an unnamed dialog warns once on open', { skip }, async () => {
  const file = join(mkdtempSync(join(tmpdir(), 'popover-role-')), 'page.html');
  writeFileSync(file, rolePage);
  const result = await evaluateInPage(pathToFileURL(file).href, `(async () => {
    const read = (id) => {
      const root = document.getElementById(id).shadowRoot;
      const pop = root.querySelector('.pop');
      return { role: pop.getAttribute('role'), name: pop.getAttribute('aria-label'), haspopup: root.querySelector('.trigger').getAttribute('aria-haspopup') };
    };
    const before = window.warnings.length;
    const unnamed = document.getElementById('unnamed');
    unnamed.open = true; unnamed.open = false; unnamed.open = true;
    const menuHost = document.getElementById('menu');
    menuHost.open = true;
    const warnings = window.warnings.length - before;
    const roleMenu = read('role-menu');
    const swapped = document.getElementById('role-menu');
    swapped.appendChild(document.createElement('p'));
    await new Promise((resolve) => setTimeout(resolve, 0));
    return { named: read('named'), menu: read('menu'), roleMenu, mixed: read('mixed'), unnamed: read('unnamed'), swapped: read('role-menu').role, warnings };
  })()`, { readyExpr: '!!window.ready && !!customElements.get("aha-popover")' });
  assert.deepEqual(result, {
    named: { role: 'dialog', name: 'Sharing help', haspopup: 'dialog' },
    menu: { role: null, name: null, haspopup: 'menu' },
    roleMenu: { role: null, name: null, haspopup: 'menu' },
    mixed: { role: 'dialog', name: 'Options', haspopup: 'dialog' },
    unnamed: { role: 'dialog', name: null, haspopup: 'dialog' },
    swapped: 'dialog',
    warnings: 1,
  });
});
