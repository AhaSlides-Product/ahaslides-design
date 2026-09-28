/**
 * @ahaslides-product/design/aha-progressbar — the accessible Progressbar over the DS <aha-progress>.
 *
 *   import '@ahaslides-product/design/aha-progressbar';   // registers <aha-progressbar> (+ <aha-progress>)
 *   <aha-progressbar value="3" max="10" label="Quiz progress" value-text="Question 3 of 10"></aha-progressbar>
 *
 * The a11y wrapper: the HOST is the one role="progressbar" in the accessibility tree, carrying the
 * consumer's real range — aria-valuenow / aria-valuemin / aria-valuemax from value/min/max — and an
 * aria-label (required: a progressbar without a name is announced as an anonymous number). The visual
 * is the DS <aha-progress>, driven with the derived percent and hidden from assistive tech so the bar
 * is announced once. status / size / type / steps / show-info pass straight through to it.
 * The inner <aha-progress> is a persistent node: a value change only updates its percent, so its fill
 * transition (the DS motion tokens) fires.
 */
import './aha-progress.js';

const STYLE = `
  :host{ display:block; font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif) }
  aha-progress{ font-family:inherit }
`;

const PASS_THROUGH = ['status', 'size', 'type', 'steps', 'show-info'];

const toNumber = (value, fallback) => {
  const number = Number(value);
  return value == null || value === '' || !Number.isFinite(number) ? fallback : number;
};

export class AhaProgressbar extends HTMLElement {
  static get observedAttributes() { return ['value', 'min', 'max', 'label', 'value-text', ...PASS_THROUGH]; }

  connectedCallback() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.innerHTML = `<style>${STYLE}</style><aha-progress part="progress" aria-hidden="true"></aha-progress>`;
    }
    this._sync();
  }
  attributeChangedCallback() { if (this.shadowRoot) this._sync(); }

  _range() {
    const min = toNumber(this.getAttribute('min'), 0);
    const max = toNumber(this.getAttribute('max'), 100);
    const value = Math.min(max, Math.max(min, toNumber(this.getAttribute('value'), min)));
    return { min, max, value };
  }

  get percent() {
    const { min, max, value } = this._range();
    return max > min ? Math.round(((value - min) / (max - min)) * 100) : 0;
  }

  _sync() {
    const { min, max, value } = this._range();

    this.setAttribute('role', 'progressbar');
    this.setAttribute('aria-valuemin', String(min));
    this.setAttribute('aria-valuemax', String(max));
    this.setAttribute('aria-valuenow', String(value));
    const label = this.getAttribute('label');
    if (label) this.setAttribute('aria-label', label);
    else this.removeAttribute('aria-label');
    const valueText = this.getAttribute('value-text');
    if (valueText) this.setAttribute('aria-valuetext', valueText);
    else this.removeAttribute('aria-valuetext');

    const progress = this.shadowRoot.querySelector('aha-progress');
    progress.setAttribute('percent', String(this.percent));
    for (const name of PASS_THROUGH) {
      if (this.hasAttribute(name)) progress.setAttribute(name, this.getAttribute(name));
      else progress.removeAttribute(name);
    }
  }
}

export function defineAhaProgressbar(tag = 'aha-progressbar') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaProgressbar);
  return true;
}
if (typeof window !== 'undefined') defineAhaProgressbar();

export default { AhaProgressbar, defineAhaProgressbar };
