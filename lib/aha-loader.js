/**
 * @ahaslides-product/design/aha-loader — the AhaSlides environment-transition loading SCREEN.
 *
 *   import '@ahaslides-product/design/aha-loader';   // registers <aha-loader>; variant="tiles" also loads <aha-illustration>
 *   <aha-loader></aha-loader>
 *   <aha-loader variant="tiles"></aha-loader>         // the previous five-tile look
 *
 * The element, its looks and its timing are described in aha-loader-core.js. This entry honours
 * variant="tiles" and <html data-aha-loader="tiles">, and loads the illustration catalogue the first
 * time a loader shows the tiles; a bundler still emits that catalogue as a chunk of its own.
 * An app that never shows the tiles imports aha-loader-splash instead, which leaves the catalogue
 * out. Both register the same <aha-loader> tag, so an app imports only one of them: the first to load
 * defines the element and the other is a no-op.
 */
import { AhaLoaderCore } from './aha-loader-core.js';

export class AhaLoader extends AhaLoaderCore {
  static get _drawsTiles() { return true; }
  // Only the tiles need the illustration catalogue; the splash must stay light on audience phones.
  _loadTileArt() { import('./illustrations.js').catch(() => {}); }
}

export function defineAhaLoader(tag = 'aha-loader') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaLoader);
  return true;
}
if (typeof window !== 'undefined') defineAhaLoader();

export default { AhaLoader, defineAhaLoader };
