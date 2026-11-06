/**
 * @ahaslides-product/design/aha-post — one post in a forum or community post stream.
 *
 *   import '@ahaslides-product/design/aha-post';   // registers <aha-post> (+ <aha-avatar>, <aha-tag>, <aha-button>)
 *   <aha-post author="Ada Lovelace" username="ada" role="Staff" avatar-src="/u/ada.jpg"
 *     time="2h" datetime="2026-11-05T09:00:00Z" likes="4">
 *     <p>Limit answers to one word per person, then filter.</p>
 *   </aha-post>
 *
 * Author row (40px avatar, name, username, role tag, time at the end), the body, then an action bar
 * of text buttons: like (with its count), reply, share and an icon-only more. The body is the
 * element's own light-DOM children (a host's already-sanitised HTML, such as Discourse's cooked
 * post), slotted, never parsed from an attribute. Quote and code block rules reach it through a
 * stylesheet the element adopts into its root, scoped to `aha-post`.
 * Buttons fire a bubbling, composed `aha-post-action` event, detail { action }: like, reply, share
 * or more. The host owns the state: it sets `liked` and `likes` after its own request succeeds.
 * The shadow DOM is built once; attribute changes update text and attributes on persistent nodes.
 */
import './aha-avatar.js';
import './aha-tag.js';
import './aha-button.js';
import { POST_CSS, postBodyCss } from './post-css.js';

const STYLE = `
  :host{ display:block }
  :host([hidden]), [hidden]{ display:none !important }
  ${POST_CSS}
`;

const ACTIONS = ['like', 'reply', 'share', 'more'];

let bodySheet = null;
function adoptBodyRules(root) {
  if (!root || !('adoptedStyleSheets' in root) || typeof CSSStyleSheet !== 'function') return;
  if (!bodySheet) {
    bodySheet = new CSSStyleSheet();
    bodySheet.replaceSync(postBodyCss('aha-post'));
  }
  if (!root.adoptedStyleSheets.includes(bodySheet)) root.adoptedStyleSheets = [...root.adoptedStyleSheets, bodySheet];
}

const count = (v) => {
  if (v.trim() === '') return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : null;
};

export class AhaPost extends HTMLElement {
  static get observedAttributes() {
    return ['author', 'username', 'role', 'avatar-src', 'author-href', 'time', 'datetime', 'href',
      'likes', 'liked', 'actions'];
  }

  connectedCallback() {
    if (!this.shadowRoot) this._build();
    adoptBodyRules(this.getRootNode());
    this._sync();
  }

  attributeChangedCallback() { if (this._row) this._sync(); }

  _build() {
    const root = this.attachShadow({ mode: 'open' });
    root.innerHTML = `<style>${STYLE}</style>
      <article class="aha-post" part="post">
        <div class="aha-post__avatar"><aha-avatar size="40" aria-hidden="true"></aha-avatar></div>
        <div class="aha-post__main">
          <div class="aha-post__head" part="head">
            <a class="aha-post__name"></a>
            <span class="aha-post__username"></span>
            <aha-tag class="aha-post__tag"></aha-tag>
            <a class="aha-post__time"><time></time></a>
          </div>
          <div class="aha-post__body" part="body"><slot></slot></div>
          <div class="aha-post__actions" part="actions" role="group" aria-label="Post actions">
            <aha-button variant="text" size="sm" data-action="like"><aha-icon slot="icon" name="system-heart-straight" size="16" decorative></aha-icon><span class="aha-post__count"></span></aha-button>
            <aha-button variant="text" size="sm" data-action="reply"><aha-icon slot="icon" name="system-arrow-u-up-left" size="16" decorative></aha-icon>Reply</aha-button>
            <aha-button variant="text" size="sm" icon-only aria-label="Share" data-action="share"><aha-icon name="system-link" size="16" decorative></aha-icon></aha-button>
            <aha-button variant="text" size="sm" icon-only aria-label="More" aria-haspopup="menu" data-action="more"><aha-icon name="system-dots-three" size="16" decorative></aha-icon></aha-button>
          </div>
        </div>
      </article>`;
    const $ = (s) => root.querySelector(s);
    this._row = $('.aha-post');
    this._avatar = $('aha-avatar');
    this._name = $('.aha-post__name');
    this._username = $('.aha-post__username');
    this._tag = $('.aha-post__tag');
    this._timeLink = $('.aha-post__time');
    this._time = $('time');
    this._buttons = Object.fromEntries(ACTIONS.map((k) => [k, $(`[data-action="${k}"]`)]));
    this._heart = this._buttons.like.querySelector('aha-icon');
    this._count = $('.aha-post__count');
    $('.aha-post__actions').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn || btn.hasAttribute('disabled')) return;
      this.dispatchEvent(new CustomEvent('aha-post-action', { bubbles: true, composed: true, detail: { action: btn.dataset.action } }));
    });
  }

  _sync() {
    const a = (n) => this.getAttribute(n) || '';
    const author = a('author') || a('username');

    this._avatar.setAttribute('name', author);
    if (a('avatar-src')) this._avatar.setAttribute('src', a('avatar-src'));
    else this._avatar.removeAttribute('src');

    this._name.textContent = author;
    if (a('author-href')) this._name.setAttribute('href', a('author-href'));
    else this._name.removeAttribute('href');

    const showUsername = a('username') && a('author') && a('username') !== a('author');
    this._username.textContent = showUsername ? a('username') : '';
    this._username.hidden = !showUsername;

    this._tag.textContent = a('role');
    this._tag.hidden = !a('role');

    this._time.textContent = a('time');
    this._timeLink.hidden = !a('time');
    if (a('datetime')) this._time.setAttribute('datetime', a('datetime'));
    else this._time.removeAttribute('datetime');
    if (a('href')) this._timeLink.setAttribute('href', a('href'));
    else this._timeLink.removeAttribute('href');

    const liked = this.hasAttribute('liked') && a('liked') !== 'false';
    const likes = count(a('likes'));
    this._heart.setAttribute('name', liked ? 'system-heart-straight-filled' : 'system-heart-straight');
    this._count.textContent = likes ? String(likes) : '';
    this._count.hidden = !likes;
    const like = this._buttons.like;
    like.setAttribute('aria-pressed', liked ? 'true' : 'false');
    like.setAttribute('aria-label', likes ? `Like, ${likes} ${likes === 1 ? 'like' : 'likes'}` : 'Like');

    const shown = this.hasAttribute('actions') ? a('actions').split(/\s+/).filter(Boolean) : ACTIONS;
    for (const k of ACTIONS) this._buttons[k].hidden = !shown.includes(k);
  }
}

export function defineAhaPost(tag = 'aha-post') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaPost);
  return true;
}
if (typeof window !== 'undefined') defineAhaPost();

export default { AhaPost, defineAhaPost };
