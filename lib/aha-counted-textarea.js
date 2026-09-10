/**
 * @ahaslides-product/design/aha-counted-textarea — the multi-line sibling of CountedInput.
 *
 *   import '@ahaslides-product/design/aha-counted-textarea';   // registers <aha-counted-textarea>
 *   <aha-counted-textarea maxlength="200" minrows="2" maxrows="4" placeholder="Answer"></aha-counted-textarea>
 *
 * A multi-line settings field whose character counter is REVEALED ONLY WHILE FOCUSED and hidden at
 * rest (SETTINGS-21 / SETTINGS-42). The field autogrows from `minrows` to `maxrows`, then scrolls
 * internally rather than growing unbounded (SETTINGS-21). The counter is a PERSISTENT overlay pinned
 * to the field's bottom-right — never a sibling that steals width, never remounted on focus. Focus
 * toggles an attribute on a persistent node, so the opacity transition actually fires. Bottom padding
 * is always reserved for the counter, so revealing it never shifts the text. ONE element, shadow-DOM
 * CSS, themed only by --aha-* tokens → byte-identical in React and Vue. Zero deps. Emits composed
 * `input` / `change` CustomEvent<{value}>.
 */
const STYLE = `
  :host{ display:inline-flex; width:240px }
  .wrap{ box-sizing:border-box; position:relative; width:100%; display:flex;
    padding:6px 12px;
    color:var(--aha-text-default,#1A1A1A); background:var(--aha-bg-container,#fff);
    border:1px solid var(--aha-border,#E3E3E3); border-radius:var(--aha-radius-default,8px);
    transition:border-color var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)), box-shadow var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)) }

  .field{ box-sizing:border-box; flex:1 1 auto; min-width:0; width:100%; padding:0; margin:0;
    font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif); font-size:14px; line-height:21px;
    color:inherit; background:transparent; border:0; outline:none; resize:none; overflow-y:auto;
    display:block }
  .field::placeholder{ color:var(--aha-text-tertiary,#8A8A8A) }
  /* reserve room below for the counter overlay so revealing it never shifts the text */
  :host([_counted]) .field{ padding-bottom:16px }

  /* the counter — a PERSISTENT overlay in the field's bottom-right, revealed only on focus (opacity, no remount) */
  .counter{ position:absolute; right:12px; bottom:6px;
    font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif); font-size:12px; line-height:18px;
    color:var(--aha-text-tertiary,#8A8A8A); pointer-events:none; opacity:0;
    background:var(--aha-bg-container,#fff); padding-left:6px;
    transition:opacity var(--aha-motion-fast,.1s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)) }
  :host([_focused][_counted]) .counter{ opacity:1 }
  .counter[hidden]{ display:none }

  .wrap:hover{ border-color:var(--aha-border-hover,#D3B4FF) }
  :host([_focused]) .wrap{ border-color:var(--aha-color-primary,#6A1EBB); box-shadow:0 0 0 2px var(--aha-focus-ring-soft,rgba(211,180,255,.3)) }

  :host([status="error"]) .wrap{ border-color:var(--aha-border-error,#F5222D) }
  :host([status="error"][_focused]) .wrap{
    border-color:var(--aha-border-error,#F5222D); box-shadow:0 0 0 2px color-mix(in srgb, var(--aha-color-error,#F5222D) 20%, transparent) }

  :host([disabled]) .wrap{ background:var(--aha-bg-container-disabled,#F1F1F1); color:var(--aha-text-disabled,#B5B5B5);
    border-color:var(--aha-border-disabled,#EBEBEB); cursor:not-allowed; box-shadow:none }
  :host([disabled]) .field{ cursor:not-allowed }
  :host([disabled]) .counter{ background:var(--aha-bg-container-disabled,#F1F1F1) }
  :host([readonly]) .wrap{ background:var(--aha-bg-container-secondary,#F7F7F7) }
  :host([readonly]) .counter{ background:var(--aha-bg-container-secondary,#F7F7F7) }

  /* borderless — the field sits transparently inside a parent that carries the one border
     (the OptionRow case, SETTINGS-34): no own border, ring, fill or side padding to double up */
  :host([borderless]) .wrap{ border:0; background:transparent; padding:6px 0; box-shadow:none }
  :host([borderless][_focused]) .wrap{ border:0; box-shadow:none }
  :host([borderless]) .counter{ right:0; background:transparent }

  @media (prefers-reduced-motion: reduce){ *{ transition:none !important } }
`;

export class AhaCountedTextarea extends HTMLElement {
  static get observedAttributes() {
    return ['value', 'placeholder', 'maxlength', 'disabled', 'readonly', 'status', 'minrows', 'maxrows'];
  }
  get value() { return this.getAttribute('value') ?? ''; }
  set value(v) { this.setAttribute('value', v ?? ''); }
  get disabled() { return this.hasAttribute('disabled'); }
  set disabled(v) { v ? this.setAttribute('disabled', '') : this.removeAttribute('disabled'); }

  connectedCallback() {
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    this._render();
  }
  attributeChangedCallback() {
    // every change is a cheap sync — the DOM shape never changes, so the counter transition stays alive
    if (this.shadowRoot) this._sync();
  }

  _render() {
    this.shadowRoot.innerHTML = `<style>${STYLE}</style>` +
      `<div class="wrap" part="wrap">` +
        `<textarea class="field" part="field"></textarea>` +
        `<span class="counter" part="counter" aria-hidden="true"></span>` +
      `</div>`;
    const f = this.shadowRoot.querySelector('.field');
    f.addEventListener('input', () => {
      this.setAttribute('value', f.value);
      this._autogrow();
      this._syncCounter();
      this.dispatchEvent(new CustomEvent('input', { bubbles: true, composed: true, detail: { value: f.value } }));
    });
    f.addEventListener('change', () => {
      this.dispatchEvent(new CustomEvent('change', { bubbles: true, composed: true, detail: { value: f.value } }));
    });
    f.addEventListener('focus', () => this.setAttribute('_focused', ''));
    f.addEventListener('blur', () => this.removeAttribute('_focused'));
    this._sync();
  }
  // Grow from minRows to maxRows, then scroll internally — never grow unbounded (SETTINGS-21).
  _autogrow() {
    const f = this.shadowRoot && this.shadowRoot.querySelector('.field');
    if (!f) return;
    const line = 21;
    const min = Math.max(1, parseInt(this.getAttribute('minrows') || '2', 10));
    const max = Math.max(min, parseInt(this.getAttribute('maxrows') || '4', 10));
    // The reserved counter space is bottom padding on the border-box field, so it lands in
    // scrollHeight — subtract the field's vertical padding or a resting row counts it as a text line.
    const pad = getComputedStyle(f);
    const padY = (parseFloat(pad.paddingTop) || 0) + (parseFloat(pad.paddingBottom) || 0);
    f.style.height = 'auto';
    const rows = Math.min(max, Math.max(min, Math.round((f.scrollHeight - padY) / line)));
    const boxHeight = rows * line + padY;
    f.style.height = boxHeight + 'px';
    f.style.overflowY = f.scrollHeight > boxHeight ? 'auto' : 'hidden';
  }
  _syncCounter() {
    const max = this.getAttribute('maxlength');
    const counter = this.shadowRoot.querySelector('.counter');
    if (max) {
      this.setAttribute('_counted', '');
      counter.hidden = false;
      counter.textContent = `${(this.value || '').length}/${max}`;
    } else {
      this.removeAttribute('_counted');
      counter.hidden = true;
    }
  }
  _sync() {
    const f = this.shadowRoot && this.shadowRoot.querySelector('.field');
    if (!f) return;
    f.placeholder = this.getAttribute('placeholder') || '';
    f.disabled = this.disabled;
    f.readOnly = this.hasAttribute('readonly');
    const max = this.getAttribute('maxlength');
    if (max) f.setAttribute('maxlength', max); else f.removeAttribute('maxlength');
    if (this.getAttribute('status') === 'error') f.setAttribute('aria-invalid', 'true'); else f.removeAttribute('aria-invalid');
    if (f.value !== this.value) f.value = this.value;
    this._syncCounter();
    this._autogrow();
  }
}

export function defineAhaCountedTextarea(tag = 'aha-counted-textarea') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaCountedTextarea);
  return true;
}
if (typeof window !== 'undefined') defineAhaCountedTextarea();

export default { AhaCountedTextarea, defineAhaCountedTextarea };
