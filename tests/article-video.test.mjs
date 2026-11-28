import { test } from 'node:test';
import assert from 'node:assert/strict';

class FakeElement {
  constructor(tag) { this.tag = tag; this.dataset = {}; this.focused = false; }
  closest(selector) { return selector === 'button.aha-article-video__play' && this.tag === 'button' ? this : null; }
  querySelector() { return this.titleNode; }
  replaceWith(node) { this.replacedBy = node; }
  focus() { this.focused = true; }
}
const listeners = [];
globalThis.Element = FakeElement;
globalThis.document = {
  addEventListener: (type, handler) => listeners.push([type, handler]),
  createElement: (tag) => new FakeElement(tag),
};
const { articleVideoEmbedUrl, articleVideoPosterUrl } = await import('../lib/article-video.js');

const facade = (dataset) => {
  const button = new FakeElement('button');
  Object.assign(button.dataset, dataset);
  button.ownerDocument = globalThis.document;
  button.titleNode = { textContent: '  How to set up an interactive poll ' };
  return button;
};
const click = (target, defaultPrevented = false) => listeners.filter(([type]) => type === 'click').forEach(([, handler]) => handler({ target, defaultPrevented }));

test('only the three providers, with a well-formed id, give a player URL', () => {
  assert.equal(articleVideoEmbedUrl('youtube', 'cVfaZNj-T-c'), 'https://www.youtube-nocookie.com/embed/cVfaZNj-T-c?autoplay=1&rel=0');
  assert.equal(articleVideoEmbedUrl('vimeo', '76979871', 'ab12'), 'https://player.vimeo.com/video/76979871?autoplay=1&dnt=1&h=ab12');
  assert.equal(articleVideoEmbedUrl('loom', 'a'.repeat(32)), `https://www.loom.com/embed/${'a'.repeat(32)}`);
  assert.equal(articleVideoEmbedUrl('vimeo', '76979871', 'x"onload'), 'https://player.vimeo.com/video/76979871?autoplay=1&dnt=1');
  for (const [provider, id] of [['youtube', 'abc/../../x'], ['vimeo', 'evil.com'], ['dailymotion', 'x8abcd1'], ['constructor', 'x'], ['youtube', undefined]])
    assert.equal(articleVideoEmbedUrl(provider, id), null, `${provider} ${id}`);
  assert.equal(articleVideoPosterUrl('youtube', 'cVfaZNj-T-c'), 'https://i.ytimg.com/vi/cVfaZNj-T-c/hqdefault.jpg');
  assert.equal(articleVideoPosterUrl('vimeo', '76979871'), null);
});

test('a click swaps the facade for a titled player and focuses it; a host that prevented the click keeps its button', () => {
  const button = facade({ provider: 'youtube', videoId: 'cVfaZNj-T-c' });
  click(button);
  const iframe = button.replacedBy;
  assert.equal(iframe.src, 'https://www.youtube-nocookie.com/embed/cVfaZNj-T-c?autoplay=1&rel=0');
  assert.equal(iframe.title, 'How to set up an interactive poll');
  assert.match(iframe.allow, /autoplay/);
  assert.equal(iframe.focused, true);

  const owned = facade({ provider: 'youtube', videoId: 'cVfaZNj-T-c' });
  click(owned, true);
  assert.equal(owned.replacedBy, undefined);

  const invalid = facade({ provider: 'youtube', videoId: 'not-an-id' });
  click(invalid);
  assert.equal(invalid.replacedBy, undefined);
});
