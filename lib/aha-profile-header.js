/**
 * @ahaslides-product/design/aha-profile-header — a person's profile header, or the same header as a user card.
 *
 *   import '@ahaslides-product/design/aha-profile-header';   // registers <aha-profile-header> (+ <aha-avatar>)
 *   <aha-profile-header name="Dave Bui" username="AhaDave" src="/u/dave.jpg"
 *     details='[{"label":"Joined","value":"Jul 30"},{"label":"Invited by","value":"cheryl","href":"/u/cheryl"}]'>
 *     <aha-button slot="actions" variant="primary">Follow</aha-button>
 *     <aha-button slot="actions" variant="secondary">Message</aha-button>
 *     <div slot="stats">…a row of <aha-statistic> or the stat strip…</div>
 *     <aha-tabs slot="nav" type="line">…</aha-tabs>
 *   </aha-profile-header>
 *
 * `variant="page"` (default) is the profile page header: a 144px avatar (96px when the header is
 * narrower than 600px), the name at the h3 size, the username under it, the actions beside them.
 * `variant="card"` is the user card a host pops over a name: a framed panel, a 96px avatar, the name
 * at the h4 size and the actions on their own row.
 * `details` is a JSON list of { label, value, href? } shown as a description list; every value is set
 * as text, so host data never renders as markup. Empty slots collapse.
 * Reuses <aha-avatar>; the actions, stats and nav are the host's own <aha-button>, statistic row and
 * <aha-tabs>. The shadow DOM is built once; attribute changes update persistent nodes.
 */
import './aha-avatar.js';

const NARROW = 600;

const STYLE = `
  :host{ display:block; font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif) }
  :host([hidden]), [hidden]{ display:none !important }
  .head{ box-sizing:border-box; color:var(--aha-text-default,#1A1A1A) }
  :host([variant="card"]) .head{ padding:var(--aha-space-24,24px); background:var(--aha-bg-elevated,#FFFFFF);
    border:1px solid var(--aha-border-default,#E3E3E3); border-radius:var(--aha-radius-lg,12px);
    box-shadow:0 4px 12px var(--aha-ink-a10,rgba(0,0,0,.1)) }
  .identity{ display:flex; flex-wrap:wrap; align-items:center; gap:var(--aha-space-16,16px) var(--aha-space-24,24px) }
  :host([variant="card"]) .identity{ gap:var(--aha-space-16,16px) }
  aha-avatar{ flex:none }
  .names{ flex:1 1 200px; min-width:0; display:flex; flex-direction:column; gap:var(--aha-space-4,4px) }
  .name{ margin:0; font-size:var(--aha-size-h3,32px); line-height:var(--aha-line-height-heading,1.3);
    font-weight:var(--aha-weight-semibold,600); color:var(--aha-text-default,#1A1A1A); overflow-wrap:anywhere }
  .head.narrow .name, :host([variant="card"]) .name{ font-size:var(--aha-size-h4,24px) }
  .username{ margin:0; font-size:var(--aha-size-l,16px); line-height:var(--aha-line-height-body,1.5);
    font-weight:var(--aha-weight-regular,400); color:var(--aha-text-secondary,#4A4A4A); overflow-wrap:anywhere }
  .actions{ display:flex; flex-wrap:wrap; align-items:center; gap:var(--aha-space-8,8px) }
  :host([variant="card"]) .actions, .head.narrow .actions{ flex-basis:100% }
  .details{ display:flex; flex-wrap:wrap; gap:var(--aha-space-4,4px) var(--aha-space-24,24px);
    margin:var(--aha-space-16,16px) 0 0; padding:0; font-size:var(--aha-size-default,14px); line-height:var(--aha-line-height-body,1.5) }
  .detail{ display:flex; gap:var(--aha-space-4,4px); min-width:0 }
  .detail dt{ font-weight:var(--aha-weight-regular,400); color:var(--aha-text-tertiary,#616161) }
  .detail dd{ margin:0; font-weight:var(--aha-weight-regular,400); color:var(--aha-text-default,#1A1A1A); overflow-wrap:anywhere }
  .detail a{ color:var(--aha-text-link,#DB005B); text-decoration:none; border-radius:var(--aha-radius-xs,4px);
    outline:2px solid transparent; outline-offset:2px;
    transition:outline-color var(--aha-motion-fast,.1s) var(--aha-ease-out,ease-out) }
  .detail a:hover{ text-decoration:underline }
  .detail a:focus-visible{ outline-color:var(--aha-border-focus,#E70E68) }
  .stats, .nav{ margin-top:var(--aha-space-24,24px) }
  :host([variant="card"]) .stats{ margin-top:var(--aha-space-16,16px) }
`;

const parseDetails = (raw) => {
  if (!raw) return [];
  try {
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list.filter((d) => d && d.label != null && d.value != null) : [];
  } catch { return []; }
};

const level = (raw) => {
  const n = parseInt(raw, 10);
  return n >= 1 && n <= 6 ? n : 2;
};

export class AhaProfileHeader extends HTMLElement {
  static get observedAttributes() { return ['name', 'username', 'src', 'variant', 'heading-level', 'details']; }

  connectedCallback() {
    if (!this.shadowRoot) this._build();
    this._sync();
    if (typeof ResizeObserver !== 'undefined' && !this._ro) {
      this._ro = new ResizeObserver(() => this._fit());
      this._ro.observe(this);
    }
  }

  disconnectedCallback() {
    if (this._ro) { this._ro.disconnect(); this._ro = null; }
  }

  attributeChangedCallback() { if (this._head) this._sync(); }

  _build() {
    const root = this.attachShadow({ mode: 'open' });
    root.innerHTML = `<style>${STYLE}</style>
      <div class="head" part="header">
        <div class="identity">
          <aha-avatar size="144" aria-hidden="true"></aha-avatar>
          <div class="names">
            <div class="name" part="name" role="heading"></div>
            <p class="username" part="username"></p>
          </div>
          <div class="actions" part="actions"><slot name="actions"></slot></div>
        </div>
        <dl class="details" part="details"></dl>
        <div class="stats" part="stats"><slot name="stats"></slot></div>
        <div class="nav" part="nav"><slot name="nav"></slot></div>
      </div>`;
    const $ = (s) => root.querySelector(s);
    this._head = $('.head');
    this._avatar = $('aha-avatar');
    this._name = $('.name');
    this._username = $('.username');
    this._details = $('.details');
    for (const wrap of root.querySelectorAll('.actions, .stats, .nav')) {
      const slot = wrap.querySelector('slot');
      const toggle = () => { wrap.hidden = slot.assignedElements().length === 0; };
      slot.addEventListener('slotchange', toggle);
      toggle();
    }
  }

  _sync() {
    const a = (n) => this.getAttribute(n) || '';
    this._name.textContent = a('name');
    this._name.setAttribute('aria-level', String(level(a('heading-level'))));
    this._username.textContent = a('username');
    this._username.hidden = !a('username');

    this._avatar.setAttribute('name', a('name') || a('username'));
    if (a('src')) this._avatar.setAttribute('src', a('src'));
    else this._avatar.removeAttribute('src');

    const rows = parseDetails(a('details')).map(({ label, value, href }) => {
      const row = document.createElement('div');
      row.className = 'detail';
      const dt = document.createElement('dt');
      dt.textContent = String(label);
      const dd = document.createElement('dd');
      if (href) {
        const link = document.createElement('a');
        link.href = String(href);
        link.textContent = String(value);
        dd.append(link);
      } else dd.textContent = String(value);
      row.append(dt, dd);
      return row;
    });
    this._details.replaceChildren(...rows);
    this._details.hidden = rows.length === 0;
    this._fit();
  }

  _fit() {
    const card = this.getAttribute('variant') === 'card';
    const width = this.getBoundingClientRect().width;
    const narrow = !card && width > 0 && width < NARROW;
    this._head.classList.toggle('narrow', narrow);
    const size = card || narrow ? '96' : '144';
    if (this._avatar.getAttribute('size') !== size) this._avatar.setAttribute('size', size);
  }
}

export function defineAhaProfileHeader(tag = 'aha-profile-header') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaProfileHeader);
  return true;
}
if (typeof window !== 'undefined') defineAhaProfileHeader();

export default { AhaProfileHeader, defineAhaProfileHeader };
