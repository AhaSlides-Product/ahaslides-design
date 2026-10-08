/**
 * @ahaslides-product/design/aha-tag — the shared Tag primitive.
 *
 *   import '@ahaslides-product/design/aha-tag';   // registers <aha-tag>
 *   <aha-tag color="primary">Poll</aha-tag>
 *   <aha-tag color="success" icon="system-check" bordered>Published</aha-tag>
 *   <aha-tag closable>Marketing</aha-tag>
 *   <aha-tag checkable checked>Poll</aha-tag>
 *   <aha-tag checkable controlled :checked="on" @change="on = $event.detail.checked">Poll</aha-tag>   // host owns `checked`
 *
 * A small, low-emphasis label chip for categories, keywords, and states. The DS V3 Tag is a
 * FAMILY: a semantic `color` preset (neutral · primary · branding · success · processing · warning · error),
 * a `size="large"` (36px) for filter chips,
 * a filled (default) OR `bordered` (outlined) shape, an optional leading `icon`, a `closable`
 * dismiss ✕ that animates out then removes + emits `close`, and a `checkable` toggle flavour that
 * carries a selected state (aria-pressed) and emits `change`. A checkable tag flips its own `checked` on click
 * unless it is `controlled`: then the click only emits `change` ({ checked } = the requested state) and the
 * host sets or removes `checked` itself, so a framework that binds `checked` from its own state never double-toggles.
 *
 * ONE element, shadow-DOM CSS, themed only by --aha-* tokens → byte-identical in React and Vue.
 * Zero dependencies. Icons are summoned by name from the DS icon library via <aha-icon> — never an
 * inline glyph. Hover, checked, and the close
 * collapse all animate via the shared motion tokens on PERSISTENT nodes (a class/attribute toggles;
 * the subtree is never rebuilt on a per-state change, so the transition actually fires).
 */
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const STYLE = `
  :host{ display:inline-flex; font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif); --_bg:var(--aha-gray-30,#F1F1F1); --_fg:var(--aha-text-secondary,#4A4A4A); --_bd:var(--aha-border,#E3E3E3);
    max-width:100%; transition:opacity var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)),
      transform var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)) }
  :host([closing]){ opacity:0; transform:scale(.85) }

  .chip{ box-sizing:border-box; display:inline-flex; align-items:center; gap:var(--aha-space-4,4px); height:20px; padding:0 var(--aha-space-6,6px); max-width:100%;
    font-family:inherit; font-size:12px; line-height:18px; font-weight:600;
    border-radius:var(--aha-radius-xs,4px); border:1px solid transparent;
    background:var(--_bg); color:var(--_fg);
    transition:background var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)),
      color var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)),
      border-color var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)) }

  /* semantic colour presets — filled tint (default) */
  :host([color="primary"]),:host([variant="primary"]){ --_bg:var(--aha-bg-accent,#FEF3F7); --_fg:var(--aha-text-default,#1A1A1A); --_bd:var(--aha-color-primary,#E70E68) }
  :host([color="branding"]),:host([variant="branding"]){ --_bg:var(--aha-bg-accent,#FEF3F7); --_fg:var(--aha-text-default,#1A1A1A); --_bd:var(--aha-color-primary,#E70E68) }
  :host([color="success"]),:host([variant="success"]){ --_bg:var(--aha-bg-positive,#FFFFFF); --_fg:var(--aha-text-positive,#000000); --_bd:var(--aha-border-success,#000000) }
  :host([color="processing"]),:host([variant="processing"]){ --_bg:var(--aha-bg-informative,#FFFFFF); --_fg:var(--aha-text-link,#000000); --_bd:var(--aha-border-info,#000000) }
  :host([color="warning"]),:host([variant="warning"]){ --_bg:var(--aha-bg-warning,#FFFFFF); --_fg:var(--aha-text-warning,#000000); --_bd:var(--aha-border-warning,#000000) }
  :host([color="error"]),:host([variant="error"]){ --_bg:var(--aha-bg-negative,#FFFFFF); --_fg:var(--aha-text-negative,#000000); --_bd:var(--aha-border-error,#000000) }

  /* bordered (outlined) shape — white surface + a coloured 1px hairline, per the measured DS V3 cell */
  :host([bordered]) .chip{ background:var(--aha-bg-container,#FFFFFF); border-color:var(--_bd) }

  /* checkable toggle — rest is a neutral outlined chip; checked flips to the brand fill */
  :host([checkable]) .chip{ cursor:pointer; background:var(--aha-bg-container,#FFFFFF); border-color:var(--aha-border,#E3E3E3); color:var(--aha-text-secondary,#4A4A4A) }
  :host([checkable]:not([checked])) .chip:hover{ border-color:var(--aha-color-primary,#E70E68); color:var(--aha-color-primary,#E70E68) }
  :host([checkable][checked]) .chip{ background:var(--aha-color-primary,#E70E68); border-color:var(--aha-color-primary,#E70E68); color:var(--aha-text-inverse,#FFFFFF) }
  :host([checkable]) .chip:focus-visible{ outline:2px solid var(--aha-border-focus,#E70E68); outline-offset:1px }

  /* large checkable — the filter chip: soft grey rest, pale pink checked */
  :host([checkable][size="large"]) .chip{ background:var(--aha-gray-15,#FAFAFA); border-color:var(--aha-border-input,#D4D4D4); color:var(--aha-text-default,#1A1A1A) }
  :host([checkable][size="large"]:not([checked])) .chip:hover{ border-color:var(--aha-border-hover,#E70E68); color:var(--aha-text-default,#1A1A1A) }
  :host([checkable][size="large"][checked]) .chip{ background:var(--aha-bg-accent,#FEF3F7); border-color:var(--aha-color-primary,#E70E68); color:var(--aha-text-default,#1A1A1A) }

  /* large — the 36px filter chip, same height as a default button */
  :host([size="large"]) .chip{ height:36px; padding:0 var(--aha-space-12,12px); font-size:14px; line-height:20px; font-weight:400; border-radius:var(--aha-radius-default,8px) }

  .label{ overflow:hidden; text-overflow:ellipsis; white-space:nowrap }
  aha-icon{ flex:0 0 auto; color:currentColor }
  .x{ display:inline-flex; align-items:center; cursor:pointer; border:0; background:transparent; padding:var(--aha-space-2,2px);
    margin:calc(-1 * var(--aha-space-2,2px)) calc(-1 * var(--aha-space-2,2px)) calc(-1 * var(--aha-space-2,2px)) calc(-1 * var(--aha-space-2,2px) - 1px);
    color:var(--aha-icon-muted,#8A8A8A); line-height:0; border-radius:var(--aha-radius-xs,4px);
    transition:color var(--aha-motion-fast,.1s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)),
      background var(--aha-motion-fast,.1s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)) }
  .x:hover{ color:var(--aha-text-default,#1A1A1A); background:var(--aha-bg-hover,#F7F7F7) }
  .x:focus-visible{ outline:2px solid var(--aha-border-focus,#E70E68); outline-offset:0 }
  @media (prefers-reduced-motion: reduce){ :host,.chip,.x{ transition:none !important } }
`;

export class AhaTag extends HTMLElement {
  static get observedAttributes() { return ['color', 'variant', 'size', 'bordered', 'icon', 'closable', 'checkable', 'checked']; }
  connectedCallback() { if (!this.shadowRoot) this.attachShadow({ mode: 'open' }); this._render(); }
  attributeChangedCallback(name) {
    if (!this.shadowRoot) return;
    // `checked` is a per-state toggle — sync it on the PERSISTENT chip (never rebuild the subtree,
    // or the fill/border transition would be dead). Everything else re-renders structure.
    if (name === 'checked') { this._syncChecked(); return; }
    this._render();
  }
  _syncChecked() {
    const chip = this.shadowRoot.querySelector('.chip');
    if (chip && this.hasAttribute('checkable')) chip.setAttribute('aria-pressed', String(this.hasAttribute('checked')));
  }

  _render() {
    const checkable = this.hasAttribute('checkable');
    const icon = this.getAttribute('icon');
    const lead = icon ? `<aha-icon name="${esc(icon)}" size="14" aria-hidden="true"></aha-icon>` : '';
    const close = this.hasAttribute('closable')
      ? `<button class="x" part="close" type="button" aria-label="Remove"><aha-icon name="system-x" size="12" aria-hidden="true"></aha-icon></button>`
      : '';
    const inner = `${lead}<span class="label"><slot></slot></span>${close}`;
    const chip = checkable
      ? `<button class="chip" part="chip" type="button" aria-pressed="${this.hasAttribute('checked')}">${inner}</button>`
      : `<span class="chip" part="chip">${inner}</span>`;
    // Rebuild via clear+append (not innerHTML=/replaceChildren) so the `checked` per-state toggle —
    // handled separately on the persistent chip via _syncChecked — stays off the rebuild path.
    while (this.shadowRoot.firstChild) this.shadowRoot.removeChild(this.shadowRoot.firstChild);
    this.shadowRoot.append(document.createRange().createContextualFragment(`<style>${STYLE}</style>${chip}`));

    if (checkable) {
      this.shadowRoot.querySelector('.chip').addEventListener('click', () => this._toggle());
    }
    const btn = this.shadowRoot.querySelector('.x');
    if (btn) btn.addEventListener('click', (e) => { e.stopPropagation(); this._close(); });
  }

  _toggle() {
    const next = !this.hasAttribute('checked');
    if (!this.hasAttribute('controlled')) {
      if (next) this.setAttribute('checked', ''); else this.removeAttribute('checked');   // reflect → attributeChangedCallback → _syncChecked (persistent node)
    }
    this.dispatchEvent(new CustomEvent('change', { bubbles: true, composed: true, detail: { checked: next } }));
  }

  _close() {
    // animate out on the persistent :host, then remove + emit — never yanked instantly
    this.dispatchEvent(new CustomEvent('close', { bubbles: true, composed: true }));
    const done = () => { this.removeEventListener('transitionend', done); this.remove(); };
    const reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) { this.remove(); return; }
    this.addEventListener('transitionend', done);
    this.setAttribute('closing', '');
    setTimeout(() => { if (this.isConnected) done(); }, 400);   // safety net if transitionend never fires
  }
}

export function defineAhaTag(tag = 'aha-tag') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaTag);
  return true;
}
if (typeof window !== 'undefined') defineAhaTag();

export default { AhaTag, defineAhaTag };
