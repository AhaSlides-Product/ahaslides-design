/**
 * @ahaslides-product/design/aha-audio-player — the shared audio player.
 *
 *   import '@ahaslides-product/design/aha-audio-player';   // registers <aha-audio-player> (+ <aha-button>, <aha-slider>, <aha-icon>)
 *   <aha-audio-player src="/media/intro.mp3" track-title="intro-music.mp3"></aha-audio-player>
 *   <aha-audio-player compact src="/media/intro.mp3" track-title="intro-music.mp3"></aha-audio-player>
 *
 * Play / pause, a seek slider with current and total time, mute and a volume slider, around one
 * <audio> element in the shadow root. One row from 400px up; `compact` (and any width under 400px)
 * stacks it in two rows for a narrow side panel: play beside the seek bar, then time, mute and volume.
 * Reuses <aha-button> (primary play, tertiary mute), <aha-slider> (seek and volume) and <aha-icon>.
 *
 * Events (composed, bubbling CustomEvents on the host; the <audio>'s own events never leave the shadow
 * root): play, pause, ended, timeupdate (detail { currentTime, duration }) and volumechange
 * (detail { volume, muted }). The sliders' own input / change events stay inside the player.
 * Properties: currentTime, duration, paused, volume (0 to 1), muted, play(), pause().
 * Labels for translation: play-label, pause-label, mute-label, unmute-label, seek-label, volume-label.
 * The shadow DOM is built once; state changes update attributes on persistent nodes.
 */
import './icons.js';
import './aha-button.js';
import './aha-slider.js';
import { upgradeProperties } from './upgrade-properties.js';

const LABELS = {
  'play-label': 'Play',
  'pause-label': 'Pause',
  'mute-label': 'Mute',
  'unmute-label': 'Unmute',
  'seek-label': 'Seek',
  'volume-label': 'Volume',
};

export function formatAudioTime(seconds) {
  const total = Number.isFinite(seconds) && seconds > 0 ? Math.floor(seconds) : 0;
  const h = Math.floor(total / 3600), m = Math.floor((total % 3600) / 60), s = total % 60;
  const ss = String(s).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`;
}

const STYLE = `
  :host{ display:block; container-type:inline-size; font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif) }
  :host([hidden]), [hidden]{ display:none !important }
  .player{ box-sizing:border-box; padding:var(--aha-space-12,12px); border:1px solid var(--aha-border-default,#E3E3E3);
    border-radius:var(--aha-radius-default,8px); background:var(--aha-bg-container,#FFFFFF) }
  .title{ margin:0 0 var(--aha-space-8,8px); font-size:var(--aha-size-default,14px); line-height:22px;
    font-weight:var(--aha-weight-semibold,600); color:var(--aha-text-default,#1A1A1A);
    overflow:hidden; text-overflow:ellipsis; white-space:nowrap }
  .controls{ display:grid; align-items:center; column-gap:var(--aha-space-8,8px); row-gap:var(--aha-space-4,4px);
    grid-template-columns:auto auto minmax(0,1fr) auto auto 80px;
    grid-template-areas:"play current seek total mute volume" }
  .play{ grid-area:play }
  .current{ grid-area:current }
  .seek{ grid-area:seek; min-width:0 }
  .total{ grid-area:total }
  .mute{ grid-area:mute }
  .volume{ grid-area:volume; min-width:0 }
  .time{ font-size:var(--aha-size-sm,12px); line-height:18px; color:var(--aha-text-tertiary,#616161);
    font-variant-numeric:tabular-nums; white-space:nowrap }
  .of{ display:none }
  .compact-layout{ grid-template-columns:auto auto auto minmax(0,1fr) auto 64px;
    grid-template-areas:"play seek seek seek seek seek" "current of total . mute volume" }
  .compact-layout .of{ display:inline; grid-area:of }
  @container (max-width: 399px){
    .controls{ grid-template-columns:auto auto auto minmax(0,1fr) auto 64px;
      grid-template-areas:"play seek seek seek seek seek" "current of total . mute volume" }
    .of{ display:inline; grid-area:of }
  }
`;

export class AhaAudioPlayer extends HTMLElement {
  static get observedAttributes() {
    return ['src', 'track-title', 'compact', 'muted', ...Object.keys(LABELS)];
  }

  get src() { return this.getAttribute('src') || ''; }
  set src(v) { if (v) this.setAttribute('src', String(v)); else this.removeAttribute('src'); }
  get trackTitle() { return this.getAttribute('track-title') || ''; }
  set trackTitle(v) { if (v) this.setAttribute('track-title', String(v)); else this.removeAttribute('track-title'); }
  get compact() { return this.hasAttribute('compact'); }
  set compact(v) { this.toggleAttribute('compact', !!v); }
  get currentTime() { return this._audio ? this._audio.currentTime || 0 : 0; }
  set currentTime(v) { if (this._audio && Number.isFinite(Number(v))) this._audio.currentTime = Number(v); }
  get duration() { const d = this._audio ? this._audio.duration : NaN; return Number.isFinite(d) ? d : 0; }
  get paused() { return this._audio ? this._audio.paused : true; }
  get volume() { return this._audio ? this._audio.volume : 1; }
  set volume(v) { const n = Number(v); if (this._audio && Number.isFinite(n)) this._audio.volume = Math.min(1, Math.max(0, n)); }
  get muted() { return this._audio ? this._audio.muted : this.hasAttribute('muted'); }
  set muted(v) { if (this._audio) this._audio.muted = !!v; else this.toggleAttribute('muted', !!v); }

  play() {
    if (!this._audio || !this.src) return Promise.resolve();
    try {
      const pending = this._audio.play();
      return pending && typeof pending.catch === 'function' ? pending.catch(() => {}) : Promise.resolve();
    } catch (_) {
      // jsdom has no media playback: play() throws "not implemented"
      return Promise.resolve();
    }
  }
  pause() { if (this._audio) try { this._audio.pause(); } catch (_) { /* jsdom: not implemented */ } }

  connectedCallback() {
    if (!this.shadowRoot) {
      this._build();
      upgradeProperties(this, ['src', 'trackTitle', 'compact', 'currentTime', 'volume', 'muted']);
    }
    this._sync();
  }

  attributeChangedCallback(name) {
    if (!this._audio) return;
    if (name === 'src') this._syncSrc();
    else if (name === 'muted') this._audio.muted = this.hasAttribute('muted');
    else this._sync();
  }

  _label(name) { return this.getAttribute(name) || LABELS[name]; }

  _build() {
    const root = this.attachShadow({ mode: 'open' });
    root.innerHTML = `<style>${STYLE}</style>
      <div class="player" part="player" role="group">
        <div class="title" part="title"></div>
        <div class="controls">
          <aha-button class="play" part="play" variant="primary" size="sm" icon-only><aha-icon name="system-play" size="16" decorative></aha-icon></aha-button>
          <span class="time current" part="current-time">0:00</span>
          <aha-slider class="seek" part="seek" min="0" max="0" step="1" value="0"></aha-slider>
          <span class="time of" aria-hidden="true">/</span>
          <span class="time total" part="total-time">0:00</span>
          <aha-button class="mute" part="mute" variant="tertiary" size="sm" icon-only><aha-icon name="system-speaker-simple-high" size="16" decorative></aha-icon></aha-button>
          <aha-slider class="volume" part="volume" min="0" max="100" step="1" value="100"></aha-slider>
        </div>
        <audio preload="metadata"></audio>
      </div>`;
    const $ = (s) => root.querySelector(s);
    this._group = $('.player');
    this._title = $('.title');
    this._controls = $('.controls');
    this._play = $('.play');
    this._playIcon = $('.play aha-icon');
    this._current = $('.current');
    this._total = $('.total');
    this._seek = $('.seek');
    this._mute = $('.mute');
    this._muteIcon = $('.mute aha-icon');
    this._volume = $('.volume');
    this._audio = $('audio');
    this._audio.muted = this.hasAttribute('muted');

    this._seek.valueText = (v) => formatAudioTime(v);
    const percent = new Intl.NumberFormat(undefined, { style: 'percent' });
    this._volume.valueText = (v) => percent.format(v / 100);

    for (const slider of [this._seek, this._volume]) {
      slider.addEventListener('input', (e) => e.stopPropagation());
      slider.addEventListener('change', (e) => e.stopPropagation());
    }
    this._seek.addEventListener('input', (e) => {
      const value = e.detail && e.detail.value;
      if (!Number.isFinite(value)) return;
      this._audio.currentTime = value;
      this._current.textContent = formatAudioTime(value);
    });
    this._volume.addEventListener('input', (e) => {
      const value = e.detail && e.detail.value;
      if (!Number.isFinite(value)) return;
      this._audio.volume = value / 100;
      if (value > 0 && this._audio.muted) this._audio.muted = false;
    });
    this._play.addEventListener('click', () => { if (this._audio.paused) this.play(); else this.pause(); });
    this._mute.addEventListener('click', () => {
      const audio = this._audio;
      if (audio.muted || audio.volume === 0) {
        if (audio.volume === 0) audio.volume = 1;
        audio.muted = false;
      } else {
        audio.muted = true;
      }
    });

    const audio = this._audio;
    audio.addEventListener('play', () => { this._syncPlaying(); this._emit('play'); });
    audio.addEventListener('pause', () => { this._syncPlaying(); this._emit('pause'); });
    audio.addEventListener('ended', () => { this._syncPlaying(); this._emit('ended'); });
    audio.addEventListener('timeupdate', () => {
      this._syncTime();
      this._emit('timeupdate', { currentTime: this.currentTime, duration: this.duration });
    });
    for (const type of ['loadedmetadata', 'durationchange', 'emptied']) audio.addEventListener(type, () => this._syncDuration());
    audio.addEventListener('volumechange', () => {
      this._syncVolume();
      this._emit('volumechange', { volume: audio.volume, muted: audio.muted });
    });
  }

  _emit(type, detail = {}) {
    this.dispatchEvent(new CustomEvent(type, { bubbles: true, composed: true, detail }));
  }

  _syncSrc() {
    const src = this.src;
    if (src) {
      if (this._audio.getAttribute('src') !== src) this._audio.setAttribute('src', src);
    } else if (this._audio.hasAttribute('src')) {
      this.pause();
      this._audio.removeAttribute('src');
      try { this._audio.load(); } catch (_) { /* jsdom: not implemented */ }
    }
    this._syncDuration();
  }

  _sync() {
    const title = this.trackTitle;
    this._title.textContent = title;
    this._title.hidden = !title;
    this._group.setAttribute('aria-label', title || 'Audio player');
    this._controls.classList.toggle('compact-layout', this.compact);
    this._seek.setAttribute('aria-label', this._label('seek-label'));
    this._volume.setAttribute('aria-label', this._label('volume-label'));
    this._syncSrc();
    this._syncPlaying();
    this._syncVolume();
  }

  _syncPlaying() {
    const playing = !this._audio.paused;
    this.toggleAttribute('playing', playing);
    this._playIcon.setAttribute('name', playing ? 'system-pause' : 'system-play');
    this._play.setAttribute('aria-label', this._label(playing ? 'pause-label' : 'play-label'));
    this._play.toggleAttribute('disabled', !this.src);
  }

  _syncDuration() {
    const duration = this.duration;
    this._seek.setAttribute('max', String(Math.floor(duration)));
    this._seek.toggleAttribute('disabled', !this.src || !duration);
    this._total.textContent = formatAudioTime(duration);
    this._syncTime();
    this._syncPlaying();
  }

  _syncTime() {
    const time = this.currentTime;
    this._current.textContent = formatAudioTime(time);
    if (!this._seek.hasAttribute('_dragging')) this._seek.setAttribute('value', String(Math.floor(time)));
  }

  _syncVolume() {
    const audio = this._audio;
    const silent = audio.muted || audio.volume === 0;
    this._muteIcon.setAttribute('name', silent ? 'system-speaker-simple-slash' : 'system-speaker-simple-high');
    this._mute.setAttribute('aria-label', this._label(silent ? 'unmute-label' : 'mute-label'));
    this._volume.setAttribute('value', String(audio.muted ? 0 : Math.round(audio.volume * 100)));
  }
}

export function defineAhaAudioPlayer(tag = 'aha-audio-player') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaAudioPlayer);
  return true;
}
if (typeof window !== 'undefined') defineAhaAudioPlayer();

export default { AhaAudioPlayer, defineAhaAudioPlayer, formatAudioTime };
