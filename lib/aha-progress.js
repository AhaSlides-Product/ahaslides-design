/**
 * @ahaslides-product/design/aha-progress — the shared Progress primitive.
 *
 *   import '@ahaslides-product/design/aha-progress';   // registers <aha-progress>
 *   <aha-progress percent="60"></aha-progress>
 *   <aha-progress percent="100" status="success"></aha-progress>
 *   <aha-progress type="circle" percent="75"></aha-progress>
 *   <aha-progress steps="5" percent="60"></aha-progress>
 *
 * A determinate progress indicator — task completion, upload progress, a quiz timer bar. The DS V3
 * Progress is a FAMILY, not one bar: `type` picks the shape (`line` horizontal bar · `circle` ring),
 * `steps` splits a line into discrete segments, `size` is `default` or `small` (the Mini variants),
 * `status` recolours the fill (normal/active/success/exception), and `show-info` toggles the label
 * (a percent, or a ✓/✕ glyph at 100%/exception on a circle). ONE element, shadow-DOM CSS, themed only
 * by --aha-* tokens → byte-identical in React and Vue. Zero deps.
 *
 * Motion lives on a PERSISTENT node: `percent` only mutates the line fill's `width` (or the ring's
 * `stroke-dashoffset`) — the shape is never rebuilt on a percent/status change, so the transition
 * fires. A shape/size/steps change is a full re-render (not a per-state toggle, so no dead transition).
 * The host is the `progressbar` in the a11y tree — aria-valuenow is synced to `percent` via
 * observedAttributes so a screen reader announces the live value (kept from the a11y blocker fix).
 */
const STYLE = `
  :host{ display:block }
  .wrap{ display:flex; align-items:center; gap:8px;
    font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif); font-size:12px; line-height:18px; font-weight:600 }
  /* ---- line ---- */
  .track{ position:relative; flex:1 1 auto; height:8px; border-radius:var(--aha-radius-pill,999px);
    background:var(--aha-gray-30,#F1F1F1); overflow:hidden }
  :host([size="small"]) .track{ height:6px }
  .fill{ height:100%; width:0; border-radius:var(--aha-radius-pill,999px);
    background:var(--aha-color-primary,#6A1EBB);
    transition:width var(--aha-motion-slow,.3s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)), background var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)) }
  :host([status="active"]) .fill{ background:var(--aha-color-primary,#6A1EBB) }
  :host([status="success"]) .fill{ background:var(--aha-color-success,#16C49A) }
  :host([status="warning"]) .fill{ background:var(--aha-color-warning,#FF7747) }
  :host([status="error"]) .fill,
  :host([status="exception"]) .fill{ background:var(--aha-color-error,#F5222D) }

  /* ---- steps (segmented line) ---- */
  .steps{ display:flex; flex:1 1 auto; gap:4px }
  .step{ flex:1 1 0; height:8px; border-radius:var(--aha-radius-pill,999px);
    background:var(--aha-gray-30,#F1F1F1);
    transition:background var(--aha-motion-mid,.2s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)) }
  :host([size="small"]) .step{ height:6px }
  .step.on{ background:var(--aha-color-primary,#6A1EBB) }
  :host([status="success"]) .step.on{ background:var(--aha-color-success,#16C49A) }
  :host([status="warning"]) .step.on{ background:var(--aha-color-warning,#FF7747) }
  :host([status="error"]) .step.on,
  :host([status="exception"]) .step.on{ background:var(--aha-color-error,#F5222D) }

  /* ---- circle (SVG ring) ---- */
  .ring{ position:relative; display:inline-flex; flex:0 0 auto }
  .ring svg{ display:block; transform:rotate(-90deg) }
  .ring .track-c{ stroke:var(--aha-gray-30,#F1F1F1) }
  .ring .fill-c{ stroke:var(--aha-color-primary,#6A1EBB); stroke-linecap:round;
    transition:stroke-dashoffset var(--aha-motion-slow,.3s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)), stroke var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)) }
  :host([status="success"]) .ring .fill-c{ stroke:var(--aha-color-success,#16C49A) }
  :host([status="warning"]) .ring .fill-c{ stroke:var(--aha-color-warning,#FF7747) }
  :host([status="error"]) .ring .fill-c,
  :host([status="exception"]) .ring .fill-c{ stroke:var(--aha-color-error,#F5222D) }
  .ring .center{ position:absolute; inset:0; display:flex; align-items:center; justify-content:center;
    color:var(--aha-text-secondary,#4A4A4A) }
  :host([status="success"]) .ring .center{ color:var(--aha-text-positive,#13A181) }
  :host([status="error"]) .ring .center,
  :host([status="exception"]) .ring .center{ color:var(--aha-text-negative,#F5222D) }

  /* ---- trailing info (line + steps) ---- */
  .info{ flex:0 0 auto; min-width:34px; text-align:right; color:var(--aha-text-secondary,#4A4A4A);
    display:inline-flex; align-items:center; justify-content:flex-end; gap:4px }
  :host([status="success"]) .info{ color:var(--aha-text-positive,#13A181) }
  :host([status="error"]) .info,
  :host([status="exception"]) .info{ color:var(--aha-text-negative,#F5222D) }
  .info[hidden]{ display:none }
  @media (prefers-reduced-motion: reduce){ *,.fill,.fill-c,.step{ transition:none !important } }
`;

export class AhaProgress extends HTMLElement {
  static get observedAttributes() { return ['percent', 'status', 'show-info', 'type', 'size', 'steps']; }
  connectedCallback() { if (!this.shadowRoot) this.attachShadow({ mode: 'open' }); this._render(); }
  attributeChangedCallback(name) {
    if (!this.shadowRoot) return;
    // percent/status/show-info animate on the persistent shape → update in place (transition fires).
    // type/size/steps change the shape itself → a full re-render (not a per-state toggle, so no dead
    // transition on the animated attribute).
    if (name === 'type' || name === 'size' || name === 'steps') this._render();
    else this._update();
  }
  _pct() { return Math.max(0, Math.min(100, Number(this.getAttribute('percent') || 0))); }
  _statusGlyph() {
    const s = this.getAttribute('status');
    if (s === 'success') return 'system-check';
    if (s === 'error' || s === 'exception') return 'system-x';
    return '';
  }

  // ---- render (shape build; safe to rebuild on type/size/steps) ----------------
  _render() {
    const type = this.getAttribute('type') === 'circle' ? 'circle' : 'line';
    const steps = Math.max(0, Math.floor(Number(this.getAttribute('steps') || 0)));
    let body;
    if (type === 'circle') {
      // SVG ring chrome — a token-stroked track + fill circle whose stroke-dashoffset animates.
      // ds-lint-allow: svg (the circular track+fill ring cannot be an <aha-icon>; it is the shape itself)
      const small = this.getAttribute('size') === 'small';
      const box = small ? 40 : 96, sw = small ? 4 : 6, r = (box - sw) / 2, cx = box / 2;
      body = `<div class="ring" part="ring">` +
        `<svg width="${box}" height="${box}" viewBox="0 0 ${box} ${box}" aria-hidden="true"><!-- ds-lint-allow: svg (circular progress ring chrome, not a catalogue glyph) -->` +
        `<circle class="track-c" cx="${cx}" cy="${cx}" r="${r}" fill="none" stroke-width="${sw}"></circle>` +
        `<circle class="fill-c" cx="${cx}" cy="${cx}" r="${r}" fill="none" stroke-width="${sw}"></circle>` +
        `</svg><span class="center" part="info"></span></div>`;
    } else if (steps > 0) {
      const seg = Array.from({ length: steps }, () => `<span class="step" part="step"></span>`).join('');
      body = `<div class="steps" part="steps">${seg}</div><span class="info" part="info"></span>`;
    } else {
      body = `<div class="track" part="track"><div class="fill" part="fill"></div></div><span class="info" part="info"></span>`;
    }
    this.shadowRoot.innerHTML = `<style>${STYLE}</style><div class="wrap" part="wrap">${body}</div>`;
    this._update();
  }

  // ---- update (percent/status/info → mutate the PERSISTENT shape, transition fires) -------------
  _update() {
    const pct = this._pct();
    const type = this.getAttribute('type') === 'circle' ? 'circle' : 'line';
    const showInfo = this.getAttribute('show-info') !== 'false';
    const glyph = this._statusGlyph();
    const label = glyph
      ? `<aha-icon name="${glyph}" size="14" aria-hidden="true"></aha-icon>`
      : pct + '%';

    if (type === 'circle') {
      const fc = this.shadowRoot.querySelector('.fill-c');
      if (fc) {
        const r = Number(fc.getAttribute('r'));
        const circ = 2 * Math.PI * r;
        fc.style.strokeDasharray = String(circ);
        fc.style.strokeDashoffset = String(circ * (1 - pct / 100)); // persistent node: only the offset changes
      }
      const center = this.shadowRoot.querySelector('.center');
      if (center) { center.hidden = !showInfo; center.innerHTML = showInfo ? label : ''; }
    } else {
      const fill = this.shadowRoot.querySelector('.fill');
      if (fill) fill.style.width = pct + '%'; // persistent node: only the width changes
      const steps = this.shadowRoot.querySelectorAll('.step');
      if (steps.length) {
        const on = Math.round((pct / 100) * steps.length);
        steps.forEach((s, i) => s.classList.toggle('on', i < on));
      }
      const info = this.shadowRoot.querySelector('.info');
      if (info) { info.hidden = !showInfo; info.innerHTML = showInfo ? label : ''; }
    }

    // Host is the progressbar in the a11y tree — aria-valuenow synced to percent (a11y blocker fix).
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
