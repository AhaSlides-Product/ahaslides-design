/**
 * @ahaslides-product/design/aha-card — the shared Card primitive.
 *
 *   import '@ahaslides-product/design/aha-card';   // registers <aha-card>
 *   <aha-card card-title="Live poll">Body content</aha-card>
 *
 * A surface that groups related content — an optional cover image, a title header with a right-aligned
 * `extra` action, a body, and an optional footer of `actions`. The DS V3 Card is a FAMILY, not a single
 * box: `size` (default · small) tunes the padding, `bordered` toggles the outline, `hoverable` lifts the
 * card on hover, `interactive` makes the whole card one keyboard-reachable button, `stretch` fills the
 * grid or flex cell so cards in a row share one height, and `loading` swaps the body for a shimmer
 * skeleton. ONE element, shadow-DOM CSS, themed only by --aha-* tokens → byte-identical in React and Vue.
 * Zero dependencies.
 *
 * Slots:
 *   (default)   the body content
 *   cover       a full-bleed image/media strip above the header (no inset)
 *   title       rich header title (text plus an icon, tag or link); wins over the `card-title` attribute
 *   extra       a right-aligned header action (a link or button)
 *   actions     a footer row of actions, ruled off from the body
 *
 * `card-title` is plain text, never markup. `interactive` gives the host role="button" and tabindex="0"
 * (unless the author set them), fires the native `click` on Enter and Space, lifts like `hoverable` and
 * draws the DS focus ring on keyboard focus; an interactive card holds no other controls.
 *
 * The shadow DOM is built once; attribute changes update persistent nodes, so the hover lift, border
 * colour and shadow transitions fire.
 */
const STYLE = `
  :host{ display:block; font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif) }
  [hidden]{ display:none !important }
  .card{ box-sizing:border-box; background:var(--aha-bg-container,#FFFFFF);
    border:1px solid var(--aha-border-default,#E3E3E3); border-radius:var(--aha-radius-lg,12px); overflow:hidden;
    font-family:inherit;
    transition:box-shadow var(--aha-motion-mid,.2s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)), border-color var(--aha-motion-mid,.2s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)) }

  /* borderless variant — a flat surface with no outline */
  :host([bordered="false"]) .card{ border-color:transparent }

  /* cover — full-bleed media above the header, no inset */
  .cover{ display:block }
  .cover ::slotted(*){ display:block; width:100%; margin:0 }

  .head{ display:flex; align-items:center; justify-content:space-between; gap:12px;
    padding:16px 20px; border-bottom:1px solid var(--aha-split,#F1F1F1);
    font-size:16px; line-height:24px; font-weight:600; color:var(--aha-text-default,#1A1A1A) }
  .content{ display:contents }
  .body{ padding:20px; font-size:14px; line-height:22px; color:var(--aha-text-secondary,#4A4A4A) }
  .actions{ display:flex; align-items:center; gap:8px; padding:12px 20px;
    border-top:1px solid var(--aha-split,#F1F1F1) }

  /* small size — tighter padding, smaller title (antd Card size=small) */
  :host([size="small"]) .head{ padding:8px 12px; font-size:14px; line-height:22px }
  :host([size="small"]) .body{ padding:12px }
  :host([size="small"]) .actions{ padding:8px 12px }

  :host([hoverable]) .card, :host([interactive]) .card{ cursor:pointer }
  :host([hoverable]:hover) .card, :host([interactive]:hover) .card{ border-color:var(--aha-border-hover,#E70E68); box-shadow:0 4px 12px var(--aha-ink-a10,rgba(0,0,0,.1)) }

  :host([interactive]){ border-radius:var(--aha-radius-lg,12px) }
  :host([interactive]:focus-visible){ outline:2px solid var(--aha-focus-ring,#E70E68); outline-offset:2px }

  :host([stretch]){ height:100% }
  :host([stretch]) .card{ height:100%; display:flex; flex-direction:column }
  :host([stretch]) .body{ flex:1 1 auto }

  /* loading skeleton — a shimmer that sweeps a persistent set of bars */
  .skeleton{ display:flex; flex-direction:column; gap:12px }
  .sk-bar{ height:14px; border-radius:var(--aha-radius-sm,4px);
    background:linear-gradient(90deg, var(--aha-bg-hover,#F7F7F7) 25%, var(--aha-split,#F1F1F1) 37%, var(--aha-bg-hover,#F7F7F7) 63%);
    background-size:400% 100%; animation:sk-sweep var(--aha-motion-slow,.3s) linear infinite;
    animation-duration:1.4s }
  .sk-bar.w60{ width:60% }
  .sk-bar.w80{ width:80% }
  @keyframes sk-sweep{ 0%{ background-position:100% 0 } 100%{ background-position:0 0 } }
  @media (prefers-reduced-motion: reduce){ *{ transition:none !important; animation:none !important } }
`;

const SKELETON = `<div class="skeleton" aria-hidden="true"><div class="sk-bar w60"></div><div class="sk-bar"></div><div class="sk-bar"></div><div class="sk-bar w80"></div></div>`;

export class AhaCard extends HTMLElement {
  static get observedAttributes() { return ['card-title', 'loading', 'interactive']; }
  connectedCallback() {
    if (!this.shadowRoot) this._build();
    this._update();
  }
  attributeChangedCallback() { if (this.shadowRoot) this._update(); }
  _build() {
    const root = this.attachShadow({ mode: 'open' });
    root.innerHTML =
      `<style>${STYLE}</style><div class="card" part="card">` +
      `<div class="cover" part="cover"><slot name="cover"></slot></div>` +
      `<div class="head" part="head"><span class="title" part="title"><slot name="title"><span class="title-text"></span></slot></span><span class="extra"><slot name="extra"></slot></span></div>` +
      `<div class="body" part="body"><div class="content"><slot></slot></div>${SKELETON}</div>` +
      `<div class="actions" part="actions" role="group"><slot name="actions"></slot></div>` +
      `</div>`;
    this._head = root.querySelector('.head');
    this._titleText = root.querySelector('.title-text');
    this._titleSlot = root.querySelector('slot[name="title"]');
    this._body = root.querySelector('.body');
    this._content = root.querySelector('.content');
    this._skeleton = root.querySelector('.skeleton');
    this._titleSlot.addEventListener('slotchange', () => this._syncHead());
    this._syncSlot('cover');
    this._syncSlot('actions');
    this.addEventListener('keydown', (event) => this._onKeyDown(event));
    this.addEventListener('keyup', (event) => this._onKeyUp(event));
  }
  _update() {
    this._titleText.textContent = this.getAttribute('card-title') || '';
    this._syncHead();
    const loading = this.hasAttribute('loading');
    this._content.hidden = loading;
    this._skeleton.hidden = !loading;
    if (loading) this._body.setAttribute('aria-busy', 'true');
    else this._body.removeAttribute('aria-busy');
    this._syncInteractive();
  }
  _syncHead() {
    this._head.hidden = !this.getAttribute('card-title') && !this._titleSlot.assignedNodes().length;
  }
  _syncInteractive() {
    const interactive = this.hasAttribute('interactive');
    this._addedAttributes = this._addedAttributes || new Set();
    for (const [name, value] of [['role', 'button'], ['tabindex', '0']]) {
      if (interactive && !this.hasAttribute(name)) {
        this.setAttribute(name, value);
        this._addedAttributes.add(name);
      } else if (!interactive && this._addedAttributes.has(name)) {
        this.removeAttribute(name);
        this._addedAttributes.delete(name);
      }
    }
  }
  _isOwnKey(event) {
    return this.hasAttribute('interactive') && event.target === this && !event.altKey && !event.ctrlKey && !event.metaKey;
  }
  _onKeyDown(event) {
    if (!this._isOwnKey(event)) return;
    if (event.key === 'Enter') {
      event.preventDefault();
      if (!event.repeat) this.click();
    } else if (event.key === ' ') {
      event.preventDefault();
      this._spacePressed = true;
    }
  }
  _onKeyUp(event) {
    if (!this._isOwnKey(event) || event.key !== ' ' || !this._spacePressed) return;
    this._spacePressed = false;
    event.preventDefault();
    this.click();
  }
  _syncSlot(name) {
    const slot = this.shadowRoot.querySelector(`slot[name="${name}"]`);
    if (!slot) return;
    const wrap = slot.parentElement;
    const sync = () => { wrap.style.display = slot.assignedNodes().length ? '' : 'none'; };
    sync();
    slot.addEventListener('slotchange', sync);
  }
}

export function defineAhaCard(tag = 'aha-card') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaCard);
  return true;
}
if (typeof window !== 'undefined') defineAhaCard();

export default { AhaCard, defineAhaCard };
