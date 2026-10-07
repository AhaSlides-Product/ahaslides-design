/**
 * @ahaslides-product/design/audience-deck — the deck theme and submission lock every audience
 * element shares.
 *
 *   import { applyDeck, submissionLock } from '@ahaslides-product/design/audience-deck';
 *   applyDeck(document.documentElement, xprops.slide);      // ink + accent for every <aha-*> below
 *   submissionLock('slide-42').lock(answer);                 // survives an iframe remount
 *
 * An audience page is a cross-origin iframe, so the host's --aha-* variables never reach it. The
 * deck's colours arrive as data (xprops.slide.textColour and presentationColorPalette) and are
 * turned into CSS custom properties here, once, so every audience element inherits them:
 *
 *   --aha-deck-ink                 the deck's text colour, for everything drawn on the deck
 *   --aha-deck-ink-muted           the ink at 65%, for secondary copy (counts, captions, end labels)
 *   --aha-deck-surface(-hover|-disabled)  the frosted panel: the ink's opposite at 80/60/50% (on a dark
 *                                  deck lifted 8% toward the ink, so the panel reads just lighter than the deck)
 *   --aha-deck-edge(-hover)        the 1px ink hairline around that panel, 10% / 60% (every audience border is this one value)
 *   --aha-deck-accent              presentationColorPalette[0], raw
 *   --aha-deck-accent-mark(-hover) the accent deepened until a white mark reads on it (3:1)
 *   --aha-deck-accent-ink          black or white, whichever reads on the accent fill
 *   --aha-deck-accent-hover|-active  the accent one step lighter / darker
 *   --aha-color-primary, --aha-button-primary-bg(-hover|-press|-text)  the same accent, so the DS
 *                                  elements already in the page (<aha-button>, <aha-checkbox>, …) follow it
 *
 * Any element also takes `ink` and `accent` attributes, which set the same variables on that element
 * only. Without either, every variable falls back to the DS light-deck values.
 */

const BRAND_WHITE = '#FFFFFF';
const TEXT_INK = '#1A1A1A';
const SURFACE_ALPHA = { rest: 80, hover: 60, disabled: 50 };
const DARK_DECK_SURFACE_LIFT = 8;
const MUTED_INK_ALPHA = 65;
const EDGE_ALPHA = { rest: 10, hover: 60 };
const STATE_SHIFT = 0.15;
const WHITE_MARK_MIN_CONTRAST = 3;

/** `#hex`, `rgb()/rgba()` or `hsl()/hsla()` to `[r, g, b]`; `null` for a gradient, a variable or empty. */
export function parseColour(value) {
  const text = String(value ?? '').trim().toLowerCase();
  let match = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/.exec(text);
  if (match) {
    let hex = match[1];
    if (hex.length === 3) hex = [...hex].map((c) => c + c).join('');
    return [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
  }
  const clamp = (n) => Math.min(255, Math.max(0, n));
  match = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/.exec(text);
  if (match) return [clamp(+match[1]), clamp(+match[2]), clamp(+match[3])];
  match = /^hsla?\(\s*([\d.]+)(?:deg)?[\s,]+([\d.]+)%[\s,]+([\d.]+)%/.exec(text);
  if (!match) return null;
  const hue = ((+match[1] % 360) + 360) % 360;
  const saturation = Math.min(1, +match[2] / 100);
  const lightness = Math.min(1, +match[3] / 100);
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const x = chroma * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = lightness - chroma / 2;
  const sector = [[chroma, x, 0], [x, chroma, 0], [0, chroma, x], [0, x, chroma], [x, 0, chroma], [chroma, 0, x]][Math.floor(hue / 60) % 6];
  return sector.map((c) => clamp(Math.round((c + m) * 255)));
}

const toHex = (rgb) => '#' + rgb.map((c) => Math.round(c).toString(16).padStart(2, '0')).join('').toUpperCase();
const channel = (c) => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; };
const luminance = ([r, g, b]) => 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
const contrast = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

/** Perceptual (Rec. 601) lightness over 150 of 255. An unparseable colour counts as dark. */
export function isLightColour(value) {
  const rgb = parseColour(value);
  return !!rgb && 0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2] > 150;
}

/** The colour verbatim when a white mark reads on it at 3:1, else the same hue darkened until it does. */
export function deepenForWhiteMark(value) {
  const rgb = parseColour(value);
  if (!rgb) return TEXT_INK;
  if (contrast(luminance(rgb), 1) >= WHITE_MARK_MIN_CONTRAST) return /^#/.test(String(value).trim()) ? toHex(rgb) : String(value).trim();
  for (let step = 1; step <= 20; step += 1) {
    const darker = rgb.map((c) => c * (1 - step * 0.05));
    if (contrast(luminance(darker), 1) >= WHITE_MARK_MIN_CONTRAST) return toHex(darker);
  }
  return TEXT_INK;
}

function shiftColour(value, amount) {
  const rgb = parseColour(value) ?? parseColour('#6A1EBB');
  const target = amount >= 0 ? 255 : 0;
  return toHex(rgb.map((c) => c + (target - c) * Math.abs(amount)));
}
export const hoverShade = (value) => shiftColour(value, STATE_SHIFT);
export const activeShade = (value) => shiftColour(value, -STATE_SHIFT);

/** The label colour for text painted ON a solid fill: the DS text ink or white, whichever contrasts more. */
export function readableTextInk(fill) {
  const rgb = parseColour(fill);
  if (!rgb) return BRAND_WHITE;
  const fillLuminance = luminance(rgb);
  return contrast(fillLuminance, luminance(parseColour(TEXT_INK))) >= contrast(fillLuminance, 1) ? TEXT_INK : BRAND_WHITE;
}

/**
 * The frosted surface an audience control sits on: the ink's opposite at `alpha`%, so the ink reads
 * on it whatever the deck backdrop is, a busy photograph included. Pair it with a backdrop blur.
 */
export function audienceSurface(ink, alpha = SURFACE_ALPHA.rest) {
  const base = isLightColour(ink)
    ? `color-mix(in srgb, var(--aha-gray-100, ${TEXT_INK}) ${100 - DARK_DECK_SURFACE_LIFT}%, ${ink})`
    : `var(--aha-white, ${BRAND_WHITE})`;
  return `color-mix(in srgb, ${base} ${alpha}%, transparent)`;
}

/** The ink hairline around that surface. */
export function audienceBorder(ink, alpha = EDGE_ALPHA.rest) {
  return `color-mix(in srgb, ${ink} ${alpha}%, transparent)`;
}

/** The deck custom properties for a given ink and accent. Either may be omitted. */
export function deckVars({ ink, accent } = {}) {
  const vars = {};
  if (ink) {
    Object.assign(vars, {
      '--aha-deck-ink': ink,
      '--aha-deck-ink-muted': `color-mix(in srgb, ${ink} ${MUTED_INK_ALPHA}%, transparent)`,
      '--aha-deck-surface': audienceSurface(ink, SURFACE_ALPHA.rest),
      '--aha-deck-surface-hover': audienceSurface(ink, SURFACE_ALPHA.hover),
      '--aha-deck-surface-disabled': audienceSurface(ink, SURFACE_ALPHA.disabled),
      '--aha-deck-edge': audienceBorder(ink, EDGE_ALPHA.rest),
      '--aha-deck-edge-hover': audienceBorder(ink, EDGE_ALPHA.hover),
    });
  }
  const markBase = accent || ink;
  if (markBase) {
    const mark = deepenForWhiteMark(markBase);
    vars['--aha-deck-accent-mark'] = mark;
    vars['--aha-deck-accent-mark-hover'] = deepenForWhiteMark(hoverShade(mark));
  }
  if (accent) {
    const accentInk = readableTextInk(accent);
    Object.assign(vars, {
      '--aha-deck-accent': accent,
      '--aha-deck-accent-ink': accentInk,
      '--aha-deck-accent-hover': hoverShade(accent),
      '--aha-deck-accent-active': activeShade(accent),
      '--aha-color-primary': accent,
      '--aha-button-primary-bg': accent,
      '--aha-button-primary-bg-hover': hoverShade(accent),
      '--aha-button-primary-bg-press': activeShade(accent),
      '--aha-button-primary-text': accentInk,
    });
  }
  return vars;
}

const DECK_VAR_NAMES = Object.keys(deckVars({ ink: TEXT_INK, accent: TEXT_INK }));

/**
 * Set the deck variables on `target` (default: the document root) from the host's slide props.
 * Call it again whenever the host sends a new slide. Returns the variables it set.
 */
export function applyDeck(target = document.documentElement, slide = {}) {
  const vars = deckVars({ ink: slide.textColour, accent: (slide.presentationColorPalette || [])[0] });
  for (const name of DECK_VAR_NAMES) {
    if (name in vars) target.style.setProperty(name, vars[name]);
    else target.style.removeProperty(name);
  }
  return vars;
}

/** Keeps an element's own `ink` / `accent` attributes reflected into its deck variables. */
export function syncDeckAttributes(element) {
  const vars = deckVars({ ink: element.getAttribute('ink'), accent: element.getAttribute('accent') });
  for (const name of DECK_VAR_NAMES) {
    if (name in vars) element.style.setProperty(name, vars[name]);
    else element.style.removeProperty(name);
  }
}

/* ---- the submission lock ----
   The audience iframe is torn down and rebuilt whenever the host re-renders the slide (a pivot, a
   reconnect, a phone that slept), so "I already answered" cannot live in an element's memory. It is
   written to sessionStorage, which a cross-origin iframe keeps per tab, and every element carrying
   the same `lock-key` reads it back on mount. Where storage is blocked it falls back to memory, which
   still covers a remount within the page but not a reload. The host's own record stays the source of
   truth: pass its "already submitted" flag too where it has one. */
const LOCK_PREFIX = 'aha-audience-lock:';
const LOCK_EVENT = 'aha-submission-lock';
const memoryLocks = new Map();

function readLock(key) {
  try {
    const stored = sessionStorage.getItem(LOCK_PREFIX + key);
    if (stored != null) return JSON.parse(stored);
  } catch { /* storage blocked or the record is unreadable */ }
  return memoryLocks.get(key) ?? null;
}
function writeLock(key, record) {
  memoryLocks.set(key, record);
  try {
    if (record) sessionStorage.setItem(LOCK_PREFIX + key, JSON.stringify(record));
    else sessionStorage.removeItem(LOCK_PREFIX + key);
  } catch { /* storage blocked: the memory copy still covers a remount within this page */ }
  if (!record) memoryLocks.delete(key);
  document.dispatchEvent(new CustomEvent(LOCK_EVENT, { detail: { key, record } }));
}

/**
 * The lock for one question. `key` must identify the question for this participant, for example
 * `${slide.id}:${round}`. `value` is whatever the participant sent, restored on remount.
 */
export function submissionLock(key) {
  return {
    get locked() { return !!readLock(key); },
    get value() { return readLock(key)?.value; },
    lock(value) { writeLock(key, { value: value ?? null, at: Date.now() }); },
    unlock() { writeLock(key, null); },
  };
}

/**
 * Wires an element's `lock-key` attribute to `onChange(record | null)`: called on connect and on every
 * lock or unlock of that key anywhere in the document. Returns the disconnect function.
 */
export function watchSubmissionLock(element, onChange) {
  const handle = (event) => {
    const key = element.getAttribute('lock-key');
    if (key && event.detail.key === key) onChange(event.detail.record);
  };
  document.addEventListener(LOCK_EVENT, handle);
  const key = element.getAttribute('lock-key');
  onChange(key ? readLock(key) : null);
  return () => document.removeEventListener(LOCK_EVENT, handle);
}

/**
 * The host rules every audience element starts its shadow CSS with: the deck variables resolved to
 * private names, each falling back to the DS light-deck value, and the deck's own font (an audience
 * element never pins the product font: the slide's font has to reach its text and its buttons).
 */
export const DECK_STYLE = `
  :host{ font-family:inherit; color:var(--_ink);
    --_ink:var(--aha-deck-ink, var(--aha-text-default, #1A1A1A));
    --_ink-muted:var(--aha-deck-ink-muted, color-mix(in srgb, var(--_ink) 65%, transparent));
    --_surface:var(--aha-deck-surface, color-mix(in srgb, var(--aha-white, #FFFFFF) 80%, transparent));
    --_surface-hover:var(--aha-deck-surface-hover, color-mix(in srgb, var(--aha-white, #FFFFFF) 60%, transparent));
    --_surface-disabled:var(--aha-deck-surface-disabled, color-mix(in srgb, var(--aha-white, #FFFFFF) 50%, transparent));
    --_edge:var(--aha-deck-edge, color-mix(in srgb, var(--_ink) 10%, transparent));
    --_track:var(--aha-deck-edge, color-mix(in srgb, var(--_ink) 10%, transparent));
    --_edge-hover:var(--aha-deck-edge-hover, color-mix(in srgb, var(--_ink) 60%, transparent));
    --_mark:var(--aha-deck-accent-mark, var(--aha-color-primary, #6A1EBB));
    --_mark-hover:var(--aha-deck-accent-mark-hover, var(--aha-color-primary-hover, #621BAF));
    --_accent:var(--aha-deck-accent, var(--aha-color-primary, #6A1EBB));
    --_accent-ink:var(--aha-deck-accent-ink, var(--aha-white, #FFFFFF));
    --_frost:blur(20px) }
  :host([hidden]){ display:none }
  button{ font:inherit; color:inherit }
`;

/** Base for audience elements: reflects `ink` / `accent` into the deck variables and owns the shadow root. */
export class AudienceElement extends HTMLElement {
  static get deckAttributes() { return ['ink', 'accent']; }
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }
  connectedCallback() { syncDeckAttributes(this); }
  attributeChangedCallback(name) {
    if (name === 'ink' || name === 'accent') syncDeckAttributes(this);
  }
}

export const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

export default { applyDeck, deckVars, syncDeckAttributes, audienceSurface, audienceBorder, submissionLock, watchSubmissionLock, parseColour, isLightColour, deepenForWhiteMark, hoverShade, activeShade, readableTextInk };
