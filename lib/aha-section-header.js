/**
 * @ahaslides-product/design/aha-section-header — the settings GROUP header (hierarchy parent).
 *
 *   import '@ahaslides-product/design/aha-section-header';   // registers <aha-section-header>
 *   <aha-section-header label="Presentation"></aha-section-header>
 *   <aha-section-header label="Audience" help="Who can see and join this deck.">
 *     <aha-switch slot="action" checked></aha-switch>            <!-- a master switch / count / link -->
 *   </aha-section-header>
 *
 * The PARENT node of the settings hierarchy: a group title that a stack of <aha-setting-row>s sits
 * under. It is the group's labelled heading (role="heading" aria-level="3") — a noun phrase in
 * sentence case (e.g. "Presentation", "Audience settings"), NOT a full sentence. A muted "?" help
 * trigger sits right after the label (the shared DS <aha-tooltip help> — the CIRCLED question glyph
 * from the icon library, never a hand-placed icon), and an `action` slot pushes right (margin-left:
 * auto) to carry a master switch, a count, or a link.
 *
 * NO decorative leading-icon slot — the label is text + the "?" only (SETTINGS-40). ONE element,
 * shadow-DOM CSS, themed only by --aha-* tokens → byte-identical in React and Vue. Zero dependencies.
 * The header is STATIC (no interactive state of its own → no transition needed).
 */
import './aha-tooltip.js';   // registers <aha-tooltip> — the "?" help trigger (the circled question glyph)

const STYLE = `
  :host{ display:block; font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif) }
  /* the header is a single flex row: label + "?" on the left, the action slot pushed right */
  .row{ display:flex; align-items:center; gap:8px }
  /* the group heading — DS V3 SectionHeader label is 14/21 semibold, text-default */
  .label{ margin:0; font-family:inherit; font-size:14px; line-height:21px; font-weight:600;
    color:var(--aha-text-default,#1A1A1A) }
  .label:empty{ display:none }
  /* the "?" help glyph — muted (via a DS token); the tooltip carries the guidance. Hidden until help is set. */
  .help{ display:none; flex:0 0 auto; color:var(--aha-text-tertiary,#8A8A8A) }
  :host([has-help]) .help{ display:inline-flex; align-items:center }
  /* the action slot (master switch / count / link) is pushed to the right edge */
  .action{ margin-left:auto; display:inline-flex; align-items:center }
`;

export class AhaSectionHeader extends HTMLElement {
  static get observedAttributes() { return ['label', 'help']; }

  connectedCallback() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
      // Built ONCE; _update only toggles text/attributes on these persistent nodes (never rebuilds
      // the subtree). The label is exposed as a labelled heading (role="heading" aria-level="3").
      this.shadowRoot.innerHTML =
        `<style>${STYLE}</style><div class="row" part="row">` +
          `<h3 class="label" part="label" role="heading" aria-level="3"></h3>` +
          `<aha-tooltip class="help" part="help" help placement="top"></aha-tooltip>` +
          `<span class="action" part="action"><slot name="action"></slot></span>` +
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
  }
}

export function defineAhaSectionHeader(tag = 'aha-section-header') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaSectionHeader);
  return true;
}
if (typeof window !== 'undefined') defineAhaSectionHeader();

export default { AhaSectionHeader, defineAhaSectionHeader };
