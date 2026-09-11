/**
 * @ahaslides-product/design/aha-mode-field — a labelled field whose input swaps with an inline mode.
 *
 *   import '@ahaslides-product/design/aha-mode-field';   // registers <aha-mode-field>
 *   <aha-mode-field label="Results" value="auto"
 *     options='[{"value":"auto","label":"Automatic"},{"value":"manual","label":"Manual"}]'>
 *     <div data-mode="auto">…the automatic body…</div>
 *     <div data-mode="manual">…the manual body…</div>
 *   </aha-mode-field>
 *   el.options = [{ value:'auto', label:'Automatic' }, { value:'manual', label:'Manual' }];
 *
 * The settings field where a single control has two-or-more exclusive MODES (an automatic/manual
 * switch, a value-source switch): a label with an inline mode control on one head row (label LEFT,
 * control RIGHT, wraps below on narrow), and a body that swaps IN PLACE as the active value changes.
 * The bodies are the element's own light-DOM children (persistent nodes) tagged `data-mode="…"`;
 * switching only toggles their `hidden`, never rebuilds them — so the active body keeps its state and
 * the mode buttons' transition fires.
 *
 * Two inline-control looks via `variant`:
 *   `radio` (default) — an OUTLINE segmented control: unselected = neutral border on white; selected =
 *                       --aha-color-primary border + brand text on a WHITE / transparent fill (never a
 *                       solid brand-filled pill).
 *   `segmented`       — the neutral grey segmented control (grey track + white sliding-look active).
 * `labelVariant`: `field` (default, regular weight) or `section` (semibold 600 — a section header for
 * when the body is a grouped list). `help` renders the settings-label "?" tooltip after the label
 * (DS <aha-tooltip help> → <aha-icon name="system-question-mark">).
 *
 * The mode buttons are an honest group of `aria-pressed` buttons (exclusive selection without faking a
 * roving radiogroup). Shadow-DOM CSS, themed only by --aha-* tokens. Emits composed `change`
 * CustomEvent<{value}>.
 */
import './aha-tooltip.js';   // registers <aha-tooltip> — the "?" help trigger after the label (settings help pattern)

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const STYLE = `
  :host{ display:block; font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif) }
  /* head — label LEFT, mode control RIGHT; wraps the control below the label on narrow */
  .head{ display:flex; align-items:center; justify-content:space-between; gap:12px;
    flex-wrap:wrap; row-gap:8px; min-height:32px }
  .labelline{ display:inline-flex; align-items:center; gap:4px; min-width:0 }
  .label{ font-size:14px; line-height:21px; font-weight:400; color:var(--aha-text-default,#1A1A1A) }
  /* section label = a semibold header (matches a grouped-list section title) */
  :host([label-variant="section"]) .label{ font-weight:600 }
  /* the "?" help glyph — muted via a DS token; the tooltip carries the guidance */
  .help{ display:none; flex:0 0 auto; color:var(--aha-text-tertiary,#8A8A8A) }
  :host([has-help]) .help{ display:inline-flex; align-items:center }

  .seg{ display:inline-flex; flex:0 0 auto }
  .seg-btn{ box-sizing:border-box; height:32px; padding:0 12px; display:inline-flex; align-items:center;
    justify-content:center; gap:6px; font:inherit; font-size:13px; font-weight:600; white-space:nowrap;
    cursor:pointer; color:var(--aha-text-default,#1A1A1A); background:var(--aha-bg-container,#fff);
    border:1px solid var(--aha-border-strong,#D4D4D4); border-radius:0;
    transition:background var(--aha-motion-fast,.1s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)),
      border-color var(--aha-motion-fast,.1s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)),
      color var(--aha-motion-fast,.1s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)) }
  .seg-btn aha-icon{ flex:0 0 auto; color:currentColor }
  .seg-btn:first-child{ border-top-left-radius:var(--aha-radius-default,8px); border-bottom-left-radius:var(--aha-radius-default,8px) }
  .seg-btn:last-child{ border-top-right-radius:var(--aha-radius-default,8px); border-bottom-right-radius:var(--aha-radius-default,8px) }
  .seg-btn:not(:first-child){ margin-left:-1px }
  .seg-btn:hover{ color:var(--aha-color-primary,#6A1EBB); border-color:var(--aha-border-hover,#D3B4FF) }
  /* variant=radio (default) — OUTLINE selection: brand border + brand text, WHITE/transparent fill (no tint pill) */
  .seg-btn[aria-pressed="true"]{ color:var(--aha-color-primary,#6A1EBB); border-color:var(--aha-color-primary,#6A1EBB);
    background:var(--aha-bg-container,#fff); z-index:1 }
  .seg-btn:focus-visible{ outline:2px solid var(--aha-color-primary,#6A1EBB); outline-offset:2px }

  /* variant=segmented — neutral grey segmented control (the alternative to the brand outline) */
  :host([variant="segmented"]) .seg{ padding:2px; gap:0; background:var(--aha-gray-20,#F7F7F7);
    border-radius:var(--aha-radius-default,8px) }
  :host([variant="segmented"]) .seg-btn{ border:0; margin:0; border-radius:var(--aha-radius-sm,6px);
    background:transparent; color:var(--aha-text-secondary,#4A4A4A) }
  :host([variant="segmented"]) .seg-btn:hover{ color:var(--aha-text-default,#1A1A1A);
    border-color:transparent; background:transparent }
  :host([variant="segmented"]) .seg-btn[aria-pressed="true"]{ color:var(--aha-text-default,#1A1A1A);
    background:var(--aha-bg-container,#fff); border-color:transparent;
    box-shadow:0 1px 2px color-mix(in srgb, var(--aha-gray-100,#1A1A1A) 12%, transparent) }

  .body{ margin-top:12px }
  :host([disabled]) .seg-btn{ cursor:not-allowed; color:var(--aha-text-disabled,#B5B5B5);
    background:var(--aha-bg-container-disabled,#F1F1F1); border-color:var(--aha-border-disabled,#EBEBEB) }
  :host([disabled][variant="segmented"]) .seg{ opacity:.6 }
  :host([disabled][variant="segmented"]) .seg-btn{ background:transparent; border-color:transparent }
  @media (prefers-reduced-motion: reduce){ *{ transition:none !important } }
`;

export class AhaModeField extends HTMLElement {
  static get observedAttributes() { return ['value', 'mode', 'label', 'help', 'variant', 'label-variant', 'disabled']; }

  // value is the reference name for the active option; `mode` is kept as a back-compat alias.
  get value() { return this.getAttribute('value') || this.getAttribute('mode') || ''; }
  set value(v) { v == null ? this.removeAttribute('value') : this.setAttribute('value', v); }
  get mode() { return this.value; }
  set mode(v) { this.value = v; }

  get disabled() { return this.hasAttribute('disabled'); }
  set disabled(v) { v ? this.setAttribute('disabled', '') : this.removeAttribute('disabled'); }
  get variant() { return this.getAttribute('variant') || 'radio'; }
  set variant(v) { v == null ? this.removeAttribute('variant') : this.setAttribute('variant', v); }
  get labelVariant() { return this.getAttribute('label-variant') || 'field'; }
  set labelVariant(v) { v == null ? this.removeAttribute('label-variant') : this.setAttribute('label-variant', v); }
  get help() { return this.getAttribute('help') || ''; }
  set help(v) { v == null ? this.removeAttribute('help') : this.setAttribute('help', v); }

  // options is the reference name; `modes` is kept as a back-compat alias.
  get options() { return this._options || []; }
  set options(v) { this._options = Array.isArray(v) ? v : []; this._buildSeg(); this._apply(); }
  get modes() { return this.options; }
  set modes(v) { this.options = v; }

  connectedCallback() {
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    if (!this._built) {
      this.shadowRoot.innerHTML = `<style>${STYLE}</style>` +
        `<div class="head" part="head">` +
          `<span class="labelline" part="labelline">` +
            `<span class="label" part="label"></span>` +
            `<aha-tooltip class="help" part="help" help placement="top"></aha-tooltip>` +
          `</span>` +
          `<span class="seg" part="seg" role="group"></span>` +
        `</div>` +
        `<div class="body" part="body"><slot></slot></div>`;
      this._built = true;
    }
    if (!this._options) {
      const raw = this.getAttribute('options') || this.getAttribute('modes') || '[]';
      try { this._options = JSON.parse(raw); } catch { this._options = []; }
    }
    this._buildSeg();
    this._apply();
  }
  attributeChangedCallback() { if (this._built) this._apply(); }

  _buildSeg() {
    const seg = this.shadowRoot && this.shadowRoot.querySelector('.seg');
    if (!seg) return;
    seg.textContent = '';
    for (const m of this._options || []) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'seg-btn';
      b.setAttribute('part', 'seg-btn');
      b.dataset.value = m.value;
      if (m.icon) b.innerHTML = `<aha-icon name="${esc(m.icon)}" size="16" aria-hidden="true"></aha-icon>`;
      b.appendChild(document.createTextNode(m.label ?? m.value));
      b.addEventListener('click', () => { if (!this.disabled) this._choose(m.value); });
      seg.appendChild(b);
    }
  }

  // Reflect the active value: sync each button's aria-pressed (persistent node) and toggle which
  // light-DOM body is visible. The bodies are never rebuilt, so the active one keeps its state.
  _apply() {
    const seg = this.shadowRoot && this.shadowRoot.querySelector('.seg');
    if (!seg) return;
    this.shadowRoot.querySelector('.label').textContent = this.getAttribute('label') || '';
    // help → the "?" tooltip's content; the host toggles the glyph via [has-help]
    const help = this.shadowRoot.querySelector('.help');
    const helpText = this.getAttribute('help') || '';
    if (helpText) { help.setAttribute('text', helpText); this.setAttribute('has-help', ''); }
    else { help.removeAttribute('text'); this.removeAttribute('has-help'); }
    const active = this.value;
    for (const b of seg.querySelectorAll('.seg-btn')) {
      b.setAttribute('aria-pressed', b.dataset.value === active ? 'true' : 'false');
      b.disabled = this.disabled;
    }
    for (const child of this.children) {
      const cm = child.getAttribute && child.getAttribute('data-mode');
      if (cm != null) child.hidden = cm !== active;
    }
  }

  _choose(value) {
    if (value === this.value) return;
    this.setAttribute('value', value);
    this._apply();
    // detail carries `value` (reference name) plus `mode` (back-compat alias) — same string.
    this.dispatchEvent(new CustomEvent('change', { bubbles: true, composed: true, detail: { value, mode: value } }));
  }
}

export function defineAhaModeField(tag = 'aha-mode-field') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaModeField);
  return true;
}
if (typeof window !== 'undefined') defineAhaModeField();

export default { AhaModeField, defineAhaModeField };
