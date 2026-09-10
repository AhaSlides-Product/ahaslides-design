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

  .pop{ position:absolute; z-index:20; min-width:180px; max-width:280px; box-sizing:border-box; padding:12px 16px;
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

  @media (prefers-reduced-motion: reduce){ *{ transition:none !important } }
`;

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
    if (name === 'open') this._syncExpanded();
    else this._fill();   // title/content change → refill the persistent nodes (no panel rebuild)
  }
  disconnectedCallback() {
    document.removeEventListener('click', this._onDoc);
    document.removeEventListener('keydown', this._onKey);
  }

  // ---- render: build the panel ONCE (persistent); text is refilled in place ------------
  _render() {
    // Built ONCE via clear+append (not innerHTML=/replaceChildren) — the `open` toggle only flips
    // the host attribute on this persistent panel, so its show/hide transition keeps its "from".
    while (this.shadowRoot.firstChild) this.shadowRoot.removeChild(this.shadowRoot.firstChild);
    this.shadowRoot.append(document.createRange().createContextualFragment(
      `<style>${STYLE}</style>` +
      `<span class="trigger" part="trigger"><slot name="trigger"></slot></span>` +
      `<div class="pop" part="panel" role="dialog" aria-modal="false">` +
        `<span class="arrow" part="arrow" aria-hidden="true"></span>` +
        `<div class="title" part="title"></div>` +
        `<div class="body" part="body"><slot></slot></div>` +
      `</div>`));
    this._fill();
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

    // outside-click + Escape close (click trigger); listeners removed on disconnect
    this._onDoc = (e) => { if (this.open && this.trigger === 'click' && !this.contains(e.target)) this._set(false); };
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
