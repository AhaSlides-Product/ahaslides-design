/**
 * @ahaslides-product/design/aha-avatar — the shared Avatar primitive (+ aha-avatar-group).
 *
 *   import '@ahaslides-product/design/aha-avatar';   // registers <aha-avatar> + <aha-avatar-group>
 *   <aha-avatar name="Ada Lovelace"></aha-avatar>                 // initials
 *   <aha-avatar src="/u/ada.jpg" size="56"></aha-avatar>          // photo
 *   <aha-avatar icon="system-user"></aha-avatar>                  // glyph
 *   <aha-avatar-group max="3"> …avatars… </aha-avatar-group>      // stacked, +N overflow
 *   <aha-avatar-group max="3" add add-label="Invite"> … </aha-avatar-group>  // + a round add button (fires aha-add)
 *
 * A compact identity marker. The DS V3 Avatar is a small MATRIX, not a single shape:
 *   • shape — circle (pill radius, default) or square (radius 8)
 *   • size  — small (24) · default (40) · large (64) named steps, OR any numeric px
 *   • content — THREE modes: an image `src`, the initials of `name`, or an `<aha-icon>` glyph;
 *     an image that fails to load falls back to the no-src content until `src` changes
 *   • color — the initials/icon ground tint (a --aha-* token name; defaults to the brand tint)
 * A stacked <aha-avatar-group> overlaps its children and collapses the overflow past `max`
 * into a trailing "+N" avatar; its opt-in `add` appends a round "+" button that fires `aha-add`. ONE element, shadow-DOM CSS, themed only by --aha-* tokens →
 * byte-identical in React and Vue. Icons are summoned by name from the DS icon library via
 * <aha-icon> — never an inline glyph. The avatar is a static display marker with no motion; the
 * group's add button animates its hover, press and focus states on the shared motion tokens.
 */
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const SIZES = { small: 24, default: 40, large: 64 };
const STYLE = `
  :host{ display:inline-flex; font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif) }
  .avatar{ box-sizing:border-box; display:inline-flex; align-items:center; justify-content:center; overflow:hidden;
    width:40px; height:40px; border-radius:var(--aha-radius-pill,999px);
    position:relative; background:var(--aha-bg-container,#FFFFFF); color:var(--aha-ink,var(--aha-text-default,#1A1A1A));
    font-family:inherit; font-weight:600; font-size:15px; line-height:1;
    user-select:none }
  :host([shape="square"]) .avatar{ border-radius:var(--aha-radius-default,8px) }
  .avatar::before{ content:""; position:absolute; inset:0; background:var(--aha-ground,var(--aha-bg-accent,#E70E680D)) }
  .avatar > *{ position:relative }
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
    const src = this.src === this._failedSrc ? '' : this.src;
    const inner = src
      ? `<img src="${esc(src)}" alt="${esc(this.name)}"/>`
      : this.icon
        ? `<aha-icon name="${esc(this.icon)}" size="${(size <= 28 ? 12 : size <= 48 ? 24 : 32)}" aria-hidden="true"></aha-icon>`
        : `<span part="initials">${esc(initials(this.name))}</span>`;
    this.shadowRoot.innerHTML =
      `<style>${STYLE}</style><span class="avatar" part="avatar" role="img" aria-label="${esc(this.name || (this.icon ? 'avatar' : 'avatar'))}" ` +
      `style="width:${size}px;height:${size}px;font-size:${Math.round(size * 0.38)}px;${groundVar}">${inner}</span>`;
    const img = src && this.shadowRoot.querySelector('img');
    if (img) img.addEventListener('error', () => {
      if (this.src !== src) return;
      this._failedSrc = src;
      this._render();
    });
  }
}

/**
 * <aha-avatar-group max="3"> — overlaps stacked <aha-avatar> children and collapses everything
 * past `max` into a trailing "+N" avatar. Children keep their own size/shape; the group only
 * sets the overlap and the overflow chip (inheriting the first child's size/shape).
 *
 *   <aha-avatar-group max="3" add add-label="Invite people"> …avatars… </aha-avatar-group>
 *   group.addEventListener('aha-add', () => openInvite());
 *
 * `add` appends a round "+" button after the avatars (and after the +N chip): the group's size and
 * shape, the same 2px container ring and overlap, drawn like the secondary Button (white fill, grey
 * edge, pink on hover and press, the 2px pink focus ring). It is a real <button>: click, Enter and
 * Space fire a bubbling, composed `aha-add` event; `add-label` names it (default "Add");
 * `add-disabled` disables it. The shadow tree is built once and updated in place, so a child added
 * by the `aha-add` handler keeps keyboard focus on the button.
 */
const GROUP_STYLE = `
  :host{ display:inline-flex }
  .stack{ display:inline-flex; align-items:center }
  ::slotted(aha-avatar), .overflow{ box-shadow:0 0 0 2px var(--aha-bg-container,#FFFFFF); border-radius:inherit }
  ::slotted(aha-avatar:not(:first-child)), .overflow, .add.after{ margin-left:calc(-1px * var(--aha-avatar-overlap,10)) }
  ::slotted(aha-avatar:nth-child(3n+1):not([color])){ --aha-ground:var(--aha-vivid-pink-5,#E70E680D); --aha-ink:var(--aha-text-default,#1A1A1A) }
  ::slotted(aha-avatar:nth-child(3n+2):not([color])){ --aha-ground:var(--aha-vivid-pink-30,#E70E684D); --aha-ink:var(--aha-text-default,#1A1A1A) }
  ::slotted(aha-avatar:nth-child(3n):not([color])){ --aha-ground:var(--aha-vivid-pink-100,#E70E68); --aha-ink:var(--aha-text-inverse,#FFFFFF) }
  .overflow{ --aha-ground:var(--aha-gray-25,#F3F3F3); --aha-ink:var(--aha-text-default,#1A1A1A) }
  .add{ box-sizing:border-box; flex:none; display:inline-flex; align-items:center; justify-content:center; position:relative; padding:0; margin:0;
    width:40px; height:40px; border:1px solid var(--aha-button-default-border,#E3E3E3); border-radius:var(--aha-radius-pill,999px);
    background:var(--aha-button-default-bg,#FFFFFF); color:var(--aha-button-default-text,#1A1A1A); font:inherit; line-height:0; cursor:pointer;
    box-shadow:0 0 0 2px var(--aha-bg-container,#FFFFFF);
    transition-property:background,border-color,box-shadow,color; transition-duration:var(--aha-motion-mid,.2s); transition-timing-function:var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)) }
  .add[data-shape="square"]{ border-radius:var(--aha-radius-default,8px) }
  .add[hidden]{ display:none }
  .add:not(:disabled):hover, .add:not(:disabled):active{ border-color:var(--aha-button-default-border-hover,#E70E68); color:var(--aha-button-default-text-hover,#DB005B);
    box-shadow:inset 0 0 0 100vmax var(--aha-button-default-bg-hover,#E70E680D), 0 0 0 2px var(--aha-bg-container,#FFFFFF) }
  .add:not(:disabled):focus-visible{ outline:var(--aha-button-focus-outline,2px solid var(--aha-button-focus-ring,#E70E68)); outline-offset:var(--aha-button-focus-outline-offset,2px) }
  .add:disabled{ cursor:not-allowed; background:var(--aha-button-disabled-bg,#E3E3E3); border-color:var(--aha-button-disabled-bg,#E3E3E3); color:var(--aha-button-disabled-text,#B5B5B5) }
  @media (prefers-reduced-motion: reduce){ .add{ transition:none } }
`;
const ADD_ICON_SIZE = (px) => (px <= 28 ? 12 : px <= 48 ? 16 : 24);

export class AhaAvatarGroup extends HTMLElement {
  static get observedAttributes() { return ['max', 'overlap', 'size', 'shape', 'add', 'add-label', 'add-disabled']; }
  connectedCallback() {
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    this._build();
    this._update();
    if (!this._obs) { this._obs = new MutationObserver(() => this._update()); this._obs.observe(this, { childList: true }); }
  }
  disconnectedCallback() { if (this._obs) { this._obs.disconnect(); this._obs = null; } }
  attributeChangedCallback() { if (this._stack) this._update(); }

  _build() {
    if (this._stack) return;
    const root = this.shadowRoot;
    const style = document.createElement('style');
    style.textContent = GROUP_STYLE;
    const stack = document.createElement('span');
    stack.className = 'stack';
    stack.setAttribute('part', 'stack');
    stack.setAttribute('role', 'group');
    stack.appendChild(document.createElement('slot'));
    const chip = document.createElement('aha-avatar');
    chip.className = 'overflow';
    chip.setAttribute('part', 'overflow');
    chip.style.display = 'none';
    const add = document.createElement('button');
    add.className = 'add';
    add.type = 'button';
    add.setAttribute('part', 'add');
    add.hidden = true;
    const icon = document.createElement('aha-icon');
    icon.setAttribute('name', 'system-plus');
    icon.setAttribute('aria-hidden', 'true');
    add.appendChild(icon);
    add.addEventListener('click', () => {
      if (!add.disabled) this.dispatchEvent(new CustomEvent('aha-add', { bubbles: true, composed: true }));
    });
    stack.append(chip, add);
    root.append(style, stack);
    Object.assign(this, { _stack: stack, _chip: chip, _add: add, _addIcon: icon });
  }

  _update() {
    const overlap = parseInt(this.getAttribute('overlap') || '10', 10);
    const max = parseInt(this.getAttribute('max') || '0', 10);
    const kids = [...this.children].filter((c) => c.tagName === 'AHA-AVATAR');
    const total = kids.length;
    const size = this.getAttribute('size') || (kids[0] && kids[0].getAttribute('size')) || 'default';
    const shape = this.getAttribute('shape') || (kids[0] && kids[0].getAttribute('shape')) || 'circle';
    let shownCount = total, overflow = 0;
    if (max > 0 && total > max) { shownCount = max; overflow = total - max; }
    kids.forEach((c, i) => { c.style.display = i < shownCount ? '' : 'none'; });
    this._stack.style.setProperty('--aha-avatar-overlap', String(overlap));

    const chip = this._chip;
    if (overflow > 0) {
      chip.setAttribute('size', size);
      chip.setAttribute('shape', shape);
      chip.setAttribute('name', `+${overflow}`);
      chip.style.display = '';
    } else chip.style.display = 'none';

    const add = this._add;
    const wantAdd = this.hasAttribute('add') && this.getAttribute('add') !== 'false';
    add.hidden = !wantAdd;
    if (!wantAdd) return;
    const px = SIZES[size] || parseInt(size, 10) || 40;
    add.style.width = add.style.height = `${px}px`;
    add.dataset.shape = shape === 'square' ? 'square' : 'circle';
    add.classList.toggle('after', total > 0);
    add.setAttribute('aria-label', this.getAttribute('add-label') || 'Add');
    add.disabled = this.hasAttribute('add-disabled') && this.getAttribute('add-disabled') !== 'false';
    this._addIcon.setAttribute('size', String(ADD_ICON_SIZE(px)));
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
