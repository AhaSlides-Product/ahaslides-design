/**
 * @ahaslides-product/design/aha-audience-image-upload — the audience "attach a photo" control.
 *
 *   import '@ahaslides-product/design/aha-audience-image-upload';   // registers <aha-audience-image-upload>
 *   <aha-audience-image-upload id="photo"></aha-audience-image-upload>
 *   photo.uploadImage = xprops.uploadImage;                 // the HOST picks, crops and hosts the file
 *   photo.addEventListener('change', (e) => e.detail.value);   // { url, path } or null
 *
 * A slide never uploads a file itself: no <input type="file">, no FileReader, no FormData. The host's
 * `uploadImage()` opens its own picker and resolves `{ url, path }`; this control is the guarded slice
 * around that call. No host uploader → the control is disabled; a second tap mid-flight is ignored; a
 * rejected or url-less result says so on screen (role="alert") and emits `error`, never a dead
 * button. Persist `path` if the image must outlive the session (the url is signed and expires).
 * `variant="area"` (default) is the dashed card for when the image IS the field; `variant="button"`
 * is the compact form for a row that already has content: a full-width white-filled button with the upload
 * glyph, its edge and label in the deck accent (`<aha-button variant="secondary-deck">`). The dashed area is a 2px
 * ink-20% dash on the deep panel; its ink and buttons follow the deck, so every state reads on a dark deck.
 * Every string is an attribute, so the caller passes its translations. Gate rendering on the slide's
 * image-submission setting: this control does not read slide props.
 */
import './aha-button.js';
import './icons.js';
import { AudienceElement, DECK_STYLE } from './audience-deck.js';

const LABELS = {
  'add-label': 'Upload an image', hint: 'PNG, JPG, GIF, WebP', 'change-label': 'Change', 'remove-label': 'Delete',
  'uploading-label': 'Uploading…', 'failed-label': "Couldn't upload that image. Try again.", 'preview-label': 'Attached image',
};

const STYLE = DECK_STYLE + `
  :host{ display:flex; flex-direction:column; gap:var(--aha-space-8, 8px); width:100% }
  aha-button{ font-family:inherit }
  aha-button:not(.pick-compact){
    --aha-button-default-bg:transparent; --aha-button-default-text:var(--_ink); --aha-button-default-border:var(--_edge);
    --aha-button-default-bg-hover:var(--_surface-hover); --aha-button-default-border-hover:var(--_edge-hover);
    --aha-button-elevate-secondary:none; --aha-color-primary:var(--_ink) }
  [hidden]{ display:none !important }
  .drop{ box-sizing:border-box; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:var(--aha-space-4, 4px);
    min-height:136px; padding:var(--aha-space-20, 20px) var(--aha-space-12, 12px); text-align:center; color:var(--_ink); cursor:pointer;
    border:2px dashed var(--_control-edge); border-radius:var(--aha-radius-default, 8px);
    background:var(--_surface-deep); -webkit-backdrop-filter:var(--_frost); backdrop-filter:var(--_frost);
    transition:background var(--aha-motion-mid, .2s) var(--aha-ease-in-out, cubic-bezier(0.645,0.045,0.355,1)), border-color var(--aha-motion-mid, .2s) var(--aha-ease-in-out, cubic-bezier(0.645,0.045,0.355,1)) }
  .drop:focus-visible{ outline:2px solid var(--_ink); outline-offset:2px }
  .drop[aria-disabled="true"]{ cursor:default; opacity:.6 }
  .drop aha-icon{ margin-bottom:var(--aha-space-4, 4px); color:var(--_ink-muted) }
  .prompt{ font-size:16px; line-height:24px; font-weight:600 }
  .hint{ font-size:14px; line-height:20px; color:var(--_ink-muted) }
  .frame{ box-sizing:border-box; display:flex; align-items:center; justify-content:center; overflow:hidden; color:var(--_ink);
    border:1px solid var(--_edge); border-radius:var(--aha-radius-default, 8px);
    background:var(--_surface); -webkit-backdrop-filter:var(--_frost); backdrop-filter:var(--_frost) }
  .frame.large img{ display:block; height:203px; max-width:100%; object-fit:contain }
  .frame.compact{ justify-content:flex-start; gap:var(--aha-space-8, 8px); padding:var(--aha-space-8, 8px) }
  .frame.compact img{ flex:0 0 auto; width:48px; height:48px; object-fit:cover; border-radius:var(--aha-radius-default, 8px) }
  .frame.compact aha-button{ flex:1 1 0; min-width:0 }
  .actions{ display:flex; gap:var(--aha-space-8, 8px) }
  .actions aha-button{ flex:1 1 0; min-width:0 }
  .error{ margin:0; font-size:16px; line-height:24px; font-weight:600; color:var(--aha-color-error, #F5222D) }
  @media (prefers-reduced-motion: reduce){ .drop{ transition:none } }
`;

const TEMPLATE = `<style>${STYLE}</style>
  <div class="drop" part="drop" role="button" tabindex="0">
    <aha-icon name="system-image-square" size="32" decorative></aha-icon>
    <span class="prompt" dir="auto"></span><span class="hint" dir="auto"></span>
  </div>
  <aha-button class="pick-compact" variant="secondary-deck" size="touch"><aha-icon slot="icon" name="system-upload-simple" size="16" decorative></aha-icon><span class="pick-text"></span></aha-button>
  <div class="frame large" part="preview"><img alt=""></div>
  <div class="frame compact" part="preview-compact"><img alt="">
    <aha-button class="change" variant="secondary" size="touch"></aha-button>
    <aha-button class="remove" variant="secondary" size="touch"></aha-button>
  </div>
  <div class="actions">
    <aha-button class="change" variant="secondary" size="touch"></aha-button>
    <aha-button class="remove" variant="secondary" size="touch"></aha-button>
  </div>
  <p class="error" part="error" role="alert" dir="auto"></p>`;

export class AhaAudienceImageUpload extends AudienceElement {
  static get observedAttributes() { return [...AudienceElement.deckAttributes, 'variant', 'disabled', 'src', ...Object.keys(LABELS)]; }
  constructor() {
    super();
    this.shadowRoot.append(document.createRange().createContextualFragment(TEMPLATE));
    this._uploadImage = null;
    this._value = null;
    this._busy = false;
    this._failed = false;
    const root = this.shadowRoot;
    const drop = root.querySelector('.drop');
    drop.addEventListener('click', () => this._pick());
    drop.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); this._pick(); }
    });
    root.querySelector('.pick-compact').addEventListener('click', () => this._pick());
    for (const button of root.querySelectorAll('.change')) button.addEventListener('click', () => this._pick());
    for (const button of root.querySelectorAll('.remove')) button.addEventListener('click', () => this._remove());
  }
  connectedCallback() { super.connectedCallback(); this._sync(); }
  attributeChangedCallback(name, previous, next) {
    super.attributeChangedCallback(name, previous, next);
    if (name === 'src') this._value = next ? { url: next } : null;
    this._sync();
  }

  /** The host's uploader, `xprops.uploadImage`: () => Promise<{ url, path? }>. */
  get uploadImage() { return this._uploadImage; }
  set uploadImage(fn) { this._uploadImage = typeof fn === 'function' ? fn : null; this._sync(); }
  /** The attached image, `{ url, path }`, or null. */
  get value() { return this._value; }
  set value(next) { this._value = next && next.url ? { url: next.url, path: next.path } : null; this._sync(); }

  _label(name) { return this.getAttribute(name) || LABELS[name]; }
  _interactive() { return !!this._uploadImage && !this.hasAttribute('disabled') && !this._busy; }
  async _pick() {
    if (!this._interactive()) return;
    this._failed = false;
    this._busy = true;
    this._sync();
    try {
      const result = await this._uploadImage();
      if (!result || !result.url) throw new Error('uploadImage resolved without a url');
      this._value = { url: result.url, path: result.path };
      this.dispatchEvent(new CustomEvent('change', { bubbles: true, composed: true, detail: { value: this._value } }));
    } catch (error) {
      this._failed = true;
      this.dispatchEvent(new CustomEvent('error', { bubbles: true, composed: true, detail: { error } }));
    } finally {
      this._busy = false;
      this._sync();
    }
  }
  _remove() {
    if (this.hasAttribute('disabled') || this._busy) return;
    this._failed = false;
    this._value = null;
    this._sync();
    this.dispatchEvent(new CustomEvent('change', { bubbles: true, composed: true, detail: { value: null } }));
  }
  _sync() {
    const root = this.shadowRoot;
    const compact = this.getAttribute('variant') === 'button';
    const attached = !!this._value;
    const interactive = this._interactive();
    const pickLabel = this._busy ? this._label('uploading-label') : this._label('add-label');
    const drop = root.querySelector('.drop');
    drop.hidden = attached || compact;
    drop.tabIndex = interactive ? 0 : -1;
    drop.setAttribute('aria-disabled', String(!interactive));
    drop.setAttribute('aria-busy', String(this._busy));
    root.querySelector('.prompt').textContent = pickLabel;
    root.querySelector('.hint').textContent = this._label('hint');
    const pickCompact = root.querySelector('.pick-compact');
    pickCompact.hidden = attached || !compact;
    pickCompact.querySelector('.pick-text').textContent = pickLabel;
    pickCompact.toggleAttribute('disabled', !interactive && !this._busy);
    pickCompact.toggleAttribute('loading', this._busy);
    root.querySelector('.frame.large').hidden = !attached || compact;
    root.querySelector('.actions').hidden = !attached || compact;
    root.querySelector('.frame.compact').hidden = !attached || !compact;
    for (const img of root.querySelectorAll('.frame img')) {
      if (attached && img.getAttribute('src') !== this._value.url) img.setAttribute('src', this._value.url);
      img.setAttribute('alt', this._label('preview-label'));
    }
    for (const button of root.querySelectorAll('.change')) {
      button.textContent = this._busy ? this._label('uploading-label') : this._label('change-label');
      button.toggleAttribute('disabled', !interactive && !this._busy);
      button.toggleAttribute('loading', this._busy);
    }
    for (const button of root.querySelectorAll('.remove')) {
      button.textContent = this._label('remove-label');
      button.toggleAttribute('disabled', this.hasAttribute('disabled') || this._busy);
    }
    const error = root.querySelector('.error');
    error.hidden = !this._failed;
    error.textContent = this._failed ? this._label('failed-label') : '';
  }
}

export function defineAhaAudienceImageUpload(tag = 'aha-audience-image-upload') {
  if (typeof customElements !== 'undefined' && !customElements.get(tag)) customElements.define(tag, AhaAudienceImageUpload);
}
if (typeof window !== 'undefined') defineAhaAudienceImageUpload();
export default { AhaAudienceImageUpload, defineAhaAudienceImageUpload };
