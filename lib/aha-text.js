/**
 * @ahaslides-product/design/aha-text — the shared Text primitive: body copy, captions, paragraphs
 * and in-page headings on the DS type scale.
 *
 *   import '@ahaslides-product/design/aha-text';   // registers <aha-text>
 *   <aha-text>Body copy, 14/1.5</aha-text>
 *   <aha-text tone="secondary" size="sm">Updated 2 hours ago</aha-text>
 *   <aha-text weight="semibold">Course name</aha-text>
 *   <aha-text as="p">A paragraph of running text.</aha-text>
 *   <aha-text level="2">Lessons</aha-text>
 *   <aha-text ellipsis>One line, cut with an ellipsis</aha-text>
 *   <aha-text lines="2">Clamped to two lines</aha-text>
 *
 * The DS replacement for antd Typography (Title, Text, Paragraph). Every value comes from the type
 * tokens: sizes 12 · 14 · 16 · 18 · 20 · 24 · 32, weights 400 / 600, the four text greys, and the
 * letter-spacing and line-height ratios. There is no status hue (colour rules: danger, success and
 * warning text is the default ink, paired with an icon or words). The page title is not this
 * element: it is <aha-breadcrumb size="page-title">.
 *
 * Text is a static marker with no interactive state, so it carries no motion. The shadow root is
 * built once; attributes restyle the host through :host selectors.
 */
const STYLE = `
  :host{ display:inline; margin:0;
    font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif);
    font-size:var(--aha-size-default,14px); font-weight:var(--aha-weight-regular,400);
    line-height:var(--aha-line-height-body,1.5); letter-spacing:var(--aha-letter-spacing-paragraph,0.2px);
    color:var(--aha-text-default,#1A1A1A); overflow-wrap:break-word }
  :host([hidden]){ display:none }
  :host([as="p"]){ display:block }

  :host([size="sm"]){ font-size:var(--aha-size-sm,12px); letter-spacing:var(--aha-letter-spacing-subtext,0.3px) }
  :host([size="default"]){ font-size:var(--aha-size-default,14px) }
  :host([size="l"]){ font-size:var(--aha-size-l,16px) }
  :host([size="h6"]){ font-size:var(--aha-size-h6,18px); line-height:var(--aha-line-height-heading,1.3) }
  :host([size="xl"]){ font-size:var(--aha-size-xl,20px); line-height:var(--aha-line-height-heading,1.3) }
  :host([size="h4"]){ font-size:var(--aha-size-h4,24px); line-height:var(--aha-line-height-heading,1.3) }
  :host([size="h3"]){ font-size:var(--aha-size-h3,32px); line-height:var(--aha-line-height-heading,1.3) }

  :host([level]){ display:block; font-weight:var(--aha-weight-semibold,600);
    line-height:var(--aha-line-height-heading,1.3); letter-spacing:var(--aha-letter-spacing-headlines,0px) }
  :host([level="1"]:not([size])){ font-size:var(--aha-size-h3,32px) }
  :host([level="2"]:not([size])){ font-size:var(--aha-size-h4,24px) }
  :host([level="3"]:not([size])){ font-size:var(--aha-size-xl,20px) }
  :host([level="4"]:not([size])){ font-size:var(--aha-size-h6,18px) }
  :host([level="5"]:not([size])){ font-size:var(--aha-size-l,16px) }
  :host([level="6"]:not([size])){ font-size:var(--aha-size-default,14px) }

  :host([weight="regular"]){ font-weight:var(--aha-weight-regular,400) }
  :host([weight="semibold"]){ font-weight:var(--aha-weight-semibold,600) }

  :host([tone="secondary"]){ color:var(--aha-text-secondary,#4A4A4A) }
  :host([tone="tertiary"]){ color:var(--aha-text-tertiary,#8A8A8A) }
  :host([tone="disabled"]){ color:var(--aha-text-disabled,#B5B5B5) }
  :host([tone="inverse"]){ color:var(--aha-text-inverse,#FFFFFF) }
  :host([tone="inherit"]){ color:inherit }

  :host([ellipsis]:not([ellipsis="false"])){ display:inline-block; max-width:100%; vertical-align:bottom;
    overflow:hidden; white-space:nowrap; text-overflow:ellipsis }
  :host([ellipsis]:not([ellipsis="false"])[as="p"]), :host([ellipsis]:not([ellipsis="false"])[level]){ display:block }
  :host([lines]){ display:-webkit-box; -webkit-box-orient:vertical; overflow:hidden; white-space:normal;
    -webkit-line-clamp:var(--aha-text-lines,2) }
`;

const isOn = (value) => value !== null && value !== 'false';

export class AhaText extends HTMLElement {
  static get observedAttributes() { return ['level', 'ellipsis', 'lines', 'title']; }

  connectedCallback() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' }).innerHTML = `<style>${STYLE}</style><style class="lines"></style><slot></slot>`;
      this.shadowRoot.querySelector('slot').addEventListener('slotchange', () => this._syncTruncationTitle());
    }
    this._syncHeading();
    this._syncLines();
    this._observeTruncation();
  }

  disconnectedCallback() {
    this._resizeObserver?.disconnect();
    this._resizeObserver = null;
  }

  attributeChangedCallback(name) {
    if (!this.shadowRoot) return;
    if (name === 'level') this._syncHeading();
    if (name === 'lines') this._syncLines();
    if (name === 'ellipsis' || name === 'lines') this._observeTruncation();
    if (name === 'title' && !this._settingTitle) this._authorTitle = this.getAttribute('title');
  }

  _syncHeading() {
    const level = Number(this.getAttribute('level'));
    const isHeading = Number.isInteger(level) && level >= 1 && level <= 6;
    if (isHeading && (!this.hasAttribute('role') || this._ownsRole)) {
      this._ownsRole = true;
      this.setAttribute('role', 'heading');
      this.setAttribute('aria-level', String(level));
    } else if (!isHeading && this._ownsRole) {
      this._ownsRole = false;
      this.removeAttribute('role');
      this.removeAttribute('aria-level');
    }
  }

  _syncLines() {
    const lines = Math.floor(Number(this.getAttribute('lines')));
    this.shadowRoot.querySelector('style.lines').textContent = lines >= 1 ? `:host{--aha-text-lines:${lines}}` : '';
  }

  _truncates() { return isOn(this.getAttribute('ellipsis')) || this.hasAttribute('lines'); }

  _observeTruncation() {
    if (this._authorTitle === undefined) this._authorTitle = this.getAttribute('title');
    if (!this._truncates()) {
      this._resizeObserver?.disconnect();
      this._resizeObserver = null;
      this._syncTruncationTitle();
      return;
    }
    if (!this._resizeObserver && typeof ResizeObserver !== 'undefined') {
      this._resizeObserver = new ResizeObserver(() => this._syncTruncationTitle());
      this._resizeObserver.observe(this);
    }
    this._syncTruncationTitle();
  }

  _syncTruncationTitle() {
    if (this._authorTitle) return;
    const cut = this._truncates() && (this.scrollWidth > this.clientWidth || this.scrollHeight > this.clientHeight);
    this._settingTitle = true;
    if (cut) this.setAttribute('title', this.textContent.trim());
    else this.removeAttribute('title');
    this._settingTitle = false;
  }
}

export function defineAhaText(tag = 'aha-text') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaText);
  return true;
}
if (typeof window !== 'undefined') defineAhaText();

export default { AhaText, defineAhaText };
