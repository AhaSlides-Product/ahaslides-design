/**
 * @ahaslides-product/design/aha-paywall — the shared Paywall / upsell surface.
 *
 *   import '@ahaslides-product/design/aha-paywall';   // registers <aha-paywall>
 *   <aha-paywall feature-key="streak_bonus" feature-label="Streak answer bonus point"
 *                body="Let participants play and be ranked as teams." required-plan="pro">
 *     <button>Streak bonus</button>          <!-- the gated affordance (optional anchor) -->
 *   </aha-paywall>
 *
 * EVERY pro-gated affordance routes through this ONE element, so the two products feel like one.
 * You provide the feature + copy + plan; the element renders the compliant upsell — the upgrade
 * mark (purple circle crown, NOT a generic crown glyph), the title, the one-sentence body, the
 * fixed "Unlock with the <Plan> plan." line, and the Upgrade CTA are BAKED IN. A hand-rolled
 * upgrade modal/tooltip is the drift this replaces.
 *
 * TWO surfaces baked in (Figma Upgrade-mark 3881:9022 · Popover 3881:9078):
 *   • the upgrade mark — a small focusable crown control (states Default/Hover/Active) that sits
 *     beside a Pro-gated setting; it is the anchor when there's no slotted affordance;
 *   • the rich popover on the dark indigo surface — crown + title, description, the fixed unlock
 *     line, then TWO buttons: Upgrade (positive/green) + See all plans (secondary). Both buttons
 *     REUSE the shared <aha-button> primitive — never hand-rolled.
 *
 * Anchor: the slotted child is the clickable anchor; with no child, the upgrade mark is the anchor
 * (a focusable role="button" with an accessible name). Analytics is the DS contract as composed
 * CustomEvents:
 *   `paywall-shown`   — on open, detail { feature, plan }
 *   `paywall-upgrade` — on Upgrade click BEFORE navigation, detail { feature, plan }; cancelable —
 *                       preventDefault() to run your own upgrade flow instead of opening pricing.
 *   `paywall-plans`   — on "See all plans" click BEFORE navigation, detail { feature, plan };
 *                       cancelable — preventDefault() to route to your own pricing surface.
 *
 * ONE element, shadow-DOM CSS, themed only by --aha-* tokens. The crown is the shared DS icon
 * called BY NAME (<aha-icon name="system-crown-badge-fill">) — never an inline <svg>. The two
 * CTAs are <aha-button> — the shared Button primitive, not hand-rolled.
 *
 * Motion: `open` toggles the [open] host attribute on a PERSISTENT popover node; the panel animates
 * opacity + lift via the shared motion tokens (never a subtree rebuild — the dead-transition trap).
 * A11y: the anchor carries aria-expanded (observed + re-synced), Escape closes and returns focus,
 * and the document click/keydown listeners are removed on disconnect.
 */
import './icons.js';        // registers <aha-icon> + the registry (the crown badge comes from it)
import './aha-button.js';   // registers <aha-button> — the shared Button primitive the two CTAs reuse

const UPGRADE_URL = 'https://ahaslides.com/pricing';
const PLAN_LABEL = { essential: 'Essential', pro: 'Pro' };
// the purple-circle crown upgrade mark — the custom AhaSlides crown-badge glyph from the shared icon
// registry (PAYWALL-02: NOT a generic Phosphor crown, and never a hand-rolled inline <svg>).
const CROWN = '<aha-icon name="system-crown-badge-fill" size="10" decorative></aha-icon>';

const STYLE = `
  :host{ display:inline-block; position:relative; font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif) }
  .anchor{ display:inline-flex; align-items:center; gap:6px; cursor:pointer }
  ::slotted(*){ cursor:pointer }

  /* the upgrade mark — 16px purple circle with the white crown glyph (PAYWALL-02 / §7).
     A focusable control with states Default/Hover/Active; colour + shadow animate via motion tokens. */
  .mark{ display:inline-flex; align-items:center; justify-content:center; flex:0 0 auto;
    width:16px; height:16px; border-radius:var(--aha-radius-pill,999px); border:none; padding:0;
    background:var(--aha-color-primary,#6A1EBB); color:var(--aha-text-inverse,#fff); cursor:pointer;
    transition:background var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)),
      box-shadow var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)) }
  .mark:hover{ background:var(--aha-color-primary-hover,#8644D4) }
  .mark:active{ background:var(--aha-color-primary-active,#5715A0) }
  .mark:focus-visible{ outline:none; box-shadow:0 0 0 2px var(--aha-focus-ring-soft,rgba(211,180,255,.4)) }

  /* the popover — dark indigo surface, 300px, 16px padding, 12px radius (§7). PERSISTENT node:
     [open] animates opacity + lift on it in place, so the transition actually fires (never a rebuild). */
  .pop{ position:absolute; left:50%; bottom:calc(100% + 8px); transform:translateX(-50%) translateY(4px);
    width:300px; max-width:82vw; padding:16px; border-radius:var(--aha-radius-lg,12px); z-index:20;
    background:var(--aha-bg-dark-raised,#242442); color:var(--aha-text-inverse,#fff);
    box-shadow:0 9px 28px 8px rgba(0,0,0,.05), 0 6px 16px 0 rgba(0,0,0,.08), 0 3px 6px -4px rgba(0,0,0,.12);
    opacity:0; visibility:hidden;
    transition:opacity var(--aha-motion-mid,.2s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)),
      transform var(--aha-motion-mid,.2s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)),
      visibility var(--aha-motion-mid,.2s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)) }
  :host([placement="bottom"]) .pop{ bottom:auto; top:calc(100% + 8px); transform:translateX(-50%) translateY(-4px) }
  :host([open]) .pop{ opacity:1; visibility:visible; transform:translateX(-50%) translateY(0) }
  .pop .arrow{ position:absolute; left:50%; top:100%; transform:translateX(-50%);
    border:6px solid transparent; border-top-color:var(--aha-bg-dark-raised,#242442) }
  :host([placement="bottom"]) .pop .arrow{ top:auto; bottom:100%; border-top-color:transparent; border-bottom-color:var(--aha-bg-dark-raised,#242442) }

  .phead{ display:flex; align-items:flex-start; gap:8px; margin-bottom:8px }
  .phead .mark{ margin-top:2px }
  .plabel{ font-size:14px; font-weight:600; line-height:1.4; color:var(--aha-text-inverse,#fff) }
  .pbody{ font-size:14px; line-height:1.5; color:var(--aha-text-inverse,#fff); opacity:.82; margin:0 0 12px }
  .punlock{ font-size:14px; line-height:1.5; color:var(--aha-text-inverse,#fff); margin:0 0 16px }
  .punlock b{ font-weight:600 }

  /* the CTA row — TWO shared <aha-button>s: Upgrade (positive/green) + See all plans (secondary).
     On the dark surface the secondary button is re-themed by re-pointing its --aha-button-default-*
     inputs at dark-surface values; the primitive itself is untouched (reuse, not a fork). */
  .actions{ display:flex; align-items:center; gap:8px }
  .actions .plans{
    --aha-button-default-bg:transparent;
    --aha-button-default-text:var(--aha-text-inverse,#fff);
    --aha-button-default-border:var(--aha-text-secondary,#4A4A4A);
    --aha-button-default-bg-hover:var(--aha-bg-dark-hover,rgba(255,255,255,.08));
    --aha-button-default-border-hover:var(--aha-text-tertiary,#8A8A8A) }
  @media (prefers-reduced-motion: reduce){ *{ transition:none !important } }
`;

export class AhaPaywall extends HTMLElement {
  static get observedAttributes() { return ['open', 'feature-key', 'feature-label', 'title', 'body', 'description', 'required-plan', 'cta-label', 'plans-label', 'placement', 'trigger', 'upgrade-url', 'plans-url']; }
  get open() { return this.hasAttribute('open'); }
  set open(v) { v ? this.setAttribute('open', '') : this.removeAttribute('open'); }
  _attr(n, d = '') { return this.getAttribute(n) ?? d; }
  get plan() { const p = this._attr('required-plan', 'pro'); return PLAN_LABEL[p] ? p : 'pro'; }
  get featureKey() { return this._attr('feature-key'); }

  connectedCallback() {
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    if (!this._cta) this._build();
    this._sync();
    // click-away + Escape close an open click-triggered popover; both listeners are removed on disconnect
    this._away = (e) => { if (this.open && this._attr('trigger', 'click') === 'click' && !this.contains(e.target)) this._close(); };
    this._onKey = (e) => { if (e.key === 'Escape' && this.open && this._attr('trigger', 'click') === 'click') { this._close(); this._focusAnchor(); } };
    document.addEventListener('click', this._away);
    document.addEventListener('keydown', this._onKey);
  }
  disconnectedCallback() {
    if (this._away) document.removeEventListener('click', this._away);
    if (this._onKey) document.removeEventListener('keydown', this._onKey);
  }
  // `open` is observed → re-sync aria-expanded on the anchor so the announced state can't desync;
  // any other observed attr refills the persistent nodes in place (no popover rebuild).
  attributeChangedCallback(name) {
    if (!this._cta) return;
    if (name === 'open') this._syncExpanded();
    else this._sync();
  }

  _build() {
    // Build the shell ONCE; `open` then drives :host([open]) .pop on persistent nodes, and the only
    // per-change work is content text synced in place — so the .pop opacity/lift transition lives on a
    // live node and actually fires (rebuilding the subtree on a state change is the Switch-click trap).
    // The anchor (slotted child vs the upgrade mark) is fixed at connect time. When there's no slotted
    // affordance the mark is a real focusable <button> control with an accessible name.
    const slotted = !!this.querySelector(':not(script)');
    const anchor = slotted
      ? '<slot></slot>'
      : `<button class="mark" type="button" aria-label="Upgrade required — see plans">${CROWN}</button>`;
    this.shadowRoot.append(document.createRange().createContextualFragment(`<style>${STYLE}</style>
      <span class="anchor" part="anchor" aria-haspopup="dialog">${anchor}</span>
      <div class="pop" role="dialog">
        <div class="arrow"></div>
        <div class="phead"><span class="mark" aria-hidden="true">${CROWN}</span><span class="plabel"></span></div>
        <p class="pbody"></p>
        <p class="punlock">Unlock with the <b></b>.</p>
        <div class="actions">
          <aha-button class="upgrade" variant="positive" size="md"></aha-button>
          <aha-button class="plans" variant="secondary" size="md"></aha-button>
        </div>
      </div>`));
    this._dialog = this.shadowRoot.querySelector('.pop');
    this._anchor = this.shadowRoot.querySelector('.anchor');
    this._plabel = this.shadowRoot.querySelector('.plabel');
    this._pbody = this.shadowRoot.querySelector('.pbody');
    this._planB = this.shadowRoot.querySelector('.punlock b');
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
    this._plabel.textContent = label;
    this._pbody.textContent = this._attr('description') || this._attr('body', 'Unlock this feature.');
    this._planB.textContent = `${PLAN_LABEL[this.plan]} plan`;
    this._cta.textContent = this._attr('cta-label', 'Upgrade');
    this._plans.textContent = this._attr('plans-label', 'See all plans');
  }
  _syncExpanded() { if (this._anchor) this._anchor.setAttribute('aria-expanded', String(this.open)); }
  _focusAnchor() { const el = this.shadowRoot.querySelector('.mark') || this.firstElementChild; if (el && el.focus) el.focus(); }

  _openPop() {
    if (this.open) return;
    this.open = true;
    // PAYWALL_SHOWN — fires on open, { feature, plan }
    this.dispatchEvent(new CustomEvent('paywall-shown', { bubbles: true, composed: true, detail: { feature: this.featureKey, plan: this.plan } }));
  }
  _close() { this.open = false; }

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

export function defineAhaPaywall(tag = 'aha-paywall') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaPaywall);
  return true;
}
if (typeof window !== 'undefined') defineAhaPaywall();

export default { AhaPaywall, defineAhaPaywall };
