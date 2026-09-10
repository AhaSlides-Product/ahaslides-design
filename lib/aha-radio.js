/**
 * @ahaslides-product/design/aha-radio — the shared Radio primitive.
 *
 *   import '@ahaslides-product/design/aha-radio';   // registers <aha-radio>
 *   <div role="radiogroup" aria-label="Activity mode">
 *     <aha-radio name="mode" value="poll" checked>Poll</aha-radio>
 *     <aha-radio name="mode" value="quiz">Quiz</aha-radio>
 *   </div>
 *
 * ONE element, shadow-DOM CSS, themed only by --aha-* tokens → byte-identical in React and Vue.
 * Zero dependencies (no Lit). Radios sharing a `name` are mutually exclusive; selecting one clears
 * its siblings. Emits a composed `change` CustomEvent<{value, checked}>.
 *
 * The DS V3 Radio is a FAMILY, enumerated from the component-set taxonomy (Radio-Group · Radio-
 * Button-Group · Segmented-radio · Radio-Card):
 *   - `variant`   "dot" (default — ring + brand dot + label) | "button" (segmented, connected pills)
 *                 | "card" (the whole bordered card is the target — dot + title + optional description;
 *                 the SELECTED card gets a brand border + a subtle brand-tint fill)
 *   - `size`      "default" (16px ring / 32px button) | "small" (14px ring / 24px button)
 *   - `direction` "horizontal" (default) | "vertical" — how a `name` group flows; in button variant
 *                 it also decides which edges the connected pills round + share.
 *   - `description` (card variant only) a secondary line rendered under the title.
 *
 * The host IS the accessible radio (role="radio", aria-checked): the WAI-ARIA radiogroup keyboard
 * contract lives here — one tabbable radio per group (roving tabindex), Arrow keys move to and
 * select the next/previous option (wrapping), Space selects the focused option. Wrap a set in a
 * container with role="radiogroup" so assistive tech announces them as one group.
 *
 * Motion lives on PERSISTENT nodes (the ring border + the inner dot's scale, or the button fill):
 * the shadow tree is built once, and a state change only toggles the reflected attribute, so the
 * transition fires — never a subtree rebuild on the animated state.
 */
const STYLE = `
  :host{ display:inline-block; outline:none }
  :host([direction="vertical"]){ display:block }
  label{ display:inline-flex; align-items:center; gap:8px;
    font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif); font-size:14px; line-height:21px;
    color:var(--aha-text-default,#1A1A1A); cursor:pointer; user-select:none }
  :host([size="small"]) label{ font-size:13px; line-height:20px; gap:6px }
  :host([disabled]) label{ cursor:not-allowed; color:var(--aha-text-disabled,#B5B5B5) }

  /* ---- dot variant (default) ------------------------------------------------ */
  .ring{ position:relative; flex:0 0 auto; width:16px; height:16px; box-sizing:border-box;
    border:1px solid var(--aha-border-strong,#D4D4D4); border-radius:50%;
    background:var(--aha-bg-container,#fff); display:inline-flex; align-items:center; justify-content:center;
    transition:border-color var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)) }
  :host([size="small"]) .ring{ width:14px; height:14px }
  .dot{ width:8px; height:8px; border-radius:50%; background:var(--aha-color-primary,#6A1EBB);
    transform:scale(0);
    transition:transform var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)) }
  :host([size="small"]) .dot{ width:7px; height:7px }
  label:hover .ring{ border-color:var(--aha-border-hover,#D3B4FF) }
  :host([disabled]) label:hover .ring{ border-color:var(--aha-border-strong,#D4D4D4) }
  :host([checked]) .ring{ border-color:var(--aha-color-primary,#6A1EBB) }
  :host([checked]) .dot{ transform:scale(1) }
  :host([disabled]) .ring{ background:var(--aha-bg-container-disabled,#F1F1F1); border-color:var(--aha-border-disabled,#EBEBEB) }
  :host([disabled]) .dot{ background:var(--aha-text-disabled,#B5B5B5) }
  :host(:focus-visible) .ring{ outline:2px solid var(--aha-color-primary,#6A1EBB); outline-offset:2px }

  /* ---- button variant (segmented pill) — hidden ring, whole row is the control ---- */
  :host([variant="button"]) .ring{ display:none }
  :host([variant="button"]) label{ gap:0; justify-content:center; box-sizing:border-box;
    height:32px; padding:0 16px; font-weight:600;
    border:1px solid var(--aha-border-strong,#D4D4D4); border-radius:var(--aha-radius-default,8px);
    background:var(--aha-bg-container,#fff); color:var(--aha-text-default,#1A1A1A);
    transition:background var(--aha-motion-fast,.1s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)),
      border-color var(--aha-motion-fast,.1s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)),
      color var(--aha-motion-fast,.1s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)) }
  :host([variant="button"][size="small"]) label{ height:24px; padding:0 12px }
  :host([variant="button"]) label:hover{ color:var(--aha-color-primary,#6A1EBB); border-color:var(--aha-border-hover,#D3B4FF) }
  :host([variant="button"][checked]) label{ color:var(--aha-color-primary,#6A1EBB);
    border-color:var(--aha-color-primary,#6A1EBB); background:var(--aha-bg-accent,#F9F5FF); z-index:1 }
  :host([variant="button"][disabled]) label{ color:var(--aha-text-disabled,#B5B5B5);
    background:var(--aha-bg-container-disabled,#F1F1F1); border-color:var(--aha-border-disabled,#EBEBEB) }
  :host([variant="button"][disabled]) label:hover{ color:var(--aha-text-disabled,#B5B5B5); border-color:var(--aha-border-disabled,#EBEBEB) }
  :host(:focus-visible) label{ outline:2px solid var(--aha-color-primary,#6A1EBB); outline-offset:2px }

  /* connected pills: collapse the shared edge + only round the group's outer corners.
     :host-context lets a pill read its position in the group without a container element. */
  :host([variant="button"]:not(:first-of-type):not([direction="vertical"])) label{ margin-left:-1px; border-top-left-radius:0; border-bottom-left-radius:0 }
  :host([variant="button"]:not(:last-of-type):not([direction="vertical"])) label{ border-top-right-radius:0; border-bottom-right-radius:0 }
  :host([variant="button"][direction="vertical"]:not(:first-of-type)) label{ margin-top:-1px; border-top-left-radius:0; border-top-right-radius:0 }
  :host([variant="button"][direction="vertical"]:not(:last-of-type)) label{ border-bottom-left-radius:0; border-bottom-right-radius:0 }

  /* ---- card variant — the whole bordered card is the selectable target -------------- */
  /* dot on the left, title (the slotted label) + optional description stacked to its right.
     Selection lives on a PERSISTENT node (the label element): checking one only toggles the
     [checked] attribute → the border-color + background transition fires, no subtree rebuild. */
  /* .body is transparent (display:contents) for dot/button — the slotted label sits inline next to
     the ring exactly as before; only the card variant makes it a stacked title + description column. */
  .body{ display:contents }
  .desc{ display:none }
  :host([variant="card"]) .body{ display:flex; flex-direction:column; gap:2px; min-width:0 }
  :host([variant="card"]) .title{ font-weight:600; color:var(--aha-text-default,#1A1A1A); line-height:21px }
  :host([variant="card"][size="small"]) .title{ line-height:20px }
  :host([variant="card"]) .desc{ display:none; font-size:13px; line-height:20px; color:var(--aha-text-secondary,#4A4A4A) }
  :host([variant="card"][size="small"]) .desc{ font-size:12px; line-height:18px }
  :host([variant="card"][has-desc]) .desc{ display:block }
  :host([variant="card"]) label{ align-items:flex-start; gap:12px; box-sizing:border-box; width:100%;
    padding:16px; border:1px solid var(--aha-border-strong,#D4D4D4); border-radius:var(--aha-radius-default,8px);
    background:var(--aha-bg-container,#fff);
    transition:border-color var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)),
      background var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)) }
  :host([variant="card"][size="small"]) label{ padding:12px; gap:8px }
  :host([variant="card"]) .ring{ margin-top:2px }
  :host([variant="card"]) label:hover{ border-color:var(--aha-border-hover,#D3B4FF) }
  :host([variant="card"][checked]) label{ border-color:var(--aha-color-primary,#6A1EBB); background:var(--aha-bg-accent,#F9F5FF) }
  :host([variant="card"][disabled]) label{ background:var(--aha-bg-container-disabled,#F1F1F1); border-color:var(--aha-border-disabled,#EBEBEB) }
  :host([variant="card"][disabled]) label:hover{ border-color:var(--aha-border-disabled,#EBEBEB) }
  :host([variant="card"][disabled]) .title{ color:var(--aha-text-disabled,#B5B5B5) }
  :host([variant="card"][disabled]) .desc{ color:var(--aha-text-disabled,#B5B5B5) }

  @media (prefers-reduced-motion: reduce){ *{ transition:none !important } }
`;

export class AhaRadio extends HTMLElement {
  static get observedAttributes() { return ['checked', 'disabled', 'variant', 'size', 'direction', 'description']; }
  get checked() { return this.hasAttribute('checked'); }
  set checked(v) { v ? this.setAttribute('checked', '') : this.removeAttribute('checked'); }
  get disabled() { return this.hasAttribute('disabled'); }
  set disabled(v) { v ? this.setAttribute('disabled', '') : this.removeAttribute('disabled'); }
  get value() { return this.getAttribute('value') || ''; }
  set value(v) { this.setAttribute('value', v); }
  get name() { return this.getAttribute('name') || ''; }
  get description() { return this.getAttribute('description') || ''; }
  set description(v) { v ? this.setAttribute('description', v) : this.removeAttribute('description'); }

  connectedCallback() {
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    if (!this._built) {
      // Built ONCE, from a fragment appended to the shadow root (ShadowRoot has no insertAdjacentHTML;
      // append(createContextualFragment) also keeps this off the innerHTML= rebuild path). State changes
      // only toggle the reflected attribute on this persistent tree — the subtree is never rebuilt.
      this.shadowRoot.append(document.createRange().createContextualFragment(
        `<style>${STYLE}</style><label><span class="ring"><span class="dot"></span></span>` +
        `<span class="body"><span class="title"><slot></slot></span><span class="desc"></span></span></label>`));
      this._built = true;
      this.setAttribute('role', 'radio');
      this.addEventListener('click', () => { if (!this.disabled) this._select(); });
      this.addEventListener('keydown', (e) => this._onKeydown(e));
    }
    this._sync();
    this._updateRoving();
  }

  attributeChangedCallback() {
    if (!this._built) return;
    this._sync();
    this._updateRoving();
  }

  // Reflect the accessible state the host advertises to assistive tech.
  _sync() {
    this.setAttribute('aria-checked', this.checked ? 'true' : 'false');
    if (this.disabled) this.setAttribute('aria-disabled', 'true');
    else this.removeAttribute('aria-disabled');
    // Card variant: write the optional description onto its PERSISTENT node (textContent, never a
    // subtree rebuild) and toggle `has-desc` so CSS reveals the secondary line. The `checked`
    // transition animates on the label; touching .desc here never rebuilds that animated node.
    const desc = this.shadowRoot && this.shadowRoot.querySelector('.desc');
    if (desc) {
      const text = this.description;
      if (desc.textContent !== text) desc.textContent = text;
      if (text) this.setAttribute('has-desc', '');
      else this.removeAttribute('has-desc');
    }
  }

  // Roving tabindex: exactly one radio per group is in the tab order — the checked one, or the
  // first enabled one when the group has no selection. Disabled radios are never tabbable.
  _updateRoving() {
    const group = this._group();
    const enabled = group.filter(r => !r.disabled);
    const tabbable = enabled.find(r => r.checked) || enabled[0] || null;
    for (const r of group) r.setAttribute('tabindex', r === tabbable ? '0' : '-1');
  }

  _onKeydown(e) {
    if (this.disabled) return;
    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowRight': e.preventDefault(); this._move(1); break;
      case 'ArrowUp':
      case 'ArrowLeft': e.preventDefault(); this._move(-1); break;
      case ' ':
      case 'Spacebar': e.preventDefault(); this._select(); break;
    }
  }

  // Move focus to the next/previous enabled radio in the group (wrapping) and select it —
  // arrow-key navigation selects as it moves, per the WAI-ARIA radio group pattern.
  _move(dir) {
    const enabled = this._group().filter(r => !r.disabled);
    if (!enabled.length) return;
    const from = enabled.indexOf(this);
    const target = enabled[(from + dir + enabled.length) % enabled.length];
    target._select();
    target.focus();
  }

  _select() {
    if (this.checked) return;
    this.checked = true;
    for (const sib of this._group()) if (sib !== this) sib.checked = false;
    this._updateRoving();
    this.dispatchEvent(new CustomEvent('change', { bubbles: true, composed: true, detail: { value: this.value, checked: true } }));
  }

  _group() {
    const nm = this.name;
    if (!nm) return [this];
    const scope = this.getRootNode() || document;
    return [...scope.querySelectorAll('aha-radio')].filter(r => r.name === nm);
  }
}

export function defineAhaRadio(tag = 'aha-radio') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaRadio);
  return true;
}
if (typeof window !== 'undefined') defineAhaRadio();

export default { AhaRadio, defineAhaRadio };
