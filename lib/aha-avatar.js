/**
 * @ahaslides-product/design/aha-avatar — the shared Avatar primitive (+ aha-avatar-group).
 *
 *   import '@ahaslides-product/design/aha-avatar';   // registers <aha-avatar> + <aha-avatar-group>
 *   <aha-avatar name="Ada Lovelace"></aha-avatar>                 // initials
 *   <aha-avatar src="/u/ada.jpg" size="56"></aha-avatar>          // photo
 *   <aha-avatar icon="system-user"></aha-avatar>                  // glyph
 *   <aha-avatar-group max="3"> …avatars… </aha-avatar-group>      // stacked, +N overflow
 *
 * A compact identity marker. The DS V3 Avatar is a small MATRIX, not a single shape:
 *   • shape — circle (pill radius, default) or square (radius 8)
 *   • size  — small (24) · default (40) · large (64) named steps, OR any numeric px
 *   • content — THREE modes: an image `src`, the initials of `name`, or an `<aha-icon>` glyph
 *   • color — the initials/icon ground tint (a --aha-* token name; defaults to the brand tint)
 * A stacked <aha-avatar-group> overlaps its children and collapses the overflow past `max`
 * into a trailing "+N" avatar. ONE element, shadow-DOM CSS, themed only by --aha-* tokens →
 * byte-identical in React and Vue. Icons are summoned by name from the DS icon library via
 * <aha-icon> — never an inline glyph. A purely static display marker, so it declares no motion.
 */
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const SIZES = { small: 24, default: 40, large: 64 };
const STYLE = `
  :host{ display:inline-flex }
  .avatar{ box-sizing:border-box; display:inline-flex; align-items:center; justify-content:center; overflow:hidden;
    width:40px; height:40px; border-radius:var(--aha-radius-pill,999px);
    background:var(--aha-ground,var(--aha-bg-accent,#F9F5FF)); color:var(--aha-ink,var(--aha-purple-60,#6A1EBB));
    font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif); font-weight:600; font-size:15px; line-height:1;
    user-select:none }
  :host([shape="square"]) .avatar{ border-radius:var(--aha-radius-default,8px) }
  .avatar img{ width:100%; height:100%; object-fit:cover; display:block }
  aha-icon{ color:currentColor }
`;

export class AhaAvatar extends HTMLElement {
  static get observedAttributes() { return ['name', 'src', 'icon', 'size', 'shape', 'color']; }
  get name() { return this.getAttribute('name') || ''; }
  get src() { return this.getAttribute('src') || ''; }
  get icon() { return this.getAttribute('icon') || ''; }
  get size() {
    const raw = this.getAttribute('size') || 'default';
    return SIZES[raw] || parseInt(raw, 10) || 40;
  }

  connectedCallback() {
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    this._render();
  }
  attributeChangedCallback() { if (this.shadowRoot) this._render(); }

  _render() {
    const size = this.size;
    const ground = this.getAttribute('color');   // a --aha-* token name, e.g. "bg-positive"
    const groundVar = ground ? `--aha-ground:var(--aha-${esc(ground)});` : '';
    const inner = this.src
      ? `<img src="${esc(this.src)}" alt="${esc(this.name)}"/>`
      : this.icon
        ? `<aha-icon name="${esc(this.icon)}" size="${Math.round(size * 0.5)}" aria-hidden="true"></aha-icon>`
        : `<span part="initials">${esc(initials(this.name))}</span>`;
    this.shadowRoot.innerHTML =
      `<style>${STYLE}</style><span class="avatar" part="avatar" role="img" aria-label="${esc(this.name || (this.icon ? 'avatar' : 'avatar'))}" ` +
      `style="width:${size}px;height:${size}px;font-size:${Math.round(size * 0.38)}px;${groundVar}">${inner}</span>`;
  }
}

/**
 * <aha-avatar-group max="3"> — overlaps stacked <aha-avatar> children and collapses everything
 * past `max` into a trailing "+N" avatar. Children keep their own size/shape; the group only
 * sets the overlap and the overflow chip (inheriting the first child's size/shape).
 */
export class AhaAvatarGroup extends HTMLElement {
  static get observedAttributes() { return ['max', 'overlap', 'size', 'shape']; }
  connectedCallback() {
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    this._render();
    // children may hydrate after connect — re-render once on the next frame
    if (!this._obs) { this._obs = new MutationObserver(() => this._render()); this._obs.observe(this, { childList: true }); }
  }
  disconnectedCallback() { if (this._obs) { this._obs.disconnect(); this._obs = null; } }
  attributeChangedCallback() { if (this.shadowRoot) this._render(); }

  _render() {
    const overlap = parseInt(this.getAttribute('overlap') || '10', 10);
    const max = parseInt(this.getAttribute('max') || '0', 10);
    const kids = [...this.children].filter((c) => c.tagName === 'AHA-AVATAR');
    const total = kids.length;
    const size = this.getAttribute('size') || (kids[0] && kids[0].getAttribute('size')) || 'default';
    const shape = this.getAttribute('shape') || (kids[0] && kids[0].getAttribute('shape')) || 'circle';
    let shown = kids, overflow = 0;
    if (max > 0 && total > max) { shown = kids.slice(0, max); overflow = total - max; }
    // hide/show real children via a slot-per-child model: reflect visibility onto the light DOM
    kids.forEach((c, i) => { c.style.display = i < shown.length ? '' : 'none'; });
    const chip = overflow > 0
      ? `<aha-avatar class="overflow" part="overflow" size="${esc(size)}" shape="${esc(shape)}" name="+${overflow}"></aha-avatar>`
      : '';
    this.shadowRoot.innerHTML =
      `<style>
        :host{ display:inline-flex }
        .stack{ display:inline-flex; align-items:center }
        ::slotted(aha-avatar), .overflow{ box-shadow:0 0 0 2px var(--aha-bg-container,#FFFFFF); border-radius:inherit }
        ::slotted(aha-avatar:not(:first-child)), .overflow{ margin-left:-${overlap}px }
      </style>
      <span class="stack" part="stack" role="group"><slot></slot>${chip}</span>`;
  }
}

function initials(name) {
  const s = String(name).trim();
  if (s[0] === '+') return s;           // an overflow chip ("+3") shows verbatim
  const parts = s.split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function defineAhaAvatar(tag = 'aha-avatar', groupTag = 'aha-avatar-group') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaAvatar);
  if (!customElements.get(groupTag)) customElements.define(groupTag, AhaAvatarGroup);
  return true;
}
if (typeof window !== 'undefined') defineAhaAvatar();

export default { AhaAvatar, AhaAvatarGroup, defineAhaAvatar };
