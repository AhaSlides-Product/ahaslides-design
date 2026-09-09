/**
 * @ahaslides-product/design/aha-uploader — the shared Uploader primitive.
 *
 *   import '@ahaslides-product/design/aha-uploader';   // registers <aha-uploader>
 *   <aha-uploader accept="image/*" multiple></aha-uploader>
 *
 * A click-or-drag drop zone for selecting files. ONE element, shadow-DOM CSS, themed only by
 * --aha-* tokens → byte-identical in React and Vue. Zero dependencies. Hover and drag-over toggle
 * a class on the PERSISTENT zone (no subtree rebuild), so the border and tint animate. Emits a
 * composed `change` CustomEvent<{files}>.
 */
const STYLE = `
  :host{ display:block; font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif) }
  .zone{ box-sizing:border-box; display:flex; flex-direction:column; align-items:center; gap:8px;
    padding:24px 16px; text-align:center; cursor:pointer;
    background:var(--aha-bg-container,#FFFFFF); border:1px dashed var(--aha-border-strong,#D4D4D4);
    border-radius:var(--aha-radius-default,8px); color:var(--aha-text-tertiary,#8A8A8A); font-size:14px; line-height:21px;
    transition:border-color var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)), background var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)) }
  .zone:hover, .zone.dragover{ border-color:var(--aha-color-primary,#6A1EBB); background:var(--aha-bg-accent,#F9F5FF) }
  .zone svg{ width:28px; height:28px; fill:var(--aha-color-primary,#6A1EBB) }
  .zone b{ color:var(--aha-color-primary,#6A1EBB); font-weight:600 }
  :host([disabled]) .zone{ cursor:not-allowed; opacity:.5 }
  input{ display:none }
  @media (prefers-reduced-motion: reduce){ *{ transition:none !important } }
`;
const UPLOAD = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l4.5 4.5-1.4 1.4L13 6.83V15h-2V6.83L8.9 8.9 7.5 7.5 12 3zM5 17h14v2H5z"/></svg>'; // ds-lint-allow: svg (upload-affordance arrow — drop-zone chrome, not a catalogue icon)

export class AhaUploader extends HTMLElement {
  get multiple() { return this.hasAttribute('multiple'); }
  get accept() { return this.getAttribute('accept') || ''; }
  get disabled() { return this.hasAttribute('disabled'); }

  connectedCallback() {
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML =
      `<style>${STYLE}</style><div class="zone" part="zone" role="button" tabindex="0">${UPLOAD}<div><b>Click to upload</b> or drag files here</div></div><input type="file"${this.multiple ? ' multiple' : ''}${this.accept ? ` accept="${this.accept}"` : ''}/>`;
    const zone = this.shadowRoot.querySelector('.zone');
    const input = this.shadowRoot.querySelector('input');
    const open = () => { if (!this.disabled) input.click(); };
    zone.addEventListener('click', open);
    zone.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
    input.addEventListener('change', () => this._emit(input.files));
    ['dragenter', 'dragover'].forEach(ev => zone.addEventListener(ev, (e) => { e.preventDefault(); if (!this.disabled) zone.classList.add('dragover'); }));
    ['dragleave', 'drop'].forEach(ev => zone.addEventListener(ev, () => zone.classList.remove('dragover')));
    zone.addEventListener('drop', (e) => { e.preventDefault(); if (!this.disabled && e.dataTransfer) this._emit(e.dataTransfer.files); });
  }

  _emit(fileList) {
    const files = Array.from(fileList || []);
    if (files.length) this.dispatchEvent(new CustomEvent('change', { bubbles: true, composed: true, detail: { files } }));
  }
}

export function defineAhaUploader(tag = 'aha-uploader') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaUploader);
  return true;
}
if (typeof window !== 'undefined') defineAhaUploader();

export default { AhaUploader, defineAhaUploader };
