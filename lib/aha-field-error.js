/**
 * @ahaslides-product/design/aha-field-error — the shared accessible field / validation error.
 *
 *   import '@ahaslides-product/design/aha-field-error';   // registers <aha-field-error>
 *   <input id="email" aria-invalid="true" aria-describedby="email-error">
 *   <aha-field-error id="email-error" message="Enter an email address, like name@example.com"></aha-field-error>
 *
 *   <!-- field wrapper style: 12px warning-circle glyph + message at --aha-size-sm -->
 *   <aha-field-error icon message="Enter an email address"></aha-field-error>
 *
 *   <!-- help text: muted text only, no glyph; not an error, so no aria-invalid on the field -->
 *   <aha-field-error tone="info" message="3 of 10 rows"></aha-field-error>
 *
 *   <!-- respondent renderers (the FieldErrorDisplay contract): assertive alert -->
 *   <aha-field-error id="q3-error" variant="respondent" message="Pick at least one option"></aha-field-error>
 *
 * The ONE error node every field points `aria-describedby` at. `tone="info"` turns the same slot into muted
 * help text (no glyph, --aha-text-tertiary); the consumer passes the string and the DS computes nothing.
 * Two variants, chosen by context:
 *   • variant="form" (default, the a11y FieldError) — a stable id for aria-describedby, danger text,
 *     and it renders NOTHING (host hidden) while `message` is empty.
 *   • variant="respondent" (FieldErrorDisplay) — role="alert" + aria-live="assertive" so the error is
 *     announced the moment it appears, for respondent element renderers. It stays rendered (zero height)
 *     while empty so assistive tech is already tracking the alert when the message arrives.
 * The message text lives in the host's LIGHT DOM (mirrored from `message`) so aria-describedby and the
 * alert announcement read it without crossing a shadow boundary. The host keeps a stable id — one is
 * minted if the consumer gives none. Translation stays with the consumer: pass the translated string.
 */
import './icons.js';

const STYLE = `
  :host{ display:block; font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif);
    font-size:14px; line-height:22px; font-weight:400; color:var(--aha-text-negative,#1A1A1A);
    margin-top:var(--aha-space-4,4px) }
  :host([hidden]){ display:none }
  :host([_empty]){ margin-top:0 }
  :host([icon]){ display:flex; align-items:flex-start; gap:var(--aha-space-4,4px); font-size:var(--aha-size-sm,12px); line-height:18px }
  :host([icon][hidden]){ display:none }
  .glyph{ display:none; flex:0 0 auto; margin-top:calc(var(--aha-space-4,4px) - 1px) }
  :host([icon]) .glyph{ display:inline-flex }
  :host([tone="info"]){ color:var(--aha-text-tertiary,#8A8A8A); font-size:var(--aha-size-sm,12px); line-height:18px }
  :host([tone="info"]) .glyph, :host([tone="info"][icon]) .glyph{ display:none }
  .text{ display:block; font-family:inherit; overflow-wrap:anywhere;
    animation:aha-field-error-in var(--aha-motion-mid,.2s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)) }
  @keyframes aha-field-error-in{ from{ opacity:0; transform:translateY(-4px) } to{ opacity:1; transform:none } }
  @media (prefers-reduced-motion: reduce){ .text{ animation:none } }
`;

let mintedIds = 0;

export class AhaFieldError extends HTMLElement {
  static get observedAttributes() { return ['message', 'variant', 'icon', 'tone']; }

  get message() { return this.getAttribute('message') || ''; }
  set message(value) { value ? this.setAttribute('message', value) : this.removeAttribute('message'); }

  connectedCallback() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.innerHTML = `<style>${STYLE}</style><aha-icon class="glyph" part="glyph" name="system-warning-circle" size="12" decorative></aha-icon><span class="text" part="text"><slot></slot></span>`;
    }
    if (!this.id) this.id = `aha-field-error-${++mintedIds}`;
    this._sync();
  }
  attributeChangedCallback() { if (this.shadowRoot) this._sync(); }

  _sync() {
    const message = this.message;
    if (this.textContent !== message) this.textContent = message;
    const respondent = this.getAttribute('variant') === 'respondent';
    this.hidden = !message && !respondent;
    this.toggleAttribute('_empty', !message);
    if (respondent) {
      this.setAttribute('role', 'alert');
      this.setAttribute('aria-live', 'assertive');
    } else {
      this.removeAttribute('role');
      this.removeAttribute('aria-live');
    }
  }
}

export function isInvalid(host) {
  const status = host.getAttribute('status');
  return status === 'error' || status === 'warning' || host.hasAttribute('invalid');
}

export function syncFieldError(host, field) {
  const node = host.shadowRoot.querySelector('aha-field-error');
  if (!node || !field) return;
  const errorMessage = isInvalid(host) ? host.getAttribute('error-message') || '' : '';
  const infoMessage = host.getAttribute('info-message') || '';
  if (errorMessage || !infoMessage) node.removeAttribute('tone'); else node.setAttribute('tone', 'info');
  node.message = errorMessage || infoMessage;
  if (!('ariaDescribedByElements' in field)) return;
  const root = host.getRootNode();
  const ids = (host.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean);
  const described = ids.map((id) => (root.getElementById ? root.getElementById(id) : null)).filter(Boolean);
  if (node.message) described.push(node);
  field.ariaDescribedByElements = described.length ? described : null;
}

export function defineAhaFieldError(tag = 'aha-field-error') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaFieldError);
  return true;
}
if (typeof window !== 'undefined') defineAhaFieldError();

export default { AhaFieldError, defineAhaFieldError };
