/**
 * @ahaslides-product/design/aha-stat-tile — the KPI stat tile: one headline figure with its change
 * against the previous period.
 *
 *   import '@ahaslides-product/design/aha-stat-tile';   // registers <aha-stat-tile> (+ <aha-icon>)
 *   <aha-stat-tile label="Weekly active users" value="12480" previous="11020" caption="vs previous week"></aha-stat-tile>
 *   <aha-stat-tile label="Churn" value="0.042" previous="0.051" format="percent" caption="vs last month"></aha-stat-tile>
 *
 * The value is large and semibold; the change is shown as an absolute number and a percent of the
 * previous value (percentage points for a `format="percent"` value), followed by the comparison
 * caption in secondary text. A rise is plain black with an up arrow, a fall is white on a black pill
 * with a down arrow (colour rule 7.3): direction is carried by shape, never by a status hue.
 * The card is flat with a Vivid Pink top bar: white with a border (`look="plain"`, the default), or
 * Vivid Pink at 5% (`look="accent"`, for a static report image under colour rule 3.11, or the one
 * highlighted panel rule 3.7 allows on an app screen). Lay tiles in a row with <aha-grid min="160px">,
 * which wraps them to fewer columns as the row narrows.
 */
import './icons.js';

const FORMATS = ['number', 'compact', 'percent'];

const STYLE = `
  :host{ display:block; min-width:0; container-type:inline-size; font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif) }
  :host([hidden]){ display:none }
  .tile{ box-sizing:border-box; height:100%; display:flex; flex-direction:column; gap:var(--aha-space-8,8px);
    padding:var(--aha-space-20,20px) var(--aha-space-20,20px) var(--aha-space-16,16px);
    border-radius:var(--aha-radius-default,8px); background:var(--aha-bg-container,#FFFFFF);
    box-shadow:inset 0 4px 0 0 var(--aha-color-primary,#E70E68), inset 0 0 0 1px var(--aha-border-default,#E3E3E3); color:var(--aha-text-default,#1A1A1A) }
  :host([look="accent"]) .tile{ background:var(--aha-bg-accent,#E70E680D); box-shadow:inset 0 4px 0 0 var(--aha-color-primary,#E70E68) }
  .label{ font-size:var(--aha-size-default,14px); line-height:var(--aha-line-height-body,1.5); font-weight:var(--aha-weight-regular,400);
    color:var(--aha-text-default,#1A1A1A); overflow-wrap:anywhere }
  .value{ font-size:clamp(12px, calc((100cqw - 2 * var(--aha-space-20,20px)) / (var(--value-length,8) * 0.6)), var(--aha-size-h3,32px));
    line-height:var(--aha-line-height-tight,1.2); font-weight:var(--aha-weight-semibold,600);
    font-variant-numeric:tabular-nums; color:var(--aha-text-default,#1A1A1A) }
  .change-row{ display:flex; flex-wrap:wrap; align-items:center; gap:var(--aha-space-4,4px) var(--aha-space-8,8px);
    font-size:var(--aha-size-default,14px); line-height:var(--aha-line-height-body,1.5) }
  [hidden]{ display:none !important }
  .change{ display:inline-flex; align-items:center; gap:var(--aha-space-4,4px); font-weight:var(--aha-weight-semibold,600);
    font-variant-numeric:tabular-nums; color:var(--aha-text-default,#1A1A1A); max-width:100%; overflow-wrap:anywhere }
  .change.is-fall{ padding:0 var(--aha-space-8,8px) 0 var(--aha-space-6,6px); border-radius:var(--aha-radius-pill,999px);
    background:var(--aha-bg-dark,#1A1A1A); color:var(--aha-text-inverse,#FFFFFF) }
  .change aha-icon{ color:currentColor }
  .caption{ color:var(--aha-text-secondary,#4A4A4A) }
  .sr{ position:absolute; width:1px; height:1px; overflow:hidden; clip:rect(0 0 0 0); white-space:nowrap }
`;

const toNumber = (raw) => {
  if (raw == null || String(raw).trim() === '') return null;
  const number = Number(String(raw).replace(/,/g, ''));
  return Number.isFinite(number) ? number : null;
};

export class AhaStatTile extends HTMLElement {
  static get observedAttributes() {
    return ['label', 'value', 'previous', 'caption', 'format', 'look', 'locale', 'rise-label', 'fall-label', 'flat-label', 'points-label'];
  }

  connectedCallback() { if (!this.shadowRoot) this._mount(); this._sync(); }
  attributeChangedCallback() { if (this.shadowRoot) this._sync(); }

  _mount() {
    const shadow = this.attachShadow({ mode: 'open' });
    shadow.innerHTML = `<style>${STYLE}</style>
      <div class="tile" part="tile" role="group">
        <div class="label" part="label"></div>
        <div class="value" part="value"></div>
        <div class="change-row" part="change-row">
          <span class="change" part="change"><aha-icon size="16" aria-hidden="true"></aha-icon><span class="sr"></span><span class="change-text"></span></span>
          <span class="caption" part="caption"></span>
        </div>
      </div>`;
    const find = (selector) => shadow.querySelector(selector);
    this._nodes = {
      tile: find('.tile'), label: find('.label'), value: find('.value'), row: find('.change-row'), change: find('.change'),
      glyph: find('.change aha-icon'), word: find('.sr'), changeText: find('.change-text'), caption: find('.caption'),
    };
  }

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
    return { direction, text: `${absolute} (${this._relativeText(magnitude / Math.abs(previous))})` };
  }

  _relativeText(share) {
    const percent = (digits) => this._formatter({ style: 'percent', maximumFractionDigits: digits });
    if (share >= 0.005) return percent(0).format(share);
    if (share >= 0.0005) return percent(1).format(share);
    return `<${percent(1).format(0.001)}`;
  }

  _sync() {
    const nodes = this._nodes;
    const label = this.getAttribute('label') || '';
    const rawValue = this.getAttribute('value') ?? '';
    const number = toNumber(rawValue);
    const caption = this.getAttribute('caption') || '';
    const change = this.change();
    nodes.label.textContent = label;
    if (label) nodes.tile.setAttribute('aria-label', label); else nodes.tile.removeAttribute('aria-label');
    const shownValue = number == null ? rawValue : this._formatValue(number);
    nodes.value.textContent = shownValue;
    nodes.value.style.setProperty('--value-length', Math.max(shownValue.length, 1));
    nodes.caption.textContent = caption;
    nodes.caption.hidden = !caption;
    nodes.row.hidden = !change && !caption;
    nodes.change.hidden = !change;
    if (!change) return;
    nodes.change.className = `change is-${change.direction}`;
    const glyph = change.direction === 'rise' ? 'system-arrow-up' : change.direction === 'fall' ? 'system-arrow-down' : '';
    nodes.glyph.hidden = !glyph;
    if (glyph) nodes.glyph.setAttribute('name', glyph);
    const word = change.direction === 'rise' ? (this.getAttribute('rise-label') || 'Up')
      : change.direction === 'fall' ? (this.getAttribute('fall-label') || 'Down') : '';
    nodes.word.textContent = word ? `${word} ` : '';
    nodes.changeText.textContent = change.text;
  }
}

export function defineAhaStatTile(tag = 'aha-stat-tile') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaStatTile);
  return true;
}
if (typeof window !== 'undefined') defineAhaStatTile();

export default { AhaStatTile, defineAhaStatTile };
