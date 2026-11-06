/**
 * @ahaslides-product/design/aha-paywall — the shared Paywall / upsell surface.
 *
 *   import '@ahaslides-product/design/aha-paywall';   // registers <aha-paywall>
 *   <aha-paywall feature-key="streak_bonus" feature-label="Streak answer bonus point"
 *                body="Give bonus points to participants who answer correctly several times in a row." required-plan="pro">
 *     <button>Streak bonus</button>          <!-- the gated affordance (optional anchor) -->
 *   </aha-paywall>
 *
 * EVERY pro-gated affordance routes through this ONE element, so the two products feel like one.
 * You provide the feature + copy + plan; the element renders the compliant upsell — the upgrade
 * mark (Vivid Pink circle crown, NOT a generic crown glyph), the title, the one-sentence body, the
 * fixed "Unlock with the <Plan> plan." line, and the Upgrade CTA are BAKED IN; See all plans is opt-in (`show-plans`). A hand-rolled
 * upgrade modal/tooltip is the drift this replaces.
 *
 * TWO surfaces baked in (Figma Upgrade-mark 3881:9022 · Popover 3881:9078):
 *   • the upgrade mark — a small focusable crown control (states Default/Hover/Active) that sits
 *     beside a Pro-gated setting; it is the anchor when there's no slotted affordance;
 *   • the rich popover on the dark grey surface — crown + title, description, the fixed unlock
 *     line, then the Upgrade button (positive, Vivid Pink) and, with `show-plans`, See all plans (secondary). Both buttons
 *     REUSE the shared <aha-button> primitive — never hand-rolled.
 *
 * Anchor: the slotted child is the clickable anchor; with no child, the upgrade mark is the anchor
 * (a focusable role="button" with an accessible name). Analytics is the DS contract as composed
 * CustomEvents:
 *   `paywall-shown`   — on open, detail { feature, plan }
 *   `paywall-upgrade` — on Upgrade click BEFORE navigation, detail { feature, plan }; cancelable —
 *                       preventDefault() to run your own upgrade flow instead of opening pricing.
 *   `paywall-plans`   — on "See all plans" click BEFORE navigation (only with `show-plans`), detail { feature, plan };
 *                       cancelable — preventDefault() to route to your own pricing surface.
 *
 * ONE element, shadow-DOM CSS, themed only by --aha-* tokens. The crown is the shared DS icon
 * called BY NAME (<aha-icon name="system-crown-badge-fill">) — never an inline <svg>. The
 * CTAs are <aha-button> — the shared Button primitive, not hand-rolled.
 *
 * `show-plans` (opt-in, boolean): renders the See all plans button beside Upgrade; absent (default) the footer is Upgrade alone.
 * `plans-label` and `plans-url` only apply with `show-plans`.
 *
 * `unlock-label` (opt-in): the whole unlock line, translated. `{plan}` inside it is replaced by the plan name in bold
 * (`unlock-label="Mở khoá với gói {plan}."`); with no `{plan}` the line renders as plain text. `plan-label` (opt-in):
 * the displayed plan name instead of "Pro plan" / "Essential plan". Values are set as text, never as HTML.
 *
 * `align` (opt-in): center (default) | start | end — which edge of the popover sits on the anchor. fitPaywall(el) picks align + placement from the room around the anchor and keeps the popover inside the viewport.
 *
 * `placement` (opt-in): top (default) | bottom | left | right. left/right hang the popover beside the anchor,
 * vertically centred on it; `align` applies to top/bottom only.
 * `width` (opt-in): the popover's outer width, padding included, as a CSS length (a bare number is px); default 300px, never past 82vw.
 * `slot="body"` (opt-in): the one body sentence as rich content (a link, emphasis); it replaces the plain-text
 * `body`/`description` paragraph; the title, the fixed unlock line and the Upgrade CTA stay baked in.
 * Slot a link directly (`<a slot="body">`) so it takes the white body text; shadow CSS cannot reach a nested link.
 *
 * The popover is `position:fixed` in the top layer (Popover API where available), placed from the anchor's rect and kept
 * on it while open — no scroll container or overflow clip ancestor can cut it.
 *
 * Motion: `open` toggles the [open] host attribute on a PERSISTENT popover node; the panel animates
 * opacity + lift via the shared motion tokens (never a subtree rebuild — the dead-transition trap).
 * A11y: the anchor carries aria-expanded (observed + re-synced). Escape closes the popover first, before any host handler
 * (a drawer or modal never sees that key press), and returns focus to the element that opened it (the anchor when that element
 * is gone or refuses focus). The document click and window keydown listeners are removed on disconnect.
 *
 * `mark-label` (opt-in): the accessible name of the upgrade mark, translated (default "Upgrade required. See details"); it applies
 * only when the mark is the anchor. `close()`: for a host closing the popover from code; it returns focus to the opener, and
 * leaves focus alone when no opener was recorded and focus is not inside the popover. Click-away and the CTAs close without
 * moving focus.
 */
import './icons.js';        // registers <aha-icon> + the registry (the crown badge comes from it)
import './aha-button.js';   // registers <aha-button> — the shared Button primitive the CTAs reuse

let openPaywall = null;
const UPGRADE_URL = 'https://ahaslides.com/pricing';
const PLAN_LABEL = { essential: 'Essential', pro: 'Pro' };
// the Vivid Pink circle crown upgrade mark — the custom AhaSlides crown-badge glyph from the shared icon
// registry (PAYWALL-02: NOT a generic Phosphor crown, and never a hand-rolled inline <svg>).
const CROWN = '<aha-icon name="system-crown-badge-fill" size="12" decorative></aha-icon>';

const STYLE = `
  :host{ display:inline-block; position:relative; font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif) }
  .anchor{ display:inline-flex; align-items:center; gap:6px; cursor:pointer }
  ::slotted(*){ cursor:pointer }

  /* the upgrade mark — 16px Vivid Pink circle with the white crown glyph (PAYWALL-02 / §7).
     A focusable control with states Default/Hover/Active; colour + shadow animate via motion tokens. */
  .mark{ display:inline-flex; align-items:center; justify-content:center; flex:0 0 auto;
    width:16px; height:16px; border-radius:var(--aha-radius-pill,999px); border:none; padding:0;
    background:var(--aha-color-primary,#E70E68); color:var(--aha-text-inverse,#FFFFFF); cursor:pointer;
    transition:background var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)),
      box-shadow var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)) }
  .mark:hover{ background:var(--aha-color-primary-hover,#DB005B) }
  .mark:active{ background:var(--aha-color-primary-active,#DB005B) }
  .mark:focus-visible{ outline:none; box-shadow:0 0 0 2px var(--aha-bg-base,#FFFFFF), 0 0 0 4px var(--aha-focus-ring,#E70E68) }
  .pop .mark:focus-visible{ box-shadow:0 0 0 2px var(--aha-bg-dark-raised,#303030), 0 0 0 4px var(--aha-text-inverse,#FFFFFF) }

  /* X offset sits in untransitioned translate: fitPaywall flips align just before the first open, and a transitioned X glides sideways. */
  /* the popover — dark grey surface, 300px outer width, 16px padding, 12px radius (§7). PERSISTENT node:
     [open] animates opacity + lift on it in place, so the transition actually fires (never a rebuild). */
  .pop{ position:fixed; inset:auto; margin:0; overflow:visible; border:0; display:block; left:var(--aha-paywall-left,0px); top:var(--aha-paywall-top,0px); translate:var(--aha-paywall-x,-50%) 0; transform:translateY(4px);
    box-sizing:border-box; width:var(--aha-paywall-width,300px); max-width:82vw; padding:16px; text-align:start; white-space:normal; border-radius:var(--aha-radius-lg,12px); z-index:20;
    background:var(--aha-bg-dark-raised,#303030); color:var(--aha-text-inverse,#FFFFFF);
    box-shadow:0 9px 28px 8px rgba(0,0,0,.05), 0 6px 16px 0 rgba(0,0,0,.08), 0 3px 6px -4px rgba(0,0,0,.12);
    opacity:0; visibility:hidden;
    transition:opacity var(--aha-motion-mid,.2s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)),
      transform var(--aha-motion-mid,.2s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)),
      visibility var(--aha-motion-mid,.2s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)) }
  :host([placement="bottom"]) .pop{ transform:translateY(-4px) }
  :host([open]) .pop{ opacity:1; visibility:visible; transform:translateY(0) }
  /* align (opt-in): the popover hangs 12px past the anchor edge so the arrow, 20px in from the popover edge, clears the 12px corner
     radius and points at the crown's centre; --aha-paywall-shift (px, set by fitPaywall) slides the popover back into the viewport.
     The popover is position:fixed in the top layer, placed by _position(), so no scroll container or overflow clip can cut it. */
  :host([align="start"]){ --aha-paywall-x:0px }
  :host([align="end"]){ --aha-paywall-x:0px }
  .pop .arrow{ position:absolute; left:50%; top:100%; transform:translateX(-50%);
    border:6px solid transparent; border-top-color:var(--aha-bg-dark-raised,#303030) }
  :host([align="start"]) .pop .arrow{ left:max(18px, calc(20px - var(--aha-paywall-shift,0px))) }
  :host([align="end"]) .pop .arrow{ left:auto; right:max(12px, calc(14px + var(--aha-paywall-shift,0px))); transform:none }
  :host([placement="bottom"]) .pop .arrow{ top:auto; bottom:100%; border-top-color:transparent; border-bottom-color:var(--aha-bg-dark-raised,#303030) }
  :host([placement="left"]) .pop, :host([placement="right"]) .pop{ translate:0 0 }
  :host([placement="left"]) .pop{ transform:translateX(4px) }
  :host([placement="right"]) .pop{ transform:translateX(-4px) }
  :host([placement="left"][open]) .pop, :host([placement="right"][open]) .pop{ transform:translateX(0) }
  :host([placement="left"]) .pop .arrow, :host([placement="right"]) .pop .arrow{ top:calc(50% - var(--aha-paywall-shift-y,0px)); bottom:auto; transform:translateY(-50%); border-color:transparent }
  :host([placement="left"]) .pop .arrow{ left:100%; right:auto; border-left-color:var(--aha-bg-dark-raised,#303030) }
  :host([placement="right"]) .pop .arrow{ left:auto; right:100%; border-right-color:var(--aha-bg-dark-raised,#303030) }
  /* set by fitPaywall when no side has the room; a scroller would clip the arrow, so it goes. */
  :host([data-scroll]) .pop{ max-height:var(--aha-paywall-max-height); overflow-y:auto; overscroll-behavior:contain }
  :host([data-scroll]) .pop .arrow{ display:none }

  .phead{ display:flex; align-items:flex-start; gap:8px; margin-bottom:8px }
  .phead .mark{ margin-top:2px }
  .plabel{ font-size:14px; font-weight:600; line-height:var(--aha-line-height-body,1.5); color:var(--aha-text-inverse,#FFFFFF) }
  .pbody{ font-size:14px; line-height:1.5; color:var(--aha-text-inverse,#FFFFFF); opacity:.82; margin:0 0 12px }
  .pbody[hidden], .prich[hidden]{ display:none }
  .prich{ font-size:14px; line-height:1.5; color:var(--aha-text-inverse,#FFFFFF); margin:0 0 var(--aha-space-12,12px) }
  .prich ::slotted(*){ margin:0 }
  .prich ::slotted(a){ color:inherit; text-decoration:underline }
  .punlock{ font-size:14px; line-height:1.5; color:var(--aha-text-inverse,#FFFFFF); margin:0 0 16px }
  .punlock b{ font-weight:600 }

  /* the CTA row — shared <aha-button>s: Upgrade (positive) + the opt-in See all plans (secondary). On the dark
     surface the secondary button and both focus rings are re-themed through the button's own
     --aha-button-* inputs; the primitive itself is untouched (reuse, not a fork). */
  .actions{ display:flex; flex-wrap:wrap; align-items:center; gap:8px }
  .actions aha-button{
    --aha-button-focus-ring:var(--aha-text-inverse,#FFFFFF);
    --aha-button-focus-gap:var(--aha-bg-dark-raised,#303030) }
  .actions .plans{
    --aha-button-default-bg:transparent;
    --aha-button-default-text:var(--aha-text-inverse,#FFFFFF);
    --aha-button-default-border:var(--aha-gray-70,#8A8A8A);
    --aha-button-default-bg-hover:var(--aha-bg-dark-hover,rgba(255,255,255,.08));
    --aha-button-default-border-hover:var(--aha-text-inverse,#FFFFFF);
    --aha-button-default-text-hover:var(--aha-text-inverse,#FFFFFF);
    --aha-button-default-border-press:var(--aha-text-inverse,#FFFFFF) }
  @media (prefers-reduced-motion: reduce){ *{ transition:none !important } }
`;

// A text rewrite mid-press can lose the click, so skip writes that change nothing.
function setText(node, text) {
  if (node.textContent !== text) node.textContent = text;
}

export class AhaPaywall extends HTMLElement {
  static get observedAttributes() { return ['open', 'feature-key', 'feature-label', 'title', 'body', 'description', 'required-plan', 'cta-label', 'plans-label', 'unlock-label', 'plan-label', 'mark-label', 'placement', 'align', 'trigger', 'upgrade-url', 'plans-url', 'show-plans', 'width']; }
  get open() { return this.hasAttribute('open'); }
  set open(v) { v ? this.setAttribute('open', '') : this.removeAttribute('open'); }
  _attr(n, d = '') { return this.getAttribute(n) ?? d; }
  get plan() { const p = this._attr('required-plan', 'pro'); return PLAN_LABEL[p] ? p : 'pro'; }
  get featureKey() { return this._attr('feature-key'); }

  connectedCallback() {
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    if (!this._cta) this._build();
    this._sync();
    if (this.open) { this._trackOpener(); this._syncOverlay(); }
    // click-away + Escape close an open click-triggered popover; both listeners are removed on disconnect. Escape is taken in the
    // capture phase on window, ahead of every host handler, so the popover closes first and a host panel never sees that key press.
    this._away = (e) => { if (this.open && this._attr('trigger', 'click') === 'click' && !e.composedPath().includes(this)) this._close(); };
    this._onKey = (e) => { if (e.key === 'Escape' && this.open && this._attr('trigger', 'click') === 'click') { e.stopImmediatePropagation(); this.close(); } };
    document.addEventListener('click', this._away);
    window.addEventListener('keydown', this._onKey, true);
  }
  disconnectedCallback() {
    if (openPaywall === this) openPaywall = null;
    if (this._away) document.removeEventListener('click', this._away);
    if (this._onKey) window.removeEventListener('keydown', this._onKey, true);
    this._stopTracking();
    clearTimeout(this._hideTimer);
    this._hideTopLayer();
  }
  // `open` is observed → re-sync aria-expanded on the anchor so the announced state can't desync;
  // any other observed attr refills the persistent nodes in place (no popover rebuild).
  attributeChangedCallback(name) {
    if (!this._cta) return;
    if (name === 'open') { this._trackOpener(); this._claimSingleOpen(); this._syncExpanded(); this._syncOverlay(); }
    else { this._sync(); if (this.open && LAYOUT_ATTRIBUTES.has(name)) this._position(); }
  }

  _build() {
    // Build the shell ONCE; `open` then drives :host([open]) .pop on persistent nodes, and the only
    // per-change work is content text synced in place — so the .pop opacity/lift transition lives on a
    // live node and actually fires (rebuilding the subtree on a state change is the Switch-click trap).
    // The anchor (slotted child vs the upgrade mark) is fixed at connect time. When there's no slotted
    // affordance the mark is a real focusable <button> control with an accessible name.
    const slotted = [...this.children].some((child) => child.localName !== 'script' && child.getAttribute('slot') !== 'body');
    const anchor = slotted
      ? '<slot></slot>'
      : `<button class="mark" type="button">${CROWN}</button>`;
    this.shadowRoot.append(document.createRange().createContextualFragment(`<style>${STYLE}</style>
      <span class="anchor" part="anchor" aria-haspopup="dialog">${anchor}</span>
      <div class="pop" role="dialog" popover="manual">
        <div class="arrow"></div>
        <div class="phead"><span class="mark" aria-hidden="true">${CROWN}</span><span class="plabel"></span></div>
        <p class="pbody"></p>
        <div class="prich" hidden><slot name="body"></slot></div>
        <p class="punlock"><span class="ubefore"></span><b></b><span class="uafter"></span></p>
        <div class="actions">
          <aha-button class="upgrade" variant="positive" size="md"></aha-button>
          <aha-button class="plans" variant="secondary" size="md"></aha-button>
        </div>
      </div>`));
    this._dialog = this.shadowRoot.querySelector('.pop');
    this._markButton = this.shadowRoot.querySelector('.anchor > button.mark');
    this._anchor = this.shadowRoot.querySelector('.anchor');
    this._plabel = this.shadowRoot.querySelector('.plabel');
    this._pbody = this.shadowRoot.querySelector('.pbody');
    this._unlockBefore = this.shadowRoot.querySelector('.ubefore');
    this._planB = this.shadowRoot.querySelector('.punlock b');
    this._unlockAfter = this.shadowRoot.querySelector('.uafter');
    this._prich = this.shadowRoot.querySelector('.prich');
    this._bodySlot = this.shadowRoot.querySelector('slot[name="body"]');
    this._bodySlot.addEventListener('slotchange', () => this._syncBody());
    this._cta = this.shadowRoot.querySelector('.upgrade');
    this._plans = this.shadowRoot.querySelector('.plans');
    // read `trigger` live in each handler so a later trigger change takes effect without a rebuild
    this.addEventListener('mouseenter', () => { if (this._attr('trigger', 'click') === 'hover') this._openPop(); });
    this.addEventListener('mouseleave', () => { if (this._attr('trigger', 'click') === 'hover') this._close(); });
    this._anchor.addEventListener('click', (e) => {
      if (this._attr('trigger', 'click') !== 'click') return;
      e.stopPropagation(); this.open ? this._close() : this._openPop();
    });
    this._cta.addEventListener('click', (e) => this._upgrade(e));
    this._plans.addEventListener('click', (e) => this._seePlans(e));
    this._syncExpanded();
  }
  _sync() {
    const label = this._attr('title') || this._attr('feature-label', 'Pro feature');
    this._dialog.setAttribute('aria-label', label);
    setText(this._plabel, label);
    setText(this._pbody, this._attr('description') || this._attr('body', 'Unlock this feature.'));
    if (this._markButton) this._markButton.setAttribute('aria-label', this._attr('mark-label') || 'Upgrade required. See details');
    this._syncUnlock();
    setText(this._cta, this._attr('cta-label', 'Upgrade'));
    setText(this._plans, this._attr('plans-label', 'See all plans'));
    this._plans.hidden = !this.hasAttribute('show-plans');
    this._syncWidth();
    this._syncBody();
  }
  _syncUnlock() {
    const [before, after] = (this._attr('unlock-label') || 'Unlock with the {plan}.').split('{plan}');
    setText(this._unlockBefore, before);
    setText(this._planB, after === undefined ? '' : this._attr('plan-label') || `${PLAN_LABEL[this.plan]} plan`);
    setText(this._unlockAfter, after ?? '');
  }
  _syncWidth() {
    const width = this._attr('width').trim();
    if (width) this._dialog.style.setProperty('--aha-paywall-width', /^\d+(\.\d+)?$/.test(width) ? width + 'px' : width);
    else this._dialog.style.removeProperty('--aha-paywall-width');
  }
  _syncBody() {
    const rich = this._bodySlot.assignedNodes().some((node) => node.nodeType === 1 || node.textContent.trim());
    this._prich.hidden = !rich;
    this._pbody.hidden = rich;
  }
  _syncOverlay() {
    clearTimeout(this._hideTimer);
    if (this.open) {
      if (this._dialog.showPopover && !this._dialog.matches(':popover-open')) this._dialog.showPopover();
      this._position();
      this._startTracking();
    } else {
      this._stopTracking();
      this._hideTimer = setTimeout(() => this._hideTopLayer(), HIDE_DELAY_MS);
    }
  }
  _hideTopLayer() {
    if (this._dialog && this._dialog.hidePopover && this._dialog.matches(':popover-open')) this._dialog.hidePopover();
  }
  _startTracking() {
    if (this._track) return;
    this._track = () => this._reposition();
    window.addEventListener('scroll', this._track, true);
    window.addEventListener('resize', this._track);
    if (typeof ResizeObserver !== 'undefined') {
      this._sizeWatch = new ResizeObserver(() => this._reposition());
      this._sizeWatch.observe(this._dialog);
    }
  }
  _stopTracking() {
    if (!this._track) return;
    window.removeEventListener('scroll', this._track, true);
    window.removeEventListener('resize', this._track);
    this._track = null;
    if (this._sizeWatch) { this._sizeWatch.disconnect(); this._sizeWatch = null; }
  }
  _reposition() {
    if (!this.open) return;
    if (!anchorVisible(this)) { this._close(); return; }
    this._position();
  }
  _position() {
    const anchor = this.getBoundingClientRect();
    const pop = this._dialog;
    const width = pop.offsetWidth;
    const height = pop.offsetHeight;
    const shift = parseFloat(this.style.getPropertyValue('--aha-paywall-shift')) || 0;
    const align = this._attr('align');
    const left = align === 'start' ? anchor.left - ARROW_OVERHANG + shift
      : align === 'end' ? anchor.right + ARROW_OVERHANG + shift - width
      : anchor.left + anchor.width / 2;
    const placement = this._attr('placement');
    if (placement === 'left' || placement === 'right') {
      pop.style.setProperty('--aha-paywall-left', (placement === 'left' ? anchor.left - POPOVER_GAP - width : anchor.right + POPOVER_GAP) + 'px');
      const shiftY = parseFloat(this.style.getPropertyValue('--aha-paywall-shift-y')) || 0;
      pop.style.setProperty('--aha-paywall-top', (anchor.top + anchor.height / 2 - height / 2 + shiftY) + 'px');
      return;
    }
    const top = placement === 'bottom' ? anchor.bottom + POPOVER_GAP : anchor.top - POPOVER_GAP - height;
    pop.style.setProperty('--aha-paywall-left', left + 'px');
    pop.style.setProperty('--aha-paywall-top', top + 'px');
  }
  _claimSingleOpen() {
    if (!this.open) { if (openPaywall === this) openPaywall = null; return; }
    if (openPaywall && openPaywall !== this) openPaywall._close();
    openPaywall = this;
  }
  _syncExpanded() { if (this._anchor) this._anchor.setAttribute('aria-expanded', String(this.open)); }
  _focusAnchor() {
    const el = this._markButton || [...this.children].find((child) => child.localName !== 'script' && child.getAttribute('slot') !== 'body');
    if (el && el.focus) el.focus();
  }
  _trackOpener() {
    if (!this.open) { this._opener = null; return; }
    if (this._opener) return;
    const active = deepActiveElement();
    if (active && active !== document.body && !this._inPopover(active)) this._opener = active;
  }
  _inPopover(node) {
    for (; node; node = node.parentNode || node.host) if (node === this._dialog) return true;
    return false;
  }
  _restoreFocus(opener) {
    if (opener && opener.isConnected && typeof opener.focus === 'function') {
      opener.focus({ preventScroll: true });
      if (opener.getRootNode().activeElement === opener) return;
    }
    this._focusAnchor();
  }
  close() {
    if (!this.open) return;
    const opener = this._opener;
    const focusInside = this._inPopover(deepActiveElement());
    this._close();
    if (opener || focusInside) this._restoreFocus(opener);
  }

  _openPop() {
    if (this.open) return;
    this.open = true;
    // PAYWALL_SHOWN — fires on open, { feature, plan }
    this.dispatchEvent(new CustomEvent('paywall-shown', { bubbles: true, composed: true, detail: { feature: this.featureKey, plan: this.plan } }));
  }
  _close() { this.open = false; }
  togglePopover(options) {
    if (!this.open && options && options.source) this._opener = options.source;
    this.open ? this._close() : this._openPop();
  }

  _upgrade() {
    // PAYWALL_UPGRADE_CLICKED — fires BEFORE navigation, { feature, plan }; cancelable
    const ev = new CustomEvent('paywall-upgrade', { bubbles: true, composed: true, cancelable: true, detail: { feature: this.featureKey, plan: this.plan } });
    const proceed = this.dispatchEvent(ev);
    this._close();
    if (proceed && typeof window !== 'undefined') window.open(this._attr('upgrade-url', UPGRADE_URL), '_blank', 'noopener,noreferrer');
  }
  _seePlans() {
    // secondary route to the full pricing page — cancelable so the app can route in-product instead
    const ev = new CustomEvent('paywall-plans', { bubbles: true, composed: true, cancelable: true, detail: { feature: this.featureKey, plan: this.plan } });
    const proceed = this.dispatchEvent(ev);
    this._close();
    if (proceed && typeof window !== 'undefined') window.open(this._attr('plans-url', UPGRADE_URL), '_blank', 'noopener,noreferrer');
  }
}

const FIT_MARGIN = 8;
const ARROW_OVERHANG = 12;
const POPOVER_GAP = 8;
const HIDE_DELAY_MS = 260;
const LAYOUT_ATTRIBUTES = new Set(['placement', 'align', 'width']);

function deepActiveElement() {
  let el = document.activeElement;
  while (el && el.shadowRoot && el.shadowRoot.activeElement) el = el.shadowRoot.activeElement;
  return el;
}

const FOCUSABLE = 'button,a[href],input,select,textarea,summary,[tabindex],[contenteditable]';

/** False once the anchor has scrolled out of the visible area of the viewport or of any scrolling ancestor. The body is no clip box while its overflow propagates to the viewport (a drawer's scroll lock sets it on a body as tall as the page behind). */
function anchorVisible(paywall) {
  const box = paywall.getBoundingClientRect();
  let bounds = { left: 0, top: 0, right: document.documentElement.clientWidth, bottom: document.documentElement.clientHeight };
  const root = getComputedStyle(document.documentElement);
  const bodyPropagates = root.overflowX === 'visible' && root.overflowY === 'visible';
  for (let node = paywall.assignedSlot || paywall.parentNode; node; node = node.assignedSlot || node.parentNode || node.host) {
    if (node.nodeType !== 1) continue;
    const { overflowX, overflowY, position } = getComputedStyle(node);
    const clips = (overflowX !== 'visible' || overflowY !== 'visible') && node !== document.documentElement && !(node === document.body && bodyPropagates);
    if (clips) {
      const rect = node.getBoundingClientRect();
      bounds = { left: Math.max(bounds.left, rect.left), top: Math.max(bounds.top, rect.top), right: Math.min(bounds.right, rect.right), bottom: Math.min(bounds.bottom, rect.bottom) };
    }
    if (position === 'fixed') break;
  }
  return box.right > bounds.left && box.left < bounds.right && box.bottom > bounds.top && box.top < bounds.bottom;
}

/** Places a paywall's popover inside the viewport: `align` from the room to either side of the anchor,
 *  `placement` from the room below it, and `--aha-paywall-shift` to pull it back in when it would still clip.
 *  When neither above nor below has the room it sits beside the anchor, or scrolls inside the taller side. */
export function fitPaywall(paywall) {
  const anchor = paywall.getBoundingClientRect();
  const viewportWidth = document.documentElement.clientWidth;
  const viewportHeight = document.documentElement.clientHeight;
  const popover = paywall.shadowRoot.querySelector('.pop');
  const width = popover.offsetWidth;
  const alignStart = viewportWidth - FIT_MARGIN - anchor.left >= anchor.right - FIT_MARGIN;
  const edge = alignStart ? anchor.left - ARROW_OVERHANG : anchor.right + ARROW_OVERHANG;
  const clamped = alignStart
    ? Math.min(Math.max(edge, FIT_MARGIN), viewportWidth - FIT_MARGIN - width)
    : Math.max(Math.min(edge, viewportWidth - FIT_MARGIN), FIT_MARGIN + width);
  paywall.setAttribute('align', alignStart ? 'start' : 'end');
  paywall.style.setProperty('--aha-paywall-shift', (clamped - edge) + 'px');
  paywall.removeAttribute('data-scroll');
  paywall.style.removeProperty('--aha-paywall-shift-y');
  const height = popover.offsetHeight;
  const roomBelow = viewportHeight - anchor.bottom;
  const needed = height + POPOVER_GAP + FIT_MARGIN;
  if (roomBelow >= needed || anchor.top >= needed) {
    paywall.setAttribute('placement', roomBelow >= height + FIT_MARGIN || roomBelow >= anchor.top ? 'bottom' : 'top');
  } else {
    fitShortViewport(paywall, anchor, width, height, viewportWidth, viewportHeight);
  }
  if (paywall.open) paywall._position();
}

function fitShortViewport(paywall, anchor, width, height, viewportWidth, viewportHeight) {
  const sideRoom = width + POPOVER_GAP + FIT_MARGIN;
  const side = viewportWidth - anchor.right >= sideRoom ? 'right' : anchor.left >= sideRoom ? 'left' : '';
  if (side && height + FIT_MARGIN * 2 <= viewportHeight) {
    const centred = anchor.top + anchor.height / 2 - height / 2;
    const clamped = Math.min(Math.max(centred, FIT_MARGIN), viewportHeight - FIT_MARGIN - height);
    paywall.setAttribute('placement', side);
    paywall.style.setProperty('--aha-paywall-shift-y', (clamped - centred) + 'px');
    return;
  }
  const below = viewportHeight - anchor.bottom >= anchor.top;
  paywall.setAttribute('placement', below ? 'bottom' : 'top');
  paywall.style.setProperty('--aha-paywall-max-height', ((below ? viewportHeight - anchor.bottom : anchor.top) - POPOVER_GAP - FIT_MARGIN) + 'px');
  paywall.setAttribute('data-scroll', '');
}

/** Opens (or closes) a paywall popover from a click on any control outside it: a locked row, a disabled control's wrapper, or an
 *  enabled button beside its crown. Call it in that control's click listener; focus returns to that control on Escape or close(). */
export function toggleLockedPaywall(paywall, event) {
  event.stopPropagation();
  const full = event.composedPath();
  const path = full.slice(0, full.indexOf(event.currentTarget) + 1);
  const source = path.find((node) => node.nodeType === 1 && node.matches(FOCUSABLE)) || event.currentTarget;
  fitPaywall(paywall);
  paywall.togglePopover({ source });
}

/** Refits a paywall on pointerdown and focusin, but leaves an open popover alone unless keyboard focus (:focus-visible) reaches it. */
export function fitPaywallFromAnchor(paywall) {
  const refit = (event) => { if (!paywall.open || (event.type === 'focusin' && event.composedPath()[0].matches(':focus-visible'))) fitPaywall(paywall); };
  paywall.addEventListener('pointerdown', refit);
  paywall.addEventListener('focusin', refit);
}

export function defineAhaPaywall(tag = 'aha-paywall') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaPaywall);
  return true;
}
if (typeof window !== 'undefined') defineAhaPaywall();

export default { AhaPaywall, defineAhaPaywall, fitPaywall, fitPaywallFromAnchor, toggleLockedPaywall };
