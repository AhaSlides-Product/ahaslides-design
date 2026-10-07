/**
 * @ahaslides-product/design/aha-autocomplete — the shared framework-free Autocomplete (leaf).
 *
 *   import '@ahaslides-product/design/aha-autocomplete';   // registers <aha-autocomplete>
 *   <aha-autocomplete placeholder="Owner" options='["Anna","Ben","Chi"]'></aha-autocomplete>
 *   <aha-autocomplete size="large" options='[{"label":"Anna Tran","value":"u1"}]' value="u1"></aha-autocomplete>
 *
 * A text field that suggests matches from a known list as the user types (ARIA 1.2 combobox with a
 * list popup). The typed text stays a free value; picking a suggestion fills the field with its
 * label and sets `value` to the option's value. Same chrome as <aha-select> (sizes 32 / 40 / 48,
 * radius 8, brand focus border + ring, error / warning status, themed listbox popup).
 *
 * Keyboard: typing filters and opens; ArrowDown / ArrowUp open and move the active suggestion;
 * Alt+ArrowDown opens without moving; Enter picks the active suggestion; Escape closes the popup,
 * or clears the field when it is already closed; Tab closes. Home / End stay with the text caret.
 * Emits composed `input` CustomEvent<{value}> while typing and `change` CustomEvent<{value,label}>
 * when a suggestion is picked.
 */
import './icons.js';

const escapeHtml = (text) => String(text).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const MOTION = 'var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1))';
const POPUP_MOTION = 'var(--aha-motion-mid,.2s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1))';
const STYLE = `
  :host{ display:inline-flex; width:240px; max-width:100%; position:relative; font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif) }
  .wrap{ box-sizing:border-box; width:100%; display:inline-flex; align-items:center; gap:var(--aha-space-8,8px);
    height:40px; padding:0 var(--aha-space-12,12px);
    color:var(--aha-text-default,#1A1A1A); background:var(--aha-bg-container,#FFFFFF);
    border:1px solid var(--aha-border-input,#D3D7E1); border-radius:var(--aha-radius-default,8px);
    transition:border-color ${MOTION}, box-shadow ${MOTION}, background ${MOTION} }
  :host([size="small"]) .wrap, :host([size="sm"]) .wrap{ height:32px; padding:0 var(--aha-space-8,8px) }
  :host([size="large"]) .wrap, :host([size="lg"]) .wrap{ height:48px }
  .field{ box-sizing:border-box; flex:1 1 auto; min-width:0; height:100%; margin:0; padding:0;
    font-family:inherit; font-size:14px; line-height:21px; color:inherit; background:transparent; border:0; outline:none }
  :host([size="large"]) .field, :host([size="lg"]) .field{ font-size:16px }
  .field::placeholder{ color:var(--aha-text-placeholder,#999999) }
  .search{ flex:0 0 auto; display:inline-flex; color:var(--aha-text-tertiary,#8A8A8A) }
  aha-icon{ display:inline-flex; color:currentColor }

  .wrap:hover{ border-color:var(--aha-color-primary,#E70E68) }
  :host([_focused]) .wrap{ border-color:var(--aha-color-primary,#E70E68); box-shadow:0 0 0 2px var(--aha-border-focus,#E70E68) }
  :host([status="error"]) .wrap{ border-color:var(--aha-border-error,#000000) }
  :host([status="error"][_focused]) .wrap{ box-shadow:0 0 0 2px color-mix(in srgb, var(--aha-color-error,#000000) 20%, transparent) }
  :host([status="warning"]) .wrap{ border-color:var(--aha-border-warning,#000000) }
  :host([status="warning"][_focused]) .wrap{ box-shadow:0 0 0 2px color-mix(in srgb, var(--aha-color-warning,#000000) 20%, transparent) }
  :host([disabled]) .wrap{ background:var(--aha-bg-container-disabled,#F1F1F1); color:var(--aha-text-disabled,#B5B5B5);
    border-color:var(--aha-border-disabled,#EBEBEB); box-shadow:none; cursor:not-allowed }
  :host([disabled]) .field{ cursor:not-allowed }

  .listbox{ position:absolute; top:calc(100% + 6px); left:0; width:100%; z-index:30; box-sizing:border-box;
    margin:0; padding:var(--aha-space-4,4px); list-style:none; max-height:280px; overflow-y:auto; overscroll-behavior:contain;
    background:var(--aha-bg-elevated,#FFFFFF); border:1px solid var(--aha-border-secondary,#F1F1F1);
    border-radius:var(--aha-radius-default,8px); box-shadow:0 6px 20px color-mix(in srgb, var(--aha-gray-100,#1A1A1A) 10%, transparent);
    opacity:0; visibility:hidden; transform:translateY(-4px); transform-origin:top left;
    transition:opacity ${POPUP_MOTION}, transform ${POPUP_MOTION}, visibility ${POPUP_MOTION} }
  :host([open]) .listbox{ opacity:1; visibility:visible; transform:translateY(0) }
  :host([_flip]) .listbox{ top:auto; bottom:calc(100% + 6px); transform-origin:bottom left; transform:translateY(4px) }
  :host([_flip][open]) .listbox{ transform:translateY(0) }

  .option{ display:flex; align-items:center; gap:var(--aha-space-8,8px); padding:var(--aha-space-6,6px) var(--aha-space-10,10px);
    border-radius:var(--aha-radius-sm,6px); font-size:14px; line-height:21px; color:var(--aha-text-default,#1A1A1A);
    cursor:pointer; user-select:none; transition:background var(--aha-motion-fast,.1s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)) }
  :host([size="large"]) .option, :host([size="lg"]) .option{ font-size:16px }
  .option .label{ flex:1 1 auto; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap }
  .option b{ font-weight:var(--aha-weight-semibold,600) }
  .option[data-active="true"]{ background:var(--aha-bg-accent,#FEF3F7) }
  .option[aria-selected="true"] .label{ font-weight:var(--aha-weight-semibold,600) }
  .empty{ padding:var(--aha-space-6,6px) var(--aha-space-10,10px); font-size:14px; line-height:21px; color:var(--aha-text-tertiary,#8A8A8A) }

  @media (prefers-reduced-motion: reduce){ *{ transition:none !important } }
`;

const normaliseOption = (option) => (option && typeof option === 'object'
  ? { value: String(option.value ?? option.label ?? ''), label: String(option.label ?? option.value ?? '') }
  : { value: String(option), label: String(option) });

export class AhaAutocomplete extends HTMLElement {
  static get observedAttributes() { return ['value', 'placeholder', 'options', 'disabled', 'status', 'size', 'empty-text', 'aria-label']; }
  get value() { return this.getAttribute('value') ?? ''; }
  set value(text) { this.setAttribute('value', text ?? ''); }
  get disabled() { return this.hasAttribute('disabled'); }
  set disabled(flag) { flag ? this.setAttribute('disabled', '') : this.removeAttribute('disabled'); }
  get open() { return this.hasAttribute('open'); }
  get options() { return (this._options || this._parseOptions()).map(normaliseOption); }
  set options(list) { this._options = Array.isArray(list) ? list : null; if (this.open) this._filter(); this._syncFieldText(); }

  connectedCallback() {
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    this._onDocumentPointer = (event) => { if (!event.composedPath().includes(this)) this._close(); };
    if (!this._field) this._build();
    document.addEventListener('pointerdown', this._onDocumentPointer, true);
  }
  disconnectedCallback() {
    document.removeEventListener('pointerdown', this._onDocumentPointer, true);
  }
  attributeChangedCallback(name) {
    if (!this._field) return;
    if (name === 'options') { this._options = null; if (this.open) this._filter(); }
    if (name === 'value' && this._settingValueFromTyping) return;
    this._sync();
  }

  _parseOptions() {
    const raw = this.getAttribute('options');
    if (!raw) return [];
    try { const parsed = JSON.parse(raw); return Array.isArray(parsed) ? parsed : []; } catch { return []; }
  }
  _listId() { return this._id || (this._id = 'ac-' + Math.random().toString(36).slice(2, 8)); }

  _build() {
    const id = this._listId();
    this.shadowRoot.innerHTML = `<style>${STYLE}</style>` +
      `<div class="wrap" part="wrap">` +
        `<span class="search" aria-hidden="true"><aha-icon name="system-magnifying-glass" size="16"></aha-icon></span>` +
        `<input class="field" part="field" type="text" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="${id}" autocomplete="off" spellcheck="false"/>` +
      `</div>` +
      `<ul class="listbox" part="listbox" id="${id}" role="listbox"></ul>`;
    this._field = this.shadowRoot.querySelector('.field');
    this._list = this.shadowRoot.querySelector('.listbox');
    this._field.addEventListener('input', () => this._onType());
    this._field.addEventListener('keydown', (event) => this._onKey(event));
    this._field.addEventListener('focus', () => this.setAttribute('_focused', ''));
    this._field.addEventListener('blur', () => { this.removeAttribute('_focused'); this._close(); });
    this._list.addEventListener('pointerdown', (event) => event.preventDefault());
    this._list.addEventListener('click', (event) => {
      const option = event.target.closest('.option');
      if (option) this._pick(option);
    });
    this._sync();
  }

  _onType() {
    const text = this._field.value;
    this._settingValueFromTyping = true;
    this.setAttribute('value', text);
    this._settingValueFromTyping = false;
    this.dispatchEvent(new CustomEvent('input', { bubbles: true, composed: true, detail: { value: text } }));
    this._openList(false);
  }

  _filter() {
    const query = this._field.value.trim().toLowerCase();
    const matches = this.options.filter((option) => !query || option.label.toLowerCase().includes(query));
    const id = this._listId();
    if (!matches.length) {
      this._list.innerHTML = `<li class="empty" role="presentation">${escapeHtml(this.getAttribute('empty-text') || 'No matches')}</li>`;
    } else {
      this._list.innerHTML = matches.map((option, index) => {
        const label = option.label;
        const at = query ? label.toLowerCase().indexOf(query) : -1;
        const shown = at < 0 ? escapeHtml(label)
          : escapeHtml(label.slice(0, at)) + '<b>' + escapeHtml(label.slice(at, at + query.length)) + '</b>' + escapeHtml(label.slice(at + query.length));
        const selected = option.value === this.value;
        return `<li class="option" part="option" id="${id}-o${index}" role="option" aria-selected="${selected}" data-value="${escapeHtml(option.value)}" data-label="${escapeHtml(label)}"><span class="label">${shown}</span></li>`;
      }).join('');
    }
    this._setActive(null);
  }

  _openList(moveToFirst) {
    if (this.disabled) return;
    this._filter();
    const box = this.getBoundingClientRect();
    const roomBelow = window.innerHeight - box.bottom;
    if (roomBelow < 240 && box.top > roomBelow) this.setAttribute('_flip', ''); else this.removeAttribute('_flip');
    this.setAttribute('open', '');
    this._field.setAttribute('aria-expanded', 'true');
    if (moveToFirst) this._move(1);
  }
  _close() {
    if (!this.open) return;
    this.removeAttribute('open');
    this.removeAttribute('_flip');
    this._field.setAttribute('aria-expanded', 'false');
    this._setActive(null);
  }

  _setActive(option) {
    for (const active of this._list.querySelectorAll('.option[data-active="true"]')) active.removeAttribute('data-active');
    if (option) {
      option.setAttribute('data-active', 'true');
      this._field.setAttribute('aria-activedescendant', option.id);
      option.scrollIntoView({ block: 'nearest' });
    } else this._field.removeAttribute('aria-activedescendant');
  }
  _move(step) {
    const options = [...this._list.querySelectorAll('.option')];
    if (!options.length) return;
    const index = options.indexOf(this._list.querySelector('.option[data-active="true"]'));
    const next = index < 0 ? (step > 0 ? 0 : options.length - 1) : (index + step + options.length) % options.length;
    this._setActive(options[next]);
  }

  _pick(option) {
    const value = option.dataset.value;
    const label = option.dataset.label;
    this.setAttribute('value', value);
    this._field.value = label;
    this.dispatchEvent(new CustomEvent('change', { bubbles: true, composed: true, detail: { value, label } }));
    this._close();
  }

  _onKey(event) {
    if (this.disabled) return;
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (!this.open) this._openList(!event.altKey); else this._move(1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (!this.open) this._openList(false);
        this._move(-1);
        break;
      case 'Enter': {
        const active = this.open && this._list.querySelector('.option[data-active="true"]');
        if (active) { event.preventDefault(); this._pick(active); }
        break;
      }
      case 'Escape':
        event.preventDefault();
        if (this.open) this._close();
        else if (this._field.value) { this._field.value = ''; this._onType(); this._close(); }
        break;
      case 'Tab': this._close(); break;
    }
  }

  _syncFieldText() {
    if (!this._field || this._settingValueFromTyping) return;
    const match = this.options.find((option) => option.value === this.value);
    const text = match ? match.label : this.value;
    if (this._field.value !== text) this._field.value = text;
  }
  _sync() {
    if (!this._field) return;
    this._field.placeholder = this.getAttribute('placeholder') || '';
    this._field.disabled = this.disabled;
    const label = this.getAttribute('aria-label') || this.getAttribute('placeholder');
    if (label) this._field.setAttribute('aria-label', label); else this._field.removeAttribute('aria-label');
    if (this.getAttribute('status') === 'error') this._field.setAttribute('aria-invalid', 'true'); else this._field.removeAttribute('aria-invalid');
    this._field.setAttribute('aria-expanded', String(this.open));
    if (this.disabled) this._close();
    this._syncFieldText();
  }
}

export function defineAhaAutocomplete(tag = 'aha-autocomplete') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaAutocomplete);
  return true;
}
if (typeof window !== 'undefined') defineAhaAutocomplete();

export default { AhaAutocomplete, defineAhaAutocomplete };
