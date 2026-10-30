/**
 * @ahaslides-product/design/aha-tooltip — the shared Tooltip primitive.
 *
 *   import '@ahaslides-product/design/aha-tooltip';   // registers <aha-tooltip>
 *   <aha-tooltip text="Copy link"><aha-button icon-only aria-label="Copy">…</aha-button></aha-tooltip>
 *
 * A short, transient hint on mouse hover or keyboard focus (not on click/tap) of its slotted trigger. ONE element, shadow-DOM CSS,
 * themed only by --aha-* tokens → byte-identical in React and Vue. Zero dependencies. The
 * black bubble with an arrow is the single shared tooltip the settings pattern references.
 * The bubble is max-content wide up to its 280px max-width (--aha-tooltip-max-width), then WRAPS — a full-sentence `?` help hint lays out as a compact
 * multi-line bubble instead of one long line.
 *
 * The DS V3 / AntD Tooltip matrix this covers:
 *   `placement` — top | bottom | left | right (centred), PLUS the 8 edge-aligned ones —
 *                 top-start | top-end | bottom-start | bottom-end | left-start | left-end |
 *                 right-start | right-end. An edge-aligned placement sits on the same side but
 *                 aligns the bubble to the start/end edge of the trigger, with the arrow centred on the
 *                 trigger (at least radius + 5px from the bubble corner; a smaller trigger shifts the bubble
 *                 outward past its edge, a wider one clamps the arrow at the far inset); -end mirrors -start. AntD naming.
 *                 `placement` is a preference: on show the bubble is measured against its clipping panel (the nearest
 *                 overflow ancestor, across shadow roots and slots, cut down to the viewport). When that side has no room it
 *                 moves to the opposite side, then the roomier perpendicular side, then slides along that side to stay inside,
 *                 the arrow kept on the trigger. The attribute is never rewritten; the side used is reflected as `data-placement`.
 *   `color`     — dark (default black) | brand (color-primary fill).
 *   `arrow`     — the caret is on by default; `arrow="false"` hides it.
 *   `trigger`   — mouse hover or keyboard focus (default; not on click/tap) | focus | click (toggle).
 *   `open`      — force the bubble visible (demos/measurement); otherwise it shows on trigger.
 *   `size`      — default (12px text, wraps at 280px) | lg, the canvas tooltip: 16px / 400 name on a 24px line, one line
 *                 (no wrap), 6px / 12px padding (36px tall), no drop shadow, a 1px edge of white at 20% that continues round the arrow.
 *   `shortcut`  — size="lg" only: draws the key as a chip after the name ("M", "Esc", "Shift+Enter", "Mod+Enter"; lib/shortcut-key.js),
 *                 24 × 24, 14px / 400 key on a 16% white wash. Display only and aria-hidden: the trigger's own name carries the key.
 *
 * a11y: the bubble is role=tooltip. A slotted trigger lives outside this shadow root, where an
 * aria-describedby id cannot resolve, so the tooltip also keeps a visually hidden copy of the text in its
 * own light DOM (the trigger's tree) and appends that node's id to the trigger's aria-describedby (every
 * engine maps it, unlike aria-description); an author's own ids are kept and only this one is removed. A native
 * control is described directly; an <aha-button> forwards its aria-describedby to its inner button
 * (element reflection); other custom-element triggers do not forward it. The description is skipped when
 * the trigger's name already contains the text, so the name is not read twice. The built-in help button
 * shares the root and points aria-describedby at the bubble. Either way it shows on focus (not just
 * hover), Esc dismisses it, and the pointer can move onto the bubble (WCAG 1.4.13). Show/hide animates on a
 * PERSISTENT node — a class toggles opacity/transform (the subtree is never rebuilt on open, so the transition
 * actually fires — the historic Switch-click MOTION_DEBT trap). Click-away + Esc listeners for the
 * `click` trigger are removed on disconnect (no leaked document listeners).
 *
 *   `help`      — render a built-in `?` help trigger (DS <aha-icon name="system-question">, 16px,
 *                 icon-muted → icon-default on hover/focus) instead of requiring a slotted trigger. It's a real
 *                 focusable <button>, so the tooltip shows on FOCUS as well as hover (not hover-only) —
 *                 the settings-label "?" pattern from the DS V3 "Tooltip question-mark" section. Slot a
 *                 trigger yourself and it wins; `help` is the zero-boilerplate default trigger.
 */
import './icons.js';   // registers <aha-icon> so the built-in `?` help trigger's glyph resolves from the DS library
import { SHORTCUT_CHIP_STYLE, fillShortcutChip } from './shortcut-key.js';

const STYLE = `
  :host{ position:relative; display:inline-flex; font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif) }
  .bubble{ position:absolute; box-sizing:border-box; width:max-content; max-width:var(--aha-tooltip-max-width,280px); padding:6px 10px;
    white-space:normal; overflow-wrap:break-word; text-align:left;
    font-family:inherit; font-size:12px; line-height:18px;
    color:var(--aha-text-inverse,#FFFFFF); background:var(--aha-bg-dark,#1A1A1A);
    border-radius:var(--aha-radius-sm,6px);
    --aha-tip-arrow-min:calc(var(--aha-radius-sm,6px) + 5px);
    --aha-tip-shift-x:min(0px, calc(var(--aha-tip-trigger-w,24px) / 2 - var(--aha-tip-arrow-min)));
    --aha-tip-shift-y:min(0px, calc(var(--aha-tip-trigger-h,24px) / 2 - var(--aha-tip-arrow-min)));
    box-shadow:0 4px 12px rgba(0,0,0,.2);
    opacity:0; visibility:hidden; z-index:10;
    transition:opacity var(--aha-motion-mid,.2s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)), transform var(--aha-motion-mid,.2s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)) }
  .bubble::after{ content:""; position:absolute; box-sizing:border-box; width:7.0711px; height:7.0711px;
    background-color:var(--aha-bg-dark,#1A1A1A); background-clip:padding-box;
    border:0 solid color-mix(in srgb, var(--aha-white,#FFFFFF) 20%, transparent);
    top:calc(100% + var(--aha-tip-edge,0px)); left:50%; transform:translate(-50%,-50%) rotate(45deg);
    border-right-width:var(--aha-tip-edge,0px); border-bottom-width:var(--aha-tip-edge,0px) }
  /* bridges the 8px gap so the pointer can move from the trigger onto the bubble without it closing (WCAG 1.4.13 hoverable) */
  .bubble::before{ content:""; position:absolute; inset:-9px }
  /* the individual translate property composes with transform, so sliding never disturbs the reveal transition */
  .bubble{ translate:var(--aha-tip-nudge,0px 0px) }
  .bubble::after{ translate:var(--aha-tip-arrow-nudge,0px 0px) }

  /* brand fill — color-primary instead of black */
  :host([color="brand"]) .bubble{ background:var(--aha-color-primary,#E70E68) }

  /* placement — top is the default; each sets the position + the resting/entering transform + arrow edge */
  .bubble{ bottom:calc(100% + 8px); left:50%; transform:translateX(-50%) translateY(4px) }

  /* arrow — a square rotated 45deg, centred on the bubble edge (the 1px ring of size lg included), carrying the ring's edge on its two outer sides */
  :host([color="brand"]) .bubble::after{ background-color:var(--aha-color-primary,#E70E68) }
  :host([data-placement="bottom"]) .bubble::after{ top:auto; bottom:calc(100% + var(--aha-tip-edge,0px)); border-width:var(--aha-tip-edge,0px) 0 0 var(--aha-tip-edge,0px) }
  :host([data-placement="left"]) .bubble::after{ top:50%; left:calc(100% + var(--aha-tip-edge,0px)); border-width:var(--aha-tip-edge,0px) var(--aha-tip-edge,0px) 0 0 }
  :host([data-placement="right"]) .bubble::after{ top:50%; left:auto; right:calc(100% + var(--aha-tip-edge,0px)); border-width:0 0 var(--aha-tip-edge,0px) var(--aha-tip-edge,0px) }

  :host([data-placement="bottom"]) .bubble{ top:calc(100% + 8px); bottom:auto; left:50%; transform:translateX(-50%) translateY(-4px) }

  :host([data-placement="left"]) .bubble{ right:calc(100% + 8px); left:auto; bottom:auto; top:50%; transform:translateY(-50%) translateX(4px) }

  :host([data-placement="right"]) .bubble{ left:calc(100% + 8px); bottom:auto; top:50%; transform:translateY(-50%) translateX(-4px) }

  /* ---- edge-aligned placements (DS V3 / AntD): same side, aligned to the trigger's start/end
     edge. The arrow's centre sits on the trigger's centre (--aha-tip-trigger-w/-h, measured on the bubble). It keeps at least
     radius + 5px (the arrow half-width) from the bubble corner; a trigger smaller than twice that shifts the bubble outward past
     the trigger edge instead, and a trigger wider than the bubble clamps the arrow at the far inset. -end mirrors -start.
     Resting transform carries ONLY the directional lift (no centring translate) so the transition keeps its "from". ---- */

  :host([data-placement$="-start"]) .bubble::after, :host([data-placement$="-end"]) .bubble::after{ top:auto; right:auto; bottom:auto; left:auto }
  :host([data-placement^="top-"]) .bubble::after{ top:calc(100% + var(--aha-tip-edge,0px)); border-width:0 var(--aha-tip-edge,0px) var(--aha-tip-edge,0px) 0 }
  :host([data-placement^="bottom-"]) .bubble::after{ bottom:calc(100% + var(--aha-tip-edge,0px)); border-width:var(--aha-tip-edge,0px) 0 0 var(--aha-tip-edge,0px) }
  :host([data-placement^="left-"]) .bubble::after{ left:calc(100% + var(--aha-tip-edge,0px)); border-width:var(--aha-tip-edge,0px) var(--aha-tip-edge,0px) 0 0 }
  :host([data-placement^="right-"]) .bubble::after{ right:calc(100% + var(--aha-tip-edge,0px)); border-width:0 0 var(--aha-tip-edge,0px) var(--aha-tip-edge,0px) }
  :host([data-placement="top-start"]) .bubble::after, :host([data-placement="bottom-start"]) .bubble::after{
    left:clamp(var(--aha-tip-arrow-min), calc(var(--aha-tip-trigger-w,24px) / 2 - var(--aha-tip-shift-x)), calc(100% - var(--aha-tip-arrow-min))) }
  :host([data-placement="top-end"]) .bubble::after, :host([data-placement="bottom-end"]) .bubble::after{
    right:clamp(var(--aha-tip-arrow-min), calc(var(--aha-tip-trigger-w,24px) / 2 - var(--aha-tip-shift-x)), calc(100% - var(--aha-tip-arrow-min))); transform:translate(50%,-50%) rotate(45deg) }
  :host([data-placement="left-start"]) .bubble::after, :host([data-placement="right-start"]) .bubble::after{
    top:clamp(var(--aha-tip-arrow-min), calc(var(--aha-tip-trigger-h,24px) / 2 - var(--aha-tip-shift-y)), calc(100% - var(--aha-tip-arrow-min))) }
  :host([data-placement="left-end"]) .bubble::after, :host([data-placement="right-end"]) .bubble::after{
    bottom:clamp(var(--aha-tip-arrow-min), calc(var(--aha-tip-trigger-h,24px) / 2 - var(--aha-tip-shift-y)), calc(100% - var(--aha-tip-arrow-min))); transform:translate(-50%,50%) rotate(45deg) }

  :host([data-placement="bottom"]) .bubble::after, :host([data-placement="bottom-start"]) .bubble::after{ transform:translate(-50%,50%) rotate(45deg) }
  :host([data-placement="bottom-end"]) .bubble::after{ transform:translate(50%,50%) rotate(45deg) }
  :host([data-placement="right"]) .bubble::after, :host([data-placement="right-start"]) .bubble::after{ transform:translate(50%,-50%) rotate(45deg) }
  :host([data-placement="right-end"]) .bubble::after{ transform:translate(50%,50%) rotate(45deg) }
  :host([data-placement="top-start"]) .bubble{ bottom:calc(100% + 8px); top:auto; left:var(--aha-tip-shift-x); right:auto; transform:translateY(4px) }
  :host([data-placement="top-end"]) .bubble{ bottom:calc(100% + 8px); top:auto; right:var(--aha-tip-shift-x); left:auto; transform:translateY(4px) }
  :host([data-placement="bottom-start"]) .bubble{ top:calc(100% + 8px); bottom:auto; left:var(--aha-tip-shift-x); right:auto; transform:translateY(-4px) }
  :host([data-placement="bottom-end"]) .bubble{ top:calc(100% + 8px); bottom:auto; right:var(--aha-tip-shift-x); left:auto; transform:translateY(-4px) }
  :host([data-placement="left-start"]) .bubble{ right:calc(100% + 8px); left:auto; top:var(--aha-tip-shift-y); bottom:auto; transform:translateX(4px) }
  :host([data-placement="left-end"]) .bubble{ right:calc(100% + 8px); left:auto; bottom:var(--aha-tip-shift-y); top:auto; transform:translateX(4px) }
  :host([data-placement="right-start"]) .bubble{ left:calc(100% + 8px); right:auto; top:var(--aha-tip-shift-y); bottom:auto; transform:translateX(-4px) }
  :host([data-placement="right-end"]) .bubble{ left:calc(100% + 8px); right:auto; bottom:var(--aha-tip-shift-y); top:auto; transform:translateX(-4px) }


  /* arrow toggle */
  :host([arrow="false"]) .bubble::after{ display:none }

  /* shown — driven by a class on the persistent node (hover/focus CSS + the .open JS state) */
  :host([data-hover]) .bubble, :host([data-focus]) .bubble, :host([open]) .bubble, .bubble.open{
    opacity:1; visibility:visible; transform:translateX(-50%) translateY(0) }
  :host([data-placement="left"][data-hover]) .bubble, :host([data-placement="left"][data-focus]) .bubble, :host([data-placement="left"][open]) .bubble, :host([data-placement="left"]) .bubble.open,
  :host([data-placement="right"][data-hover]) .bubble, :host([data-placement="right"][data-focus]) .bubble, :host([data-placement="right"][open]) .bubble, :host([data-placement="right"]) .bubble.open{
    transform:translateY(-50%) translateX(0) }
  /* edge-aligned shown state — no centring translate, just settle the directional lift to 0 */
  :host([data-placement^="top-"][data-hover]) .bubble, :host([data-placement^="top-"][data-focus]) .bubble, :host([data-placement^="top-"][open]) .bubble, :host([data-placement^="top-"]) .bubble.open,
  :host([data-placement^="bottom-"][data-hover]) .bubble, :host([data-placement^="bottom-"][data-focus]) .bubble, :host([data-placement^="bottom-"][open]) .bubble, :host([data-placement^="bottom-"]) .bubble.open,
  :host([data-placement^="left-"][data-hover]) .bubble, :host([data-placement^="left-"][data-focus]) .bubble, :host([data-placement^="left-"][open]) .bubble, :host([data-placement^="left-"]) .bubble.open,
  :host([data-placement^="right-"][data-hover]) .bubble, :host([data-placement^="right-"][data-focus]) .bubble, :host([data-placement^="right-"][open]) .bubble, :host([data-placement^="right-"]) .bubble.open{
    transform:translate(0,0) }
  /* click trigger: suppress the hover/focus reveal — only the .open class shows it */
  :host([trigger="click"][data-hover]) .bubble, :host([trigger="click"][data-focus]) .bubble{ opacity:0; visibility:hidden }
  :host([trigger="click"]) .bubble.open{ opacity:1; visibility:visible }
  /* focus-only trigger: suppress hover reveal */
  :host([trigger="focus"][data-hover]) .bubble{ opacity:0; visibility:hidden }
  :host([trigger="focus"][data-focus]) .bubble{ opacity:1; visibility:visible }
  /* Esc dismissed it; it returns once the pointer and focus have both left */
  :host([data-dismissed]:not([open])) .bubble:not(.open){ opacity:0; visibility:hidden }

  /* ---- built-in help trigger (help attribute) — a focusable button carrying a DS aha-icon.
     16px, --aha-icon-muted at rest, --aha-icon-default on hover/focus; colour animates via the shared motion tokens on this
     PERSISTENT node (never rebuilt on state). Shown only when help is set (the slot is hidden). ---- */
  .help{ display:none }
  :host([help]) .help{ display:inline-flex; align-items:center; justify-content:center;
    box-sizing:border-box; padding:0; border:0; background:transparent; cursor:help;
    color:var(--aha-icon-muted,#8A8A8A); border-radius:var(--aha-radius-pill,999px);
    transition:color var(--aha-motion-fast,.12s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)) }
  :host([help]) ::slotted(*){ display:none }
  :host([help]) .help:hover, :host([help]) .help:focus-visible{ color:var(--aha-icon-default,#4A4A4A) }
  :host([help]) .help:focus-visible{ outline:2px solid var(--aha-color-primary,#E70E68); outline-offset:2px }

  :host([size="lg"]) .bubble{ display:inline-flex; align-items:center; gap:var(--aha-space-8,8px); max-width:none; white-space:nowrap;
    padding:var(--aha-space-6,6px) var(--aha-space-12,12px); font-size:var(--aha-size-l,16px); line-height:24px;
    --aha-tip-edge:1px;
    box-shadow:0 0 0 1px color-mix(in srgb, var(--aha-white,#FFFFFF) 20%, transparent) }
  :host([size="lg"]) .bubble.with-shortcut{ padding-inline-end:var(--aha-space-6,6px) }
${SHORTCUT_CHIP_STYLE}
  @media (prefers-reduced-motion: reduce){ *{ transition:none !important } }
`;

let TIP_SEQ = 0;
const GAP = 8;
const OPPOSITE = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' };
const clamp = (value, low, high) => Math.min(Math.max(value, low), Math.max(low, high));
const flatParent = (node) => node.assignedSlot || node.parentElement || (node.parentNode && node.parentNode.host) || null;

// Walks the flat tree (slots, shadow hosts) so a tooltip slotted into another component still finds that component's clipping panel.
function clipBox(host) {
  const box = { top: 0, left: 0, right: document.documentElement.clientWidth, bottom: window.innerHeight };
  for (let node = flatParent(host); node && node !== document.body && node !== document.documentElement; node = flatParent(node)) {
    const style = getComputedStyle(node);
    if (style.display !== 'contents' && style.display !== 'inline') {
      const rect = node.getBoundingClientRect();
      if (style.overflowX !== 'visible') {
        box.left = Math.max(box.left, rect.left + node.clientLeft);
        box.right = Math.min(box.right, rect.left + node.clientLeft + node.clientWidth);
      }
      if (style.overflowY !== 'visible') {
        box.top = Math.max(box.top, rect.top + node.clientTop);
        box.bottom = Math.min(box.bottom, rect.top + node.clientTop + node.clientHeight);
      }
    }
    if (style.position === 'fixed') break;
  }
  return box;
}
const DESCRIPTION_SLOT = 'aha-tooltip-description';
const VISUALLY_HIDDEN = 'position:absolute;width:1px;height:1px;margin:-1px;padding:0;border:0;overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap';

export class AhaTooltip extends HTMLElement {
  static get observedAttributes() { return ['text', 'open', 'placement', 'color', 'arrow', 'trigger', 'help', 'size', 'shortcut']; }
  connectedCallback() {
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    // `help`-variant defaults: the settings-label "?" glyph opens BELOW aligned to its start edge
    // (so it clears the panel top) and drops the caret — both baked here before build/sync, and both
    // still overridable per instance (an author-set placement/arrow wins).
    if (this.hasAttribute('help')) {
      if (!this.hasAttribute('placement')) this.setAttribute('placement', 'bottom-start');
      if (!this.hasAttribute('arrow')) this.setAttribute('arrow', 'false');
    }
    if (!this._bubble) this._build();
    this._sync();
    this._bindTrigger();
    if (!this._revealBound) this._bindReveal();
    document.addEventListener('keydown', this._onEscape, true);
    if (this._resizeObserver) this._resizeObserver.observe(this);
    this._measureTrigger();
    this._place();
  }
  _measureTrigger() {
    this._bubble.style.setProperty('--aha-tip-trigger-w', this.offsetWidth + 'px');
    this._bubble.style.setProperty('--aha-tip-trigger-h', this.offsetHeight + 'px');
  }
  disconnectedCallback() {
    if (this._resizeObserver) this._resizeObserver.disconnect();
    // no leaked document listeners
    if (this._onDocDown) document.removeEventListener('pointerdown', this._onDocDown, true);
    if (this._onKey) document.removeEventListener('keydown', this._onKey, true);
    if (this._onClick) this.removeEventListener('click', this._onClick);
    document.removeEventListener('keydown', this._onEscape, true);
    // a node detached while hovered or focused gets no pointerleave/focusout, so it would reattach still showing
    this.removeAttribute('data-hover');
    this.removeAttribute('data-focus');
    this.removeAttribute('data-dismissed');
    this._undescribe();
  }
  attributeChangedCallback(name) {
    if (!this._bubble) return;
    this._sync();
    if (name === 'trigger') this._bindTrigger();
    if (this.isConnected) this._place();
  }

  // `placement` is never rewritten so the author's preference survives every reposition; the CSS reads data-placement.
  _place() {
    const bubble = this._bubble;
    const [requestedSide, requestedAlign] = (this.getAttribute('placement') || 'top').split('-');
    const preferredSide = OPPOSITE[requestedSide] ? requestedSide : 'top';
    const preferredAlign = requestedAlign === 'start' || requestedAlign === 'end' ? requestedAlign : '';
    bubble.style.removeProperty('--aha-tip-nudge');
    bubble.style.removeProperty('--aha-tip-arrow-nudge');
    const width = bubble.offsetWidth, height = bubble.offsetHeight;
    if (!width || !height) {
      this.setAttribute('data-placement', preferredAlign ? preferredSide + '-' + preferredAlign : preferredSide);
      return;
    }
    const anchor = this.getBoundingClientRect();
    const box = clipBox(this);
    const room = { top: anchor.top - box.top - GAP, bottom: box.bottom - anchor.bottom - GAP, left: anchor.left - box.left - GAP, right: box.right - anchor.right - GAP };
    const isVertical = (side) => side === 'top' || side === 'bottom';
    const spare = (side) => room[side] - (isVertical(side) ? height : width);
    const perpendicular = isVertical(preferredSide) ? ['left', 'right'] : ['top', 'bottom'];
    perpendicular.sort((first, second) => spare(second) - spare(first));
    const order = [preferredSide, OPPOSITE[preferredSide], ...perpendicular];
    const side = order.find((candidate) => spare(candidate) >= 0) || order.reduce((best, candidate) => (spare(candidate) > spare(best) ? candidate : best));
    const align = isVertical(side) === isVertical(preferredSide) ? preferredAlign : '';
    this.setAttribute('data-placement', align ? side + '-' + align : side);

    const vertical = isVertical(side);
    const triggerStart = vertical ? anchor.left : anchor.top;
    const triggerSize = vertical ? anchor.width : anchor.height;
    const size = vertical ? width : height;
    const arrowMin = (parseFloat(getComputedStyle(bubble).borderTopLeftRadius) || 0) + 5;
    const outward = Math.min(0, triggerSize / 2 - arrowMin);
    const start = align === 'start' ? triggerStart + outward
      : align === 'end' ? triggerStart + triggerSize - outward - size
      : triggerStart + (triggerSize - size) / 2;
    const nudge = clamp(start, vertical ? box.left : box.top, (vertical ? box.right : box.bottom) - size) - start;
    if (!nudge) return;
    const arrowAt = triggerStart + triggerSize / 2 - start;
    const arrowFrom = align ? clamp(arrowAt, arrowMin, size - arrowMin) : size / 2;
    const arrowNudge = clamp(arrowAt - nudge, arrowMin, size - arrowMin) - arrowFrom;
    bubble.style.setProperty('--aha-tip-nudge', vertical ? `${nudge}px 0px` : `0px ${nudge}px`);
    bubble.style.setProperty('--aha-tip-arrow-nudge', vertical ? `${arrowNudge}px 0px` : `0px ${arrowNudge}px`);
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
      `<style>${STYLE}</style><slot></slot><slot name="${DESCRIPTION_SLOT}"></slot>` +
      `<button class="help" part="help" type="button" tabindex="0" aria-label="More info">` +
      `<aha-icon name="system-question" size="16" decorative></aha-icon></button>` +
      `<span class="bubble" part="bubble" role="tooltip" id="${this._id}"><kbd class="shortcut" part="shortcut" aria-hidden="true" hidden></kbd></span>`));
    this._bubble = this.shadowRoot.querySelector('.bubble');
    this._name = document.createTextNode('');
    this._bubble.prepend(this._name);
    this._shortcut = this._bubble.querySelector('.shortcut');
    this._help = this.shadowRoot.querySelector('.help');
    if (typeof ResizeObserver !== 'undefined') {
      this._resizeObserver = new ResizeObserver(() => { this._measureTrigger(); this._place(); });
    }
    const slot = this.shadowRoot.querySelector('slot');
    slot.addEventListener('slotchange', () => this._describe());
  }
  _describe() {
    // help mode → the built-in button IS the trigger; otherwise the slotted trigger
    if (this.hasAttribute('help')) { this._undescribe(); if (this._help) this._help.setAttribute('aria-describedby', this._id); return; }
    const trigger = this._findTrigger();
    if (this._describedTrigger && this._describedTrigger !== trigger) this._undescribe();
    const text = this.getAttribute('text');
    if (!trigger || !text || this._nameCarries(trigger, text)) { this._undescribe(); return; }
    if (!this._description) {
      this._description = document.createElement('span');
      this._description.id = this._id + '-description';
      this._description.slot = DESCRIPTION_SLOT;
      this._description.style.cssText = VISUALLY_HIDDEN;
    }
    this._description.textContent = text;
    if (this._description.parentNode !== this) this.append(this._description);
    this._describedTrigger = trigger;
    const ids = (trigger.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean);
    if (!ids.includes(this._description.id)) trigger.setAttribute('aria-describedby', [...ids, this._description.id].join(' '));
  }
  _undescribe() {
    const trigger = this._describedTrigger;
    this._describedTrigger = null;
    if (trigger && this._description) {
      const ids = (trigger.getAttribute('aria-describedby') || '').split(/\s+/).filter((id) => id && id !== this._description.id);
      if (ids.length) trigger.setAttribute('aria-describedby', ids.join(' '));
      else trigger.removeAttribute('aria-describedby');
    }
    if (this._description) this._description.remove();
  }
  _findTrigger() {
    const own = this._description;
    const focusable = [...this.querySelectorAll('button,a,input,select,textarea,[tabindex],[role]')].find((el) => el !== own);
    return focusable || [...this.children].find((el) => el !== own) || null;
  }
  _nameCarries(el, text) {
    const name = (el.getAttribute('aria-label') || el.textContent || '').trim().toLowerCase();
    return name.includes(text.trim().toLowerCase());
  }
  _sync() {
    this._name.data = this.getAttribute('text') || '';
    const pieces = fillShortcutChip(this._shortcut, this.getAttribute('shortcut'));
    this._bubble.classList.toggle('with-shortcut', pieces.length > 0);
    this._describe();
  }

  _onEscape = (event) => {
    if (event.key === 'Escape' && (this.hasAttribute('data-hover') || this.hasAttribute('data-focus'))) this.setAttribute('data-dismissed', '');
  };
  _endReveal(attribute) {
    this.removeAttribute(attribute);
    if (!this.hasAttribute('data-hover') && !this.hasAttribute('data-focus')) this.removeAttribute('data-dismissed');
  }
  _bindReveal() {
    this._revealBound = true;
    this.addEventListener('pointerenter', (event) => { if (event.pointerType !== 'touch') { this._place(); this.setAttribute('data-hover', ''); } });
    this.addEventListener('pointerleave', () => this._endReveal('data-hover'));
    this.addEventListener('focusin', (event) => {
      const path = event.composedPath();
      this._place();
      this.toggleAttribute('data-focus', this.getAttribute('trigger') === 'focus' || path[0].matches(':focus-visible'));
    });
    this.addEventListener('focusout', () => this._endReveal('data-focus'));
  }

  // ---- click trigger: toggle .open, dismiss on click-away / Esc (persistent-node class) --------
  _bindTrigger() {
    const isClick = this.getAttribute('trigger') === 'click';
    if (this._onClick) this.removeEventListener('click', this._onClick);
    if (this._onDocDown) document.removeEventListener('pointerdown', this._onDocDown, true);
    if (this._onKey) document.removeEventListener('keydown', this._onKey, true);
    if (!isClick) { this._bubble.classList.remove('open'); return; }
    this._onClick = (event) => {
      if (event.composedPath().includes(this._bubble)) return;
      this._place();
      this._bubble.classList.toggle('open');
    };
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
