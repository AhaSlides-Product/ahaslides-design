/**
 * @ahaslides-product/design/aha-flex — the shared Flex layout primitive.
 *
 *   import '@ahaslides-product/design/aha-flex';   // registers <aha-flex>
 *   <aha-flex gap="middle" align="center"><button>A</button><button>B</button></aha-flex>
 *
 * A flexbox container with the DS spacing scale baked in — `gap` takes the named steps
 * small/middle/large (8/16/24) or a raw pixel number, plus direction/align/justify/wrap.
 * Mirrors the AntD Flex API: `vertical` is the boolean shorthand for a column, `direction`
 * unlocks the full row/column-reverse matrix (direction wins when both are set).
 * ONE element, shadow-DOM CSS, themed only by --aha-* tokens → byte-identical in React and
 * Vue. Zero dependencies. Layout only: it never paints a background.
 *
 * `scroll` keeps a row on one line and lets it scroll sideways inside its own box (a chip or
 * toggle row that would clip on a 360px phone). An edge fades out only on a side with more to
 * see, and the fade grows with the distance left to scroll, so it follows the scroll position
 * with no animation. Keyboard users reach every item by Tab, which scrolls it clear of the fade.
 */
const GAP = { small: '8px', middle: '16px', large: '24px' };
const ALIGN = { start: 'flex-start', end: 'flex-end', center: 'center', baseline: 'baseline', stretch: 'stretch' };
const JUSTIFY = { start: 'flex-start', end: 'flex-end', center: 'center', 'space-between': 'space-between', 'space-around': 'space-around', 'space-evenly': 'space-evenly' };
const FADE = 24;
const STYLE = `
  :host{ display:flex; box-sizing:border-box }
  :host([wrap]){ flex-wrap:wrap }
  :host([scroll]){ flex-wrap:nowrap; min-width:0; overflow-x:auto; overflow-y:hidden; scrollbar-width:none;
    padding-block:var(--aha-space-4,4px); margin-block:calc(-1 * var(--aha-space-4,4px));
    scroll-padding-inline:${FADE}px;
    -webkit-mask-image:linear-gradient(var(--aha-flex-fade-dir,to right), transparent 0, black var(--aha-flex-fade-start,0px), black calc(100% - var(--aha-flex-fade-end,0px)), transparent 100%);
    mask-image:linear-gradient(var(--aha-flex-fade-dir,to right), transparent 0, black var(--aha-flex-fade-start,0px), black calc(100% - var(--aha-flex-fade-end,0px)), transparent 100%) }
  :host([scroll])::-webkit-scrollbar{ display:none }
  :host([scroll]) ::slotted(*){ flex-shrink:0 }
`;

export class AhaFlex extends HTMLElement {
  static get observedAttributes() { return ['gap', 'direction', 'vertical', 'align', 'justify', 'wrap', 'scroll']; }
  connectedCallback() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.innerHTML = `<style>${STYLE}</style><slot></slot>`;
      this._onScroll = () => this._syncFade();
      this.shadowRoot.querySelector('slot').addEventListener('slotchange', () => this._observeItems());
    }
    this._apply();
  }
  disconnectedCallback() { this._unwatch(); }
  attributeChangedCallback() { if (this.shadowRoot) this._apply(); }
  _apply() {
    const gap = this.getAttribute('gap');
    this.style.gap = gap == null ? '' : (GAP[gap] || (/^\d+$/.test(gap) ? gap + 'px' : gap));
    // `direction` carries the full matrix (row · row-reverse · column · column-reverse); when it's
    // absent, `vertical` (AntD's boolean shorthand) selects a column. Direction wins if both set.
    const direction = this.getAttribute('direction');
    this.style.flexDirection = direction || (this.hasAttribute('vertical') ? 'column' : '');
    this.style.alignItems = ALIGN[this.getAttribute('align')] || '';
    this.style.justifyContent = JUSTIFY[this.getAttribute('justify')] || '';
    if (this.hasAttribute('scroll')) this._watch(); else this._unwatch();
  }
  _watch() {
    if (!this._watching) {
      this._watching = true;
      this.addEventListener('scroll', this._onScroll, { passive: true });
      if (typeof ResizeObserver !== 'undefined') this._resize = new ResizeObserver(this._onScroll);
      this._observeItems();
    }
    this._syncFade();
  }
  _unwatch() {
    if (!this._watching) return;
    this._watching = false;
    this.removeEventListener('scroll', this._onScroll);
    if (this._resize) this._resize.disconnect();
    this._resize = null;
    for (const name of ['--aha-flex-fade-start', '--aha-flex-fade-end', '--aha-flex-fade-dir']) this.style.removeProperty(name);
  }
  _observeItems() {
    if (!this._resize) return;
    this._resize.disconnect();
    this._resize.observe(this);
    for (const item of this.children) this._resize.observe(item);
    this._syncFade();
  }
  _syncFade() {
    if (!this._watching) return;
    // RTL scrolls from 0 towards negative scrollLeft, so the start edge is the right-hand one.
    const rtl = getComputedStyle(this).direction === 'rtl';
    const before = Math.abs(this.scrollLeft);
    const after = Math.max(0, this.scrollWidth - this.clientWidth - before);
    this.style.setProperty('--aha-flex-fade-dir', rtl ? 'to left' : 'to right');
    this.style.setProperty('--aha-flex-fade-start', Math.min(FADE, before) + 'px');
    this.style.setProperty('--aha-flex-fade-end', Math.min(FADE, after < 1 ? 0 : after) + 'px');
  }
}

export function defineAhaFlex(tag = 'aha-flex') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaFlex);
  return true;
}
if (typeof window !== 'undefined') defineAhaFlex();

export default { AhaFlex, defineAhaFlex };
