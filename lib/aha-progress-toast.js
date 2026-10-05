import { AhaImportProgress } from './aha-import-progress.js';

export class AhaProgressToast extends AhaImportProgress {}

export function defineAhaProgressToast(tag = 'aha-progress-toast') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaProgressToast);
  return true;
}
if (typeof window !== 'undefined') defineAhaProgressToast();

export default { AhaProgressToast, defineAhaProgressToast };
