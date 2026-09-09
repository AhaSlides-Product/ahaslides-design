/**
 * @ahaslides-product/design/aha-avatar — the shared Avatar primitive.
 *
 *   import '@ahaslides-product/design/aha-avatar';   // registers <aha-avatar>
 *   <aha-avatar name="Ada Lovelace"></aha-avatar>
 *   <aha-avatar src="/u/ada.jpg" size="56"></aha-avatar>
 *
 * A compact identity marker — a photo, or the initials of `name` on a tinted ground. ONE element,
 * shadow-DOM CSS, themed only by --aha-* tokens → byte-identical in React and Vue. Zero
 * dependencies. A purely static display marker, so it declares no motion.
 */
const STYLE = `
  :host{ display:inline-flex }
  .avatar{ box-sizing:border-box; display:inline-flex; align-items:center; justify-content:center; overflow:hidden;
    width:40px; height:40px; border-radius:var(--aha-radius-pill,999px);
    background:var(--aha-bg-accent,#F9F5FF); color:var(--aha-purple-60,#6A1EBB);
    font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif); font-weight:600; font-size:15px; line-height:1;
    user-select:none }
  :host([shape="square"]) .avatar{ border-radius:var(--aha-radius-default,8px) }
  .avatar img{ width:100%; height:100%; object-fit:cover; display:block }
`;

export class AhaAvatar extends HTMLElement {
  get name() { return this.getAttribute('name') || ''; }
  get src() { return this.getAttribute('src') || ''; }
  get size() { return parseInt(this.getAttribute('size') || '40', 10); }

  connectedCallback() {
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    const size = this.size;
    const inner = this.src
      ? `<img src="${this.src}" alt="${this.name}"/>`
      : `<span part="initials">${initials(this.name)}</span>`;
    this.shadowRoot.innerHTML =
      `<style>${STYLE}</style><span class="avatar" part="avatar" role="img" aria-label="${this.name || 'avatar'}" style="width:${size}px;height:${size}px;font-size:${Math.round(size * 0.38)}px">${inner}</span>`;
  }
}

function initials(name) {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function defineAhaAvatar(tag = 'aha-avatar') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaAvatar);
  return true;
}
if (typeof window !== 'undefined') defineAhaAvatar();

export default { AhaAvatar, defineAhaAvatar };
