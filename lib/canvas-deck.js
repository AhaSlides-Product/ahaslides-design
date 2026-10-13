/**
 * @ahaslides-product/design/canvas-deck — the deck theme for presenter controls drawn on the canvas.
 *
 *   import { applyCanvasDeck } from '@ahaslides-product/design/canvas';
 *   applyCanvasDeck(document.documentElement, {
 *     accent: xprops.presentationColorPalette[0],
 *     ink: xprops.slide.textColour,
 *     background: xprops.slide.baseColour,
 *   });
 *
 * The canvas is a cross-origin iframe, so the deck reaches it as data. This turns it into the
 * button variables every <aha-button> below `target` reads, so the canvas controls follow the deck
 * and nothing outside the canvas changes:
 *
 *   --aha-color-primary, --aha-button-primary-bg   the accent
 *   --aha-button-primary-bg-hover | -press        the accent 12% / 22% darker
 *   --aha-button-primary-text                     black or white, whichever reads on the accent
 *   --aha-button-primary-shortcut-bg              the shortcut chip wash: black 20% under a white
 *                                                 label, the ink at 10% under a black one
 *   --aha-button-elevate-primary-hover            the rest elevation, so hover is a fill change only
 *   --aha-deck-ink, --aha-button-focus-ring       the deck ink (tertiary-deck label, focus ring)
 *   --aha-button-focus-gap                        the deck background, between button and ring
 *
 * Any of the three may be omitted; its variables are then removed and fall back to the DS values.
 */
import { parseColour, readableTextInk } from './audience-deck.js';

const HOVER_DARKEN = 0.12;
const PRESS_DARKEN = 0.22;
const TEXT_INK = '#1A1A1A';
const WHITE_LABEL_CHIP = 'rgba(0,0,0,.2)';
const DARK_LABEL_CHIP = `color-mix(in srgb, var(--aha-text-default, ${TEXT_INK}) 10%, transparent)`;

function darken(value, amount) {
  const rgb = parseColour(value);
  if (!rgb) return `color-mix(in srgb, ${value} ${Math.round((1 - amount) * 100)}%, rgb(0 0 0))`;
  return '#' + rgb.map((channel) => Math.round(channel * (1 - amount)).toString(16).padStart(2, '0')).join('').toUpperCase();
}

/** The canvas button variables for a deck. */
export function canvasDeckVars({ accent, ink, background } = {}) {
  const vars = { '--aha-button-elevate-primary-hover': 'var(--aha-button-elevate-primary, 0 2px 0 0 rgba(0,0,0,.04))' };
  if (accent) {
    const label = readableTextInk(accent);
    Object.assign(vars, {
      '--aha-color-primary': accent,
      '--aha-button-primary-bg': accent,
      '--aha-button-primary-bg-hover': darken(accent, HOVER_DARKEN),
      '--aha-button-primary-bg-press': darken(accent, PRESS_DARKEN),
      '--aha-button-primary-text': label,
      '--aha-button-primary-shortcut-bg': label === TEXT_INK ? DARK_LABEL_CHIP : WHITE_LABEL_CHIP,
    });
  }
  if (ink) Object.assign(vars, { '--aha-deck-ink': ink, '--aha-button-focus-ring': ink });
  if (background) vars['--aha-button-focus-gap'] = background;
  return vars;
}

const CANVAS_VAR_NAMES = Object.keys(canvasDeckVars({ accent: TEXT_INK, ink: TEXT_INK, background: TEXT_INK }));

/** Set the canvas deck variables on `target`; call it again whenever the host sends a new slide. */
export function applyCanvasDeck(target = document.documentElement, deck = {}) {
  const vars = canvasDeckVars(deck);
  for (const name of CANVAS_VAR_NAMES) {
    if (name in vars) target.style.setProperty(name, vars[name]);
    else target.style.removeProperty(name);
  }
  return vars;
}
