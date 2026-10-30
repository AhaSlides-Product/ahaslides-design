/**
 * @ahaslides-product/design/aha-leaderboard — the ranked score list shared by the slide canvas and the audience phone.
 *
 *   import '@ahaslides-product/design/aha-leaderboard';   // registers <aha-leaderboard>
 *   <aha-leaderboard size="stage" me="u7"
 *     entries='[{"id":"u7","name":"Linh","score":1200,"avatar":"🦊"},{"id":"u2","name":"Minh","score":900}]'></aha-leaderboard>
 *
 * One look on both surfaces, after the presenter leaderboard: a neutral rank circle, a bar per row inside a full-width track, the
 * score with its unit and the points gained last round. Row n takes deck palette colour n (cycling) with the matching `-ink` pair
 * for the name; a row with no score keeps a short stub of its colour. The name is drawn twice and the on-fill copy is clipped to
 * the bar, so the ink flips exactly where the bar ends. Themed from the deck only: call `applyCanvasDeck` (canvas) or `applyDeck`
 * (audience phone) once with the deck palette; without one the rows fall back to the deck accent.
 *
 * The element draws the list only; place it in a panel or modal built from the deck container tokens.
 *
 * Data: `entries` (JSON attribute or property) [{ id, name, score, delta?, avatar?, members? }], `me` (the participant's id),
 * `bar` ("false" turns the bar off), `trophy` (opt-in: shows a trophy on rank 1), `loading`, `size` (stage | phone),
 * `palette-size` (colours to cycle; default: the colours the deck defines),
 * `heading` (shows a centred title above the list, with a player count under it), `score-suffix` (unit after the score,
 * default "p") and the translatable strings `label`, `count-label` ("{n} players"), `you-label` ("(you)"),
 * `empty-label`, `members-label` ("{n} members"), `rank-label` ("You are now number {rank}", announced politely when the
 * participant's own rank changes). `delta` is the points gained, shown small after the score; no entry with a delta, no column.
 *
 * Every participant is listed. Give the element a height (or a max-height) and the list scrolls inside it while the heading and
 * count stay put; on the phone the participant's own row, marked by a plain "(you)" after the name, is scrolled into view on render
 * and when it moves. The canvas never marks a row as the viewer's own. Ties share a rank (1, 2, 2, 4).
 *
 * Show winner (canvas, size="stage", only): `showWinner()` (or the `winner` attribute) covers the whole list with one rounded,
 * frosted banner (the deck modal fill) and reveals rank 1 in it, every tied rank 1 side by side, in about 2.5 seconds: the banner
 * fades in, an accent ring pulses and bursts, then the name, avatar and score pop in one after another, the score counting up
 * from 0, while deck-palette confetti bursts once from the banner centre and both bottom corners. It stays until `hideWinner()` or
 * the viewer dismisses it with the close button in the banner's top-right corner or Esc, which fires `winner-close`; calling
 * `showWinner()` again shows it again and replays the reveal. On size="phone", with no
 * entries or when nobody scored, `showWinner()` does nothing and returns false, and the `winner` attribute shows nothing.
 * Translatable: `winner-score-label` ("{score} points"), `winner-label` ("Winner: {name}, {score}", announced politely) and
 * `close-label` ("Close"). Under prefers-reduced-motion the winner appears at once: no ring, pop, count-up or confetti.
 */
import './icons.js';
import './aha-button.js';
import { syncDeckAttributes } from './audience-deck.js';

const SKELETON_ROWS = 5;
const COUNT_UP_MS = 600;
const PALETTE_LIMIT = 24;
const DEFAULT_SUFFIX = 'p';
const CONFETTI_PIECES = 120;
const CONFETTI_SEED = 7;
const CONFETTI_SHAPES = ['rect', 'circle', 'streamer'];
const REVEAL_AT_MS = 950;
const REVEAL_STEP_MS = 250;
const WINNER_COUNT_MS = 900;

const STYLE = `
  :host{ position:relative; display:flex; flex-direction:column; min-width:0; color:var(--aha-deck-ink, var(--aha-text-default,#1A1A1A));
    --_ink:var(--aha-deck-ink, var(--aha-text-default,#1A1A1A));
    --_ink-secondary:var(--aha-deck-ink-secondary, color-mix(in srgb, var(--_ink) 76%, transparent));
    --_track:var(--aha-deck-fill, color-mix(in srgb, var(--_ink) 8%, transparent));
    --_accent:var(--aha-deck-accent, var(--aha-color-primary, #E70E68));
    --_accent-ink:var(--aha-deck-accent-ink, var(--aha-button-primary-text, #FFFFFF));
    --_row:56px; --_gap:var(--aha-space-16,16px); --_chip:32px; --_avatar:32px; --_heading:24px; --_name:20px; --_small:16px; --_score:22px; --_delta:16px;
    --_winner-name:var(--aha-size-h1,48px); --_winner-avatar:48px; --_winner-score:var(--aha-size-display1,64px); --_winner-gap:var(--aha-space-32,32px); --_close-size:32px;
    --_reveal-at:${REVEAL_AT_MS}ms; --_reveal-step:${REVEAL_STEP_MS}ms }
  :host([size="phone"]){ --_row:44px; --_gap:var(--aha-space-8,8px); --_chip:28px; --_avatar:28px; --_heading:16px; --_name:var(--aha-size-default,14px); --_small:var(--aha-size-default,14px); --_score:var(--aha-size-default,14px); --_delta:var(--aha-size-default,14px) }
  .board{ display:flex; flex-direction:column; flex:1 1 auto; min-width:0; min-height:0; height:100% }
  .header{ flex:0 0 auto; text-align:center; margin-block-end:var(--_gap) }
  .header[hidden]{ display:none }
  .heading{ font-size:var(--_heading); font-weight:var(--aha-weight-semibold,600); line-height:1.3 }
  .count{ font-size:var(--_small); color:var(--_ink-secondary); line-height:1.3 }
  :host([hidden]){ display:none }
  .stage{ position:relative; flex:1 1 auto; display:flex; flex-direction:column; min-height:0 }
  .viewport{ position:relative; flex:1 1 auto; min-height:0; overflow-x:hidden; overflow-y:auto; scrollbar-width:thin; overscroll-behavior:contain }
  .list{ min-height:100%; box-sizing:border-box; margin:0; padding:0; list-style:none; display:flex; flex-direction:column; gap:var(--_gap) }
  .row{ display:flex; align-items:center; gap:var(--_gap); height:var(--_row); flex:0 0 auto; min-width:0 }
  .row[hidden], .empty[hidden], .skeleton[hidden]{ display:none }
  .chip{ position:relative; flex:0 0 auto; box-sizing:border-box; display:inline-flex; align-items:center; justify-content:center;
    width:var(--_chip); height:var(--_chip); border-radius:50%;
    background:var(--_track); color:var(--_ink); font-size:var(--_small); font-weight:var(--aha-weight-semibold,600); line-height:1; font-variant-numeric:tabular-nums }
  .rank-text{ position:absolute; width:1px; height:1px; overflow:hidden; clip-path:inset(50%); white-space:nowrap }
  .track{ position:relative; flex:1 1 auto; min-width:0; height:100%; overflow:hidden; border-radius:var(--aha-deck-container-radius-sm, var(--aha-radius-default,8px));
    background:var(--_track) }
  .fill{ position:absolute; inset:0 auto 0 0; width:0; min-width:var(--aha-viz-stub-length,12px); border-radius:inherit; background:var(--_fill, var(--_accent));
    transition:width var(--aha-motion-viz-update,.4s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)) }
  .row[data-zero] .fill{ border-radius:0 }
  :host([bar="false"]) .fill, :host([bar="false"]) .over{ display:none }
  :host([bar="false"]) .base{ clip-path:none }
  .label{ position:absolute; inset:0; display:flex; align-items:center; gap:var(--aha-space-8,8px); min-width:0;
    padding-inline:var(--aha-space-12,12px); font-size:var(--_name); font-weight:var(--aha-weight-semibold,600); line-height:1.3 }
  .base{ color:var(--_ink); clip-path:inset(0 0 0 var(--_pct, 0%));
    transition:clip-path var(--aha-motion-viz-update,.4s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)) }
  .over{ color:var(--_on-fill, var(--_accent-ink)); clip-path:inset(0 calc(100% - var(--_pct, 0%)) 0 0);
    transition:clip-path var(--aha-motion-viz-update,.4s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)) }
  .avatar{ flex:0 0 auto; display:inline-flex; align-items:center; justify-content:center; width:var(--_avatar); height:var(--_avatar);
    overflow:hidden; border-radius:50%; font-size:calc(var(--_avatar) * .8); line-height:1 }
  .avatar[hidden], aha-icon[hidden]{ display:none }
  .avatar img{ width:100%; height:100%; object-fit:cover }
  .who{ display:flex; align-items:baseline; min-width:0; flex:0 1 auto }
  .name{ min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap }
  .you{ flex:0 0 auto; white-space:pre; font-weight:var(--aha-weight-regular,400) }
  .you[hidden], .members[hidden]{ display:none }
  .members{ flex:0 0 auto; display:inline-flex; align-items:center; gap:var(--aha-space-4,4px); font-size:var(--_small); font-weight:var(--aha-weight-regular,400); opacity:.76 }
  .score{ flex:0 0 auto; display:flex; align-items:center; gap:0; font-size:var(--_score); font-weight:var(--aha-weight-semibold,600); line-height:1; font-variant-numeric:tabular-nums }
  .score-main, .delta{ position:relative; display:inline-block }
  .score-main{ text-align:right }
  .score-size, .delta-size{ visibility:hidden }
  .score-value, .delta-value{ position:absolute; inset-block:0; display:flex; align-items:center }
  .score-value{ right:0 }
  .delta{ margin-inline-start:var(--aha-space-6,6px); font-size:var(--_delta); font-weight:var(--aha-weight-regular,400); color:var(--_ink-secondary) }
  .delta-value{ left:0 }
  .delta[hidden]{ display:none }
  .empty{ flex:1 1 auto; display:flex; align-items:center; justify-content:center; padding:var(--aha-space-16,16px); font-size:var(--_name); color:var(--_ink-secondary) }
  .skeleton{ display:flex; align-items:center; gap:var(--_gap); height:var(--_row); flex:0 0 auto }
  .skeleton-chip{ width:var(--_chip); height:var(--_chip); border-radius:50% }
  .skeleton-track{ flex:1 1 auto; height:100%; border-radius:var(--aha-deck-container-radius-sm, var(--aha-radius-default,8px)) }
  .skeleton-score{ width:var(--aha-space-48,48px); height:var(--_score); border-radius:var(--aha-radius-xs,4px) }
  .skeleton-chip, .skeleton-track, .skeleton-score{ background:var(--_track); animation:pulse 1.6s var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)) infinite }
  @keyframes pulse{ 50%{ opacity:.5 } }
  .winner{ position:absolute; inset:0; z-index:1; box-sizing:border-box; container-type:inline-size; overflow:hidden; color:var(--_ink); text-align:center;
    background:var(--aha-deck-modal-fill, color-mix(in srgb, var(--aha-white,#FFFFFF) 92%, transparent));
    -webkit-backdrop-filter:blur(var(--aha-blur-md,20px)); backdrop-filter:blur(var(--aha-blur-md,20px));
    border:1px solid var(--aha-deck-container-stroke, color-mix(in srgb, var(--_ink) 20%, transparent));
    border-radius:var(--aha-deck-container-radius-lg, var(--aha-radius-lg,12px));
    animation:winner-in var(--aha-motion-slow,.3s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)) both }
  .winner[hidden]{ display:none }
  .winner-beat{ position:absolute; inset-block-start:calc(50% - 48px); inset-inline-start:calc(50% - 48px); width:96px; height:96px; box-sizing:border-box;
    border:6px solid var(--_accent); border-radius:50%; opacity:0; pointer-events:none;
    animation:winner-beat calc(var(--_reveal-at) - var(--aha-motion-slow,.3s) + var(--_reveal-step)) linear var(--aha-motion-slow,.3s) both }
  .winner-name, .winner-avatar, .winner-score{ animation:winner-pop var(--aha-motion-viz-enter,.6s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)) var(--_reveal-at) both }
  .winner-avatar{ animation-delay:calc(var(--_reveal-at) + var(--_reveal-step)) }
  .winner-score{ animation-delay:calc(var(--_reveal-at) + var(--_reveal-step) * 2) }
  .stage[data-winner]{ min-height:calc(var(--_winner-name) * 1.2 + var(--_winner-avatar) + var(--_winner-score) * 1.2 + var(--aha-space-8,8px) * 2 + var(--_gap) * 2 + 2px) }
  .winner-body{ position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:safe center; gap:var(--aha-space-8,8px);
    box-sizing:border-box; padding:var(--_gap) calc(var(--_close-size) + var(--aha-space-8,8px) * 2); overflow-x:hidden; overflow-y:auto; overscroll-behavior:contain }
  .winners{ flex-shrink:0; display:flex; flex-wrap:wrap; justify-content:center; gap:var(--aha-space-8,8px) var(--_winner-gap); max-width:100% }
  .winner-person{ display:flex; flex-direction:column; align-items:center; gap:var(--aha-space-8,8px); min-width:0; max-width:100% }
  .winner-person[hidden]{ display:none }
  .winner-name{ max-width:100%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:var(--_winner-name); font-weight:var(--aha-weight-semibold,600); line-height:1.2 }
  .winner-avatar{ display:inline-flex; align-items:center; justify-content:center; width:var(--_winner-avatar); height:var(--_winner-avatar);
    overflow:hidden; border-radius:50%; font-size:calc(var(--_winner-avatar) * .8); line-height:1 }
  .winner-avatar[hidden]{ display:none }
  .winner-avatar img{ width:100%; height:100%; object-fit:cover }
  .winner-score{ flex-shrink:0; font-size:var(--_winner-score); font-weight:var(--aha-weight-semibold,600); line-height:1.2; font-variant-numeric:tabular-nums; white-space:nowrap }
  @container (max-width: 340px){ .winners, .winner-score{ --_winner-name:var(--aha-size-h4,24px); --_winner-avatar:32px; --_winner-score:var(--aha-size-h3,32px); --_winner-gap:var(--aha-space-16,16px) } }
  .winner-close{ position:absolute; inset-block-start:var(--aha-space-8,8px); inset-inline-end:var(--aha-space-8,8px); z-index:1 }
  @keyframes winner-in{ from{ opacity:0 } }
  @keyframes winner-beat{
    0%{ opacity:0; transform:scale(0) }
    15%{ opacity:1; transform:scale(.7) }
    30%{ transform:scale(.45) }
    45%{ transform:scale(.8) }
    60%, 72%{ opacity:1; transform:scale(.5) }
    100%{ opacity:0; transform:scale(9) } }
  @keyframes winner-pop{
    0%{ opacity:0; transform:scale(.3) }
    60%{ opacity:1; transform:scale(1.12) }
    100%{ opacity:1; transform:scale(1) } }
  .confetti{ position:absolute; inset:0; z-index:2; overflow:hidden; pointer-events:none }
  .confetti[hidden]{ display:none }
  .piece{ position:absolute; left:var(--_ox); top:var(--_oy); width:12px; height:7px; border-radius:var(--aha-radius-xs,4px); background:var(--_colour);
    opacity:0; will-change:transform, opacity; animation:confetti-burst var(--_duration) linear calc(var(--_reveal-at) + var(--_delay)) both }
  .piece[data-shape="circle"]{ width:9px; height:9px; border-radius:50% }
  .piece[data-shape="streamer"]{ width:5px; height:20px }
  @keyframes confetti-burst{
    0%{ opacity:0; transform:translate(0, 0) rotate(0deg) rotateX(0deg) scale(calc(var(--_size) * .3));
      animation-timing-function:var(--aha-ease-viz, cubic-bezier(0.2,0.7,0.4,1)) }
    2%{ opacity:1 }
    24%{ transform:translate(var(--_bx), var(--_by)) rotate(calc(var(--_spin) * .25)) rotateX(calc(var(--_flip) * .25)) scale(var(--_size));
      animation-timing-function:ease-in }
    88%{ opacity:1 }
    100%{ opacity:0; transform:translate(calc(var(--_bx) + var(--_drift)), var(--_fall)) rotate(var(--_spin)) rotateX(var(--_flip)) scale(var(--_size)) } }
  .live{ position:absolute; width:1px; height:1px; overflow:hidden; clip-path:inset(50%); white-space:nowrap }
  @media (prefers-reduced-motion: reduce){ .fill, .over{ transition:none } .skeleton-chip, .skeleton-track, .skeleton-score, .winner, .winner-name, .winner-avatar, .winner-score{ animation:none } .winner-beat, .confetti{ display:none } }
`;

const isFalse = (value) => value === 'false' || value === 'off' || value === '0';
const reducedMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const formatDelta = (delta) => { const number = Number(delta) || 0; return (number >= 0 ? '+' : '') + number.toLocaleString(); };
const fillTemplate = (template, values) => String(template).replace(/\{(\w+)\}/g, (_, key) => values[key] ?? '');

function confettiPieces(count, seed) {
  let state = seed;
  const random = () => { state = (state * 16807) % 2147483647; return (state - 1) / 2147483646; };
  const between = (low, high) => low + random() * (high - low);
  return Array.from({ length: count }, (_, index) => {
    const origin = index % 2 === 0 ? 'centre' : index % 4 === 1 ? 'left' : 'right';
    let burstX; let burstY;
    if (origin === 'centre') {
      const angle = between(-Math.PI * 1.05, Math.PI * 0.05);
      const reach = between(0.12, 0.42);
      burstX = Math.cos(angle) * reach; burstY = Math.sin(angle) * reach * 1.6;
    } else {
      burstX = (origin === 'left' ? 1 : -1) * between(0.08, 0.42); burstY = -between(0.5, 0.95);
    }
    return {
      origin, burstX, burstY,
      shape: CONFETTI_SHAPES[Math.floor(random() * CONFETTI_SHAPES.length)],
      size: between(0.7, 1.35).toFixed(2),
      delay: `${Math.round(random() * (origin === 'centre' ? 120 : 260))}ms`,
      duration: `${2600 + Math.round(random() * 1400)}ms`,
      drift: between(-0.08, 0.08),
      spin: `${Math.round((random() - 0.5) * 1440)}deg`,
      flip: `${Math.round(between(540, 1620))}deg`,
      paletteIndex: Math.floor(random() * PALETTE_LIMIT),
    };
  });
}

/** Competition ranking: entries by score, highest first, a tie sharing the rank of its first member (1, 2, 2, 4). Ties keep input order. */
export function rankEntries(entries) {
  const list = (Array.isArray(entries) ? entries : [])
    .filter((entry) => entry && entry.id != null)
    .map((entry, index) => ({ entry, index, score: Number(entry.score) || 0 }))
    .sort((a, b) => b.score - a.score || a.index - b.index);
  return list.map((item, position) => {
    const first = list.findIndex((other) => other.score === item.score);
    return { ...item.entry, id: String(item.entry.id), score: item.score, rank: first + 1, position };
  });
}

export class AhaLeaderboard extends HTMLElement {
  static get observedAttributes() {
    return ['entries', 'me', 'bar', 'trophy', 'loading', 'size', 'palette-size', 'label', 'you-label', 'empty-label', 'members-label', 'rank-label', 'heading', 'count-label', 'score-suffix', 'ink', 'accent',
      'winner', 'winner-score-label', 'winner-label', 'close-label'];
  }

  constructor() {
    super();
    this._entries = [];
    this._rows = new Map();
    this._scores = new Map();
    this._ranked = [];
    this._lastMeRank = null;
    this._lastMeIndex = -1;
    this._pendingReveal = false;
    this._frame = 0;
    this._winnerShown = false;
    this._winnerCount = null;
    this._onKeydown = (event) => { if (event.key === 'Escape' && !event.defaultPrevented) this._dismissWinner(); };
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `<style>${STYLE}</style>
      <div class="board"><div class="header" part="header" hidden><div class="heading"></div><div class="count"></div></div>
      <div class="stage"><div class="viewport">
        <ol class="list" part="list">
          <li class="empty" hidden></li>
        </ol>
      </div>
      <div class="winner" part="winner" hidden><span class="winner-beat" aria-hidden="true"></span><div class="winner-body"><div class="winners"></div><div class="winner-score"></div></div>
        <aha-button class="winner-close" variant="tertiary-deck" size="sm" corner icon-only aria-label="Close"><aha-icon name="system-x" size="16" decorative></aha-icon></aha-button>
      </div></div></div><div class="confetti" aria-hidden="true" hidden></div><div class="live" aria-live="polite"></div>`;
    const list = this._list = this.shadowRoot.querySelector('.list');
    this._header = this.shadowRoot.querySelector('.header');
    this._viewport = this.shadowRoot.querySelector('.viewport');
    this._empty = this.shadowRoot.querySelector('.empty');
    this._live = this.shadowRoot.querySelector('.live');
    this._winner = this.shadowRoot.querySelector('.winner');
    this._winners = this.shadowRoot.querySelector('.winners');
    this._winnerScore = this.shadowRoot.querySelector('.winner-score');
    this._close = this.shadowRoot.querySelector('.winner-close');
    this._confetti = this.shadowRoot.querySelector('.confetti');
    this._close.addEventListener('click', () => this._dismissWinner());
    this._skeletons = Array.from({ length: SKELETON_ROWS }, () => {
      const item = document.createElement('li');
      item.className = 'skeleton';
      item.setAttribute('aria-hidden', 'true');
      item.hidden = true;
      item.innerHTML = '<span class="skeleton-chip"></span><span class="skeleton-track"></span><span class="skeleton-score"></span>';
      list.insertBefore(item, this._empty);
      return item;
    });
    this._observer = typeof ResizeObserver === 'function' ? new ResizeObserver(() => this._fit()) : null;
  }

  get entries() { return this._entries; }
  set entries(value) { this._entries = Array.isArray(value) ? value : []; this._update(); }
  get bar() { return !isFalse(this.getAttribute('bar')); }
  set bar(value) { this.setAttribute('bar', value ? 'true' : 'false'); }
  get loading() { return this.hasAttribute('loading'); }
  set loading(value) { this.toggleAttribute('loading', !!value); }
  _ownId() { return this.getAttribute('size') === 'phone' ? this.getAttribute('me') : null; }
  get me() { return this.getAttribute('me'); }
  set me(value) { if (value == null) this.removeAttribute('me'); else this.setAttribute('me', String(value)); }
  get winner() { return this.hasAttribute('winner') && !isFalse(this.getAttribute('winner')); }
  set winner(value) { this.toggleAttribute('winner', !!value); }

  /** Shows rank 1 (every tied rank 1) in a banner over the list with confetti on the canvas; returns false and does nothing on size="phone", with no entries or when nobody has scored. */
  showWinner() {
    if (!this._winnerEntries(rankEntries(this._entries)).length) return false;
    this.winner = true;
    return true;
  }

  /** Hides the winner overlay without firing `winner-close`. */
  hideWinner() { this.winner = false; }

  connectedCallback() {
    if (this.hasAttribute('ink') || this.hasAttribute('accent')) syncDeckAttributes(this);
    this._observer?.observe(this._viewport);
    if (this.hasAttribute('entries')) this._readEntriesAttribute();
    this._update();
    this._watchDeck();
  }
  disconnectedCallback() {
    this._observer?.disconnect();
    this._deckObserver?.disconnect();
    document.removeEventListener('keydown', this._onKeydown);
    this._winnerShown = false;
    this._stopWinnerCount();
    cancelAnimationFrame(this._frame);
    this._frame = 0;
  }
  attributeChangedCallback(name) {
    if (name === 'ink' || name === 'accent') { if (this.isConnected) syncDeckAttributes(this); return; }
    if (name === 'entries') this._readEntriesAttribute();
    if (this.isConnected) this._update();
  }

  _readEntriesAttribute() {
    try { this._entries = JSON.parse(this.getAttribute('entries') || '[]'); } catch { this._entries = []; }
  }

  _watchDeck() {
    if (typeof MutationObserver !== 'function') return;
    this._deckObserver ??= new MutationObserver(() => {
      const size = this._paletteSize();
      if (size !== this._renderedPaletteSize) this._update();
    });
    for (let node = this; node; node = node.parentElement || node.getRootNode()?.host) {
      this._deckObserver.observe(node, { attributes: true, attributeFilter: ['style'] });
    }
  }

  _paletteSize() {
    const chosen = Number(this.getAttribute('palette-size'));
    if (chosen > 0) return chosen;
    const style = getComputedStyle(this);
    let count = 0;
    while (count < PALETTE_LIMIT && style.getPropertyValue(`--aha-deck-palette-${count + 1}`).trim()) count += 1;
    return Math.max(1, count);
  }

  _text(name, fallback) { return this.getAttribute(name) || fallback; }

  _createRow() {
    const item = document.createElement('li');
    item.className = 'row';
    item.innerHTML = `<span class="chip"><aha-icon name="system-trophy" size="16" decorative hidden></aha-icon><span class="rank-number"></span></span>
      <div class="track"><div class="fill"></div>
        <div class="label base"><span class="avatar" aria-hidden="true"></span><span class="who"><span class="name"></span><span class="you" hidden></span></span><span class="members" hidden><aha-icon name="system-users" size="16" decorative></aha-icon><span class="members-count"></span></span></div>
        <div class="label over" aria-hidden="true"><span class="avatar"></span><span class="who"><span class="name"></span><span class="you" hidden></span></span><span class="members" hidden><aha-icon name="system-users" size="16" decorative></aha-icon><span class="members-count"></span></span></div>
      </div>
      <span class="score"><span class="score-main"><span class="score-size" aria-hidden="true"></span><span class="score-value"></span></span><span class="score-unit"></span><span class="delta"><span class="delta-size" aria-hidden="true"></span><span class="delta-value"></span></span></span>`;
    return item;
  }

  _setAvatar(slot, avatar) {
    slot.hidden = !avatar;
    if (!avatar) { slot.textContent = ''; return; }
    if (/^(https?:|data:|\/)/.test(avatar)) {
      let image = slot.querySelector('img');
      if (!image) { image = document.createElement('img'); image.alt = ''; slot.replaceChildren(image); }
      if (image.getAttribute('src') !== avatar) image.setAttribute('src', avatar);
    } else if (slot.textContent !== avatar) {
      slot.textContent = avatar;
    }
  }

  _fillRow(item, entry, context, isMe) {
    const first = entry.rank === 1 && context.showTrophy;
    item.dataset.id = entry.id;
    item.toggleAttribute('data-me', isMe);
    const icon = item.querySelector('aha-icon');
    icon.hidden = !first;
    item.querySelector('.rank-number').className = first ? 'rank-number rank-text' : 'rank-number';
    item.querySelector('.rank-number').textContent = String(entry.rank);
    const team = entry.members != null;
    const paletteIndex = (entry.position % context.paletteSize) + 1;
    item.style.setProperty('--_fill', `var(--aha-deck-palette-${paletteIndex}, var(--_accent))`);
    item.style.setProperty('--_on-fill', `var(--aha-deck-palette-${paletteIndex}-ink, var(--_accent-ink))`);
    const percent = context.topScore > 0 ? Math.max(0, Math.min(100, (entry.score / context.topScore) * 100)) : 0;
    item.style.setProperty('--_pct', `${percent}%`);
    item.toggleAttribute('data-zero', percent === 0);
    item.querySelector('.fill').style.width = `${percent}%`;
    for (const label of item.querySelectorAll('.label')) {
      this._setAvatar(label.querySelector('.avatar'), entry.avatar);
      label.querySelector('.name').textContent = entry.name ?? '';
      const you = label.querySelector('.you');
      you.hidden = !isMe;
      you.textContent = isMe ? ` ${context.youLabel}` : '';
      const members = label.querySelector('.members');
      members.hidden = !team;
      members.querySelector('.members-count').textContent = team ? String(entry.members) : '';
      if (team) { members.setAttribute('role', 'img'); members.setAttribute('aria-label', fillTemplate(context.membersTemplate, { n: entry.members })); }
    }
    item.querySelector('.score-unit').textContent = context.suffix;
    const delta = item.querySelector('.delta');
    delta.hidden = !context.hasDelta;
    item.querySelector('.delta-value').textContent = entry.delta == null ? '' : formatDelta(entry.delta);
    this._setScore(item, entry.score);
  }

  _setScore(item, score) {
    const id = item.dataset.id;
    const state = this._scores.get(id) || { shown: score, target: score, from: score, start: 0 };
    if (!this._scores.has(id)) this._scores.set(id, state);
    if (state.target !== score) {
      state.from = state.shown; state.target = score; state.start = performance.now();
      if (reducedMotion()) state.shown = score;
      else this._tick();
    }
    state.node = item.querySelector('.score-value');
    state.node.textContent = state.shown.toLocaleString();
  }

  _tick() {
    if (this._frame) return;
    const step = (now) => {
      this._frame = 0;
      let running = false;
      for (const state of this._scores.values()) {
        if (state.shown === state.target) continue;
        const progress = Math.min(1, (now - state.start) / COUNT_UP_MS);
        const eased = 1 - (1 - progress) ** 3;
        state.shown = progress >= 1 ? state.target : Math.round(state.from + (state.target - state.from) * eased);
        state.node.textContent = state.shown.toLocaleString();
        if (state.shown !== state.target) running = true;
      }
      if (running) this._frame = requestAnimationFrame(step);
    };
    this._frame = requestAnimationFrame(step);
  }

  _update() {
    const loading = this.loading;
    const ranked = this._ranked = loading ? [] : rankEntries(this._entries);
    const topScore = ranked.length ? ranked[0].score : 0;
    const meId = this._ownId();
    const context = {
      topScore,
      paletteSize: (this._renderedPaletteSize = this._paletteSize()),
      showTrophy: this.hasAttribute('trophy') && !isFalse(this.getAttribute('trophy')),
      membersTemplate: this._text('members-label', '{n} members'),
      youLabel: this._text('you-label', '(you)'),
      suffix: this.hasAttribute('score-suffix') ? this.getAttribute('score-suffix') : DEFAULT_SUFFIX,
      hasDelta: ranked.some((entry) => entry.delta != null),
    };
    const heading = this.getAttribute('heading');
    this._header.hidden = !heading;
    this._header.querySelector('.heading').textContent = heading || '';
    this._header.querySelector('.count').textContent = fillTemplate(this._text('count-label', '{n} players'), { n: ranked.length });
    this._list.setAttribute('aria-label', this._text('label', heading || 'Leaderboard'));
    this._list.setAttribute('aria-busy', String(loading));

    const before = this._measure();
    const seen = new Set();
    for (const entry of ranked) {
      seen.add(entry.id);
      let item = this._rows.get(entry.id);
      if (!item) { item = this._createRow(); this._rows.set(entry.id, item); }
      this._fillRow(item, entry, context, entry.id === meId);
    }
    for (const [id, item] of this._rows) {
      if (seen.has(id)) continue;
      item.remove(); this._rows.delete(id); this._scores.delete(id);
    }
    let anchor = this._list.firstElementChild;
    for (const item of this._skeletons) if (item === anchor) anchor = anchor.nextElementSibling;
    for (const entry of ranked) {
      const item = this._rows.get(entry.id);
      if (item === anchor) anchor = anchor.nextElementSibling;
      else this._list.insertBefore(item, anchor);
    }

    const meEntry = ranked.find((entry) => entry.id === meId);
    this._empty.textContent = this._text('empty-label', 'No scores yet');
    this._empty.hidden = loading || ranked.length > 0;
    for (const item of this._skeletons) item.hidden = !loading;
    this._announce(meEntry);
    this._renderWinner(ranked);
    this._fit();
    this._play(before);
    const meIndex = meEntry ? meEntry.position : -1;
    if (meIndex !== this._lastMeIndex) this._pendingReveal = meIndex >= 0;
    this._lastMeIndex = meIndex;
    this._revealOwn();
  }

  _winnerEntries(ranked) {
    if (this.getAttribute('size') === 'phone' || !ranked.length || ranked[0].score <= 0) return [];
    return ranked.filter((entry) => entry.rank === 1);
  }

  _renderWinner(ranked) {
    const winners = this.winner ? this._winnerEntries(ranked) : [];
    const open = winners.length > 0;
    this._winner.hidden = !open;
    this._winner.parentElement.toggleAttribute('data-winner', open);
    this._close.setAttribute('aria-label', this._text('close-label', 'Close'));
    if (open) {
      const people = [...this._winners.children];
      while (people.length < winners.length) {
        const person = document.createElement('div');
        person.className = 'winner-person';
        person.innerHTML = '<div class="winner-name"></div><span class="winner-avatar" aria-hidden="true"></span>';
        this._winners.appendChild(person);
        people.push(person);
      }
      people.forEach((person, index) => {
        const entry = winners[index];
        person.hidden = !entry;
        if (!entry) return;
        person.querySelector('.winner-name').textContent = entry.name ?? '';
        this._setAvatar(person.querySelector('.winner-avatar'), entry.avatar);
      });
      if (this._winnerCount) this._winnerCount.target = winners[0].score;
      else this._winnerScore.textContent = this._winnerScoreText(winners[0].score);
    }
    if (open && !this._winnerShown) {
      document.addEventListener('keydown', this._onKeydown);
      this._live.textContent = fillTemplate(this._text('winner-label', 'Winner: {name}, {score}'),
        { name: winners.map((entry) => entry.name ?? '').join(', '), score: this._winnerScoreText(winners[0].score) });
      this._playConfetti();
      this._countWinnerScore(winners[0].score);
    } else if (!open && this._winnerShown) {
      document.removeEventListener('keydown', this._onKeydown);
      this._confetti.hidden = true;
      this._stopWinnerCount();
    }
    this._winnerShown = open;
  }

  _winnerScoreText(score) {
    return fillTemplate(this._text('winner-score-label', '{score} points'), { score: score.toLocaleString() });
  }

  _countWinnerScore(target) {
    this._stopWinnerCount();
    if (reducedMotion()) return;
    const count = this._winnerCount = { target, timer: 0, frame: 0 };
    this._winnerScore.textContent = this._winnerScoreText(0);
    count.timer = setTimeout(() => {
      const start = performance.now();
      const step = (now) => {
        const progress = Math.min(1, (now - start) / WINNER_COUNT_MS);
        this._winnerScore.textContent = this._winnerScoreText(Math.round(count.target * (1 - (1 - progress) ** 3)));
        if (progress < 1) count.frame = requestAnimationFrame(step);
        else this._winnerCount = null;
      };
      count.frame = requestAnimationFrame(step);
    }, REVEAL_AT_MS + REVEAL_STEP_MS * 2);
  }

  _stopWinnerCount() {
    const count = this._winnerCount;
    if (!count) return;
    clearTimeout(count.timer);
    cancelAnimationFrame(count.frame);
    this._winnerCount = null;
    this._winnerScore.textContent = this._winnerScoreText(count.target);
  }

  _playConfetti() {
    const confetti = this._confetti;
    if (reducedMotion()) { confetti.hidden = true; return; }
    if (!confetti.childElementCount) {
      for (const piece of confettiPieces(CONFETTI_PIECES, CONFETTI_SEED)) {
        const node = document.createElement('span');
        node.className = 'piece';
        node.dataset.shape = piece.shape;
        node.dataset.paletteIndex = String(piece.paletteIndex);
        node.piece = piece;
        node.style.cssText = `--_size:${piece.size};--_delay:${piece.delay};--_duration:${piece.duration};--_spin:${piece.spin};--_flip:${piece.flip}`;
        confetti.appendChild(node);
      }
    }
    confetti.hidden = false;
    const paletteSize = this._paletteSize();
    const host = this.getBoundingClientRect();
    const stage = this._winner.parentElement.getBoundingClientRect();
    const width = Math.max(host.width, 1);
    const height = Math.max(host.height, 1);
    const centreY = (stage.top + stage.height / 2 - host.top) / height;
    for (const node of confetti.children) {
      const { origin, burstX, burstY, drift } = node.piece;
      const originX = origin === 'centre' ? 0.5 : origin === 'left' ? 0 : 1;
      const originY = origin === 'centre' ? centreY : 1;
      node.style.setProperty('--_colour', `var(--aha-deck-palette-${(Number(node.dataset.paletteIndex) % paletteSize) + 1}, var(--_accent))`);
      node.style.setProperty('--_ox', `${(originX * 100).toFixed(1)}%`);
      node.style.setProperty('--_oy', `${(originY * 100).toFixed(1)}%`);
      node.style.setProperty('--_bx', `${Math.round(burstX * width)}px`);
      node.style.setProperty('--_by', `${Math.round(burstY * height)}px`);
      node.style.setProperty('--_drift', `${Math.round(drift * width)}px`);
      node.style.setProperty('--_fall', `${Math.round((1 - originY) * height) + 40}px`);
      node.style.animation = 'none';
    }
    confetti.getBoundingClientRect();
    for (const node of confetti.children) node.style.animation = '';
  }

  _dismissWinner() {
    if (!this._winnerShown) return;
    this.hideWinner();
    this.dispatchEvent(new CustomEvent('winner-close', { bubbles: true, composed: true }));
  }

  _measure() {
    const tops = new Map();
    for (const [id, item] of this._rows) tops.set(id, item.offsetTop);
    return tops;
  }

  _play(before) {
    if (reducedMotion()) return;
    const windowTop = this._viewport.scrollTop - this._viewport.clientHeight;
    const windowBottom = this._viewport.scrollTop + this._viewport.clientHeight * 2;
    const moves = [];
    for (const [id, item] of this._rows) {
      const previous = before.get(id);
      if (previous == null) continue;
      const current = item.offsetTop;
      const delta = previous - current;
      if (!delta || (previous < windowTop && current < windowTop) || (previous > windowBottom && current > windowBottom)) continue;
      moves.push([item, delta]);
    }
    if (!moves.length) return;
    for (const [item, delta] of moves) {
      item.style.transition = 'none';
      item.style.transform = `translateY(${delta}px)`;
    }
    this._viewport.getBoundingClientRect();
    for (const [item] of moves) {
      item.style.transition = 'transform var(--aha-motion-viz-reorder,.35s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1))';
      item.style.transform = '';
    }
  }

  _revealOwn() {
    if (!this._pendingReveal) return;
    const viewport = this._viewport;
    const height = viewport.clientHeight;
    const item = this._rows.get(this._ranked[this._lastMeIndex]?.id);
    if (!item || !height) return;
    this._pendingReveal = false;
    const top = item.offsetTop;
    const bottom = top + item.offsetHeight;
    if (top < viewport.scrollTop) viewport.scrollTop = top;
    else if (bottom > viewport.scrollTop + height) viewport.scrollTop = bottom - height;
  }

  _announce(meEntry) {
    const rank = meEntry ? meEntry.rank : null;
    if (rank != null && this._lastMeRank != null && rank !== this._lastMeRank) {
      this._live.textContent = fillTemplate(this._text('rank-label', 'You are now number {rank}'), { rank });
    }
    this._lastMeRank = rank;
  }

  _fit() {
    const ranked = this._ranked;
    const longest = ranked.reduce((max, entry) => Math.max(max, entry.score.toLocaleString().length), 1);
    const widest = ranked.length ? ranked.reduce((best, entry) => (entry.score.toLocaleString().length >= best.length ? entry.score.toLocaleString() : best), '') : '0';
    const sizeText = widest.replace(/\d/g, '8') || '8'.repeat(longest);
    for (const node of this.shadowRoot.querySelectorAll('.score-size')) if (node.textContent !== sizeText) node.textContent = sizeText;
    const widestDelta = ranked.reduce((best, entry) => (entry.delta != null && formatDelta(entry.delta).length > best.length ? formatDelta(entry.delta) : best), '');
    const deltaSizeText = widestDelta.replace(/\d/g, '8');
    for (const node of this.shadowRoot.querySelectorAll('.delta-size')) if (node.textContent !== deltaSizeText) node.textContent = deltaSizeText;
    this._revealOwn();
  }
}

export function defineAhaLeaderboard(tag = 'aha-leaderboard') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaLeaderboard);
  return true;
}
if (typeof window !== 'undefined') defineAhaLeaderboard();

export default { AhaLeaderboard, defineAhaLeaderboard, rankEntries };
