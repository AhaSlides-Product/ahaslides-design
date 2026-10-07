/**
 * @ahaslides-product/design/aha-stepper — the shared framework-free Stepper (leaf).
 *
 *   import '@ahaslides-product/design/aha-stepper';   // registers <aha-stepper>
 *   <aha-stepper steps="Ideas|Group|Vote|Discuss" current="1"></aha-stepper>
 *   <aha-stepper size="lg" navigable steps='[{"label":"Ideas"},{"label":"Group"}]' current="0"></aha-stepper>
 *
 * Shows where a linear flow is: finished steps carry a check, the current step is marked with INK
 * (a solid ink outline + semibold label), upcoming steps are muted. It never paints the primary
 * accent, so on a slide canvas the accent stays on the one action that advances the flow.
 * Under 480px only the current stage keeps a visible label; the others stay readable to screen readers.
 * Every colour derives from `currentColor`, so setting `color` on the element (the deck ink on a
 * canvas) re-inks the whole stepper. `current` changes toggle attributes on persistent nodes.
 * Emits a composed `change` CustomEvent<{index}> when a `navigable` step is clicked.
 */
import './icons.js';

const escapeHtml = (text) => String(text).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const MOTION = 'var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1))';
const STYLE = `
  :host{ display:block; container:stepper / inline-size; color:var(--aha-text-default,#1A1A1A); font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif) }
  .list{ display:flex; align-items:center; margin:0; padding:0; list-style:none; min-width:0 }
  .step{ display:flex; align-items:center; gap:var(--aha-space-8,8px); min-width:0; flex:0 0 auto }
  .step:not(:last-child){ flex:1 1 0 }
  .step:not(:last-child)::after{ content:""; flex:1 1 auto; min-width:var(--aha-space-12,12px); height:1px;
    margin:0 var(--aha-space-4,4px); background:color-mix(in srgb, currentColor 20%, transparent); transition:background ${MOTION} }
  .step[data-state="complete"]:not(:last-child)::after{ background:color-mix(in srgb, currentColor 60%, transparent) }
  .hit{ display:inline-flex; align-items:center; gap:var(--aha-space-8,8px); min-width:0; margin:0; padding:var(--aha-space-2,2px);
    font:inherit; color:inherit; background:none; border:0; border-radius:var(--aha-radius-sm,6px); text-align:left;
    outline:2px solid transparent; outline-offset:1px; transition:outline-color ${MOTION}, background ${MOTION} }
  button.hit{ cursor:pointer; min-height:24px }
  button.hit:hover{ background:color-mix(in srgb, currentColor 6%, transparent) }
  button.hit:focus-visible{ outline-color:var(--aha-border-focus,#D3B4FF) }
  .marker{ position:relative; flex:0 0 auto; box-sizing:border-box; display:inline-flex; align-items:center; justify-content:center;
    width:24px; height:24px; border-radius:50%; font-size:12px; line-height:1; font-weight:var(--aha-weight-semibold,600);
    border:1.5px solid color-mix(in srgb, currentColor 35%, transparent); color:color-mix(in srgb, currentColor 62%, transparent);
    transition:border-color ${MOTION}, color ${MOTION}, background ${MOTION} }
  .number, .check{ position:absolute; inset:0; display:inline-flex; align-items:center; justify-content:center; transition:opacity ${MOTION} }
  .check{ opacity:0 }
  aha-icon{ display:inline-flex; color:currentColor }
  .label{ min-width:0; font-size:14px; line-height:1.4; font-weight:var(--aha-weight-regular,400);
    color:color-mix(in srgb, currentColor 62%, transparent); transition:color ${MOTION} }
  .sr{ position:absolute; width:1px; height:1px; margin:-1px; padding:0; overflow:hidden; clip:rect(0 0 0 0); white-space:nowrap; border:0 }

  .step[data-state="complete"] .marker{ border-color:color-mix(in srgb, currentColor 60%, transparent); color:currentColor }
  .step[data-state="complete"] .number{ opacity:0 }
  .step[data-state="complete"] .check{ opacity:1 }
  .step[data-state="complete"] .label{ color:color-mix(in srgb, currentColor 80%, transparent) }
  .step[data-state="current"] .marker{ border-color:currentColor; color:currentColor; background:color-mix(in srgb, currentColor 8%, transparent) }
  .step[data-state="current"] .label{ color:currentColor; font-weight:var(--aha-weight-semibold,600) }

  :host([size="lg"]) .marker{ width:32px; height:32px; font-size:16px }
  :host([size="lg"]) .label{ font-size:18px }
  :host([size="lg"]) .step:not(:last-child)::after{ margin:0 var(--aha-space-8,8px) }

  @container stepper (max-width: 479px){
    .step:not(:last-child){ flex:1 1 auto }
    .step[data-state="current"]{ min-width:max-content }
    .step:not([data-state="current"]) .label{ position:absolute; width:1px; height:1px; overflow:hidden; clip:rect(0 0 0 0); white-space:nowrap } }
  @media (prefers-reduced-motion: reduce){ *, *::after{ transition:none !important } }
`;

export class AhaStepper extends HTMLElement {
  static get observedAttributes() { return ['steps', 'current', 'navigable', 'completed-label', 'aria-label']; }
  get current() { return Math.max(0, parseInt(this.getAttribute('current') ?? '0', 10) || 0); }
  set current(index) { this.setAttribute('current', String(index)); }
  get steps() {
    if (this._steps) return this._steps;
    const raw = (this.getAttribute('steps') || '').trim();
    if (raw.startsWith('[')) {
      try { return JSON.parse(raw).map((step) => (typeof step === 'string' ? { label: step } : step)).filter(Boolean); } catch { return []; }
    }
    return raw ? raw.split('|').map((label) => ({ label: label.trim() })) : [];
  }
  set steps(list) { this._steps = Array.isArray(list) ? list.map((step) => (typeof step === 'string' ? { label: step } : step)) : null; this._render(); }

  connectedCallback() {
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    this._render();
  }
  attributeChangedCallback(name) {
    if (!this.shadowRoot) return;
    if (name === 'current' || name === 'completed-label') this._syncState();
    else this._render();
  }

  _render() {
    if (!this.shadowRoot) return;
    const navigable = this.hasAttribute('navigable');
    const tag = navigable ? 'button' : 'span';
    const items = this.steps.map((step, index) =>
      `<li class="step" part="step" data-index="${index}">` +
        `<${tag} class="hit"${navigable ? ' type="button"' : ''}>` +
          `<span class="marker" part="marker" aria-hidden="true"><span class="number">${index + 1}</span>` +
          `<span class="check"><aha-icon name="system-check" size="16"></aha-icon></span></span>` +
          `<span class="label" part="label">${escapeHtml(step.label ?? '')}</span><span class="sr"></span>` +
        `</${tag}></li>`).join('');
    this.shadowRoot.innerHTML = `<style>${STYLE}</style><ol class="list" part="list">${items}</ol>`;
    const list = this.shadowRoot.querySelector('.list');
    list.setAttribute('aria-label', this.getAttribute('aria-label') || 'Progress');
    if (navigable) list.addEventListener('click', (event) => {
      const step = event.target.closest('.step');
      if (!step) return;
      const index = Number(step.dataset.index);
      this.current = index;
      this.dispatchEvent(new CustomEvent('change', { bubbles: true, composed: true, detail: { index } }));
    });
    this._syncState();
  }

  _syncState() {
    if (!this.shadowRoot) return;
    const current = this.current;
    const completedLabel = this.getAttribute('completed-label') || 'Completed';
    for (const step of this.shadowRoot.querySelectorAll('.step')) {
      const index = Number(step.dataset.index);
      const state = index < current ? 'complete' : index === current ? 'current' : 'upcoming';
      step.dataset.state = state;
      if (state === 'current') step.setAttribute('aria-current', 'step'); else step.removeAttribute('aria-current');
      step.querySelector('.sr').textContent = state === 'complete' ? `, ${completedLabel}` : '';
    }
  }
}

export function defineAhaStepper(tag = 'aha-stepper') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaStepper);
  return true;
}
if (typeof window !== 'undefined') defineAhaStepper();

export default { AhaStepper, defineAhaStepper };
