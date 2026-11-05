/**
 * @ahaslides-product/design/aha-search-result — one row of a search results list.
 *
 *   import '@ahaslides-product/design/aha-search-result';   // registers <aha-search-result> (+ <aha-tag>)
 *   <aha-search-result query="word cloud" result-title="Word cloud tips" href="/t/word-cloud-tips/12"
 *     category="Slide types" category-href="/c/slide-types" time="Aug 6" datetime="2026-08-06"
 *     blurb="How do you keep a word cloud readable with 200 answers? See https://example.com/x"></aha-search-result>
 *
 * The title (a link) with every word of `query` marked on Vivid Pink at 5% in ink, a meta row with the
 * category tag and the date, and a plain-text blurb clamped to two lines, with URLs stripped and the
 * query marked the same way. Styled by the shared class layer in search-result-css.js, the same CSS a
 * host with its own markup links as lib/search-result.css.
 * The shadow DOM is built once; title and blurb are always set as text nodes and <mark> elements, so
 * host HTML or BBCode never renders as markup.
 */
import './aha-tag.js';
import { SEARCH_RESULT_CSS } from './search-result-css.js';

const STYLE = `
  :host{ display:block }
  :host([hidden]), [hidden]{ display:none !important }
  :host(:last-child) .aha-search-result{ border-bottom-color:transparent }
  ${SEARCH_RESULT_CSS}
`;

const URL_PATTERN = /\b(?:https?:\/\/|www\.)[^\s<>"']+/gi;

export function stripUrls(text) {
  return String(text ?? '').replace(URL_PATTERN, ' ').replace(/\s{2,}/g, ' ').trim();
}

const matcher = (query) => {
  const words = String(query ?? '').trim().split(/\s+/).filter(Boolean)
    .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .sort((a, b) => b.length - a.length);
  return words.length ? new RegExp(`(${words.join('|')})`, 'gi') : null;
};

function fillMarked(node, text, pattern) {
  const parts = pattern ? text.split(pattern) : [text];
  node.replaceChildren(...parts.map((part, i) => {
    if (i % 2 === 0) return document.createTextNode(part);
    const mark = document.createElement('mark');
    mark.className = 'aha-search-result__match';
    mark.textContent = part;
    return mark;
  }));
}

export class AhaSearchResult extends HTMLElement {
  static get observedAttributes() {
    return ['result-title', 'href', 'query', 'category', 'category-href', 'time', 'datetime', 'blurb'];
  }

  connectedCallback() {
    if (!this.shadowRoot) this._build();
    this._sync();
  }

  attributeChangedCallback() { if (this._row) this._sync(); }

  _build() {
    const root = this.attachShadow({ mode: 'open' });
    root.innerHTML = `<style>${STYLE}</style>
      <article class="aha-search-result" part="row">
        <div class="aha-search-result__body">
          <a class="aha-search-result__title" part="title"></a>
          <div class="aha-search-result__meta" part="meta">
            <aha-tag class="aha-search-result__tag"></aha-tag>
            <time class="aha-search-result__date"></time>
          </div>
          <p class="aha-search-result__blurb" part="blurb"></p>
        </div>
      </article>`;
    const $ = (s) => root.querySelector(s);
    this._row = $('.aha-search-result');
    this._title = $('.aha-search-result__title');
    this._meta = $('.aha-search-result__meta');
    this._tag = $('.aha-search-result__tag');
    this._date = $('.aha-search-result__date');
    this._blurb = $('.aha-search-result__blurb');
  }

  _sync() {
    const a = (n) => this.getAttribute(n) || '';
    const pattern = matcher(a('query'));

    fillMarked(this._title, a('result-title'), pattern);
    if (a('href')) this._title.setAttribute('href', a('href'));
    else this._title.removeAttribute('href');

    this._tag.hidden = !a('category');
    this._tag.textContent = a('category');
    if (a('category-href')) this._tag.setAttribute('href', a('category-href'));
    else this._tag.removeAttribute('href');

    this._date.textContent = a('time');
    this._date.hidden = !a('time');
    if (a('datetime')) this._date.setAttribute('datetime', a('datetime'));
    else this._date.removeAttribute('datetime');
    this._meta.hidden = this._tag.hidden && this._date.hidden;

    const blurb = stripUrls(a('blurb'));
    fillMarked(this._blurb, blurb, pattern);
    this._blurb.hidden = !blurb;
  }
}

export function defineAhaSearchResult(tag = 'aha-search-result') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaSearchResult);
  return true;
}
if (typeof window !== 'undefined') defineAhaSearchResult();

export default { AhaSearchResult, defineAhaSearchResult, stripUrls };
