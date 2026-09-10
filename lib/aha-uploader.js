/**
 * @ahaslides-product/design/aha-uploader — the shared Uploader primitive.
 *
 *   import '@ahaslides-product/design/aha-uploader';   // registers <aha-uploader>
 *   <aha-uploader accept="image/*" multiple></aha-uploader>
 *   <aha-uploader listtype="picture-card" items='[{"name":"cover.png","status":"done"}]'></aha-uploader>
 *
 * A click-or-drag drop zone for selecting files, PLUS the file list it manages. ONE element,
 * shadow-DOM CSS, themed only by --aha-* tokens → byte-identical in React and Vue. Zero deps.
 *
 * The DS V3 Upload is a FAMILY, not a bare zone:
 *   • `listtype` — "text" (a drop zone + file rows below) or "picture-card" (a grid of thumbnail
 *     tiles with a trailing dashed add-box). The add-box IS the trigger in picture-card mode.
 *   • `items` — a JSON list of files being managed, each { name, status?, percent?, thumb? }:
 *       status "normal" | "uploading" (progress bar, driven by `percent`) | "error" | "done".
 *     Each row/tile carries a remove ✕ control (emits `remove`, detail { name, index }).
 *   • `disabled`, `maxcount` — a full/disabled zone stops accepting.
 *
 * Hover and drag-over toggle a class on the PERSISTENT zone (no subtree rebuild) so the border and
 * tint animate; the progress bar width and item hover animate on persistent nodes too. Glyphs are
 * summoned by name from the DS icon library via <aha-icon> — never an inline catalogue glyph.
 * Emits composed `change` (CustomEvent<{files}>) on select, and `remove` (CustomEvent<{name,index}>).
 */
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const STYLE = `
  :host{ display:block; font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif); font-size:14px; line-height:21px }

  /* ---- drop zone (text mode) ---------------------------------------------- */
  .zone{ box-sizing:border-box; display:flex; flex-direction:column; align-items:center; gap:8px;
    padding:24px 16px; text-align:center; cursor:pointer;
    background:var(--aha-bg-container,#FFFFFF); border:1px dashed var(--aha-border-strong,#D4D4D4);
    border-radius:var(--aha-radius-default,8px); color:var(--aha-text-tertiary,#8A8A8A);
    transition:border-color var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)), background var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)) }
  .zone:hover, .zone.dragover{ border-color:var(--aha-color-primary,#6A1EBB); background:var(--aha-bg-accent,#F9F5FF) }
  .zone:focus-visible{ outline:2px solid var(--aha-border-focus,#D3B4FF); outline-offset:2px }
  .zone aha-icon{ color:var(--aha-color-primary,#6A1EBB) }
  .zone b{ color:var(--aha-color-primary,#6A1EBB); font-weight:600 }
  :host([disabled]) .zone, :host([disabled]) .add{ cursor:not-allowed; opacity:.5 }

  /* ---- file list (text mode) ---------------------------------------------- */
  .list{ display:flex; flex-direction:column; gap:8px; margin-top:12px }
  .list:empty{ display:none }
  .row{ box-sizing:border-box; display:flex; align-items:center; gap:10px; padding:8px 12px;
    border:1px solid var(--aha-border,#E3E3E3); border-radius:var(--aha-radius-default,8px);
    background:var(--aha-bg-container,#FFFFFF); color:var(--aha-text-secondary,#4A4A4A);
    transition:border-color var(--aha-motion-fast,.1s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)), background var(--aha-motion-fast,.1s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)) }
  .row:hover{ background:var(--aha-bg-hover,#F7F7F7) }
  .row .lead{ flex:0 0 auto; display:inline-flex; color:var(--aha-text-tertiary,#8A8A8A) }
  .row .meta{ flex:1 1 auto; min-width:0; display:flex; flex-direction:column; gap:4px }
  .row .name{ overflow:hidden; text-overflow:ellipsis; white-space:nowrap }
  .row.error{ border-color:var(--aha-color-error,#F5222D); background:var(--aha-bg-negative,#FFF1F0) }
  .row.error .name, .row.error .lead{ color:var(--aha-color-error,#F5222D) }
  .row.done .lead{ color:var(--aha-color-success,#16C49A) }

  /* progress bar — a persistent track; only the fill width transitions */
  .bar{ height:4px; border-radius:var(--aha-radius-pill,999px); background:var(--aha-split,#F1F1F1); overflow:hidden }
  .bar > i{ display:block; height:100%; width:0%; border-radius:inherit; background:var(--aha-color-primary,#6A1EBB);
    transition:width var(--aha-motion-slow,.3s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)) }

  /* remove control — a persistent button; its tint animates */
  .rm{ flex:0 0 auto; display:inline-flex; align-items:center; justify-content:center; width:24px; height:24px;
    border:0; padding:0; border-radius:var(--aha-radius-sm,6px); background:transparent; cursor:pointer;
    color:var(--aha-text-tertiary,#8A8A8A);
    transition:background var(--aha-motion-fast,.1s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)), color var(--aha-motion-fast,.1s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)) }
  .rm:hover{ background:var(--aha-bg-hover,#F7F7F7); color:var(--aha-text-default,#1A1A1A) }
  .rm:focus-visible{ outline:2px solid var(--aha-border-focus,#D3B4FF); outline-offset:-2px }

  /* ---- picture-card mode -------------------------------------------------- */
  .grid{ display:flex; flex-wrap:wrap; gap:8px }
  .tile{ box-sizing:border-box; position:relative; width:104px; height:104px; display:flex;
    align-items:center; justify-content:center; border-radius:var(--aha-radius-default,8px);
    border:1px solid var(--aha-border,#E3E3E3); background:var(--aha-bg-container-secondary,#F7F7F7);
    color:var(--aha-text-tertiary,#8A8A8A); overflow:hidden;
    transition:border-color var(--aha-motion-fast,.1s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)) }
  .tile.error{ border-color:var(--aha-color-error,#F5222D); background:var(--aha-bg-negative,#FFF1F0); color:var(--aha-color-error,#F5222D) }
  .tile img{ width:100%; height:100%; object-fit:cover }
  .tile .rm{ position:absolute; top:4px; right:4px; background:var(--aha-bg-container,#FFFFFF) }
  .tile .stat{ position:absolute; bottom:4px; right:4px; display:inline-flex }
  .tile.done .stat{ color:var(--aha-color-success,#16C49A) }
  /* the dashed add-box — the trigger tile in picture-card mode */
  .add{ box-sizing:border-box; width:104px; height:104px; display:flex; flex-direction:column;
    align-items:center; justify-content:center; gap:6px; cursor:pointer; font-size:12px; line-height:16px;
    border:1px dashed var(--aha-border-strong,#D4D4D4); border-radius:var(--aha-radius-default,8px);
    background:var(--aha-bg-container,#FFFFFF); color:var(--aha-text-tertiary,#8A8A8A);
    transition:border-color var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)), background var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)) }
  .add:hover, .add.dragover{ border-color:var(--aha-color-primary,#6A1EBB); background:var(--aha-bg-accent,#F9F5FF); color:var(--aha-color-primary,#6A1EBB) }
  .add:focus-visible{ outline:2px solid var(--aha-border-focus,#D3B4FF); outline-offset:2px }
  .add aha-icon{ color:currentColor }

  input{ display:none }
  @media (prefers-reduced-motion: reduce){ *{ transition:none !important } }
`;

export class AhaUploader extends HTMLElement {
  static get observedAttributes() { return ['items', 'listtype', 'multiple', 'accept', 'disabled', 'maxcount']; }
  get multiple() { return this.hasAttribute('multiple'); }
  get accept() { return this.getAttribute('accept') || ''; }
  get disabled() { return this.hasAttribute('disabled'); }
  get listType() { return this.getAttribute('listtype') || 'text'; }
  get maxCount() { const n = parseInt(this.getAttribute('maxcount'), 10); return Number.isFinite(n) ? n : Infinity; }
  _items() { try { const v = JSON.parse(this.getAttribute('items') || '[]'); return Array.isArray(v) ? v : []; } catch { return []; } }
  get _full() { return this._items().length >= this.maxCount; }

  connectedCallback() {
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    this._render();
  }
  attributeChangedCallback() {
    // A full re-render on items/listtype/config change is fine — it is NOT a per-state toggle, so the
    // persistent-node transitions (zone dragover, progress fill, remove hover) still fire in place.
    if (this.shadowRoot) this._render();
  }

  // ---- status glyph per item state ------------------------------------------
  _statusIcon(status) {
    if (status === 'error') return '<aha-icon name="system-warning-circle" size="16" aria-hidden="true"></aha-icon>';
    if (status === 'done') return '<aha-icon name="system-check-circle" size="16" aria-hidden="true"></aha-icon>';
    return '<aha-icon name="system-file" size="16" aria-hidden="true"></aha-icon>';
  }
  _rmBtn(name, i) {
    return `<button class="rm" part="remove" type="button" aria-label="Remove ${esc(name)}" data-rm="${i}">` +
      `<aha-icon name="system-x" size="14" aria-hidden="true"></aha-icon></button>`;
  }
  _rowHtml(it, i) {
    const status = it.status || 'normal';
    const pct = Math.max(0, Math.min(100, Number(it.percent) || 0));
    const progress = status === 'uploading'
      ? `<div class="bar" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><i style="width:${pct}%"></i></div>` : '';
    return `<li class="row ${esc(status)}" part="item"><span class="lead">${this._statusIcon(status)}</span>` +
      `<span class="meta"><span class="name" title="${esc(it.name || '')}">${esc(it.name || '')}</span>${progress}</span>` +
      this._rmBtn(it.name || '', i) + `</li>`;
  }
  _tileHtml(it, i) {
    const status = it.status || 'normal';
    const inner = it.thumb ? `<img src="${esc(it.thumb)}" alt="${esc(it.name || '')}"/>`
      : `<aha-icon name="system-image-square" size="24" aria-hidden="true"></aha-icon>`;
    const stat = status === 'done' || status === 'error'
      ? `<span class="stat">${this._statusIcon(status)}</span>` : '';
    return `<div class="tile ${esc(status)}" part="item" title="${esc(it.name || '')}">${inner}${stat}${this._rmBtn(it.name || '', i)}</div>`;
  }

  _render() {
    const items = this._items();
    const canAdd = !this.disabled && !this._full;
    if (this.listType === 'picture-card') {
      const tiles = items.map((it, i) => this._tileHtml(it, i)).join('');
      const add = canAdd
        ? `<div class="add" part="zone" role="button" tabindex="0"><aha-icon name="system-upload-simple" size="20" aria-hidden="true"></aha-icon><span>Upload</span></div>`
        : '';
      this.shadowRoot.innerHTML = `<style>${STYLE}</style><div class="grid" part="list">${tiles}${add}</div>${this._inputHtml()}`;
    } else {
      const rows = items.map((it, i) => this._rowHtml(it, i)).join('');
      const zone = canAdd
        ? `<div class="zone" part="zone" role="button" tabindex="0"><aha-icon name="system-upload-simple" size="28" aria-hidden="true"></aha-icon><div><b>Click to upload</b> or drag files here</div></div>`
        : `<div class="zone" part="zone" aria-disabled="true"><aha-icon name="system-upload-simple" size="28" aria-hidden="true"></aha-icon><div>Upload limit reached</div></div>`;
      this.shadowRoot.innerHTML = `<style>${STYLE}</style>${zone}<ul class="list" part="list">${rows}</ul>${this._inputHtml()}`;
    }
    this._wire();
  }
  _inputHtml() {
    return `<input type="file"${this.multiple ? ' multiple' : ''}${this.accept ? ` accept="${esc(this.accept)}"` : ''}/>`;
  }

  // ---- events (all listeners live on shadow nodes → GC'd with the element) ---
  _wire() {
    const input = this.shadowRoot.querySelector('input');
    const trigger = this.shadowRoot.querySelector('.zone[role="button"], .add[role="button"]');
    const open = () => { if (!this.disabled && !this._full) input.click(); };
    if (trigger) {
      trigger.addEventListener('click', open);
      trigger.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
      ['dragenter', 'dragover'].forEach((ev) => trigger.addEventListener(ev, (e) => { e.preventDefault(); if (!this.disabled && !this._full) trigger.classList.add('dragover'); }));
      ['dragleave', 'drop'].forEach((ev) => trigger.addEventListener(ev, () => trigger.classList.remove('dragover')));
      trigger.addEventListener('drop', (e) => { e.preventDefault(); if (!this.disabled && !this._full && e.dataTransfer) this._emit(e.dataTransfer.files); });
    }
    if (input) input.addEventListener('change', () => this._emit(input.files));
    this.shadowRoot.querySelectorAll('.rm').forEach((btn) => btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const i = Number(btn.getAttribute('data-rm'));
      const it = this._items()[i] || {};
      this.dispatchEvent(new CustomEvent('remove', { bubbles: true, composed: true, detail: { name: it.name, index: i } }));
    }));
  }

  _emit(fileList) {
    const files = Array.from(fileList || []);
    if (files.length) this.dispatchEvent(new CustomEvent('change', { bubbles: true, composed: true, detail: { files } }));
  }
}

export function defineAhaUploader(tag = 'aha-uploader') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaUploader);
  return true;
}
if (typeof window !== 'undefined') defineAhaUploader();

export default { AhaUploader, defineAhaUploader };
