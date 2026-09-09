/**
 * @ahaslides-product/design/aha-settings-list — the shared Settings list (composition surface).
 *
 *   import '@ahaslides-product/design/aha-settings-list';   // registers <aha-settings-list> + <aha-settings-item>
 *   <aha-settings-list label="Presentation">
 *     <aha-settings-item label="Progress bar">
 *       <aha-switch slot="control" checked></aha-switch>
 *     </aha-settings-item>
 *   </aha-settings-list>
 *
 * The most-repeated product surface — a group of settings rows. It composes existing DS controls
 * (Switch, Checkbox, Select…) via a `control` slot; it ships NO new control of its own. Layout is
 * spacing-only — no divider lines, no card/box around plain settings (settings pattern). ONE
 * element family, shadow-DOM CSS, themed only by --aha-* tokens.
 */
const LIST_STYLE = `
  :host{ display:block; font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif) }
  .group{ display:flex; flex-direction:column; gap:16px }
  .header{ font-size:14px; line-height:21px; font-weight:600; color:var(--aha-text-default,#1A1A1A); margin:0 }
  .header:empty{ display:none }
`;

const ITEM_STYLE = `
  :host{ display:block; font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif) }
  .row{ display:flex; align-items:center; justify-content:space-between; gap:16px; min-height:24px }
  .text{ display:flex; flex-direction:column; gap:4px }
  .label{ font-size:14px; line-height:21px; font-weight:400; color:var(--aha-text-default,#1A1A1A) }
  .desc{ font-size:12px; line-height:18px; font-weight:400; color:var(--aha-text-tertiary,#8A8A8A) }
  .desc:empty{ display:none }
  .control{ flex:0 0 auto; display:inline-flex; align-items:center }
`;

export class AhaSettingsList extends HTMLElement {
  static get observedAttributes() { return ['label']; }
  connectedCallback() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.innerHTML =
        `<style>${LIST_STYLE}</style><div class="group" part="group" role="group"><h3 class="header" part="header"></h3><slot></slot></div>`;
    }
    this._update();
  }
  attributeChangedCallback() { if (this.shadowRoot) this._update(); }
  _update() {
    const header = this.shadowRoot.querySelector('.header');
    header.textContent = this.getAttribute('label') || '';
    const group = this.shadowRoot.querySelector('.group');
    if (this.hasAttribute('label')) this.setAttribute('aria-label', this.getAttribute('label'));
    group.setAttribute('aria-label', this.getAttribute('label') || 'Settings');
  }
}

export class AhaSettingsItem extends HTMLElement {
  static get observedAttributes() { return ['label', 'description']; }
  connectedCallback() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.innerHTML =
        `<style>${ITEM_STYLE}</style><div class="row" part="row"><div class="text"><span class="label" part="label"></span><span class="desc" part="desc"></span></div><div class="control" part="control"><slot name="control"></slot></div></div>`;
    }
    this._update();
  }
  attributeChangedCallback() { if (this.shadowRoot) this._update(); }
  _update() {
    this.shadowRoot.querySelector('.label').textContent = this.getAttribute('label') || '';
    this.shadowRoot.querySelector('.desc').textContent = this.getAttribute('description') || '';
  }
}

export function defineAhaSettingsList(tag = 'aha-settings-list', itemTag = 'aha-settings-item') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaSettingsList);
  if (!customElements.get(itemTag)) customElements.define(itemTag, AhaSettingsItem);
  return true;
}
if (typeof window !== 'undefined') defineAhaSettingsList();

export default { AhaSettingsList, AhaSettingsItem, defineAhaSettingsList };
