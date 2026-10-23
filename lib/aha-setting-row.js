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
 *   <!-- stack — label above, every field in the slot full-width -->
 *   <aha-setting-row label="Speaker notes" layout="stack">
 *     <aha-input slot="control"></aha-input>
 *   </aha-setting-row>
 *
 * The LEAF of the settings hierarchy — a single row sitting under an <aha-section-header>. It ships
 * NO control of its own: the `control` slot carries an existing DS element (aha-switch / aha-checkbox
 * / aha-input / aha-select …) — reuse, never a re-implemented control. Inline (default): label LEFT
 * (flex:1), control RIGHT (flex:0 0 auto), space-between, gap 12. Stack: label above, and every
 * DS field in the control slot fills the row's width — also when the field sits inside a wrapper
 * (a field + helper-text block), because the row sets --aha-field-width for its whole subtree.
 * A muted "?" help trigger sits after the label (the shared DS
 * <aha-tooltip help> — the CIRCLED question glyph from the icon library, never a hand-placed icon).
 *
 *   <!-- plan-gated: label, the shared <aha-paywall> crown where the "?" sat, the control disabled -->
 *   <aha-setting-row label="Custom branding" locked plan="pro" feature-key="custom_branding"
 *                    upgrade-body="Add your logo and colours to every deck.">
 *     <aha-switch slot="control"></aha-switch>
 *   </aha-setting-row>
 *
 * NO decorative leading-icon slot on the label (SETTINGS-40 — functional icons live in the control).
 * ONE element, shadow-DOM CSS, themed only by --aha-* tokens → byte-identical in React and Vue. Zero
 * dependencies. The row is STATIC (no roving role, no interactive state of its own).
 */
import './aha-tooltip.js';   // registers <aha-tooltip> — the "?" help trigger (the circled question glyph)
import './aha-paywall.js';   // registers <aha-paywall> — the crown upgrade mark of a locked row

const STYLE = `
  :host{ display:block; font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif) }
  /* inline (default) — label LEFT, control RIGHT; gap 12 matches the reference SettingRow */
  .row{ display:flex; align-items:center; justify-content:space-between; gap:12px; min-height:24px }
  /* stack — label above, every field in the control slot full-width */
  :host([layout="stack"]) .row{ flex-direction:column; align-items:stretch; gap:8px }
  /* the label column takes the free space (label-left); it drops down to a text block in stack */
  .text{ flex:1 1 auto; min-width:0; display:flex; flex-direction:column; gap:4px }
  /* label + its inline "?" help trigger sit on one line */
  .labelline{ display:inline-flex; align-items:center; gap:4px }
  .label{ font-size:14px; line-height:21px; font-weight:400; letter-spacing:var(--aha-letter-spacing-paragraph,0.2px); color:var(--aha-setting-label-color,var(--aha-text-default,#1A1A1A));
    transition:color var(--aha-motion-fast,.1s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)) }
  @media (prefers-reduced-motion: reduce){ .label{ transition:none } }
  /* the "?" help glyph — muted (via a DS token); the tooltip carries the guidance. Hidden until help is set. */
  .help{ display:none; flex:0 0 auto; color:var(--aha-text-tertiary,#8A8A8A) }
  :host([has-help]) .help{ display:inline-flex; align-items:center }
  /* locked (plan-gated) — the Paywall crown takes the "?" place, the "?" is hidden, the label keeps its colour */
  .lock{ display:none; flex:0 0 auto; align-items:center }
  :host([locked]) .lock{ display:inline-flex }
  :host([locked]) .help{ display:none }
  /* control-right (inline): does not grow. In stack it stretches full-width. */
  .control{ flex:0 0 auto; display:inline-flex; align-items:center; --aha-field-width:initial }
  /* --aha-field-width inherits through the flat tree, so a field wrapped in its own element still fills the row */
  :host([layout="stack"]) .control{ flex:1 1 auto; align-self:stretch; min-width:0; --aha-field-width:100% }
  :host([layout="stack"]) ::slotted(*){ flex:1 1 auto; width:100%; min-width:0; box-sizing:border-box }
  /* disabled row — label dims to disabled-text (the control disables itself on its own element) */
  :host([disabled]) .label{ color:var(--aha-text-disabled,#B5B5B5) }
`;

export class AhaSettingRow extends HTMLElement {
  static get observedAttributes() { return ['label', 'help', 'layout', 'disabled', 'locked', 'plan', 'feature-key', 'upgrade-body']; }

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
              `<aha-tooltip class="help" part="help" help placement="bottom-start"></aha-tooltip>` +
              `<aha-paywall class="lock" part="lock" placement="bottom"></aha-paywall>` +
            `</span>` +
          `</div>` +
          `<div class="control" part="control"><slot name="control"></slot></div>` +
        `</div>`;
      const help = this.shadowRoot.querySelector('.help');
      help.addEventListener('pointerenter', () => fitHelpBubble(help));
      help.addEventListener('focusin', () => fitHelpBubble(help));
      this.shadowRoot.querySelector('slot').addEventListener('slotchange', () => this._syncLockedControls());
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
    const locked = this.hasAttribute('locked');
    const lock = this.shadowRoot.querySelector('.lock');
    lock.setAttribute('required-plan', this.getAttribute('plan') === 'essential' ? 'essential' : 'pro');
    lock.setAttribute('feature-label', this.getAttribute('label') || '');
    const featureKey = this.getAttribute('feature-key');
    if (featureKey) lock.setAttribute('feature-key', featureKey); else lock.removeAttribute('feature-key');
    const upgradeBody = this.getAttribute('upgrade-body');
    if (upgradeBody) lock.setAttribute('body', upgradeBody); else lock.removeAttribute('body');
    this._syncLockedControls();
    if (this.hasAttribute('disabled') || locked) this.setAttribute('aria-disabled', 'true');
    else this.removeAttribute('aria-disabled');
  }

  _syncLockedControls() {
    const controls = this.shadowRoot.querySelector('slot').assignedElements({ flatten: true });
    this._disabledByLock ??= new Set();
    if (this.hasAttribute('locked')) {
      for (const control of controls) {
        if (control.hasAttribute('disabled')) continue;
        control.setAttribute('disabled', '');
        this._disabledByLock.add(control);
      }
    } else {
      for (const control of this._disabledByLock) control.removeAttribute('disabled');
      this._disabledByLock.clear();
    }
  }
}

const HELP_VIEWPORT_MARGIN = 8;
const HELP_MIN_WIDTH = 120;

function fitHelpBubble(help) {
  const trigger = help.getBoundingClientRect();
  const viewportWidth = document.documentElement.clientWidth;
  const roomToEnd = viewportWidth - HELP_VIEWPORT_MARGIN - trigger.left;
  const roomToStart = trigger.right - HELP_VIEWPORT_MARGIN;
  const alignStart = roomToEnd >= roomToStart;
  const room = Math.max(HELP_MIN_WIDTH, alignStart ? roomToEnd : roomToStart);
  help.setAttribute('placement', alignStart ? 'bottom-start' : 'bottom-end');
  help.style.setProperty('--aha-tooltip-max-width', Math.min(280, room) + 'px');
}

export function defineAhaSettingRow(tag = 'aha-setting-row') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaSettingRow);
  return true;
}
if (typeof window !== 'undefined') defineAhaSettingRow();

export default { AhaSettingRow, defineAhaSettingRow };
