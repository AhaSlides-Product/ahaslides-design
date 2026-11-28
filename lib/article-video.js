/**
 * @ahaslides-product/design/article-video — click-to-load for the Article body video facade (W9).
 *
 *   <script type="module" src=".../lib/article-video.js"></script>   // a server-rendered page
 *   import '@ahaslides-product/design/article-video';                 // a bundled app
 *
 * One click listener on the document: a click on a <button class="aha-article-video__play"
 * data-provider="youtube|vimeo|loom" data-video-id="…"> replaces that button with the provider's player
 * iframe, titled with the video title, and moves focus into it. Nothing loads from the provider before
 * the click except an optional poster image the host renders. A host that renders the iframe itself
 * (a React or Vue component holding the loaded state) calls event.preventDefault() in its own click
 * handler, and this listener then leaves the button alone; articleVideoEmbedUrl gives it the same URL.
 *
 * Embed URLs: the click is the reader's play intent, so YouTube and Vimeo start playing at once, with
 * sound, as if the reader had pressed play in the player. Loom has no documented autoplay parameter and
 * opens on its own play button.
 *   youtube  https://www.youtube-nocookie.com/embed/<id>?autoplay=1&rel=0
 *   vimeo    https://player.vimeo.com/video/<id>?autoplay=1&dnt=1   (an unlisted video adds &h=<hash> from data-video-hash)
 *   loom     https://www.loom.com/embed/<id>
 */
const PROVIDERS = {
  youtube: { id: /^[A-Za-z0-9_-]{11}$/, src: (id) => `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0` },
  vimeo: { id: /^\d{1,12}$/, src: (id, hash) => `https://player.vimeo.com/video/${id}?autoplay=1&dnt=1${hash ? `&h=${hash}` : ''}` },
  loom: { id: /^[a-f0-9]{32}$/, src: (id) => `https://www.loom.com/embed/${id}` },
};

const ALLOW = 'autoplay; encrypted-media; fullscreen; picture-in-picture';

/** The player URL for one video, or null when the provider or id is not one this facade embeds. */
export function articleVideoEmbedUrl(provider, id, hash) {
  const entry = Object.hasOwn(PROVIDERS, provider) ? PROVIDERS[provider] : null;
  if (!entry || !entry.id.test(String(id || ''))) return null;
  return entry.src(id, /^[A-Za-z0-9]{1,32}$/.test(String(hash || '')) ? hash : '');
}

/** YouTube's own still for the poster area (480 by 360); the other providers have no stable public URL, so they show the neutral tile. */
export function articleVideoPosterUrl(provider, id) {
  return provider === 'youtube' && PROVIDERS.youtube.id.test(String(id || '')) ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null;
}

/** Swaps one facade button for its player iframe and returns the iframe, or null when the button's provider or id is invalid. */
export function loadArticleVideo(button) {
  const { provider, videoId, videoHash } = button.dataset;
  const src = articleVideoEmbedUrl(provider, videoId, videoHash);
  if (!src) return null;
  const title = button.querySelector('.aha-article-video__title')?.textContent.trim() || 'Video';
  const iframe = button.ownerDocument.createElement('iframe');
  iframe.src = src;
  iframe.title = title;
  iframe.allow = ALLOW;
  iframe.allowFullscreen = true;
  iframe.referrerPolicy = 'strict-origin-when-cross-origin';
  button.replaceWith(iframe);
  iframe.focus();
  return iframe;
}

const WIRED = Symbol.for('aha.articleVideo');
if (typeof document !== 'undefined' && !document[WIRED]) {
  document[WIRED] = true;
  document.addEventListener('click', (event) => {
    const button = event.target instanceof Element ? event.target.closest('button.aha-article-video__play') : null;
    if (button && !event.defaultPrevented) loadArticleVideo(button);
  });
}
