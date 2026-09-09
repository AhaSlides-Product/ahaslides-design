/**
 * @ahaslides-product/design/aha-paywall — the shared Paywall / upsell surface.
 *
 *   import '@ahaslides-product/design/aha-paywall';   // registers <aha-paywall>
 *   <aha-paywall feature-key="custom_survey_url" feature-label="Custom survey URL"
 *                body="Give your survey a branded, memorable link." required-plan="pro">
 *     <button>Custom URL</button>            <!-- the gated affordance (optional anchor) -->
 *   </aha-paywall>
 *
 * EVERY pro-gated affordance routes through this ONE element, so the two products feel like one.
 * You provide the feature + copy + plan; the element renders the compliant upsell — the crown
 * badge (purple circle, NOT a generic crown glyph), the one-sentence body, the fixed
 * "Unlock with the <Plan> plan." line, and the single full-width Upgrade CTA are BAKED IN.
 * A hand-rolled upgrade modal/tooltip is the drift this replaces.
 *
 * Anchor: the slotted child is the clickable anchor; with no child, a PaywallCrownBadge is the
 * anchor (role="img", aria-label). Analytics is the DS contract as composed CustomEvents:
 *   `paywall-shown`   — on open, detail { feature, plan }
 *   `paywall-upgrade` — on CTA click BEFORE navigation, detail { feature, plan }; cancelable —
 *                       preventDefault() to run your own upgrade flow instead of opening pricing.
 *
 * ONE element, shadow-DOM CSS, themed only by --aha-* tokens. The crown is the shared DS
 * icon called BY NAME (<aha-icon name="system-crown-badge-fill">) — never an inline <svg>.
 */
import './icons.js';   // registers <aha-icon> + the registry (the crown badge comes from it)

const UPGRADE_URL = 'https://ahaslides.com/pricing';
const PLAN_LABEL = { essential: 'Essential', pro: 'Pro' };
// the purple-circle crown badge — the custom AhaSlides crown-badge glyph from the shared icon
// registry (PAYWALL-02: NOT a generic Phosphor crown, and never a hand-rolled inline <svg>).
const CROWN = '<span class="crown" role="img" aria-label="Upgrade required"><aha-icon name="system-crown-badge-fill" size="10" decorative></aha-icon></span>';

const STYLE = `
  :host{ display:inline-block; position:relative; font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif) }
  .anchor{ display:inline-flex; align-items:center; gap:6px; cursor:pointer }
  ::slotted(*){ cursor:pointer }

  /* the crown badge — 16px purple circle with the white crown glyph (PAYWALL-02 / §7) */
  .crown{ display:inline-flex; align-items:center; justify-content:center; flex:0 0 auto;
    width:16px; height:16px; border-radius:50%; background:var(--aha-color-primary,#6A1EBB);
    color:var(--aha-text-inverse,#fff) }

  /* the popover — dark indigo surface, 300px, 16px padding, 12px radius (§7) */
  .pop{ position:absolute; left:50%; bottom:calc(100% + 8px); transform:translateX(-50%);
    width:300px; max-width:82vw; padding:16px; border-radius:12px; z-index:20;
    background:var(--aha-bg-dark-raised,#242442); color:var(--aha-text-inverse,#fff);
    box-shadow:0 8px 28px rgba(26,26,46,.28); display:none }
  :host([placement="bottom"]) .pop{ bottom:auto; top:calc(100% + 8px) }
  :host([open]) .pop{ display:block }
  .pop .arrow{ position:absolute; left:50%; top:100%; transform:translateX(-50%);
    border:6px solid transparent; border-top-color:var(--aha-bg-dark-raised,#242442) }
  :host([placement="bottom"]) .pop .arrow{ top:auto; bottom:100%; border-top-color:transparent; border-bottom-color:var(--aha-bg-dark-raised,#242442) }

  .phead{ display:flex; align-items:center; gap:8px; margin-bottom:8px }
  .plabel{ font-size:14px; font-weight:600; line-height:20px; color:var(--aha-text-inverse,#fff) }
  .pbody{ font-size:13px; line-height:1.5; color:var(--aha-text-inverse,#fff); opacity:.88; margin:0 0 6px }
  .punlock{ font-size:13px; line-height:1.5; color:var(--aha-text-inverse,#fff); margin:0 0 14px }
  .punlock b{ font-weight:600 }

  /* single full-width primary Upgrade CTA (§2 / PAYWALL-04) */
  .cta{ display:block; width:100%; font-family:inherit; font-size:14px; font-weight:600; line-height:20px;
    text-align:center; padding:9px 16px; border:none; border-radius:8px; cursor:pointer;
    background:var(--aha-btn-primary-bg,#6A1EBB); color:var(--aha-btn-primary-fg,#FDFDFD);
    transition:background var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)) }
  .cta:hover{ background:var(--aha-btn-primary-bg-hover,#8644D4) }
  .cta:focus-visible{ outline:2px solid var(--aha-text-inverse,#fff); outline-offset:2px }
  @media (prefers-reduced-motion: reduce){ *{ transition:none !important } }
`;

export class AhaPaywall extends HTMLElement {
  static get observedAttributes() { return ['open', 'feature-key', 'feature-label', 'body', 'required-plan', 'cta-label', 'placement', 'trigger', 'upgrade-url']; }
  get open() { return this.hasAttribute('open'); }
  set open(v) { v ? this.setAttribute('open', '') : this.removeAttribute('open'); }
  _attr(n, d = '') { return this.getAttribute(n) ?? d; }
  get plan() { const p = this._attr('required-plan', 'pro'); return PLAN_LABEL[p] ? p : 'pro'; }
  get featureKey() { return this._attr('feature-key'); }

  connectedCallback() {
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    if (!this._cta) this._build();
    this._sync();
    // click-away closes an open click-triggered popover
    this._away = (e) => { if (this.open && this._attr('trigger', 'click') === 'click' && !this.contains(e.target)) this._close(); };
    document.addEventListener('click', this._away);
  }
  disconnectedCallback() { if (this._away) document.removeEventListener('click', this._away); }
  attributeChangedCallback(name) { if (this._cta && name !== 'open') this._sync(); }

  _build() {
    // Build the shell ONCE; `open` then drives :host([open]) .pop on persistent nodes, and the only
    // per-change work is content text synced in place — so the .cta transition lives on a live node
    // and actually fires (rebuilding the subtree on a state change is the Switch-click trap). The
    // anchor (slotted child vs the crown badge) is fixed at connect time.
    const anchor = this.querySelector(':not(script)') ? '<slot></slot>' : CROWN;
    this.shadowRoot.append(document.createRange().createContextualFragment(`<style>${STYLE}</style>
      <span class="anchor" part="anchor">${anchor}</span>
      <div class="pop" role="dialog">
        <div class="arrow"></div>
        <div class="phead">${CROWN}<span class="plabel"></span></div>
        <p class="pbody"></p>
        <p class="punlock">Unlock with the <b></b>.</p>
        <button class="cta" type="button"></button>
      </div>`));
    this._dialog = this.shadowRoot.querySelector('.pop');
    this._plabel = this.shadowRoot.querySelector('.plabel');
    this._pbody = this.shadowRoot.querySelector('.pbody');
    this._planB = this.shadowRoot.querySelector('.punlock b');
    this._cta = this.shadowRoot.querySelector('.cta');
    // read `trigger` live in each handler so a later trigger change takes effect without a rebuild
    this.addEventListener('mouseenter', () => { if (this._attr('trigger', 'click') === 'hover') this._openPop(); });
    this.addEventListener('mouseleave', () => { if (this._attr('trigger', 'click') === 'hover') this._close(); });
    this.shadowRoot.querySelector('.anchor').addEventListener('click', (e) => {
      if (this._attr('trigger', 'click') !== 'click') return;
      e.stopPropagation(); this.open ? this._close() : this._openPop();
    });
    this._cta.addEventListener('click', (e) => this._upgrade(e));
  }
  _sync() {
    const label = this._attr('feature-label', 'Pro feature');
    this._dialog.setAttribute('aria-label', label);
    this._plabel.textContent = label;
    this._pbody.textContent = this._attr('body', 'Unlock this feature.');
    this._planB.textContent = `${PLAN_LABEL[this.plan]} plan`;
    this._cta.textContent = this._attr('cta-label', 'Upgrade');
  }

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
}

export function defineAhaPaywall(tag = 'aha-paywall') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaPaywall);
  return true;
}
if (typeof window !== 'undefined') defineAhaPaywall();

export default { AhaPaywall, defineAhaPaywall };
