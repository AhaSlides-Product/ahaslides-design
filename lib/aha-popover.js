/**
 * @ahaslides-product/design/aha-popover — the shared Popover primitive.
 *
 *   import '@ahaslides-product/design/aha-popover';   // registers <aha-popover>
 *   <aha-popover placement="bottom" trigger="click" arrow title="Share this deck">
 *     <button slot="trigger">Options</button>
 *     <div>Rich floating content…</div>
 *   </aha-popover>
 *
 * A floating card anchored to its trigger — richer than a Tooltip (it holds interactive content and a
 * `title`). The DS V3 Popover is a family: a `title` + `content` (unlike the Tooltip's plain hint),
 * twelve `placement`s (the 4 cardinal top/bottom/left/right PLUS the 8 edge-aligned ones —
 * top-start/top-end/bottom-start/bottom-end/left-start/left-end/right-start/right-end, AntD naming:
 * same side, but aligned to the trigger's start/end edge with the arrow offset near that edge),
 * three `trigger`s (click · hover · focus) and a toggleable `arrow`. Content comes from the default
 * slot OR the `content` attribute; `title` renders a bold header.
 *
 * ONE element, shadow-DOM CSS, themed only by --aha-* tokens → byte-identical in React and Vue. Zero
 * dependencies. Open/close toggles the `open` attribute on a PERSISTENT panel (never rebuilt on the
 * state change), so opacity + lift animate via the shared motion tokens. role="dialog" panel wired to
 * the trigger via aria-haspopup/aria-expanded; on a click trigger, Escape closes and focus returns to
 * the trigger. Global document listeners are removed on disconnect. Emits composed `open`/`close`.
 */
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const STYLE = `
  :host{ display:inline-block; position:relative; font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif) }
  .trigger{ display:inline-flex }
  .probe{ position:fixed; top:0; left:0; width:0; height:0; pointer-events:none; visibility:hidden }

  .pop{ position:absolute; z-index:20; min-width:180px; max-width:min(280px,calc(100vw - 16px)); box-sizing:border-box; padding:12px 16px;
    background:var(--aha-bg-elevated,#FFFFFF); color:var(--aha-text-default,#1A1A1A);
    border:1px solid var(--aha-border,#E3E3E3); border-radius:var(--aha-radius-default,8px);
    box-shadow:0 6px 16px rgba(26,26,46,.12); font-size:14px; line-height:21px;
    opacity:0; visibility:hidden; transform:translateY(-4px);
    transition:opacity var(--aha-motion-mid,.2s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)), transform var(--aha-motion-mid,.2s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)), visibility var(--aha-motion-mid,.2s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)) }
  :host([open]) .pop{ opacity:1; visibility:visible; transform:translate(0,0) }

  /* title — a bold header above the content */
  .title{ font-weight:600; font-size:14px; line-height:21px; color:var(--aha-text-default,#1A1A1A); margin-bottom:6px }
  .title:empty{ display:none }
  .body{ color:var(--aha-text-secondary,#4A4A4A) }
  .title:empty + .body{ color:var(--aha-text-default,#1A1A1A) }

  /* ---- placement (offset from the trigger, resting transform is the enter direction) ---- */
  :host([placement="bottom"]) .pop{ top:calc(100% + 8px); left:0 }
  :host([placement="top"]) .pop{ bottom:calc(100% + 8px); left:0; transform:translateY(4px) }
  :host([placement="right"]) .pop{ left:calc(100% + 8px); top:0; transform:translateX(-4px) }
  :host([placement="left"]) .pop{ right:calc(100% + 8px); top:0; transform:translateX(4px) }

  /* ---- edge-aligned placements (DS V3 / AntD): same side, aligned to the trigger's start/end
     edge; the resting transform matches the side's enter direction so the open transition (which
     resets every .pop to translate(0,0)) keeps its "from". ---- */
  :host([placement="bottom-start"]) .pop{ top:calc(100% + 8px); bottom:auto; left:0; right:auto; transform:translateY(-4px) }
  :host([placement="bottom-end"]) .pop{ top:calc(100% + 8px); bottom:auto; right:0; left:auto; transform:translateY(-4px) }
  :host([placement="top-start"]) .pop{ bottom:calc(100% + 8px); top:auto; left:0; right:auto; transform:translateY(4px) }
  :host([placement="top-end"]) .pop{ bottom:calc(100% + 8px); top:auto; right:0; left:auto; transform:translateY(4px) }
  :host([placement="right-start"]) .pop{ left:calc(100% + 8px); right:auto; top:0; bottom:auto; transform:translateX(-4px) }
  :host([placement="right-end"]) .pop{ left:calc(100% + 8px); right:auto; bottom:0; top:auto; transform:translateX(-4px) }
  :host([placement="left-start"]) .pop{ right:calc(100% + 8px); left:auto; top:0; bottom:auto; transform:translateX(4px) }
  :host([placement="left-end"]) .pop{ right:calc(100% + 8px); left:auto; bottom:0; top:auto; transform:translateX(4px) }

  /* ---- arrow — a persistent rotated square peeking from the panel edge ---- */
  .arrow{ position:absolute; width:8px; height:8px; background:var(--aha-bg-elevated,#FFFFFF);
    border:1px solid var(--aha-border,#E3E3E3); display:none; transform:rotate(45deg) }
  :host([arrow]) .arrow{ display:block }
  :host([placement="bottom"]) .arrow{ top:-5px; left:16px; border-right:0; border-bottom:0 }
  :host([placement="top"]) .arrow{ bottom:-5px; left:16px; border-left:0; border-top:0 }
  :host([placement="right"]) .arrow{ left:-5px; top:14px; border-right:0; border-top:0 }
  :host([placement="left"]) .arrow{ right:-5px; top:14px; border-left:0; border-bottom:0 }

  /* edge-aligned arrows — same edge chrome as the cardinal side, offset near the start/end edge */
  :host([placement="bottom-start"]) .arrow{ top:-5px; left:16px; right:auto; border-right:0; border-bottom:0 }
  :host([placement="bottom-end"]) .arrow{ top:-5px; right:16px; left:auto; border-right:0; border-bottom:0 }
  :host([placement="top-start"]) .arrow{ bottom:-5px; left:16px; right:auto; border-left:0; border-top:0 }
  :host([placement="top-end"]) .arrow{ bottom:-5px; right:16px; left:auto; border-left:0; border-top:0 }
  :host([placement="right-start"]) .arrow{ left:-5px; top:14px; bottom:auto; border-right:0; border-top:0 }
  :host([placement="right-end"]) .arrow{ left:-5px; bottom:14px; top:auto; border-right:0; border-top:0 }
  :host([placement="left-start"]) .arrow{ right:-5px; top:14px; bottom:auto; border-left:0; border-bottom:0 }
  :host([placement="left-end"]) .arrow{ right:-5px; bottom:14px; top:auto; border-left:0; border-bottom:0 }

  /* ---- collision flip: _place() sets data-flipped to the side the panel actually opened on. The
     arrow moves to the opposite panel edge and the resting transform keeps that side's enter direction. ---- */
  :host([data-flipped="top"]) .arrow{ top:auto; bottom:-5px; border-width:0 1px 1px 0 }
  :host([data-flipped="bottom"]) .arrow{ bottom:auto; top:-5px; border-width:1px 0 0 1px }
  :host([data-flipped="left"]) .arrow{ left:auto; right:-5px; border-width:1px 1px 0 0 }
  :host([data-flipped="right"]) .arrow{ right:auto; left:-5px; border-width:0 0 1px 1px }
  :host([data-flipped="top"]) .pop{ transform:translateY(4px) }
  :host([data-flipped="bottom"]) .pop{ transform:translateY(-4px) }
  :host([data-flipped="left"]) .pop{ transform:translateX(4px) }
  :host([data-flipped="right"]) .pop{ transform:translateX(-4px) }
  :host([open][data-flipped]) .pop{ transform:translate(0,0) }

  @media (prefers-reduced-motion: reduce){ *{ transition:none !important } }
`;
const EDGE = 8;
const GAP = 8;
const clamp = (value, min, max) => Math.max(min, Math.min(value, max));

export class AhaPopover extends HTMLElement {
  static get observedAttributes() { return ['open', 'title', 'content']; }
  get open() { return this.hasAttribute('open'); }
  set open(v) { v ? this.setAttribute('open', '') : this.removeAttribute('open'); }
  get trigger() { return this.getAttribute('trigger') || 'click'; }

  connectedCallback() {
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    if (!this.hasAttribute('placement')) this.setAttribute('placement', 'bottom');
    this._render();
    this._wire();
  }
  attributeChangedCallback(name) {
    if (!this.shadowRoot) return;
    if (name === 'open') { this._syncExpanded(); this._trackPlacement(this.open); }
    else this._fill();   // title/content change → refill the persistent nodes (no panel rebuild)
  }
  disconnectedCallback() {
    document.removeEventListener('click', this._onDoc);
    document.removeEventListener('keydown', this._onKey);
    this._trackPlacement(false);
  }

  // ---- render: build the panel ONCE (persistent); text is refilled in place ------------
  _render() {
    // Built ONCE via clear+append (not innerHTML=/replaceChildren) — the `open` toggle only flips
    // the host attribute on this persistent panel, so its show/hide transition keeps its "from".
    while (this.shadowRoot.firstChild) this.shadowRoot.removeChild(this.shadowRoot.firstChild);
    this.shadowRoot.append(document.createRange().createContextualFragment(
      `<style>${STYLE}</style>` +
      `<span class="probe" aria-hidden="true"></span>` +
      `<span class="trigger" part="trigger"><slot name="trigger"></slot></span>` +
      `<div class="pop" part="panel" role="dialog" aria-modal="false">` +
        `<span class="arrow" part="arrow" aria-hidden="true"></span>` +
        `<div class="title" part="title"></div>` +
        `<div class="body" part="body"><slot></slot></div>` +
      `</div>`));
    this._fill();
    if (this.open) this._trackPlacement(true);
  }

  // The panel is placed with position:fixed from measured rects so it flips to the roomier side and
  // stays inside the viewport, and an overflow:hidden/auto ancestor cannot clip it. A transformed,
  // filtered or contain:paint ancestor becomes the fixed containing block — the probe cancels its offset —
  // but still clips overflow, which no CSS-only popover can avoid.
  _trackPlacement(on) {
    if (on && !this._tracking) {
      this._tracking = true;
      this._schedulePlace = () => {
        if (this._placeFrame) return;
        this._placeFrame = requestAnimationFrame(() => { this._placeFrame = 0; this._place(); });
      };
      window.addEventListener('resize', this._schedulePlace);
      window.addEventListener('scroll', this._schedulePlace, true);
      if (typeof ResizeObserver !== 'undefined') {
        this._resizeObserver = new ResizeObserver(this._schedulePlace);
        this._resizeObserver.observe(this.shadowRoot.querySelector('.pop'));
      }
      this._place();
    } else if (!on && this._tracking) {
      this._tracking = false;
      window.removeEventListener('resize', this._schedulePlace);
      window.removeEventListener('scroll', this._schedulePlace, true);
      if (this._resizeObserver) { this._resizeObserver.disconnect(); this._resizeObserver = null; }
      cancelAnimationFrame(this._placeFrame);
      this._placeFrame = 0;
    }
  }
  _place() {
    const pop = this.shadowRoot.querySelector('.pop');
    const arrow = this.shadowRoot.querySelector('.arrow');
    const probe = this.shadowRoot.querySelector('.probe');
    if (!pop || !probe) return;
    const [preferred, align] = (this.getAttribute('placement') || 'bottom').split('-');
    const anchor = this.getBoundingClientRect();
    const width = pop.offsetWidth, height = pop.offsetHeight;
    const viewportWidth = document.documentElement.clientWidth, viewportHeight = window.innerHeight;
    const vertical = preferred === 'top' || preferred === 'bottom';
    let side = preferred, top, left;
    if (vertical) {
      const below = viewportHeight - anchor.bottom - GAP - EDGE, above = anchor.top - GAP - EDGE;
      if (preferred === 'bottom' && height > below && above > below) side = 'top';
      else if (preferred === 'top' && height > above && below > above) side = 'bottom';
      top = side === 'bottom' ? anchor.bottom + GAP : anchor.top - GAP - height;
      left = align === 'end' ? anchor.right - width : anchor.left;
    } else {
      const after = viewportWidth - anchor.right - GAP - EDGE, before = anchor.left - GAP - EDGE;
      if (preferred === 'right' && width > after && before > after) side = 'left';
      else if (preferred === 'left' && width > before && after > before) side = 'right';
      left = side === 'right' ? anchor.right + GAP : anchor.left - GAP - width;
      top = align === 'end' ? anchor.bottom - height : anchor.top;
    }
    top = clamp(top, EDGE, Math.max(EDGE, viewportHeight - height - EDGE));
    left = clamp(left, EDGE, Math.max(EDGE, viewportWidth - width - EDGE));
    const origin = probe.getBoundingClientRect();
    Object.assign(pop.style, { position: 'fixed', top: `${top - origin.top}px`, left: `${left - origin.left}px`, right: 'auto', bottom: 'auto' });
    if (side !== preferred) this.setAttribute('data-flipped', side); else this.removeAttribute('data-flipped');
    if (vertical) arrow.style.left = `${clamp(anchor.left + anchor.width / 2 - left - 4, 12, Math.max(12, width - 20))}px`;
    else arrow.style.top = `${clamp(anchor.top + anchor.height / 2 - top - 4, 12, Math.max(12, height - 20))}px`;
    if (vertical) arrow.style.right = 'auto'; else arrow.style.bottom = 'auto';
  }
  _fill() {
    const t = this.shadowRoot.querySelector('.title');
    const body = this.shadowRoot.querySelector('.body');
    if (t) t.textContent = this.getAttribute('title') || '';
    // `content` attr is an alternative to slotted content — only inject when there's no slotted child
    const slot = body && body.querySelector('slot');
    const hasSlotted = slot && slot.assignedNodes && slot.assignedNodes().length;
    if (body && this.hasAttribute('content') && !hasSlotted) {
      body.textContent = this.getAttribute('content');   // textContent escapes — no innerHTML= (rebuild-path) needed
    }
    const t2 = this.getAttribute('title');
    const pop = this.shadowRoot.querySelector('.pop');
    if (pop) pop.setAttribute('aria-label', t2 || 'More information');
  }

  // ---- wiring: trigger interaction + global listeners ---------------------------------
  _wire() {
    const trigger = this.shadowRoot.querySelector('.trigger');
    const mode = this.trigger;
    if (mode === 'hover') {
      this.addEventListener('mouseenter', () => this._set(true));
      this.addEventListener('mouseleave', () => this._set(false));
      trigger.addEventListener('focusin', () => this._set(true));
      trigger.addEventListener('focusout', () => this._set(false));
    } else if (mode === 'focus') {
      trigger.addEventListener('focusin', () => this._set(true));
      trigger.addEventListener('focusout', () => this._set(false));
    } else {
      trigger.addEventListener('click', (e) => { e.stopPropagation(); this._toggle(); });
    }
    trigger.setAttribute('aria-haspopup', 'dialog');
    this._syncExpanded();

    // outside-click + Escape close (click trigger); listeners removed on disconnect.
    // composedPath (not contains): a click inside the panel is retargeted to the shadow host when the
    // popover is nested in another element's shadow root, so contains() would read it as "outside".
    this._onDoc = (e) => { if (this.open && this.trigger === 'click' && !e.composedPath().includes(this)) this._set(false); };
    this._onKey = (e) => {
      if (e.key === 'Escape' && this.open && this.trigger === 'click') { this._set(false); this._focusTrigger(); }
    };
    document.addEventListener('click', this._onDoc);
    document.addEventListener('keydown', this._onKey);
  }
  _syncExpanded() {
    const trigger = this.shadowRoot && this.shadowRoot.querySelector('.trigger');
    if (trigger) trigger.setAttribute('aria-expanded', String(this.open));
  }
  _focusTrigger() {
    const slot = this.shadowRoot.querySelector('.trigger slot');
    const el = slot && slot.assignedElements && slot.assignedElements()[0];
    if (el && el.focus) el.focus();
  }

  _toggle() { this._set(!this.open); }
  _set(next) {
    if (next === this.open) return;
    this.open = next;   // reflects → attributeChangedCallback syncs aria-expanded
    this.dispatchEvent(new CustomEvent(next ? 'open' : 'close', { bubbles: true, composed: true }));
  }
}

export function defineAhaPopover(tag = 'aha-popover') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaPopover);
  return true;
}
if (typeof window !== 'undefined') defineAhaPopover();

export default { AhaPopover, defineAhaPopover };
