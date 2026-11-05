/**
 * @ahaslides-product/design/aha-composer — the reply box of a forum, comment thread or discussion.
 *
 *   import '@ahaslides-product/design/aha-composer';   // registers <aha-composer> (+ <aha-input>, <aha-button>, <aha-counted-textarea>)
 *   <aha-composer placeholder="Join the conversation" submit-label="Reply" preview></aha-composer>
 *
 * Collapsed, it is a real <aha-input> (40px, radius 8, the Input contract) with the Input's focus ring:
 * a click, Enter, Space or typing opens the editor and moves focus into it, keeping what was typed. Focus
 * alone never opens it, so tabbing past changes nothing. Open, it is a formatting toolbar of tertiary icon-only <aha-button>s
 * (registry glyphs), an <aha-counted-textarea> with no cap, an optional preview pane in post-body type
 * and a Reply / Cancel row. The toolbar writes Markdown into the draft; the host renders the preview:
 * put sanitised HTML in a child with slot="preview" on each `input` event, or the pane shows the draft as
 * plain text. Events (composed): `open`, `input` {value} from the field, `submit` {value} and `cancel`
 * {value}, both cancelable. Unless prevented, submit clears the draft and closes; cancel closes and keeps
 * the draft. Mod+B and Mod+I format, Mod+Enter submits. The shadow DOM is built once.
 */
import './icons.js';
import './aha-input.js';
import './aha-button.js';
import './aha-counted-textarea.js';
import { upgradeProperties } from './upgrade-properties.js';

const STYLE = `
  :host{ display:block; font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif); color:var(--aha-text-default,#1A1A1A) }
  :host([hidden]), [hidden]{ display:none !important }
  .bar{ --aha-field-width:100%; width:100% }
  :host([open]) .bar{ display:none }

  .panel{ display:none; flex-direction:column; gap:var(--aha-space-12,12px); container-type:inline-size; opacity:1;
    transition:opacity var(--aha-motion-mid,.2s) var(--aha-ease-out,ease-out), display var(--aha-motion-mid,.2s) allow-discrete }
  :host([open]) .panel{ display:flex }
  @starting-style{ :host([open]) .panel{ opacity:0 } }

  .body{ display:grid; grid-template-columns:minmax(0,1fr); gap:var(--aha-space-12,12px) }
  @container (min-width: 720px){ /* ds-lint-allow: responsive (a container query that puts the preview beside the editor; it sets no width) */ :host([preview]) .body{ grid-template-columns:minmax(0,1fr) minmax(0,1fr) } }

  .editor{ box-sizing:border-box; display:flex; flex-direction:column; min-width:0;
    background:var(--aha-bg-container,#FFFFFF); border:1px solid var(--aha-border-default,#E3E3E3);
    border-radius:var(--aha-radius-default,8px);
    transition:border-color var(--aha-motion-mid,.2s) var(--aha-ease-in-out,ease-in-out), box-shadow var(--aha-motion-mid,.2s) var(--aha-ease-in-out,ease-in-out) }
  .editor:hover{ border-color:var(--aha-border-hover,#E70E68) }
  .editor:focus-within{ border-color:var(--aha-color-primary,#E70E68); box-shadow:0 0 0 2px var(--aha-focus-ring-soft,rgba(231,14,104,.3)) }

  .tools{ display:flex; flex-wrap:wrap; align-items:center; gap:var(--aha-space-2,2px);
    padding:var(--aha-space-4,4px) var(--aha-space-8,8px); border-bottom:1px solid var(--aha-border-secondary,#F1F1F1) }
  .sep{ width:1px; height:16px; margin:0 var(--aha-space-4,4px); background:var(--aha-border-secondary,#F1F1F1) }
  .end{ margin-inline-start:auto }
  .write{ padding:0 var(--aha-space-12,12px) }
  .field{ --aha-field-width:100%; width:100% }

  .preview{ box-sizing:border-box; min-width:0; max-height:360px; overflow:auto;
    padding:var(--aha-space-12,12px) var(--aha-space-16,16px);
    border:1px solid var(--aha-border-secondary,#F1F1F1); border-radius:var(--aha-radius-default,8px);
    font-size:var(--aha-size-l,16px); line-height:var(--aha-line-height-body,1.5); font-weight:var(--aha-weight-regular,400);
    color:var(--aha-text-default,#1A1A1A); overflow-wrap:anywhere }
  .plain{ margin:0; white-space:pre-wrap }
  .plain:empty::before{ content:attr(data-empty); color:var(--aha-text-tertiary,#616161) }

  .actions{ display:flex; flex-wrap:wrap; align-items:center; gap:var(--aha-space-8,8px) }
  @media (prefers-reduced-motion: reduce){ .panel, .editor{ transition:none } }
`;

const TOOLS = [
  ['bold', 'system-text-b', 'Bold', 'Control+B Meta+B'],
  ['italic', 'system-text-italic', 'Italic', 'Control+I Meta+I'],
  ['link', 'system-link', 'Link'],
  ['code', 'system-code', 'Code'],
  null,
  ['bullets', 'system-list-bullet', 'Bulleted list'],
  ['numbers', 'system-list-numbers', 'Numbered list'],
  ['upload', 'system-image-square', 'Upload an image'],
];

const iconButton = ([key, icon, label, keys]) =>
  `<aha-button variant="tertiary" size="sm" icon-only data-tool="${key}" aria-label="${label}"${keys ? ` aria-keyshortcuts="${keys}"` : ''}>` +
  `<aha-icon name="${icon}" size="16" decorative></aha-icon></aha-button>`;

export class AhaComposer extends HTMLElement {
  static get observedAttributes() {
    return ['open', 'value', 'placeholder', 'label', 'submit-label', 'cancel-label', 'preview', 'uploads'];
  }
  get value() { return this.getAttribute('value') ?? ''; }
  set value(v) { this.setAttribute('value', v ?? ''); }
  get open() { return this.hasAttribute('open'); }
  set open(v) { v ? this.setAttribute('open', '') : this.removeAttribute('open'); }

  connectedCallback() {
    upgradeProperties(this, ['value', 'open']);
    if (!this.shadowRoot) this._build();
    this._sync();
  }
  attributeChangedCallback() { if (this._panel) this._sync(); }

  _build() {
    const root = this.attachShadow({ mode: 'open' });
    root.append(document.createRange().createContextualFragment(`<style>${STYLE}</style>` +
      `<aha-input class="bar" part="bar"></aha-input>` +
      `<div class="panel" part="panel">` +
        `<div class="body">` +
          `<div class="editor" part="editor">` +
            `<div class="tools" part="toolbar" role="group" aria-label="Formatting">` +
              TOOLS.map((t) => (t ? iconButton(t) : '<span class="sep" aria-hidden="true"></span>')).join('') +
              `<aha-button class="end" variant="tertiary" size="sm" icon-only data-tool="preview" aria-label="Preview" pressed="false">` +
                `<aha-icon name="system-eye" size="16" decorative></aha-icon></aha-button>` +
            `</div>` +
            `<div class="write"><aha-counted-textarea class="field" part="field" maxlength="none" minrows="4" maxrows="12" borderless dir="auto"></aha-counted-textarea></div>` +
          `</div>` +
          `<section class="preview" part="preview" aria-label="Preview"><slot name="preview"><p class="plain"></p></slot></section>` +
        `</div>` +
        `<div class="actions" part="actions">` +
          `<aha-button class="submit" variant="primary"></aha-button>` +
          `<aha-button class="cancel" variant="tertiary"></aha-button>` +
        `</div>` +
      `</div>`));
    const $ = (s) => root.querySelector(s);
    this._bar = $('.bar');
    this._panel = $('.panel');
    this._field = $('.field');
    this._preview = $('.preview');
    this._plain = $('.plain');
    this._previewToggle = $('[data-tool="preview"]');
    this._upload = $('[data-tool="upload"]');
    this._submit = $('.submit');
    this._cancel = $('.cancel');

    this._bar.addEventListener('click', () => this._openAndFocus());
    this._bar.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();
      this._openAndFocus();
    });
    this._bar.addEventListener('input', (e) => {
      e.stopPropagation();
      if (!(e instanceof CustomEvent) || !this._bar.value) return;
      const typed = this._bar.value;
      this._bar.value = '';
      this.value = this.value + typed;
      this._openAndFocus();
    });
    this._field.addEventListener('input', (e) => {
      e.stopPropagation();
      if (!(e instanceof CustomEvent)) return;
      this.setAttribute('value', this._field.value);
      this.dispatchEvent(new CustomEvent('input', { bubbles: true, composed: true, detail: { value: this.value } }));
    });
    $('.tools').addEventListener('click', (e) => {
      const tool = e.target.closest && e.target.closest('[data-tool]');
      if (tool) this._tool(tool.dataset.tool);
    });
    this._submit.addEventListener('click', () => this._doSubmit());
    this._cancel.addEventListener('click', () => this._doCancel());
    this._panel.addEventListener('keydown', (e) => {
      if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
      const key = e.key.toLowerCase();
      if (key === 'enter') { e.preventDefault(); this._doSubmit(); }
      else if ((key === 'b' || key === 'i') && !e.shiftKey) { e.preventDefault(); this._tool(key === 'b' ? 'bold' : 'italic'); }
    });
  }

  _sync() {
    const a = (n, d) => this.getAttribute(n) || d;
    const placeholder = a('placeholder', 'Join the conversation');
    this._bar.setAttribute('placeholder', placeholder);
    this._bar.setAttribute('aria-label', placeholder);
    this._field.setAttribute('placeholder', placeholder);
    this._field.setAttribute('aria-label', a('label', 'Reply'));
    if (this._field.getAttribute('value') !== this.value) this._field.setAttribute('value', this.value);
    this._submit.textContent = a('submit-label', 'Reply');
    this._cancel.textContent = a('cancel-label', 'Cancel');
    const empty = this.value.trim() === '';
    if (empty) this._submit.setAttribute('disabled', ''); else this._submit.removeAttribute('disabled');
    const preview = this.hasAttribute('preview');
    this._preview.hidden = !preview;
    this._previewToggle.setAttribute('pressed', String(preview));
    this._previewToggle.setAttribute('aria-pressed', String(preview));
    this._upload.hidden = !this.hasAttribute('uploads');
    this._plain.textContent = this.value;
    this._plain.setAttribute('data-empty', 'Nothing to preview yet');
  }

  _textarea() { return this._field.shadowRoot && this._field.shadowRoot.querySelector('textarea'); }

  _openAndFocus() {
    if (!this.open) {
      this.open = true;
      this.dispatchEvent(new CustomEvent('open', { bubbles: true, composed: true }));
    }
    const ta = this._textarea();
    if (!ta) return;
    ta.focus();
    ta.setSelectionRange(ta.value.length, ta.value.length);
  }

  _tool(name) {
    if (name === 'preview') { this.toggleAttribute('preview'); return; }
    if (name === 'upload') { this.dispatchEvent(new CustomEvent('upload', { bubbles: true, composed: true })); return; }
    const ta = this._textarea();
    if (!ta) return;
    const { value } = ta;
    let start = ta.selectionStart;
    let end = ta.selectionEnd;
    const picked = value.slice(start, end);
    let text;
    let select;
    const wrap = (before, after, hint) => {
      const inner = picked || hint;
      text = before + inner + after;
      select = [before.length, before.length + inner.length];
    };
    if (name === 'bold') wrap('**', '**', 'strong text');
    else if (name === 'italic') wrap('*', '*', 'emphasised text');
    else if (name === 'link') wrap('[', '](https://)', 'link text');
    else if (name === 'code') {
      if (picked.includes('\n')) wrap('```\n', '\n```', '');
      else wrap('`', '`', 'code');
    } else if (name === 'bullets' || name === 'numbers') {
      start = value.lastIndexOf('\n', start - 1) + 1;
      const lines = value.slice(start, end).split('\n');
      text = lines.map((line, i) => (name === 'bullets' ? '- ' : `${i + 1}. `) + line).join('\n');
      select = [text.length, text.length];
    } else return;
    ta.focus();
    ta.setRangeText(text, start, end, 'end');
    ta.setSelectionRange(start + select[0], start + select[1]);
    ta.dispatchEvent(new Event('input', { bubbles: true }));
  }

  _doSubmit() {
    const value = this.value;
    if (value.trim() === '') return;
    const ok = this.dispatchEvent(new CustomEvent('submit', { bubbles: true, composed: true, cancelable: true, detail: { value } }));
    if (!ok) return;
    this.value = '';
    this._doClose();
  }

  _doCancel() {
    const ok = this.dispatchEvent(new CustomEvent('cancel', { bubbles: true, composed: true, cancelable: true, detail: { value: this.value } }));
    if (!ok) return;
    this._doClose();
  }

  _doClose() {
    this.open = false;
    this._bar.focus();
  }
}

export function defineAhaComposer(tag = 'aha-composer') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaComposer);
  return true;
}
if (typeof window !== 'undefined') defineAhaComposer();

export default { AhaComposer, defineAhaComposer };
