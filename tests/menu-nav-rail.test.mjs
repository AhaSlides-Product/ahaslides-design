import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { evaluateInPage, resolveChrome } from '../cdp.mjs';

const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';
const libUrl = (file) => pathToFileURL(fileURLToPath(new URL(`../lib/${file}`, import.meta.url))).href;
const pageFile = (html) => {
  const file = join(mkdtempSync(join(tmpdir(), 'menu-nav-rail-')), 'page.html');
  writeFileSync(file, html);
  return pathToFileURL(file).href;
};

const items = JSON.stringify([
  { type: 'group', label: 'Community', children: [
    { key: 'home', label: 'Home', badge: 'unread' },
    { key: 'plain', label: 'Plain' },
    { key: 'described', label: 'Described', description: 'Help text', badge: 'new' },
  ] },
]).replace(/"/g, '&quot;');

test('nav-rail draws sentence-case 14px SemiBold section headers with no frame, and badge projects its slot at the trailing edge', { skip }, async () => {
  const url = pageFile(`<!doctype html><body style="width:280px">
<aha-menu id="rail" mode="inline" nav-rail items="${items}"><b slot="unread">3</b><i slot="new">New</i></aha-menu>
<aha-menu id="plain" items="${items}"></aha-menu>
<script type="module">import '${libUrl('aha-menu.js')}'; window.ready = true;</script>`);
  const result = await evaluateInPage(url, `(() => {
    const rail = document.getElementById('rail').shadowRoot;
    const plain = document.getElementById('plain').shadowRoot;
    const title = getComputedStyle(rail.querySelector('.group-title'));
    const [home, other, described] = rail.querySelectorAll('.item');
    const describedSlot = described.querySelector('.label-line .badge slot');
    const badge = home.querySelector('.badge');
    const slot = badge && badge.querySelector('slot');
    const plainTitle = getComputedStyle(plain.querySelector('.group-title'));
    return {
      title: [title.fontSize, title.fontWeight, title.textTransform, title.letterSpacing],
      frame: getComputedStyle(rail.querySelector('.menu')).borderTopWidth,
      projected: slot && slot.assignedElements().map((el) => el.textContent).join(),
      trailingGap: Math.round(home.getBoundingClientRect().right - badge.getBoundingClientRect().right),
      otherHasBadge: !!other.querySelector('.badge'),
      describedProjected: describedSlot && describedSlot.assignedElements().map((el) => el.textContent).join(),
      plainTitle: [plainTitle.fontSize, plainTitle.textTransform],
      plainFrame: getComputedStyle(plain.querySelector('.menu')).borderTopWidth,
    };
  })()`, { readyExpr: '!!window.ready && !!customElements.get("aha-menu")' });
  assert.deepEqual(result.title, ['14px', '600', 'none', 'normal']);
  assert.equal(result.frame, '0px');
  assert.equal(result.projected, '3');
  assert.equal(result.trailingGap, 12);
  assert.equal(result.otherHasBadge, false);
  assert.equal(result.describedProjected, 'New');
  assert.deepEqual(result.plainTitle, ['11px', 'uppercase']);
  assert.equal(result.plainFrame, '1px');
});

test('discourse-sidebar.css gives Discourse core sidebar markup the nav rail values over its inline category colour', { skip }, async () => {
  const url = pageFile(`<!doctype html><head>
<link rel="stylesheet" href="${libUrl('tokens.css')}"><link rel="stylesheet" href="${libUrl('discourse-sidebar.css')}">
<style>body{font-family:serif} .sidebar-section-header-text{text-transform:uppercase;font-size:12px} .sidebar-section-link{height:30px;color:#646464}</style>
</head><body><nav id="d-sidebar" class="sidebar-container"><div class="sidebar-sections">
<div class="sidebar-section sidebar-section-wrapper"><div class="sidebar-section-header-wrapper sidebar-row">
<button class="btn no-text sidebar-section-header"><span class="sidebar-section-header-text">Categories</span></button></div>
<ul class="sidebar-section-content"><li class="sidebar-section-link-wrapper">
<a id="row" class="sidebar-section-link sidebar-row active" href="#"><span class="sidebar-section-link-prefix icon" style="color:#E70E68"><svg id="glyph" class="fa d-icon d-icon-house"><use href="#house"></use></svg></span><span class="sidebar-section-link-content-text">Home</span><span id="count" class="sidebar-section-link-content-badge">3</span></a>
</li></ul></div></div></nav></body>`);
  const result = await evaluateInPage(url, `(() => {
    const header = getComputedStyle(document.querySelector('.sidebar-section-header-text'));
    const row = getComputedStyle(document.getElementById('row'));
    const glyph = getComputedStyle(document.getElementById('glyph'));
    const count = getComputedStyle(document.getElementById('count'));
    const list = getComputedStyle(document.querySelector('.sidebar-section-content'));
    return {
      headerFont: header.fontFamily,
      list: [list.listStyleType, list.paddingLeft, list.marginTop],
      header: [header.fontSize, header.fontWeight, header.textTransform, header.color],
      row: [row.height, row.borderTopLeftRadius, row.backgroundColor, row.color],
      glyph: [glyph.width, glyph.color, glyph.backgroundColor],
      mask: glyph.webkitMaskImage || glyph.maskImage,
      count: [count.height, count.backgroundColor, count.color],
    };
  })()`, { readyExpr: 'document.readyState === "complete"' });
  assert.deepEqual(result.header, ['14px', '600', 'none', 'rgb(97, 97, 97)']);
  assert.match(result.headerFont, /Plus Jakarta Sans/);
  assert.deepEqual(result.list, ['none', '0px', '0px']);
  assert.deepEqual(result.row, ['36px', '8px', 'rgba(231, 14, 104, 0.05)', 'rgb(26, 26, 26)']);
  assert.deepEqual(result.glyph, ['16px', 'rgb(26, 26, 26)', 'rgb(26, 26, 26)']);
  assert.equal(result.mask, `url("${new URL('../icons/svg/system/system-house.svg', libUrl('discourse-sidebar.css')).href}")`);
  assert.deepEqual(result.count, ['18px', 'rgb(26, 26, 26)', 'rgb(255, 255, 255)']);
});
