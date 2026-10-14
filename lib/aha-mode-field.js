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
 * Two inline-control looks via `variant`, each composed from the DS component that owns it:
 *   `radio` (default) — the DS radio group: <aha-radio variant="button"> pills in a role="radiogroup"
 *                       (regular 14/21, 32 high, padding 0 16; hover = brand text; selected = brand
 *                       border + brand text on white), with the radio's own roving arrow-key contract.
 *   `segmented`       — the DS <aha-segmented> (grey track + white sliding thumb).
 * `labelVariant`: `field` (default, regular weight) or `section` (semibold 600 — a section header for
 * when the body is a grouped list). `help` renders the settings-label "?" tooltip after the label
 * (DS <aha-tooltip help> → <aha-icon name="system-question-mark">).
 *
 * The inner control's own `change` is stopped at the mode field, which emits one composed `change`
 * CustomEvent<{value}>. Shadow-DOM CSS, themed only by --aha-* tokens.
 */
import './aha-tooltip.js';   // registers <aha-tooltip> — the "?" help trigger after the label (settings help pattern)
import './aha-radio.js';
import './aha-segmented.js';
import './icons.js';

let groupCount = 0;

const STYLE = `
  :host{ display:block; font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif) }
  /* head — label LEFT, mode control RIGHT; wraps the control below the label on narrow */
  .head{ display:flex; align-items:center; justify-content:space-between; gap:12px;
    flex-wrap:wrap; row-gap:8px; min-height:32px }
  .labelline{ display:inline-flex; align-items:center; gap:4px; min-width:0 }
  .label{ font-size:14px; line-height:21px; font-weight:400; color:var(--aha-setting-label-color,var(--aha-text-default,#1A1A1A)) }
  /* section label = a semibold header (matches a grouped-list section title) */
  :host([label-variant="section"]) .label{ font-weight:600 }
  /* the "?" help glyph — muted via a DS token; the tooltip carries the guidance */
  .help{ display:none; flex:0 0 auto; color:var(--aha-text-tertiary,#8A8A8A) }
  :host([has-help]) .help{ display:inline-flex; align-items:center }

  .seg{ display:inline-flex; flex:0 0 auto }
  .seg aha-icon{ flex:0 0 auto; margin-right:6px; vertical-align:-3px }

  /* the active option's body reads as help text — de-emphasised (secondary colour, regular weight,
     a touch smaller) so the label above it stays the primary line of the field */
  .body{ margin-top:12px; font-size:13px; line-height:20px; font-weight:400;
    color:var(--aha-text-secondary,#4A4A4A) }
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
            `<aha-tooltip class="help" part="help" help placement="bottom-start"></aha-tooltip>` +
          `</span>` +
          `<span class="seg" part="seg"></span>` +
        `</div>` +
        `<div class="body" part="body"><slot></slot></div>`;
      this.shadowRoot.querySelector('.seg').addEventListener('change', (e) => {
        e.stopPropagation();
        if (!this.disabled && e.detail && e.detail.value != null) this._choose(String(e.detail.value));
      });
      this._built = true;
    }
    if (!this._options) {
      const raw = this.getAttribute('options') || this.getAttribute('modes') || '[]';
      try { this._options = JSON.parse(raw); } catch { this._options = []; }
    }
    this._buildSeg();
    this._apply();
  }
  attributeChangedCallback(name, previous, next) {
    if (!this._built) return;
    if (name === 'variant' && previous !== next) this._buildSeg();
    this._apply();
  }

  _buildSeg() {
    const seg = this.shadowRoot && this.shadowRoot.querySelector('.seg');
    if (!seg) return;
    seg.textContent = '';
    const options = this._options || [];
    if (this.variant === 'segmented') {
      seg.setAttribute('role', 'group');
      const control = document.createElement('aha-segmented');
      control.setAttribute('part', 'segmented');
      control.setAttribute('options', JSON.stringify(options.map((m) => ({ value: m.value, label: m.label ?? m.value, icon: m.icon }))));
      seg.appendChild(control);
      return;
    }
    seg.setAttribute('role', 'radiogroup');
    this._groupName = this._groupName || `aha-mode-field-${++groupCount}`;
    for (const m of options) {
      const radio = document.createElement('aha-radio');
      radio.setAttribute('variant', 'button');
      radio.setAttribute('part', 'seg-btn');
      radio.setAttribute('name', this._groupName);
      radio.setAttribute('value', m.value);
      if (m.icon) {
        const icon = document.createElement('aha-icon');
        icon.setAttribute('name', m.icon);
        icon.setAttribute('size', '16');
        icon.setAttribute('aria-hidden', 'true');
        radio.appendChild(icon);
      }
      radio.appendChild(document.createTextNode(m.label ?? m.value));
      seg.appendChild(radio);
    }
  }

  // The bodies are never rebuilt, only hidden, so the inactive one keeps its state.
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
    const label = this.getAttribute('label');
    if (label) seg.setAttribute('aria-label', label); else seg.removeAttribute('aria-label');
    for (const radio of seg.querySelectorAll('aha-radio')) {
      radio.checked = radio.value === active;
      radio.disabled = this.disabled;
    }
    const segmented = seg.querySelector('aha-segmented');
    if (segmented) {
      if (active && segmented.getAttribute('value') !== active) segmented.setAttribute('value', active);
      segmented.toggleAttribute('disabled', this.disabled);
    }
    for (const child of this.children) {
      const cm = child.getAttribute && child.getAttribute('data-mode');
      if (cm == null) continue;
      const on = cm === active;
      child.hidden = !on;
      // DATA-SAFETY: a hidden mode's body stays in the DOM (persistent, keeps state) but its form
      // controls are disabled while hidden, so an inactive mode can never leak a value into saved
      // config. Only re-enable the controls WE disabled (marked data-mf-off) when the mode goes live.
      const controls = child.querySelectorAll ? child.querySelectorAll('input,select,textarea,button') : [];
      for (const c of controls) {
        if (on) {
          if (c.hasAttribute('data-mf-off')) { c.removeAttribute('data-mf-off'); c.disabled = false; }
        } else if (!c.disabled) {
          c.disabled = true; c.setAttribute('data-mf-off', '');
        }
      }
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
