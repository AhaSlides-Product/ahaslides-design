import { test } from 'node:test';
import assert from 'node:assert/strict';

class FakeElement {
  constructor(tag) { this.tag = tag; this.dataset = {}; this.focused = false; }
  closest(selector) {
    if (selector === '.aha-article-game__play') return this.tag === 'aha-button' ? this : null;
    return selector === '.aha-article-game__stage' ? this.stage : null;
  }
  querySelector() { return this.titleNode; }
  replaceChildren(...nodes) { this.children = nodes; }
  focus() { this.focused = true; }
}
const listeners = [];
globalThis.Element = FakeElement;
globalThis.document = {
  addEventListener: (type, handler) => listeners.push([type, handler]),
  createElement: (tag) => new FakeElement(tag),
};
const { articleGameEmbedUrl } = await import('../lib/article-game.js');

const poster = (playUrl) => {
  const stage = new FakeElement('div');
  stage.titleNode = { textContent: ' Team quiz night ' };
  const button = new FakeElement('aha-button');
  button.dataset.playUrl = playUrl;
  button.stage = stage;
  button.ownerDocument = globalThis.document;
  return button;
};
const click = (target, defaultPrevented = false) => listeners.filter(([type]) => type === 'click').forEach(([, handler]) => handler({ target, defaultPrevented }));

test('only an https play URL on the AhaSlides audience origin gives an embed URL', () => {
  assert.equal(articleGameEmbedUrl('https://audience.ahaslides.com/ujmza4ei2d'), 'https://audience.ahaslides.com/ujmza4ei2d?embed=1');
  assert.equal(articleGameEmbedUrl('https://audience.ahaslides.com/ujmza4ei2d?embed=0&lang=vi'), 'https://audience.ahaslides.com/ujmza4ei2d?embed=1&lang=vi');
  for (const url of ['http://audience.ahaslides.com/x', 'https://audience.ahaslides.com.evil.com/x', 'https://evil.com/?u=https://audience.ahaslides.com', 'https://user@audience.ahaslides.com/x', 'javascript:alert(1)', '', undefined])
    assert.equal(articleGameEmbedUrl(url), null, String(url));
});

test('a click on Play swaps the poster for a titled game iframe and focuses it; a prevented click or a foreign URL keeps the poster', () => {
  const button = poster('https://audience.ahaslides.com/ujmza4ei2d');
  click(button);
  const [iframe] = button.stage.children;
  assert.equal(iframe.src, 'https://audience.ahaslides.com/ujmza4ei2d?embed=1');
  assert.equal(iframe.title, 'Play Team quiz night');
  assert.equal(iframe.focused, true);

  const owned = poster('https://audience.ahaslides.com/ujmza4ei2d');
  click(owned, true);
  assert.equal(owned.stage.children, undefined);

  const foreign = poster('https://evil.com/game');
  click(foreign);
  assert.equal(foreign.stage.children, undefined);
});
