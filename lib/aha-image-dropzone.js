/**
 * @ahaslides-product/design/aha-image-dropzone — the standalone MAIN image field.
 *
 *   import '@ahaslides-product/design/aha-image-dropzone';   // registers <aha-image-dropzone>
 *   <aha-image-dropzone state="empty" label="Add background image"></aha-image-dropzone>
 *   <aha-image-dropzone state="filled" fit="cover" src="…"></aha-image-dropzone>
 *
 * `fit` picks how the filled image sits in the box — `contain` (default, whole image, letterboxed) or
 * `cover` (fill the box, cropped).
 *
 * The full-width settings image field where the image IS the field — a background/hero image, an
 * interactive-image base, a picture reveal (SETTINGS-44). NOT the per-option ImageActionButton. Three
 * states: empty (a full-width dashed upload card, 8px corners), loading (a spinner at the SAME height
 * as the empty card so the panel does not jump), and filled (the image fitted in a display box with a
 * Change / Edit / Delete overlay on hover). It OWNS no modals — it EMITS intents (`add` / `change` /
 * `edit` / `delete`) and the host runs the upload/crop/confirm flow. Glyphs are summoned by name via
 * <aha-icon>. Shadow-DOM CSS, themed only by --aha-* tokens.
 */
import './icons.js';   // registers <aha-icon> for the add / edit / delete glyphs

const STYLE = `
  :host{ display:block; font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif) }
  .zone{ box-sizing:border-box; position:relative; width:100%; min-height:132px;
    display:flex; align-items:center; justify-content:center; gap:8px; flex-direction:column;
    padding:16px; text-align:center; overflow:hidden;
    border:1px dashed var(--aha-border,#E3E3E3); border-radius:var(--aha-radius-default,8px);
    background:var(--aha-bg-container,#fff); color:var(--aha-text-tertiary,#8A8A8A);
    transition:border-color var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)),
      color var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)) }
  .add{ appearance:none; all:unset; box-sizing:border-box; position:absolute; inset:0;
    display:flex; align-items:center; justify-content:center; gap:8px; flex-direction:column; cursor:pointer }
  .add aha-icon{ color:var(--aha-icon-muted,#8A8A8A) }
  .hint{ font-size:14px; line-height:21px }
  .zone:hover{ border-color:var(--aha-border-hover,#D3B4FF); color:var(--aha-color-primary,#6A1EBB) }
  .zone:hover .add aha-icon{ color:var(--aha-color-primary,#6A1EBB) }
  .add:focus-visible{ outline:2px solid var(--aha-color-primary,#6A1EBB); outline-offset:2px }

  .spinner{ width:22px; height:22px; border-radius:var(--aha-radius-pill,999px);
    border:2px solid var(--aha-border,#E3E3E3); border-top-color:var(--aha-color-primary,#6A1EBB);
    animation:aha-idz-spin var(--aha-motion-slow,.3s) linear infinite; display:none }
  @keyframes aha-idz-spin{ to{ transform:rotate(360deg) } }

  .thumb{ position:absolute; inset:0; width:100%; height:100%; object-fit:contain; background:var(--aha-bg-container-secondary,#F7F7F7); display:none }
  :host([fit="cover"]) .thumb{ object-fit:cover }
  .overlay{ position:absolute; inset:0; display:flex; align-items:center; justify-content:center; gap:8px;
    background:var(--aha-bg-overlay,rgba(26,26,46,.7)); opacity:0; pointer-events:none;
    transition:opacity var(--aha-motion-fast,.1s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)) }
  .oa{ display:inline-flex; align-items:center; gap:6px; padding:6px 10px; border:0; cursor:pointer;
    font:inherit; font-size:13px; font-weight:600; color:var(--aha-text-default,#1A1A1A);
    background:var(--aha-bg-elevated,#fff); border-radius:var(--aha-radius-sm,6px) }
  .oa.danger{ color:var(--aha-color-error,#F5222D) }
  .oa aha-icon{ color:currentColor }

  /* state machine — the dashed card, spinner and filled image swap without changing the box height */
  :host([state="empty"]) .zone{ cursor:pointer }
  :host([state="loading"]) .spinner{ display:block }
  :host([state="loading"]) .add, :host([state="filled"]) .add{ display:none }
  :host([state="filled"]) .zone{ border-style:solid; padding:0 }
  :host([state="filled"]) .thumb{ display:block }
  :host([state="filled"]) .zone:hover .overlay, :host([state="filled"]) .zone:focus-within .overlay{ opacity:1; pointer-events:auto }

  :host([disabled]) .zone{ cursor:not-allowed; background:var(--aha-bg-container-disabled,#F1F1F1); border-color:var(--aha-border-disabled,#EBEBEB) }
  @media (prefers-reduced-motion: reduce){ *,*::before{ transition:none !important; animation:none !important } }
`;

export class AhaImageDropzone extends HTMLElement {
  static get observedAttributes() { return ['state', 'src', 'label', 'hint', 'disabled', 'fit']; }
  get state() { return this.getAttribute('state') || 'empty'; }
  set state(v) { this.setAttribute('state', v); }

  connectedCallback() {
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    if (!this._built) {
      this.shadowRoot.innerHTML = `<style>${STYLE}</style>` +
        `<div class="zone" part="zone">` +
          `<button class="add" part="add" type="button">` +
            `<aha-icon name="system-image-square" size="28" aria-hidden="true"></aha-icon>` +
            `<span class="hint" part="hint"></span></button>` +
          `<span class="spinner" part="spinner" role="status" aria-label="Uploading"></span>` +
          `<img class="thumb" part="thumb" alt="" />` +
          `<span class="overlay" part="overlay">` +
            `<button class="oa oa-change" type="button"><aha-icon name="system-image-square" size="16" aria-hidden="true"></aha-icon>Change</button>` +
            `<button class="oa oa-edit" type="button"><aha-icon name="system-pencil-simple" size="16" aria-hidden="true"></aha-icon>Edit</button>` +
            `<button class="oa oa-delete danger" type="button"><aha-icon name="system-trash" size="16" aria-hidden="true"></aha-icon>Delete</button>` +
          `</span>` +
        `</div>`;
      this._built = true;
      this.shadowRoot.querySelector('.add').addEventListener('click', () => { if (!this.hasAttribute('disabled')) this._intent('add'); });
      this.shadowRoot.querySelector('.oa-change').addEventListener('click', () => this._intent('change'));
      this.shadowRoot.querySelector('.oa-edit').addEventListener('click', () => this._intent('edit'));
      this.shadowRoot.querySelector('.oa-delete').addEventListener('click', () => this._intent('delete'));
    }
    this._sync();
  }
  attributeChangedCallback() { if (this._built) this._sync(); }

  _sync() {
    this.shadowRoot.querySelector('.hint').textContent = this.getAttribute('label') || 'Add image';
    const img = this.shadowRoot.querySelector('.thumb');
    const src = this.getAttribute('src');
    if (src) img.src = src; else img.removeAttribute('src');
    this.shadowRoot.querySelector('.add').disabled = this.hasAttribute('disabled');
  }
  _intent(name) { this.dispatchEvent(new CustomEvent(name, { bubbles: true, composed: true })); }
}

export function defineAhaImageDropzone(tag = 'aha-image-dropzone') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaImageDropzone);
  return true;
}
if (typeof window !== 'undefined') defineAhaImageDropzone();

export default { AhaImageDropzone, defineAhaImageDropzone };
