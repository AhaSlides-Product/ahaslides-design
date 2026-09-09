/**
 * @ahaslides-product/design/aha-tabs — the shared Tabs primitive.
 *
 *   import '@ahaslides-product/design/aha-tabs';   // registers <aha-tabs>
 *   <aha-tabs value="0">
 *     <section data-tab="Overview">…</section>
 *     <section data-tab="Activity">…</section>
 *   </aha-tabs>
 *
 * A line-style tab bar over slotted panels — each light-DOM child carries its label in `data-tab`.
 * ONE element, shadow-DOM CSS, themed only by --aha-* tokens → byte-identical in React and Vue.
 * Zero dependencies. Switching toggles a class on PERSISTENT tab nodes (no subtree rebuild), so the
 * active underline and colour animate. Emits a composed `change` CustomEvent<{value}>.
 */
const STYLE = `
  :host{ display:block; font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif) }
  .bar{ display:flex; gap:24px; border-bottom:1px solid var(--aha-border,#E3E3E3) }
  .tab{ position:relative; box-sizing:border-box; border:0; background:none; cursor:pointer;
    padding:8px 0; margin-bottom:-1px; border-bottom:2px solid transparent;
    font-family:inherit; font-size:14px; font-weight:600; color:var(--aha-text-secondary,#4A4A4A);
    transition:color var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)), border-color var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)) }
  .tab:hover{ color:var(--aha-text-default,#1A1A1A) }
  .tab.on{ color:var(--aha-color-primary,#6A1EBB); border-bottom-color:var(--aha-color-primary,#6A1EBB) }
  .tab:focus-visible{ outline:2px solid var(--aha-color-primary,#6A1EBB); outline-offset:2px; border-radius:var(--aha-radius-xs,4px) }
  .panels{ padding-top:16px; color:var(--aha-text-default,#1A1A1A); font-size:14px; line-height:21px }
  @media (prefers-reduced-motion: reduce){ *{ transition:none !important } }
`;

let tabsSeq = 0;

export class AhaTabs extends HTMLElement {
  get value() { return parseInt(this.getAttribute('value') || '0', 10) || 0; }
  set value(v) { this.setAttribute('value', String(v)); this._select(this.value, false); }

  connectedCallback() {
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    if (!this._base) this._base = `aha-tabs-${++tabsSeq}`;
    this._panels = Array.from(this.querySelectorAll('[data-tab]'));
    this._panels.forEach((p, i) => {
      p.setAttribute('role', 'tabpanel');
      if (!p.id) p.id = `${this._base}-panel-${i}`;
      p.setAttribute('aria-labelledby', `${this._base}-tab-${i}`);
      p.setAttribute('tabindex', '0');
    });
    const tabs = this._panels.map((p, i) => `<button class="tab" type="button" part="tab" role="tab" id="${this._base}-tab-${i}" aria-controls="${p.id}" data-i="${i}">${p.getAttribute('data-tab')}</button>`).join('');
    this.shadowRoot.innerHTML = `<style>${STYLE}</style><div class="bar" part="bar" role="tablist">${tabs}</div><div class="panels" part="panels"><slot></slot></div>`;
    this._tabs = Array.from(this.shadowRoot.querySelectorAll('.tab'));
    this._select(this.value, false);
    this._tabs.forEach((tab) => tab.addEventListener('click', () => {
      const i = Number(tab.dataset.i);
      this.setAttribute('value', String(i));
      this._select(i, true);
    }));
    this.shadowRoot.querySelector('.bar').addEventListener('keydown', (e) => this._onKey(e));
  }

  _onKey(e) {
    const count = this._tabs ? this._tabs.length : 0;
    if (!count) return;
    const cur = this.value;
    let next;
    switch (e.key) {
      case 'ArrowRight': case 'ArrowDown': next = (cur + 1) % count; break;
      case 'ArrowLeft': case 'ArrowUp': next = (cur - 1 + count) % count; break;
      case 'Home': next = 0; break;
      case 'End': next = count - 1; break;
      default: return;
    }
    e.preventDefault();
    this.setAttribute('value', String(next));
    this._select(next, true, true);
  }

  _select(index, emit, focus) {
    if (!this._tabs) return;
    this._tabs.forEach((t, i) => {
      const on = i === index;
      t.classList.toggle('on', on);
      t.setAttribute('aria-selected', on);
      t.tabIndex = on ? 0 : -1;
    });
    this._panels.forEach((p, i) => { p.hidden = i !== index; });
    if (focus && this._tabs[index]) this._tabs[index].focus();
    if (emit) this.dispatchEvent(new CustomEvent('change', { bubbles: true, composed: true, detail: { value: index } }));
  }
}

export function defineAhaTabs(tag = 'aha-tabs') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaTabs);
  return true;
}
if (typeof window !== 'undefined') defineAhaTabs();

export default { AhaTabs, defineAhaTabs };
