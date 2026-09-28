/**
 * @ahaslides-product/design/aha-error-page — the shared full-page error.
 *
 *   import '@ahaslides-product/design/aha-error-page';   // registers <aha-error-page>
 *   <aha-error-page code="404"></aha-error-page>
 *   <aha-error-page code="500" heading="…translated…" body="…translated…" action-label="Try again"></aha-error-page>
 *
 * Maps an error `code` (404 · 403 · 500 · offline · anything else = generic) to a DS <aha-result>
 * state with a default British-English title, body and — for the retryable codes — a "Try again"
 * action. heading / body / action-label override the defaults (pass your translated strings); an
 * empty action-label="" removes the button. The host is role="alert" so the failure is announced.
 *
 * Events (bubbling, composed):
 *   • error-page-view   detail { code } — once per code shown; wire it to your telemetry.
 *   • action            detail { code } — the action button was pressed (retry / navigate).
 * Fills the viewport by default; `contained` fits it to its parent box instead.
 */
import './aha-result.js';
import './aha-button.js';

const COPY = {
  '404': {
    status: '404',
    heading: 'We can’t find this page',
    body: 'The link may be wrong, or the page may have been moved or deleted. Check the link and try again.',
    action: '',
  },
  '403': {
    status: '403',
    heading: 'You don’t have access to this page',
    body: 'Ask the owner to share it with you, or sign in with the account that has access.',
    action: '',
  },
  '500': {
    status: '500',
    heading: 'Something went wrong on our side',
    body: 'We couldn’t load this page. Try again in a moment.',
    action: 'Try again',
  },
  offline: {
    status: 'warning',
    icon: 'system-cloud-disconnected',
    heading: 'You’re offline',
    body: 'Check your internet connection, then try again.',
    action: 'Try again',
  },
  generic: {
    status: 'error',
    heading: 'We couldn’t load this page',
    body: 'Try again, or come back later if it keeps happening.',
    action: 'Try again',
  },
};

const STYLE = `
  :host{ display:flex; align-items:center; justify-content:center; box-sizing:border-box;
    min-height:100vh; min-height:100dvh; padding:var(--aha-space-24,24px) var(--aha-space-16,16px);
    background:var(--aha-bg-base,#FFFFFF); font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif) }
  :host([contained]){ min-height:100% }
  aha-result{ width:100%; max-width:480px; font-family:inherit }
  .action[hidden]{ display:none }
`;

export const ERROR_PAGE_CODES = Object.freeze(Object.keys(COPY));

export class AhaErrorPage extends HTMLElement {
  static get observedAttributes() { return ['code', 'heading', 'body', 'action-label']; }

  connectedCallback() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.innerHTML = `<style>${STYLE}</style>` +
        `<aha-result part="result"><aha-button class="action" slot="extra" variant="primary" size="lg" part="action"></aha-button></aha-result>`;
      this.shadowRoot.querySelector('.action').addEventListener('click', () => {
        this.dispatchEvent(new CustomEvent('action', { detail: { code: this.code }, bubbles: true, composed: true }));
      });
    }
    this.setAttribute('role', 'alert');
    this._sync();
  }
  attributeChangedCallback() { if (this.shadowRoot) this._sync(); }

  get code() {
    const code = (this.getAttribute('code') || '').trim().toLowerCase();
    return code in COPY ? code : 'generic';
  }

  _sync() {
    const code = this.code;
    const copy = COPY[code];
    const result = this.shadowRoot.querySelector('aha-result');
    result.setAttribute('status', copy.status);
    if (copy.icon) result.setAttribute('icon', copy.icon);
    else result.removeAttribute('icon');
    result.setAttribute('result-title', this.getAttribute('heading') || copy.heading);
    result.setAttribute('subtitle', this.getAttribute('body') || copy.body);

    const actionLabel = this.hasAttribute('action-label') ? this.getAttribute('action-label') : copy.action;
    const action = this.shadowRoot.querySelector('.action');
    action.textContent = actionLabel;
    action.hidden = !actionLabel;

    if (this._reportedCode !== code) {
      this._reportedCode = code;
      this.dispatchEvent(new CustomEvent('error-page-view', { detail: { code }, bubbles: true, composed: true }));
    }
  }
}

export function defineAhaErrorPage(tag = 'aha-error-page') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaErrorPage);
  return true;
}
if (typeof window !== 'undefined') defineAhaErrorPage();

export default { AhaErrorPage, defineAhaErrorPage, ERROR_PAGE_CODES };
