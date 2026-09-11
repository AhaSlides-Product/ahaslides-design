/**
 * @ahaslides-product/design/aha-setting-row — ONE setting (label + control) in the hierarchy.
 *
 *   import '@ahaslides-product/design/aha-setting-row';   // registers <aha-setting-row>
 *   import '@ahaslides-product/design/aha-switch';        // whichever DS control the row carries
 *   <aha-setting-row label="Progress bar">
 *     <aha-switch slot="control" checked></aha-switch>
 *   </aha-setting-row>
 *   <aha-setting-row label="Leaderboard" help="Shown to the audience between slides.">
 *     <aha-switch slot="control"></aha-switch>
 *   </aha-setting-row>
 *   <!-- stack — label above, control full-width (a wide textarea / wide select) -->
 *   <aha-setting-row label="Speaker notes" layout="stack">
 *     <aha-input slot="control"></aha-input>
 *   </aha-setting-row>
 *
 * The LEAF of the settings hierarchy — a single row sitting under an <aha-section-header>. It ships
 * NO control of its own: the `control` slot carries an existing DS element (aha-switch / aha-checkbox
 * / aha-input / aha-select …) — reuse, never a re-implemented control. Inline (default): label LEFT
 * (flex:1), control RIGHT (flex:0 0 auto), space-between, gap 12. Stack: label above, control full-
 * width — for a wide control. A muted "?" help trigger sits after the label (the shared DS
 * <aha-tooltip help> — the CIRCLED question glyph from the icon library, never a hand-placed icon).
 *
 * NO decorative leading-icon slot on the label (SETTINGS-40 — functional icons live in the control).
 * ONE element, shadow-DOM CSS, themed only by --aha-* tokens → byte-identical in React and Vue. Zero
 * dependencies. The row is STATIC (no roving role, no interactive state of its own).
 */
import './aha-tooltip.js';   // registers <aha-tooltip> — the "?" help trigger (the circled question glyph)

const STYLE = `
  :host{ display:block; font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif) }
  /* inline (default) — label LEFT, control RIGHT; gap 12 matches the reference SettingRow */
  .row{ display:flex; align-items:center; justify-content:space-between; gap:12px; min-height:24px }
  /* stack — label above, control full-width (wide controls: textarea / wide select) */
  :host([layout="stack"]) .row{ flex-direction:column; align-items:stretch; gap:8px }
  /* the label column takes the free space (label-left); it drops down to a text block in stack */
  .text{ flex:1 1 auto; min-width:0; display:flex; flex-direction:column; gap:4px }
  /* label + its inline "?" help trigger sit on one line */
  .labelline{ display:inline-flex; align-items:center; gap:4px }
  /* reference SettingRow label is semibold 600 (text-sm font-semibold), text-default */
  .label{ font-size:14px; line-height:21px; font-weight:600; color:var(--aha-text-default,#1A1A1A);
    transition:color var(--aha-motion-fast,.1s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)) }
  @media (prefers-reduced-motion: reduce){ .label{ transition:none } }
  /* the "?" help glyph — muted (via a DS token); the tooltip carries the guidance. Hidden until help is set. */
  .help{ display:none; flex:0 0 auto; color:var(--aha-text-tertiary,#8A8A8A) }
  :host([has-help]) .help{ display:inline-flex; align-items:center }
  /* control-right (inline): does not grow. In stack it stretches full-width. */
  .control{ flex:0 0 auto; display:inline-flex; align-items:center }
  :host([layout="stack"]) .control{ flex:1 1 auto; align-self:stretch }
  /* disabled row — label dims to disabled-text (the control disables itself on its own element) */
  :host([disabled]) .label{ color:var(--aha-text-disabled,#B5B5B5) }
`;

export class AhaSettingRow extends HTMLElement {
  static get observedAttributes() { return ['label', 'help', 'layout', 'disabled']; }

  connectedCallback() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
      // Built ONCE; _update only toggles text/attributes on these persistent nodes (never rebuilds
      // the subtree). NO decorative leading-icon slot — the label is text + the "?" only (SETTINGS-40).
      this.shadowRoot.innerHTML =
        `<style>${STYLE}</style><div class="row" part="row">` +
          `<div class="text">` +
            `<span class="labelline">` +
              `<span class="label" part="label"></span>` +
              `<aha-tooltip class="help" part="help" help placement="top"></aha-tooltip>` +
            `</span>` +
          `</div>` +
          `<div class="control" part="control"><slot name="control"></slot></div>` +
        `</div>`;
    }
    this._update();
  }
  attributeChangedCallback() { if (this.shadowRoot) this._update(); }

  _update() {
    this.shadowRoot.querySelector('.label').textContent = this.getAttribute('label') || '';
    // help → the "?" tooltip's content; the host toggles the help glyph via [has-help]
    const help = this.getAttribute('help') || '';
    const tip = this.shadowRoot.querySelector('.help');
    if (help) { tip.setAttribute('text', help); this.setAttribute('has-help', ''); }
    else { tip.removeAttribute('text'); this.removeAttribute('has-help'); }
    if (this.hasAttribute('disabled')) this.setAttribute('aria-disabled', 'true');
    else this.removeAttribute('aria-disabled');
  }
}

export function defineAhaSettingRow(tag = 'aha-setting-row') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaSettingRow);
  return true;
}
if (typeof window !== 'undefined') defineAhaSettingRow();

export default { AhaSettingRow, defineAhaSettingRow };
