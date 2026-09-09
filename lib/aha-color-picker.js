/**
 * @ahaslides-product/design/aha-color-picker — the shared Colour picker.
 *
 *   import '@ahaslides-product/design/aha-color-picker';   // registers <aha-color-picker>
 *   <aha-color-picker value="#6A1EBB"></aha-color-picker>
 *
 * A trigger swatch that opens a palette of preset colours (the DS brand ramp by default; override
 * with `swatches="#hex|#hex|…"`). ONE element, shadow-DOM CSS, themed only by --aha-* tokens →
 * byte-identical in React and Vue. Zero dependencies. Open/close toggles the `open` attribute on a
 * PERSISTENT panel (never rebuilt), so it animates. Emits a composed `change` CustomEvent<{value}>.
 */
const DEFAULT_SWATCHES = ['#6A1EBB', '#FF4081', '#20E8B5', '#FF7747', '#FFE32C', '#9BB3E9', '#1A1A1A', '#FFFFFF']; // ds-lint-allow: hex (preset brand palette VALUES the picker offers — data, not component styling)
const STYLE = `
  :host{ display:inline-block; position:relative; font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif) }
  .trigger{ display:inline-flex; align-items:center; gap:8px; box-sizing:border-box; cursor:pointer;
    padding:5px 10px 5px 5px; background:var(--aha-bg-container,#FFFFFF);
    border:1px solid var(--aha-border,#E3E3E3); border-radius:var(--aha-radius-sm,6px);
    font-family:inherit; font-size:14px; color:var(--aha-text-default,#1A1A1A);
    transition:border-color var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)) }
  .trigger:hover{ border-color:var(--aha-border-hover,#D3B4FF) }
  .trigger:focus-visible{ outline:2px solid var(--aha-color-primary,#6A1EBB); outline-offset:2px }
  .current{ width:20px; height:20px; border-radius:var(--aha-radius-xs,4px); box-shadow:inset 0 0 0 1px rgba(26,26,46,.1) }
  .panel{ position:absolute; z-index:20; top:calc(100% + 8px); left:0; box-sizing:border-box; padding:10px;
    display:grid; grid-template-columns:repeat(4,1fr); gap:8px; width:168px;
    background:var(--aha-bg-elevated,#FFFFFF); border:1px solid var(--aha-border,#E3E3E3);
    border-radius:var(--aha-radius-default,8px); box-shadow:0 6px 16px rgba(26,26,46,.12);
    opacity:0; visibility:hidden; transform:translateY(-4px);
    transition:opacity var(--aha-motion-mid,.2s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)), transform var(--aha-motion-mid,.2s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)), visibility var(--aha-motion-mid,.2s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)) }
  :host([open]) .panel{ opacity:1; visibility:visible; transform:translateY(0) }
  .swatch{ width:28px; height:28px; padding:0; border:0; cursor:pointer; border-radius:var(--aha-radius-xs,4px);
    box-shadow:inset 0 0 0 1px rgba(26,26,46,.1); outline:2px solid transparent; outline-offset:2px;
    transition:transform var(--aha-motion-fast,.1s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)) }
  .swatch:hover{ transform:scale(1.1) }
  .swatch:focus-visible, .swatch.on{ outline-color:var(--aha-color-primary,#6A1EBB) }
  @media (prefers-reduced-motion: reduce){ *{ transition:none !important } }
`;

export class AhaColorPicker extends HTMLElement {
  get value() { return this.getAttribute('value') || DEFAULT_SWATCHES[0]; }
  set value(v) { this.setAttribute('value', String(v)); this._paint(); }
  get open() { return this.hasAttribute('open'); }
  set open(v) { v ? this.setAttribute('open', '') : this.removeAttribute('open'); }
  get swatches() { const s = this.getAttribute('swatches'); return s ? s.split('|').map(x => x.trim()).filter(Boolean) : DEFAULT_SWATCHES; }

  connectedCallback() {
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    const cells = this.swatches.map(c => `<button class="swatch" type="button" part="swatch" data-c="${c}" aria-label="${c}" style="background:${c}"></button>`).join('');
    this.shadowRoot.innerHTML =
      `<style>${STYLE}</style><button class="trigger" type="button" part="trigger" aria-haspopup="true"><span class="current" part="current"></span><span class="label">${this.value}</span></button><div class="panel" part="panel" role="group" aria-label="Colour swatches">${cells}</div>`;
    this._current = this.shadowRoot.querySelector('.current');
    this._label = this.shadowRoot.querySelector('.label');
    this._cells = Array.from(this.shadowRoot.querySelectorAll('.swatch'));
    this._paint();
    this.shadowRoot.querySelector('.trigger').addEventListener('click', (e) => { e.stopPropagation(); this.open = !this.open; });
    this._cells.forEach(cell => cell.addEventListener('click', () => {
      this.setAttribute('value', cell.dataset.c);
      this._paint();
      this.open = false;
      this.dispatchEvent(new CustomEvent('change', { bubbles: true, composed: true, detail: { value: cell.dataset.c } }));
    }));
    this._onDoc = (e) => { if (this.open && !this.contains(e.target)) this.open = false; };
    document.addEventListener('click', this._onDoc);
  }
  disconnectedCallback() { document.removeEventListener('click', this._onDoc); }

  _paint() {
    if (!this._current) return;
    this._current.style.background = this.value;
    this._label.textContent = this.value;
    this._cells.forEach(c => c.classList.toggle('on', c.dataset.c.toLowerCase() === this.value.toLowerCase()));
  }
}

export function defineAhaColorPicker(tag = 'aha-color-picker') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaColorPicker);
  return true;
}
if (typeof window !== 'undefined') defineAhaColorPicker();

export default { AhaColorPicker, defineAhaColorPicker };
