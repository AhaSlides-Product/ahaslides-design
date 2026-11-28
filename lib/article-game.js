/**
 * @ahaslides-product/design/article-game — click-to-load for the Article body game poster.
 *
 *   <script type="module" src=".../lib/article-game.js"></script>   // a server-rendered page
 *   import '@ahaslides-product/design/article-game';                 // a bundled app
 *
 * One click listener on the document: a click on an <aha-button class="aha-article-game__play"
 * data-play-url="https://audience.ahaslides.com/<code>"> replaces the poster and panel in its
 * .aha-article-game__stage with the game's iframe (the play URL with embed=1, as on the library game
 * page), titled "Play <title>", and moves focus into it. Nothing loads from the game before the click
 * except the cover image the host renders. A host that renders the iframe itself (a React or Vue
 * component holding the playing state) calls event.preventDefault() in its own click handler, and this
 * listener then leaves the poster alone; articleGameEmbedUrl gives it the same URL.
 *
 * Only play URLs on ARTICLE_GAME_ORIGINS load; any other URL leaves the poster in place.
 */
export const ARTICLE_GAME_ORIGINS = Object.freeze(['https://audience.ahaslides.com']);

const ALLOW = 'fullscreen; autoplay; clipboard-write';

/** The iframe URL for one play URL, or null when it is not an https URL on an allowed origin. */
export function articleGameEmbedUrl(playUrl) {
  let url;
  try { url = new URL(String(playUrl || '')); } catch { return null; }
  if (!ARTICLE_GAME_ORIGINS.includes(url.origin) || url.username || url.password) return null;
  url.searchParams.set('embed', '1');
  return url.toString();
}

/** Swaps one poster for its game iframe and returns the iframe, or null when the play URL is not allowed. */
export function loadArticleGame(button) {
  const stage = button.closest('.aha-article-game__stage');
  const src = articleGameEmbedUrl(button.dataset.playUrl);
  if (!stage || !src) return null;
  const title = stage.querySelector('.aha-article-game__title')?.textContent.trim() || 'game';
  const iframe = button.ownerDocument.createElement('iframe');
  iframe.src = src;
  iframe.title = `Play ${title}`;
  iframe.allow = ALLOW;
  iframe.referrerPolicy = 'strict-origin-when-cross-origin';
  stage.replaceChildren(iframe);
  iframe.focus();
  return iframe;
}

const WIRED = Symbol.for('aha.articleGame');
if (typeof document !== 'undefined' && !document[WIRED]) {
  document[WIRED] = true;
  document.addEventListener('click', (event) => {
    const button = event.target instanceof Element ? event.target.closest('.aha-article-game__play') : null;
    if (button && !event.defaultPrevented) loadArticleGame(button);
  });
}
