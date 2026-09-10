/**
 * @ahaslides-product/design/aha-spin — the shared Spin (loading) primitive.
 *
 *   import '@ahaslides-product/design/aha-spin';   // registers <aha-spin>
 *   <aha-spin></aha-spin>
 *   <aha-spin size="large" tip="Loading results…"></aha-spin>
 *
 *   // Wrapper mode — overlay a spinner over content while it loads:
 *   <aha-spin spinning tip="Loading…"><div class="panel">…real content…</div></aha-spin>
 *
 * A brand-coloured loading spinner for an indeterminate wait. ONE element, shadow-DOM CSS,
 * themed only by --aha-* tokens → byte-identical in React and Vue. Zero dependencies. The
 * ring is a pure-CSS rotation (no inline <svg>, no icon), so it never blocks on the registry.
 *
 * Two shapes from ONE element:
 *  - Standalone (no slotted children): just the ring + optional tip.
 *  - Wrapper: slot content; when `spinning`, a dimmed + blurred scrim covers the child and a
 *    centred ring (with the tip) floats over it. Toggling `spinning` only flips a class on a
 *    PERSISTENT overlay node — the subtree is never rebuilt — so the fade animates via the
 *    shared motion tokens.
 */
const STYLE = `
  :host{ display:inline-flex; flex-direction:column; align-items:center; gap:8px;
    font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif); font-size:12px; line-height:18px;
    color:var(--aha-text-secondary,#4A4A4A) }
  /* Wrapper mode: content is slotted, so the host becomes a positioned block wrapping it. */
  :host([_wrap]){ display:block; position:relative }
  .spinner{ box-sizing:border-box; width:20px; height:20px; border-radius:50%;
    border:2px solid var(--aha-purple-20,#E6D4FF);
    border-top-color:var(--aha-color-primary,#6A1EBB);
    animation:aha-spin-rotate 0.9s linear infinite }
  :host([size="small"]) .spinner{ width:14px; height:14px; border-width:2px }
  :host([size="large"]) .spinner{ width:32px; height:32px; border-width:3px }
  .tip{ color:var(--aha-text-secondary,#4A4A4A) }
  .tip:empty{ display:none }

  /* The slotted content dims + blurs while spinning (persistent node, animated). */
  .content{ transition:opacity var(--aha-motion-mid,.2s) var(--aha-ease-in-out,ease),
    filter var(--aha-motion-mid,.2s) var(--aha-ease-in-out,ease) }
  :host([_wrap]) .box{ position:absolute; inset:0; display:flex; flex-direction:column;
    align-items:center; justify-content:center; gap:8px; pointer-events:none;
    background:color-mix(in srgb, var(--aha-bg-container,#FFFFFF) 60%, transparent);
    opacity:0;
    transition:opacity var(--aha-motion-mid,.2s) var(--aha-ease-in-out,ease) }
  :host([_wrap][spinning]) .box{ opacity:1; pointer-events:auto }
  :host([_wrap][spinning]) .content{ opacity:.5; filter:blur(0.5px); user-select:none }

  @keyframes aha-spin-rotate{ to{ transform:rotate(360deg) } }
  @media (prefers-reduced-motion: reduce){ .spinner{ animation-duration:2.4s } }
`;

export class AhaSpin extends HTMLElement {
  static get observedAttributes() { return ['size', 'tip', 'spinning']; }
  connectedCallback() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
      // Persistent structure: a standalone ring/tip, PLUS a wrapper box + slot for children.
      // Which one shows is decided by the presence of slotted content (the `_wrap` reflection).
      this.shadowRoot.innerHTML =
        `<style>${STYLE}</style>` +
        `<span class="content"><slot></slot></span>` +
        `<span class="box" part="overlay" aria-hidden="true">` +
          `<span class="spinner spinner-wrap" part="spinner" role="status" aria-label="Loading"></span>` +
          `<span class="tip tip-wrap" part="tip"></span>` +
        `</span>` +
        `<span class="spinner spinner-solo" part="spinner" role="status" aria-label="Loading"></span>` +
        `<span class="tip tip-solo" part="tip"></span>`;
      const slot = this.shadowRoot.querySelector('slot');
      slot.addEventListener('slotchange', () => this._syncMode());
    }
    this._syncMode();
    this._update();
  }
  attributeChangedCallback() { if (this.shadowRoot) this._update(); }
  // Wrapper mode iff the element actually has slotted (light-DOM) children.
  _syncMode() {
    const slot = this.shadowRoot.querySelector('slot');
    const hasChildren = slot.assignedNodes({ flatten: true })
      .some((n) => n.nodeType === 1 || (n.nodeType === 3 && n.textContent.trim()));
    if (hasChildren) this.setAttribute('_wrap', '');
    else this.removeAttribute('_wrap');
    this._toggleSolo(!hasChildren);
  }
  _toggleSolo(show) {
    const solo = this.shadowRoot.querySelectorAll('.spinner-solo, .tip-solo');
    const box = this.shadowRoot.querySelector('.box');
    solo.forEach((n) => { n.style.display = show ? '' : 'none'; });
    if (box) box.style.display = show ? 'none' : '';
  }
  _update() {
    const tip = this.getAttribute('tip') || '';
    this.shadowRoot.querySelectorAll('.tip').forEach((n) => { n.textContent = tip; });
  }
}

export function defineAhaSpin(tag = 'aha-spin') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaSpin);
  return true;
}
if (typeof window !== 'undefined') defineAhaSpin();

export default { AhaSpin, defineAhaSpin };
