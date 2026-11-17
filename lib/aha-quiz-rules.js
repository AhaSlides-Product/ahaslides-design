/**
 * @ahaslides-product/design/aha-quiz-rules — the "Get ready" rules screen of a self-paced quiz.
 *
 *   import '@ahaslides-product/design/aha-quiz-rules';   // registers <aha-quiz-rules>
 *   <aha-quiz-rules heading="Question 2 of 7" skip-label="Skip rules" ends-at="1791363351000"
 *     rules='[{"icon":"system-timer","text":"20 seconds to answer"},{"icon":"system-star","text":"Answer faster to get more points"}]'>
 *   </aha-quiz-rules>
 *   rules.addEventListener('skip', () => skipRules());
 *
 * The screen a mode C self-paced quiz page (self-paced-view.html, setting.audienceQuizSelfPaced)
 * shows before each question: the title, the rule lines (icon + text, the lines left-aligned
 * together and the list centred) and the Skip rules button, as ONE block centred in the height the
 * page gives it. Put it as a direct child of the page's flex-column root; it grows to fill it.
 *
 * Sizes step at 480px and 960px of view width: title 20 / 24 / 48px, rule text 16px then 24px,
 * icons 24px then 32px, gaps 24px then 32px. Skip rules is <aha-button variant="secondary-deck"
 * size="touch" block>: full width on a phone, from 480px as wide as the rule list (240 to 480px).
 * Its label counts down, "Skip rules (5)", off `ends-at` (ticks itself) or `seconds` (the page
 * drives it), never below 1; a `skip-label` holding {n} places the number itself, for a language
 * that writes it elsewhere. The number is formatted with Intl.NumberFormat for the nearest lang;
 * for other digits, leave out ends-at and seconds and put the number in skip-label. A tap fires `skip`; whether the rules then close is the page's call.
 *
 * Every text comes from the page, translated; the element picks no copy but the "Skip rules"
 * fallback. Deck ink, dir="auto" on every text, and the Skip arrow mirrors in a right-to-left page.
 */
import './icons.js';
import './aha-button.js';
import { AudienceElement, DECK_STYLE } from './audience-deck.js';

const WIDE = '(min-width: 960px)';   // ds-lint-allow: responsive (the icon size step of the 960px view breakpoint; it sets no width)

const STYLE = DECK_STYLE + `
  :host{ display:flex; flex-direction:column; flex:1 1 auto; width:100%; min-width:0 }
  .rules{ box-sizing:border-box; flex:1 1 auto; display:flex; flex-direction:column; align-items:center; justify-content:center;
    gap:var(--aha-space-24, 24px); width:100%; min-width:0; margin:0 auto; padding:var(--aha-space-16, 16px) 0 }
  .heading{ margin:0; font-size:var(--aha-size-xl, 20px); font-weight:var(--aha-weight-semibold, 600);
    line-height:var(--aha-line-height-body, 1.5); text-align:center; overflow-wrap:anywhere; text-wrap:balance }
  .body{ display:flex; flex-direction:column; align-items:stretch; gap:var(--aha-space-24, 24px); width:100%; min-width:0 }
  .list{ display:flex; flex-direction:column; align-self:center; gap:var(--aha-space-16, 16px); min-width:0; max-width:100% }
  .list:empty{ display:none }
  .rule{ display:flex; align-items:center; gap:var(--aha-space-12, 12px); margin:0; font-size:var(--aha-size-l, 16px);
    font-weight:var(--aha-weight-semibold, 600); line-height:var(--aha-line-height-body, 1.5); overflow-wrap:anywhere }
  .rule aha-icon{ flex:none }
  :host(:dir(rtl)) .arrow{ transform:scaleX(-1) }
  @media (min-width:480px){ /* ds-lint-allow: responsive (a view-width type and width step; the block stays fluid below it) */
    .heading{ font-size:var(--aha-size-h4, 24px) }
    .body{ width:fit-content; min-width:min(100%, 240px); max-width:min(100%, 480px) }
  }
  @media (min-width:960px){ /* ds-lint-allow: responsive (a view-width type and gap step; it sets no width) */
    .rules, .body{ gap:var(--aha-space-32, 32px) }
    .heading{ font-size:var(--aha-size-h1, 48px); line-height:var(--aha-line-height-tight, 1.2) }
    .list{ gap:var(--aha-space-24, 24px) }
    .rule{ gap:var(--aha-space-16, 16px); font-size:var(--aha-size-h4, 24px); line-height:var(--aha-line-height-heading, 1.3) }
  }
`;

/** Rule lines from the `rules` attribute: a JSON array of { icon, text }; anything else is no lines. */
function parseRules(value) {
  try {
    const rules = JSON.parse(value || '[]');
    return Array.isArray(rules) ? rules : [];
  } catch { return []; }
}

export class AhaQuizRules extends AudienceElement {
  static get observedAttributes() {
    return [...AudienceElement.deckAttributes, 'heading', 'rules', 'skip-label', 'ends-at', 'seconds', 'skip-testid'];
  }
  constructor() {
    super();
    this.shadowRoot.append(document.createRange().createContextualFragment(`<style>${STYLE}</style>
      <section class="rules" part="rules" aria-labelledby="heading">
        <h2 class="heading" part="heading" id="heading" dir="auto"></h2>
        <div class="body" part="body">
          <div class="list" part="list"></div>
          <aha-button class="skip" part="skip" variant="secondary-deck" size="touch" block>
            <span class="skip-label" dir="auto"></span><aha-icon class="arrow" slot="icon-end" name="system-arrow-right" size="16" decorative></aha-icon>
          </aha-button>
        </div>
      </section>`));
    this._heading = this.shadowRoot.querySelector('.heading');
    this._list = this.shadowRoot.querySelector('.list');
    this._skip = this.shadowRoot.querySelector('.skip');
    this._skipLabel = this.shadowRoot.querySelector('.skip-label');
    this._skip.addEventListener('click', () => this.dispatchEvent(new CustomEvent('skip', { bubbles: true, composed: true })));
    this._wide = typeof matchMedia === 'function' ? matchMedia(WIDE) : null;
    this._onWide = () => this._syncIconSize();
  }

  connectedCallback() {
    if (Object.prototype.hasOwnProperty.call(this, 'rules')) {
      const value = this.rules;
      delete this.rules;
      this.rules = value;
    }
    super.connectedCallback();
    this._wide?.addEventListener('change', this._onWide);
    this._syncHeading();
    this._syncRules();
    this._syncSkip();
  }
  disconnectedCallback() {
    this._wide?.removeEventListener('change', this._onWide);
    this._stopTick();
  }
  attributeChangedCallback(name, previous, next) {
    super.attributeChangedCallback(name, previous, next);
    if (name === 'heading') this._syncHeading();
    else if (name === 'rules') { this._rules = undefined; this._syncRules(); }
    else if (name === 'skip-testid') this._syncTestId();
    else if (name !== 'ink' && name !== 'accent') this._syncSkip();
  }

  /** The rule lines, [{ icon, text }]: set as a property, or as the `rules` attribute (JSON). The property wins until the attribute changes. */
  get rules() { return this._rules ?? parseRules(this.getAttribute('rules')); }
  set rules(value) { this._rules = Array.isArray(value) ? value : []; this._syncRules(); }

  /** `ends-at` as epoch ms, or null when it is missing, blank or not a finite number. */
  get _endsAt() {
    const raw = (this.getAttribute('ends-at') || '').trim();
    const value = raw ? Number(raw) : NaN;
    return Number.isFinite(value) ? value : null;
  }

  /** The whole seconds the Skip label shows, at least 1: from a valid `ends-at`, else a finite `seconds`, else null. */
  get secondsLeft() {
    const endsAt = this._endsAt;
    if (endsAt != null) return Math.max(1, Math.ceil((endsAt - Date.now()) / 1000));
    const raw = (this.getAttribute('seconds') || '').trim();
    const seconds = raw ? Number(raw) : NaN;
    return Number.isFinite(seconds) ? Math.max(1, Math.ceil(seconds)) : null;
  }

  _stopTick() {
    clearInterval(this._tick);
    this._tick = undefined;
  }

  /** Ticks once a second only while a valid `ends-at` is still ahead; stops once the label reaches its floor. */
  _syncTick() {
    const endsAt = this._endsAt;
    const running = this.isConnected && endsAt != null && endsAt > Date.now();
    if (running && !this._tick) this._tick = setInterval(() => this._syncSkip(), 1000);
    else if (!running && this._tick) this._stopTick();
  }

  _syncHeading() {
    const heading = this.getAttribute('heading') || '';
    this._heading.textContent = heading;
    this._heading.hidden = !heading;
  }

  _iconSize() { return this._wide?.matches ? '32' : '24'; }

  _syncIconSize() {
    for (const icon of this._list.querySelectorAll('aha-icon')) icon.setAttribute('size', this._iconSize());
  }

  _syncRules() {
    const rows = this.rules.filter((rule) => rule && rule.text).map((rule) => {
      const row = document.createElement('p');
      row.className = 'rule';
      row.setAttribute('part', 'rule');
      if (rule.icon) {
        const icon = document.createElement('aha-icon');
        icon.setAttribute('name', rule.icon);
        icon.setAttribute('size', this._iconSize());
        icon.setAttribute('decorative', '');
        row.append(icon);
      }
      const text = document.createElement('span');
      text.dir = 'auto';
      text.textContent = rule.text;
      row.append(text);
      return row;
    });
    this._list.replaceChildren(...rows);
  }

  _formatCount(n) {
    const lang = this.closest('[lang]')?.getAttribute('lang') || document.documentElement.lang || 'en';
    try { return new Intl.NumberFormat(lang).format(n); } catch { return String(n); }
  }

  _syncSkip() {
    const label = this.getAttribute('skip-label') || 'Skip rules';
    const left = this.secondsLeft;
    let text = label;
    if (label.includes('{n}')) text = left == null ? label.replace(/\s*\(\{n\}\)|\{n\}/g, '').trim() : label.replaceAll('{n}', this._formatCount(left));
    else if (left != null) text = `${label} (${this._formatCount(left)})`;
    if (this._skipLabel.textContent !== text) this._skipLabel.textContent = text;
    this._syncTick();
  }

  _syncTestId() {
    const id = this.getAttribute('skip-testid');
    if (id) this._skip.setAttribute('data-testid', id);
    else this._skip.removeAttribute('data-testid');
  }
}

export function defineAhaQuizRules(tag = 'aha-quiz-rules') {
  if (typeof customElements !== 'undefined' && !customElements.get(tag)) customElements.define(tag, AhaQuizRules);
}
if (typeof window !== 'undefined') defineAhaQuizRules();
export default { AhaQuizRules, defineAhaQuizRules };
