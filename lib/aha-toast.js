/**
 * @ahaslides-product/design/aha-toast — the toast as a web component with an imperative API, for apps that do not load antd.
 *
 *   import { toast } from '@ahaslides-product/design/aha-toast';   // registers <aha-toast> and <aha-toaster>
 *   toast.success('Slide saved');
 *   const saving = toast.loading('Saving your changes…', { duration: 0 });
 *   saving.update({ type: 'success', content: 'Changes saved', duration: 3 });
 *   toast.warning('Upload failed. Check your connection and try again.', { duration: 0 });   // sticky: carries the shared ✕
 *
 * Same look as the antd Toast themed by toast-theme.js: a white elevated pill, radius 8, 9/12 padding, 14/22 ink text, a 16px
 * stroke status glyph in --aha-icon-default (the glyph and the words carry the status, never a hue). Placement follows the
 * Feedback rules: a fixed column at the viewport bottom-right (right 24, bottom 24, 16 on a phone), newest nearest the corner,
 * portalled to <body>, above modals (z-index 2010, antd's message layer).
 *
 *   toast(content, options?)                       info toast; also toast.success / info / warning / error / loading
 *   toast.open({ type, content, duration, key, closable, closeLabel, onClose })
 *   toast.close(key) · toast.closeAll()
 *   options    a number is the duration; content is a string (set as text) or a Node
 *   duration   seconds on screen, default 3; 0 keeps it until dismissed and shows the ✕
 *   key        reuse a key to update a toast in place (Saving… → Saved) instead of stacking a second one
 *   returns    { key, close(), update(patch), closed }   (closed is a Promise that resolves once it has left)
 *
 * <aha-toaster> is the host region, created on <body> by the first call (or place one yourself, once, near the app root, so its
 * live regions are mounted before the first message). It announces every toast through an always-mounted <aha-live-region>
 * (polite; assertive for an error), so the toast itself needs no live role and focus is never moved. Hovering or focusing the
 * column pauses every timer in it; Escape on a focused toast closes it and focus goes back where it came from. `max` (default 5)
 * caps the column: the oldest leaves first. `--aha-toaster-offset-x` / `--aha-toaster-offset-y` move the column (clear a
 * bottom-right <aha-background-task> by raising the offset).
 *
 * <aha-toast type="success" duration="0">Slide saved</aha-toast> also works on its own (docs, static pages): outside a toaster it
 * carries role="status" (role="alert" for an error) itself.
 *
 * @fires close   cancelable, composed; detail.source is timeout, close-button, escape, overflow or method
 * @fires closed  composed; the toast has left (it is hidden; a toaster removes it)
 */
import './icons.js';
import './aha-button.js';
import './aha-spin.js';
import './aha-live-region.js';
import { STATUS_GLYPH } from './status-icon-css.js';

export const NOTICE_HOST = `
  :host{ display:block; box-sizing:border-box; max-width:100%; pointer-events:auto;
    font-family:var(--aha-font-product, "Plus Jakarta Sans", sans-serif);
    transition:opacity var(--aha-motion-slow, .3s) var(--aha-ease-out, ease-out), transform var(--aha-motion-slow, .3s) var(--aha-ease-out, ease-out),
      height var(--aha-motion-slow, .3s) var(--aha-ease-in-out, ease), margin var(--aha-motion-slow, .3s) var(--aha-ease-in-out, ease) }
  :host([hidden]){ display:none }
  :host([data-motion="enter"]){ opacity:0; transform:translateY(var(--aha-space-12, 12px)) }
  :host([data-motion="leave"]){ opacity:0 }
  .surface{ box-sizing:border-box; background:var(--aha-bg-elevated, #FFFFFF); color:var(--aha-text-default, #1A1A1A); border-radius:var(--aha-radius-default, 8px);
    box-shadow:0 6px 16px 0 rgba(0,0,0,.08), 0 3px 6px -4px rgba(0,0,0,.12), 0 9px 28px 8px rgba(0,0,0,.05) }
  .close{ flex:0 0 auto }
  [hidden]{ display:none !important }
  @media (prefers-reduced-motion: reduce){ :host{ transition:none } }
`;

const TOAST_STYLE = `${NOTICE_HOST}
  .surface{ display:flex; align-items:flex-start; gap:var(--aha-space-8, 8px); width:max-content; max-width:min(384px, 100%);
    padding:9px var(--aha-space-12, 12px); /* ds-lint-allow: spacing (9px: the antd toast-theme contentPadding, kept value for value) */
    font-size:var(--aha-size-default, 14px); line-height:22px }
  .icon{ flex:0 0 auto; display:inline-flex; align-items:center; justify-content:center; width:16px; height:22px; color:var(--aha-icon-default, #4A4A4A) }
  .text{ flex:1 1 auto; min-width:0; overflow-wrap:anywhere }
  .close{ --aha-close-line-height:22px }
`;

const TOASTER_STYLE = `
  :host{ position:fixed; right:var(--aha-toaster-offset-x, 24px); bottom:var(--aha-toaster-offset-y, 24px); z-index:2010;
    display:flex; flex-direction:column; align-items:flex-end; box-sizing:border-box; max-width:calc(100vw - 32px); pointer-events:none }
  ::slotted(*){ margin-top:var(--aha-space-8, 8px) }
  ::slotted(:first-child){ margin-top:0 }
  @media (max-width: 575.98px){ :host{ right:var(--aha-toaster-offset-x, 16px); bottom:var(--aha-toaster-offset-y, 16px) } }
`;

const TOAST_TYPES = ['success', 'info', 'warning', 'error', 'loading'];
const LEAVE_FALLBACK_MS = 450;
const DEFAULT_MAX = 5;

const reducedMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

export class AhaNoticeBase extends HTMLElement {
  static get defaultDuration() { return 3; }

  constructor() {
    super();
    this._paused = false;
    this._leaving = false;
    this._remaining = 0;
    this._onPointerEnter = () => { if (!this._toaster()) this.pause(); };
    this._onPointerLeave = () => { if (!this._toaster() && !this.matches(':focus-within')) this.resume(); };
    this._onFocusIn = () => { if (!this._toaster()) this.pause(); };
    this._onFocusOut = (event) => { if (!this._toaster() && !this.contains(event.relatedTarget)) this.resume(); };
    this._onKeyDown = (event) => {
      if (event.key !== 'Escape' || !this._isDismissible()) return;
      event.preventDefault();
      event.stopPropagation();
      this.close('escape');
    };
  }

  connectedCallback() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
      this._build();
      this.shadowRoot.querySelector('.close').addEventListener('click', () => this.close('close-button'));
      this.addEventListener('pointerenter', this._onPointerEnter);
      this.addEventListener('pointerleave', this._onPointerLeave);
      this.addEventListener('focusin', this._onFocusIn);
      this.addEventListener('focusout', this._onFocusOut);
      this.addEventListener('keydown', this._onKeyDown);
    }
    this._sync();
    this._syncRole();
    if (!this.hasAttribute('hidden')) this._enter();
  }

  disconnectedCallback() { clearTimeout(this._timer); clearTimeout(this._leaveTimer); }

  attributeChangedCallback(name) {
    if (!this.shadowRoot) return;
    this._sync();
    if (name === 'type') this._syncRole();
    if (name === 'duration' && !this._leaving) this.restart();
  }

  get duration() {
    const raw = this.getAttribute('duration');
    const seconds = raw === null || raw === '' ? this.constructor.defaultDuration : Number(raw);
    return Number.isFinite(seconds) && seconds > 0 ? seconds : 0;
  }

  show() {
    this.removeAttribute('hidden');
    this.style.height = '';
    this.style.marginTop = '';
    this._leaving = false;
    this._enter();
  }

  restart() {
    this._remaining = this.duration * 1000;
    this._startTimer();
  }

  pause() {
    if (this._paused) return;
    this._paused = true;
    if (this._timer) {
      clearTimeout(this._timer);
      this._timer = undefined;
      this._remaining = Math.max(0, this._deadline - Date.now());
    }
  }

  resume() {
    if (!this._paused) return;
    this._paused = false;
    this._startTimer();
  }

  close(source = 'method') {
    if (this._leaving || this.hasAttribute('hidden')) return false;
    const event = new CustomEvent('close', { bubbles: true, composed: true, cancelable: true, detail: { source } });
    if (!this.dispatchEvent(event)) {
      if (source === 'timeout') this.restart();
      return false;
    }
    this._leave();
    return true;
  }

  _toaster() { return this.parentElement instanceof AhaToaster ? this.parentElement : null; }

  _isDismissible() { return true; }

  _announcement() { return this.textContent.trim(); }

  _syncRole() {
    if (this._toaster()) { this.removeAttribute('role'); return; }
    this.setAttribute('role', this.getAttribute('type') === 'error' ? 'alert' : 'status');
  }

  _startTimer() {
    clearTimeout(this._timer);
    this._timer = undefined;
    if (!this.duration || this._paused || this._leaving || !this.isConnected) return;
    this._deadline = Date.now() + this._remaining;
    this._timer = setTimeout(() => { this._timer = undefined; this.close('timeout'); }, this._remaining);
  }

  _enter() {
    this.restart();
    if (reducedMotion()) return;
    this.setAttribute('data-motion', 'enter');
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (this.getAttribute('data-motion') === 'enter') this.removeAttribute('data-motion');
    }));
  }

  _leave() {
    this._leaving = true;
    clearTimeout(this._timer);
    this._timer = undefined;
    if (this.matches(':focus-within')) this._toaster()?.returnFocus();
    if (reducedMotion() || !this.isConnected) { this._finish(); return; }
    this.style.height = `${this.offsetHeight}px`;
    void this.offsetHeight;
    this.setAttribute('data-motion', 'leave');
    this.style.height = '0px';
    this.style.marginTop = '0px';
    const done = (event) => {
      if (event && (event.target !== this || event.propertyName !== 'opacity')) return;
      this.removeEventListener('transitionend', done);
      clearTimeout(this._leaveTimer);
      this._finish();
    };
    this.addEventListener('transitionend', done);
    this._leaveTimer = setTimeout(done, LEAVE_FALLBACK_MS);
  }

  _finish() {
    if (this.hasAttribute('hidden')) return;
    this.setAttribute('hidden', '');
    this.removeAttribute('data-motion');
    this.dispatchEvent(new CustomEvent('closed', { bubbles: true, composed: true }));
  }
}

export class AhaToast extends AhaNoticeBase {
  static get observedAttributes() { return ['type', 'duration', 'closable', 'close-label']; }

  _build() {
    this.shadowRoot.innerHTML = `<style>${TOAST_STYLE}</style>
      <div class="surface" part="surface">
        <span class="icon" part="icon"><aha-icon size="16" decorative></aha-icon><aha-spin size="small" hidden></aha-spin></span>
        <span class="text" part="text"><slot></slot></span>
        <aha-button variant="tertiary" icon-only size="xs" corner class="close" part="close" aria-label="Close" hidden><aha-icon name="system-x" size="16" decorative></aha-icon></aha-button>
      </div>`;
  }

  _sync() {
    const root = this.shadowRoot;
    const type = TOAST_TYPES.includes(this.getAttribute('type')) ? this.getAttribute('type') : 'info';
    const glyph = root.querySelector('.icon > aha-icon');
    glyph.hidden = type === 'loading';
    root.querySelector('aha-spin').hidden = type !== 'loading';
    if (type !== 'loading' && glyph.getAttribute('name') !== STATUS_GLYPH[type]) glyph.setAttribute('name', STATUS_GLYPH[type]);
    const close = root.querySelector('.close');
    close.hidden = !this._isDismissible();
    close.setAttribute('aria-label', this.getAttribute('close-label') || 'Close');
  }

  _isDismissible() { return this.duration === 0 || this.hasAttribute('closable'); }
}

let keyCounter = 0;

export class AhaToaster extends HTMLElement {
  static get observedAttributes() { return ['max']; }

  constructor() {
    super();
    this._onPointerEnter = () => this._setPaused(true);
    this._onPointerLeave = () => { if (!this.matches(':focus-within')) this._setPaused(false); };
    this._onFocusIn = (event) => {
      if (!this.contains(event.relatedTarget)) this._returnTarget = event.relatedTarget;
      this._setPaused(true);
    };
    this._onFocusOut = (event) => { if (!this.contains(event.relatedTarget) && !this.matches(':hover')) this._setPaused(false); };
    this._onClosed = (event) => {
      const item = event.target;
      if (item.parentElement !== this) return;
      item.remove();
      if (!this.items().length) this._paused = false;
      item._resolveClosed?.();
    };
  }

  connectedCallback() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.innerHTML = `<style>${TOASTER_STYLE}</style>
        <aha-live-region class="polite" politeness="polite"></aha-live-region>
        <aha-live-region class="assertive"></aha-live-region>
        <slot></slot>`;
      this.addEventListener('pointerenter', this._onPointerEnter);
      this.addEventListener('pointerleave', this._onPointerLeave);
      this.addEventListener('focusin', this._onFocusIn);
      this.addEventListener('focusout', this._onFocusOut);
      this.addEventListener('closed', this._onClosed);
    }
    if (!this.hasAttribute('role')) this.setAttribute('role', 'region');
    if (!this.hasAttribute('aria-label')) this.setAttribute('aria-label', 'Notifications');
  }

  attributeChangedCallback() { this._trim(); }

  get max() {
    const max = Number(this.getAttribute('max'));
    return Number.isInteger(max) && max > 0 ? max : DEFAULT_MAX;
  }

  find(key) { return this.items().find((item) => item.dataset.key === String(key)) || null; }

  items() { return [...this.children].filter((item) => item instanceof AhaNoticeBase && !item._leaving && !item.hidden); }

  add(item) {
    if (!item.dataset.key) item.dataset.key = `aha-notice-${++keyCounter}`;
    this.append(item);
    if (this._paused) item.pause();
    this.announce(item);
    this._trim();
    return item;
  }

  announce(item) {
    const text = item._announcement();
    if (!text) return;
    const region = this.shadowRoot.querySelector(item.getAttribute('type') === 'error' ? '.assertive' : '.polite');
    region.announce(text);
  }

  closeAll() { this.items().forEach((item) => item.close('method')); }

  returnFocus() {
    const target = this._returnTarget;
    this._returnTarget = null;
    if (target && target.isConnected && typeof target.focus === 'function') target.focus();
    else if (this.contains(document.activeElement)) document.activeElement.blur();
  }

  _setPaused(paused) {
    this._paused = paused;
    this.items().forEach((item) => (paused ? item.pause() : item.resume()));
  }

  _trim() {
    const items = this.items();
    items.slice(0, Math.max(0, items.length - this.max)).forEach((item) => item.close('overflow'));
  }
}

export function defineAhaToast(tag = 'aha-toast') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get('aha-toaster')) customElements.define('aha-toaster', AhaToaster);
  if (!customElements.get(tag)) customElements.define(tag, AhaToast);
  return true;
}
if (typeof window !== 'undefined') defineAhaToast();

export const findToaster = () => (typeof document === 'undefined' ? null : document.querySelector('aha-toaster'));

export function closeNotices(type) {
  findToaster()?.items().filter((item) => item instanceof type).forEach((item) => item.close('method'));
}

export function getToaster() {
  const existing = findToaster();
  if (existing) return existing;
  const toaster = document.createElement('aha-toaster');
  document.body.append(toaster);
  return toaster;
}

const setContent = (item, content) => {
  if (content === undefined) return;
  if (content instanceof Node) item.replaceChildren(content);
  else item.textContent = content == null ? '' : String(content);
};

const setOptionalAttribute = (item, name, value) => {
  if (value === undefined) return;
  if (value === null || value === false) item.removeAttribute(name);
  else item.setAttribute(name, value === true ? '' : String(value));
};

/**
 * Opens or updates one notice in the shared toaster: the engine behind toast() and notify().
 * `apply(item, options)` writes the element-specific options; returns the { key, close, update, closed } handle.
 */
export function openNotice(tag, options, apply) {
  const toaster = getToaster();
  const existing = options.key != null ? toaster.find(options.key) : null;
  const item = existing || document.createElement(tag);
  const spoken = existing && `${item.getAttribute('type')}|${item._announcement()}`;
  if (options.key != null) item.dataset.key = String(options.key);
  setOptionalAttribute(item, 'type', options.type);
  setOptionalAttribute(item, 'duration', options.duration);
  setOptionalAttribute(item, 'close-label', options.closeLabel);
  apply(item, options);
  if (options.onClose !== undefined) item._onCloseCallback = options.onClose;
  if (!item._closed) {
    item._closed = new Promise((resolve) => {
      item._resolveClosed = () => { resolve(); if (typeof item._onCloseCallback === 'function') item._onCloseCallback(); };
    });
  }
  if (existing) {
    item.restart();
    if (spoken !== `${item.getAttribute('type')}|${item._announcement()}`) toaster.announce(item);
  } else {
    toaster.add(item);
  }
  const key = item.dataset.key;
  return {
    key,
    close: () => item.close('method'),
    update: (patch = {}) => openNotice(tag, { ...patch, key }, apply),
    closed: item._closed,
  };
}

const applyToast = (item, options) => {
  setContent(item, options.content);
  setOptionalAttribute(item, 'closable', options.closable);
};

const toastOptions = (content, options) => {
  if (typeof options === 'number') return { content, duration: options };
  return { ...(options || {}), content };
};

export function toast(content, options) {
  return openNotice('aha-toast', { type: 'info', ...toastOptions(content, options) }, applyToast);
}
for (const type of TOAST_TYPES) toast[type] = (content, options) => openNotice('aha-toast', { ...toastOptions(content, options), type }, applyToast);
toast.open = (options = {}) => openNotice('aha-toast', { type: 'info', ...options }, applyToast);
toast.close = (key) => { findToaster()?.find(key)?.close('method'); };
toast.closeAll = () => closeNotices(AhaToast);

export default { AhaToast, AhaToaster, AhaNoticeBase, toast, getToaster, defineAhaToast };
