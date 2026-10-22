/**
 * @ahaslides-product/design/canvas-deck — the deck theme for presenter controls drawn on the canvas.
 *
 *   import { applyCanvasDeck } from '@ahaslides-product/design/canvas';
 *   applyCanvasDeck(document.documentElement, {
 *     accent: xprops.presentationColorPalette[0],
 *     ink: xprops.slide.textColour,
 *     background: xprops.slide.baseColour,
 *     image: Boolean(xprops.slide.backgroundImage),
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
 * and the deck ladder every canvas component (<aha-canvas-count>, <aha-canvas-status>, <aha-stepper>)
 * and any canvas modal reads. Each is the ink at a fixed share, so it works for white and black ink:
 *
 *   --aha-deck-ink-secondary                      the ink at 76% (labels, units, done steps)
 *   --aha-deck-line | -stroke-chip | -stroke      the ink at 24% / 20% / 12% (lines, chip and panel strokes)
 *   --aha-deck-fill | -fill-hover | -fill-active  the ink at 8% / 12% / 16% (washes)
 *   --aha-deck-surface                            the opposite of the ink at 80% (white under black ink,
 *                                                 near-black under white ink) — the frosted panel
 *   --aha-deck-container-fill                     a rounded container: the fill on a solid deck, the
 *                                                 surface when `image` is set (a photo deck)
 *   --aha-deck-container-stroke | -stroke-empty   its 1px stroke (20%), and the dashed 1px stroke of an
 *                                                 empty slot (24%)
 *   --aha-deck-container-radius-lg | -radius-sm   12px (panels, modals) / 8px (chips, counters)
 *   --aha-deck-container-padding-sm | -md | -lg   12px / 20px / 32px
 *   --aha-deck-modal-fill | -modal-backdrop       a modal panel (the surface at 92%: white under black ink,
 *                                                 Deep Space under white ink) and the scrim behind it (black 40%)
 *
 * Any of the four may be omitted; its variables are then removed and fall back to the DS values.
 */
import { parseColour, readableTextInk, audienceSurface, audienceSurfaceDeep } from './audience-deck.js';

const HOVER_DARKEN = 0.12;
const PRESS_DARKEN = 0.22;
const TEXT_INK = '#1A1A1A';
const WHITE_LABEL_CHIP = 'rgba(0,0,0,.2)';
const DARK_LABEL_CHIP = `color-mix(in srgb, var(--aha-text-default, ${TEXT_INK}) 10%, transparent)`;

const SURFACE_ALPHA = 80;
const MODAL_ALPHA = 92;

const inkAt = (ink, share, fallback) => `color-mix(in srgb, ${ink} var(--aha-viz-mix-${share}, ${fallback}%), transparent)`;

const CONTAINER_VARS = {
  '--aha-deck-container-radius-lg': 'var(--aha-radius-lg, 12px)',
  '--aha-deck-container-radius-sm': 'var(--aha-radius-default, 8px)',
  '--aha-deck-container-padding-sm': 'var(--aha-space-12, 12px)',
  '--aha-deck-container-padding-md': 'var(--aha-space-20, 20px)',
  '--aha-deck-container-padding-lg': 'var(--aha-space-32, 32px)',
  '--aha-deck-modal-backdrop': `color-mix(in srgb, var(--aha-black, ${TEXT_INK}) 40%, transparent)`,
};

function inkLadder(ink, image) {
  const surface = audienceSurface(ink, SURFACE_ALPHA);
  const fill = inkAt(ink, 'track', 8);
  const strokeChip = inkAt(ink, 'stroke-chip', 20);
  const line = inkAt(ink, 'axis', 24);
  return {
    '--aha-deck-ink-secondary': inkAt(ink, 'secondary', 76),
    '--aha-deck-line': line,
    '--aha-deck-stroke-chip': strokeChip,
    '--aha-deck-stroke': inkAt(ink, 'stroke', 12),
    '--aha-deck-fill': fill,
    '--aha-deck-fill-hover': inkAt(ink, 'hover', 12),
    '--aha-deck-fill-active': inkAt(ink, 'active', 16),
    '--aha-deck-surface': surface,
    '--aha-deck-container-fill': image ? surface : fill,
    '--aha-deck-container-stroke': strokeChip,
    '--aha-deck-container-stroke-empty': line,
    '--aha-deck-modal-fill': audienceSurfaceDeep(ink, MODAL_ALPHA),
  };
}

function darken(value, amount) {
  const rgb = parseColour(value);
  if (!rgb) return `color-mix(in srgb, ${value} ${Math.round((1 - amount) * 100)}%, rgb(0 0 0))`;
  return '#' + rgb.map((channel) => Math.round(channel * (1 - amount)).toString(16).padStart(2, '0')).join('').toUpperCase();
}

/** The canvas button variables for a deck. */
export function canvasDeckVars({ accent, ink, background, image = false } = {}) {
  const vars = { '--aha-button-elevate-primary-hover': 'var(--aha-button-elevate-primary, 0 2px 0 0 rgba(0,0,0,.04))', ...CONTAINER_VARS };
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
  if (ink) Object.assign(vars, { '--aha-deck-ink': ink, '--aha-button-focus-ring': ink }, inkLadder(ink, image));
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
