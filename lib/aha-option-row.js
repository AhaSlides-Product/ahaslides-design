/**
 * @ahaslides-product/design/aha-option-row — the repeatable option/answer row.
 *
 *   import '@ahaslides-product/design/aha-option-row';   // registers <aha-option-row>
 *   <aha-option-row orderable correctable value="Paris" maxlength="80"></aha-option-row>
 *
 * The repeatable option/answer row (SETTINGS-20/34/23/39), composed from DS primitives. Its UNIVERSAL
 * CORE (SETTINGS-34): the ROW carries the ONE border (radius 8) — the text field inside is a BORDERLESS
 * counted textarea (no box-in-a-box / double border); the drag handle is the FIRST child INSIDE that
 * border (not a column to its left); the delete (the secondary small icon Button) sits centred on the top-right corner, shown ONLY on hover
 * and disabled at the minimum item count (SETTINGS-23). Per-type extras compose in only when the type
 * has them: a correct-answer toggle (scored types) and the per-option image control (SETTINGS-22).
 *
 * The correct-answer toggle has two shapes (`checkboxshape`, default `circle`): a `circle` is a 20px
 * 1px-outline circle that FILLS correct green (`--aha-answer-correct`) with a white tick when marked correct; a
 * `square` is the same as a radius-6 box. Marking a row correct paints the WHOLE card — an
 * `--aha-answer-correct` edge over the `--aha-answer-correct-tint-5` fill (colour rule 11: the one green
 * marks a correct answer, and nothing else). When
 * `singleline` is set the field is a single-line answer: Enter is blocked (never inserts a newline) and
 * the text is trimmed on blur.
 *
 * The drag handle appears only when order matters (`orderable`) — an unordered set is not numbered
 * (SETTINGS-39). Reuses <aha-counted-textarea borderless>, <aha-image-action-button>, <aha-button> and <aha-icon>.
 * Shadow-DOM CSS, themed only by --aha-* tokens. Emits composed `input` / `correct-change` / `delete`
 * and forwards the image control's `image-*` intents.
 *
 * Keyboard: the delete is hover-revealed, so it is not a tab stop — Tab goes from one row's field to the next.
 * Backspace in an EMPTY field of a deletable row (candelete not "false") emits the same `delete`, with
 * `detail.source` "keyboard" (a click gives "pointer"), so a host can move focus to the previous row's field
 * with `previousRow.focus()`. `focus(options)` focuses the row's own text field.
 *
 * Reorder: with `orderable` AND the opt-in `reorderable` attribute (and the row not `disabled`), the drag
 * handle becomes a tab stop (role="button") that reorders by pointer or keyboard — a host wires both, the
 * row never moves itself. ArrowUp / ArrowDown on the focused handle emit composed `reorder-move` with
 * `detail.direction` ("up" | "down"); after the host moves the row element, call `row.focusHandle()` to put
 * focus back on its handle. pointerdown on the handle emits composed `reorder-grab` with
 * `detail.{pointerId,clientX,clientY}` and leaves focus off the text field — the host calls
 * `setPointerCapture` on the row element and drives the drag itself. Without `reorderable` (default) the
 * handle is unchanged: decorative, not a tab stop, no events.
 */
import './aha-counted-textarea.js';       // the borderless text field
import './aha-image-action-button.js';    // the optional per-option image
import './aha-button.js';                 // the delete is the secondary small icon Button
import './aha-tooltip.js';
import './icons.js';                      // <aha-icon> for the drag handle + delete

const MOTION = `var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1))`;
const STYLE = `
  :host{ display:block; position:relative; font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif) }
  /* the ROW carries the ONE border — the field inside is borderless (SETTINGS-34, no double border) */
  .row{ box-sizing:border-box; display:flex; align-items:center; gap:8px; min-height:44px; padding:3px 10px;
    background:var(--aha-bg-container,#FFFFFF);
    border:1px solid var(--aha-border-default,#E3E3E3); border-radius:var(--aha-radius-default,8px);
    transition:border-color ${MOTION}, background-color ${MOTION},
      box-shadow ${MOTION} }
  .row:hover{ border-color:var(--aha-color-primary,#E70E68) }
  .row:focus-within{ border-color:var(--aha-color-primary,#E70E68); box-shadow:0 0 0 2px var(--aha-focus-ring-soft,rgba(231,14,104,.3)) }
  /* correct → the WHOLE card: correct-green edge over the 5% correct tint (colour rule 11) */
  :host([correct]) .row{ border-color:var(--aha-answer-correct);
    background:var(--aha-answer-correct-tint-5) }
  :host([correct]) .row:hover{ border-color:var(--aha-answer-correct) }
  :host([correct]) .row:focus-within{ border-width:2px; padding:2px 9px; border-color:var(--aha-answer-correct); box-shadow:none }

  /* drag handle — FIRST child INSIDE the border; only when order matters */
  .handle{ flex:0 0 auto; display:none; align-items:center; justify-content:center; height:32px; width:20px;
    color:var(--aha-icon-muted,#8A8A8A); cursor:grab }
  :host([orderable]) .handle{ display:inline-flex }
  .handle:active{ cursor:grabbing }
  .handle:focus-visible{ outline:2px solid var(--aha-color-primary,#E70E68); outline-offset:2px;
    border-radius:var(--aha-radius-sm,6px) }
  /* reorderable only: a touch drag must not also scroll the page under it */
  :host([orderable][reorderable]) .handle{ touch-action:none }

  /* correct-answer toggle — persistent node; two shapes (circle default | square). Fills correct green
     with a white tick when correct. Attribute toggles :host([correct]) → the fill/tick animate, no remount. */
  .correct{ flex:0 0 auto; display:none; align-items:center; justify-content:center; box-sizing:border-box;
    padding:0; width:20px; height:20px; cursor:pointer;
    border:1px solid var(--aha-checkbox-border,#D4D4D4); border-radius:var(--aha-radius-pill,999px);
    background:var(--aha-bg-container,#FFFFFF); color:transparent;
    transition:border-color ${MOTION}, background-color ${MOTION} }
  :host([correctable]) .correct{ display:inline-flex }
  :host([checkboxshape="square"]) .correct{ border-radius:var(--aha-radius-sm,6px) }
  .correct:hover{ border-color:var(--aha-color-success,#1A1A1A) }
  :host([correct]) .correct{ border-color:var(--aha-answer-correct);
    background:var(--aha-answer-correct); color:var(--aha-text-inverse,#FFFFFF) }
  .correct:focus-visible{ outline:2px solid var(--aha-color-success,#1A1A1A); outline-offset:2px }
  .correct svg{ width:12px; height:12px; display:block }
  .correct:disabled{ cursor:not-allowed; opacity:.5 }

  .field{ flex:1 1 auto; min-width:0 }
  .image{ flex:0 0 auto; display:none }
  :host([image]) .image{ display:inline-flex }

  .delete{ position:absolute; top:-14px; right:-14px; z-index:2; opacity:0;
    transition:opacity var(--aha-motion-fast,.1s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)) }
  :host(:hover) .delete, .delete:focus-within{ opacity:1 }
  @media (prefers-reduced-motion: reduce){ *{ transition:none !important } }
`;

// The white tick drawn on the green fill of the correct toggle — a sub-glyph on the primary fill
// (like the Checkbox's tick), not a catalogue icon; currentColor so :host([correct]) can flip it white.
const TICK = '<svg viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M2.5 6.3 4.7 8.5 9.5 3.7" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/></svg>'; // ds-lint-allow: svg (checkmark tick — sub-glyph chrome drawn on the success fill, not a catalogue icon)

export class AhaOptionRow extends HTMLElement {
  static get observedAttributes() { return ['value', 'placeholder', 'maxlength', 'orderable', 'reorderable', 'correctable', 'correct', 'checkboxshape', 'checkboxShape', 'singleline', 'singleLine', 'image', 'imagestate', 'imagesrc', 'candelete', 'disabled']; }
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
          `<aha-image-action-button class="image" part="image" variant="tertiary" state="empty"></aha-image-action-button>` +
        `</div>` +
        `<aha-tooltip class="delete" text="Delete (Backspace when empty)">` +
          `<aha-button class="delete-button" part="delete" variant="secondary" size="sm" icon-only aria-label="Delete">` +
            `<aha-icon name="system-trash" size="16" aria-hidden="true"></aha-icon></aha-button></aha-tooltip>`;
      this._built = true;
      const field = this.shadowRoot.querySelector('.field');
      // the textarea's native input and the field's own both cross the shadow boundary; the row emits one in their place
      field.addEventListener('input', (e) => {
        e.stopPropagation();
        if (!(e instanceof CustomEvent) || typeof e.detail?.value !== 'string') return;
        this.setAttribute('value', e.detail.value);
        this.dispatchEvent(new CustomEvent('input', { bubbles: true, composed: true, detail: { value: e.detail.value } }));
      });
      // singleLine: block Enter from inserting a newline (single-line answer); trim on blur.
      field.addEventListener('keydown', (e) => { if (this.singleLine && e.key === 'Enter' && !e.shiftKey) e.preventDefault(); }, true);
      field.addEventListener('keydown', (e) => {
        if (e.key !== 'Backspace' || e.isComposing || e.repeat || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
        if (field.value !== '' || !this._canDelete()) return;
        e.preventDefault();
        this._emitDelete('keyboard');
      });
      field.addEventListener('change', () => {
        if (!this.singleLine) return;
        const trimmed = (field.value || '').trim();
        if (trimmed !== field.value) { field.value = trimmed; this.setAttribute('value', trimmed); this.dispatchEvent(new CustomEvent('input', { bubbles: true, composed: true, detail: { value: trimmed } })); }
      });
      const chk = this.shadowRoot.querySelector('.correct');
      chk.addEventListener('click', () => { if (chk.disabled) return; this._setCorrect(!this.correct); });
      const img = this.shadowRoot.querySelector('.image');
      for (const intent of ['add', 'change', 'edit', 'delete']) img.addEventListener(intent, () => this.dispatchEvent(new CustomEvent('image-' + intent, { bubbles: true, composed: true })));
      this.shadowRoot.querySelector('.delete-button').addEventListener('click', () => { if (this._canDelete()) this._emitDelete('pointer'); });
      const handle = this.shadowRoot.querySelector('.handle');
      handle.addEventListener('keydown', (e) => {
        if (!this._reorderActive()) return;
        if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
          e.preventDefault();
          this.dispatchEvent(new CustomEvent('reorder-move', { bubbles: true, composed: true, detail: { direction: e.key === 'ArrowUp' ? 'up' : 'down' } }));
          return;
        }
        // role="button" is not a native <button> — Enter/Space must be wired by hand to activate it (WAI-ARIA button pattern).
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handle.click();
        }
      });
      handle.addEventListener('pointerdown', (e) => {
        if (!this._reorderActive() || e.button !== 0) return;
        this.dispatchEvent(new CustomEvent('reorder-grab', { bubbles: true, composed: true, detail: { pointerId: e.pointerId, clientX: e.clientX, clientY: e.clientY } }));
      });
    }
    this._sync();
  }
  attributeChangedCallback() { if (this._built) this._sync(); }

  focus(options) { this.shadowRoot?.querySelector('.field')?.shadowRoot?.querySelector('textarea')?.focus(options); }

  focusHandle() { this.shadowRoot?.querySelector('.handle')?.focus(); }

  _reorderActive() { return this.hasAttribute('orderable') && this.hasAttribute('reorderable') && !this.hasAttribute('disabled'); }

  _canDelete() { return this.getAttribute('candelete') !== 'false'; }

  _emitDelete(source) {
    this.dispatchEvent(new CustomEvent('delete', { bubbles: true, composed: true, detail: { source } }));
  }

  _setCorrect(next) {
    next ? this.setAttribute('correct', '') : this.removeAttribute('correct');
    this.dispatchEvent(new CustomEvent('correct-change', { bubbles: true, composed: true, detail: { correct: next } }));
  }

  _sync() {
    const handle = this.shadowRoot.querySelector('.handle');
    if (this._reorderActive()) {
      handle.setAttribute('role', 'button');
      handle.setAttribute('tabindex', '0');
      handle.setAttribute('aria-label', 'Drag to reorder, or use the arrow keys');
    } else {
      handle.removeAttribute('role');
      handle.removeAttribute('tabindex');
      handle.setAttribute('aria-label', 'Drag to reorder');
    }
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
    const del = this.shadowRoot.querySelector('.delete-button');
    del.toggleAttribute('disabled', !this._canDelete());
    del.shadowRoot.querySelector('button').tabIndex = -1;
    this.shadowRoot.querySelector('.delete').setAttribute('text', this._canDelete() ? 'Delete (Backspace when empty)' : 'Delete');
    const textarea = field.shadowRoot && field.shadowRoot.querySelector('textarea');
    if (textarea) { if (this._canDelete()) textarea.setAttribute('aria-keyshortcuts', 'Backspace'); else textarea.removeAttribute('aria-keyshortcuts'); }
  }
}

export function defineAhaOptionRow(tag = 'aha-option-row') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaOptionRow);
  return true;
}
if (typeof window !== 'undefined') defineAhaOptionRow();

export default { AhaOptionRow, defineAhaOptionRow };
