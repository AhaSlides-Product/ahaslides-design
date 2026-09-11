/**
 * @ahaslides-product/design/aha-tooltip — the shared Tooltip primitive.
 *
 *   import '@ahaslides-product/design/aha-tooltip';   // registers <aha-tooltip>
 *   <aha-tooltip text="Copy link"><aha-button icon-only aria-label="Copy">…</aha-button></aha-tooltip>
 *
 * A short, transient hint on hover/focus of its slotted trigger. ONE element, shadow-DOM CSS,
 * themed only by --aha-* tokens → byte-identical in React and Vue. Zero dependencies. The
 * dark-navy bubble with an arrow is the single shared tooltip the settings pattern references.
 *
 * The DS V3 / AntD Tooltip matrix this covers:
 *   `placement` — top | bottom | left | right (centred), PLUS the 8 edge-aligned ones —
 *                 top-start | top-end | bottom-start | bottom-end | left-start | left-end |
 *                 right-start | right-end. An edge-aligned placement sits on the same side but
 *                 aligns the bubble to the start/end edge of the trigger, with the arrow offset
 *                 to sit near that edge (not centred). AntD naming.
 *   `color`     — dark (default navy) | brand (color-primary fill).
 *   `arrow`     — the caret is on by default; `arrow="false"` hides it.
 *   `trigger`   — hover (default, + focus for keyboard) | focus | click (toggle).
 *   `open`      — force the bubble visible (demos/measurement); otherwise it shows on trigger.
 *
 * a11y: the bubble is role=tooltip and is wired to the slotted trigger via aria-describedby, so it
 * shows on focus (not just hover) and screen readers announce it. Show/hide animates on a PERSISTENT
 * node — a class toggles opacity/transform (the subtree is never rebuilt on open, so the transition
 * actually fires — the historic Switch-click MOTION_DEBT trap). Click-away + Esc listeners for the
 * `click` trigger are removed on disconnect (no leaked document listeners).
 *
 *   `help`      — render a built-in `?` help trigger (DS <aha-icon name="system-question-circle">, 16px,
 *                 muted → brand on hover/focus) instead of requiring a slotted trigger. It's a real
 *                 focusable <button>, so the tooltip shows on FOCUS as well as hover (not hover-only) —
 *                 the settings-label "?" pattern from the DS V3 "Tooltip question-mark" section. Slot a
 *                 trigger yourself and it wins; `help` is the zero-boilerplate default trigger.
 */
import './icons.js';   // registers <aha-icon> so the built-in `?` help trigger's glyph resolves from the DS library

const STYLE = `
  :host{ position:relative; display:inline-flex }
  .bubble{ position:absolute; box-sizing:border-box; max-width:240px; padding:6px 10px; white-space:nowrap;
    font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif); font-size:12px; line-height:18px;
    color:var(--aha-text-inverse,#FFFFFF); background:var(--aha-bg-dark,#1A1A2E);
    border-radius:var(--aha-radius-sm,6px); box-shadow:0 4px 12px rgba(26,26,46,.2);
    opacity:0; visibility:hidden; z-index:10; pointer-events:none;
    transition:opacity var(--aha-motion-mid,.2s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)), transform var(--aha-motion-mid,.2s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)) }
  .bubble::after{ content:""; position:absolute; border:5px solid transparent }

  /* brand fill — color-primary instead of navy */
  :host([color="brand"]) .bubble{ background:var(--aha-color-primary,#6A1EBB) }

  /* placement — top is the default; each sets the position + the resting/entering transform + arrow edge */
  .bubble{ bottom:calc(100% + 8px); left:50%; transform:translateX(-50%) translateY(4px) }
  .bubble::after{ top:100%; left:50%; transform:translateX(-50%); border-top-color:var(--aha-bg-dark,#1A1A2E) }
  :host([color="brand"]) .bubble::after{ border-top-color:var(--aha-color-primary,#6A1EBB) }

  :host([placement="bottom"]) .bubble{ top:calc(100% + 8px); bottom:auto; left:50%; transform:translateX(-50%) translateY(-4px) }
  :host([placement="bottom"]) .bubble::after{ top:auto; bottom:100%; left:50%; transform:translateX(-50%); border-top-color:transparent; border-bottom-color:var(--aha-bg-dark,#1A1A2E) }
  :host([placement="bottom"][color="brand"]) .bubble::after{ border-bottom-color:var(--aha-color-primary,#6A1EBB) }

  :host([placement="left"]) .bubble{ right:calc(100% + 8px); left:auto; bottom:auto; top:50%; transform:translateY(-50%) translateX(4px) }
  :host([placement="left"]) .bubble::after{ top:50%; left:100%; transform:translateY(-50%); border-top-color:transparent; border-left-color:var(--aha-bg-dark,#1A1A2E) }
  :host([placement="left"][color="brand"]) .bubble::after{ border-left-color:var(--aha-color-primary,#6A1EBB) }

  :host([placement="right"]) .bubble{ left:calc(100% + 8px); bottom:auto; top:50%; transform:translateY(-50%) translateX(-4px) }
  :host([placement="right"]) .bubble::after{ top:50%; right:100%; transform:translateY(-50%); border-top-color:transparent; border-right-color:var(--aha-bg-dark,#1A1A2E) }
  :host([placement="right"][color="brand"]) .bubble::after{ border-right-color:var(--aha-color-primary,#6A1EBB) }

  /* ---- edge-aligned placements (DS V3 / AntD): same side, aligned to the trigger's start/end
     edge, arrow offset near that edge instead of centred. Resting transform carries ONLY the
     directional lift (no centring translate) so the show/hide transition keeps its "from". ---- */
  /* top-start / top-end — bubble above, aligned to the trigger's left/right edge */
  :host([placement="top-start"]) .bubble{ bottom:calc(100% + 8px); top:auto; left:0; right:auto; transform:translateY(4px) }
  :host([placement="top-end"]) .bubble{ bottom:calc(100% + 8px); top:auto; right:0; left:auto; transform:translateY(4px) }
  :host([placement="top-start"]) .bubble::after,
  :host([placement="top-end"]) .bubble::after{ top:100%; transform:none; border-top-color:var(--aha-bg-dark,#1A1A2E) }
  :host([placement="top-start"]) .bubble::after{ left:16px }
  :host([placement="top-end"]) .bubble::after{ right:16px }
  :host([placement="top-start"][color="brand"]) .bubble::after,
  :host([placement="top-end"][color="brand"]) .bubble::after{ border-top-color:var(--aha-color-primary,#6A1EBB) }

  /* bottom-start / bottom-end — bubble below, aligned to the trigger's left/right edge */
  :host([placement="bottom-start"]) .bubble{ top:calc(100% + 8px); bottom:auto; left:0; right:auto; transform:translateY(-4px) }
  :host([placement="bottom-end"]) .bubble{ top:calc(100% + 8px); bottom:auto; right:0; left:auto; transform:translateY(-4px) }
  :host([placement="bottom-start"]) .bubble::after,
  :host([placement="bottom-end"]) .bubble::after{ top:auto; bottom:100%; transform:none; border-top-color:transparent; border-bottom-color:var(--aha-bg-dark,#1A1A2E) }
  :host([placement="bottom-start"]) .bubble::after{ left:16px }
  :host([placement="bottom-end"]) .bubble::after{ right:16px }
  :host([placement="bottom-start"][color="brand"]) .bubble::after,
  :host([placement="bottom-end"][color="brand"]) .bubble::after{ border-bottom-color:var(--aha-color-primary,#6A1EBB) }

  /* left-start / left-end — bubble to the left, aligned to the trigger's top/bottom edge */
  :host([placement="left-start"]) .bubble{ right:calc(100% + 8px); left:auto; top:0; bottom:auto; transform:translateX(4px) }
  :host([placement="left-end"]) .bubble{ right:calc(100% + 8px); left:auto; bottom:0; top:auto; transform:translateX(4px) }
  :host([placement="left-start"]) .bubble::after,
  :host([placement="left-end"]) .bubble::after{ left:100%; transform:none; border-top-color:transparent; border-left-color:var(--aha-bg-dark,#1A1A2E) }
  :host([placement="left-start"]) .bubble::after{ top:12px }
  :host([placement="left-end"]) .bubble::after{ bottom:12px }
  :host([placement="left-start"][color="brand"]) .bubble::after,
  :host([placement="left-end"][color="brand"]) .bubble::after{ border-left-color:var(--aha-color-primary,#6A1EBB) }

  /* right-start / right-end — bubble to the right, aligned to the trigger's top/bottom edge */
  :host([placement="right-start"]) .bubble{ left:calc(100% + 8px); right:auto; top:0; bottom:auto; transform:translateX(-4px) }
  :host([placement="right-end"]) .bubble{ left:calc(100% + 8px); right:auto; bottom:0; top:auto; transform:translateX(-4px) }
  :host([placement="right-start"]) .bubble::after,
  :host([placement="right-end"]) .bubble::after{ right:100%; transform:none; border-top-color:transparent; border-right-color:var(--aha-bg-dark,#1A1A2E) }
  :host([placement="right-start"]) .bubble::after{ top:12px }
  :host([placement="right-end"]) .bubble::after{ bottom:12px }
  :host([placement="right-start"][color="brand"]) .bubble::after,
  :host([placement="right-end"][color="brand"]) .bubble::after{ border-right-color:var(--aha-color-primary,#6A1EBB) }

  /* arrow toggle */
  :host([arrow="false"]) .bubble::after{ display:none }

  /* shown — driven by a class on the persistent node (hover/focus CSS + the .open JS state) */
  :host(:hover) .bubble, :host(:focus-within) .bubble, :host([open]) .bubble, .bubble.open{
    opacity:1; visibility:visible; transform:translateX(-50%) translateY(0) }
  :host([placement="left"]:hover) .bubble, :host([placement="left"]:focus-within) .bubble, :host([placement="left"][open]) .bubble, :host([placement="left"]) .bubble.open,
  :host([placement="right"]:hover) .bubble, :host([placement="right"]:focus-within) .bubble, :host([placement="right"][open]) .bubble, :host([placement="right"]) .bubble.open{
    transform:translateY(-50%) translateX(0) }
  /* edge-aligned shown state — no centring translate, just settle the directional lift to 0 */
  :host([placement^="top-"]:hover) .bubble, :host([placement^="top-"]:focus-within) .bubble, :host([placement^="top-"][open]) .bubble, :host([placement^="top-"]) .bubble.open,
  :host([placement^="bottom-"]:hover) .bubble, :host([placement^="bottom-"]:focus-within) .bubble, :host([placement^="bottom-"][open]) .bubble, :host([placement^="bottom-"]) .bubble.open,
  :host([placement^="left-"]:hover) .bubble, :host([placement^="left-"]:focus-within) .bubble, :host([placement^="left-"][open]) .bubble, :host([placement^="left-"]) .bubble.open,
  :host([placement^="right-"]:hover) .bubble, :host([placement^="right-"]:focus-within) .bubble, :host([placement^="right-"][open]) .bubble, :host([placement^="right-"]) .bubble.open{
    transform:translate(0,0) }
  /* click trigger: suppress the hover/focus reveal — only the .open class shows it */
  :host([trigger="click"]:hover) .bubble, :host([trigger="click"]:focus-within) .bubble{ opacity:0; visibility:hidden }
  :host([trigger="click"]) .bubble.open{ opacity:1; visibility:visible }
  /* focus-only trigger: suppress hover reveal */
  :host([trigger="focus"]:hover) .bubble{ opacity:0; visibility:hidden }
  :host([trigger="focus"]:focus-within) .bubble{ opacity:1; visibility:visible }

  /* ---- built-in help trigger (help attribute) — a focusable button carrying a DS aha-icon.
     16px, muted at rest, brand on hover/focus; colour animates via the shared motion tokens on this
     PERSISTENT node (never rebuilt on state). Shown only when help is set (the slot is hidden). ---- */
  .help{ display:none }
  :host([help]) .help{ display:inline-flex; align-items:center; justify-content:center;
    box-sizing:border-box; padding:0; border:0; background:transparent; cursor:help;
    color:var(--aha-icon-muted,#8A8A8A); border-radius:var(--aha-radius-pill,999px);
    transition:color var(--aha-motion-fast,.12s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)),
      box-shadow var(--aha-motion-fast,.12s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)) }
  :host([help]) ::slotted(*){ display:none }
  :host([help]) .help:hover, :host([help]) .help:focus-visible{ color:var(--aha-color-primary,#6A1EBB) }
  :host([help]) .help:focus-visible{ outline:none; box-shadow:0 0 0 3px var(--aha-focus-ring-soft,rgba(106,30,187,.2)) }

  @media (prefers-reduced-motion: reduce){ *{ transition:none !important } }
`;

let TIP_SEQ = 0;

export class AhaTooltip extends HTMLElement {
  static get observedAttributes() { return ['text', 'open', 'placement', 'color', 'arrow', 'trigger', 'help']; }
  connectedCallback() {
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    if (!this._bubble) this._build();
    this._sync();
    this._bindTrigger();
  }
  disconnectedCallback() {
    // no leaked document listeners
    if (this._onDocDown) document.removeEventListener('pointerdown', this._onDocDown, true);
    if (this._onKey) document.removeEventListener('keydown', this._onKey, true);
    if (this._onClick) this.removeEventListener('click', this._onClick);
  }
  attributeChangedCallback(name) {
    if (!this._bubble) return;
    this._sync();
    if (name === 'trigger') this._bindTrigger();
  }

  _build() {
    // Build ONCE; state then drives the persistent .bubble (class/attr toggle) so its opacity/transform
    // transition fires. Rebuilding the subtree on open/text would make a fresh node with no "from"
    // state — the transition would never run (the Switch-click trap).
    this._id = 'aha-tip-' + (++TIP_SEQ);
    // The built-in `?` help trigger is a real focusable <button> carrying a DS <aha-icon> (never an
    // inline <svg>) — so `help` tooltips show on FOCUS as well as hover, not hover-only. It's built
    // once and lives on a persistent node; `help` just toggles its visibility via CSS.
    this.shadowRoot.append(document.createRange().createContextualFragment(
      `<style>${STYLE}</style><slot></slot>` +
      `<button class="help" part="help" type="button" tabindex="0" aria-label="More info">` +
      `<aha-icon name="system-question-circle" size="16" decorative></aha-icon></button>` +
      `<span class="bubble" part="bubble" role="tooltip" id="${this._id}"></span>`));
    this._bubble = this.shadowRoot.querySelector('.bubble');
    this._help = this.shadowRoot.querySelector('.help');
    // wire aria-describedby onto the active trigger so the hint is announced + shows on focus
    const slot = this.shadowRoot.querySelector('slot');
    slot.addEventListener('slotchange', () => this._describe());
  }
  _describe() {
    // help mode → the built-in button IS the trigger; otherwise the slotted trigger
    if (this.hasAttribute('help')) { if (this._help) this._help.setAttribute('aria-describedby', this._id); return; }
    const el = this.querySelector('button,a,input,select,textarea,[tabindex],[role]') || this.firstElementChild;
    if (el && el.setAttribute) el.setAttribute('aria-describedby', this._id);
  }
  _sync() { this._bubble.textContent = this.getAttribute('text') || ''; this._describe(); }

  // ---- click trigger: toggle .open, dismiss on click-away / Esc (persistent-node class) --------
  _bindTrigger() {
    const isClick = this.getAttribute('trigger') === 'click';
    if (this._onClick) this.removeEventListener('click', this._onClick);
    if (this._onDocDown) document.removeEventListener('pointerdown', this._onDocDown, true);
    if (this._onKey) document.removeEventListener('keydown', this._onKey, true);
    if (!isClick) { this._bubble.classList.remove('open'); return; }
    this._onClick = () => this._bubble.classList.toggle('open');
    this._onDocDown = (e) => { if (!this.contains(e.target)) this._bubble.classList.remove('open'); };
    this._onKey = (e) => { if (e.key === 'Escape') this._bubble.classList.remove('open'); };
    this.addEventListener('click', this._onClick);
    document.addEventListener('pointerdown', this._onDocDown, true);
    document.addEventListener('keydown', this._onKey, true);
  }
}

export function defineAhaTooltip(tag = 'aha-tooltip') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaTooltip);
  return true;
}
if (typeof window !== 'undefined') defineAhaTooltip();

export default { AhaTooltip, defineAhaTooltip };
