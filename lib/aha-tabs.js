/**
 * @ahaslides-product/design/aha-tabs — the shared Tabs primitive.
 *
 *   import '@ahaslides-product/design/aha-tabs';   // registers <aha-tabs>
 *   <aha-tabs value="0">
 *     <section data-tab="Overview" data-icon="system-info">…</section>
 *     <section data-tab="Activity">…</section>
 *   </aha-tabs>
 *
 * A tab bar over sibling content panels. The DS V3 Tabs is a FAMILY, not one look:
 *   type="line"    the default underline bar — a 2px color-primary rule under the active tab
 *   type="primary" the emphasised underline — Bold 700 active label + color-primary underline
 *   type="card"    a filled segment — the active tab sits in a bg-accent pill (radius-sm), no rule
 * and two sizes: `default` and `small` (a shorter, tighter bar). Each tab can carry a leading icon
 * (summoned by name from the DS icon library via <aha-icon> — never an inline glyph) and be disabled.
 *
 * TWO ways to feed it:
 *   • Slotted panels — each light-DOM child carries `data-tab` (label), optional `data-icon`
 *     (icon name) and `data-disabled`; the element shows/hides the matching panel.
 *   • `items` JSON — [{key?,label,icon?,disabled?}] for a label-only bar (no panels), e.g. a
 *     filter strip. `value` then indexes the items.
 *
 * ONE element, shadow-DOM CSS, themed only by --aha-* tokens → byte-identical in React and Vue.
 * Zero dependencies. Switching toggles a class on PERSISTENT tab nodes (no subtree rebuild), so the
 * active underline / pill and colour animate. Emits a composed `change` CustomEvent<{value}>.
 */
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const STYLE = `
  :host{ display:block; font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif) }
  .bar{ display:flex; gap:24px; border-bottom:1px solid var(--aha-border,#E3E3E3) }

  .tab{ position:relative; box-sizing:border-box; border:0; background:none; cursor:pointer;
    display:inline-flex; align-items:center; gap:8px;
    padding:8px 0; margin-bottom:-1px; border-bottom:2px solid transparent;
    font-family:inherit; font-size:14px; line-height:21px; font-weight:600; color:var(--aha-text-secondary,#4A4A4A);
    transition:color var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)),
      background var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)),
      border-color var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)) }
  .tab aha-icon{ flex:0 0 auto; color:currentColor }
  .tab:not([disabled]):hover{ color:var(--aha-text-default,#1A1A1A) }
  .tab.on{ color:var(--aha-color-primary,#6A1EBB); border-bottom-color:var(--aha-color-primary,#6A1EBB) }
  .tab[disabled]{ color:var(--aha-text-disabled,#B5B5B5); cursor:not-allowed }
  .tab:focus-visible{ outline:2px solid var(--aha-border-focus,#D3B4FF); outline-offset:2px; border-radius:var(--aha-radius-xs,4px) }

  /* small size — a tighter, shorter bar */
  :host([size="small"]) .bar{ gap:16px }
  :host([size="small"]) .tab{ font-size:13px; padding:6px 0 }

  /* type=primary — Bold 700 active label, same color-primary underline */
  :host([type="primary"]) .tab.on{ font-weight:700 }

  /* type=card — filled segment: active sits in a bg-accent pill (radius-sm), no underline rule */
  :host([type="card"]) .bar{ gap:8px; border-bottom:0 }
  :host([type="card"]) .tab{ padding:8px 12px; margin-bottom:0; border-bottom:0;
    border-radius:var(--aha-radius-sm,6px) }
  :host([type="card"]) .tab:not([disabled]):not(.on):hover{ background:var(--aha-bg-hover,#F7F7F7); color:var(--aha-text-default,#1A1A1A) }
  :host([type="card"]) .tab.on{ background:var(--aha-bg-accent,#F9F5FF); color:var(--aha-color-primary,#6A1EBB); border-bottom-color:transparent }
  :host([type="card"][size="small"]) .tab{ padding:6px 10px }

  .panels{ padding-top:16px; color:var(--aha-text-default,#1A1A1A); font-size:14px; line-height:21px }
  @media (prefers-reduced-motion: reduce){ *{ transition:none !important } }
`;

let tabsSeq = 0;

export class AhaTabs extends HTMLElement {
  static get observedAttributes() { return ['value', 'items', 'type', 'size']; }
  attributeChangedCallback(name) {
    if (!this.shadowRoot) return;
    if (name === 'value') this._select(this.value, false);
    else this._render();   // items/type/size change → full rebuild (not a per-state toggle, so no dead transition)
  }

  get value() { return parseInt(this.getAttribute('value') || '0', 10) || 0; }
  set value(v) { this.setAttribute('value', String(v)); this._select(this.value, false); }

  connectedCallback() {
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    if (!this._base) this._base = `aha-tabs-${++tabsSeq}`;
    this._render();
  }

  _items() {
    if (this.hasAttribute('items')) { try { return JSON.parse(this.getAttribute('items') || '[]'); } catch { return []; } }
    return null;   // panel mode
  }

  _render() {
    const json = this._items();
    // Build the tab descriptor list from JSON items or slotted [data-tab] panels.
    let descriptors;
    if (json) {
      this._panels = [];
      descriptors = json.map((it) => ({ label: it.label != null ? it.label : String(it.key || ''), icon: it.icon, disabled: !!it.disabled }));
    } else {
      this._panels = Array.from(this.querySelectorAll('[data-tab]'));
      this._panels.forEach((p, i) => {
        p.setAttribute('role', 'tabpanel');
        if (!p.id) p.id = `${this._base}-panel-${i}`;
        p.setAttribute('aria-labelledby', `${this._base}-tab-${i}`);
        p.setAttribute('tabindex', '0');
      });
      descriptors = this._panels.map((p) => ({ label: p.getAttribute('data-tab') || '', icon: p.getAttribute('data-icon'), disabled: p.hasAttribute('data-disabled') }));
    }

    const tabs = descriptors.map((d, i) => {
      const icon = d.icon ? `<aha-icon name="${esc(d.icon)}" size="16" aria-hidden="true"></aha-icon>` : '';
      const controls = this._panels[i] ? ` aria-controls="${this._panels[i].id}"` : '';
      return `<button class="tab" type="button" part="tab" role="tab" id="${this._base}-tab-${i}"${controls} data-i="${i}"${d.disabled ? ' disabled aria-disabled="true"' : ''}>${icon}<span class="label">${esc(d.label)}</span></button>`;
    }).join('');

    this.shadowRoot.innerHTML = `<style>${STYLE}</style><div class="bar" part="bar" role="tablist">${tabs}</div>` +
      (json ? '' : `<div class="panels" part="panels"><slot></slot></div>`);
    this._tabs = Array.from(this.shadowRoot.querySelectorAll('.tab'));
    this._select(this.value, false);
    this._tabs.forEach((tab) => tab.addEventListener('click', () => {
      if (tab.hasAttribute('disabled')) return;
      const i = Number(tab.dataset.i);
      this.setAttribute('value', String(i));
      this._select(i, true);
    }));
    this.shadowRoot.querySelector('.bar').addEventListener('keydown', (e) => this._onKey(e));
  }

  _onKey(e) {
    const count = this._tabs ? this._tabs.length : 0;
    if (!count) return;
    let next = this.value;
    switch (e.key) {
      case 'ArrowRight': case 'ArrowDown': next = this._step(this.value, 1); break;
      case 'ArrowLeft': case 'ArrowUp': next = this._step(this.value, -1); break;
      case 'Home': next = this._step(-1, 1); break;
      case 'End': next = this._step(count, -1); break;
      default: return;
    }
    e.preventDefault();
    this.setAttribute('value', String(next));
    this._select(next, true, true);
  }

  // Step over disabled tabs so roving nav never lands on one.
  _step(from, delta) {
    const count = this._tabs.length;
    let i = from;
    for (let n = 0; n < count; n++) {
      i = (i + delta + count) % count;
      if (!this._tabs[i].hasAttribute('disabled')) return i;
    }
    return from < 0 || from >= count ? 0 : from;
  }

  _select(index, emit, focus) {
    if (!this._tabs) return;
    this._tabs.forEach((t, i) => {
      const on = i === index;
      t.classList.toggle('on', on);
      t.setAttribute('aria-selected', String(on));
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
