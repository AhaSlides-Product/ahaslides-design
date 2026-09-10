/**
 * @ahaslides-product/design/aha-badge — the shared Badge primitive.
 *
 *   import '@ahaslides-product/design/aha-badge';   // registers <aha-badge>
 *   <aha-badge count="5"><button>Inbox</button></aha-badge>   // count over a wrapped child
 *   <aha-badge count="128" overflow-count="99"></aha-badge>   // 99+
 *   <aha-badge dot><aha-icon name="system-bell"></aha-icon></aha-badge>
 *   <aha-badge status="processing" text="In progress"></aha-badge>  // standalone dot + label
 *
 * The DS V3 Badge is a FAMILY, not one shape:
 *   • count   — a number pill on the top-right of a wrapped child (or standalone)
 *   • dot     — a bare marker, no number
 *   • status  — a standalone semantic dot + text label (success/processing/error/default/warning)
 *   • color   — a custom colour overriding the semantic default
 *   • ribbon  — a corner ribbon banner wrapping a card, `placement="end"` (top-right, default) or
 *               `placement="start"` (top-left); `text` is the ribbon label, colour from color/status
 *   • tone    — a filled/tinted LABEL chip (danger·success·positive·essential·pro·branding·
 *               primary-alt). The colourful pill for a category/state label.
 *   • plan    — a PLAN preset chip (free·edu·essential·pro·enterprise); `cycle` = monthly|yearly.
 *   • rank    — a leaderboard RANK chip (1·2·3·4) — medal-tinted, with a leading medal glyph.
 *   • session — a "Session N" chip; the slotted/`text` label is the session name.
 *
 *   CLICKABLE = A LINK, NOT A BUTTON. When a tone/plan/rank/session chip carries an `href`, it
 *   renders as `<a class="chip" href="…">` — a native, focusable link that navigates (to billing/
 *   upgrade). It is NEVER a <button> and NEVER nested in one. Without `href` it's a plain <span>
 *   (no interactivity, no role). Because the link chip has :hover it MUST animate — background +
 *   opacity transition via the shared motion tokens on the persistent chip node.
 *
 * `count` over `overflowCount` renders as `N+`; `showZero` keeps a `0` visible; otherwise a
 * zero count hides the pill. `processing` pulses; the count/dot animates in via a scale on a
 * PERSISTENT node (a class toggles — the pill node is never rebuilt on a count change, so the
 * transition actually fires). ONE element, shadow-DOM CSS, themed only by --aha-* tokens →
 * byte-identical in React and Vue. Zero dependencies.
 */
const STATUS_COLOR = {
  success: 'var(--aha-color-success,#16C49A)',
  processing: 'var(--aha-color-primary,#6A1EBB)',
  error: 'var(--aha-color-error,#F5222D)',
  warning: 'var(--aha-color-warning,#FF7747)',
  default: 'var(--aha-text-tertiary,#8A8A8A)',
  primary: 'var(--aha-color-primary,#6A1EBB)',
};
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const STYLE = `
  :host{ display:inline-flex; vertical-align:middle; position:relative; line-height:1 }
  /* the wrapper holds slotted content the badge marks; the pill floats over its top-right */
  .wrap{ display:inline-flex }
  .marker{ box-sizing:border-box; display:inline-flex; align-items:center; justify-content:center;
    height:18px; min-width:18px; padding:0 6px;
    font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif); font-size:11px; line-height:18px; font-weight:600;
    color:var(--aha-text-inverse,#FFFFFF); background:var(--aha-badge-color,var(--aha-color-error,#F5222D));
    border-radius:var(--aha-radius-pill,999px);
    transform:scale(1); transform-origin:center;
    transition:transform var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)),
      background var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)) }
  /* hidden count (zero, no showZero) collapses via scale on the SAME persistent node */
  .marker.hidden{ transform:scale(0) }
  /* dot — a bare marker, no number */
  :host([dot]) .marker{ width:8px; height:8px; min-width:0; padding:0 }
  /* when a child is wrapped, the marker floats to the top-right corner */
  :host(.has-child) .marker{ position:absolute; top:0; right:0; transform-origin:100% 0;
    transform:translate(50%,-50%) scale(1); box-shadow:0 0 0 1px var(--aha-bg-container,#FFFFFF) }
  :host(.has-child) .marker.hidden{ transform:translate(50%,-50%) scale(0) }

  /* standalone status — a semantic dot + a text label, no wrapping */
  .status{ display:inline-flex; align-items:center; gap:8px;
    font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif); font-size:14px; color:var(--aha-text-default,#1A1A1A) }
  .status .status-dot{ width:6px; height:6px; border-radius:var(--aha-radius-pill,999px);
    background:var(--aha-badge-color,var(--aha-text-tertiary,#8A8A8A)); flex:0 0 auto; position:relative }
  /* processing — a pulsing ring on a persistent node */
  .status .status-dot::after{ content:""; position:absolute; inset:0; border-radius:inherit;
    background:inherit; opacity:0; animation:none }
  :host([status="processing"]) .status .status-dot::after{ animation:aha-badge-pulse 1.2s var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)) infinite }
  @keyframes aha-badge-pulse{ 0%{ transform:scale(1); opacity:.5 } 100%{ transform:scale(2.6); opacity:0 } }

  /* ribbon — a corner banner wrapping a card; the wrapper anchors the ribbon over the child's top corner */
  .ribbon-wrap{ position:relative; display:block }
  .ribbon{ box-sizing:border-box; position:absolute; top:8px; height:22px; line-height:22px; padding:0 8px;
    font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif); font-size:12px; font-weight:600; white-space:nowrap;
    color:var(--aha-text-inverse,#FFFFFF); background:var(--aha-badge-color,var(--aha-color-primary,#6A1EBB)) }
  /* the triangular fold under the ribbon end — CSS borders in a darkened ribbon colour (chrome, not a glyph) */
  .ribbon::after{ content:""; position:absolute; top:100%; border:4px solid var(--aha-badge-color,var(--aha-color-primary,#6A1EBB));
    filter:brightness(75%) }
  /* end (default, top-right): ribbon flush to the right edge, radius on its left corners, fold on the right */
  :host([placement="end"]) .ribbon, :host(:not([placement="start"])) .ribbon{ right:-8px;
    border-radius:var(--aha-radius-xs,4px) 0 0 var(--aha-radius-xs,4px) }
  :host([placement="end"]) .ribbon::after, :host(:not([placement="start"])) .ribbon::after{ right:0;
    border-color:var(--aha-badge-color,var(--aha-color-primary,#6A1EBB)) transparent transparent var(--aha-badge-color,var(--aha-color-primary,#6A1EBB)) }
  /* start (top-left): ribbon flush to the left edge, radius on its right corners, fold on the left */
  :host([placement="start"]) .ribbon{ left:-8px; border-radius:0 var(--aha-radius-xs,4px) var(--aha-radius-xs,4px) 0 }
  :host([placement="start"]) .ribbon::after{ left:0;
    border-color:var(--aha-badge-color,var(--aha-color-primary,#6A1EBB)) var(--aha-badge-color,var(--aha-color-primary,#6A1EBB)) transparent transparent }

  /* ===== label / preset chips — tone · plan · rank · session =====
     A filled/tinted pill. Colour comes from --_cbg (background) + --_cfg (foreground), each set
     per family/variant below and bound to an --aha-* token. The chip is a PERSISTENT node: as a
     link (:host([href]) → <a>) it has :hover, so background + opacity animate via motion tokens. */
  .chip{ box-sizing:border-box; display:inline-flex; align-items:center; gap:6px; height:22px; padding:0 10px; max-width:100%;
    font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif); font-size:12px; line-height:18px; font-weight:600;
    border-radius:var(--aha-radius-pill,999px); border:1px solid transparent; white-space:nowrap;
    text-decoration:none;
    background:var(--_cbg,var(--aha-bg-accent,#F9F5FF)); color:var(--_cfg,var(--aha-color-primary,#6A1EBB));
    transition:background var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)),
      opacity var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)) }
  .chip .chip-label{ overflow:hidden; text-overflow:ellipsis }
  .chip aha-icon{ flex:0 0 auto; color:currentColor }
  /* only a link chip is interactive — hover lifts it, focus rings it */
  a.chip{ cursor:pointer }
  a.chip:hover{ opacity:.82 }
  a.chip:focus-visible{ outline:2px solid var(--aha-border-focus,#D3B4FF); outline-offset:2px }

  /* --- tone palette (tinted label chips) --- */
  :host([tone="danger"]) .chip{ --_cbg:var(--aha-bg-negative,#FFF1F0); --_cfg:var(--aha-text-negative,#F5222D) }
  :host([tone="success"]) .chip,:host([tone="positive"]) .chip{ --_cbg:var(--aha-bg-positive,#D8FAEF); --_cfg:var(--aha-text-positive,#13A181) }
  :host([tone="essential"]) .chip{ --_cbg:var(--aha-bg-accent,#F9F5FF); --_cfg:var(--aha-color-primary,#6A1EBB) }
  :host([tone="pro"]) .chip{ --_cbg:var(--aha-coral-10,#FFF5F0); --_cfg:var(--aha-coral-70,#E65B29) }
  :host([tone="branding"]) .chip{ --_cbg:var(--aha-pink-10,#FDF6FA); --_cfg:var(--aha-pink-70,#D92B6B) }
  :host([tone="primary-alt"]) .chip{ --_cbg:var(--aha-purple-15,#F0E4FF); --_cfg:var(--aha-purple-55,#7831C8) }

  /* --- plan presets (solid brand fills) --- */
  :host([plan="free"]) .chip{ --_cbg:var(--aha-gray-30,#F1F1F1); --_cfg:var(--aha-text-secondary,#4A4A4A) }
  :host([plan="edu"]) .chip{ --_cbg:var(--aha-bg-positive,#D8FAEF); --_cfg:var(--aha-text-positive,#13A181) }
  :host([plan="essential"]) .chip{ --_cbg:var(--aha-color-primary,#6A1EBB); --_cfg:var(--aha-text-inverse,#FFFFFF) }
  :host([plan="pro"]) .chip{ --_cbg:var(--aha-coral-60,#FF7747); --_cfg:var(--aha-text-inverse,#FFFFFF) }
  :host([plan="enterprise"]) .chip{ --_cbg:var(--aha-bg-dark,#1A1A2E); --_cfg:var(--aha-text-inverse,#FFFFFF) }

  /* --- rank (leaderboard) medal tints --- */
  :host([rank="1"]) .chip{ --_cbg:var(--aha-yellow-30,#FFEF88); --_cfg:var(--aha-yellow-90,#705B09) }
  :host([rank="2"]) .chip{ --_cbg:var(--aha-gray-30,#F1F1F1); --_cfg:var(--aha-text-secondary,#4A4A4A) }
  :host([rank="3"]) .chip{ --_cbg:var(--aha-coral-20,#FFE5D6); --_cfg:var(--aha-coral-80,#CC471A) }
  :host([rank="4"]) .chip{ --_cbg:var(--aha-gray-20,#F7F7F7); --_cfg:var(--aha-text-tertiary,#8A8A8A) }

  /* --- session --- */
  :host([session]) .chip{ --_cbg:var(--aha-bg-accent,#F9F5FF); --_cfg:var(--aha-color-primary,#6A1EBB) }

  @media (prefers-reduced-motion: reduce){ *,*::after{ transition:none !important; animation:none !important } }
`;

export class AhaBadge extends HTMLElement {
  static get observedAttributes() { return ['count', 'max', 'overflow-count', 'dot', 'status', 'text', 'color', 'show-zero', 'ribbon', 'placement', 'tone', 'plan', 'rank', 'session', 'cycle', 'href']; }
  connectedCallback() { if (!this.shadowRoot) this.attachShadow({ mode: 'open' }); this._render(); }
  attributeChangedCallback(name) {
    if (!this.shadowRoot) return;
    // count-only change → toggle the persistent pill (text + hidden class), so the scale transition fires
    if (name === 'count' && !this._isStandalone() && this.shadowRoot.querySelector('.marker')) this._syncCount();
    else this._render();
  }
  // a standalone status badge (dot + text, no count/dot marker over a child)
  _isStandalone() { return this.hasAttribute('status') && !this.hasAttribute('count') && !this.hasAttribute('dot') && !this._isChip(); }
  // a label / preset chip family — tone · plan · rank · session
  _isChip() { return this.hasAttribute('tone') || this.hasAttribute('plan') || this.hasAttribute('rank') || this.hasAttribute('session'); }
  // the default text a preset shows when the consumer supplies none (slot/text always wins)
  _chipDefaultLabel() {
    if (this.hasAttribute('session')) {
      const s = this.getAttribute('session');
      return s && s.trim() ? `Session ${esc(s)}` : 'Session';
    }
    if (this.hasAttribute('plan')) {
      const p = this.getAttribute('plan');
      const names = { free: 'Free', edu: 'Edu', essential: 'Essential', pro: 'Pro', enterprise: 'Enterprise' };
      const base = names[p] || (p ? esc(p) : '');
      const cyc = this.getAttribute('cycle');
      return cyc === 'yearly' ? `${base} · Yearly` : cyc === 'monthly' ? `${base} · Monthly` : base;
    }
    if (this.hasAttribute('rank')) {
      const r = this.getAttribute('rank');
      const ord = { '1': '1st', '2': '2nd', '3': '3rd', '4': '4th' };
      return ord[r] || (r ? esc(r) : '');
    }
    return '';
  }
  // the DS icon a preset leads with (by name — never an inline glyph); '' = no icon
  _chipIcon() {
    if (this.hasAttribute('rank')) return 'system-Medal';
    if (this.hasAttribute('plan')) {
      const p = this.getAttribute('plan');
      if (p === 'pro' || p === 'enterprise') return 'system-crown-badge-fill';
    }
    return '';
  }
  _overflow() {
    const raw = this.getAttribute('overflow-count') || this.getAttribute('max') || 99;
    const n = Number(raw); return Number.isFinite(n) ? n : 99;
  }
  _countText() {
    const count = Number(this.getAttribute('count') || 0);
    const max = this._overflow();
    return count > max ? `${max}+` : String(count);
  }
  _isHidden() {
    if (this.hasAttribute('dot')) return false;
    return Number(this.getAttribute('count') || 0) === 0 && !this.hasAttribute('show-zero');
  }
  _color() {
    const custom = this.getAttribute('color');
    if (custom) return custom;                                   // custom colour wins (consumer-supplied)
    const st = this.getAttribute('status');
    if (st) return STATUS_COLOR[st] || STATUS_COLOR.error;       // a semantic status maps to its token
    // no status: ribbon defaults to primary (antd Ribbon convention); count/dot default → error
    return this.hasAttribute('ribbon') ? STATUS_COLOR.primary : STATUS_COLOR.error;
  }
  _syncCount() {
    const m = this.shadowRoot.querySelector('.marker');
    if (!m) return;
    m.textContent = this.hasAttribute('dot') ? '' : this._countText();
    m.classList.toggle('hidden', this._isHidden());
  }
  _render() {
    // label / preset chip — tone · plan · rank · session. A clickable chip (href) is a LINK
    // (<a>), never a <button>; without href it's a plain <span>. Both are persistent nodes so the
    // link's hover (background/opacity) animates.
    if (this._isChip()) {
      this.classList.remove('has-child');
      const icon = this._chipIcon();
      const lead = icon ? `<aha-icon name="${icon}" size="14" aria-hidden="true"></aha-icon>` : '';
      // consumer content wins: a slotted child or `text`; else the preset's default label
      const supplied = this.getAttribute('text');
      const hasSlotted = this.childNodes.length > 0;
      const labelHtml = hasSlotted ? '<slot></slot>' : esc(supplied != null ? supplied : this._chipDefaultLabel());
      const inner = `${lead}<span class="chip-label">${labelHtml}</span>`;
      const href = this.getAttribute('href');
      const chip = href
        ? `<a class="chip" part="chip" href="${esc(href)}">${inner}</a>`
        : `<span class="chip" part="chip">${inner}</span>`;
      this.shadowRoot.innerHTML = `<style>${STYLE}</style>${chip}`;
      return;
    }

    // ribbon — a corner banner wrapping the slotted child (a card); placement start/end
    if (this.hasAttribute('ribbon')) {
      this.classList.remove('has-child');
      const label = esc(this.getAttribute('text') || '');
      this.style.setProperty('--aha-badge-color', this._color());
      this.shadowRoot.innerHTML = `<style>${STYLE}</style>` +
        `<span class="ribbon-wrap" part="wrap"><slot></slot>` +
        `<span class="ribbon" part="ribbon" role="status">${label}</span></span>`;
      return;
    }

    const hasChild = this.childNodes.length > 0 && !this._isStandalone();
    this.classList.toggle('has-child', hasChild);

    if (this._isStandalone()) {
      const label = esc(this.getAttribute('text') || '');
      this.style.setProperty('--aha-badge-color', this._color());
      this.shadowRoot.innerHTML = `<style>${STYLE}</style>` +
        `<span class="status" part="status" role="status"><span class="status-dot" part="dot"></span>` +
        `<span class="status-text" part="text">${label}</span></span>`;
      return;
    }

    this.style.setProperty('--aha-badge-color', this._color());
    const text = this.hasAttribute('dot') ? '' : this._countText();
    const hiddenCls = this._isHidden() ? ' hidden' : '';
    const marker = `<span class="marker${hiddenCls}" part="badge" role="status" aria-live="polite">${text}</span>`;
    this.shadowRoot.innerHTML = `<style>${STYLE}</style>` +
      (hasChild ? `<span class="wrap" part="wrap"><slot></slot></span>${marker}` : marker);
  }
}

export function defineAhaBadge(tag = 'aha-badge') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaBadge);
  return true;
}
if (typeof window !== 'undefined') defineAhaBadge();

export default { AhaBadge, defineAhaBadge };
