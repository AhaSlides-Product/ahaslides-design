/**
 * @ahaslides-product/design/deck — the one deck token ladder the canvas and the audience phone share.
 *
 *   import { applyDeckTokens } from '@ahaslides-product/design/deck';   // also re-exported by lib/audience.js and lib/canvas.js
 *   applyDeckTokens(document.documentElement, { ink: xprops.slide.textColour });
 *
 * A slide canvas and an audience page are both cross-origin iframes, so the host's --aha-* variables never
 * reach them: the deck's ink arrives as data and is turned into these custom properties here. Every
 * colour is the ink (or its opposite) at a fixed share, so the ladder works for white and black ink:
 *
 *   --aha-deck-ink                                  the deck's text colour
 *   --aha-deck-ink-secondary                        the ink at 76% (secondary copy: counts, captions, labels, units)
 *   --aha-deck-line                                 the ink at 24% (dividers, connector lines)
 *   --aha-deck-stroke-chip                          the ink at 20% (chip, drop area and radio / checkbox outlines)
 *   --aha-deck-stroke | -stroke-hover               the ink at 12% / 60% (panel hairlines and tracks, and their hover)
 *   --aha-deck-fill | -fill-hover | -fill-active    the ink at 8% / 12% / 16% (washes)
 *   --aha-deck-surface(-hover|-disabled)            the frosted panel: the ink's opposite at 80 / 60 / 50% (on a dark
 *                                                   deck lifted 8% toward the ink, so the panel reads just lighter than the deck)
 *   --aha-deck-surface-deep                         equal to the surface on a light deck, Deep Space at 80% on a dark one
 *
 * Deprecated aliases, still emitted so existing consumers keep working:
 *   --aha-deck-ink-muted → --aha-deck-ink-secondary, --aha-deck-edge → --aha-deck-stroke,
 *   --aha-deck-edge-hover → --aha-deck-stroke-hover.
 *
 * applyDeck (audience) and applyCanvasDeck (canvas) both write this ladder; each adds only its own extras
 * (the audience accent set; the canvas button, container and modal variables).
 */

const BRAND_WHITE = '#FFFFFF';
const TEXT_INK = '#1A1A1A';
const SURFACE_ALPHA = { rest: 80, hover: 60, disabled: 50 };
const DARK_DECK_SURFACE_LIFT = 8;
const STROKE_HOVER_ALPHA = 60;
const STATE_SHIFT = 0.15;
const WHITE_MARK_MIN_CONTRAST = 3;

/** `#hex` (3, 4, 6 or 8 digits), `rgb()/rgba()` or `hsl()/hsla()` to `[r, g, b]`; `null` for a gradient, a variable or empty. A hex with alpha is composited over white. */
export function parseColour(value) {
  const text = String(value ?? '').trim().toLowerCase();
  let match = /^#?([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/.exec(text);
  if (match) {
    let hex = match[1];
    if (hex.length <= 4) hex = [...hex].map((c) => c + c).join('');
    const channels = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
    if (hex.length < 8) return channels;
    const alpha = parseInt(hex.slice(6, 8), 16) / 255;
    return channels.map((channel) => Math.round(channel * alpha + 255 * (1 - alpha)));
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
  const rgb = parseColour(value) ?? parseColour('#E70E68');
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
 * The frosted surface a deck control sits on: the ink's opposite at `alpha`%, so the ink reads on it
 * whatever the deck backdrop is, a busy photograph included. Pair it with a backdrop blur.
 */
export function deckSurface(ink, alpha = SURFACE_ALPHA.rest) {
  const base = isLightColour(ink)
    ? `color-mix(in srgb, var(--aha-gray-100, ${TEXT_INK}) ${100 - DARK_DECK_SURFACE_LIFT}%, ${ink})`
    : `var(--aha-white, ${BRAND_WHITE})`;
  return `color-mix(in srgb, ${base} ${alpha}%, transparent)`;
}

/** The deep panel: the same as `deckSurface` on a light deck, Deep Space at `alpha`% on a dark one. */
export function deckSurfaceDeep(ink, alpha = SURFACE_ALPHA.rest) {
  if (!isLightColour(ink)) return deckSurface(ink, alpha);
  return `color-mix(in srgb, var(--aha-bg-dark, #1A1A1A) ${alpha}%, transparent)`;
}

/** The ink at `share`%, read through the chart's `--aha-viz-mix-*` token when one names that share. */
export function inkAt(ink, share, mixToken) {
  return mixToken
    ? `color-mix(in srgb, ${ink} var(--aha-viz-mix-${mixToken}, ${share}%), transparent)`
    : `color-mix(in srgb, ${ink} ${share}%, transparent)`;
}

/** The ink hairline around a deck surface (the `--aha-deck-stroke` share by default). */
export function deckStroke(ink, alpha = 12) {
  return inkAt(ink, alpha);
}

/** The shared `--aha-deck-*` ladder for one ink, deprecated aliases included; `{}` with no ink. */
export function deckTokens(ink) {
  if (!ink) return {};
  return {
    '--aha-deck-ink': ink,
    '--aha-deck-ink-secondary': inkAt(ink, 76, 'secondary'),
    '--aha-deck-line': inkAt(ink, 24, 'axis'),
    '--aha-deck-stroke-chip': inkAt(ink, 20, 'stroke-chip'),
    '--aha-deck-stroke': inkAt(ink, 12, 'stroke'),
    '--aha-deck-stroke-hover': inkAt(ink, STROKE_HOVER_ALPHA),
    '--aha-deck-fill': inkAt(ink, 8, 'track'),
    '--aha-deck-fill-hover': inkAt(ink, 12, 'hover'),
    '--aha-deck-fill-active': inkAt(ink, 16, 'active'),
    '--aha-deck-surface': deckSurface(ink, SURFACE_ALPHA.rest),
    '--aha-deck-surface-hover': deckSurface(ink, SURFACE_ALPHA.hover),
    '--aha-deck-surface-disabled': deckSurface(ink, SURFACE_ALPHA.disabled),
    '--aha-deck-surface-deep': deckSurfaceDeep(ink, SURFACE_ALPHA.rest),
    '--aha-deck-ink-muted': 'var(--aha-deck-ink-secondary)',
    '--aha-deck-edge': 'var(--aha-deck-stroke)',
    '--aha-deck-edge-hover': 'var(--aha-deck-stroke-hover)',
  };
}

export const DECK_TOKEN_NAMES = Object.keys(deckTokens(TEXT_INK));

/** Write `vars` onto `target`, removing every name in `names` that `vars` leaves out. */
export function writeDeckVars(target, names, vars) {
  for (const name of names) {
    if (name in vars) target.style.setProperty(name, vars[name]);
    else target.style.removeProperty(name);
  }
  return vars;
}

/** Set the shared ladder on `target` (default: the document root); call it again on every new slide. */
export function applyDeckTokens(target = document.documentElement, { ink } = {}) {
  return writeDeckVars(target, DECK_TOKEN_NAMES, deckTokens(ink));
}

export default { applyDeckTokens, deckTokens, parseColour, isLightColour, deepenForWhiteMark, hoverShade, activeShade, readableTextInk, deckSurface, deckSurfaceDeep, deckStroke };
