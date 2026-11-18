/**
 * @ahaslides-product/design/aha-audio-track — one row of an audio track list.
 *
 *   import '@ahaslides-product/design/aha-audio-track';   // registers <aha-audio-track> (+ <aha-button>, <aha-icon>)
 *   <aha-audio-track track-title="intro-music.mp3" duration="185"></aha-audio-track>
 *   <aha-audio-track track-title="applause.wav" duration="12" selected playing></aha-audio-track>
 *
 * The compact <aha-audio-player> layout as a list row: a preview play / pause button, the file name
 * (one line, ellipsis) over its duration, and a check when selected. A click anywhere but the preview button selects the row. The row plays nothing itself:
 * the preview button toggles `playing` and emits `play` or `pause`, so the consumer plays the audio
 * and keeps one row playing at a time (remove `playing` from the others, and from this row on ended).
 * Selecting sets `selected` and emits `select`; the consumer clears it on the other rows.
 * Events are composed, bubbling CustomEvents with detail { trackTitle }.
 * Labels for translation: play-label (default "Play preview"), pause-label ("Pause preview").
 * The shadow DOM is built once; attribute changes update persistent nodes.
 */
import './icons.js';
import './aha-button.js';
import { formatAudioTime, AUDIO_ROW_STYLE } from './aha-audio-player.js';
import { upgradeProperties } from './upgrade-properties.js';

const EASE = 'var(--aha-motion-fast,.1s) var(--aha-ease-out,cubic-bezier(0.215,0.61,0.355,1))';
const STYLE = `
  :host{ display:block; font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif) }
  :host([hidden]), [hidden]{ display:none !important }
  ${AUDIO_ROW_STYLE}
  .row{ box-sizing:border-box; display:flex; align-items:center; gap:var(--aha-space-8,8px);
    min-height:56px; padding:var(--aha-space-8,8px); border-radius:var(--aha-radius-default,8px);
    background:var(--aha-bg-container,#FFFFFF); cursor:pointer; transition:background ${EASE} }
  .row:hover{ background:var(--aha-bg-hover,#F7F7F7) }
  :host([selected]) .row, :host([selected]) .row:hover{ background:var(--aha-bg-accent,#E70E680D) }
  .preview{ flex:0 0 auto }
  .select{ flex:1 1 auto; min-width:0; display:flex; align-items:center; gap:var(--aha-space-8,8px);
    margin:0; padding:0 var(--aha-space-4,4px); border:0; border-radius:var(--aha-radius-xs,4px);
    background:transparent; font:inherit; text-align:start; color:var(--aha-text-default,#1A1A1A); cursor:pointer;
    outline:2px solid transparent; outline-offset:0; transition:outline-color ${EASE} }
  .select:focus-visible{ outline-color:var(--aha-border-focus,#E70E68) }
  .info{ flex:1 1 auto }
  .check{ flex:0 0 auto; color:var(--aha-icon-active,#E70E68); opacity:0; transition:opacity ${EASE} }
  :host([selected]) .check{ opacity:1 }
  @media (prefers-reduced-motion: reduce){ .row, .select, .check{ transition:none !important } }
`;

export class AhaAudioTrack extends HTMLElement {
  static get observedAttributes() { return ['track-title', 'duration', 'selected', 'playing', 'play-label', 'pause-label']; }

  get trackTitle() { return this.getAttribute('track-title') || ''; }
  set trackTitle(v) { if (v) this.setAttribute('track-title', String(v)); else this.removeAttribute('track-title'); }
  get selected() { return this.hasAttribute('selected'); }
  set selected(v) { this.toggleAttribute('selected', !!v); }
  get playing() { return this.hasAttribute('playing'); }
  set playing(v) { this.toggleAttribute('playing', !!v); }

  connectedCallback() {
    if (!this.shadowRoot) {
      this._build();
      upgradeProperties(this, ['trackTitle', 'selected', 'playing']);
    }
    this._sync();
  }

  // ds-lint-allow: motion (selected and playing update persistent nodes in _sync; the shadow DOM is built once)
  attributeChangedCallback() { if (this._row) this._sync(); }

  _build() {
    const root = this.attachShadow({ mode: 'open' });
    root.innerHTML = `<style>${STYLE}</style>
      <div class="row" part="row">
        <aha-button class="preview" part="preview" variant="secondary" size="sm" icon-only><aha-icon name="system-play" size="16" decorative></aha-icon></aha-button>
        <button class="select" part="select" type="button" aria-pressed="false">
          <span class="info">
            <span class="title name" part="name"></span>
            <span class="time duration" part="duration"></span>
          </span>
          <aha-icon class="check" name="system-check" size="16" decorative></aha-icon>
        </button>
      </div>`;
    const $ = (s) => root.querySelector(s);
    this._row = $('.row');
    this._preview = $('.preview');
    this._previewIcon = $('.preview aha-icon');
    this._select = $('.select');
    this._name = $('.name');
    this._duration = $('.duration');

    this._preview.addEventListener('click', () => {
      const next = !this.playing;
      this.playing = next;
      this._emit(next ? 'play' : 'pause');
    });
    this._row.addEventListener('click', (event) => {
      if (event.composedPath().includes(this._preview)) return;
      if (!this.selected) this.selected = true;
      this._emit('select');
    });
  }

  _emit(type) {
    this.dispatchEvent(new CustomEvent(type, { bubbles: true, composed: true, detail: { trackTitle: this.trackTitle } }));
  }

  _sync() {
    const title = this.trackTitle;
    this._name.textContent = title;
    const raw = this.getAttribute('duration');
    const seconds = raw == null || raw.trim() === '' ? NaN : Number(raw);
    this._duration.hidden = !Number.isFinite(seconds);
    this._duration.textContent = Number.isFinite(seconds) ? formatAudioTime(seconds) : '';
    this._select.setAttribute('aria-pressed', String(this.selected));
    const playing = this.playing;
    this._previewIcon.setAttribute('name', playing ? 'system-pause' : 'system-play');
    const label = playing ? (this.getAttribute('pause-label') || 'Pause preview') : (this.getAttribute('play-label') || 'Play preview');
    this._preview.setAttribute('aria-label', title ? `${label}: ${title}` : label);
  }
}

export function defineAhaAudioTrack(tag = 'aha-audio-track') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaAudioTrack);
  return true;
}
if (typeof window !== 'undefined') defineAhaAudioTrack();

export default { AhaAudioTrack, defineAhaAudioTrack };
