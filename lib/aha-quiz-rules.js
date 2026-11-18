/**
 * @ahaslides-product/design/aha-quiz-rules — the "Get ready" rules screen of a self-paced quiz.
 *
 *   import '@ahaslides-product/design/aha-quiz-rules';   // registers <aha-quiz-rules>
 *   <aha-quiz-rules heading="Question 2 of 7" skip-label="Play now" ends-at="1791363351000"
 *     rules='[{"text":"Answer faster to get more points"}]'>
 *   </aha-quiz-rules>
 *   rules.addEventListener('skip', () => skipRules());
 *
 * The screen a mode C self-paced quiz page (self-paced-view.html, setting.audienceQuizSelfPaced)
 * shows before each question: the title, the rule lines and the Play now button, as ONE block
 * centred in the height the page gives it. Put it as a direct child of the page's flex-column root;
 * it grows to fill it. A page passes one scoring line with no icon, and a list whose lines all lack an
 * icon is centred; a line may still carry an optional `icon`, and then the lines are left-aligned together.
 *
 * Sizes step once, at 960px of view width: title 24px (h4) then 32px (h3), rule text 16px regular then
 * 20px, icons 24px. Play now is <aha-button variant="secondary-deck" size="touch" block> as wide as the
 * rule list at every width (240 to 480px, never wider than the view). Its label counts down,
 * "Play now (5)", off `ends-at` (ticks itself) or `seconds` (the page drives it), never below 1; a
 * `skip-label` holding {n} places the number itself, for a language that writes it elsewhere. The number
 * is formatted with Intl.NumberFormat for the nearest lang; for other digits, leave out ends-at and
 * seconds and put the number in skip-label. A tap fires `skip`; whether the rules then close is the page's call.
 *
 * Every text comes from the page, translated; the element picks no copy but the "Play now"
 * fallback. Deck ink, dir="auto" on every text, and the arrow mirrors in a right-to-left page.
 */
import './icons.js';
import './aha-button.js';
import { AudienceElement, DECK_STYLE } from './audience-deck.js';

const STYLE = DECK_STYLE + `
  :host{ display:flex; flex-direction:column; flex:1 1 auto; width:100%; min-width:0 }
  .rules{ box-sizing:border-box; flex:1 1 auto; display:flex; flex-direction:column; align-items:center; justify-content:center;
    gap:var(--aha-space-24, 24px); width:100%; min-width:0; margin:0 auto; padding:var(--aha-space-16, 16px) 0 }
  .heading{ margin:0; font-size:var(--aha-size-h4, 24px); font-weight:var(--aha-weight-semibold, 600);
    line-height:var(--aha-line-height-body, 1.5); text-align:center; overflow-wrap:anywhere; text-wrap:balance }
  .body{ display:flex; flex-direction:column; align-items:stretch; gap:var(--aha-space-24, 24px); width:fit-content; min-width:min(100%, 240px); max-width:min(100%, 480px) }
  .list{ display:flex; flex-direction:column; align-self:center; gap:var(--aha-space-16, 16px); min-width:0; max-width:100% }
  .list:empty{ display:none }
  .rule{ display:flex; align-items:center; gap:var(--aha-space-12, 12px); margin:0; font-size:var(--aha-size-l, 16px);
    font-weight:var(--aha-weight-regular, 400); line-height:var(--aha-line-height-body, 1.5); overflow-wrap:anywhere }
  .rule aha-icon{ flex:none }
  .list.plain .rule{ justify-content:center; text-align:center }
  :host(:dir(rtl)) .arrow{ transform:scaleX(-1) }
  @media (min-width:960px){ /* ds-lint-allow: responsive (a view-width type step; it sets no width) */
    .heading{ font-size:var(--aha-size-h3, 32px) }
    .rule{ font-size:var(--aha-size-xl, 20px) }
  }
`;

/** Rule lines from the `rules` attribute: a JSON array of { text, icon? }; anything else is no lines. */
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
  }

  connectedCallback() {
    if (Object.prototype.hasOwnProperty.call(this, 'rules')) {
      const value = this.rules;
      delete this.rules;
      this.rules = value;
    }
    super.connectedCallback();
    this._syncHeading();
    this._syncRules();
    this._syncSkip();
  }
  disconnectedCallback() {
    this._stopTick();
  }
  attributeChangedCallback(name, previous, next) {
    super.attributeChangedCallback(name, previous, next);
    if (name === 'heading') this._syncHeading();
    else if (name === 'rules') { this._rules = undefined; this._syncRules(); }
    else if (name === 'skip-testid') this._syncTestId();
    else if (name !== 'ink' && name !== 'accent') this._syncSkip();
  }

  /** The rule lines, [{ text, icon? }]: set as a property, or as the `rules` attribute (JSON). The property wins until the attribute changes. */
  get rules() { return this._rules ?? parseRules(this.getAttribute('rules')); }
  set rules(value) { this._rules = Array.isArray(value) ? value : []; this._syncRules(); }

  /** `ends-at` as epoch ms, or null when it is missing, blank or not a finite number. */
  get _endsAt() {
    const raw = (this.getAttribute('ends-at') || '').trim();
    const value = raw ? Number(raw) : NaN;
    return Number.isFinite(value) ? value : null;
  }

  /** The whole seconds the Play now label shows, at least 1: from a valid `ends-at`, else a finite `seconds`, else null. */
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

  _syncRules() {
    const rows = this.rules.filter((rule) => rule && rule.text).map((rule) => {
      const row = document.createElement('p');
      row.className = 'rule';
      row.setAttribute('part', 'rule');
      if (rule.icon) {
        const icon = document.createElement('aha-icon');
        icon.setAttribute('name', rule.icon);
        icon.setAttribute('size', '24');
        icon.setAttribute('decorative', '');
        row.append(icon);
      }
      const text = document.createElement('span');
      text.dir = 'auto';
      text.textContent = rule.text;
      row.append(text);
      return row;
    });
    this._list.classList.toggle('plain', rows.every((row) => !row.querySelector('aha-icon')));
    this._list.replaceChildren(...rows);
  }

  _formatCount(n) {
    const lang = this.closest('[lang]')?.getAttribute('lang') || document.documentElement.lang || 'en';
    try { return new Intl.NumberFormat(lang).format(n); } catch { return String(n); }
  }

  _syncSkip() {
    const label = this.getAttribute('skip-label') || 'Play now';
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
