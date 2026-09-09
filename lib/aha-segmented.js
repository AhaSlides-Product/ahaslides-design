/**
 * @ahaslides-product/design/aha-segmented — the shared Segmented control.
 *
 *   import '@ahaslides-product/design/aha-segmented';   // registers <aha-segmented>
 *   <aha-segmented options="Day|Week|Month" value="Week"></aha-segmented>
 *
 * A single-choice switch between a few mutually-exclusive options, laid out inline. ONE element,
 * shadow-DOM CSS, themed only by --aha-* tokens → byte-identical in React and Vue. Zero
 * dependencies. Selection slides a PERSISTENT thumb (transform on a node that is never rebuilt),
 * so it animates. Emits a composed `change` CustomEvent<{value,index}>.
 */
const STYLE = `
  :host{ display:inline-flex }
  .track{ position:relative; display:inline-flex; box-sizing:border-box; padding:2px; gap:0;
    background:var(--aha-gray-20,#F7F7F7); border-radius:var(--aha-radius-default,8px);
    font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif) }
  .thumb{ position:absolute; top:2px; bottom:2px; left:2px; width:0;
    background:var(--aha-bg-container,#FFFFFF); border-radius:var(--aha-radius-sm,6px); box-shadow:0 1px 2px rgba(0,0,0,.12);
    transition:transform var(--aha-motion-mid,.2s) var(--aha-ease-in-out-circ,cubic-bezier(0.78,0.14,0.15,0.86)), width var(--aha-motion-mid,.2s) var(--aha-ease-in-out-circ,cubic-bezier(0.78,0.14,0.15,0.86)) }
  .seg{ position:relative; z-index:1; box-sizing:border-box; border:0; background:none; cursor:pointer;
    padding:0 16px; height:32px; min-width:0; flex:1 1 auto;
    font-family:inherit; font-size:14px; font-weight:600; color:var(--aha-text-secondary,#4A4A4A);
    border-radius:var(--aha-radius-sm,6px); outline:2px solid transparent; outline-offset:-2px;
    transition:color var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)) }
  .seg:hover{ color:var(--aha-text-default,#1A1A1A) }
  .seg.on{ color:var(--aha-text-default,#1A1A1A) }
  .seg:focus-visible{ outline-color:var(--aha-color-primary,#6A1EBB) }
  :host([disabled]){ opacity:.4 }
  :host([disabled]) .seg{ cursor:not-allowed }
  @media (prefers-reduced-motion: reduce){ *{ transition:none !important } }
`;

export class AhaSegmented extends HTMLElement {
  static get observedAttributes() { return ['value']; }
  attributeChangedCallback() { this._select(this.options.indexOf(this.value), false); }

  get options() { return (this.getAttribute('options') || '').split('|').map(s => s.trim()).filter(Boolean); }
  get value() { return this.getAttribute('value') || this.options[0] || ''; }
  set value(v) { this.setAttribute('value', String(v)); this._select(this.options.indexOf(String(v)), false); }
  get disabled() { return this.hasAttribute('disabled'); }

  connectedCallback() {
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    const opts = this.options;
    const segs = opts.map((o, i) => `<button class="seg" type="button" part="segment" role="tab" data-i="${i}">${o}</button>`).join('');
    this.shadowRoot.innerHTML = `<style>${STYLE}</style><span class="track" part="track" role="tablist"><span class="thumb" part="thumb"></span>${segs}</span>`;
    this._segs = Array.from(this.shadowRoot.querySelectorAll('.seg'));
    this._thumb = this.shadowRoot.querySelector('.thumb');
    this._select(Math.max(0, opts.indexOf(this.value)), false);
    if (this.disabled) return;
    this._segs.forEach((seg) => seg.addEventListener('click', () => {
      const i = Number(seg.dataset.i);
      this.setAttribute('value', this.options[i]);
      this._select(i, true);
    }));
    this.shadowRoot.querySelector('.track').addEventListener('keydown', (e) => this._onKey(e));
  }

  _onKey(e) {
    const count = this._segs ? this._segs.length : 0;
    if (!count) return;
    const cur = Math.max(0, this.options.indexOf(this.value));
    let next;
    switch (e.key) {
      case 'ArrowRight': case 'ArrowDown': next = (cur + 1) % count; break;
      case 'ArrowLeft': case 'ArrowUp': next = (cur - 1 + count) % count; break;
      case 'Home': next = 0; break;
      case 'End': next = count - 1; break;
      default: return;
    }
    e.preventDefault();
    this.setAttribute('value', this.options[next]);
    this._select(next, true, true);
  }

  _select(index, emit, focus) {
    if (!this._segs || index < 0) return;
    this._segs.forEach((s, i) => {
      const on = i === index;
      s.classList.toggle('on', on);
      s.setAttribute('aria-selected', on);
      s.tabIndex = on ? 0 : -1;
    });
    const seg = this._segs[index];
    if (seg) { this._thumb.style.width = seg.offsetWidth + 'px'; this._thumb.style.transform = `translateX(${seg.offsetLeft - 2}px)`; }
    if (focus && seg) seg.focus();
    if (emit) this.dispatchEvent(new CustomEvent('change', { bubbles: true, composed: true, detail: { value: this.options[index], index } }));
  }
}

export function defineAhaSegmented(tag = 'aha-segmented') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaSegmented);
  return true;
}
if (typeof window !== 'undefined') defineAhaSegmented();

export default { AhaSegmented, defineAhaSegmented };
