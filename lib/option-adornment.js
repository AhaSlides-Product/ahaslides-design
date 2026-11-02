/**
 * Shared "?" help tooltip and crown paywall that sit after the label of <aha-radio> and <aha-checkbox>.
 * Same attribute names and meaning as <aha-setting-row>: `help`, `locked`, `plan`, `feature-key`, `upgrade-body`.
 * A locked option shows the crown instead of the "?", keeps its label colour, opens the paywall on a click
 * or Space anywhere on the option, and never selects or ticks.
 */
import './aha-tooltip.js';
import { fitPaywall, toggleLockedPaywall } from './aha-paywall.js';
import { fitHelpBubble } from './aha-setting-row.js';

export const ADORNMENT_ATTRIBUTES = ['help', 'locked', 'plan', 'feature-key', 'upgrade-body'];

export const ADORNMENT_MARKUP =
  `<aha-tooltip class="help" part="help" help placement="bottom-start"></aha-tooltip>` +
  `<aha-paywall class="lock" part="lock" placement="bottom"></aha-paywall>`;

export const ADORNMENT_STYLE = `
  .help{ display:none; flex:0 0 auto; color:var(--aha-text-tertiary,#8A8A8A); vertical-align:middle }
  .lock{ display:none; flex:0 0 auto; vertical-align:middle }
  :host([has-help]) .help{ display:inline-flex; align-items:center }
  :host([locked]) .lock{ display:inline-flex; align-items:center }
  :host([locked]) .help{ display:none }
`;

const PLAN_DESCRIPTION = { pro: 'Requires the Pro plan.', essential: 'Requires the Essential plan.' };

export function wireAdornment(host) {
  const root = host.shadowRoot;
  const help = root.querySelector('.help');
  const lock = root.querySelector('.lock');
  help.addEventListener('pointerenter', () => fitHelpBubble(help));
  help.addEventListener('focusin', () => fitHelpBubble(help));
  lock.addEventListener('pointerdown', () => fitPaywall(lock));
  lock.addEventListener('focusin', () => fitPaywall(lock));
  removeNestedTabStops(help);
  removeNestedTabStops(lock);
}

// The host is the single tab stop (role=radio / checkbox); the help text reaches assistive tech as its description instead.
function removeNestedTabStops(adornment) {
  const stops = adornment.shadowRoot ? adornment.shadowRoot.querySelectorAll('button') : [];
  for (const stop of stops) stop.tabIndex = -1;
  const assistive = adornment.querySelector('[slot]');
  if (assistive) assistive.tabIndex = -1;
}

export function syncAdornment(host, label) {
  const root = host.shadowRoot;
  const help = root.querySelector('.help');
  const lock = root.querySelector('.lock');
  const helpText = host.getAttribute('help') || '';
  if (helpText) { help.setAttribute('text', helpText); host.setAttribute('has-help', ''); }
  else { help.removeAttribute('text'); host.removeAttribute('has-help'); }
  const plan = host.getAttribute('plan') === 'essential' ? 'essential' : 'pro';
  lock.setAttribute('required-plan', plan);
  lock.setAttribute('feature-label', label);
  const featureKey = host.getAttribute('feature-key');
  if (featureKey) lock.setAttribute('feature-key', featureKey); else lock.removeAttribute('feature-key');
  const upgradeBody = host.getAttribute('upgrade-body');
  if (upgradeBody) lock.setAttribute('body', upgradeBody); else lock.removeAttribute('body');
  const description = host.hasAttribute('locked') ? PLAN_DESCRIPTION[plan] : helpText;
  if (description) host.setAttribute('aria-description', description); else host.removeAttribute('aria-description');
  removeNestedTabStops(help);
  removeNestedTabStops(lock);
}

function onAdornment(host, event) {
  const root = host.shadowRoot;
  const path = event.composedPath();
  return path.includes(root.querySelector('.help')) || path.includes(root.querySelector('.lock'));
}

/** True when the click was consumed (it hit the "?" or crown, or the option is locked) and must not select or tick. */
export function consumeAdornmentClick(host, event) {
  if (onAdornment(host, event)) return true;
  if (!host.hasAttribute('locked')) return false;
  event.preventDefault();
  toggleLockedPaywall(host.shadowRoot.querySelector('.lock'), event);
  return true;
}

/** True when the key press was consumed: Space on a locked option opens the paywall, any key on the "?" or crown is left alone. */
export function consumeAdornmentKey(host, event) {
  if (onAdornment(host, event)) return true;
  if (!host.hasAttribute('locked')) return false;
  if (event.key !== ' ' && event.key !== 'Spacebar') return false;
  event.preventDefault();
  toggleLockedPaywall(host.shadowRoot.querySelector('.lock'), event);
  return true;
}
