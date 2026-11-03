/**
 * @ahaslides-product/design/aha-notification — the notification card as a web component with an imperative API, for apps that do not load antd.
 *
 *   import { notify } from '@ahaslides-product/design/aha-notification';   // registers <aha-notification> (+ <aha-toaster>)
 *   notify({ title: 'Export ready', description: 'Your CSV is ready to download.' });
 *   notify.success({ title: 'Slide deleted', description: 'You can find it in Trash.', action: { label: 'Undo', onClick: restore } });
 *   notify.error({ key: 'sync', title: 'Sync paused', description: 'We will retry when you are back online.', duration: 0 });
 *
 * Same look as the antd Notification themed by notification-theme.js: a white elevated card 384 wide (never wider than the
 * viewport less 32), radius 8, 20/24 padding, a 16/24 SemiBold ink title, 14/22 secondary description, an optional 24px stroke
 * status glyph in --aha-icon-default, and the shared dismiss ✕ (tertiary icon-only xs <aha-button>) pinned to the title's first
 * line. It stacks in the same bottom-right <aha-toaster> column as <aha-toast> (see aha-toast.js for the region, the live
 * announcement, pause on hover and focus, Escape and `max`).
 *
 *   notify(options) · notify.success / info / warning / error(options) · notify.close(key) · notify.closeAll()
 *   options   { title, description, type, duration, key, action, closeLabel, onClose }
 *   duration  seconds on screen, default 4.5; 0 keeps it until dismissed
 *   action    { label, onClick(event) } renders one secondary sm <aha-button>, or pass your own Node; a click closes the card
 *             unless onClick calls event.preventDefault()
 *   returns   { key, close(), update(patch), closed }
 *
 * <aha-notification heading="Export ready" type="success" duration="0">Your CSV is ready.<aha-button slot="action">Open</aha-button></aha-notification>
 * also works on its own (docs, static pages).
 *
 * @fires close   cancelable, composed; detail.source is timeout, close-button, escape, action, overflow or method
 * @fires closed  composed; the card has left
 */
import { AhaNoticeBase, openNotice, getToaster, defineAhaToast } from './aha-toast.js';
import { STATUS_GLYPH } from './status-icon-css.js';

const NOTIFICATION_TYPES = ['success', 'info', 'warning', 'error'];

const NOTIFICATION_STYLE = `
  :host{ display:block; box-sizing:border-box; max-width:100%; pointer-events:auto;
    font-family:var(--aha-font-product, "Plus Jakarta Sans", sans-serif);
    transition:opacity var(--aha-motion-slow, .3s) var(--aha-ease-out, ease-out), transform var(--aha-motion-slow, .3s) var(--aha-ease-out, ease-out),
      height var(--aha-motion-slow, .3s) var(--aha-ease-in-out, ease), margin var(--aha-motion-slow, .3s) var(--aha-ease-in-out, ease) }
  :host([hidden]){ display:none }
  :host([data-motion="enter"]){ opacity:0; transform:translateY(var(--aha-space-12, 12px)) }
  :host([data-motion="leave"]){ opacity:0 }
  .surface{ box-sizing:border-box; display:flex; align-items:flex-start; gap:var(--aha-space-12, 12px); width:384px; max-width:100%;
    padding:var(--aha-space-20, 20px) var(--aha-space-24, 24px); background:var(--aha-bg-elevated, #FFFFFF); border-radius:var(--aha-radius-default, 8px);
    box-shadow:0 6px 16px 0 rgba(0,0,0,.08), 0 3px 6px -4px rgba(0,0,0,.12), 0 9px 28px 8px rgba(0,0,0,.05) }
  .icon{ flex:0 0 auto; display:inline-flex; line-height:0; color:var(--aha-icon-default, #4A4A4A) }
  .body{ flex:1 1 auto; min-width:0 }
  .title-row{ display:flex; align-items:flex-start; gap:var(--aha-space-8, 8px) }
  .title{ flex:1 1 auto; min-width:0; font-size:var(--aha-size-l, 16px); line-height:24px; font-weight:600; color:var(--aha-text-default, #1A1A1A); overflow-wrap:anywhere }
  .close{ flex:0 0 auto; --aha-close-line-height:24px }
  .description{ margin-top:var(--aha-space-8, 8px); font-size:var(--aha-size-default, 14px); line-height:22px; color:var(--aha-text-secondary, #4A4A4A); overflow-wrap:anywhere }
  .actions{ display:flex; justify-content:flex-end; gap:var(--aha-space-8, 8px); margin-top:var(--aha-space-12, 12px) }
  [hidden]{ display:none !important }
  @media (prefers-reduced-motion: reduce){ :host{ transition:none } }
`;

export class AhaNotification extends AhaNoticeBase {
  static defaultDuration = 4.5;

  static get observedAttributes() { return ['type', 'duration', 'heading', 'close-label']; }

  _build() {
    this.shadowRoot.innerHTML = `<style>${NOTIFICATION_STYLE}</style>
      <div class="surface" part="surface">
        <span class="icon" part="icon" hidden><aha-icon size="24" decorative></aha-icon></span>
        <div class="body">
          <div class="title-row">
            <div class="title" part="title"></div>
            <aha-button variant="tertiary" icon-only size="xs" corner class="close" part="close" aria-label="Close"><aha-icon name="system-x" size="16" decorative></aha-icon></aha-button>
          </div>
          <div class="description" part="description"><slot></slot></div>
          <div class="actions" part="actions" hidden><slot name="action"></slot></div>
        </div>
      </div>`;
    this.shadowRoot.addEventListener('slotchange', () => this._syncSlots());
    this.shadowRoot.querySelector('slot[name="action"]').addEventListener('click', (event) => {
      queueMicrotask(() => { if (!event.defaultPrevented) this.close('action'); });
    });
  }

  _sync() {
    const root = this.shadowRoot;
    const type = NOTIFICATION_TYPES.includes(this.getAttribute('type')) ? this.getAttribute('type') : null;
    const icon = root.querySelector('.icon');
    icon.hidden = !type;
    if (type && icon.firstElementChild.getAttribute('name') !== STATUS_GLYPH[type]) icon.firstElementChild.setAttribute('name', STATUS_GLYPH[type]);
    const title = root.querySelector('.title');
    const heading = this.getAttribute('heading') || '';
    if (title.textContent !== heading) title.textContent = heading;
    root.querySelector('.close').setAttribute('aria-label', this.getAttribute('close-label') || 'Close');
    this._syncSlots();
  }

  _syncSlots() {
    const root = this.shadowRoot;
    const hasDescription = [...this.childNodes].some((node) => (node.nodeType === 3 && node.textContent.trim()) || (node.nodeType === 1 && !node.hasAttribute('slot')));
    root.querySelector('.description').hidden = !hasDescription;
    root.querySelector('.actions').hidden = !this.querySelector(':scope > [slot="action"]');
  }

  _announcement() {
    const description = [...this.childNodes].filter((node) => !(node.nodeType === 1 && node.hasAttribute('slot'))).map((node) => node.textContent).join('').trim();
    return [this.getAttribute('heading'), description].filter(Boolean).join('. ');
  }
}

export function defineAhaNotification(tag = 'aha-notification') {
  if (typeof customElements === 'undefined') return false;
  defineAhaToast();
  if (!customElements.get(tag)) customElements.define(tag, AhaNotification);
  return true;
}
if (typeof window !== 'undefined') defineAhaNotification();

const actionNode = (action) => {
  if (!action) return null;
  if (action instanceof Node) return action;
  const button = document.createElement('aha-button');
  button.setAttribute('variant', 'secondary');
  button.setAttribute('size', 'sm');
  button.textContent = action.label;
  if (typeof action.onClick === 'function') button.addEventListener('click', action.onClick);
  return button;
};

const applyNotification = (item, options) => {
  if (options.title !== undefined) item.setAttribute('heading', options.title == null ? '' : String(options.title));
  if (options.description !== undefined || options.action !== undefined) {
    const description = options.description !== undefined ? options.description : [...item.childNodes].filter((node) => !(node.nodeType === 1 && node.hasAttribute('slot'))).map((node) => node.textContent).join('');
    const previousAction = item.querySelector(':scope > [slot="action"]');
    const children = [];
    if (description instanceof Node) children.push(description);
    else if (description != null && description !== '') children.push(document.createTextNode(String(description)));
    const action = options.action !== undefined ? actionNode(options.action) : previousAction;
    if (action) { action.setAttribute('slot', 'action'); children.push(action); }
    item.replaceChildren(...children);
  }
};

export function notify(options = {}) {
  return openNotice('aha-notification', options, applyNotification);
}
for (const type of NOTIFICATION_TYPES) notify[type] = (options = {}) => openNotice('aha-notification', { ...options, type }, applyNotification);
notify.open = notify;
notify.close = (key) => { getToaster().find(key)?.close('method'); };
notify.closeAll = () => { getToaster().items().filter((item) => item instanceof AhaNotification).forEach((item) => item.close('method')); };

export default { AhaNotification, notify, defineAhaNotification };
