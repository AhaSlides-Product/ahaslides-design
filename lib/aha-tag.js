/**
 * @ahaslides-product/design/aha-tag — the shared Tag primitive.
 *
 *   import '@ahaslides-product/design/aha-tag';   // registers <aha-tag>
 *   <aha-tag color="primary">Poll</aha-tag>
 *   <aha-tag color="success" icon="system-check" bordered>Published</aha-tag>
 *   <aha-tag closable>Marketing</aha-tag>
 *   <aha-tag checkable checked>Poll</aha-tag>
 *
 * A small, low-emphasis label chip for categories, keywords, and states. The DS V3 Tag is a
 * FAMILY: a semantic `color` preset (neutral · primary · success · processing · warning · error),
 * a filled (default) OR `bordered` (outlined) shape, an optional leading `icon`, a `closable`
 * dismiss ✕ that animates out then removes + emits `close`, and a `checkable` toggle flavour that
 * carries a selected state (aria-pressed) and emits `change`.
 *
 * ONE element, shadow-DOM CSS, themed only by --aha-* tokens → byte-identical in React and Vue.
 * Zero dependencies. Icons are summoned by name from the DS icon library via <aha-icon> — never an
 * inline glyph — with the sole exception of the ✕ close chrome. Hover, checked, and the close
 * collapse all animate via the shared motion tokens on PERSISTENT nodes (a class/attribute toggles;
 * the subtree is never rebuilt on a per-state change, so the transition actually fires).
 */
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const STYLE = `
  :host{ display:inline-flex; --_bg:var(--aha-gray-30,#F1F1F1); --_fg:var(--aha-text-secondary,#4A4A4A); --_bd:var(--aha-border,#E3E3E3);
    max-width:100%; transition:opacity var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)),
      transform var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)) }
  :host([closing]){ opacity:0; transform:scale(.85) }

  .chip{ box-sizing:border-box; display:inline-flex; align-items:center; gap:6px; height:22px; padding:0 8px; max-width:100%;
    font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif); font-size:12px; line-height:18px; font-weight:600;
    border-radius:var(--aha-radius-xs,4px); border:1px solid transparent;
    background:var(--_bg); color:var(--_fg);
    transition:background var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)),
      color var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)),
      border-color var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)) }

  /* semantic colour presets — filled tint (default) */
  :host([color="primary"]),:host([variant="primary"]){ --_bg:var(--aha-purple-10,#F9F5FF); --_fg:var(--aha-purple-60,#6A1EBB); --_bd:var(--aha-purple-60,#6A1EBB) }
  :host([color="success"]),:host([variant="success"]){ --_bg:var(--aha-bg-positive,#D8FAEF); --_fg:var(--aha-text-positive,#13A181); --_bd:var(--aha-border-success,#16C49A) }
  :host([color="processing"]),:host([variant="processing"]){ --_bg:var(--aha-bg-informative,#F4F8FF); --_fg:var(--aha-text-link,#6A1EBB); --_bd:var(--aha-border-info,#BFD2FF) }
  :host([color="warning"]),:host([variant="warning"]){ --_bg:var(--aha-bg-warning,#FFF5F0); --_fg:var(--aha-text-warning,#E65B29); --_bd:var(--aha-border-warning,#FF7747) }
  :host([color="error"]),:host([variant="error"]){ --_bg:var(--aha-bg-negative,#FFF1F0); --_fg:var(--aha-text-negative,#F5222D); --_bd:var(--aha-border-error,#F5222D) }

  /* bordered (outlined) shape — white surface + a coloured 1px hairline, per the measured DS V3 cell */
  :host([bordered]) .chip{ background:var(--aha-bg-container,#FFFFFF); border-color:var(--_bd) }

  /* checkable toggle — rest is a neutral outlined chip; checked flips to the brand fill */
  :host([checkable]) .chip{ cursor:pointer; background:var(--aha-bg-container,#FFFFFF); border-color:var(--aha-border,#E3E3E3); color:var(--aha-text-secondary,#4A4A4A) }
  :host([checkable]:not([checked])) .chip:hover{ border-color:var(--aha-purple-60,#6A1EBB); color:var(--aha-purple-60,#6A1EBB) }
  :host([checkable][checked]) .chip{ background:var(--aha-purple-60,#6A1EBB); border-color:var(--aha-purple-60,#6A1EBB); color:var(--aha-text-inverse,#FFFFFF) }
  :host([checkable]) .chip:focus-visible{ outline:2px solid var(--aha-border-focus,#D3B4FF); outline-offset:1px }

  .label{ overflow:hidden; text-overflow:ellipsis; white-space:nowrap }
  aha-icon{ flex:0 0 auto; color:currentColor }
  .x{ display:inline-flex; align-items:center; cursor:pointer; border:0; background:none; padding:0; margin-left:-1px; color:inherit;
    opacity:.7; line-height:0; border-radius:var(--aha-radius-xs,4px);
    transition:opacity var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)) }
  .x:hover{ opacity:1 }
  .x:focus-visible{ outline:2px solid var(--aha-border-focus,#D3B4FF); outline-offset:1px; opacity:1 }
  @media (prefers-reduced-motion: reduce){ :host,.chip,.x{ transition:none !important } }
`;

export class AhaTag extends HTMLElement {
  static get observedAttributes() { return ['color', 'variant', 'bordered', 'icon', 'closable', 'checkable', 'checked']; }
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
      ? `<button class="x" part="close" aria-label="Remove"><aha-icon name="system-x" size="12" aria-hidden="true"></aha-icon></button>`
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
    if (next) this.setAttribute('checked', ''); else this.removeAttribute('checked');   // reflect → attributeChangedCallback → _syncChecked (persistent node)
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
