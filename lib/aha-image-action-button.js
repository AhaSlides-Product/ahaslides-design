/**
 * @ahaslides-product/design/aha-image-action-button — the per-option image control.
 *
 *   import '@ahaslides-product/design/aha-image-action-button';   // registers <aha-image-action-button>
 *   <aha-image-action-button state="empty"></aha-image-action-button>   // empty | loading | filled (+ src)
 *
 * The compact per-OPTION image control (SETTINGS-22/32) — an image ICON button, never a text button
 * labelled "Image". Three states: empty (an "Add image" icon button), loading (a spinner at the same
 * size, no layout jump), and filled (the thumbnail with a hover pencil overlay that opens a
 * Change / Edit / Delete menu). It OWNS no modals — it emits intents (`add` / `change` / `edit` /
 * `delete`) and the host runs the upload/crop/confirm flow. Glyphs are summoned by name via <aha-icon>.
 * Shadow-DOM CSS, themed only by --aha-* tokens; the outside-click listener is removed on disconnect.
 */
import './icons.js';   // registers <aha-icon> for the add / pencil / menu glyphs

const STYLE = `
  :host{ display:inline-block; position:relative }
  .trigger{ box-sizing:border-box; display:inline-flex; align-items:center; justify-content:center;
    width:36px; height:36px; padding:0; overflow:hidden; cursor:pointer;
    color:var(--aha-icon-muted,#8A8A8A); background:var(--aha-bg-container,#fff);
    border:1px solid var(--aha-border,#E3E3E3); border-radius:var(--aha-radius-default,8px);
    transition:border-color var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)),
      color var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)) }
  .trigger:hover{ border-color:var(--aha-border-hover,#D3B4FF); color:var(--aha-color-primary,#6A1EBB) }
  .trigger:focus-visible{ outline:2px solid var(--aha-color-primary,#6A1EBB); outline-offset:2px }
  :host([disabled]) .trigger{ cursor:not-allowed; color:var(--aha-text-disabled,#B5B5B5);
    background:var(--aha-bg-container-disabled,#F1F1F1); border-color:var(--aha-border-disabled,#EBEBEB) }

  .thumb{ width:100%; height:100%; object-fit:cover; display:none }
  .overlay{ position:absolute; inset:0; display:flex; align-items:center; justify-content:center;
    color:var(--aha-text-inverse,#fff); background:var(--aha-bg-overlay,rgba(26,26,46,.7));
    border-radius:var(--aha-radius-default,8px); opacity:0; pointer-events:none;
    transition:opacity var(--aha-motion-fast,.1s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)) }
  :host([state="filled"]) .trigger:hover .overlay, :host([state="filled"]) .trigger:focus-visible .overlay{ opacity:1 }
  :host([state="filled"]) .thumb{ display:block }
  :host([state="filled"]) .add, :host([state="loading"]) .add{ display:none }
  :host([state="filled"]) .spinner, :host([state="empty"]) .spinner{ display:none }

  .spinner{ width:18px; height:18px; border-radius:var(--aha-radius-pill,999px);
    border:2px solid var(--aha-border,#E3E3E3); border-top-color:var(--aha-color-primary,#6A1EBB);
    animation:aha-iab-spin var(--aha-motion-slow,.3s) linear infinite }
  @keyframes aha-iab-spin{ to{ transform:rotate(360deg) } }

  .menu{ position:absolute; top:calc(100% + 4px); right:0; z-index:10; min-width:132px;
    display:none; flex-direction:column; padding:4px;
    background:var(--aha-bg-elevated,#fff); border:1px solid var(--aha-border,#E3E3E3);
    border-radius:var(--aha-radius-default,8px); box-shadow:0 6px 16px var(--aha-ink-a10,rgba(0,0,0,.08)) }
  .menu.open{ display:flex }
  .mi{ display:flex; align-items:center; gap:8px; padding:6px 8px; border:0; background:transparent; cursor:pointer;
    font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif); font-size:14px; line-height:21px;
    color:var(--aha-text-default,#1A1A1A); border-radius:var(--aha-radius-sm,6px); text-align:left;
    transition:background var(--aha-motion-fast,.1s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)) }
  .mi:hover{ background:var(--aha-bg-hover,#F7F7F7) }
  .mi.danger{ color:var(--aha-color-error,#F5222D) }
  .mi aha-icon{ color:currentColor }
  @media (prefers-reduced-motion: reduce){ *,*::before{ transition:none !important; animation:none !important } }
`;

export class AhaImageActionButton extends HTMLElement {
  static get observedAttributes() { return ['state', 'src', 'disabled', 'label']; }
  get state() { return this.getAttribute('state') || 'empty'; }
  set state(v) { this.setAttribute('state', v); }

  connectedCallback() {
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    if (!this._built) {
      this.shadowRoot.innerHTML = `<style>${STYLE}</style>` +
        `<button class="trigger" part="trigger" type="button">` +
          `<aha-icon class="add" name="system-image-square" size="20" aria-hidden="true"></aha-icon>` +
          `<span class="spinner" part="spinner" role="status" aria-label="Loading"></span>` +
          `<img class="thumb" part="thumb" alt="" />` +
          `<span class="overlay" part="overlay"><aha-icon name="system-pencil-simple" size="18" aria-hidden="true"></aha-icon></span>` +
        `</button>` +
        `<div class="menu" part="menu" role="group">` +
          `<button class="mi mi-change" type="button"><aha-icon name="system-image-square" size="16" aria-hidden="true"></aha-icon>Change</button>` +
          `<button class="mi mi-edit" type="button"><aha-icon name="system-pencil-simple" size="16" aria-hidden="true"></aha-icon>Edit</button>` +
          `<button class="mi mi-delete danger" type="button"><aha-icon name="system-trash" size="16" aria-hidden="true"></aha-icon>Delete</button>` +
        `</div>`;
      this._built = true;
      this._onDocDown = (e) => { if (!e.composedPath().includes(this)) this._closeMenu(); };
      this.shadowRoot.querySelector('.trigger').addEventListener('click', () => this._onTrigger());
      this.shadowRoot.querySelector('.mi-change').addEventListener('click', () => this._intent('change'));
      this.shadowRoot.querySelector('.mi-edit').addEventListener('click', () => this._intent('edit'));
      this.shadowRoot.querySelector('.mi-delete').addEventListener('click', () => this._intent('delete'));
    }
    this._sync();
  }
  disconnectedCallback() { document.removeEventListener('mousedown', this._onDocDown); }
  attributeChangedCallback() { if (this._built) this._sync(); }

  _sync() {
    const img = this.shadowRoot.querySelector('.thumb');
    const src = this.getAttribute('src');
    if (src) img.src = src; else img.removeAttribute('src');
    this.shadowRoot.querySelector('.trigger').disabled = this.hasAttribute('disabled');
    const t = this.shadowRoot.querySelector('.trigger');
    t.title = this.state === 'empty' ? (this.getAttribute('label') || 'Add image') : '';
    // aria-label tracks the actual state — never "Edit image" while the spinner is up (SETTINGS-22)
    const ariaByState = { empty: this.getAttribute('label') || 'Add image', loading: 'Loading', filled: 'Edit image' };
    t.setAttribute('aria-label', ariaByState[this.state] || ariaByState.empty);
    t.setAttribute('aria-busy', this.state === 'loading' ? 'true' : 'false');
    if (this.state !== 'filled') this._closeMenu();
  }
  _onTrigger() {
    if (this.hasAttribute('disabled')) return;
    if (this.state === 'empty') this._intent('add');
    else if (this.state === 'filled') this._toggleMenu();
  }
  _intent(name) {
    this._closeMenu();
    this.dispatchEvent(new CustomEvent(name, { bubbles: true, composed: true }));
  }
  _toggleMenu() { this.shadowRoot.querySelector('.menu').classList.contains('open') ? this._closeMenu() : this._openMenu(); }
  _openMenu() {
    this.shadowRoot.querySelector('.menu').classList.add('open');
    this.shadowRoot.querySelector('.trigger').setAttribute('aria-expanded', 'true');
    document.addEventListener('mousedown', this._onDocDown);
  }
  _closeMenu() {
    const m = this.shadowRoot.querySelector('.menu');
    m.classList.remove('open');
    this.shadowRoot.querySelector('.trigger').setAttribute('aria-expanded', 'false');
    document.removeEventListener('mousedown', this._onDocDown);
  }
}

export function defineAhaImageActionButton(tag = 'aha-image-action-button') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaImageActionButton);
  return true;
}
if (typeof window !== 'undefined') defineAhaImageActionButton();

export default { AhaImageActionButton, defineAhaImageActionButton };
