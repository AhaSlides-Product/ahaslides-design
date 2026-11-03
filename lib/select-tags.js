/**
 * select-tags.js — the `mode="tags"` body of <aha-select>: free-entry values shown as closable
 * <aha-tag> chips before an inline text field, in the select's own field chrome. aha-select builds
 * this instead of its trigger and listbox when `mode="tags"` is set, so the single-value select never
 * runs any of it.
 *
 * Typing a separator, pressing Enter, pasting a list or leaving the field turns the text into tags;
 * Backspace in an empty field removes the last one. Values are de-duplicated (exact match), and the
 * host emits `change` with {values} after every add or remove.
 */
import './aha-tag.js';
import { syncFieldError, isInvalid } from './aha-field-error.js';

const DEFAULT_SEPARATORS = ',;';
const escapeForClass = (s) => s.replace(/[\\\]^-]/g, '\\$&');

export const TAGS_STYLE = `
  :host{ display:inline-flex; flex-direction:column; width:var(--aha-field-width,240px); font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif) }
  .tags{ box-sizing:border-box; width:100%; min-height:40px; display:flex; flex-wrap:wrap; align-items:center; align-content:center;
    gap:var(--aha-space-4,4px); padding:var(--aha-space-4,4px) var(--aha-space-12,12px); cursor:text;
    background:var(--aha-bg-container,#FFFFFF); border:1px solid var(--aha-border-default,#E3E3E3); border-radius:var(--aha-radius-default,8px);
    transition:border-color var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)), box-shadow var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)) }
  :host([size="sm"]) .tags, :host([size="small"]) .tags{ min-height:32px; padding:var(--aha-space-4,4px) var(--aha-space-8,8px) }
  :host([size="lg"]) .tags, :host([size="large"]) .tags{ min-height:48px }
  :host([size="touch"]) .tags{ min-height:56px; padding:var(--aha-space-4,4px) var(--aha-space-16,16px) }
  .chips{ display:contents }
  .input{ flex:1 1 80px; min-width:80px; height:22px; margin:0; padding:0; border:0; outline:none; background:transparent;
    font-family:inherit; font-size:14px; line-height:22px; color:var(--aha-text-default,#1A1A1A) }
  :host([size="lg"]) .input, :host([size="large"]) .input, :host([size="touch"]) .input{ height:24px; font-size:var(--aha-size-l,16px); line-height:24px }
  .input::placeholder{ color:var(--aha-text-placeholder,#999999) }

  .tags:hover{ border-color:var(--aha-color-primary,#E70E68) }
  .tags:focus-within{ border-color:var(--aha-color-primary,#E70E68); box-shadow:0 0 0 2px var(--aha-focus-ring-soft,rgba(231,14,104,.3)) }
  :host([status="error"]) .tags{ border-color:var(--aha-border-error,#1A1A1A) }
  :host([status="error"]) .tags:focus-within{ box-shadow:0 0 0 2px var(--aha-border-error,#1A1A1A) }
  :host([status="warning"]) .tags{ border-color:var(--aha-border-warning,#1A1A1A) }
  :host([status="warning"]) .tags:focus-within{ box-shadow:0 0 0 2px var(--aha-border-warning,#1A1A1A) }
  :host([disabled]) .tags{ background:var(--aha-bg-container-disabled,#F1F1F1); border-color:var(--aha-border-disabled,#EBEBEB); cursor:not-allowed; box-shadow:none }
  :host([disabled]) .input{ color:var(--aha-text-disabled,#B5B5B5); cursor:not-allowed }

  @media (prefers-reduced-motion: reduce){ *{ transition:none !important } }
`;

export class SelectTags {
  constructor(host) {
    this.host = host;
    this.values = [];
    const root = host.shadowRoot;
    root.innerHTML = `<style>${TAGS_STYLE}</style>` +
      `<div class="tags" part="tags"><span class="chips" part="chips" role="list"></span>` +
      `<input class="input" part="input" type="text" autocomplete="off" spellcheck="false"></div>` +
      `<aha-field-error class="error" part="error" icon></aha-field-error>`;
    this.box = root.querySelector('.tags');
    this.chips = root.querySelector('.chips');
    this.input = root.querySelector('.input');
    // a click on a chip's text would otherwise land on the first focusable node, a chip's close button
    this.box.addEventListener('mousedown', (e) => {
      if (e.composedPath().some((n) => n === this.input || n.localName === 'button')) return;
      e.preventDefault();
      this.input.focus();
    });
    this.input.addEventListener('keydown', (e) => this.onKey(e));
    this.input.addEventListener('input', (e) => this.onInput(e));
    this.input.addEventListener('paste', (e) => this.onPaste(e));
    this.input.addEventListener('blur', () => this.commit(this.input.value, true));
    this.chips.addEventListener('close', (e) => {
      const chip = e.target.closest('aha-tag');
      if (chip) this.remove(chip.dataset.value, true);
    });
    this.readAttribute();
    this.sync();
  }

  readAttribute() {
    const attr = this.host.getAttribute('values');
    let parsed = [];
    if (attr) { try { const v = JSON.parse(attr); if (Array.isArray(v)) parsed = v; } catch { parsed = []; } }
    this.setValues(parsed);
  }

  setValues(list) {
    const next = [];
    for (const raw of Array.isArray(list) ? list : []) {
      const value = String(raw ?? '');
      if (value && !next.includes(value)) next.push(value);
    }
    this.values = next;
    this.render();
  }

  separatorPattern() {
    const chars = this.host.getAttribute('separators') ?? DEFAULT_SEPARATORS;
    return new RegExp(`[\\n\\t${escapeForClass(chars)}]`);
  }

  onKey(e) {
    if (e.isComposing || e.keyCode === 229) return;
    if (e.key === 'Enter') {
      if (this.input.value.trim()) e.preventDefault();
      this.commit(this.input.value, true);
    } else if (e.key === 'Backspace' && !this.input.value && this.values.length && !this.host.hasAttribute('disabled')) {
      e.preventDefault();
      this.remove(this.values[this.values.length - 1], false);
    }
  }

  onInput(e) {
    if (e.isComposing) return;
    const pattern = this.separatorPattern();
    if (!pattern.test(this.input.value)) return;
    this.commit(this.input.value, false);
  }

  // A text field drops the line breaks of a pasted list, so a list is split here, before the browser inserts it.
  onPaste(e) {
    const text = e.clipboardData ? e.clipboardData.getData('text') : '';
    if (!this.separatorPattern().test(text)) return;
    e.preventDefault();
    const { value, selectionStart, selectionEnd } = this.input;
    this.commit(value.slice(0, selectionStart ?? value.length) + text + value.slice(selectionEnd ?? value.length), true);
  }

  // A paste, Enter or leaving the field commits every piece; while typing, the text after the last separator stays in the field.
  commit(text, all) {
    if (this.host.hasAttribute('disabled')) return;
    const pieces = text.split(this.separatorPattern());
    const rest = all ? '' : pieces.pop();
    const added = [];
    for (const piece of pieces) {
      const value = piece.trim();
      if (value && !this.values.includes(value) && !added.includes(value)) added.push(value);
    }
    this.input.value = rest;
    const accepted = this.accept(added);
    if (!accepted.length) { this.syncPlaceholder(); return; }
    this.values = [...this.values, ...accepted];
    this.render();
    this.emit();
  }

  accept(added) { return added; }
  chipLabel(value) { return value; }

  remove(value, animating) {
    if (!this.values.includes(value)) return;
    this.values = this.values.filter((v) => v !== value);
    if (!animating) this.render(); else this.syncPlaceholder();
    this.emit();
    if (!animating) this.input.focus();
  }

  emit() {
    this.host.dispatchEvent(new CustomEvent('change', { bubbles: true, composed: true, detail: { values: [...this.values] } }));
  }

  // Keyed by value so a chip that stays keeps its node, and one closing on its own (aha-tag animates out, then removes itself) is left alone.
  render() {
    const disabled = this.host.hasAttribute('disabled');
    const existing = new Map();
    for (const chip of this.chips.querySelectorAll('aha-tag')) {
      if (chip.hasAttribute('closing')) continue;
      if (this.values.includes(chip.dataset.value) && !existing.has(chip.dataset.value)) existing.set(chip.dataset.value, chip);
      else chip.remove();
    }
    let previous = null;
    for (const value of this.values) {
      let chip = existing.get(value);
      if (!chip) {
        chip = document.createElement('aha-tag');
        chip.setAttribute('role', 'listitem');
        chip.setAttribute('part', 'tag');
        chip.dataset.value = value;
        chip.textContent = this.chipLabel(value);
      }
      if (disabled) chip.removeAttribute('closable'); else if (!chip.hasAttribute('closable')) chip.setAttribute('closable', '');
      const anchor = previous ? previous.nextSibling : this.chips.firstChild;
      if (chip !== anchor) this.chips.insertBefore(chip, anchor);
      previous = chip;
    }
    this.syncPlaceholder();
  }

  syncPlaceholder() {
    const placeholder = this.host.getAttribute('placeholder') || '';
    this.input.placeholder = this.values.length ? '' : placeholder;
  }

  sync(name) {
    if (name === 'values') { this.readAttribute(); return; }
    const host = this.host;
    this.input.disabled = host.hasAttribute('disabled');
    const label = host.getAttribute('aria-label') || host.getAttribute('placeholder');
    if (label) this.input.setAttribute('aria-label', label); else this.input.removeAttribute('aria-label');
    if (isInvalid(host)) this.input.setAttribute('aria-invalid', 'true'); else this.input.removeAttribute('aria-invalid');
    syncFieldError(host, this.input);
    if (name === 'disabled' || name === 'placeholder' || name == null) this.render();
  }
}
