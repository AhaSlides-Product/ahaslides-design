/**
 * @ahaslides-product/design/aha-mode-field — a labelled field whose input swaps with an inline mode.
 *
 *   import '@ahaslides-product/design/aha-mode-field';   // registers <aha-mode-field>
 *   <aha-mode-field label="Results" mode="auto">
 *     <div data-mode="auto">…the automatic body…</div>
 *     <div data-mode="manual">…the manual body…</div>
 *   </aha-mode-field>
 *   el.modes = [{ value:'auto', label:'Automatic' }, { value:'manual', label:'Manual' }];
 *
 * The settings field where a single control has two-or-more exclusive MODES (an automatic/manual
 * switch, a value-source switch): a label with an inline segmented mode control, and a body that swaps
 * IN PLACE as the mode changes. The bodies are the element's own light-DOM children (persistent nodes)
 * tagged `data-mode="…"`; switching mode only toggles their `hidden`, never rebuilds them — the active
 * body keeps its state and the mode buttons' transition fires. The segmented buttons are a group of
 * aria-pressed buttons (honest exclusive selection without faking a roving radiogroup). Shadow-DOM CSS,
 * themed only by --aha-* tokens. Emits composed `change` CustomEvent<{mode}>.
 */
const STYLE = `
  :host{ display:block; font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif) }
  .head{ display:flex; align-items:center; justify-content:space-between; gap:16px; min-height:32px }
  .label{ font-size:14px; line-height:21px; color:var(--aha-text-default,#1A1A1A) }
  .seg{ display:inline-flex; flex:0 0 auto }
  .seg-btn{ box-sizing:border-box; height:32px; padding:0 12px; font:inherit; font-size:13px; font-weight:600;
    cursor:pointer; color:var(--aha-text-default,#1A1A1A); background:var(--aha-bg-container,#fff);
    border:1px solid var(--aha-border-strong,#D4D4D4); border-radius:0;
    transition:background var(--aha-motion-fast,.1s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)),
      border-color var(--aha-motion-fast,.1s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)),
      color var(--aha-motion-fast,.1s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)) }
  .seg-btn:first-child{ border-top-left-radius:var(--aha-radius-default,8px); border-bottom-left-radius:var(--aha-radius-default,8px) }
  .seg-btn:last-child{ border-top-right-radius:var(--aha-radius-default,8px); border-bottom-right-radius:var(--aha-radius-default,8px) }
  .seg-btn:not(:first-child){ margin-left:-1px }
  .seg-btn:hover{ color:var(--aha-color-primary,#6A1EBB); border-color:var(--aha-border-hover,#D3B4FF) }
  .seg-btn[aria-pressed="true"]{ color:var(--aha-color-primary,#6A1EBB); border-color:var(--aha-color-primary,#6A1EBB);
    background:var(--aha-bg-accent,#F9F5FF); z-index:1 }
  .seg-btn:focus-visible{ outline:2px solid var(--aha-color-primary,#6A1EBB); outline-offset:2px }
  .body{ margin-top:8px }
  :host([disabled]) .seg-btn{ cursor:not-allowed; color:var(--aha-text-disabled,#B5B5B5);
    background:var(--aha-bg-container-disabled,#F1F1F1); border-color:var(--aha-border-disabled,#EBEBEB) }
  @media (prefers-reduced-motion: reduce){ *{ transition:none !important } }
`;

export class AhaModeField extends HTMLElement {
  static get observedAttributes() { return ['mode', 'label', 'disabled']; }
  get mode() { return this.getAttribute('mode') || ''; }
  set mode(v) { v == null ? this.removeAttribute('mode') : this.setAttribute('mode', v); }
  get disabled() { return this.hasAttribute('disabled'); }
  set disabled(v) { v ? this.setAttribute('disabled', '') : this.removeAttribute('disabled'); }
  get modes() { return this._modes || []; }
  set modes(v) { this._modes = Array.isArray(v) ? v : []; this._buildSeg(); this._apply(); }

  connectedCallback() {
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    if (!this._built) {
      this.shadowRoot.innerHTML = `<style>${STYLE}</style>` +
        `<div class="head" part="head"><span class="label" part="label"></span>` +
        `<span class="seg" part="seg" role="group"></span></div>` +
        `<div class="body" part="body"><slot></slot></div>`;
      this._built = true;
    }
    if (!this._modes) { try { this._modes = JSON.parse(this.getAttribute('modes') || '[]'); } catch { this._modes = []; } }
    this._buildSeg();
    this._apply();
  }
  attributeChangedCallback() { if (this._built) this._apply(); }

  _buildSeg() {
    const seg = this.shadowRoot && this.shadowRoot.querySelector('.seg');
    if (!seg) return;
    seg.textContent = '';
    for (const m of this._modes || []) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'seg-btn';
      b.setAttribute('part', 'seg-btn');
      b.dataset.value = m.value;
      b.textContent = m.label ?? m.value;
      b.addEventListener('click', () => { if (!this.disabled) this._choose(m.value); });
      seg.appendChild(b);
    }
  }

  // Reflect the active mode: sync each button's aria-pressed (persistent node) and toggle which
  // light-DOM body is visible. The bodies are never rebuilt, so the active one keeps its state.
  _apply() {
    const seg = this.shadowRoot && this.shadowRoot.querySelector('.seg');
    if (!seg) return;
    this.shadowRoot.querySelector('.label').textContent = this.getAttribute('label') || '';
    for (const b of seg.querySelectorAll('.seg-btn')) {
      b.setAttribute('aria-pressed', b.dataset.value === this.mode ? 'true' : 'false');
      b.disabled = this.disabled;
    }
    for (const child of this.children) {
      const cm = child.getAttribute && child.getAttribute('data-mode');
      if (cm != null) child.hidden = cm !== this.mode;
    }
  }

  _choose(value) {
    if (value === this.mode) return;
    this.setAttribute('mode', value);
    this._apply();
    this.dispatchEvent(new CustomEvent('change', { bubbles: true, composed: true, detail: { mode: value } }));
  }
}

export function defineAhaModeField(tag = 'aha-mode-field') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaModeField);
  return true;
}
if (typeof window !== 'undefined') defineAhaModeField();

export default { AhaModeField, defineAhaModeField };
