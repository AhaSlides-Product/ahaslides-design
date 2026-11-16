/**
 * @ahaslides-product/design/aha-loader-splash — <aha-loader> with the splash only.
 *
 *   import '@ahaslides-product/design/aha-loader-splash';   // registers <aha-loader>, no illustration
 *   <aha-loader label="Opening the editor…"></aha-loader>
 *
 * The same element as the aha-loader entry (aha-loader-core.js) and the same exports, without the
 * tiles: variant="tiles" and <html data-aha-loader="tiles"> show the splash, so nothing here refers
 * to the illustration catalogue and a bundler adds no illustration chunk. Every other attribute,
 * cycleDone, CYCLE_MS and the aha-loader-cycle event behave as in aha-loader.
 * Both entries register the same <aha-loader> tag, so an app imports only one of them: the first to
 * load defines the element and the other is a no-op.
 */
import { AhaLoaderCore } from './aha-loader-core.js';

export class AhaLoader extends AhaLoaderCore {}

export function defineAhaLoader(tag = 'aha-loader') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaLoader);
  return true;
}
if (typeof window !== 'undefined') defineAhaLoader();

export default { AhaLoader, defineAhaLoader };
