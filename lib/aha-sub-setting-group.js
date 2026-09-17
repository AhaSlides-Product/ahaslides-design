/**
 * @ahaslides-product/design/aha-sub-setting-group — the dependent (child) settings wrapper.
 *
 *   import '@ahaslides-product/design/aha-sub-setting-group';   // registers <aha-sub-setting-group>
 *   <aha-setting-group label="Timer">
 *     <!-- the parent toggle -->
 *     …parent row…
 *     <!-- its dependent settings — the author adds `hidden` when the parent is off -->
 *     <aha-sub-setting-group>
 *       …dependent rows…
 *     </aha-sub-setting-group>
 *   </aha-setting-group>
 *
 * When one setting turns on a cluster of dependent sub-settings, this gives them the nesting
 * treatment — spacing only, NO left border and NO card. The primary nesting signal is the INDENT
 * plus a tight gap that binds the child to its parent:
 *   • margin-top:8px  — 8px above (tighter than the 16 between siblings → reads as "belongs to"),
 *   • padding-left:24px — a 24px indent,
 *   • the nested content is subtly de-emphasised (a `--nested` context flag), never boxed.
 *
 * The host owns visibility — the author adds `hidden` when the parent is off; the component just does
 * the nesting. a11y: role="group". ONE element, shadow-DOM CSS, themed only by --aha-* tokens →
 * byte-identical in React and Vue. Zero dependencies.
 */
const STYLE = `
  :host{ display:block; font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif);
    color:var(--aha-text-default,#1A1A1A);
    /* 8px above binds tighter than the 16 between siblings; 24px indent is the nesting signal */
    margin-top:8px; padding-left:24px;
    /* subtly de-emphasise the nested context (the indent + tight gap are the primary signal) */
    --nested:1 }
  /* the host toggles visibility — author adds the hidden attribute when the parent is off */
  :host([hidden]){ display:none }
  /* dependent rows stack on the same 16px settings scale, no divider/box */
  .rows{ display:flex; flex-direction:column; gap:16px }
`;

export class AhaSubSettingGroup extends HTMLElement {
  connectedCallback() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.innerHTML = `<style>${STYLE}</style><div class="rows" part="rows"><slot></slot></div>`;
    }
    this.setAttribute('role', 'group');
  }
}

export function defineAhaSubSettingGroup(tag = 'aha-sub-setting-group') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaSubSettingGroup);
  return true;
}
if (typeof window !== 'undefined') defineAhaSubSettingGroup();

export default { AhaSubSettingGroup, defineAhaSubSettingGroup };
