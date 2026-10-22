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
 *   the shared --aha-deck-* ladder         from '@ahaslides-product/design/deck', the same one the canvas
 *                                          uses: --aha-deck-ink, -ink-secondary (76%), -line, -stroke-chip
 *                                          (20%: chips, drop areas, radio / checkbox controls), -stroke (12%:
 *                                          panel hairlines and tracks), -stroke-hover (60%), -fill(-hover|-active),
 *                                          -surface(-hover|-disabled|-deep). The old --aha-deck-ink-muted,
 *                                          -edge and -edge-hover are still emitted as deprecated aliases.
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

import {
  parseColour, isLightColour, deepenForWhiteMark, hoverShade, activeShade, readableTextInk,
  deckSurface, deckSurfaceDeep, deckStroke, deckTokens, writeDeckVars,
} from './deck.js';

export { parseColour, isLightColour, deepenForWhiteMark, hoverShade, activeShade, readableTextInk };
/** @deprecated use `deckSurface` from '@ahaslides-product/design/deck'. */
export const audienceSurface = deckSurface;
/** @deprecated use `deckSurfaceDeep` from '@ahaslides-product/design/deck'. */
export const audienceSurfaceDeep = deckSurfaceDeep;
/** @deprecated use `deckStroke` from '@ahaslides-product/design/deck'. */
export const audienceBorder = deckStroke;

const TEXT_INK = '#1A1A1A';

/** The deck custom properties for a given ink and accent: the shared ladder plus the audience accent set. Either may be omitted. */
export function deckVars({ ink, accent } = {}) {
  const vars = deckTokens(ink);
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
  return writeDeckVars(target, DECK_VAR_NAMES, deckVars({ ink: slide.textColour, accent: (slide.presentationColorPalette || [])[0] }));
}

/** Keeps an element's own `ink` / `accent` attributes reflected into its deck variables. */
export function syncDeckAttributes(element) {
  writeDeckVars(element, DECK_VAR_NAMES, deckVars({ ink: element.getAttribute('ink'), accent: element.getAttribute('accent') }));
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
    --_ink-secondary:var(--aha-deck-ink-secondary, var(--aha-deck-ink-muted, color-mix(in srgb, var(--_ink) 76%, transparent)));
    --_surface:var(--aha-deck-surface, color-mix(in srgb, var(--aha-white, #FFFFFF) 80%, transparent));
    --_surface-hover:var(--aha-deck-surface-hover, color-mix(in srgb, var(--aha-white, #FFFFFF) 60%, transparent));
    --_surface-disabled:var(--aha-deck-surface-disabled, color-mix(in srgb, var(--aha-white, #FFFFFF) 50%, transparent));
    --_surface-deep:var(--aha-deck-surface-deep, var(--_surface));
    --_stroke:var(--aha-deck-stroke, var(--aha-deck-edge, color-mix(in srgb, var(--_ink) 12%, transparent)));
    --_track:var(--_stroke);
    --_stroke-chip:var(--aha-deck-stroke-chip, color-mix(in srgb, var(--_ink) 20%, transparent));
    --_stroke-hover:var(--aha-deck-stroke-hover, var(--aha-deck-edge-hover, color-mix(in srgb, var(--_ink) 60%, transparent)));
    --_mark:var(--aha-deck-accent-mark, var(--aha-color-primary, #E70E68));
    --_mark-hover:var(--aha-deck-accent-mark-hover, var(--aha-color-primary-hover, #DB005B));
    --_accent:var(--aha-deck-accent, var(--aha-color-primary, #E70E68));
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

export default { applyDeck, deckVars, deckTokens, syncDeckAttributes, audienceSurface, audienceBorder, submissionLock, watchSubmissionLock, parseColour, isLightColour, deepenForWhiteMark, hoverShade, activeShade, readableTextInk };
