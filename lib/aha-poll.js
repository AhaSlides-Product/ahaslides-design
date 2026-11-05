/**
 * @ahaslides-product/design/aha-poll — a poll or vote block for forum posts and web pages.
 *
 *   import '@ahaslides-product/design/aha-poll';   // registers <aha-poll> (+ radio, checkbox, button, progressbar)
 *   <aha-poll poll-title="Which slide type do you use most?"
 *     options='[{"id":"a","label":"Word cloud"},{"id":"b","label":"Spinner wheel"}]'
 *     counts='{"a":12,"b":5}' voters="17" results="on-vote"></aha-poll>
 *
 * Options are <aha-radio> rows (selection-mode="single") or <aha-checkbox> rows ("multiple"), the
 * submit is an <aha-button>, and each result is an <aha-progressbar> under the option label with its
 * percent and vote count. The voter count and status sit in one 14px tertiary line.
 * `vote` fires with the picked ids; the host saves the vote, then sets `voted`, `counts` and `voters`.
 * Rows are rebuilt only when `options` or `selection-mode` changes; counts, value and view changes
 * update persistent nodes, so the result bars animate.
 */
import './icons.js';
import './aha-radio.js';
import './aha-checkbox.js';
import './aha-button.js';
import './aha-progressbar.js';

const STYLE = `
  :host{ display:block; font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif) }
  :host([hidden]), [hidden]{ display:none !important }
  .poll{ box-sizing:border-box; display:flex; flex-direction:column; gap:var(--aha-space-16,16px);
    padding:var(--aha-space-16,16px); border:1px solid var(--aha-border-default,#E3E3E3);
    border-radius:var(--aha-radius-default,8px); background:var(--aha-bg-container,#FFFFFF);
    color:var(--aha-text-default,#1A1A1A) }
  .title{ margin:0; font-size:var(--aha-size-l,16px); line-height:var(--aha-line-height-body,1.5);
    font-weight:var(--aha-weight-semibold,600); overflow-wrap:anywhere }
  .options, .results{ display:flex; flex-direction:column; gap:var(--aha-space-12,12px); margin:0; padding:0; list-style:none }
  .options > *{ display:flex; min-height:24px; align-items:center }
  .result{ display:flex; flex-direction:column; gap:var(--aha-space-4,4px) }
  .result-head{ display:flex; align-items:baseline; justify-content:space-between; gap:var(--aha-space-12,12px);
    font-size:var(--aha-size-default,14px); line-height:var(--aha-line-height-body,1.5) }
  .result-label{ display:inline-flex; align-items:center; gap:var(--aha-space-4,4px); min-width:0;
    overflow-wrap:anywhere; font-weight:var(--aha-weight-regular,400) }
  .result--mine .result-label{ font-weight:var(--aha-weight-semibold,600) }
  .mine{ flex:none; color:var(--aha-icon-default,#4A4A4A) }
  .figures{ display:inline-flex; gap:var(--aha-space-8,8px); flex:none; white-space:nowrap }
  .pct{ font-weight:var(--aha-weight-semibold,600); color:var(--aha-text-default,#1A1A1A) }
  .count{ color:var(--aha-text-tertiary,#616161) }
  .info{ display:flex; flex-wrap:wrap; align-items:center; gap:var(--aha-space-4,4px) var(--aha-space-16,16px); margin:0;
    font-size:var(--aha-size-default,14px); line-height:var(--aha-line-height-body,1.5);
    font-weight:var(--aha-weight-regular,400); color:var(--aha-text-tertiary,#616161) }
  .status{ display:inline-flex; align-items:center; gap:var(--aha-space-4,4px) }
  .actions{ display:flex; flex-wrap:wrap; gap:var(--aha-space-8,8px) }
`;

const parseJson = (text, fallback) => {
  if (!text) return fallback;
  try { return JSON.parse(text); } catch { return fallback; }
};

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

let uid = 0;

export class AhaPoll extends HTMLElement {
  static get observedAttributes() {
    return ['poll-title', 'options', 'counts', 'voters', 'value', 'selection-mode', 'status', 'results', 'voted'];
  }

  constructor() {
    super();
    this._name = `aha-poll-${++uid}`;
    this._picked = null;
    this._flip = false;
  }

  get options() {
    const list = parseJson(this.getAttribute('options'), []);
    return Array.isArray(list) ? list.filter((o) => o && o.id != null).map((o) => ({ id: String(o.id), label: String(o.label ?? o.id) })) : [];
  }
  set options(v) { this.setAttribute('options', JSON.stringify(v)); }

  get counts() {
    const map = parseJson(this.getAttribute('counts'), {});
    return map && typeof map === 'object' ? map : {};
  }
  set counts(v) { this.setAttribute('counts', JSON.stringify(v)); }

  get value() {
    if (this._picked) return [...this._picked];
    const raw = this.getAttribute('value');
    if (raw == null || raw === '') return [];
    const parsed = parseJson(raw, raw);
    return (Array.isArray(parsed) ? parsed : [parsed]).map(String);
  }
  set value(v) { this._picked = null; this.setAttribute('value', JSON.stringify(Array.isArray(v) ? v : [v])); }

  get multiple() { return this.getAttribute('selection-mode') === 'multiple'; }
  get closed() { return this.getAttribute('status') === 'closed'; }
  get voted() { return this.hasAttribute('voted'); }

  connectedCallback() {
    if (!this.shadowRoot) this._build();
    this._sync();
  }

  attributeChangedCallback(name) {
    if (name === 'value') this._picked = null;
    if (name === 'voted') this._flip = false;
    if (this._poll) this._sync();
  }

  _build() {
    const root = this.attachShadow({ mode: 'open' });
    root.innerHTML = `<style>${STYLE}</style>
      <section class="poll" part="poll">
        <p class="title" part="title"></p>
        <div class="options" part="options"></div>
        <ul class="results" part="results"></ul>
        <p class="info" part="info">
          <span class="voters"></span>
          <span class="status"><aha-icon class="lock" name="system-lock" size="16" decorative></aha-icon><span class="status-text"></span></span>
        </p>
        <div class="actions" part="actions">
          <aha-button class="cast" variant="primary">Vote</aha-button>
          <aha-button class="toggle" variant="tertiary"><aha-icon class="toggle-icon" slot="icon" name="system-chart-bar" size="16" decorative></aha-icon><span class="toggle-text"></span></aha-button>
        </div>
      </section>`;
    const $ = (s) => root.querySelector(s);
    this._poll = $('.poll');
    this._title = $('.title');
    this._optionsBox = $('.options');
    this._resultsBox = $('.results');
    this._voters = $('.voters');
    this._status = $('.status');
    this._lock = $('.lock');
    this._statusText = $('.status-text');
    this._cast = $('.cast');
    this._actions = $('.actions');
    this._toggle = $('.toggle');
    this._toggleIcon = $('.toggle-icon');
    this._toggleText = $('.toggle-text');
    this._rows = [];

    this._optionsBox.addEventListener('change', (e) => {
      e.stopPropagation();
      this._picked = this._rows.filter((r) => r.control.hasAttribute('checked')).map((r) => r.id);
      this._sync();
    });
    this._cast.addEventListener('click', () => {
      if (this._cast.hasAttribute('disabled')) return;
      this.dispatchEvent(new CustomEvent('vote', { bubbles: true, composed: true, detail: { values: this.value } }));
    });
    this._toggle.addEventListener('click', () => { this._flip = !this._flip; this._sync(); });
  }

  _buildRows(options) {
    const tag = this.multiple ? 'aha-checkbox' : 'aha-radio';
    this._rows = options.map(({ id, label }) => {
      const control = document.createElement(tag);
      if (tag === 'aha-radio') { control.setAttribute('name', this._name); control.setAttribute('value', id); }
      control.textContent = label;

      const result = document.createElement('li');
      result.className = 'result';
      result.innerHTML = `<div class="result-head"><span class="result-label"><span class="result-text"></span><aha-icon class="mine" name="system-check" size="16" label="Your vote"></aha-icon></span><span class="figures"><span class="pct"></span><span class="count"></span></span></div><aha-progressbar show-info="false" max="100"></aha-progressbar>`;
      result.querySelector('.result-text').textContent = label;
      result.querySelector('aha-progressbar').setAttribute('label', label);
      return { id, label, control, result, mine: result.querySelector('.mine'), pct: result.querySelector('.pct'),
        count: result.querySelector('.count'), bar: result.querySelector('aha-progressbar') };
    });
    this._optionsBox.replaceChildren(...this._rows.map((r) => r.control));
    this._resultsBox.replaceChildren(...this._rows.map((r) => r.result));
    this._optionsBox.setAttribute('role', this.multiple ? 'group' : 'radiogroup');
  }

  _sync() {
    const options = this.options;
    const key = `${this.multiple}|${JSON.stringify(options)}`;
    if (key !== this._rowsKey) { this._rowsKey = key; this._buildRows(options); }

    const title = this.getAttribute('poll-title') || '';
    this._title.textContent = title;
    this._title.hidden = !title;
    if (title) this._optionsBox.setAttribute('aria-label', title); else this._optionsBox.removeAttribute('aria-label');

    const counts = this.counts;
    const votes = (id) => Math.max(0, Number(counts[id]) || 0);
    const total = this._rows.reduce((sum, r) => sum + votes(r.id), 0);
    const votersAttr = (this.getAttribute('voters') || '').trim();
    const voters = votersAttr && Number.isFinite(Number(votersAttr)) ? Math.max(0, Number(votersAttr)) : total;
    const base = this.multiple ? voters : total;

    const picked = new Set(this.value);
    const closed = this.closed;
    const voted = this.voted;
    const mode = this.getAttribute('results') || 'always';
    const canSee = closed || (mode === 'always') || (mode === 'on-vote' && voted);
    const showResults = closed || (canSee && voted !== this._flip);

    for (const r of this._rows) {
      const on = picked.has(r.id);
      if (on) r.control.setAttribute('checked', ''); else r.control.removeAttribute('checked');
      if (closed) r.control.setAttribute('disabled', ''); else r.control.removeAttribute('disabled');

      const n = votes(r.id);
      const pct = base > 0 ? Math.round((n / base) * 100) : 0;
      r.pct.textContent = `${pct}%`;
      r.count.textContent = plural(n, 'vote', 'votes');
      r.bar.setAttribute('value', String(pct));
      r.bar.setAttribute('value-text', `${pct}%, ${plural(n, 'vote', 'votes')}`);
      const mine = voted && on;
      r.result.classList.toggle('result--mine', mine);
      r.mine.hidden = !mine;
    }

    this._optionsBox.hidden = showResults;
    this._resultsBox.hidden = !showResults;

    this._voters.textContent = plural(voters, 'voter', 'voters');
    let status = '';
    if (closed) status = 'Poll closed';
    else if (!showResults && mode === 'on-vote' && !voted) status = 'Results show after you vote';
    else if (!showResults && mode === 'on-close') status = 'Results show when the poll closes';
    this._statusText.textContent = status;
    this._status.hidden = !status;
    this._lock.hidden = !closed;

    this._cast.hidden = closed || showResults;
    if (picked.size === 0) this._cast.setAttribute('disabled', ''); else this._cast.removeAttribute('disabled');

    this._toggle.hidden = closed || !canSee;
    this._actions.hidden = this._cast.hidden && this._toggle.hidden;
    this._toggleText.textContent = showResults ? (voted ? 'Change vote' : 'Hide results') : 'Show results';
    // ::slotted([slot=icon]) sets display, which beats [hidden], so the glyph leaves the button instead.
    if (showResults) this._toggleIcon.remove();
    else if (!this._toggleIcon.isConnected) this._toggle.prepend(this._toggleIcon);
  }
}

export function defineAhaPoll(tag = 'aha-poll') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaPoll);
  return true;
}
if (typeof window !== 'undefined') defineAhaPoll();

export default { AhaPoll, defineAhaPoll };
