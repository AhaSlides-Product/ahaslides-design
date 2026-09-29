/**
 * @ahaslides-product/design/aha-chart — the AhaSlides chart library: one framework-free element that
 * draws Bar, Column, Stacked, Donut, Word cloud and Mind map results with the same look everywhere.
 *
 *   import '@ahaslides-product/design/aha-chart';   // registers <aha-chart> (+ <aha-live-region>)
 *   <aha-chart type="bar" label="Top priorities"></aha-chart>
 *   chart.data = [{ label: 'Better onboarding', value: 258 }, { label: 'Google Slides sync', value: 219 }];
 *
 * Data (the `data` property, or JSON in the `data` attribute):
 *   bar · column · donut · wordcloud  [{ label, value }]
 *   stacked                           { series: ['Salary', 'Team'], rows: [{ label: 'All', values: [31, 16] }] }
 *   mindmap                           { label: 'Root idea', children: [{ label, children: [...] }] }
 *
 * Where it is used decides the colours:
 *   palette="brand" (default)  Report and every other app screen: the --aha-viz-* brand chart palette.
 *   palette="deck"             presenting / audience canvas: series come from the deck's
 *                              presentationColorPalette (`colors`), text from the deck text colour (`ink`).
 * The chart never paints a background, and never carries state colours.
 *
 * Options: number-format (count | percent | both), sort (none | desc | asc), highlight-top (N),
 * log-scale, legend (on | off), tooltip (on | off), max-items (the cap before an "Other" bucket),
 * responses (respondent count for the summary). Built-in copy follows `locale` (Intl formats the
 * numbers); pass translated copy through the `strings` property. Every chart ships a text summary,
 * a visually hidden data table and a polite live-region announcement when its data changes.
 */
import './aha-live-region.js';

/** Built-in copy per language. Pass `strings` to override any key with the Presenter app's translations. */
export const chartStrings = {
  en: {
    typeNames: { bar: 'Bar chart', column: 'Column chart', stacked: 'Stacked bar chart', donut: 'Donut chart', wordcloud: 'Word cloud', mindmap: 'Mind map' },
    waiting: 'Waiting for responses',
    other: 'Other',
    responses: { one: '{count} response', other: '{count} responses' },
    responsesUnit: { one: 'response', other: 'responses' },
    item: 'Item',
    count: 'Count',
    share: 'Share',
    word: 'Word',
    summary: '{type}. Options: {items}. {responses}.',
    leader: 'Highest: {label}, {value}.',
    stackedSummary: '{type}. Groups: {rows}. Categories: {series}.',
    wordcloudSummary: '{type}. Words: {items}. {responses}.',
    wordcloudLeader: 'Most frequent: {label}, {value}.',
    mindmapSummary: '{type}: {label}. Branches: {branches}. Ideas: {ideas}.',
    waitingSummary: '{type}. Waiting for responses.',
    updated: 'Chart updated. {summary}',
  },
  vi: {
    typeNames: { bar: 'Biểu đồ thanh', column: 'Biểu đồ cột', stacked: 'Biểu đồ thanh chồng', donut: 'Biểu đồ vành khuyên', wordcloud: 'Đám mây từ', mindmap: 'Sơ đồ tư duy' },
    waiting: 'Đang chờ câu trả lời',
    other: 'Khác',
    responses: { other: '{count} câu trả lời' },
    responsesUnit: { other: 'câu trả lời' },
    item: 'Mục',
    count: 'Số lượng',
    share: 'Tỉ lệ',
    word: 'Từ',
    summary: '{type}. Số lựa chọn: {items}. {responses}.',
    leader: 'Cao nhất: {label}, {value}.',
    stackedSummary: '{type}, {rows} nhóm trên {series} hạng mục.',
    wordcloudSummary: '{type}. Số từ: {items}. {responses}.',
    wordcloudLeader: 'Nhiều nhất: {label}, {value}.',
    mindmapSummary: '{type} về {label}: {branches} nhánh, {ideas} ý tưởng.',
    waitingSummary: '{type}. Đang chờ câu trả lời.',
    updated: 'Biểu đồ đã cập nhật. {summary}',
  },
};

const TYPES = ['bar', 'column', 'stacked', 'donut', 'wordcloud', 'mindmap'];
const DEFAULT_CAP = { bar: 10, column: 8, donut: 6, stacked: 6, wordcloud: 60 };
const OTHER_KEY = '\u0000other';
const GHOST_EXTENTS = [0.62, 0.4, 0.78, 0.26];
const GHOST = 'var(--_ghost)';
const BRAND_SERIES = [
  'var(--aha-viz-series-1, #714CF5)', 'var(--aha-viz-series-2, #E96144)', 'var(--aha-viz-series-3, #189D96)',
  'var(--aha-viz-series-4, #A95166)', 'var(--aha-viz-series-5, #D49900)', 'var(--aha-viz-series-6, #4491C4)',
];
const BRAND_TINTS = [
  'var(--aha-viz-tint-1, #EAE4FE)', 'var(--aha-viz-tint-2, #FCE7E1)', 'var(--aha-viz-tint-3, #DCF0EE)',
  'var(--aha-viz-tint-4, #F6E5E9)', 'var(--aha-viz-tint-5, #F8EDD3)', 'var(--aha-viz-tint-6, #E2EEF6)',
];
const NEUTRAL = 'var(--aha-viz-neutral, #A8A29B)';
const INK = 'var(--aha-viz-ink, #313131)';
const INK_INVERSE = 'var(--aha-viz-ink-inverse, #FFFFFF)';
const ANNOUNCE_THROTTLE_MS = 1500;
const INTRO_SETTLE_MS = 1400;
const DONUT_LABEL_WIDTH = 150;
const DONUT_LABEL_MIN_WIDTH = 96;
const DONUT_LABEL_SPACING = 46;
const WORDCLOUD_MIN_FONT = 16;
const WORDCLOUD_PADDING = 4;
const MINDMAP_COLUMN_GAP = 32;
const MINDMAP_ROW_GAP = 12;
const MINDMAP_BRANCH_GAP = 24;
const MINDMAP_ONE_SIDED_BELOW = 640;
const MINDMAP_MIN_SCALE = 0.6;
const COLUMN_VALUE_ROOM = 34;

const STYLE = `
:host{ display:block; position:relative; font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif); background:transparent }
:host([hidden]){ display:none }
.root{ position:relative; container-type:inline-size; font-family:inherit; font-size:var(--aha-viz-font-label,16px); line-height:1.45;
  font-variant-numeric:tabular-nums; color:var(--_ink); background:transparent;
  --_ink:var(--aha-viz-ink,#313131);
  --_ink-inverse:var(--aha-viz-ink-inverse,#FFFFFF);
  --_ink-2:color-mix(in srgb, var(--_ink) var(--aha-viz-mix-secondary,76%), transparent);
  --_ink-3:color-mix(in srgb, var(--_ink) var(--aha-viz-mix-tertiary,54%), transparent);
  --_grid:color-mix(in srgb, var(--_ink) var(--aha-viz-mix-grid,12%), transparent);
  --_track:color-mix(in srgb, var(--_ink) var(--aha-viz-mix-track,7%), transparent);
  --_stroke:color-mix(in srgb, var(--_ink) var(--aha-viz-mix-stroke,10%), transparent);
  --_stroke-chip:color-mix(in srgb, var(--_ink) var(--aha-viz-mix-stroke-chip,20%), transparent);
  --_hover:color-mix(in srgb, var(--_ink) var(--aha-viz-mix-hover,8%), transparent);
  --_ghost:var(--_grid);
  --_radius:var(--aha-radius-default,8px);
  --_radius-chip:var(--aha-radius-xs,4px);
  --_bar:var(--aha-viz-bar-thickness,38px);
  --_duration:var(--aha-motion-viz-update,.4s);
  --_ease:var(--aha-ease-viz,cubic-bezier(0.2,0.7,0.4,1)) }
.root.is-intro{ --_duration:var(--aha-motion-viz-enter,.6s) }
.is-intro :is(.bar-fill,.column-bar,.stack-segment){ transition-delay:calc(var(--_i,0) * var(--aha-motion-viz-stagger,40ms)) }
.viz{ display:flex; gap:16px; align-items:flex-start; width:100% }
.plot{ position:relative; flex:1 1 auto; min-width:0 }
.clip{ display:-webkit-box; -webkit-box-orient:vertical; -webkit-line-clamp:1; overflow:hidden; overflow-wrap:anywhere }
.is-dim{ opacity:var(--aha-viz-mix-dim,38%) }
.mark{ transition:opacity var(--aha-motion-mid,.2s) var(--aha-ease-in-out,ease) }
.value{ display:inline-flex; align-items:baseline; gap:6px; white-space:nowrap; line-height:1.25 }
.value-main{ font-size:var(--aha-viz-font-value,20px); font-weight:600; color:var(--_ink) }
.value-sub{ color:var(--_ink-3) }
.value-sub:empty{ display:none }
.waiting{ margin:12px 0 0; color:var(--_ink-3); text-align:center }
.waiting[hidden]{ display:none }
.is-waiting .waiting{ position:absolute; inset:0; margin:0; display:flex; align-items:center; justify-content:center; padding:0 16px }

.legend{ flex:0 0 26%; max-width:26%; margin:0; padding:0; list-style:none; display:flex; flex-direction:column; gap:4px }
.legend[hidden]{ display:none }
.legend li{ display:grid; grid-template-columns:var(--aha-viz-legend-swatch,14px) minmax(0,1fr) auto; column-gap:8px; align-items:start; padding:6px 8px; color:var(--_ink-2); line-height:20px }
.swatch{ width:var(--aha-viz-legend-swatch,14px); height:var(--aha-viz-legend-swatch,14px); margin-top:3px; border-radius:min(var(--_radius-chip),50%); background:var(--_c); box-shadow:inset 0 0 0 1px var(--_stroke-chip) }
.legend-value{ color:var(--_ink-3); white-space:nowrap }
@container (max-width:560px){
  .viz{ flex-direction:column; align-items:stretch }
  .legend{ flex:none; max-width:none; width:100%; flex-direction:row; flex-wrap:wrap }
  .legend li{ padding:4px 8px 4px 0 }
}

.bars{ display:grid; grid-template-columns:minmax(0,1fr) auto; column-gap:12px; row-gap:var(--aha-viz-bar-gap,14px) }
.bar-row{ grid-column:1/-1; display:grid; grid-template-columns:subgrid; align-items:center; transition:transform var(--aha-motion-viz-reorder,.35s) var(--aha-ease-viz,ease), opacity var(--aha-motion-mid,.2s) var(--aha-ease-in-out,ease) }
.bar-head{ grid-column:1/-1; display:flex; gap:8px; align-items:baseline; margin-bottom:6px; min-width:0; line-height:20px }
.bar-rank{ flex:none; min-width:1.4ch; color:var(--_ink-3) }
.bar-rank:empty{ display:none }
.bar-label{ flex:0 1 auto; min-width:0; color:var(--_ink-2) }
.bar-track{ position:relative; min-width:0; height:var(--_bar); border-radius:var(--_radius); background:var(--_track);
  transition:background-color var(--aha-motion-mid,.2s) var(--aha-ease-in-out,ease) }
.bar-row:hover .bar-track{ background:var(--_hover) }
.bar-fill{ height:100%; width:0; border-radius:var(--_radius); background:var(--_c); box-shadow:inset 0 0 0 1px var(--_stroke);
  transition:width var(--_duration) var(--_ease) }
.bar-row .value{ min-width:4ch; justify-content:flex-end }

.columns{ display:flex; gap:var(--aha-viz-column-gap,28px); padding:0 4px }
.column{ flex:1 1 0; min-width:0; max-width:240px; margin:0 auto; display:flex; flex-direction:column; align-items:center;
  transition:transform var(--aha-motion-viz-reorder,.35s) var(--aha-ease-viz,ease), opacity var(--aha-motion-mid,.2s) var(--aha-ease-in-out,ease) }
.column-plot{ width:100%; height:var(--aha-viz-plot-height,260px); display:flex; flex-direction:column; justify-content:flex-end; align-items:center }
.column-plot .value{ margin-bottom:8px; flex-wrap:wrap; justify-content:center; column-gap:6px }
.column-bar{ width:min(var(--aha-viz-column-width,96px),100%); height:0; min-height:4px; border-radius:min(var(--_radius),50%); background:var(--_c); box-shadow:inset 0 0 0 1px var(--_stroke);
  transition:height var(--_duration) var(--_ease) }
.column-label{ width:100%; padding-top:8px; text-align:center; color:var(--_ink-2); line-height:1.25; -webkit-line-clamp:2 }
@container (max-width:480px){ .columns{ gap:8px } .column-plot .value-sub{ display:none } }

.stack-rows{ display:flex; flex-direction:column; gap:var(--aha-viz-bar-gap,14px) }
.stack-label{ margin-bottom:6px; color:var(--_ink-2); line-height:20px }
.stack-bar{ display:flex; height:var(--_bar); border-radius:min(var(--_radius),50%); overflow:hidden; background:var(--_track) }
.stack-segment{ flex:none; height:100%; width:0; background:var(--_c); box-shadow:inset 0 0 0 1px var(--_stroke);
  transition:width var(--_duration) var(--_ease) }
.stack-values{ position:relative; height:24px; margin-top:4px }
.stack-value{ position:absolute; top:0; transform:translateX(-50%); color:var(--_ink-2); white-space:nowrap;
  transition:left var(--_duration) var(--_ease), opacity var(--aha-motion-mid,.2s) var(--aha-ease-in-out,ease) }
.stack-value.is-hidden{ opacity:0 }

.donut{ position:relative; margin:0 auto }
.donut svg{ position:absolute; inset:0; overflow:visible }
.donut-arc{ fill:none; stroke:var(--_c); transition:stroke-dasharray var(--_duration) var(--_ease), stroke-dashoffset var(--_duration) var(--_ease), opacity var(--aha-motion-mid,.2s) var(--aha-ease-in-out,ease) }
.donut-track{ fill:none; stroke:var(--_ghost) }
.donut-leader{ fill:none; stroke:var(--_grid); stroke-width:1 }
.donut-centre{ position:absolute; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; line-height:1.25; pointer-events:none }
.donut-total{ font-size:var(--aha-viz-font-title,24px); font-weight:600 }
.donut-sub{ color:var(--_ink-3); max-width:80% }
.donut-label{ position:absolute; line-height:1.25; transform:translateY(-50%);
  transition:top var(--_duration) var(--_ease), opacity var(--aha-motion-mid,.2s) var(--aha-ease-in-out,ease) }
.donut-label.is-left{ text-align:right }
.donut-label .value{ display:flex; gap:6px }
.donut-label.is-left .value{ justify-content:flex-end }
.donut-label .clip{ color:var(--_ink-2); -webkit-line-clamp:2 }

.cloud{ position:relative; width:100%; overflow:hidden }
.word{ position:absolute; left:0; top:0; white-space:pre; line-height:1.15; color:var(--_c); border-radius:var(--_radius-chip);
  transition:transform var(--_duration) var(--_ease), opacity var(--aha-motion-mid,.2s) var(--aha-ease-in-out,ease) }
.word.is-measuring, .word.is-dropped{ opacity:0 }

.mindmap{ position:relative; width:100%; overflow-x:auto; overflow-y:hidden }
.mindmap::after{ content:""; display:block; width:var(--_map-width,0); height:1px }
.mindmap-stage{ position:absolute; left:0; top:0; transform-origin:0 0 }
.mindmap-links{ position:absolute; left:0; top:0; overflow:visible; pointer-events:none }
.mindmap-link{ fill:none; stroke:var(--_c); stroke-width:1.5; transition:opacity var(--aha-motion-mid,.2s) var(--aha-ease-in-out,ease) }
.node{ position:absolute; left:0; top:0; line-height:1.25; border-radius:min(var(--_radius),50%); overflow-wrap:break-word;
  transition:transform var(--aha-motion-viz-reorder,.35s) var(--aha-ease-viz,ease), opacity var(--aha-motion-mid,.2s) var(--aha-ease-in-out,ease) }
.node-1{ max-width:240px; padding:14px 18px; background:var(--_root-fill); color:var(--_root-ink); font-size:var(--aha-viz-font-title,24px); font-weight:600; text-align:center }
.node-2{ max-width:160px; padding:6px 12px; background:var(--_tint); box-shadow:inset 0 0 0 1px var(--_stroke); font-size:var(--aha-viz-font-lead,18px); font-weight:600 }
.node-3{ max-width:130px; padding:5px 10px; box-shadow:inset 0 0 0 1px var(--_stroke-chip); font-weight:600 }
.node-deep{ max-width:130px; padding:4px 10px; color:var(--_ink-2) }

.tip{ position:absolute; z-index:4; left:0; top:0; pointer-events:none; width:max-content; max-width:min(320px,100%); padding:8px 12px;
  border-radius:var(--_radius); background:var(--_ink); color:var(--_tip-ink,var(--_ink-inverse)); line-height:1.25; opacity:0;
  transition:opacity var(--aha-motion-fast,.1s) var(--aha-ease-in-out,ease) }
.tip.is-shown{ opacity:1 }
.tip b{ display:block; margin-bottom:2px; font-weight:600; overflow-wrap:anywhere }
.tip span{ opacity:.8 }

.sr{ position:absolute; width:1px; height:1px; margin:-1px; padding:0; border:0; overflow:hidden; clip:rect(0 0 0 0); clip-path:inset(50%); white-space:nowrap }

@media (prefers-reduced-motion: reduce){
  .root *{ transition:none !important }
}
`;

const reducedMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const fill = (template, values) => String(template || '').replace(/\{(\w+)\}/g, (match, key) => (key in values ? values[key] : match));
const toNumber = (value) => { const number = Number(value); return Number.isFinite(number) && number > 0 ? number : 0; };
const safeColour = (value) => {
  const text = String(value || '').trim();
  return text && typeof CSS !== 'undefined' && CSS.supports('color', text) ? text : null;
};
const roundedShares = (values) => {
  const total = values.reduce((sum, value) => sum + value, 0);
  if (!total) return values.map(() => 0);
  const exact = values.map(value => value * 100 / total);
  const percents = exact.map(Math.floor);
  let remaining = 100 - percents.reduce((sum, percent) => sum + percent, 0);
  exact.map((value, index) => [value - percents[index], index]).sort((a, b) => b[0] - a[0])
    .forEach(([, index]) => { if (remaining-- > 0) percents[index]++; });
  return percents.map(percent => percent / 100);
};
const create = (tag, className, parent) => {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (parent) parent.appendChild(element);
  return element;
};
const createSvg = (tag, className, parent) => {
  const element = document.createElementNS('http://www.w3.org/2000/svg', tag);
  if (className) element.setAttribute('class', className);
  if (parent) parent.appendChild(element);
  return element;
};

function relativeLuminance(colour) {
  let channels = null;
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})/i.exec(colour);
  if (hex) {
    const digits = hex[1].length === 3 ? [...hex[1]].map(digit => digit + digit).join('') : hex[1];
    channels = [0, 2, 4].map(offset => parseInt(digits.slice(offset, offset + 2), 16));
  } else {
    const rgb = /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i.exec(colour);
    if (rgb) channels = [rgb[1], rgb[2], rgb[3]].map(Number);
  }
  if (!channels) return null;
  const [red, green, blue] = channels.map(channel => {
    const unit = channel / 255;
    return unit <= 0.03928 ? unit / 12.92 : ((unit + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

/** Dark or light chart ink, whichever reads on the given fill (WCAG luminance split). */
export function readableInkOn(colour) {
  const luminance = relativeLuminance(String(colour || ''));
  if (luminance == null) return INK_INVERSE;
  return luminance > 0.179 ? INK : INK_INVERSE;
}

export class AhaChart extends HTMLElement {
  static get observedAttributes() {
    return ['type', 'data', 'palette', 'colors', 'ink', 'locale', 'number-format', 'sort', 'highlight-top',
      'log-scale', 'legend', 'tooltip', 'max-items', 'responses', 'label'];
  }

  constructor() {
    super();
    this._dataValue = undefined;
    this._colorsValue = null;
    this._stringsValue = null;
    this._drawnType = null;
    this._hasDrawn = false;
    this._lastSummary = '';
  }

  get data() {
    if (this._dataValue !== undefined) return this._dataValue;
    try { return JSON.parse(this.getAttribute('data') || 'null'); } catch { return null; }
  }
  set data(value) { this._dataValue = value; this._schedule(); }

  get colors() {
    if (this._colorsValue) return this._colorsValue;
    return (this.getAttribute('colors') || '').split(/[\s,;]+(?![^(]*\))/).filter(Boolean);
  }
  set colors(value) { this._colorsValue = Array.isArray(value) ? value.slice() : null; this._schedule(); }

  get strings() { return this._stringsValue; }
  set strings(value) { this._stringsValue = value && typeof value === 'object' ? value : null; this._schedule(); }

  /** The plain-language summary screen readers hear (also handy for a visible caption). */
  get summary() { return this._lastSummary; }

  connectedCallback() {
    for (const name of ['data', 'colors', 'strings']) {
      if (!Object.prototype.hasOwnProperty.call(this, name)) continue;
      const value = this[name];
      delete this[name];
      this[name] = value;
    }
    if (!this.shadowRoot) this._mount();
    this.setAttribute('role', 'figure');
    if (typeof ResizeObserver === 'function' && !this._resizeObserver) {
      this._observedWidth = 0;
      this._resizeObserver = new ResizeObserver(entries => {
        const width = Math.round(entries[0].contentRect.width);
        if (width && width !== this._observedWidth) { this._observedWidth = width; this._layoutMeasured(); }
      });
      this._resizeObserver.observe(this._plot);
    }
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => this.isConnected && this._layoutMeasured());
    this._schedule();
  }

  disconnectedCallback() {
    if (this._resizeObserver) { this._resizeObserver.disconnect(); this._resizeObserver = null; }
    clearTimeout(this._announceTimer);
    this._announceTimer = null;
    clearTimeout(this._introTimer);
    if (this._root) this._root.classList.remove('is-intro');
  }

  attributeChangedCallback(name) {
    if (name === 'data') this._dataValue = undefined;
    if (name === 'colors') this._colorsValue = null;
    this._schedule();
  }

  _mount() {
    const shadow = this.attachShadow({ mode: 'open' });
    const style = create('style', null, shadow);
    style.textContent = STYLE;
    this._root = create('div', 'root', shadow);
    this._root.setAttribute('part', 'chart');
    this._viz = create('div', 'viz', this._root);
    this._viz.setAttribute('aria-hidden', 'true');
    this._plot = create('div', 'plot', this._viz);
    this._plot.setAttribute('part', 'plot');
    this._legend = create('ul', 'legend', this._viz);
    this._legend.setAttribute('part', 'legend');
    this._legend.hidden = true;
    this._waiting = create('p', 'waiting', this._plot);
    this._waiting.hidden = true;
    this._tip = create('div', 'tip', this._root);
    this._tip.setAttribute('aria-hidden', 'true');
    this._tip.setAttribute('part', 'tooltip');
    const accessible = create('div', 'sr', this._root);
    this._summaryNode = create('p', null, accessible);
    this._table = create('table', null, accessible);
    this._outline = create('ul', null, accessible);
    this._live = create('aha-live-region', null, this._root);
    this._live.setAttribute('politeness', 'polite');
    this._plot.addEventListener('pointermove', event => this._showTip(event));
    this._plot.addEventListener('pointerleave', () => this._hideTip());
  }

  _schedule() {
    if (this._queued || !this.shadowRoot) return;
    this._queued = true;
    queueMicrotask(() => { this._queued = false; if (this.isConnected) this._draw(); });
  }

  get _type() { const type = (this.getAttribute('type') || 'bar').toLowerCase(); return TYPES.includes(type) ? type : 'bar'; }
  get _isDeck() { return this.getAttribute('palette') === 'deck'; }
  get _numberFormat() { const format = this.getAttribute('number-format'); return ['count', 'percent'].includes(format) ? format : 'both'; }
  get _locale() { return this.getAttribute('locale') || (document.documentElement && document.documentElement.lang) || 'en'; }

  _copy() {
    const locale = this._locale;
    const language = locale.toLowerCase().split('-')[0];
    const override = this._stringsValue || {};
    const base = chartStrings[locale] || chartStrings[language] || {};
    return {
      ...chartStrings.en, ...base, ...override,
      typeNames: { ...chartStrings.en.typeNames, ...(base.typeNames || {}), ...(override.typeNames || {}) },
    };
  }

  _series() {
    if (!this._isDeck) return { colours: BRAND_SERIES, tints: BRAND_TINTS };
    const colours = this.colors.map(safeColour).filter(Boolean);
    if (!colours.length) return { colours: BRAND_SERIES, tints: BRAND_TINTS };
    const tints = colours.map(colour => `color-mix(in srgb, ${colour} 16%, transparent)`);
    return { colours, tints };
  }

  _formatters() {
    const locale = this._locale;
    if (this._formatCache && this._formatCache.locale === locale) return this._formatCache;
    let count, percent, plural;
    try { count = new Intl.NumberFormat(locale); } catch { count = new Intl.NumberFormat('en'); }
    try { percent = new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 0 }); } catch { percent = new Intl.NumberFormat('en', { style: 'percent', maximumFractionDigits: 0 }); }
    try { plural = new Intl.PluralRules(locale); } catch { plural = new Intl.PluralRules('en'); }
    this._formatCache = { locale, count, percent, plural };
    return this._formatCache;
  }

  _applyInk() {
    const ink = this._isDeck ? safeColour(this.getAttribute('ink')) : null;
    if (ink) {
      this._root.style.setProperty('--_ink', ink);
      const contrastInk = readableInkOn(getComputedStyle(this._root).color);
      this._root.style.setProperty('--_tip-ink', contrastInk);
      this._root.style.setProperty('--_root-fill', ink);
      this._root.style.setProperty('--_root-ink', contrastInk);
    } else {
      for (const name of ['--_ink', '--_tip-ink']) this._root.style.removeProperty(name);
      this._root.style.setProperty('--_root-fill', INK);
      this._root.style.setProperty('--_root-ink', INK_INVERSE);
    }
  }

  _items() {
    const raw = Array.isArray(this.data) ? this.data : [];
    const seen = new Map();
    let items = raw.filter(entry => entry && (entry.label ?? entry.text) != null).map((entry, index) => {
      const label = String(entry.label ?? entry.text);
      const repeat = seen.get(label) || 0;
      seen.set(label, repeat + 1);
      return { key: repeat ? `${label}\u0000${repeat}` : label, label, value: toNumber(entry.value), colourIndex: index };
    });
    const isCloud = this._type === 'wordcloud';
    if (isCloud) items = items.filter(item => item.value > 0);
    const cap = Math.max(2, parseInt(this.getAttribute('max-items'), 10) || DEFAULT_CAP[this._type] || 10);
    if (items.length > cap && !isCloud) {
      const byValue = items.slice().sort((a, b) => b.value - a.value);
      const kept = new Set(byValue.slice(0, cap - 1));
      const rest = byValue.slice(cap - 1);
      items = items.filter(item => kept.has(item));
      items.push({ key: OTHER_KEY, label: this._copy().other, value: rest.reduce((sum, item) => sum + item.value, 0), isOther: true });
    } else if (items.length > cap) {
      items = items.slice().sort((a, b) => b.value - a.value).slice(0, cap);
    }
    const total = items.reduce((sum, item) => sum + item.value, 0);
    const other = items.find(item => item.isOther);
    const ranked = items.filter(item => !item.isOther).sort((a, b) => b.value - a.value);
    ranked.forEach((item, index) => { item.rank = index + 1; });
    if (other) other.rank = Infinity;
    const sort = this.getAttribute('sort');
    if (sort === 'desc') items = other ? [...ranked, other] : ranked;
    else if (sort === 'asc') items = other ? [...ranked.slice().reverse(), other] : ranked.slice().reverse();
    const highlightTop = parseInt(this.getAttribute('highlight-top'), 10) || 0;
    const max = Math.max(0, ...items.map(item => item.value));
    const logScale = this.hasAttribute('log-scale');
    const { colours } = this._series();
    const shares = roundedShares(items.map(item => item.value));
    items.forEach((item, index) => { item.share = shares[index]; });
    for (const item of items) {
      item.extent = !max ? 0 : logScale ? Math.log1p(item.value) / Math.log1p(max) : item.value / max;
      item.dim = highlightTop > 0 && item.rank > highlightTop;
      item.colour = item.isOther ? NEUTRAL : colours[item.colourIndex % colours.length];
    }
    return { items, total };
  }

  _valueParts(value, share, formats) {
    const count = formats.count.format(value);
    const percent = formats.percent.format(share);
    const format = this._numberFormat;
    if (format === 'count') return [count, ''];
    if (format === 'percent') return [percent, ''];
    return [count, percent];
  }

  _valueText(value, share, formats) { return this._valueParts(value, share, formats).filter(Boolean).join(' · '); }

  _compactValue(value, share, formats) {
    return this._numberFormat === 'count' ? formats.count.format(value) : formats.percent.format(share);
  }

  _responsesText(total, copy, formats) {
    const responses = parseInt(this.getAttribute('responses'), 10);
    const count = Number.isFinite(responses) && responses >= 0 ? responses : total;
    const forms = copy.responses || {};
    const template = forms[formats.plural.select(count)] || forms.other || '{count}';
    return fill(template, { count: formats.count.format(count) });
  }

  _draw() {
    const type = this._type;
    if (this._drawnType !== type) {
      this._plot.replaceChildren(this._waiting);
      this._legend.replaceChildren();
      this._nodes = new Map();
      this._drawnType = type;
      this._intro();
    }
    this._applyInk();
    const label = this.getAttribute('label');
    const copy = this._copy();
    this.setAttribute('aria-label', label || copy.typeNames[type]);
    this._hideTip();

    const formats = this._formatters();
    let model;
    if (type === 'stacked') model = this._drawStacked(copy, formats);
    else if (type === 'mindmap') model = this._drawMindmap(copy);
    else {
      model = this._items();
      model.waiting = model.total === 0;
      if (type === 'bar') this._drawBars(model, formats);
      else if (type === 'column') this._drawColumns(model, formats);
      else if (type === 'donut') this._drawDonut(model, copy, formats);
      else this._drawWordcloud(model);
    }
    this._model = model;
    this._root.classList.toggle('is-waiting', !!model.waiting && (type === 'column' || type === 'wordcloud'));
    this._waiting.hidden = !model.waiting || type === 'donut';
    this._waiting.textContent = copy.waiting;
    this._syncLegend(model, formats);
    this._describe(model, copy, formats);
  }

  _intro() {
    if (reducedMotion()) return;
    this._root.classList.add('is-intro');
    clearTimeout(this._introTimer);
    this._introTimer = setTimeout(() => this._root.classList.remove('is-intro'), INTRO_SETTLE_MS);
  }

  _keyed(key, make) {
    let node = this._nodes.get(key);
    const isNew = !node;
    if (isNew) { node = make(); this._nodes.set(key, node); }
    node._alive = true;
    return [node, isNew];
  }

  _sweep() {
    for (const [key, node] of this._nodes) {
      if (!node._alive) { node.remove(); this._nodes.delete(key); } else node._alive = false;
    }
  }

  _reorderAnimated(container, nodes) {
    const before = new Map(nodes.map(node => [node, node.isConnected ? node.getBoundingClientRect() : null]));
    nodes.forEach(node => container.appendChild(node));
    if (reducedMotion()) return;
    const moved = [];
    for (const node of nodes) {
      const previous = before.get(node);
      if (!previous) continue;
      const next = node.getBoundingClientRect();
      const deltaX = previous.left - next.left, deltaY = previous.top - next.top;
      if (!deltaX && !deltaY) continue;
      node.style.transitionProperty = 'none';
      node.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
      moved.push(node);
    }
    if (!moved.length) return;
    void container.offsetWidth;
    for (const node of moved) { node.style.transitionProperty = ''; node.style.transform = ''; }
  }

  _grow(node, property, value, isNew) {
    if (isNew && !reducedMotion()) {
      node.style[property] = '0';
      // two frames: the zero must be painted before the target is set, or the enter transition is skipped
      requestAnimationFrame(() => requestAnimationFrame(() => { node.style[property] = value; }));
    } else node.style[property] = value;
  }

  _ghostItems() {
    return GHOST_EXTENTS.map((_, index) => ({ key: `\u0000ghost${index}`, label: '', isGhost: true }));
  }

  _drawBars(model, formats) {
    const list = this._container('bars');
    const items = model.waiting && !model.items.length ? this._ghostItems().slice(0, 3) : model.items;
    const ranked = this.getAttribute('sort') === 'desc';
    const rows = items.map((item, index) => {
      const [row, isNew] = this._keyed(item.key, () => {
        const node = create('div', 'bar-row mark');
        const head = create('div', 'bar-head', node);
        node._rank = create('span', 'bar-rank', head);
        node._label = create('span', 'bar-label clip', head);
        const track = create('div', 'bar-track', node);
        node._fill = create('div', 'bar-fill', track);
        node._value = this._valueNode(node);
        return node;
      });
      row.dataset.key = item.key;
      row.style.setProperty('--_c', model.waiting ? GHOST : item.colour);
      row.style.setProperty('--_i', String(index));
      row.classList.toggle('is-dim', !!item.dim);
      row._rank.textContent = ranked && Number.isFinite(item.rank) ? String(item.rank) : '';
      row._label.textContent = item.isGhost ? '\u00a0' : item.label;
      this._setValue(row._value, item, formats, model.waiting);
      const extent = model.waiting ? GHOST_EXTENTS[index % GHOST_EXTENTS.length] : item.extent;
      this._grow(row._fill, 'width', `${(extent * 100).toFixed(2)}%`, isNew);
      return row;
    });
    this._sweep();
    this._reorderAnimated(list, rows);
  }

  _drawColumns(model, formats) {
    const list = this._container('columns');
    const items = model.waiting && !model.items.length ? this._ghostItems() : model.items;
    const columns = items.map((item, index) => {
      const [column, isNew] = this._keyed(item.key, () => {
        const node = create('div', 'column mark');
        const plot = create('div', 'column-plot', node);
        node._value = this._valueNode(plot);
        node._bar = create('div', 'column-bar', plot);
        node._label = create('div', 'column-label clip', node);
        return node;
      });
      column.dataset.key = item.key;
      column.style.setProperty('--_c', model.waiting ? GHOST : item.colour);
      column.style.setProperty('--_i', String(index));
      column.classList.toggle('is-dim', !!item.dim);
      column._label.textContent = item.isGhost ? '\u00a0' : item.label;
      this._setValue(column._value, item, formats, model.waiting);
      const extent = model.waiting ? GHOST_EXTENTS[index % GHOST_EXTENTS.length] : item.extent;
      this._grow(column._bar, 'height', `calc((100% - ${COLUMN_VALUE_ROOM}px) * ${extent.toFixed(4)})`, isNew);
      return column;
    });
    this._sweep();
    this._reorderAnimated(list, columns);
  }

  _container(className) {
    let list = this._plot.querySelector(`:scope > .${className}`);
    if (!list) { list = create('div', className); this._plot.insertBefore(list, this._waiting); }
    return list;
  }

  _valueNode(parent) {
    const value = create('span', 'value', parent);
    value._main = create('span', 'value-main', value);
    value._sub = create('span', 'value-sub', value);
    return value;
  }

  _setValue(value, item, formats, waiting) {
    const [main, sub] = waiting ? ['', ''] : this._valueParts(item.value, item.share, formats);
    value._main.textContent = main;
    value._sub.textContent = sub;
  }

  _drawStacked(copy, formats) {
    const data = this.data;
    const raw = data && typeof data === 'object' && !Array.isArray(data) ? data : {};
    const { colours } = this._series();
    const cap = Math.max(2, parseInt(this.getAttribute('max-items'), 10) || DEFAULT_CAP.stacked);
    let series = (Array.isArray(raw.series) ? raw.series : []).map((name, index) => ({ key: `series${index}`, label: String(name), colour: colours[index % colours.length] }));
    let rows = (Array.isArray(raw.rows) ? raw.rows : []).filter(row => row && row.label != null).map(row => ({
      label: String(row.label), values: series.map((_, index) => toNumber((row.values || [])[index])),
    }));
    if (series.length > cap) {
      const kept = series.slice(0, cap - 1);
      series = [...kept, { key: OTHER_KEY, label: copy.other, colour: NEUTRAL, isOther: true }];
      rows = rows.map(row => ({ label: row.label, values: [...row.values.slice(0, cap - 1), row.values.slice(cap - 1).reduce((sum, value) => sum + value, 0)] }));
    }
    const total = rows.reduce((sum, row) => sum + row.values.reduce((rowSum, value) => rowSum + value, 0), 0);
    const waiting = total === 0;
    const list = this._container('stack-rows');
    const seenLabels = new Map();
    const nodes = (rows.length ? rows : [{ label: '\u00a0', values: [] }, { label: '\u00a0', values: [] }]).map((row, rowIndex) => {
      const repeat = seenLabels.get(row.label) || 0;
      seenLabels.set(row.label, repeat + 1);
      const rowTotal = row.values.reduce((sum, value) => sum + value, 0);
      const shares = roundedShares(row.values);
      const [node] = this._keyed(`${row.label}\u0000${repeat}`, () => {
        const element = create('div', 'stack-row');
        element._label = create('div', 'stack-label clip', element);
        element._bar = create('div', 'stack-bar', element);
        element._values = create('div', 'stack-values', element);
        element._segments = new Map();
        return element;
      });
      node._label.textContent = row.label;
      let offset = 0;
      const liveSegments = new Set();
      series.forEach((entry, index) => {
        let segment = node._segments.get(entry.key);
        const isNew = !segment;
        if (isNew) {
          segment = create('div', 'stack-segment mark', node._bar);
          segment._value = create('span', 'stack-value', node._values);
          node._segments.set(entry.key, segment);
        }
        liveSegments.add(entry.key);
        const value = row.values[index] || 0;
        const fraction = rowTotal ? value / rowTotal : 0;
        const share = shares[index] || 0;
        segment.style.setProperty('--_c', entry.colour);
        segment.style.setProperty('--_i', String(rowIndex));
        segment.dataset.key = entry.key;
        segment._payload = { label: `${row.label} · ${entry.label}`, value, share };
        this._grow(segment, 'width', `${(fraction * 100).toFixed(2)}%`, isNew);
        segment._value.textContent = this._compactValue(value, share, formats);
        segment._value.style.left = `${((offset + fraction / 2) * 100).toFixed(2)}%`;
        segment._value.classList.toggle('is-hidden', fraction < 0.06);
        node._bar.appendChild(segment);
        offset += fraction;
      });
      for (const [key, segment] of node._segments) {
        if (!liveSegments.has(key)) { segment._value.remove(); segment.remove(); node._segments.delete(key); }
      }
      return node;
    });
    this._sweep();
    this._reorderAnimated(list, nodes);
    return { waiting, total, series, rows, legendItems: series };
  }

  _drawDonut(model, copy, formats) {
    let stage = this._plot.querySelector(':scope > .donut');
    if (!stage) {
      stage = create('div', 'donut');
      this._plot.insertBefore(stage, this._waiting);
      stage._svg = createSvg('svg', null, stage); // ds-lint-allow: svg (chart geometry drawn from data, not an icon glyph)
      stage._track = createSvg('circle', 'donut-track', stage._svg);
      stage._arcs = createSvg('g', null, stage._svg);
      stage._leaders = createSvg('g', null, stage._svg);
      stage._centre = create('div', 'donut-centre', stage);
      stage._total = create('div', 'donut-total', stage._centre);
      stage._sub = create('div', 'donut-sub', stage._centre);
      stage._labels = create('div', null, stage);
    }
    this._donut = stage;
    this._donutModel = model;
    const units = copy.responsesUnit || {};
    stage._total.textContent = model.waiting ? '' : formats.count.format(model.total);
    stage._sub.textContent = model.waiting ? copy.waiting
      : this.hasAttribute('responses') ? this._responsesText(model.total, copy, formats)
      : (units[formats.plural.select(model.total)] || units.other || '');
    this._layoutDonut();
  }

  _layoutDonut() {
    const stage = this._donut, data = this._donutModel;
    if (!stage || !stage.isConnected || !data) return;
    const width = Math.max(200, this._plot.clientWidth || 600);
    const formats = this._formatters();
    const labelWidth = Math.min(DONUT_LABEL_WIDTH, Math.floor(width / 2 - 140));
    const callouts = labelWidth >= DONUT_LABEL_MIN_WIDTH && !data.waiting;
    const calloutsChanged = this._donutCallouts !== undefined && this._donutCallouts !== callouts;
    this._donutCallouts = callouts;
    if (calloutsChanged && this._model === data) this._syncLegend(data, formats);
    const height = callouts ? Math.round(Math.min(360, Math.max(240, width * 0.5))) : Math.round(Math.min(320, width * 0.8));
    const outer = callouts ? Math.min(height / 2 - 12, width / 2 - labelWidth - 40) : Math.min(height / 2 - 8, 150);
    const thickness = outer * 0.38;
    const radius = outer - thickness / 2;
    const circumference = 2 * Math.PI * radius;
    const centreX = width / 2, centreY = height / 2;
    stage.style.width = `${width}px`;
    stage.style.height = `${height}px`;
    stage._svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    stage._svg.setAttribute('width', String(width));
    stage._svg.setAttribute('height', String(height));
    stage._track.setAttribute('cx', String(centreX)); stage._track.setAttribute('cy', String(centreY));
    stage._track.setAttribute('r', String(radius)); stage._track.setAttribute('stroke-width', String(thickness));
    stage._track.style.opacity = data.waiting ? '1' : '0';
    Object.assign(stage._centre.style, { left: `${centreX - outer + thickness}px`, top: `${centreY - outer + thickness}px`, width: `${2 * (outer - thickness)}px`, height: `${2 * (outer - thickness)}px` });

    let start = 0;
    const placed = [];
    data.items.forEach((item, index) => {
      const [arc, isNew] = this._keyed(item.key, () => {
        const node = createSvg('circle', 'donut-arc mark', stage._arcs);
        node._label = create('div', 'donut-label mark', stage._labels);
        node._value = this._valueNode(node._label);
        node._name = create('div', 'clip', node._label);
        node._leader = createSvg('polyline', 'donut-leader', stage._leaders);
        const remove = node.remove.bind(node);
        node.remove = () => { node._label.remove(); node._leader.remove(); remove(); };
        return node;
      });
      arc.dataset.key = item.key;
      arc.style.setProperty('--_c', item.colour);
      arc.classList.toggle('is-dim', !!item.dim);
      arc._label.classList.toggle('is-dim', !!item.dim);
      arc.setAttribute('cx', String(centreX)); arc.setAttribute('cy', String(centreY));
      arc.setAttribute('r', String(radius)); arc.setAttribute('stroke-width', String(thickness));
      arc.setAttribute('transform', `rotate(-90 ${centreX} ${centreY})`);
      const fraction = data.total ? item.value / data.total : 0;
      const length = fraction * circumference;
      if (isNew && !reducedMotion()) {
        arc.style.strokeDasharray = `0 ${circumference}`;
        arc.style.strokeDashoffset = String(-start * circumference);
      }
      const offset = -start * circumference;
      const dash = `${length} ${circumference}`;
      if (isNew && !reducedMotion()) requestAnimationFrame(() => requestAnimationFrame(() => { arc.style.strokeDasharray = dash; arc.style.strokeDashoffset = String(offset); }));
      else { arc.style.strokeDasharray = dash; arc.style.strokeDashoffset = String(offset); }
      const middle = (start + fraction / 2) * 2 * Math.PI;
      start += fraction;
      arc._label.hidden = !callouts || fraction === 0;
      arc._leader.style.display = arc._label.hidden ? 'none' : '';
      arc._value._main.textContent = this._compactValue(item.value, item.share, formats);
      arc._name.textContent = item.label;
      if (!arc._label.hidden) placed.push({ arc, middle, index, isRight: Math.sin(middle) >= 0 });
    });
    this._sweep();
    if (!callouts) return;
    for (const isRight of [true, false]) {
      const side = placed.filter(entry => entry.isRight === isRight)
        .map(entry => ({ ...entry, y: centreY - (outer + 16) * Math.cos(entry.middle) }))
        .sort((a, b) => a.y - b.y);
      for (let index = 1; index < side.length; index++) side[index].y = Math.max(side[index].y, side[index - 1].y + DONUT_LABEL_SPACING);
      const overflow = side.length ? side[side.length - 1].y - (height - 20) : 0;
      if (overflow > 0) for (const entry of side) entry.y -= overflow;
      for (let index = side.length - 2; index >= 0; index--) side[index].y = Math.min(side[index].y, side[index + 1].y - DONUT_LABEL_SPACING);
      for (const entry of side) {
        const labelX = isRight ? centreX + outer + 24 : centreX - outer - 24 - labelWidth;
        Object.assign(entry.arc._label.style, { left: `${labelX}px`, top: `${entry.y}px`, width: `${labelWidth}px` });
        entry.arc._label.classList.toggle('is-left', !isRight);
        const anchorX = centreX + (outer + 2) * Math.sin(entry.middle), anchorY = centreY - (outer + 2) * Math.cos(entry.middle);
        const elbowX = isRight ? labelX - 8 : labelX + labelWidth + 8;
        entry.arc._leader.setAttribute('points', `${anchorX},${anchorY} ${elbowX - (isRight ? 10 : -10)},${entry.y} ${elbowX},${entry.y}`);
      }
    }
  }

  _drawWordcloud(model) {
    let cloud = this._plot.querySelector(':scope > .cloud');
    if (!cloud) { cloud = create('div', 'cloud'); this._plot.insertBefore(cloud, this._waiting); }
    this._cloud = cloud;
    this._cloudWaiting = model.waiting;
    const words = model.items;
    const values = words.map(item => item.value);
    const minimum = Math.min(...values), maximum = Math.max(...values);
    words.forEach((item, index) => {
      const [word] = this._keyed(item.key, () => { const node = create('span', 'word mark is-measuring', cloud); node._fresh = true; return node; });
      word.dataset.key = item.key;
      word.textContent = item.label;
      word._weight = maximum > minimum ? (item.value - minimum) / (maximum - minimum) : 1;
      const quiet = words.length > 8 && item.rank > Math.ceil(words.length * 0.7);
      word.style.setProperty('--_c', quiet ? 'var(--_ink-2)' : item.colour);
      word.style.fontWeight = item.rank <= 3 ? '600' : '400';
      word._order = index;
    });
    this._sweep();
    this._layoutWordcloud();
  }

  _layoutWordcloud() {
    const cloud = this._cloud;
    if (!cloud || !cloud.isConnected) return;
    const width = Math.max(200, this._plot.clientWidth || 600);
    const height = this._cloudWaiting ? 160 : Math.round(Math.min(420, Math.max(220, width * 0.45)));
    cloud.style.height = `${height}px`;
    const words = [...cloud.children].filter(node => node.classList.contains('word'))
      .sort((a, b) => b._weight - a._weight || a._order - b._order);
    const largest = Math.max(28, Math.min(72, width / 9));
    for (let scale = 1, attempt = 0; attempt < 6; attempt++, scale *= 0.86) {
      for (const word of words) word.style.fontSize = `${Math.round(WORDCLOUD_MIN_FONT + (largest * scale - WORDCLOUD_MIN_FONT) * Math.sqrt(word._weight))}px`;
      const boxes = [];
      let dropped = 0;
      for (const word of words) {
        const box = this._placeWord(word.offsetWidth + WORDCLOUD_PADDING, word.offsetHeight + WORDCLOUD_PADDING, width, height, boxes);
        word._box = box;
        if (box) boxes.push(box); else dropped++;
      }
      if (dropped <= Math.floor(words.length * 0.1) || attempt === 5) break;
    }
    for (const word of words) {
      const wasMeasuring = word.classList.contains('is-measuring');
      word.classList.toggle('is-dropped', !word._box);
      if (!word._box) continue;
      const transform = `translate(${Math.round(word._box.x + WORDCLOUD_PADDING / 2)}px, ${Math.round(word._box.y + WORDCLOUD_PADDING / 2)}px)`;
      if (wasMeasuring) { word.style.transitionProperty = 'none'; word.style.transform = transform; void word.offsetWidth; word.style.transitionProperty = ''; }
      else word.style.transform = transform;
      word.classList.remove('is-measuring');
    }
  }

  _placeWord(boxWidth, boxHeight, width, height, boxes) {
    if (boxWidth > width || boxHeight > height) return null;
    const centreX = width / 2, centreY = height / 2, stretch = width / height;
    for (let step = 0; step < 1800; step++) {
      const angle = step * 0.35, distance = step * 0.9;
      const x = Math.round(centreX + distance * Math.cos(angle) * Math.min(stretch, 2.2) / 1.4 - boxWidth / 2);
      const y = Math.round(centreY + distance * Math.sin(angle) / 1.4 - boxHeight / 2);
      if (x < 0 || y < 0 || x + boxWidth > width || y + boxHeight > height) continue;
      const box = { x, y, w: boxWidth, h: boxHeight };
      if (!boxes.some(other => x < other.x + other.w && other.x < x + boxWidth && y < other.y + other.h && other.y < y + boxHeight)) return box;
    }
    return null;
  }

  _drawMindmap(copy) {
    const data = this.data;
    const raw = data && typeof data === 'object' && !Array.isArray(data) ? data : { label: '' };
    const { colours, tints } = this._series();
    let map = this._plot.querySelector(':scope > .mindmap');
    if (!map) {
      map = create('div', 'mindmap');
      this._plot.insertBefore(map, this._waiting);
      map._stage = create('div', 'mindmap-stage', map);
      map._links = createSvg('svg', 'mindmap-links', map._stage); // ds-lint-allow: svg (connector geometry drawn from data, not an icon glyph)
    }
    this._map = map;
    let ideas = 0;
    const walk = (node, depth, path, branch) => {
      const label = String(node.label ?? '');
      const [element] = this._keyed(`node:${path}`, () => create('div', 'node mark', map._stage));
      element.className = `node mark ${depth === 1 ? 'node-1' : depth === 2 ? 'node-2' : depth === 3 ? 'node-3' : 'node-deep'}`;
      element.textContent = label;
      element.dataset.key = `node:${path}`;
      element._payload = { label };
      if (branch != null) {
        element.style.setProperty('--_c', colours[branch % colours.length]);
        element.style.setProperty('--_tint', tints[branch % tints.length]);
      }
      const children = (Array.isArray(node.children) ? node.children : []).filter(child => child && child.label != null);
      if (depth > 1) ideas++;
      return {
        element, depth, branch,
        children: children.map((child, index) => walk(child, depth + 1, `${path}/${index}`, depth === 1 ? index : branch)),
      };
    };
    const tree = walk(raw, 1, '0', null);
    this._sweep();
    this._mindTree = tree;
    this._layoutMindmap();
    return { waiting: tree.children.length === 0, tree, ideas, branches: tree.children.length, rootLabel: String(raw.label ?? ''), items: [] };
  }

  _layoutMindmap() {
    const map = this._map, tree = this._mindTree;
    if (!map || !map.isConnected || !tree) return;
    const { colours } = this._series();
    map._stage.style.width = '4000px';
    const measure = node => { node.width = node.element.offsetWidth; node.height = node.element.offsetHeight; node.children.forEach(measure); };
    measure(tree);
    const spanOf = node => {
      const childSpan = node.children.reduce((sum, child) => sum + spanOf(child), 0) + Math.max(0, node.children.length - 1) * MINDMAP_ROW_GAP;
      node.span = Math.max(node.height, childSpan);
      return node.span;
    };
    tree.children.forEach(spanOf);
    const sides = { right: [], left: [] };
    const sideSpan = { right: 0, left: 0 };
    const oneSided = (this._plot.clientWidth || 0) < MINDMAP_ONE_SIDED_BELOW;
    for (const branch of tree.children) {
      const side = oneSided || sideSpan.right <= sideSpan.left ? 'right' : 'left';
      sides[side].push(branch);
      sideSpan[side] += branch.span + MINDMAP_BRANCH_GAP;
    }
    const columnWidths = { right: [], left: [] };
    const collect = (node, side) => {
      const column = node.depth - 2;
      columnWidths[side][column] = Math.max(columnWidths[side][column] || 0, node.width);
      node.children.forEach(child => collect(child, side));
    };
    for (const side of ['right', 'left']) sides[side].forEach(branch => collect(branch, side));
    const sideWidth = side => columnWidths[side].reduce((sum, columnWidth) => sum + columnWidth + MINDMAP_COLUMN_GAP, 0);
    const leftWidth = sideWidth('left'), rightWidth = sideWidth('right');
    const totalHeight = Math.max(tree.height, sideSpan.right - MINDMAP_BRANCH_GAP, sideSpan.left - MINDMAP_BRANCH_GAP, 0);
    const totalWidth = leftWidth + tree.width + rightWidth;
    const rootX = leftWidth, rootY = totalHeight / 2 - tree.height / 2;
    const place = (node, x, y) => {
      node.x = x; node.y = y;
      const element = node.element, transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
      if (element._placed) { element.style.transform = transform; return; }
      element._placed = true;
      element.style.transitionProperty = 'none';
      element.style.transform = transform;
      void element.offsetWidth;
      element.style.transitionProperty = '';
    };
    place(tree, rootX, rootY);
    const layoutSide = (side) => {
      const direction = side === 'right' ? 1 : -1;
      const columnX = column => {
        let offset = 0;
        for (let index = 0; index < column; index++) offset += columnWidths[side][index] + MINDMAP_COLUMN_GAP;
        return side === 'right' ? rootX + tree.width + MINDMAP_COLUMN_GAP + offset : rootX - MINDMAP_COLUMN_GAP - offset;
      };
      const layoutNode = (node, top) => {
        const column = node.depth - 2;
        const x = direction > 0 ? columnX(column) : columnX(column) - node.width;
        let childTop = top + (node.span - (node.children.reduce((sum, child) => sum + child.span, 0) + Math.max(0, node.children.length - 1) * MINDMAP_ROW_GAP)) / 2;
        for (const child of node.children) { layoutNode(child, childTop); childTop += child.span + MINDMAP_ROW_GAP; }
        place(node, x, top + node.span / 2 - node.height / 2);
      };
      const used = sides[side].reduce((sum, branch) => sum + branch.span, 0) + Math.max(0, sides[side].length - 1) * MINDMAP_BRANCH_GAP;
      let top = (totalHeight - used) / 2;
      for (const branch of sides[side]) { layoutNode(branch, top); top += branch.span + MINDMAP_BRANCH_GAP; }
    };
    layoutSide('right');
    layoutSide('left');
    const links = [];
    const connect = (parent, isRightOf) => {
      for (const child of parent.children) {
        const right = isRightOf(child);
        const fromX = right ? parent.x + parent.width : parent.x, toX = right ? child.x : child.x + child.width;
        const fromY = parent.y + parent.height / 2, toY = child.y + child.height / 2;
        const bend = (toX - fromX) / 2;
        links.push({ key: child.element.dataset.key, d: `M${fromX},${fromY} C${fromX + bend},${fromY} ${toX - bend},${toY} ${toX},${toY}`, colour: colours[child.branch % colours.length] });
        connect(child, () => right);
      }
    };
    connect(tree, child => child.x >= tree.x);
    map._links.setAttribute('width', String(Math.max(1, totalWidth)));
    map._links.setAttribute('height', String(Math.max(1, totalHeight)));
    const existing = new Map([...map._links.children].map(path => [path.dataset.key, path]));
    for (const link of links) {
      const path = existing.get(link.key) || createSvg('path', 'mindmap-link', map._links);
      path.dataset.key = link.key;
      path.setAttribute('d', link.d);
      path.style.setProperty('--_c', link.colour);
      existing.delete(link.key);
    }
    for (const stale of existing.values()) stale.remove();
    const available = Math.max(200, this._plot.clientWidth || totalWidth);
    const scale = Math.max(MINDMAP_MIN_SCALE, Math.min(1, available / Math.max(1, totalWidth)));
    map._stage.style.width = `${totalWidth}px`;
    map._stage.style.height = `${totalHeight}px`;
    map._stage.style.transform = `translateX(${Math.max(0, (available - totalWidth * scale) / 2)}px) scale(${scale})`;
    map.style.height = `${Math.ceil(totalHeight * scale) + (tree.children.length ? 0 : 48)}px`;
    map.style.setProperty('--_map-width', `${Math.ceil(totalWidth * scale)}px`);
  }

  _layoutMeasured() {
    if (this._drawnType === 'donut') this._layoutDonut();
    else if (this._drawnType === 'wordcloud') this._layoutWordcloud();
    else if (this._drawnType === 'mindmap') this._layoutMindmap();
  }

  _syncLegend(model, formats) {
    const type = this._type;
    const setting = this.getAttribute('legend');
    const show = setting === 'on' || (setting !== 'off' && (type === 'stacked' || (type === 'donut' && this._donutCallouts === false && !model.waiting)));
    const entries = type === 'stacked' ? (model.legendItems || []) : type === 'mindmap' || type === 'wordcloud' ? [] : model.items;
    this._legend.hidden = !show || !entries.length;
    if (this._legend.hidden) return;
    this._legend.replaceChildren(...entries.map(entry => {
      const row = create('li');
      const swatch = create('span', 'swatch', row);
      swatch.style.setProperty('--_c', entry.colour);
      create('span', 'clip', row).textContent = entry.label;
      if (type !== 'stacked' && !model.waiting) create('span', 'legend-value', row).textContent = this._valueText(entry.value, entry.share, formats);
      return row;
    }));
  }

  _showTip(event) {
    if (this.getAttribute('tooltip') === 'off' || (this._model && this._model.waiting)) return this._hideTip();
    const target = event.composedPath().find(node => node && node.dataset && node.dataset.key);
    if (!target) return this._hideTip();
    const formats = this._formatters();
    let label, detail;
    if (target._payload) {
      label = target._payload.label;
      detail = target._payload.value != null ? this._valueText(target._payload.value, target._payload.share, formats) : '';
    } else {
      const item = (this._model && this._model.items || []).find(entry => entry.key === target.dataset.key);
      if (!item) return this._hideTip();
      label = item.label;
      detail = this._valueText(item.value, item.share, formats);
    }
    this._tip.replaceChildren();
    create('b', null, this._tip).textContent = label;
    if (detail) create('span', null, this._tip).textContent = detail;
    const bounds = this._root.getBoundingClientRect();
    const tipWidth = this._tip.offsetWidth, tipHeight = this._tip.offsetHeight;
    const x = Math.min(Math.max(0, event.clientX - bounds.left + 12), Math.max(0, bounds.width - tipWidth));
    const y = Math.max(0, event.clientY - bounds.top - tipHeight - 12);
    this._tip.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
    this._tip.classList.add('is-shown');
  }

  _hideTip() { if (this._tip) this._tip.classList.remove('is-shown'); }

  _describe(model, copy, formats) {
    const type = this._type;
    const typeName = copy.typeNames[type];
    let summary;
    if (model.waiting && type !== 'mindmap') summary = fill(copy.waitingSummary, { type: typeName });
    else if (type === 'stacked') summary = fill(copy.stackedSummary, { type: typeName, rows: formats.count.format(model.rows.length), series: formats.count.format(model.series.length) });
    else if (type === 'mindmap') summary = fill(copy.mindmapSummary, { type: typeName, label: model.rootLabel, branches: formats.count.format(model.branches), ideas: formats.count.format(model.ideas) });
    else {
      const leader = model.items.find(item => item.rank === 1);
      const isCloud = type === 'wordcloud';
      summary = fill(isCloud ? copy.wordcloudSummary : copy.summary, { type: typeName, items: formats.count.format(model.items.length), responses: this._responsesText(model.total, copy, formats) });
      if (leader) summary += ' ' + fill(isCloud ? copy.wordcloudLeader : copy.leader, { label: leader.label, value: isCloud ? formats.count.format(leader.value) : this._valueText(leader.value, leader.share, formats) });
    }
    this._summaryNode.textContent = summary;
    this._fillTable(model, copy, formats);
    if (this._hasDrawn && summary !== this._lastSummary) this._announce(fill(copy.updated, { summary }));
    this._hasDrawn = true;
    this._lastSummary = summary;
  }

  _fillTable(model, copy, formats) {
    const type = this._type;
    this._table.replaceChildren();
    this._outline.replaceChildren();
    this._table.hidden = type === 'mindmap';
    this._outline.hidden = type !== 'mindmap';
    if (type === 'mindmap') {
      const build = (node, list) => {
        const item = create('li', null, list);
        item.textContent = node.element.textContent;
        if (node.children.length) { const nested = create('ul', null, item); node.children.forEach(child => build(child, nested)); }
      };
      build(model.tree, this._outline);
      return;
    }
    create('caption', null, this._table).textContent = this.getAttribute('label') || copy.typeNames[type];
    const head = create('tr', null, create('thead', null, this._table));
    const body = create('tbody', null, this._table);
    const cell = (row, tag, text) => { const node = create(tag, null, row); node.textContent = text; if (tag === 'th') node.setAttribute('scope', row.parentNode.tagName === 'THEAD' ? 'col' : 'row'); return node; };
    if (type === 'stacked') {
      cell(head, 'th', copy.item);
      model.series.forEach(entry => cell(head, 'th', entry.label));
      for (const row of model.rows) {
        const line = create('tr', null, body);
        const shares = roundedShares(row.values);
        cell(line, 'th', row.label);
        row.values.forEach((value, index) => cell(line, 'td', this._valueText(value, shares[index], formats)));
      }
      return;
    }
    const isCloud = type === 'wordcloud';
    cell(head, 'th', isCloud ? copy.word : copy.item);
    cell(head, 'th', copy.count);
    if (!isCloud) cell(head, 'th', copy.share);
    for (const item of model.items) {
      const line = create('tr', null, body);
      cell(line, 'th', item.label);
      cell(line, 'td', formats.count.format(item.value));
      if (!isCloud) cell(line, 'td', formats.percent.format(item.share));
    }
  }

  _announce(text) {
    this._pendingAnnouncement = text;
    if (this._announceTimer) return;
    this._announceTimer = setTimeout(() => {
      this._announceTimer = null;
      if (this._live && this._live.announce) this._live.announce(this._pendingAnnouncement);
    }, ANNOUNCE_THROTTLE_MS);
  }
}

export function defineAhaChart(tag = 'aha-chart') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaChart);
  return true;
}
if (typeof window !== 'undefined') defineAhaChart();

export default { AhaChart, defineAhaChart, chartStrings, readableInkOn };
