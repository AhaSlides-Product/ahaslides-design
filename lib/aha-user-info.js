/**
 * @ahaslides-product/design/aha-user-info — the shared User info identity row.
 *
 *   import '@ahaslides-product/design/aha-user-info';   // registers <aha-user-info> (+ <aha-avatar>)
 *   <aha-user-info name="Brian Le" email="brian@ahaslides.com" src="/u/brian.jpg"></aha-user-info>
 *   <aha-user-info name="Brian Le"></aha-user-info>                          <!-- name-only compact -->
 *
 * A person/identity row: an avatar next to a name, with an optional email underneath. It REUSES
 * the shared <aha-avatar> for the picture/initials — it never re-implements one. Two layouts:
 *   • email present  → default: a 40px avatar + name (14/600) over email (12/400)
 *   • email omitted  → compact: a 24px avatar + name only, on one line
 * The `size` prop ('default' | 'compact') can force the compact form even with an email.
 * ONE element, shadow-DOM CSS, themed only by --aha-* tokens → byte-identical in React and Vue.
 * A purely static display marker, so it declares no motion. The name renders as real text and
 * the avatar is aria-hidden (decorative — the name carries the accessible identity).
 */
import './aha-avatar.js';   // registers <aha-avatar> — the reused identity picture/initials primitive

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const STYLE = `
  :host{ display:inline-flex }
  .row{ box-sizing:border-box; display:inline-flex; align-items:center; gap:var(--aha-gap, 8px);
    font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif) }
  .text{ display:flex; flex-direction:column; min-width:0 }
  .name{ font-size:14px; line-height:1.5; font-weight:600; letter-spacing:0.2px;
    color:var(--aha-text-default,#1A1A1A);
    white-space:nowrap; overflow:hidden; text-overflow:ellipsis }
  .email{ font-size:12px; line-height:1.5; font-weight:400; letter-spacing:0.3px;
    color:var(--aha-text-tertiary,#8A8A8A);
    white-space:nowrap; overflow:hidden; text-overflow:ellipsis }
`;

export class AhaUserInfo extends HTMLElement {
  static get observedAttributes() { return ['name', 'email', 'src', 'size']; }
  get name() { return this.getAttribute('name') || ''; }
  get email() { return this.getAttribute('email') || ''; }
  get src() { return this.getAttribute('src') || ''; }
  /** 'default' shows email + a 40px avatar; 'compact' (or no email) is name-only + a 24px avatar. */
  get compact() {
    const size = (this.getAttribute('size') || '').toLowerCase();
    if (size === 'compact') return true;
    if (size === 'default') return false;
    return !this.email;   // default policy: no email → compact
  }

  connectedCallback() {
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    this._render();
  }
  attributeChangedCallback() { if (this.shadowRoot) this._render(); }

  _render() {
    const compact = this.compact;
    const avatarSize = compact ? 24 : 40;
    const showEmail = !compact && !!this.email;
    // Reuse the shared avatar for the picture/initials — decorative, the name carries the identity.
    const avatar = `<aha-avatar name="${esc(this.name)}"${this.src ? ` src="${esc(this.src)}"` : ''}` +
      ` size="${avatarSize}" aria-hidden="true"></aha-avatar>`;
    const email = showEmail ? `<span class="email" part="email">${esc(this.email)}</span>` : '';
    this.shadowRoot.innerHTML =
      `<style>${STYLE}</style>` +
      `<span class="row" part="row">${avatar}` +
      `<span class="text"><span class="name" part="name">${esc(this.name)}</span>${email}</span></span>`;
  }
}

export function defineAhaUserInfo(tag = 'aha-user-info') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaUserInfo);
  return true;
}
if (typeof window !== 'undefined') defineAhaUserInfo();

export default { AhaUserInfo, defineAhaUserInfo };
