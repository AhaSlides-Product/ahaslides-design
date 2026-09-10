/**
 * @ahaslides-product/design/aha-statistic — the shared Statistic primitive.
 *
 *   import '@ahaslides-product/design/aha-statistic';   // registers <aha-statistic>
 *   <aha-statistic label="Active players" value="1,284" suffix="live"></aha-statistic>
 *   <aha-statistic label="Response rate" value="92" suffix="%" trend="up"></aha-statistic>
 *   <aha-statistic label="Revenue" value="12840.5" precision="2" prefix-icon="system-currency-circle-dollar" trend="up"></aha-statistic>
 *   <aha-statistic label="Loading…" loading></aha-statistic>
 *
 * A single headline number with a caption, optional prefix/suffix (text OR a DS icon by name),
 * `precision` decimal formatting, an up/down `trend` colour (bound to --aha-color-success /
 * --aha-color-error, with a matching trend glyph so the signal is never colour-only), and a
 * `loading` skeleton. Prefix/suffix icons are summoned by name from the DS icon library via
 * <aha-icon> — never an inline glyph. The skeleton shimmer animates via the shared motion
 * tokens. ONE element, shadow-DOM CSS, themed only by --aha-* tokens → byte-identical in
 * React and Vue.
 */
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const STYLE = `
  :host{ display:inline-block; font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif) }
  .label{ font-size:14px; line-height:22px; color:var(--aha-text-secondary,#4A4A4A) }
  .value{ display:flex; align-items:baseline; gap:4px;
    font-size:24px; line-height:32px; font-weight:600; color:var(--aha-text-default,#1A1A1A) }
  .affix{ display:inline-flex; align-items:center; gap:4px;
    font-size:14px; line-height:22px; font-weight:400; color:var(--aha-text-tertiary,#8A8A8A) }
  .affix aha-icon{ color:currentColor }
  .trend-glyph{ display:inline-flex; align-self:center }
  :host([trend="up"]) .value{ color:var(--aha-color-success,#16C49A) }
  :host([trend="down"]) .value{ color:var(--aha-color-error,#F5222D) }
  :host([trend]) .affix{ color:inherit }

  /* loading skeleton — a shimmer on a persistent block, animated via the motion tokens */
  .skeleton{ border-radius:var(--aha-radius-xs,4px);
    background:linear-gradient(90deg, var(--aha-bg-container-secondary,#F7F7F7) 25%, var(--aha-split,#F1F1F1) 37%, var(--aha-bg-container-secondary,#F7F7F7) 63%);
    background-size:400% 100%; animation:aha-stat-shimmer 1.4s var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)) infinite }
  .sk-label{ height:14px; width:96px; margin:4px 0 }
  .sk-value{ height:24px; width:120px; margin:4px 0 }
  @keyframes aha-stat-shimmer{ 0%{ background-position:100% 0 } 100%{ background-position:0 0 } }
  @media (prefers-reduced-motion: reduce){ .skeleton{ animation:none } }
`;

export class AhaStatistic extends HTMLElement {
  static get observedAttributes() { return ['label', 'value', 'prefix', 'suffix', 'prefix-icon', 'suffix-icon', 'precision', 'trend', 'loading']; }
  connectedCallback() { if (!this.shadowRoot) this.attachShadow({ mode: 'open' }); this._render(); }
  attributeChangedCallback() { if (this.shadowRoot) this._render(); }

  _formatValue(raw) {
    const prec = this.getAttribute('precision');
    if (prec == null || prec === '') return raw;
    const n = Number(String(raw).replace(/,/g, ''));
    if (!Number.isFinite(n)) return raw;                 // non-numeric value → leave verbatim
    return n.toLocaleString('en-US', { minimumFractionDigits: +prec, maximumFractionDigits: +prec });
  }
  _iconHtml(name) {
    return name ? `<aha-icon name="${esc(name)}" size="16" aria-hidden="true"></aha-icon>` : '';
  }
  _render() {
    const label = this.getAttribute('label') || '';
    if (this.hasAttribute('loading')) {
      this.shadowRoot.innerHTML = `<style>${STYLE}</style>
        <div class="skeleton sk-label" part="label" role="status" aria-label="${esc(label) || 'Loading'}"></div>
        <div class="skeleton sk-value" part="value" aria-hidden="true"></div>`;
      return;
    }
    const value = this._formatValue(this.getAttribute('value') || '');
    const prefix = this.getAttribute('prefix');
    const suffix = this.getAttribute('suffix');
    const prefixIcon = this._iconHtml(this.getAttribute('prefix-icon'));
    const suffixIcon = this._iconHtml(this.getAttribute('suffix-icon'));
    // trend carries a matching arrow glyph so the up/down signal is never colour-only
    const trend = this.getAttribute('trend');
    const trendIcon = trend === 'up' ? this._iconHtml('system-trend-up')
      : trend === 'down' ? this._iconHtml('system-trend-down') : '';
    const trendGlyph = trendIcon ? `<span class="trend-glyph" part="trend">${trendIcon}</span>` : '';
    const pre = (prefixIcon || prefix) ? `<span class="affix" part="prefix">${prefixIcon}${prefix ? esc(prefix) : ''}</span>` : '';
    const suf = (suffixIcon || suffix) ? `<span class="affix" part="suffix">${suffix ? esc(suffix) : ''}${suffixIcon}</span>` : '';
    this.shadowRoot.innerHTML = `<style>${STYLE}</style>
      <div class="label" part="label">${esc(label)}</div>
      <div class="value" part="value">${trendGlyph}${pre}<span part="number">${esc(value)}</span>${suf}</div>`;
  }
}

export function defineAhaStatistic(tag = 'aha-statistic') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaStatistic);
  return true;
}
if (typeof window !== 'undefined') defineAhaStatistic();

export default { AhaStatistic, defineAhaStatistic };
