import { AhaBackgroundTask } from './aha-background-task.js';

export class AhaProgressToast extends AhaBackgroundTask {}

export function defineAhaProgressToast(tag = 'aha-progress-toast') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaProgressToast);
  return true;
}
if (typeof window !== 'undefined') defineAhaProgressToast();

export default { AhaProgressToast, defineAhaProgressToast };
