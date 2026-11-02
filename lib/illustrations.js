/**
 * @ahaslides-product/design/illustrations — the shared, importable illustration system.
 *
 *   import '@ahaslides-product/design/illustrations';                 // registers <aha-illustration> (browser)
 *   import { illustrations, ILLUSTRATION_NAMES } from '@ahaslides-product/design/illustrations';  // the catalogue
 *
 * Call spot art BY NAME — never paste an <svg>:  <aha-illustration name="empty-team" size="128" />
 * Unlike <aha-icon> (one-colour, currentColor), an illustration is MULTI-COLOUR: it keeps its own
 * palette and just scales, preserving aspect ratio via the viewBox. Size is a single edge (px); the
 * other edge follows the art's intrinsic ratio. Zero dependencies.
 *
 * This entry carries the whole catalogue. <aha-empty>, DataTable and createRenderEmpty load only
 * their own two pictures (empty-list, empty-table), so import this for any other name.
 */
import { illustrations as REGISTRY, meta } from './illustrations-registry.js';
import { AhaIllustration, defineAhaIllustration, registerIllustrations } from './aha-illustration.js';

export const illustrations = REGISTRY;
export const ILLUSTRATION_NAMES = Object.keys(REGISTRY).sort();
export const illustrationMeta = meta;
export const hasIllustration = (name) => Object.prototype.hasOwnProperty.call(REGISTRY, name);

registerIllustrations(REGISTRY, { catalogueLoaded: true });

export { AhaIllustration, defineAhaIllustration };

export default { illustrations, ILLUSTRATION_NAMES, hasIllustration, AhaIllustration, defineAhaIllustration };
