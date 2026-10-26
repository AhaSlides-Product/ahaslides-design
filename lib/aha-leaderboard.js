/**
 * @ahaslides-product/design/aha-leaderboard — the ranked score list shared by the slide canvas and the audience phone.
 *
 *   import '@ahaslides-product/design/aha-leaderboard';   // registers <aha-leaderboard>
 *   <aha-leaderboard size="stage" me="u7"
 *     entries='[{"id":"u7","name":"Linh","score":1200,"avatar":"🦊"},{"id":"u2","name":"Minh","score":900}]'></aha-leaderboard>
 *
 * One look on both surfaces: a rank chip, the name and the score at the end, with an optional bar behind the name sized to
 * score / top score. The name is drawn twice and the on-fill copy is clipped to the bar, so the ink flips exactly where the bar
 * ends. Themed from the deck only: call `applyCanvasDeck` (canvas) or `applyDeck` (audience) once; teams read the deck palette
 * pairs `--aha-deck-palette-<n>` / `-ink` (canvas) and fall back to the deck accent where applyDeck wrote none.
 *
 * The element draws the list only; place it in a panel or modal built from the deck container tokens.
 *
 * Data: `entries` (JSON attribute or property) [{ id, name, score, avatar?, members?, colour? }], `me` (the participant's id),
 * `bar` ("false" turns the bar off), `trophy` ("false" drops the trophy on rank 1), `loading`, `size` (stage | phone),
 * `limit` (optional cap; the default is no cap), `palette-size` (team colours to cycle, default 6) and the translatable
 * strings `label`, `you-label`, `more-label` ("and {n} more"), `empty-label`, `members-label` ("{n} members"),
 * `rank-label` ("You are now number {rank}", announced politely when the participant's own rank changes).
 *
 * Rows are measured to the element's height: give the element a height (or a max-height) and it shows as many rows as fit, then
 * an "and N more" line; with `me` outside the shown rows the participant's own row is pinned below that line. Without a height
 * every row shows. Ties share a rank (1, 2, 2, 4).
 */
import './icons.js';
import { syncDeckAttributes } from './audience-deck.js';

const SIZES = {
  stage: { row: 48, gap: 12, more: 28 },
  phone: { row: 40, gap: 8, more: 24 },
};
const SKELETON_ROWS = 5;
const COUNT_UP_MS = 600;
const DEFAULT_PALETTE_SIZE = 6;

const STYLE = `
  :host{ display:flex; flex-direction:column; min-width:0; color:var(--aha-deck-ink, var(--aha-text-default,#1A1A1A));
    --_ink:var(--aha-deck-ink, var(--aha-text-default,#1A1A1A));
    --_ink-secondary:var(--aha-deck-ink-secondary, color-mix(in srgb, var(--_ink) 76%, transparent));
    --_track:var(--aha-deck-fill, color-mix(in srgb, var(--_ink) 8%, transparent));
    --_stroke-chip:var(--aha-deck-stroke-chip, color-mix(in srgb, var(--_ink) 20%, transparent));
    --_stroke-strong:var(--aha-deck-stroke-hover, color-mix(in srgb, var(--_ink) 60%, transparent));
    --_accent:var(--aha-deck-accent, var(--aha-color-primary, #E70E68));
    --_accent-ink:var(--aha-deck-accent-ink, var(--aha-button-primary-text, #FFFFFF));
    --_row:48px; --_gap:var(--aha-space-12,12px); --_more:28px; --_chip:32px; --_avatar:28px; --_name:18px; --_small:16px; --_score:20px }
  :host([size="phone"]){ --_row:40px; --_gap:var(--aha-space-8,8px); --_more:24px; --_chip:24px; --_avatar:24px; --_name:14px; --_small:12px; --_score:14px }
  :host([hidden]){ display:none }
  .viewport{ position:relative; flex:1 1 auto; min-height:0; height:100%; overflow:hidden }
  .sizer{ visibility:hidden; pointer-events:none }
  .list{ position:absolute; inset:0 0 auto 0; margin:0; padding:0; list-style:none; display:flex; flex-direction:column; gap:var(--_gap) }
  .row{ display:flex; align-items:center; gap:var(--_gap); height:var(--_row); flex:0 0 auto; min-width:0 }
  .row[hidden], .more[hidden], .empty[hidden], .skeleton[hidden]{ display:none }
  .chip{ position:relative; flex:0 0 auto; box-sizing:border-box; display:inline-flex; align-items:center; justify-content:center;
    width:var(--_chip); height:var(--_chip); border-radius:var(--aha-radius-pill,999px);
    border:1px solid var(--_stroke-chip); font-size:var(--_small); font-weight:var(--aha-weight-semibold,600); line-height:1; font-variant-numeric:tabular-nums }
  .row[data-podium] .chip{ border-color:transparent; background:var(--_accent); color:var(--_accent-ink) }
  .rank-text{ position:absolute; width:1px; height:1px; overflow:hidden; clip-path:inset(50%); white-space:nowrap }
  .track{ position:relative; flex:1 1 auto; min-width:0; height:100%; overflow:hidden; border-radius:var(--aha-deck-container-radius-sm, var(--aha-radius-default,8px));
    background:var(--_track) }
  .row[data-me] .track{ box-shadow:inset 0 0 0 1px var(--_stroke-strong) }
  .fill{ position:absolute; inset:0 auto 0 0; width:0; background:var(--_fill, var(--_accent));
    transition:width var(--aha-motion-viz-update,.4s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)) }
  :host([bar="false"]) .fill, :host([bar="false"]) .over{ display:none }
  .label{ position:absolute; inset:0; display:flex; align-items:center; gap:var(--aha-space-8,8px); min-width:0;
    padding-inline:var(--aha-space-12,12px); font-size:var(--_name); font-weight:var(--aha-weight-semibold,600); line-height:1.3 }
  .base{ color:var(--_ink) }
  .over{ color:var(--_on-fill, var(--_accent-ink)); clip-path:inset(0 calc(100% - var(--_pct, 0%)) 0 0);
    transition:clip-path var(--aha-motion-viz-update,.4s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1)) }
  .avatar{ flex:0 0 auto; display:inline-flex; align-items:center; justify-content:center; width:var(--_avatar); height:var(--_avatar);
    overflow:hidden; border-radius:var(--aha-radius-pill,999px); font-size:calc(var(--_avatar) * .8); line-height:1 }
  .avatar[hidden], aha-icon[hidden]{ display:none }
  .avatar img{ width:100%; height:100%; object-fit:cover }
  .name{ min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap }
  .tag{ flex:0 0 auto; font-size:var(--_small); font-weight:var(--aha-weight-semibold,600); text-transform:uppercase; letter-spacing:.04em;
    padding:var(--aha-space-2,2px) var(--aha-space-6,6px); border-radius:var(--aha-radius-xs,4px); box-shadow:inset 0 0 0 1px currentColor }
  .tag[hidden], .members[hidden]{ display:none }
  .members{ flex:0 0 auto; display:inline-flex; align-items:center; gap:var(--aha-space-4,4px); font-size:var(--_small); font-weight:var(--aha-weight-regular,400); opacity:.76 }
  .score{ position:relative; flex:0 0 auto; display:inline-block; text-align:right; font-size:var(--_score); font-weight:var(--aha-weight-semibold,600);
    line-height:1; font-variant-numeric:tabular-nums }
  .score-size{ visibility:hidden }
  .score-value{ position:absolute; inset-block:0; right:0; display:flex; align-items:center }
  .more{ flex:0 0 auto; display:flex; align-items:center; justify-content:center; height:var(--_more); font-size:var(--_small); color:var(--_ink-secondary) }
  .empty{ display:flex; align-items:center; justify-content:center; padding:var(--aha-space-16,16px); font-size:var(--_name); color:var(--_ink-secondary) }
  .skeleton{ display:flex; align-items:center; gap:var(--_gap); height:var(--_row); flex:0 0 auto }
  .skeleton-chip{ width:var(--_chip); height:var(--_chip); border-radius:var(--aha-radius-pill,999px) }
  .skeleton-track{ flex:1 1 auto; height:100%; border-radius:var(--aha-deck-container-radius-sm, var(--aha-radius-default,8px)) }
  .skeleton-score{ width:calc(var(--_score) * 2.5); height:var(--_score); border-radius:var(--aha-radius-xs,4px) }
  .skeleton-chip, .skeleton-track, .skeleton-score{ background:var(--_track); animation:pulse 1.6s var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1)) infinite }
  @keyframes pulse{ 50%{ opacity:.5 } }
  .live{ position:absolute; width:1px; height:1px; overflow:hidden; clip-path:inset(50%); white-space:nowrap }
  @media (prefers-reduced-motion: reduce){ .fill, .over{ transition:none } .skeleton-chip, .skeleton-track, .skeleton-score{ animation:none } }
`;

const isFalse = (value) => value === 'false' || value === 'off' || value === '0';
const reducedMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const fillTemplate = (template, values) => String(template).replace(/\{(\w+)\}/g, (_, key) => values[key] ?? '');

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

/** How many ranked rows fit `height` px, and whether the participant's row is pinned below an "and N more" line. */
export function fitRows({ height, count, meIndex, row, gap, more }) {
  if (!(height > 0) || count * (row + gap) - gap <= height) return { shown: count, pinned: false };
  const unpinned = Math.max(0, Math.floor((height - more) / (row + gap)));
  if (meIndex < 0 || meIndex < unpinned) return { shown: unpinned, pinned: false };
  return { shown: Math.max(0, Math.floor((height - more - gap - row) / (row + gap))), pinned: true };
}

export class AhaLeaderboard extends HTMLElement {
  static get observedAttributes() {
    return ['entries', 'me', 'bar', 'trophy', 'loading', 'size', 'limit', 'palette-size', 'label', 'you-label', 'more-label', 'empty-label', 'members-label', 'rank-label', 'ink', 'accent'];
  }

  constructor() {
    super();
    this._entries = [];
    this._rows = new Map();
    this._scores = new Map();
    this._ranked = [];
    this._lastMeRank = null;
    this._frame = 0;
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `<style>${STYLE}</style>
      <div class="viewport"><div class="sizer"></div>
        <ol class="list" part="list">
          <li class="empty" hidden></li>
          <li class="more" hidden></li>
        </ol>
      </div><div class="live" aria-live="polite"></div>`;
    const list = this._list = this.shadowRoot.querySelector('.list');
    this._viewport = this.shadowRoot.querySelector('.viewport');
    this._sizer = this.shadowRoot.querySelector('.sizer');
    this._empty = this.shadowRoot.querySelector('.empty');
    this._more = this.shadowRoot.querySelector('.more');
    this._live = this.shadowRoot.querySelector('.live');
    this._pinned = this._createRow();
    this._pinned.hidden = true;
    list.append(this._pinned);
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
  get me() { return this.getAttribute('me'); }
  set me(value) { if (value == null) this.removeAttribute('me'); else this.setAttribute('me', String(value)); }

  connectedCallback() {
    if (this.hasAttribute('ink') || this.hasAttribute('accent')) syncDeckAttributes(this);
    this._observer?.observe(this._viewport);
    if (this.hasAttribute('entries')) this._readEntriesAttribute();
    this._update();
  }
  disconnectedCallback() {
    this._observer?.disconnect();
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

  _text(name, fallback) { return this.getAttribute(name) || fallback; }
  _metrics() { return SIZES[this.getAttribute('size')] || SIZES.stage; }

  _createRow() {
    const item = document.createElement('li');
    item.className = 'row';
    item.innerHTML = `<span class="chip"><aha-icon name="system-trophy" size="16" decorative hidden></aha-icon><span class="rank-number"></span></span>
      <div class="track"><div class="fill"></div>
        <div class="label base"><span class="avatar" aria-hidden="true"></span><span class="name"></span><span class="tag" hidden></span><span class="members" hidden><aha-icon name="system-users" size="14" decorative></aha-icon><span class="members-count"></span></span></div>
        <div class="label over" aria-hidden="true"><span class="avatar"></span><span class="name"></span><span class="tag" hidden></span><span class="members" hidden><aha-icon name="system-users" size="14" decorative></aha-icon><span class="members-count"></span></span></div>
      </div>
      <span class="score"><span class="score-size" aria-hidden="true"></span><span class="score-value"></span></span>`;
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

  _fillRow(item, entry, topScore, paletteSize, isMe, showTrophy, membersTemplate, youLabel) {
    const first = entry.rank === 1 && showTrophy;
    item.dataset.id = entry.id;
    item.toggleAttribute('data-podium', entry.rank <= 3);
    item.toggleAttribute('data-me', isMe);
    const icon = item.querySelector('aha-icon');
    icon.hidden = !first;
    item.querySelector('.rank-number').className = first ? 'rank-number rank-text' : 'rank-number';
    item.querySelector('.rank-number').textContent = String(entry.rank);
    const team = entry.members != null;
    const paletteIndex = Number(entry.colour) || (entry.position % paletteSize) + 1;
    item.style.setProperty('--_fill', team ? `var(--aha-deck-palette-${paletteIndex}, var(--_accent))` : 'var(--_accent)');
    item.style.setProperty('--_on-fill', team ? `var(--aha-deck-palette-${paletteIndex}-ink, var(--_accent-ink))` : 'var(--_accent-ink)');
    const percent = topScore > 0 ? Math.max(0, Math.min(100, (entry.score / topScore) * 100)) : 0;
    item.style.setProperty('--_pct', `${percent}%`);
    item.querySelector('.fill').style.width = `${percent}%`;
    for (const label of item.querySelectorAll('.label')) {
      this._setAvatar(label.querySelector('.avatar'), entry.avatar);
      label.querySelector('.name').textContent = entry.name ?? '';
      const tag = label.querySelector('.tag');
      tag.hidden = !isMe;
      tag.textContent = isMe ? youLabel : '';
      const members = label.querySelector('.members');
      members.hidden = !team;
      members.querySelector('.members-count').textContent = team ? String(entry.members) : '';
      if (team) { members.setAttribute('role', 'img'); members.setAttribute('aria-label', fillTemplate(membersTemplate, { n: entry.members })); }
    }
    this._setScore(item, entry.score);
  }

  _setScore(item, score) {
    const id = item.dataset.id + (item === this._pinned ? ':pinned' : '');
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
    const meId = this.getAttribute('me');
    const paletteSize = Math.max(1, Number(this.getAttribute('palette-size')) || DEFAULT_PALETTE_SIZE);
    const showTrophy = !isFalse(this.getAttribute('trophy'));
    const membersTemplate = this._text('members-label', '{n} members');
    const youLabel = this._text('you-label', 'You');
    this._list.setAttribute('aria-label', this._text('label', 'Leaderboard'));
    this._list.setAttribute('aria-busy', String(loading));

    const before = this._measure();
    const seen = new Set();
    for (const entry of ranked) {
      seen.add(entry.id);
      let item = this._rows.get(entry.id);
      if (!item) { item = this._createRow(); this._rows.set(entry.id, item); }
      this._fillRow(item, entry, topScore, paletteSize, entry.id === meId, showTrophy, membersTemplate, youLabel);
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
    this._meEntry = meEntry && { entry: meEntry, topScore, paletteSize, showTrophy, membersTemplate, youLabel };
    this._fit();
    this._play(before);
  }

  _measure() {
    const rects = new Map();
    for (const [id, item] of this._rows) if (!item.hidden && item.getClientRects().length) rects.set(id, item.getBoundingClientRect().top);
    return rects;
  }

  _play(before) {
    if (reducedMotion()) return;
    for (const [id, item] of this._rows) {
      const previous = before.get(id);
      if (previous == null || item.hidden || !item.getClientRects().length) continue;
      const delta = previous - item.getBoundingClientRect().top;
      if (!delta) continue;
      item.style.transition = 'none';
      item.style.transform = `translateY(${delta}px)`;
      item.getBoundingClientRect();
      item.style.transition = 'transform var(--aha-motion-viz-reorder,.35s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1))';
      item.style.transform = '';
    }
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
    const metrics = this._metrics();
    const rowCount = this.loading ? SKELETON_ROWS : Math.max(1, ranked.length);
    this._sizer.style.height = `${rowCount * (metrics.row + metrics.gap) - metrics.gap}px`;
    const longest = ranked.reduce((max, entry) => Math.max(max, entry.score.toLocaleString().length), 1);
    const widest = ranked.length ? ranked.reduce((best, entry) => (entry.score.toLocaleString().length >= best.length ? entry.score.toLocaleString() : best), '') : '0';
    const sizeText = widest.replace(/\d/g, '8') || '8'.repeat(longest);
    for (const node of this.shadowRoot.querySelectorAll('.score-size')) if (node.textContent !== sizeText) node.textContent = sizeText;

    const height = this._viewport.clientHeight;
    const meId = this.getAttribute('me');
    const meIndex = ranked.findIndex((entry) => entry.id === meId);
    const limit = Number(this.getAttribute('limit')) || Infinity;
    const capped = Math.min(ranked.length, limit);
    let { shown, pinned } = this.loading ? { shown: 0, pinned: false } : fitRows({ height, count: ranked.length, meIndex, ...metrics });
    shown = Math.min(shown, capped);
    if (capped < ranked.length && shown === capped) pinned = meIndex >= shown;
    if (pinned && meIndex < shown) pinned = false;

    ranked.forEach((entry, index) => { this._rows.get(entry.id).hidden = index >= shown; });
    const hiddenCount = ranked.length - shown - (pinned ? 1 : 0);
    const truncated = shown < ranked.length;
    this._more.hidden = !(truncated && hiddenCount > 0);
    this._more.textContent = fillTemplate(this._text('more-label', 'and {n} more'), { n: hiddenCount });
    this._more.setAttribute('aria-hidden', 'false');
    this._pinned.hidden = !pinned;
    if (pinned && this._meEntry) {
      const { entry, topScore, paletteSize, showTrophy, membersTemplate, youLabel } = this._meEntry;
      this._fillRow(this._pinned, entry, topScore, paletteSize, true, showTrophy, membersTemplate, youLabel);
      this._rows.get(entry.id).hidden = true;
    }
  }
}

export function defineAhaLeaderboard(tag = 'aha-leaderboard') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaLeaderboard);
  return true;
}
if (typeof window !== 'undefined') defineAhaLeaderboard();

export default { AhaLeaderboard, defineAhaLeaderboard, rankEntries, fitRows };
