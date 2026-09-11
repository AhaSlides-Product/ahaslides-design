/**
 * @ahaslides-product/design/aha-settings-list — the shared, schema-driven Settings surface.
 *
 *   import '@ahaslides-product/design/aha-settings-list';   // registers <aha-settings-list> + <aha-settings-item>
 *   import '@ahaslides-product/design/aha-switch';          // whichever DS controls the schema references
 *
 *   // 1) Schema-driven — pass a settings schema; it renders the rows and REUSES DS controls:
 *   const el = document.querySelector('aha-settings-list');
 *   el.schema = {
 *     sections: [
 *       { label: 'Presentation', rows: [
 *         { key: 'progressBar', label: 'Progress bar', control: { type: 'switch', checked: true } },
 *         // `description` → a "?" help tooltip after the label (NOT a standing line).
 *         { key: 'leaderboard', label: 'Leaderboard', description: 'Shown to the audience between slides.',
 *           control: { type: 'switch' } },
 *         { key: 'title', label: 'Deck title', control: { type: 'input', value: 'Untitled' } },
 *         // `layout:'stack'` → label above, control full-width (for wide controls).
 *         { key: 'notes', label: 'Speaker notes', layout: 'stack', control: { type: 'input' } },
 *         // rare `consequence` → an always-visible must-see line under the label.
 *         { key: 'reset', label: 'Reset scores', consequence: 'This cannot be undone.',
 *           control: { type: 'switch' } },
 *         { key: 'theme', label: 'Slide theme', control: { type: 'select', value: 'light',
 *           options: [{ label: 'Light', value: 'light' }, { label: 'Dark', value: 'dark' }] } },
 *         { key: 'timer', label: 'Question timer', disabled: true,   // dimmed, control disabled
 *           control: { type: 'switch' } },
 *         { key: 'brand', label: 'Custom branding',                  // visible-but-locked (crown → Paywall)
 *           locked: true, plan: 'pro', feature: 'Custom branding' },
 *       ] },
 *     ],
 *   };
 *   el.addEventListener('change', e => console.log(e.detail)); // { key, value, name }
 *   // Density — <aha-settings-list density="compact"> tightens the row/group rhythm.
 *
 *   // 2) Slot form — compose the controls by hand (unchanged, still supported):
 *   <aha-settings-list label="Presentation">
 *     <aha-settings-item label="Progress bar"><aha-switch slot="control" checked></aha-switch></aha-settings-item>
 *   </aha-settings-list>
 *
 * The most-repeated product surface — a group of settings rows. It ships NO new control of its own:
 * each row's `control` names an existing DS element (aha-switch / aha-checkbox / aha-input …), which
 * it instantiates and reuses — never a re-implemented control. Layout is spacing-only — no divider
 * lines, no card/box around plain settings (settings pattern). ONE element family, shadow-DOM CSS,
 * themed only by --aha-* tokens.
 */
import './aha-tooltip.js';   // registers <aha-tooltip> — the "?" help trigger after a row label (settings help pattern)

const LIST_STYLE = `
  :host{ display:block; font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif) }
  .surface{ display:flex; flex-direction:column; gap:32px }
  .group{ display:flex; flex-direction:column; gap:16px }
  /* compact density — tightens the between-group + between-sibling rhythm (spacing scale, not lines) */
  :host([density="compact"]) .surface{ gap:16px }
  :host([density="compact"]) .group{ gap:8px }
  .header{ font-size:14px; line-height:21px; font-weight:600; color:var(--aha-text-default,#1A1A1A); margin:0 }
  .header:empty{ display:none }
`;

const ITEM_STYLE = `
  :host{ display:block; font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif) }
  /* inline (default) — label LEFT, control RIGHT (SettingRow); gap 12 matches the reference */
  .row{ display:flex; align-items:center; justify-content:space-between; gap:12px; min-height:24px }
  /* stack — label above, control full-width (wide controls: textarea / wide select) */
  :host([layout="stack"]) .row{ flex-direction:column; align-items:stretch; gap:8px }
  :host([layout="stack"]) .control{ align-self:stretch }
  .text{ display:flex; flex-direction:column; gap:4px }
  /* label + its inline "?" help trigger sit on one line */
  .labelline{ display:inline-flex; align-items:center; gap:4px }
  /* reference SettingRow label is semibold 600 (text-sm font-semibold) */
  .label{ font-size:14px; line-height:21px; font-weight:600; color:var(--aha-text-default,#1A1A1A);
    transition:color var(--aha-motion-fast,.1s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)) }
  /* the "?" help glyph — muted (~50%) via a DS token; the tooltip carries the guidance */
  .help{ display:none; flex:0 0 auto; color:var(--aha-text-tertiary,#8A8A8A) }
  :host([has-help]) .help{ display:inline-flex; align-items:center }
  /* RARE opt-in must-see-consequence line — a standing line, off by default */
  .consequence{ font-size:12px; line-height:18px; font-weight:400; color:var(--aha-text-tertiary,#8A8A8A) }
  .consequence:empty{ display:none }
  .control{ flex:0 0 auto; display:inline-flex; align-items:center }
  :host([layout="stack"]) .control{ flex:1 1 auto }
  /* disabled row — label dims to disabled-text; the control is disabled on its own element too */
  :host([disabled]) .label{ color:var(--aha-text-disabled,#B5B5B5) }
`;

// Turn a row's `control` spec into a real DS control element. The spec names an existing DS
// component by its short type (`switch` → <aha-switch>, `input` → <aha-input>, …); every other
// field becomes an attribute. This is reuse, not re-implementation — no control is built here.
function makeControl(control) {
  if (!control) return null;
  const spec = typeof control === 'string' ? { type: control } : control;
  const type = spec.type || 'switch';
  const tag = type.startsWith('aha-') ? type : 'aha-' + type;
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(spec)) {
    if (k === 'type' || k === 'text') continue;
    if (v === true) el.setAttribute(k, '');
    else if (v === false || v == null) continue;
    // arrays/objects (e.g. a select's `options`) serialise to a JSON attribute the control parses
    else if (typeof v === 'object') el.setAttribute(k, JSON.stringify(v));
    else el.setAttribute(k, String(v));
  }
  if (spec.text != null) el.textContent = spec.text;   // slotted label for e.g. <aha-checkbox>text</aha-checkbox>
  el.setAttribute('slot', 'control');
  return el;
}

// A plan-gated row stays VISIBLE but locked (settings pattern): the control slot carries the shared
// <aha-paywall>, which renders its own crown badge and opens the compliant upsell popover. Reuse of
// the DS Paywall — never a hand-rolled lock glyph.
function makeLock(row) {
  const el = document.createElement('aha-paywall');
  el.setAttribute('required-plan', row.plan || 'pro');
  el.setAttribute('feature-label', row.feature || row.label || '');
  el.setAttribute('slot', 'control');
  return el;
}

export class AhaSettingsList extends HTMLElement {
  static get observedAttributes() { return ['label', 'schema', 'density']; }

  get schema() { return this._schema; }
  set schema(v) { this._schema = v; this._build(); }

  connectedCallback() { this._build(); }
  attributeChangedCallback() { this._build(); }

  // Property wins over the `schema` attribute (JSON, for the build-free HTML form).
  _resolveSchema() {
    if (this._schema != null) return this._schema;
    const attr = this.getAttribute('schema');
    if (!attr) return null;
    try { return JSON.parse(attr); } catch { return null; }
  }

  _build() {
    if (!this.isConnected) return;
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    const schema = this._resolveSchema();
    if (schema) this._renderSchema(schema);
    else this._renderSlot();
  }

  _renderSlot() {
    this.shadowRoot.innerHTML =
      `<style>${LIST_STYLE}</style><div class="group" part="group" role="group"><h3 class="header" part="header"></h3><slot></slot></div>`;
    const label = this.getAttribute('label') || '';
    this.shadowRoot.querySelector('.header').textContent = label;
    if (label) this.setAttribute('aria-label', label);
    this.shadowRoot.querySelector('.group').setAttribute('aria-label', label || 'Settings');
  }

  _renderSchema(schema) {
    const sections = Array.isArray(schema)
      ? [{ label: this.getAttribute('label') || '', rows: schema }]
      : Array.isArray(schema.sections)
        ? schema.sections
        : [{ label: schema.label ?? this.getAttribute('label') ?? '', description: schema.description, rows: schema.rows || [] }];

    this.shadowRoot.innerHTML = `<style>${LIST_STYLE}</style><div class="surface" part="surface"></div>`;
    const surface = this.shadowRoot.querySelector('.surface');

    for (const section of sections) {
      const group = document.createElement('section');
      group.className = 'group';
      group.setAttribute('part', 'group');
      group.setAttribute('role', 'group');
      const label = section.label || '';
      if (label) group.setAttribute('aria-label', label);
      group.innerHTML = `<h3 class="header" part="header"></h3>`;
      group.querySelector('.header').textContent = label;

      for (const row of (section.rows || [])) {
        const item = document.createElement('aha-settings-item');
        if (row.label != null) item.setAttribute('label', row.label);
        // `description` → the "?" tooltip content (guidance now lives in the help tooltip, not a standing line)
        if (row.description != null) item.setAttribute('description', row.description);
        // rare opt-in must-see line — a standing consequence line under the label
        if (row.consequence != null) item.setAttribute('consequence', row.consequence);
        if (row.layout != null) item.setAttribute('layout', row.layout);
        if (row.disabled) item.setAttribute('disabled', '');
        item.__key = row.key ?? row.label;
        // A locked row shows the Paywall crown; a disabled row disables its own control.
        let control;
        if (row.locked) control = makeLock(row);
        else {
          control = makeControl(row.control);
          if (control && row.disabled) control.setAttribute('disabled', '');
        }
        if (control) item.appendChild(control);
        group.appendChild(item);
      }
      surface.appendChild(group);
    }

    // Relay a control's change up as one settings-level event keyed to its row.
    const relay = (e) => {
      const item = (e.composedPath() || []).find(n => n && n.tagName === 'AHA-SETTINGS-ITEM');
      if (!item || item.__key == null) return;
      const d = e.detail || {};
      const value = 'checked' in d ? d.checked : ('value' in d ? d.value : undefined);
      if (value === undefined) return;
      this.dispatchEvent(new CustomEvent('change', {
        bubbles: true, composed: true,
        detail: { key: item.__key, value, name: item.getAttribute('label') || undefined },
      }));
    };
    surface.addEventListener('change', relay);
    surface.addEventListener('input', relay);
  }
}

export class AhaSettingsItem extends HTMLElement {
  static get observedAttributes() { return ['label', 'description', 'consequence', 'layout', 'disabled']; }
  connectedCallback() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
      // Guidance lives in a "?" help tooltip after the label (DS <aha-tooltip help>), NOT a standing
      // description line. The optional `.consequence` line is the rare must-see exception. All nodes
      // are persistent — _update only toggles attributes/text, never rebuilds the subtree.
      this.shadowRoot.innerHTML =
        `<style>${ITEM_STYLE}</style><div class="row" part="row">` +
          `<div class="text">` +
            `<span class="labelline">` +
              `<span class="label" part="label"></span>` +
              `<aha-tooltip class="help" part="help" help placement="top"></aha-tooltip>` +
            `</span>` +
            `<span class="consequence" part="consequence"></span>` +
          `</div>` +
          `<div class="control" part="control"><slot name="control"></slot></div>` +
        `</div>`;
    }
    this._update();
  }
  attributeChangedCallback() { if (this.shadowRoot) this._update(); }
  _update() {
    this.shadowRoot.querySelector('.label').textContent = this.getAttribute('label') || '';
    // description → the "?" tooltip's content; the host toggles the help glyph via [has-help]
    const desc = this.getAttribute('description') || '';
    const help = this.shadowRoot.querySelector('.help');
    if (desc) { help.setAttribute('text', desc); this.setAttribute('has-help', ''); }
    else { help.removeAttribute('text'); this.removeAttribute('has-help'); }
    this.shadowRoot.querySelector('.consequence').textContent = this.getAttribute('consequence') || '';
    if (this.hasAttribute('disabled')) this.setAttribute('aria-disabled', 'true');
    else this.removeAttribute('aria-disabled');
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
