/**
 * @ahaslides-product/design/aha-achievement-badge — one achievement badge a member earned or can earn.
 *
 *   import '@ahaslides-product/design/aha-achievement-badge';   // registers <aha-achievement-badge> (+ <aha-tag>; <aha-icon> comes from icons.js)
 *   <aha-achievement-badge icon="system-medal" badge-title="Leader" href="/badges/4/leader" tier="gold"
 *     description="Global edit, pin, close, archive, split and merge" granted="3 Oct 2026"
 *     datetime="2026-10-03" grant-count="12"></aha-achievement-badge>
 *
 * A card: a 32px registry glyph in ink, the title (a link when `href` is set) with the tier as a
 * neutral tag beside it, a plain-text description and a meta row ("Granted 3 Oct 2026", "12 granted").
 * Gold, silver and bronze are words, never hues. Styled by the shared class layer in
 * achievement-badge-css.js, the same CSS a host with its own markup links as lib/achievement-badge.css.
 * The shadow DOM is built once; attribute changes update text and attributes on persistent nodes.
 */
import './aha-tag.js';
import { ACHIEVEMENT_BADGE_CSS } from './achievement-badge-css.js';

const STYLE = `
  :host{ display:block }
  :host([hidden]), [hidden]{ display:none !important }
  ${ACHIEVEMENT_BADGE_CSS}
`;

const TIERS = { gold: 'Gold', silver: 'Silver', bronze: 'Bronze' };

export class AhaAchievementBadge extends HTMLElement {
  static get observedAttributes() {
    return ['icon', 'badge-title', 'href', 'description', 'tier', 'granted', 'datetime', 'grant-count'];
  }

  connectedCallback() {
    if (!this.shadowRoot) this._build();
    this._sync();
  }

  attributeChangedCallback() { if (this._card) this._sync(); }

  _build() {
    const root = this.attachShadow({ mode: 'open' });
    root.innerHTML = `<style>${STYLE}</style>
      <div class="aha-achievement-badge" part="card">
        <aha-icon class="aha-achievement-badge__icon" size="32" decorative></aha-icon>
        <div class="aha-achievement-badge__info">
          <div class="aha-achievement-badge__head">
            <a class="aha-achievement-badge__title" part="title"></a>
            <aha-tag class="aha-achievement-badge__tag"></aha-tag>
          </div>
          <p class="aha-achievement-badge__description" part="description"></p>
          <div class="aha-achievement-badge__meta" part="meta">
            <span class="aha-achievement-badge__granted">Granted <time></time></span>
            <span class="aha-achievement-badge__count"></span>
          </div>
        </div>
      </div>`;
    const $ = (s) => root.querySelector(s);
    this._card = $('.aha-achievement-badge');
    this._icon = $('.aha-achievement-badge__icon');
    this._title = $('.aha-achievement-badge__title');
    this._tag = $('.aha-achievement-badge__tag');
    this._description = $('.aha-achievement-badge__description');
    this._meta = $('.aha-achievement-badge__meta');
    this._granted = $('.aha-achievement-badge__granted');
    this._time = $('time');
    this._count = $('.aha-achievement-badge__count');
  }

  _sync() {
    const a = (n) => (this.getAttribute(n) || '').trim();

    this._icon.setAttribute('name', a('icon') || 'system-medal');

    this._title.textContent = a('badge-title');
    if (a('href')) this._title.setAttribute('href', a('href'));
    else this._title.removeAttribute('href');

    const tier = TIERS[a('tier').toLowerCase()] || '';
    this._tag.textContent = tier;
    this._tag.hidden = !tier;

    this._description.textContent = a('description');
    this._description.hidden = !a('description');

    this._time.textContent = a('granted');
    if (a('datetime')) this._time.setAttribute('datetime', a('datetime'));
    else this._time.removeAttribute('datetime');
    this._granted.hidden = !a('granted');

    const n = a('grant-count') === '' ? NaN : Number(a('grant-count'));
    const count = Number.isFinite(n) && n >= 0 ? n : null;
    this._count.textContent = count === null ? '' : `${count.toLocaleString('en-GB')} granted`;
    this._count.hidden = count === null;

    this._meta.hidden = this._granted.hidden && this._count.hidden;
  }
}

export function defineAhaAchievementBadge(tag = 'aha-achievement-badge') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaAchievementBadge);
  return true;
}
if (typeof window !== 'undefined') defineAhaAchievementBadge();

export default { AhaAchievementBadge, defineAhaAchievementBadge };
