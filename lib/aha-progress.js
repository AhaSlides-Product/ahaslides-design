/**
 * @ahaslides-product/design/aha-progress — the shared Progress primitive.
 *
 *   import '@ahaslides-product/design/aha-progress';   // registers <aha-progress>
 *   <aha-progress percent="60"></aha-progress>
 *   <aha-progress percent="100" status="success"></aha-progress>
 *
 * A horizontal progress bar — task completion, upload progress, a quiz timer bar. ONE element,
 * shadow-DOM CSS, themed only by --aha-* tokens → byte-identical in React and Vue. Zero deps.
 * The fill node is PERSISTENT: `percent` only mutates its width, so the width transition fires.
 */
const STYLE = `
  :host{ display:block }
  .wrap{ display:flex; align-items:center; gap:8px;
    font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif); font-size:12px; line-height:18px; font-weight:600 }
  .track{ position:relative; flex:1 1 auto; height:8px; border-radius:var(--aha-radius-pill,999px);
    background:var(--aha-gray-30,#F1F1F1); overflow:hidden }
  .fill{ height:100%; width:0; border-radius:var(--aha-radius-pill,999px);
    background:var(--aha-color-primary,#6A1EBB);
    transition:width var(--aha-motion-slow,.3s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)), background var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)) }
  :host([status="success"]) .fill{ background:var(--aha-color-success,#16C49A) }
  :host([status="warning"]) .fill{ background:var(--aha-color-warning,#FF7747) }
  :host([status="error"]) .fill{ background:var(--aha-color-error,#F5222D) }
  .info{ flex:0 0 auto; min-width:34px; text-align:right; color:var(--aha-text-secondary,#4A4A4A) }
  :host([status="success"]) .info{ color:var(--aha-text-positive,#13A181) }
  :host([status="error"]) .info{ color:var(--aha-text-negative,#F5222D) }
  @media (prefers-reduced-motion: reduce){ *{ transition:none !important } }
`;

export class AhaProgress extends HTMLElement {
  static get observedAttributes() { return ['percent', 'status', 'show-info']; }
  connectedCallback() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.innerHTML =
        `<style>${STYLE}</style><div class="wrap" part="wrap"><div class="track" part="track"><div class="fill" part="fill"></div></div><span class="info" part="info"></span></div>`;
    }
    this._update();
  }
  attributeChangedCallback() { if (this.shadowRoot) this._update(); }
  _update() {
    const pct = Math.max(0, Math.min(100, Number(this.getAttribute('percent') || 0)));
    const fill = this.shadowRoot.querySelector('.fill');
    const info = this.shadowRoot.querySelector('.info');
    fill.style.width = pct + '%';
    info.hidden = this.getAttribute('show-info') === 'false';
    info.textContent = pct + '%';
    // The host is the progressbar in the a11y tree — a screen reader announces the live value
    // as `percent` changes (a quiz-timer bar). Progress is always determinate here (an
    // indeterminate wait uses Spin), so aria-valuenow is always present and synced.
    this.setAttribute('role', 'progressbar');
    this.setAttribute('aria-valuemin', '0');
    this.setAttribute('aria-valuemax', '100');
    this.setAttribute('aria-valuenow', String(pct));
    this.setAttribute('aria-valuetext', pct + '%');
  }
}

export function defineAhaProgress(tag = 'aha-progress') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaProgress);
  return true;
}
if (typeof window !== 'undefined') defineAhaProgress();

export default { AhaProgress, defineAhaProgress };
