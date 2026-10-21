/**
 * @ahaslides-product/design/aha-bottom-sheet — deprecated alias of <aha-option-modal>.
 *
 * The option detail is now a centred modal card with no backdrop. Importing this file still registers `<aha-bottom-sheet>`
 * (an identical element) so existing pages keep working; use `@ahaslides-product/design/aha-option-modal` in new code.
 */
import { AhaOptionModal } from './aha-option-modal.js';

export class AhaBottomSheet extends AhaOptionModal {}

export function defineAhaBottomSheet(tag = 'aha-bottom-sheet') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaBottomSheet);
  return true;
}
if (typeof window !== 'undefined') defineAhaBottomSheet();

export default { AhaBottomSheet, defineAhaBottomSheet };
