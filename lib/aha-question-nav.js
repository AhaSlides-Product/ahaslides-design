/**
 * @ahaslides-product/design/aha-question-nav — a numbered jump list for the questions of a report.
 *
 *   import '@ahaslides-product/design/aha-question-nav';   // registers <aha-question-nav>
 *   <aha-question-nav count="12" current="3"></aha-question-nav>
 *   <aha-question-nav count="5" current="2" results="correct|incorrect||correct|incorrect"></aha-question-nav>
 *
 * One numbered button per question, the current one ringed in the brand colour on a tint (`aria-current`), so an answer mark never sits on a brand fill.
 * Arrow keys, Home and End move focus along the list (one tab stop, roving tabindex); Enter, Space or a
 * click picks the question and emits a composed `change` CustomEvent<{value, index}> (value is the
 * 1-based number). A long list scrolls inside the strip, with previous / next scroll buttons that appear
 * only when it overflows; `wrap` lays it out on several lines instead.
 *
 * `results` is an optional pipe list ("correct|incorrect||correct"), one entry per question; an entry of
 * correct or incorrect adds an <aha-answer-mark> beside the number, an empty one adds nothing. The number
 * stays ink: the answer colour appears only on the mark's disc (colour rule 11.3).
 *
 * `label` names the list (default "Questions"); `item-label` names each button ("Question {n}"), plus the
 * result when there is one; `correct-label` and `incorrect-label` translate that result.
 */
import './icons.js';
import './aha-answer-mark.js';

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const EASE = 'var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1))';
const STYLE = `
  :host{ display:block; font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif); font-size:13px }
  .nav{ display:flex; align-items:center; gap:var(--aha-space-6,6px); min-width:0 }
  .strip{ flex:1 1 auto; min-width:0; overflow-x:auto; overflow-y:hidden; scrollbar-width:none; position:relative; padding:var(--aha-space-4,4px) }
  .strip::-webkit-scrollbar{ display:none }
  .list{ display:flex; gap:var(--aha-space-6,6px); margin:0; padding:0; list-style:none; width:max-content }
  :host([wrap]) .strip{ overflow:visible }
  :host([wrap]) .list{ flex-wrap:wrap; width:auto }
  .item,.scroll{ box-sizing:border-box; min-width:32px; height:32px; padding:0 var(--aha-space-6,6px); gap:var(--aha-space-4,4px);
    display:inline-flex; align-items:center; justify-content:center; flex:0 0 auto;
    border:1px solid var(--aha-border-default,#E3E3E3); border-radius:var(--aha-radius-default,8px);
    background:var(--aha-bg-container,#FFFFFF); color:var(--aha-text-default,#1A1A1A);
    font:inherit; font-weight:600; cursor:pointer;
    transition:background var(--aha-motion-fast,.1s) ${EASE}, box-shadow var(--aha-motion-fast,.1s) ${EASE}, border-color var(--aha-motion-fast,.1s) ${EASE}, color var(--aha-motion-fast,.1s) ${EASE} }
  .item:not([aria-current]):hover,.scroll:not([disabled]):hover{ box-shadow:inset 0 0 0 100vmax var(--aha-button-default-bg-hover,#E70E680D); border-color:var(--aha-button-default-border-hover,#E70E68); color:var(--aha-button-default-text-hover,var(--aha-text-link-hover,#DB005B)) }
  .item:not([aria-current]):active,.scroll:not([disabled]):active{ box-shadow:inset 0 0 0 100vmax var(--aha-button-default-bg-hover,#E70E680D); border-color:var(--aha-button-default-border-press,#DB005B); color:var(--aha-button-default-text-hover,var(--aha-text-link-hover,#DB005B)) }
  .item:focus-visible,.scroll:focus-visible{ outline:2px solid var(--aha-border-focus,#E70E68); outline-offset:2px }
  .item[aria-current]{ background:var(--aha-bg-accent,#E70E681A); border-color:var(--aha-color-primary,#E70E68); box-shadow:inset 0 0 0 1px var(--aha-color-primary,#E70E68) }
  .scroll[disabled]{ color:var(--aha-text-disabled,#B5B5B5); border-color:var(--aha-border-disabled,#EBEBEB); cursor:not-allowed }
  .scroll[hidden]{ display:none }
  .num{ line-height:1 }
  @media (prefers-reduced-motion: reduce){ *{ transition:none !important } }
`;

export class AhaQuestionNav extends HTMLElement {
  static get observedAttributes() {
    return ['count', 'current', 'results', 'wrap', 'label', 'item-label', 'correct-label', 'incorrect-label'];
  }

  get count() { return Math.max(0, Math.floor(Number(this.getAttribute('count')) || 0)); }
  get current() {
    const value = Math.floor(Number(this.getAttribute('current')) || 1);
    return Math.min(Math.max(this.count, 1), Math.max(1, value));
  }
  set current(value) { this.setAttribute('current', String(value)); }
  get results() {
    return (this.getAttribute('results') || '').split('|').map((entry) => entry.trim().toLowerCase());
  }

  connectedCallback() {
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    this._build();
    this._resizeObserver = new ResizeObserver(() => this._syncScrollButtons());
    this._resizeObserver.observe(this.shadowRoot.querySelector('.strip'));
  }

  disconnectedCallback() {
    if (this._resizeObserver) this._resizeObserver.disconnect();
    this._resizeObserver = null;
  }

  attributeChangedCallback(name) {
    if (!this.shadowRoot || !this.shadowRoot.querySelector('.strip')) return;
    if (name === 'current') this._syncCurrent();
    else this._build();
  }

  _itemName(number, result) {
    const template = this.getAttribute('item-label') || 'Question {n}';
    const base = template.replace('{n}', String(number));
    if (result === 'correct') return `${base}, ${this.getAttribute('correct-label') || 'correct'}`;
    if (result === 'incorrect') return `${base}, ${this.getAttribute('incorrect-label') || 'incorrect'}`;
    return base;
  }

  _build() {
    const results = this.results;
    const items = Array.from({ length: this.count }, (_, index) => {
      const result = results[index] === 'correct' || results[index] === 'incorrect' ? results[index] : '';
      const mark = result ? `<aha-answer-mark result="${result}" size="16" decorative></aha-answer-mark>` : '';
      return `<li><button class="item" type="button" part="item" data-i="${index}"` +
        ` aria-label="${esc(this._itemName(index + 1, result))}" tabindex="-1">` +
        `<span class="num">${index + 1}</span>${mark}</button></li>`;
    }).join('');
    this.shadowRoot.innerHTML = `<style>${STYLE}</style>` +
      `<nav class="nav" part="nav" aria-label="${esc(this.getAttribute('label') || 'Questions')}">` +
      `<button class="scroll prev" type="button" aria-label="Scroll back" hidden><aha-icon name="system-caret-left" size="16" decorative></aha-icon></button>` +
      `<div class="strip" part="strip"><ol class="list">${items}</ol></div>` +
      `<button class="scroll next" type="button" aria-label="Scroll forward" hidden><aha-icon name="system-caret-right" size="16" decorative></aha-icon></button>` +
      `</nav>`;
    this._items = Array.from(this.shadowRoot.querySelectorAll('.item'));
    this._strip = this.shadowRoot.querySelector('.strip');
    this._items.forEach((item) => item.addEventListener('click', () => this._pick(Number(item.dataset.i))));
    this.shadowRoot.querySelector('.list').addEventListener('keydown', (event) => this._onKey(event));
    this.shadowRoot.querySelector('.prev').addEventListener('click', () => this._scrollBy(-1));
    this.shadowRoot.querySelector('.next').addEventListener('click', () => this._scrollBy(1));
    this._strip.addEventListener('scroll', () => this._syncScrollButtons());
    if (this._resizeObserver) { this._resizeObserver.disconnect(); this._resizeObserver.observe(this._strip); }
    this._syncCurrent();
  }

  _syncCurrent() {
    const currentIndex = this.current - 1;
    this._items.forEach((item, index) => {
      const on = index === currentIndex;
      if (on) item.setAttribute('aria-current', 'page'); else item.removeAttribute('aria-current');
      item.tabIndex = on ? 0 : -1;
    });
    this._reveal(this._items[currentIndex]);
  }

  _reveal(item) {
    if (!item || !this._strip || this.hasAttribute('wrap')) return;
    this._syncScrollButtons();
    const strip = this._strip;
    const left = item.offsetLeft;
    const right = left + item.offsetWidth;
    if (left < strip.scrollLeft) strip.scrollLeft = Math.max(0, left - 6);
    else if (right > strip.scrollLeft + strip.clientWidth) strip.scrollLeft = right - strip.clientWidth + 6;
    this._syncScrollButtons();
  }

  _syncScrollButtons() {
    if (!this._strip) return;
    const strip = this._strip;
    const overflowing = !this.hasAttribute('wrap') && strip.scrollWidth > strip.clientWidth + 1;
    const prev = this.shadowRoot.querySelector('.prev');
    const next = this.shadowRoot.querySelector('.next');
    prev.hidden = !overflowing;
    next.hidden = !overflowing;
    prev.disabled = strip.scrollLeft <= 0;
    next.disabled = strip.scrollLeft + strip.clientWidth >= strip.scrollWidth - 1;
  }

  _scrollBy(direction) {
    this._strip.scrollBy({ left: direction * this._strip.clientWidth * 0.8, behavior: 'smooth' });
  }

  _pick(index) {
    if (index === this.current - 1) return;
    this.setAttribute('current', String(index + 1));
    this.dispatchEvent(new CustomEvent('change', { bubbles: true, composed: true, detail: { value: index + 1, index } }));
  }

  _onKey(event) {
    const focused = this._items.indexOf(this.shadowRoot.activeElement);
    if (focused < 0) return;
    const last = this._items.length - 1;
    let next;
    switch (event.key) {
      case 'ArrowRight': case 'ArrowDown': next = Math.min(last, focused + 1); break;
      case 'ArrowLeft': case 'ArrowUp': next = Math.max(0, focused - 1); break;
      case 'Home': next = 0; break;
      case 'End': next = last; break;
      default: return;
    }
    event.preventDefault();
    this._items.forEach((item, index) => { item.tabIndex = index === next ? 0 : -1; });
    this._items[next].focus();
    this._reveal(this._items[next]);
  }
}

export function defineAhaQuestionNav(tag = 'aha-question-nav') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaQuestionNav);
  return true;
}
if (typeof window !== 'undefined') defineAhaQuestionNav();

export default { AhaQuestionNav, defineAhaQuestionNav };
