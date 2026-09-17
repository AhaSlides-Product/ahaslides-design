/**
 * @ahaslides-product/design/aha-option-row — the repeatable option/answer row.
 *
 *   import '@ahaslides-product/design/aha-option-row';   // registers <aha-option-row>
 *   <aha-option-row orderable correctable value="Paris" maxlength="80"></aha-option-row>
 *
 * The repeatable option/answer row (SETTINGS-20/34/23/39), composed from DS primitives. Its UNIVERSAL
 * CORE (SETTINGS-34): the ROW carries the ONE border (radius 8) — the text field inside is a BORDERLESS
 * counted textarea (no box-in-a-box / double border); the drag handle is the FIRST child INSIDE that
 * border (not a column to its left); the delete floats just OUTSIDE the top-right, shown ONLY on hover
 * and disabled at the minimum item count (SETTINGS-23). Per-type extras compose in only when the type
 * has them: a correct-answer toggle (scored types) and the per-option image control (SETTINGS-22).
 *
 * The correct-answer toggle has two shapes (`checkboxshape`, default `circle`): a `circle` is a 20px
 * outline circle that FILLS success-green with a white tick when marked correct; a `square` is the same
 * as a radius-6 box. Marking a row correct paints the WHOLE card success-green — a `--aha-color-success`
 * border over a faint `--aha-bg-positive` tint — the reference "this is the answer" state. When
 * `singleline` is set the field is a single-line answer: Enter is blocked (never inserts a newline) and
 * the text is trimmed on blur.
 *
 * The drag handle appears only when order matters (`orderable`) — an unordered set is not numbered
 * (SETTINGS-39). Reuses <aha-counted-textarea borderless>, <aha-image-action-button> and <aha-icon>.
 * Shadow-DOM CSS, themed only by --aha-* tokens. Emits composed `input` / `correct-change` / `delete`
 * and forwards the image control's `image-*` intents.
 */
import './aha-counted-textarea.js';       // the borderless text field
import './aha-image-action-button.js';    // the optional per-option image
import './icons.js';                      // <aha-icon> for the drag handle + delete

const MOTION = `var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1))`;
const STYLE = `
  :host{ display:block; position:relative; font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif) }
  /* the ROW carries the ONE border — the field inside is borderless (SETTINGS-34, no double border) */
  .row{ box-sizing:border-box; display:flex; align-items:flex-start; gap:8px; padding:2px 10px;
    background:var(--aha-bg-container,#fff);
    border:1px solid var(--aha-border,#E3E3E3); border-radius:var(--aha-radius-default,8px);
    transition:border-color ${MOTION}, background-color ${MOTION},
      box-shadow ${MOTION} }
  .row:hover{ border-color:var(--aha-border-hover,#D3B4FF) }
  .row:focus-within{ border-color:var(--aha-color-primary,#6A1EBB); box-shadow:0 0 0 2px var(--aha-focus-ring-soft,rgba(211,180,255,.3)) }
  /* correct → the WHOLE card paints success-green (green border over a faint positive tint) */
  :host([correct]) .row{ border-color:var(--aha-color-success,#16C49A);
    background:color-mix(in srgb, var(--aha-bg-positive,#D8FAEF) 60%, var(--aha-bg-container,#fff)) }
  :host([correct]) .row:hover{ border-color:var(--aha-border-success,#16C49A) }
  :host([correct]) .row:focus-within{ border-color:var(--aha-color-success,#16C49A);
    box-shadow:0 0 0 2px var(--aha-btn-focus-ring-success,rgba(32,232,181,.3)) }

  /* drag handle — FIRST child INSIDE the border; only when order matters */
  .handle{ flex:0 0 auto; display:none; align-items:center; justify-content:center; height:32px; width:20px;
    color:var(--aha-icon-muted,#8A8A8A); cursor:grab }
  :host([orderable]) .handle{ display:inline-flex }
  .handle:active{ cursor:grabbing }

  /* correct-answer toggle — persistent node; two shapes (circle default | square). Fills success-green
     with a white tick when correct. Attribute toggles :host([correct]) → the fill/tick animate, no remount. */
  .correct{ flex:0 0 auto; display:none; align-items:center; justify-content:center; box-sizing:border-box;
    margin-top:6px; padding:0; width:20px; height:20px; cursor:pointer;
    border:2px solid var(--aha-checkbox-border,#D4D4D4); border-radius:var(--aha-radius-pill,999px);
    background:var(--aha-bg-container,#fff); color:transparent;
    transition:border-color ${MOTION}, background-color ${MOTION} }
  :host([correctable]) .correct{ display:inline-flex }
  :host([checkboxshape="square"]) .correct{ border-radius:var(--aha-radius-sm,6px) }
  .correct:hover{ border-color:var(--aha-color-success,#16C49A) }
  :host([correct]) .correct{ border-color:var(--aha-color-success,#16C49A);
    background:var(--aha-color-success,#16C49A); color:var(--aha-text-inverse,#fff) }
  .correct:focus-visible{ outline:2px solid var(--aha-color-success,#16C49A); outline-offset:2px }
  .correct svg{ width:12px; height:12px; display:block }
  .correct:disabled{ cursor:not-allowed; opacity:.5 }

  .field{ flex:1 1 auto; min-width:0 }
  .image{ flex:0 0 auto; display:none; margin-top:2px }
  :host([image]) .image{ display:inline-flex }

  /* delete — floats just OUTSIDE the top-right, hover-only, disabled at min (SETTINGS-23) */
  .delete{ position:absolute; top:-14px; right:-14px; z-index:2;
    display:inline-flex; align-items:center; justify-content:center; width:22px; height:22px;
    padding:0; border:0; cursor:pointer; opacity:0;
    color:var(--aha-icon-muted,#8A8A8A); background:var(--aha-bg-elevated,#fff);
    border-radius:var(--aha-radius-pill,999px); box-shadow:0 1px 4px var(--aha-ink-a10,rgba(0,0,0,.08));
    transition:opacity var(--aha-motion-fast,.1s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)),
      color var(--aha-motion-fast,.1s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)) }
  :host(:hover) .delete, .delete:focus-visible{ opacity:1 }
  .delete:hover{ color:var(--aha-color-error,#F5222D) }
  .delete:disabled{ cursor:not-allowed; color:var(--aha-text-disabled,#B5B5B5); opacity:0 }
  :host(:hover) .delete:disabled{ opacity:1 }
  .delete[hidden]{ display:none }
  @media (prefers-reduced-motion: reduce){ *{ transition:none !important } }
`;

// The white tick drawn on the green fill of the correct toggle — a sub-glyph on the primary fill
// (like the Checkbox's tick), not a catalogue icon; currentColor so :host([correct]) can flip it white.
const TICK = '<svg viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M2.5 6.3 4.7 8.5 9.5 3.7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>'; // ds-lint-allow: svg (checkmark tick — sub-glyph chrome drawn on the success fill, not a catalogue icon)

export class AhaOptionRow extends HTMLElement {
  static get observedAttributes() { return ['value', 'placeholder', 'maxlength', 'orderable', 'correctable', 'correct', 'checkboxshape', 'checkboxShape', 'singleline', 'singleLine', 'image', 'imagestate', 'imagesrc', 'candelete', 'disabled']; }
  get value() { return this.getAttribute('value') ?? ''; }
  set value(v) { this.setAttribute('value', v ?? ''); }
  get correct() { return this.hasAttribute('correct'); }
  set correct(v) { v ? this.setAttribute('correct', '') : this.removeAttribute('correct'); }
  get singleLine() { return this.hasAttribute('singleline') || this.hasAttribute('singleLine'); }

  connectedCallback() {
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    if (!this._built) {
      this.shadowRoot.innerHTML = `<style>${STYLE}</style>` +
        `<div class="row" part="row">` +
          `<span class="handle" part="handle" aria-label="Drag to reorder"><aha-icon name="system-drag" size="16" aria-hidden="true"></aha-icon></span>` +
          `<button class="correct" part="correct" type="button" role="checkbox" aria-checked="false" aria-label="Correct answer">${TICK}</button>` +
          `<aha-counted-textarea class="field" part="field" borderless minrows="1" maxrows="4"></aha-counted-textarea>` +
          `<aha-image-action-button class="image" part="image" state="empty"></aha-image-action-button>` +
        `</div>` +
        `<button class="delete" part="delete" type="button" aria-label="Delete">` +
          `<aha-icon name="system-trash" size="14" aria-hidden="true"></aha-icon></button>`;
      this._built = true;
      const field = this.shadowRoot.querySelector('.field');
      field.addEventListener('input', (e) => { this.setAttribute('value', e.detail.value); this.dispatchEvent(new CustomEvent('input', { bubbles: true, composed: true, detail: { value: e.detail.value } })); });
      // singleLine: block Enter from inserting a newline (single-line answer); trim on blur.
      field.addEventListener('keydown', (e) => { if (this.singleLine && e.key === 'Enter' && !e.shiftKey) e.preventDefault(); }, true);
      field.addEventListener('change', () => {
        if (!this.singleLine) return;
        const trimmed = (field.value || '').trim();
        if (trimmed !== field.value) { field.value = trimmed; this.setAttribute('value', trimmed); this.dispatchEvent(new CustomEvent('input', { bubbles: true, composed: true, detail: { value: trimmed } })); }
      });
      const chk = this.shadowRoot.querySelector('.correct');
      chk.addEventListener('click', () => { if (chk.disabled) return; this._setCorrect(!this.correct); });
      const img = this.shadowRoot.querySelector('.image');
      for (const intent of ['add', 'change', 'edit', 'delete']) img.addEventListener(intent, () => this.dispatchEvent(new CustomEvent('image-' + intent, { bubbles: true, composed: true })));
      this.shadowRoot.querySelector('.delete').addEventListener('click', () => { if (this.getAttribute('candelete') !== 'false') this.dispatchEvent(new CustomEvent('delete', { bubbles: true, composed: true })); });
    }
    this._sync();
  }
  attributeChangedCallback() { if (this._built) this._sync(); }

  _setCorrect(next) {
    next ? this.setAttribute('correct', '') : this.removeAttribute('correct');
    this.dispatchEvent(new CustomEvent('correct-change', { bubbles: true, composed: true, detail: { correct: next } }));
  }

  _sync() {
    const field = this.shadowRoot.querySelector('.field');
    field.setAttribute('placeholder', this.getAttribute('placeholder') || 'Option text');
    const max = this.getAttribute('maxlength');
    if (max) field.setAttribute('maxlength', max); else field.removeAttribute('maxlength');
    if (field.value !== this.value) field.value = this.value;
    // reflect a camelCase shape attr onto the lowercase form the CSS matches, so both spellings work
    const shape = this.getAttribute('checkboxShape') || this.getAttribute('checkboxshape') || 'circle';
    if (this.getAttribute('checkboxshape') !== shape) this.setAttribute('checkboxshape', shape);
    const chk = this.shadowRoot.querySelector('.correct');
    chk.setAttribute('aria-checked', this.correct ? 'true' : 'false');
    const img = this.shadowRoot.querySelector('.image');
    if (this.hasAttribute('imagestate')) img.setAttribute('state', this.getAttribute('imagestate'));
    if (this.getAttribute('imagesrc')) img.setAttribute('src', this.getAttribute('imagesrc')); else img.removeAttribute('src');
    const del = this.shadowRoot.querySelector('.delete');
    del.disabled = this.getAttribute('candelete') === 'false';
  }
}

export function defineAhaOptionRow(tag = 'aha-option-row') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaOptionRow);
  return true;
}
if (typeof window !== 'undefined') defineAhaOptionRow();

export default { AhaOptionRow, defineAhaOptionRow };
