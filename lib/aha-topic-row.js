/**
 * @ahaslides-product/design/aha-topic-row — one row of a forum topic list.
 *
 *   import '@ahaslides-product/design/aha-topic-row';   // registers <aha-topic-row> (+ <aha-avatar>, <aha-tag>)
 *   <aha-topic-row topic-title="Word cloud tips" href="/t/word-cloud-tips/12"
 *     author="Ada Lovelace" avatar-src="/u/ada.jpg" category="Slide types" category-href="/c/slide-types"
 *     excerpt="How do you keep a word cloud readable with 200 answers?" likes="4" replies="12"
 *     time="2h" datetime="2026-11-05T09:00:00Z"></aha-topic-row>
 *
 * A 40px avatar, then the title (a link) with the category tag beside it, a plain-text excerpt
 * clamped to two lines, and a meta row (author, likes, replies, time). States: `read` drops the
 * title to Regular, `pinned` adds a pin inside the title link, before its text, hover tints the row.
 * Reuses <aha-avatar> and <aha-tag>; styled by the shared class layer in topic-row-css.js, the
 * same CSS a host with its own markup links as lib/topic-row.css.
 * The shadow DOM is built once; attribute changes update text and attributes on persistent nodes.
 * The excerpt is always set as text, so host HTML or BBCode never renders as markup.
 */
import './aha-avatar.js';
import './aha-tag.js';
import { TOPIC_ROW_CSS } from './topic-row-css.js';

const STYLE = `
  :host{ display:block }
  :host([hidden]), [hidden]{ display:none !important }
  :host(:last-child) .aha-topic-row{ border-bottom-color:transparent }
  ${TOPIC_ROW_CSS}
`;

const count = (v) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : null;
};

export class AhaTopicRow extends HTMLElement {
  static get observedAttributes() {
    return ['topic-title', 'href', 'author', 'avatar-src', 'category', 'category-href', 'excerpt',
      'likes', 'replies', 'time', 'datetime', 'read', 'pinned'];
  }

  connectedCallback() {
    if (!this.shadowRoot) this._build();
    this._sync();
  }

  attributeChangedCallback() { if (this._row) this._sync(); }

  _build() {
    const root = this.attachShadow({ mode: 'open' });
    root.innerHTML = `<style>${STYLE}</style>
      <div class="aha-topic-row" part="row">
        <div class="aha-topic-row__avatar"><aha-avatar size="40" aria-hidden="true"></aha-avatar></div>
        <div class="aha-topic-row__main">
          <div class="aha-topic-row__head">
            <a class="aha-topic-row__title" part="title"><aha-icon class="aha-topic-row__pin" name="system-push-pin" size="16" label="Pinned"></aha-icon><span class="aha-topic-row__text"></span></a>
            <aha-tag class="aha-topic-row__tag"></aha-tag>
          </div>
          <p class="aha-topic-row__excerpt" part="excerpt"></p>
          <div class="aha-topic-row__meta" part="meta">
            <span class="aha-topic-row__author"></span>
            <span class="aha-topic-row__stat" data-stat="likes"><aha-icon name="system-heart-straight" size="16" decorative></aha-icon><span class="aha-topic-row__n"></span><span class="aha-topic-row__sr"></span></span>
            <span class="aha-topic-row__stat" data-stat="replies"><aha-icon name="system-chat-circle" size="16" decorative></aha-icon><span class="aha-topic-row__n"></span><span class="aha-topic-row__sr"></span></span>
            <time class="aha-topic-row__time"></time>
          </div>
        </div>
      </div>`;
    const $ = (s) => root.querySelector(s);
    this._row = $('.aha-topic-row');
    this._avatar = $('aha-avatar');
    this._pin = $('.aha-topic-row__pin');
    this._title = $('.aha-topic-row__title');
    this._titleText = $('.aha-topic-row__text');
    this._tag = $('.aha-topic-row__tag');
    this._excerpt = $('.aha-topic-row__excerpt');
    this._author = $('.aha-topic-row__author');
    this._likes = $('[data-stat="likes"]');
    this._replies = $('[data-stat="replies"]');
    this._time = $('.aha-topic-row__time');
  }

  _sync() {
    const a = (n) => this.getAttribute(n) || '';
    const title = a('topic-title');
    const author = a('author');

    this._row.classList.toggle('aha-topic-row--read', this.hasAttribute('read'));
    this._row.classList.toggle('aha-topic-row--pinned', this.hasAttribute('pinned'));
    this._pin.hidden = !this.hasAttribute('pinned');

    this._avatar.setAttribute('name', author || title);
    if (a('avatar-src')) this._avatar.setAttribute('src', a('avatar-src'));
    else this._avatar.removeAttribute('src');

    this._titleText.textContent = title;
    if (a('href')) this._title.setAttribute('href', a('href'));
    else this._title.removeAttribute('href');

    this._tag.hidden = !a('category');
    this._tag.textContent = a('category');
    if (a('category-href')) this._tag.setAttribute('href', a('category-href'));
    else this._tag.removeAttribute('href');

    this._excerpt.textContent = a('excerpt');
    this._excerpt.hidden = !a('excerpt');

    this._author.textContent = author;
    this._author.hidden = !author;

    for (const [node, value, one, many] of [[this._likes, count(a('likes')), 'like', 'likes'], [this._replies, count(a('replies')), 'reply', 'replies']]) {
      node.hidden = value === null;
      node.querySelector('.aha-topic-row__n').textContent = value === null ? '' : String(value);
      node.querySelector('.aha-topic-row__sr').textContent = value === 1 ? ` ${one}` : ` ${many}`;
    }

    this._time.textContent = a('time');
    this._time.hidden = !a('time');
    if (a('datetime')) this._time.setAttribute('datetime', a('datetime'));
    else this._time.removeAttribute('datetime');
  }
}

export function defineAhaTopicRow(tag = 'aha-topic-row') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaTopicRow);
  return true;
}
if (typeof window !== 'undefined') defineAhaTopicRow();

export default { AhaTopicRow, defineAhaTopicRow };
