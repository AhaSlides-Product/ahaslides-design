/**
 * @ahaslides-product/design/aha-info-box — a settings-only tinted callout.
 *
 *   import '@ahaslides-product/design/aha-info-box';   // registers <aha-info-box>
 *   <aha-info-box variant="warning" dismissible>Turning this off clears saved responses.</aha-info-box>
 *
 * A bespoke settings callout (NOT Ant Alert) in four tones — information / success / warning / error —
 * each with its own tinted background, border and leading glyph, and an optional dismiss control (the shared
 * <aha-close-button>, pinned to the first line). It is a status region (role="status") so assistive tech
 * announces it. Dismiss animates the box out on a
 * persistent node (opacity + a class toggle, never a subtree rebuild) and emits `dismiss`; the host
 * owns any persisted "don't show again" state. The glyph is summoned by name via <aha-icon>. Shadow-DOM
 * CSS, themed only by --aha-* tokens.
 */
import './icons.js';
import './aha-close-button.js';

const ICONS = { information: 'system-info', success: 'system-check-circle', warning: 'system-warning-circle', error: 'system-x-circle' };

const STYLE = `
  :host{ display:block; font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif) }
  .box{ box-sizing:border-box; display:flex; align-items:flex-start; gap:8px;
    padding:12px 16px; border:1px solid var(--aha-border-info,#1A1A1A); border-radius:var(--aha-radius-default,8px);
    background:var(--aha-bg-informative,#FFFFFF); color:var(--aha-text-default,#1A1A1A);
    opacity:1; transition:opacity var(--aha-motion-mid,.2s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)) }
  .box.leaving{ opacity:0 }
  .glyph{ flex:0 0 auto; display:inline-flex; color:var(--aha-color-info,#1A1A1A); margin-top:1px }
  .text{ flex:1 1 auto; min-width:0; font-size:14px; line-height:21px }
  .dismiss{ --aha-close-line-height:21px }

  :host([variant="success"]) .box{ background:var(--aha-bg-positive,#FFFFFF); border-color:var(--aha-border-success,#1A1A1A) }
  :host([variant="success"]) .glyph{ color:var(--aha-color-success,#1A1A1A) }
  :host([variant="warning"]) .box{ background:var(--aha-bg-warning-subtle,#FFFFFF); border-color:var(--aha-border-warning,#1A1A1A) }
  :host([variant="warning"]) .glyph{ color:var(--aha-color-warning,#1A1A1A) }
  :host([variant="error"]) .box{ background:var(--aha-bg-negative,#FFFFFF); border-color:var(--aha-border-error,#1A1A1A) }
  :host([variant="error"]) .glyph{ color:var(--aha-color-error,#1A1A1A) }

  @media (prefers-reduced-motion: reduce){ *{ transition:none !important } }
`;

export class AhaInfoBox extends HTMLElement {
  static get observedAttributes() { return ['variant', 'dismissible', 'icon']; }
  get variant() { return this.getAttribute('variant') || 'information'; }
  set variant(v) { this.setAttribute('variant', v); }

  connectedCallback() {
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    if (!this._built) {
      this.shadowRoot.innerHTML = `<style>${STYLE}</style>` +
        `<div class="box" part="box" role="status">` +
          `<span class="glyph" part="glyph"><aha-icon size="18" aria-hidden="true"></aha-icon></span>` +
          `<span class="text" part="text"><slot></slot></span>` +
          `<aha-close-button class="dismiss" part="dismiss" label="Dismiss" hidden></aha-close-button>` +
        `</div>`;
      this._built = true;
      this.shadowRoot.querySelector('.dismiss').addEventListener('click', () => this._dismiss());
    }
    this._sync();
  }
  attributeChangedCallback() { if (this._built) this._sync(); }

  _sync() {
    const glyph = this.shadowRoot.querySelector('.glyph aha-icon');
    glyph.setAttribute('name', this.getAttribute('icon') || ICONS[this.variant] || ICONS.information);
    this.shadowRoot.querySelector('.dismiss').hidden = !this.hasAttribute('dismissible');
  }
  // Fade out on the persistent node, then remove — the transition fires because we toggle a class, not rebuild.
  _dismiss() {
    const box = this.shadowRoot.querySelector('.box');
    box.classList.add('leaving');
    const done = () => { this.hidden = true; box.classList.remove('leaving'); this.dispatchEvent(new CustomEvent('dismiss', { bubbles: true, composed: true })); };
    let called = false;
    const once = () => { if (!called) { called = true; done(); } };
    box.addEventListener('transitionend', once, { once: true });
    setTimeout(once, 260);
  }
}

export function defineAhaInfoBox(tag = 'aha-info-box') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaInfoBox);
  return true;
}
if (typeof window !== 'undefined') defineAhaInfoBox();

export default { AhaInfoBox, defineAhaInfoBox };
