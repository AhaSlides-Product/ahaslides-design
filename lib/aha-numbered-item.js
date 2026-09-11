/**
 * @ahaslides-product/design/aha-numbered-item — the numbered composite-item wrapper.
 *
 *   import '@ahaslides-product/design/aha-numbered-item';   // registers <aha-numbered-item>
 *   <aha-numbered-item n="1" label="Question" deletable>…the item's fields…</aha-numbered-item>
 *
 * The wrapper for a repeatable COMPOSITE item in a settings list — a Question, a Card, a Round: its own
 * body of fields (in the slot) under a number chip + "<Label> N" header + hover delete (SETTINGS-43).
 * The `contained` variant (default) wraps the WHOLE item — chip, header, delete AND body — inside ONE
 * secondary-fill grey card (never a header sitting above a separately-grey body); the number chip is a
 * MUTED GREY circle (never a radical-purple badge). The delete is a TERTIARY text trash (borderless,
 * non-danger) shown ONLY on hover (space reserved so nothing shifts), hidden entirely for a
 * non-removable item (`deletable=false`) and disabled at the minimum count (`candelete=false`). The
 * `plain` variant drops the fill and is for SINGLE-FIELD items only. Delete glyph by name via
 * <aha-icon>. Shadow-DOM CSS, themed only by --aha-* tokens. Emits composed `delete` CustomEvent<{n}>.
 */
import './icons.js';   // registers <aha-icon> for the delete trash

const STYLE = `
  :host{ display:block; font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif) }
  .item{ box-sizing:border-box; padding:12px; border-radius:var(--aha-radius-lg,12px);
    background:var(--aha-bg-container-secondary,#F7F7F7) }
  :host([variant="plain"]) .item{ padding:0; background:transparent }
  .head{ display:flex; align-items:center; gap:8px; min-height:24px }
  .chip{ flex:0 0 auto; display:inline-flex; align-items:center; justify-content:center;
    width:22px; height:22px; border-radius:var(--aha-radius-pill,999px);
    background:var(--aha-bg-container-disabled,#F1F1F1); color:var(--aha-text-secondary,#4A4A4A);
    font-size:12px; line-height:1; font-weight:600 }
  :host([variant="plain"]) .chip{ background:var(--aha-bg-container-secondary,#F7F7F7) }
  .title{ flex:1 1 auto; min-width:0; font-size:14px; line-height:21px; font-weight:600; color:var(--aha-text-default,#1A1A1A) }
  .caret{ flex:0 0 auto; display:none; align-items:center; justify-content:center; width:24px; height:24px;
    padding:0; border:0; background:transparent; cursor:pointer; color:var(--aha-icon-muted,#8A8A8A);
    border-radius:var(--aha-radius-sm,6px);
    transition:transform var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)),
      background var(--aha-motion-fast,.1s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)) }
  :host([collapsible]) .caret{ display:inline-flex }
  .caret:hover{ background:var(--aha-bg-hover,#F7F7F7) }
  :host([_collapsed]) .caret{ transform:rotate(-90deg) }
  .delete{ flex:0 0 auto; display:inline-flex; align-items:center; justify-content:center; width:24px; height:24px;
    padding:0; border:0; background:transparent; cursor:pointer; opacity:0;
    color:var(--aha-icon-muted,#8A8A8A); border-radius:var(--aha-radius-sm,6px);
    transition:opacity var(--aha-motion-fast,.1s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)),
      color var(--aha-motion-fast,.1s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)),
      background var(--aha-motion-fast,.1s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)) }
  .item:hover .delete, .delete:focus-visible{ opacity:1 }
  .delete:hover{ color:var(--aha-color-error,#F5222D); background:var(--aha-bg-hover,#F7F7F7) }
  .delete:disabled{ cursor:not-allowed; color:var(--aha-text-disabled,#B5B5B5) }
  .delete[hidden]{ display:none }
  .body{ margin-top:8px }
  :host([variant="plain"]) .body{ margin-top:4px }
  .body[hidden]{ display:none }
  @media (prefers-reduced-motion: reduce){ *{ transition:none !important } }
`;

export class AhaNumberedItem extends HTMLElement {
  static get observedAttributes() { return ['variant', 'n', 'label', 'deletable', 'candelete', 'collapsible']; }
  get n() { return this.getAttribute('n') || ''; }
  set n(v) { this.setAttribute('n', v); }

  connectedCallback() {
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    if (!this._built) {
      this.shadowRoot.innerHTML = `<style>${STYLE}</style>` +
        `<div class="item" part="item">` +
          `<div class="head" part="head">` +
            `<span class="chip" part="chip" aria-hidden="true"></span>` +
            `<span class="title" part="title"></span>` +
            `<button class="caret" part="caret" type="button" aria-label="Collapse">` +
              `<aha-icon name="system-caret-down" size="16" aria-hidden="true"></aha-icon></button>` +
            `<button class="delete" part="delete" type="button" aria-label="Delete">` +
              `<aha-icon name="system-trash" size="16" aria-hidden="true"></aha-icon></button>` +
          `</div>` +
          `<div class="body" part="body"><slot></slot></div>` +
        `</div>`;
      this._built = true;
      this.shadowRoot.querySelector('.caret').addEventListener('click', () => this._toggleCollapse());
      this.shadowRoot.querySelector('.delete').addEventListener('click', () => {
        if (this._canDelete()) this.dispatchEvent(new CustomEvent('delete', { bubbles: true, composed: true, detail: { n: Number(this.n) || this.n } }));
      });
    }
    this._sync();
  }
  attributeChangedCallback() { if (this._built) this._sync(); }

  _canDelete() { return this.getAttribute('candelete') !== 'false' && !this._del.disabled; }
  get _del() { return this.shadowRoot.querySelector('.delete'); }

  _sync() {
    this.shadowRoot.querySelector('.chip').textContent = this.n;
    const label = this.getAttribute('label') || '';
    this.shadowRoot.querySelector('.title').textContent = label ? `${label} ${this.n}`.trim() : (this.n ? `Item ${this.n}` : '');
    const del = this._del;
    // deletable=false hides the control entirely; candelete=false only DISABLES it (the minimum-count case)
    del.hidden = this.getAttribute('deletable') === 'false' || !this.hasAttribute('deletable');
    del.disabled = this.getAttribute('candelete') === 'false';
    this.shadowRoot.querySelector('.body').hidden = this.hasAttribute('_collapsed');
    const caret = this.shadowRoot.querySelector('.caret');
    caret.setAttribute('aria-expanded', this.hasAttribute('_collapsed') ? 'false' : 'true');
  }
  // Collapse toggles a reflected attribute on the persistent host — the body hides in place and the
  // caret's rotation transition fires (no subtree rebuild).
  _toggleCollapse() {
    if (this.hasAttribute('_collapsed')) this.removeAttribute('_collapsed'); else this.setAttribute('_collapsed', '');
    this._sync();
    this.dispatchEvent(new CustomEvent('toggle', { bubbles: true, composed: true, detail: { collapsed: this.hasAttribute('_collapsed') } }));
  }
}

export function defineAhaNumberedItem(tag = 'aha-numbered-item') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaNumberedItem);
  return true;
}
if (typeof window !== 'undefined') defineAhaNumberedItem();

export default { AhaNumberedItem, defineAhaNumberedItem };
