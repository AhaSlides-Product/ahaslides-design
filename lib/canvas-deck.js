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
 * the shared deck ladder from '@ahaslides-product/design/deck' (the same one applyDeck writes on the audience
 * phone): --aha-deck-ink-secondary (76%), -line (24%), -stroke-chip (20%), -stroke (12%), -stroke-hover (60%),
 * -fill | -fill-hover | -fill-active (8 / 12 / 16%), -surface(-hover|-disabled|-deep), plus the deprecated
 * -ink-muted, -edge and -edge-hover aliases. Every canvas component (<aha-canvas-count>, <aha-canvas-status>,
 * <aha-stepper>) reads it. On top of it the canvas adds its container and modal set:
 *
 *   --aha-deck-container-fill                     a rounded container: the fill on a solid deck, the
 *                                                 surface when `image` is set (a photo deck)
 *   --aha-deck-container-stroke | -stroke-empty   its 1px stroke (20%), and the dashed 1px stroke of an
 *                                                 empty slot (24%)
 *   --aha-deck-container-radius-lg | -radius-sm   12px (panels, modals) / 8px (chips, counters)
 *   --aha-deck-container-padding-sm | -md | -lg   12px / 20px / 32px
 *   --aha-deck-modal-fill | -modal-backdrop       a modal panel (the surface at 92%: white under black ink,
 *                                                 Deep Space under white ink) and the scrim behind it (black 40%)
 *
 * An optional `palette` (the deck's presentationColorPalette, an array of colours) writes one fill and one ink per colour,
 * 1-based like --aha-viz-series-N, so a container filled with a palette colour is styled with tokens only:
 *
 *   --aha-deck-palette-<n>                        the palette colour
 *   --aha-deck-palette-<n>-ink                    #1A1A1A or white, whichever contrasts more on it (AA)
 *
 * Any of the five may be omitted; its variables are then removed and fall back to the DS values.
 */
import { parseColour, readableTextInk, deckSurfaceDeep, deckTokens, writeDeckVars } from './deck.js';

const HOVER_DARKEN = 0.12;
const PRESS_DARKEN = 0.22;
const TEXT_INK = '#1A1A1A';
const WHITE_LABEL_CHIP = 'rgba(0,0,0,.2)';
const DARK_LABEL_CHIP = `color-mix(in srgb, var(--aha-text-default, ${TEXT_INK}) 10%, transparent)`;

const MODAL_ALPHA = 92;
const PALETTE_LIMIT = 24;

const CONTAINER_VARS = {
  '--aha-deck-container-radius-lg': 'var(--aha-radius-lg, 12px)',
  '--aha-deck-container-radius-sm': 'var(--aha-radius-default, 8px)',
  '--aha-deck-container-padding-sm': 'var(--aha-space-12, 12px)',
  '--aha-deck-container-padding-md': 'var(--aha-space-20, 20px)',
  '--aha-deck-container-padding-lg': 'var(--aha-space-32, 32px)',
  '--aha-deck-modal-backdrop': `color-mix(in srgb, var(--aha-black, ${TEXT_INK}) 40%, transparent)`,
};

function canvasLadder(ink, image) {
  const ladder = deckTokens(ink);
  return {
    ...ladder,
    '--aha-deck-container-fill': image ? ladder['--aha-deck-surface'] : ladder['--aha-deck-fill'],
    '--aha-deck-container-stroke': ladder['--aha-deck-stroke-chip'],
    '--aha-deck-container-stroke-empty': ladder['--aha-deck-line'],
    '--aha-deck-modal-fill': deckSurfaceDeep(ink, MODAL_ALPHA),
  };
}

function darken(value, amount) {
  const rgb = parseColour(value);
  if (!rgb) return `color-mix(in srgb, ${value} ${Math.round((1 - amount) * 100)}%, rgb(0 0 0))`;
  return '#' + rgb.map((channel) => Math.round(channel * (1 - amount)).toString(16).padStart(2, '0')).join('').toUpperCase();
}

/** The canvas variables for a deck: the shared ladder plus the button, container and modal extras. */
export function canvasDeckVars({ accent, ink, background, image = false, palette } = {}) {
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
  if (ink) Object.assign(vars, { '--aha-button-focus-ring': ink }, canvasLadder(ink, image));
  if (background) vars['--aha-button-focus-gap'] = background;
  if (Array.isArray(palette)) {
    palette.slice(0, PALETTE_LIMIT).forEach((colour, index) => {
      if (!colour) return;
      vars[`--aha-deck-palette-${index + 1}`] = colour;
      vars[`--aha-deck-palette-${index + 1}-ink`] = readableTextInk(colour);
    });
  }
  return vars;
}

const PALETTE_VAR_NAMES = Array.from({ length: PALETTE_LIMIT }, (_, index) => [`--aha-deck-palette-${index + 1}`, `--aha-deck-palette-${index + 1}-ink`]).flat();
const CANVAS_VAR_NAMES = [...Object.keys(canvasDeckVars({ accent: TEXT_INK, ink: TEXT_INK, background: TEXT_INK })), ...PALETTE_VAR_NAMES];

/** Set the canvas deck variables on `target`; call it again whenever the host sends a new slide. */
export function applyCanvasDeck(target = document.documentElement, deck = {}) {
  return writeDeckVars(target, CANVAS_VAR_NAMES, canvasDeckVars(deck));
}
