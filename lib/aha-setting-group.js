/**
 * @ahaslides-product/design/aha-setting-group — the settings GROUP container that bakes in the scale.
 *
 *   import '@ahaslides-product/design/aha-setting-group';   // registers <aha-setting-group>
 *   <aha-setting-group label="Presentation">
 *     …setting rows…
 *   </aha-setting-group>
 *   <aha-setting-group label="Audience" help="How people join and answer.">…</aha-setting-group>
 *
 * The POINT is automatic spacing — the settings-panel SPACING scale, encoded so gaps come out right
 * on their own. It renders NO divider line and NO card/tinted box (spacing only, white bg):
 *   • the rows inside a group sit 16px apart (the between-settings step),
 *   • stacked groups sit 32px apart (`:host(:not(:first-child))` — no wiring needed),
 *   • a danger-zone group (`tone="danger"`) sits 48px down (overrides the 32),
 *   • an optional `label` renders a semibold group header (14/21, weight 600) with an optional
 *     `?` help trigger (the composed DS <aha-tooltip help> — NOT a hand-placed icon) and an
 *     `action` slot pushed to the right.
 *
 * a11y: role="group" + aria-label from `label`, so AT announces the group. Header + rows are
 * persistent nodes; _update only toggles text/attributes, never rebuilds the subtree. ONE element,
 * shadow-DOM CSS, themed only by --aha-* tokens → byte-identical in React and Vue. Zero deps.
 */
import './aha-tooltip.js';   // registers <aha-tooltip> — the composed "?" help trigger after the header label

const STYLE = `
  :host{ display:block; font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif); background:var(--aha-bg-container,#fff) }
  /* between GROUPS: 32px — applied automatically so stacked groups just work (spacing, no divider) */
  :host(:not(:first-child)){ margin-top:32px }
  /* danger zone sits further down: 48px (overrides the 32); the danger CTA styling lives on the button */
  :host([tone="danger"]){ margin-top:48px }

  /* group header — semibold label, optional "?" help, action slot pushed right */
  .header{ display:flex; align-items:center; gap:4px; margin:0 }
  .header[hidden]{ display:none }
  .label{ font-size:14px; line-height:21px; font-weight:600; color:var(--aha-text-default,#1A1A1A) }
  .help{ display:inline-flex; align-items:center; color:var(--aha-text-tertiary,#8A8A8A) }
  .help[hidden]{ display:none }
  /* the action slot is right-aligned in the header */
  .action{ margin-left:auto; display:inline-flex; align-items:center }

  /* rows — 16px between sibling settings (the settings scale); ~12px header→rows */
  .rows{ display:flex; flex-direction:column; gap:16px }
  .header:not([hidden]) + .rows{ margin-top:12px }
`;

export class AhaSettingGroup extends HTMLElement {
  static get observedAttributes() { return ['label', 'help', 'tone']; }

  connectedCallback() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
      // All nodes persistent — _update only toggles text/attributes, never innerHTML= on state change.
      this.shadowRoot.innerHTML =
        `<style>${STYLE}</style>` +
        `<div class="header" part="header" hidden>` +
          `<span class="label" part="label"></span>` +
          `<aha-tooltip class="help" part="help" help placement="top" hidden></aha-tooltip>` +
          `<span class="action" part="action"><slot name="action"></slot></span>` +
        `</div>` +
        `<div class="rows" part="rows"><slot></slot></div>`;
    }
    this.setAttribute('role', 'group');
    this._update();
  }
  attributeChangedCallback() { if (this.shadowRoot) this._update(); }

  _update() {
    const label = this.getAttribute('label') || '';
    const help = this.getAttribute('help') || '';
    const header = this.shadowRoot.querySelector('.header');
    this.shadowRoot.querySelector('.label').textContent = label;
    header.hidden = !label;
    const helpEl = this.shadowRoot.querySelector('.help');
    if (help) { helpEl.setAttribute('text', help); helpEl.hidden = false; }
    else { helpEl.removeAttribute('text'); helpEl.hidden = true; }
    // role="group" announces via aria-label from the label
    if (label) this.setAttribute('aria-label', label);
    else this.removeAttribute('aria-label');
  }
}

export function defineAhaSettingGroup(tag = 'aha-setting-group') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaSettingGroup);
  return true;
}
if (typeof window !== 'undefined') defineAhaSettingGroup();

export default { AhaSettingGroup, defineAhaSettingGroup };
