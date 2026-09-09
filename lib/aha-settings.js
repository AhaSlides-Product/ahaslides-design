/**
 * @ahaslides-product/design/aha-settings — the shared Settings surface.
 *
 *   import '@ahaslides-product/design/aha-settings';   // registers <aha-settings>
 *   const el = document.querySelector('aha-settings');
 *   el.schema = [
 *     { type: 'switch',   id: 'progressBar', label: 'Progress bar', default: true },
 *     { type: 'header',   content: 'Scoring' },
 *     { type: 'select',   id: 'mode', label: 'Scoring mode',
 *       options: [{value:'standard',label:'Standard'},{value:'speed',label:'Faster = more'}], default: 'standard' },
 *     { type: 'range',    id: 'points', label: 'Points per question', min: 0, max: 100, step: 10, unit: 'pts', default: 50 },
 *     { type: 'checkbox', id: 'partial', label: 'Partial scoring', dependsOn: 'mode', dependsValue: 'standard' },
 *     { type: 'action',   id: 'reset', label: 'Reset all responses',
 *       help: 'Permanently clears every collected response.', danger: true, action: 'Reset' },
 *   ];
 *   el.addEventListener('change', e => console.log(e.detail.id, e.detail.value, e.detail.values));
 *
 * You declare a SCHEMA of typed inputs (Shopify-style); the component RENDERS the compliant
 * AhaSlides settings panel — spacing hierarchy, group headers, sub-settings, help-vs-tooltip,
 * inline-vs-stacked placement, and the danger zone are BAKED IN. An agent picks the input type
 * and writes the copy; it cannot get the layout rules wrong because it never touches them.
 *
 * ONE element, shadow-DOM CSS, themed only by --aha-* tokens. Zero dependencies (no Lit).
 * Emits a composed `change` CustomEvent<{id, value, values}>.
 *
 * Schema item shapes:
 *   structure  { type:'header', content }            group header (opens a group)
 *              { type:'paragraph', content }          informational text
 *   input      common: { id, label, info?, help?, default?, dependsOn?, dependsValue?, danger? }
 *     switch     immediate boolean (toggle)          — takes effect at once
 *     checkbox   grouped boolean (saved together)
 *     radio      { options:[{value,label}] }         one of a mutually-exclusive set
 *     select     { options:[{value,label}] }         segmented (2–4 short) | dropdown (5+ / long)
 *     range      { min, max, step?, unit? }          slider + number
 *     number     { min?, max?, step?, unit? }        numeric field (+ unit suffix)
 *     text       { placeholder? }                    single-line input
 *     textarea   { placeholder?, rows? }             multi-line input
 *     color      —                                   colour picker
 *     text_alignment —                               segmented left/center/right
 *     action     { action?, danger? }                a button (danger → destructive, needs confirm upstream)
 */

/* The DS spacing hierarchy — baked, monotonic, NEVER dividers or containers (settings §5). */
const SP = { nameHelp: 4, subParent: 8, subIndent: 24, betweenSettings: 16, betweenGroups: 32, dangerZone: 48 };

const STYLE = `
  :host{ display:block; font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif);
    color:var(--aha-text-default,#1A1A1A); background:var(--aha-bg-container,#fff); box-sizing:border-box }
  :host *,:host *::before,:host *::after{ box-sizing:border-box }
  .panel{ display:flex; flex-direction:column }
  /* groups are separated by whitespace only — never a divider or a card (settings §5) */
  .group{ display:flex; flex-direction:column; gap:${SP.betweenSettings}px }
  .group + .group{ margin-top:${SP.betweenGroups}px }
  .group.danger{ margin-top:${SP.dangerZone}px }
  /* only the group header is bold; member labels are regular weight (settings §5) */
  .ghead{ font-size:14px; line-height:20px; font-weight:600; color:var(--aha-text-default,#1A1A1A) }
  .para{ font-size:13px; line-height:1.6; color:var(--aha-text-secondary,#4A4A4A); margin:0 }

  .set{ display:flex; flex-direction:column; gap:${SP.nameHelp}px }
  .set-row{ display:flex; align-items:center; justify-content:space-between; gap:16px }   /* inline: label left, control right */
  .set-stack{ display:flex; flex-direction:column; gap:8px }                               /* wide control drops below */
  /* dependent sub-setting: indented + tighter gap to parent + de-emphasised (settings §5) */
  .set.sub{ margin-left:${SP.subIndent}px; margin-top:calc(${SP.subParent}px - ${SP.betweenSettings}px) }
  .set.sub .lbl{ color:var(--aha-text-secondary,#4A4A4A); font-weight:400 }
  .set[hidden]{ display:none }

  .head{ display:flex; align-items:center; gap:4px; min-width:0 }
  .lbl{ font-size:14px; line-height:21px; font-weight:400; color:var(--aha-text-default,#1A1A1A) }
  /* help text: a must-see consequence line — tertiary colour, below the name (settings §3) */
  .help{ font-size:12px; line-height:1.5; color:var(--aha-text-tertiary,#8A8A8A) }

  /* the ? help glyph — a question mark, never an info circle (settings §4) */
  .q{ position:relative; flex:0 0 auto; width:15px; height:15px; border-radius:50%;
    border:1px solid var(--aha-border-strong,#D4D4D4); color:var(--aha-text-tertiary,#8A8A8A);
    font-size:10px; line-height:13px; text-align:center; cursor:help; user-select:none }
  .q::after{ content:attr(data-tip); position:absolute; left:50%; bottom:calc(100% + 7px); transform:translateX(-50%);
    min-width:120px; max-width:240px; width:max-content; padding:7px 10px; border-radius:6px;
    background:var(--aha-bg-dark,#1A1A2E); color:var(--aha-text-inverse,#fff); font-size:12px; line-height:1.45;
    font-weight:400; text-align:left; white-space:normal; opacity:0; pointer-events:none; transition:opacity .1s; z-index:5 }
  .q::before{ content:""; position:absolute; left:50%; bottom:calc(100% + 2px); transform:translateX(-50%);
    border:5px solid transparent; border-top-color:var(--aha-bg-dark,#1A1A2E); opacity:0; transition:opacity .1s; z-index:5 }
  .q:hover::after,.q:focus::after,.q:hover::before,.q:focus::before{ opacity:1 }

  /* toggle / switch */
  .tgl{ position:relative; flex:0 0 auto; width:36px; height:20px; border-radius:999px;
    background:var(--aha-gray-50,#D4D4D4); border:none; cursor:pointer; padding:0; transition:background .12s }
  .tgl[aria-checked="true"]{ background:var(--aha-color-primary,#6A1EBB) }
  .tgl .knob{ position:absolute; top:2px; left:2px; width:16px; height:16px; border-radius:50%;
    background:var(--aha-text-inverse,#fff); transition:left .12s }
  .tgl[aria-checked="true"] .knob{ left:18px }
  .tgl:focus-visible{ outline:2px solid var(--aha-color-primary,#6A1EBB); outline-offset:2px }

  /* checkbox box */
  .cbx{ position:relative; flex:0 0 auto; width:14px; height:14px; border:1px solid var(--aha-checkbox-border,#D4D4D4);
    border-radius:4px; background:var(--aha-bg-container,#fff); cursor:pointer; padding:0 }
  .cbx[aria-checked="true"]{ background:var(--aha-color-primary,#6A1EBB); border-color:var(--aha-color-primary,#6A1EBB) }
  .cbx svg{ position:absolute; inset:0; margin:auto; width:12px; height:12px }
  .cbx:focus-visible{ outline:2px solid var(--aha-color-primary,#6A1EBB); outline-offset:2px }

  /* radio group */
  .radios{ display:flex; flex-direction:column; gap:8px }
  .radio{ display:inline-flex; align-items:center; gap:8px; cursor:pointer; font-size:14px }
  .dot{ flex:0 0 auto; width:16px; height:16px; border-radius:50%; border:1px solid var(--aha-checkbox-border,#D4D4D4); position:relative }
  .radio[aria-checked="true"] .dot{ border-color:var(--aha-color-primary,#6A1EBB) }
  .radio[aria-checked="true"] .dot::after{ content:""; position:absolute; inset:0; margin:auto; width:8px; height:8px;
    border-radius:50%; background:var(--aha-color-primary,#6A1EBB) }

  /* segmented control (short selects + text_alignment) */
  .seg{ display:inline-flex; background:var(--aha-bg-container-secondary,#F7F7F7); border-radius:8px; padding:2px; gap:2px }
  .seg button{ border:none; background:transparent; font-family:inherit; font-size:13px; color:var(--aha-text-secondary,#4A4A4A);
    padding:5px 12px; border-radius:6px; cursor:pointer; line-height:18px }
  .seg button[aria-pressed="true"]{ background:var(--aha-bg-container,#fff); color:var(--aha-text-default,#1A1A1A);
    box-shadow:0 1px 2px rgba(0,0,0,.06) }

  /* fields: select dropdown, text, textarea, number, range, color */
  select,input[type="text"],input[type="number"],textarea{ font-family:inherit; font-size:14px; color:var(--aha-text-default,#1A1A1A);
    background:var(--aha-bg-container,#fff); border:1px solid var(--aha-border,#E3E3E3); border-radius:8px; padding:7px 11px; outline:none }
  select:focus,input:focus,textarea:focus{ border-color:var(--aha-color-primary,#6A1EBB);
    box-shadow:0 0 0 3px var(--aha-focus-ring-soft,#EDE0FF) }
  select{ min-width:140px; height:32px }
  .num{ display:inline-flex; align-items:center; gap:6px }
  .num input{ width:72px; text-align:left }
  .num .unit{ font-size:13px; color:var(--aha-text-tertiary,#8A8A8A) }
  textarea{ width:100%; resize:vertical; min-height:64px; line-height:1.5 }
  input[type="text"]{ width:100% }
  .rng{ display:flex; align-items:center; gap:12px }
  .rng input[type="range"]{ flex:1 1 auto; accent-color:var(--aha-color-primary,#6A1EBB) }
  .rng .val{ flex:0 0 auto; font-size:13px; color:var(--aha-text-secondary,#4A4A4A); min-width:48px; text-align:right }
  input[type="color"]{ width:40px; height:28px; padding:2px; border-radius:6px; border:1px solid var(--aha-border,#E3E3E3); background:var(--aha-bg-container,#fff); cursor:pointer }

  /* buttons (actions) */
  .btn{ font-family:inherit; font-size:14px; font-weight:600; border-radius:8px; padding:7px 16px; cursor:pointer;
    background:var(--aha-bg-container,#fff); color:var(--aha-text-default,#1A1A1A); border:1px solid var(--aha-border,#E3E3E3) }
  .btn.danger{ background:var(--aha-color-error,#F5222D); color:var(--aha-text-inverse,#fff); border-color:var(--aha-color-error,#F5222D) }
`;
const TICK = '<svg viewBox="0 0 12 12" fill="none"><path d="M2.5 6.3 4.7 8.5 9.5 3.7" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>'; // ds-lint-allow: hex (checkmark tick, white on the primary fill)
const ALIGN = [{ value: 'left', label: '⇤' }, { value: 'center', label: '↔' }, { value: 'right', label: '⇥' }];

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const isInput = (t) => !['header', 'paragraph'].includes(t);
// a short select (2–4 one-word options) renders as a segmented control; else a dropdown (settings §5 / SETTINGS-38)
const isSegmented = (it) => it.type === 'select' && Array.isArray(it.options) &&
  it.options.length >= 2 && it.options.length <= 4 && it.options.every(o => String(o.label).length <= 14);
// inline vs stacked: narrow controls share the label's row; wide controls drop below (SETTINGS-47)
const isStacked = (it) => it.type === 'textarea' || it.type === 'range' || it.type === 'radio' ||
  (it.type === 'select' && !isSegmented(it));

export class AhaSettings extends HTMLElement {
  set schema(v) { this._schema = Array.isArray(v) ? v : []; this._seedValues(); if (this.shadowRoot) this._render(); }
  get schema() { return this._schema || []; }
  get values() { return { ...(this._values || {}) }; }

  connectedCallback() {
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    if (!this._schema) {
      const src = this.querySelector('script[type="application/json"]');
      if (src) { try { this._schema = JSON.parse(src.textContent); } catch { this._schema = []; } }
    }
    this._schema = this._schema || [];
    this._seedValues();
    this._render();
  }

  _seedValues() {
    const v = {};
    for (const it of (this._schema || [])) {
      if (!isInput(it.type) || !it.id) continue;
      if ('default' in it) v[it.id] = it.default;
      else if (it.type === 'switch' || it.type === 'checkbox') v[it.id] = false;
      else if ((it.type === 'select' || it.type === 'radio') && it.options && it.options[0]) v[it.id] = it.options[0].value;
      else if (it.type === 'text_alignment') v[it.id] = 'left';
      else v[it.id] = it.type === 'range' || it.type === 'number' ? (it.min ?? 0) : '';
    }
    this._values = v;
  }

  // does a dependent's parent condition currently hold?
  _depOn(it) {
    if (!it.dependsOn) return true;
    const pv = this._values[it.dependsOn];
    return 'dependsValue' in it ? pv === it.dependsValue : !!pv;
  }

  _render() {
    // split into ordered groups; danger items are pulled into a trailing danger group (§7)
    const groups = [];
    let cur = { head: null, items: [] };
    const push = () => { if (cur.head || cur.items.length) groups.push(cur); };
    const danger = [];
    for (const it of this._schema) {
      if (it.type === 'header') { push(); cur = { head: it.content, items: [] }; continue; }
      if (isInput(it.type) && it.danger) { danger.push(it); continue; }
      cur.items.push(it);
    }
    push();

    const body = groups.map(g => this._group(g.head, g.items, false)).join('');
    const dangerHtml = danger.length ? this._group(null, danger, true) : '';
    this.shadowRoot.innerHTML = `<style>${STYLE}</style><div class="panel">${body}${dangerHtml}</div>`;
    this._wire();
  }

  _group(head, items, isDanger) {
    // render each top-level item; its dependents render right after it (nested), hidden when the parent is off
    const deps = {};
    for (const it of items) if (it.dependsOn) (deps[it.dependsOn] ||= []).push(it);
    const rows = [];
    for (const it of items) {
      if (it.dependsOn) continue; // rendered under its parent
      rows.push(this._item(it, false));
      for (const d of (deps[it.id] || [])) rows.push(this._item(d, true));
    }
    return `<div class="group${isDanger ? ' danger' : ''}">${head ? `<div class="ghead">${esc(head)}</div>` : ''}${rows.join('')}</div>`;
  }

  _item(it, sub) {
    if (it.type === 'paragraph') return `<p class="para">${esc(it.content)}</p>`;
    const hidden = sub && !this._depOn(it) ? ' hidden' : '';
    // help text ONLY when there is no ? tooltip — never both channels on one setting (SETTINGS-29)
    const info = it.info && !it.help ? `<span class="q" tabindex="0" data-tip="${esc(it.info)}">?</span>` : '';
    const help = it.help ? `<div class="help">${esc(it.help)}</div>` : '';
    const head = `<div class="head"><span class="lbl">${esc(it.label)}</span>${info}</div>`;
    const control = this._control(it);
    const layout = isStacked(it)
      ? `<div class="set-stack">${head}${control}</div>`
      : `<div class="set-row">${head}${control}</div>`;
    return `<div class="set${sub ? ' sub' : ''}"${hidden} data-id="${esc(it.id || '')}">${layout}${help}</div>`;
  }

  _control(it) {
    const v = this._values[it.id];
    const id = esc(it.id || '');
    switch (it.type) {
      case 'switch':
        return `<button class="tgl" role="switch" aria-checked="${!!v}" data-c="switch" data-id="${id}"><span class="knob"></span></button>`;
      case 'checkbox':
        return `<button class="cbx" role="checkbox" aria-checked="${!!v}" data-c="checkbox" data-id="${id}">${v ? TICK : ''}</button>`;
      case 'radio':
        return `<div class="radios" data-c="radio" data-id="${id}">` + (it.options || []).map(o =>
          `<span class="radio" role="radio" aria-checked="${v === o.value}" data-v="${esc(o.value)}"><span class="dot"></span>${esc(o.label)}</span>`).join('') + `</div>`;
      case 'select':
        if (isSegmented(it)) return this._seg(id, it.options, v);
        return `<select data-c="select" data-id="${id}">` + (it.options || []).map(o =>
          `<option value="${esc(o.value)}"${o.value === v ? ' selected' : ''}>${esc(o.label)}</option>`).join('') + `</select>`;
      case 'text_alignment':
        return this._seg(id, ALIGN, v || 'left');
      case 'range': {
        const unit = it.unit ? ` ${esc(it.unit)}` : '';
        return `<div class="rng"><input type="range" data-c="range" data-id="${id}" min="${it.min ?? 0}" max="${it.max ?? 100}" step="${it.step ?? 1}" value="${v ?? it.min ?? 0}"/><span class="val" data-val="${id}">${esc(v ?? it.min ?? 0)}${unit}</span></div>`;
      }
      case 'number':
        return `<span class="num"><input type="number" data-c="number" data-id="${id}"${it.min != null ? ` min="${it.min}"` : ''}${it.max != null ? ` max="${it.max}"` : ''} step="${it.step ?? 1}" value="${esc(v ?? '')}"/>${it.unit ? `<span class="unit">${esc(it.unit)}</span>` : ''}</span>`;
      case 'text':
        return `<input type="text" data-c="text" data-id="${id}" value="${esc(v ?? '')}"${it.placeholder ? ` placeholder="${esc(it.placeholder)}"` : ''}/>`;
      case 'textarea':
        return `<textarea data-c="text" data-id="${id}" rows="${it.rows ?? 3}"${it.placeholder ? ` placeholder="${esc(it.placeholder)}"` : ''}>${esc(v ?? '')}</textarea>`;
      case 'color':
        return `<input type="color" data-c="text" data-id="${id}" value="${esc(v || '#6A1EBB')}"/>`; // ds-lint-allow: hex (default swatch only)
      case 'action':
        return `<button class="btn${it.danger ? ' danger' : ''}" data-c="action" data-id="${id}">${esc(it.action || it.label)}</button>`;
      default:
        return '';
    }
  }
  _seg(id, options, v) {
    return `<div class="seg" data-c="seg" data-id="${esc(id)}">` + (options || []).map(o =>
      `<button type="button" aria-pressed="${o.value === v}" data-v="${esc(o.value)}">${esc(o.label)}</button>`).join('') + `</div>`;
  }

  _set(id, value, type) {
    this._values[id] = value;
    this._syncDeps();
    this.dispatchEvent(new CustomEvent('change', { bubbles: true, composed: true, detail: { id, value, values: this.values } }));
  }
  // show/hide dependent sub-settings when their parent changes (hidden, not disabled — SETTINGS-07)
  _syncDeps() {
    for (const it of this._schema) {
      if (!it.dependsOn) continue;
      const row = this.shadowRoot.querySelector(`.set.sub[data-id="${CSS.escape(it.id || '')}"]`);
      if (row) row.toggleAttribute('hidden', !this._depOn(it));
    }
  }

  _wire() {
    const r = this.shadowRoot;
    r.querySelectorAll('[data-c="switch"],[data-c="checkbox"]').forEach(b => b.addEventListener('click', () => {
      const on = b.getAttribute('aria-checked') !== 'true';
      b.setAttribute('aria-checked', String(on));
      if (b.dataset.c === 'checkbox') b.innerHTML = on ? TICK : '';
      this._set(b.dataset.id, on, b.dataset.c);
    }));
    r.querySelectorAll('[data-c="radio"]').forEach(group => group.querySelectorAll('.radio').forEach(opt =>
      opt.addEventListener('click', () => {
        group.querySelectorAll('.radio').forEach(o => o.setAttribute('aria-checked', 'false'));
        opt.setAttribute('aria-checked', 'true');
        this._set(group.dataset.id, opt.dataset.v, 'radio');
      })));
    r.querySelectorAll('[data-c="seg"]').forEach(group => group.querySelectorAll('button').forEach(btn =>
      btn.addEventListener('click', () => {
        group.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', 'false'));
        btn.setAttribute('aria-pressed', 'true');
        this._set(group.dataset.id, btn.dataset.v, 'seg');
      })));
    r.querySelectorAll('[data-c="select"]').forEach(s => s.addEventListener('change', () => this._set(s.dataset.id, s.value, 'select')));
    r.querySelectorAll('[data-c="range"]').forEach(s => s.addEventListener('input', () => {
      const label = r.querySelector(`[data-val="${CSS.escape(s.dataset.id)}"]`);
      const item = this._schema.find(x => x.id === s.dataset.id);
      if (label) label.textContent = s.value + (item && item.unit ? ` ${item.unit}` : '');
      this._set(s.dataset.id, Number(s.value), 'range');
    }));
    r.querySelectorAll('[data-c="number"]').forEach(s => s.addEventListener('change', () => this._set(s.dataset.id, s.value === '' ? null : Number(s.value), 'number')));
    r.querySelectorAll('[data-c="text"]').forEach(s => s.addEventListener('input', () => this._set(s.dataset.id, s.value, 'text')));
    r.querySelectorAll('[data-c="action"]').forEach(b => b.addEventListener('click', () =>
      this.dispatchEvent(new CustomEvent('action', { bubbles: true, composed: true, detail: { id: b.dataset.id } }))));
  }
}

export function defineAhaSettings(tag = 'aha-settings') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaSettings);
  return true;
}
if (typeof window !== 'undefined') defineAhaSettings();

export default { AhaSettings, defineAhaSettings };
