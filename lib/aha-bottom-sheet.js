/**
 * @ahaslides-product/design/aha-bottom-sheet — deprecated alias of <aha-audience-modal>.
 *
 * The option detail is now the audience modal's `details` type: a centred card with no backdrop. Importing this file still
 * registers `<aha-bottom-sheet>` (an identical element) so existing pages keep working; use
 * `@ahaslides-product/design/aha-audience-modal` in new code.
 */
import { AhaAudienceModal } from './aha-audience-modal.js';

export class AhaBottomSheet extends AhaAudienceModal {}

export function defineAhaBottomSheet(tag = 'aha-bottom-sheet') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaBottomSheet);
  return true;
}
if (typeof window !== 'undefined') defineAhaBottomSheet();

export default { AhaBottomSheet, defineAhaBottomSheet };
