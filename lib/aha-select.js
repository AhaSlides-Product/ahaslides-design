/**
 * @ahaslides-product/design/aha-select — the shared lightweight Select FIELD (leaf).
 *
 *   import '@ahaslides-product/design/aha-select';   // registers <aha-select>
 *   <aha-select placeholder="Pick a theme"
 *     options='[{"label":"Light","value":"light"},{"label":"Dark","value":"dark"}]'></aha-select>
 *   <aha-select size="large" status="error" value="dark"></aha-select>
 *
 * This is the LEAF counterpart to the composite Select (slug `select`, `selectTheme`). The composite
 * carries a popup, a virtualised list, type-to-search and tags — too much to rebuild as a web
 * component. This leaf is the opposite: a styled control backed by a NATIVE <select>, so it inherits
 * the OS keyboard model, focus and a11y for free — no custom listbox, no roving to hand-roll. Use it
 * to pick one value from a short, known set, and — crucially — to embed a select in a shadow-DOM row
 * (aha-settings-list's `control.type:"select"`), where the composite can't go.
 *
 * DS V3 select chrome: three sizes (small 24 · default 32 · large 40), radius 8, 1px #E3E3E3 border,
 * a brand #6A1EBB focus border, #8A8A8A placeholder, error/warning status border, and a trailing
 * caret via <aha-icon name="system-caret-down"> — summoned by name, never an inline glyph. The border
 * + focus transition live on a PERSISTENT wrapper node (a `_focused` attribute toggles; the subtree
 * is never rebuilt on a state change), so the transition actually fires. Shadow-DOM CSS, themed only
 * by --aha-* tokens → byte-identical in React and Vue. Zero dependencies. Emits composed `change`
 * CustomEvent<{value}>.
 */
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const STYLE = `
  :host{ display:inline-flex; width:240px }
  /* the wrapper is the persistent node that carries border + focus ring (animated, never rebuilt) */
  .wrap{ box-sizing:border-box; width:100%; position:relative; display:inline-flex; align-items:center;
    height:32px;
    color:var(--aha-text-default,#1A1A1A); background:var(--aha-bg-container,#fff);
    border:1px solid var(--aha-border,#E3E3E3); border-radius:var(--aha-radius-default,8px);
    transition:background var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)), border-color var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)), box-shadow var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)) }
  :host([size="sm"]) .wrap, :host([size="small"]) .wrap{ height:24px }
  :host([size="lg"]) .wrap, :host([size="large"]) .wrap{ height:40px }

  /* the native <select> — inherits OS keyboard + a11y for free; UA chrome stripped, colour set
     explicitly (a bare <select> ignores currentColor and paints its own UA text/arrow colour) */
  .field{ box-sizing:border-box; flex:1 1 auto; min-width:0; width:100%; height:100%;
    padding:0 32px 0 12px; margin:0;
    font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif); font-size:14px; line-height:21px;
    color:var(--aha-text-default,#1A1A1A); background:transparent; border:0; outline:none;
    cursor:pointer; -webkit-appearance:none; -moz-appearance:none; appearance:none }
  :host([size="sm"]) .field, :host([size="small"]) .field{ padding:0 28px 0 8px }
  /* placeholder look — a value-less field selects the placeholder <option> and dims to tertiary */
  :host([_placeholder]) .field{ color:var(--aha-text-tertiary,#8A8A8A) }
  .field option{ color:var(--aha-text-default,#1A1A1A) }
  .field option[disabled]{ color:var(--aha-text-tertiary,#8A8A8A) }

  /* the caret is our own overlay glyph (the UA arrow is suppressed above) */
  .caret{ position:absolute; right:12px; top:50%; transform:translateY(-50%); pointer-events:none;
    display:inline-flex; color:var(--aha-text-tertiary,#8A8A8A) }
  :host([size="sm"]) .caret, :host([size="small"]) .caret{ right:8px }
  aha-icon{ display:inline-flex; color:currentColor }

  /* hover / focus on the persistent wrapper */
  .wrap:hover{ border-color:var(--aha-border-hover,#D3B4FF) }
  :host([_focused]) .wrap{ border-color:var(--aha-color-primary,#6A1EBB); box-shadow:0 0 0 2px var(--aha-focus-ring-soft,rgba(211,180,255,.3)) }

  /* status — border + ring recolour (persistent node) */
  :host([status="error"]) .wrap{ border-color:var(--aha-border-error,#F5222D) }
  :host([status="error"][_focused]) .wrap{
    border-color:var(--aha-border-error,#F5222D); box-shadow:0 0 0 2px color-mix(in srgb, var(--aha-color-error,#F5222D) 20%, transparent) }
  :host([status="warning"]) .wrap{ border-color:var(--aha-border-warning,#FF7747) }
  :host([status="warning"][_focused]) .wrap{
    border-color:var(--aha-border-warning,#FF7747); box-shadow:0 0 0 2px color-mix(in srgb, var(--aha-color-warning,#FF7747) 20%, transparent) }

  /* disabled */
  :host([disabled]) .wrap{ background:var(--aha-bg-container-disabled,#F1F1F1);
    border-color:var(--aha-border-disabled,#EBEBEB); cursor:not-allowed; box-shadow:none }
  :host([disabled]) .field{ color:var(--aha-text-disabled,#B5B5B5); cursor:not-allowed }
  :host([disabled]) .caret{ color:var(--aha-text-disabled,#B5B5B5) }

  @media (prefers-reduced-motion: reduce){ *{ transition:none !important } }
`;

export class AhaSelect extends HTMLElement {
  // NOTE: no toggle-STATE attr here (checked/open/selected/…) — this is a native-backed field, so
  // there is no dead-transition trap: the wrapper + <select> are built ONCE and mutated in place.
  static get observedAttributes() {
    return ['value', 'placeholder', 'options', 'disabled', 'status', 'size'];
  }
  get value() { return this.getAttribute('value') ?? ''; }
  set value(v) { this.setAttribute('value', v ?? ''); }
  get disabled() { return this.hasAttribute('disabled'); }
  set disabled(v) { v ? this.setAttribute('disabled', '') : this.removeAttribute('disabled'); }
  get options() { return this._options || this._parseOptions(); }
  set options(v) { this._options = Array.isArray(v) ? v : null; this._populate(); }

  connectedCallback() {
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    this._build();
  }
  attributeChangedCallback(name) {
    if (!this.shadowRoot || !this._field) return;
    // options change the <option> list inside the persistent <select> — repopulate in place, never
    // rebuild the wrapper subtree (that would kill the border/focus transition).
    if (name === 'options') { this._options = null; this._populate(); }
    else this._sync();
  }

  _parseOptions() {
    const attr = this.getAttribute('options');
    if (!attr) return [];
    try { const o = JSON.parse(attr); return Array.isArray(o) ? o : []; } catch { return []; }
  }

  // Build the persistent chrome ONCE (wrapper + native <select> + caret overlay). State changes
  // afterwards only toggle attributes / repopulate <option>s — the transition node is never replaced.
  _build() {
    this.shadowRoot.innerHTML = `<style>${STYLE}</style>` +
      `<div class="wrap" part="wrap">` +
        `<select class="field" part="field"></select>` +
        `<span class="caret" part="caret" aria-hidden="true"><aha-icon name="system-caret-down" size="16"></aha-icon></span>` +
      `</div>`;
    this._field = this.shadowRoot.querySelector('.field');
    this._field.addEventListener('change', () => {
      this.setAttribute('value', this._field.value);
      this._syncPlaceholder();
      this.dispatchEvent(new CustomEvent('change', { bubbles: true, composed: true, detail: { value: this._field.value } }));
    });
    // focus ring toggles an attribute on :host (persistent node) — no rebuild, transition fires
    this._field.addEventListener('focus', () => this.setAttribute('_focused', ''));
    this._field.addEventListener('blur', () => this.removeAttribute('_focused'));
    this._populate();
  }

  // Repopulate the <option> list inside the persistent <select>.
  _populate() {
    if (!this._field) return;
    const opts = this._options || this._parseOptions();
    const placeholder = this.getAttribute('placeholder');
    const value = this.getAttribute('value');
    let html = '';
    if (placeholder != null) html += `<option value="" disabled${value ? '' : ' selected'}>${esc(placeholder)}</option>`;
    for (const o of opts) {
      const ov = o && typeof o === 'object' ? o.value : o;
      const ol = o && typeof o === 'object' ? (o.label ?? o.value) : o;
      html += `<option value="${esc(ov)}"${String(ov) === String(value) ? ' selected' : ''}>${esc(ol)}</option>`;
    }
    this._field.innerHTML = html;   // <option>s only — NOT the transition node
    this._sync();
  }

  _syncPlaceholder() {
    // dim to placeholder colour when the field has no real value selected
    const empty = !this._field || this._field.value === '' || this._field.value == null;
    if (empty && this.getAttribute('placeholder') != null) this.setAttribute('_placeholder', '');
    else this.removeAttribute('_placeholder');
  }

  _sync() {
    if (!this._field) return;
    this._field.disabled = this.disabled;
    const value = this.getAttribute('value');
    if (value != null && this._field.value !== value) this._field.value = value;
    this._syncPlaceholder();
  }
}

export function defineAhaSelect(tag = 'aha-select') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaSelect);
  return true;
}
if (typeof window !== 'undefined') defineAhaSelect();

export default { AhaSelect, defineAhaSelect };
