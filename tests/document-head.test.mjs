import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { documentTitle, documentHead, faviconLinks, withDocumentHead, uniqueTitleRegistry, FAVICON_FOLDER } from '../document-head.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'AhaSlides Design System';

test('the page name comes first and the site name last', () => {
  assert.equal(documentTitle({ site: SITE, page: 'Button' }), 'Button | AhaSlides Design System');
});

test('the home page is the site name alone', () => {
  assert.equal(documentTitle({ site: SITE }), 'AhaSlides Design System');
});

test('a section sits between the page and the site', () => {
  assert.equal(documentTitle({ site: SITE, page: 'Settings', section: 'Guidelines' }), 'Settings | Guidelines | AhaSlides Design System');
});

test('a build that is not production names its environment in front', () => {
  assert.equal(documentTitle({ site: SITE, page: 'Button', environment: 'staging' }), '[staging] Button | AhaSlides Design System');
});

test('a title without a site name is refused', () => {
  assert.throws(() => documentTitle({ page: 'Button' }));
});

test('every favicon link points at a file the Logo library ships', () => {
  const links = faviconLinks('../');
  assert.match(links, /<link rel="icon" href="\.\.\/favicon\.ico"/);
  assert.match(links, /<link rel="apple-touch-icon" sizes="180x180" href="\.\.\/logo\/favicon\/favicon-180\.png"/);
  for (const [, file] of links.matchAll(/logo\/favicon\/([a-z0-9.-]+)/g)) assert.ok(existsSync(join(root, FAVICON_FOLDER, file)), file);
  assert.ok(existsSync(join(root, FAVICON_FOLDER, 'favicon.ico')));
});

test('a name with markup is escaped in the head', () => {
  assert.match(documentHead({ title: 'A <b> & "c" | AhaSlides' }), /<title>A &lt;b&gt; &amp; &quot;c&quot; \| AhaSlides<\/title>/);
});

test('a page with no title is refused', () => {
  assert.throws(() => documentHead({ title: '' }));
});

test('a standalone page gets its title replaced and the favicon links added', () => {
  const html = withDocumentHead('<head><title>Old $& title</title></head>', { title: 'New | AhaSlides', base: '../' });
  assert.match(html, /<title>New \| AhaSlides<\/title>\n<link rel="icon"/);
  assert.doesNotMatch(html, /Old/);
  assert.throws(() => withDocumentHead('<head></head>', { title: 'New | AhaSlides' }));
});

test('two pages cannot claim one title, and one page may claim its own twice', () => {
  const claim = uniqueTitleRegistry();
  assert.equal(claim('Settings | AhaSlides Design System', 'hub:settings'), 'Settings | AhaSlides Design System');
  claim('Settings | AhaSlides Design System', 'hub:settings');
  assert.throws(() => claim('Settings | AhaSlides Design System', 'guideline:settings'), /used by both/);
});

test('the guideline states the separator the docs site uses', () => {
  const guideline = JSON.parse(readFileSync(join(root, 'guidelines', 'page-title-favicon.json'), 'utf8'));
  assert.ok(guideline.rules.some(entry => entry.rule.includes('(` | `)')));
});
