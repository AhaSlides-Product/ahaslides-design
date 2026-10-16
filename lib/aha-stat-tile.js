/**
 * @ahaslides-product/design/aha-stat-tile — the KPI stat tile: one headline figure with its change
 * against the previous period.
 *
 *   import '@ahaslides-product/design/aha-stat-tile';   // registers <aha-stat-tile> (+ <aha-icon>)
 *   <aha-stat-tile label="Weekly active users" value="12480" previous="11020" caption="vs previous week"></aha-stat-tile>
 *   <aha-stat-tile label="Churn" value="0.042" previous="0.051" format="percent" caption="vs last month"></aha-stat-tile>
 *
 * The value is large and semibold; the change is shown as an absolute number and a whole percent
 * (percentage points for a `format="percent"` value), followed by the comparison caption in
 * secondary text. A rise is plain black with an up arrow, a fall is white on a black pill with a
 * down arrow (colour rule 7.3): direction is carried by shape, never by a status hue.
 * The card is flat: Vivid Pink at 5% with a Vivid Pink top bar (`look="accent"`, the default), or
 * white with a border (`look="plain"`). Lay 1–6 tiles in a row with <aha-grid columns="N" responsive>.
 */
import './icons.js';

const LOOKS = ['accent', 'plain'];
const FORMATS = ['number', 'compact', 'percent'];

const STYLE = `
  :host{ display:block; min-width:0; font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif) }
  :host([hidden]){ display:none }
  .tile{ box-sizing:border-box; height:100%; display:flex; flex-direction:column; gap:var(--aha-space-8,8px);
    padding:var(--aha-space-20,20px) var(--aha-space-20,20px) var(--aha-space-16,16px);
    border-radius:var(--aha-radius-default,8px); background:var(--aha-bg-accent,#E70E680D);
    box-shadow:inset 0 4px 0 0 var(--aha-color-primary,#E70E68); color:var(--aha-text-default,#1A1A1A) }
  :host([look="plain"]) .tile{ background:var(--aha-bg-container,#FFFFFF);
    box-shadow:inset 0 4px 0 0 var(--aha-color-primary,#E70E68), inset 0 0 0 1px var(--aha-border-default,#E3E3E3) }
  .label{ font-size:var(--aha-size-default,14px); line-height:var(--aha-line-height-body,1.5); font-weight:var(--aha-weight-regular,400);
    color:var(--aha-text-default,#1A1A1A); overflow-wrap:anywhere }
  .value{ font-size:var(--aha-size-h3,32px); line-height:var(--aha-line-height-tight,1.2); font-weight:var(--aha-weight-semibold,600);
    font-variant-numeric:tabular-nums; color:var(--aha-text-default,#1A1A1A); overflow-wrap:anywhere }
  .change-row{ display:flex; flex-wrap:wrap; align-items:center; gap:var(--aha-space-4,4px) var(--aha-space-8,8px);
    font-size:var(--aha-size-default,14px); line-height:var(--aha-line-height-body,1.5) }
  .change-row[hidden]{ display:none }
  .change{ display:inline-flex; align-items:center; gap:var(--aha-space-4,4px); font-weight:var(--aha-weight-semibold,600);
    font-variant-numeric:tabular-nums; color:var(--aha-text-default,#1A1A1A); max-width:100%; overflow-wrap:anywhere }
  .change.is-fall{ padding:0 var(--aha-space-8,8px) 0 var(--aha-space-6,6px); border-radius:var(--aha-radius-pill,999px);
    background:var(--aha-bg-dark,#1A1A1A); color:var(--aha-text-inverse,#FFFFFF) }
  .change aha-icon{ color:currentColor }
  .caption{ color:var(--aha-text-secondary,#4A4A4A) }
  .sr{ position:absolute; width:1px; height:1px; overflow:hidden; clip:rect(0 0 0 0); white-space:nowrap }
`;

const escapeHtml = (text) => String(text).replace(/[&<>"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[character]));
const toNumber = (raw) => {
  if (raw == null || String(raw).trim() === '') return null;
  const number = Number(String(raw).replace(/,/g, ''));
  return Number.isFinite(number) ? number : null;
};

export class AhaStatTile extends HTMLElement {
  static get observedAttributes() {
    return ['label', 'value', 'previous', 'caption', 'format', 'look', 'locale', 'rise-label', 'fall-label', 'flat-label', 'points-label'];
  }

  connectedCallback() { if (!this.shadowRoot) this.attachShadow({ mode: 'open' }); this._render(); }
  attributeChangedCallback() { if (this.shadowRoot) this._render(); }

  get _format() { const format = this.getAttribute('format'); return FORMATS.includes(format) ? format : 'number'; }
  get _locale() { return this.getAttribute('locale') || (document.documentElement && document.documentElement.lang) || 'en'; }

  _formatter(options) {
    try { return new Intl.NumberFormat(this._locale, options); } catch { return new Intl.NumberFormat('en', options); }
  }

  _formatValue(number) {
    const format = this._format;
    if (format === 'percent') return this._formatter({ style: 'percent', maximumFractionDigits: 0 }).format(number);
    if (format === 'compact') return this._formatter({ notation: 'compact', maximumFractionDigits: 1 }).format(number);
    return this._formatter({ maximumFractionDigits: 2 }).format(number);
  }

  /** The change against `previous`: direction plus the visible text. Null when either figure is missing. */
  change() {
    const value = toNumber(this.getAttribute('value'));
    const previous = toNumber(this.getAttribute('previous'));
    if (value == null || previous == null) return null;
    const difference = value - previous;
    const shownDigits = this._format === 'percent' ? 3 : 2;
    const roundsToZero = Math.abs(difference) < 0.5 * 10 ** -shownDigits;
    const direction = roundsToZero ? 'flat' : difference > 0 ? 'rise' : 'fall';
    if (direction === 'flat') return { direction, text: this.getAttribute('flat-label') || 'No change' };
    const magnitude = Math.abs(difference);
    if (this._format === 'percent') {
      const points = this._formatter({ maximumFractionDigits: 1 }).format(magnitude * 100);
      return { direction, text: `${points} ${this.getAttribute('points-label') || 'pts'}` };
    }
    const absolute = this._format === 'compact'
      ? this._formatter({ notation: 'compact', maximumFractionDigits: 1 }).format(magnitude)
      : this._formatter({ maximumFractionDigits: 2 }).format(magnitude);
    if (previous === 0) return { direction, text: absolute };
    const relative = this._formatter({ style: 'percent', maximumFractionDigits: 0 }).format(magnitude / Math.abs(previous));
    return { direction, text: `${absolute} (${relative})` };
  }

  _render() {
    const label = this.getAttribute('label') || '';
    const rawValue = this.getAttribute('value') ?? '';
    const number = toNumber(rawValue);
    const valueText = number == null ? rawValue : this._formatValue(number);
    const caption = this.getAttribute('caption') || '';
    const change = this.change();
    let changeHtml = '';
    if (change) {
      const word = change.direction === 'rise' ? (this.getAttribute('rise-label') || 'Up')
        : change.direction === 'fall' ? (this.getAttribute('fall-label') || 'Down') : '';
      const glyph = change.direction === 'rise' ? 'system-arrow-up' : change.direction === 'fall' ? 'system-arrow-down' : '';
      changeHtml = `<span class="change is-${change.direction}" part="change">`
        + (glyph ? `<aha-icon name="${glyph}" size="16" aria-hidden="true"></aha-icon>` : '')
        + (word ? `<span class="sr">${escapeHtml(word)} </span>` : '')
        + `<span>${escapeHtml(change.text)}</span></span>`;
    }
    const look = LOOKS.includes(this.getAttribute('look')) ? this.getAttribute('look') : 'accent';
    this.shadowRoot.innerHTML = `<style>${STYLE}</style>
      <div class="tile" part="tile" data-look="${look}" role="group"${label ? ` aria-label="${escapeHtml(label)}"` : ''}>
        <div class="label" part="label">${escapeHtml(label)}</div>
        <div class="value" part="value">${escapeHtml(valueText)}</div>
        <div class="change-row" part="change-row"${change || caption ? '' : ' hidden'}>${changeHtml}${caption ? `<span class="caption" part="caption">${escapeHtml(caption)}</span>` : ''}</div>
      </div>`;
  }
}

export function defineAhaStatTile(tag = 'aha-stat-tile') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaStatTile);
  return true;
}
if (typeof window !== 'undefined') defineAhaStatTile();

export default { AhaStatTile, defineAhaStatTile };
