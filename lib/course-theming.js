/**
 * @ahaslides-product/design/course-theme — re-skins every <aha-*> product component under a
 * customer's course theme.
 *
 *   import { applyCourseTheme } from '@ahaslides-product/design/course-theme';
 *   applyCourseTheme(lessonRoot, { primary: '#E70E68', surface: '#FFFFFF', pageBg: '#F5F5F5', textBody: '#1A1A1A' });
 *
 * A course theme is customer content (colour rule 9.1): the trainer picks it, so its values are not
 * checked against the AhaSlides palette. What the DS guarantees instead is that every component stays
 * readable under it. `courseThemeVars` turns the theme into a flat set of --aha-* values, with every
 * colour a component paints on derived from the theme and floored on every state:
 *
 *   text, secondary text                               4.5:1 on the surface, the page and the hover tints
 *   links 4.5:1 on the surface, link hover also on the accent tint (on grey and tints text is ink: rule 6)
 *   primary fill at rest, hover and press              3:1 on the surface and the page, and its label 4.5:1 on each
 *   focus ring, hover / focus / active borders         3:1 on the surface and the page
 *   tertiary text                                      4.5:1 on the surface, the page and the hover tints
 *   placeholder, muted icons                           never below the ratio the DS default theme ships
 *   disabled                                           not floored (WCAG exempts disabled controls)
 *
 * Neutrals (fills, borders, the gray ramp the components read) are the theme's text colour at the share
 * of #1A1A1A each DS grey has over white, so the default theme (white surface, #1A1A1A text) reproduces
 * the DS values exactly, and a dark theme gets the same ladder inverted.
 *
 * The values are resolved, never var() references: --aha-text-link and friends are aliases computed on
 * :root, so overriding only --aha-color-primary on a lower element would leave them on Vivid Pink.
 */

import { tokens } from './tokens.js';
import { parseColour, isLightColour, writeDeckVars } from './deck.js';

/** The inputs a course theme may set. Anything else is ignored. */
export const COURSE_THEME_INPUTS = ['primary', 'pageBg', 'surface', 'textBody', 'textHeading', 'accent', 'fontBody', 'fontHeading', 'radius'];

export const COURSE_THEME_FLOORS = { text: 4.5, graphic: 3 };
const RADIUS_RANGE = [0, 16];
const DEFAULT_INK = { light: tokens.color.primitives.black, dark: tokens.color.primitives.gray[10] };
const WHITE = tokens.color.primitives.white;
const GRAY = tokens.color.primitives.gray;

const toHex = (rgb) => '#' + rgb.map((c) => Math.round(Math.min(255, Math.max(0, c))).toString(16).padStart(2, '0')).join('').toUpperCase();
const channel = (c) => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; };
const luminance = ([r, g, b]) => 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);

/** WCAG contrast ratio of two colours; `0` when either cannot be parsed. */
export function contrastRatio(a, b) {
  const x = parseColour(a);
  const y = parseColour(b);
  if (!x || !y) return 0;
  const [high, low] = [luminance(x), luminance(y)].sort((p, q) => q - p);
  return (high + 0.05) / (low + 0.05);
}

function mix(ink, ground, share) {
  const a = parseColour(ink);
  const b = parseColour(ground);
  return toHex(b.map((c, i) => c + (a[i] - c) * share));
}

const grayShare = (step) => (255 - parseColour(GRAY[step])[0]) / (255 - parseColour(GRAY[100])[0]);
const minContrast = (colour, grounds) => Math.min(...grounds.map((ground) => contrastRatio(colour, ground)));

/**
 * `colour` moved toward black or white, whichever lifts it from `grounds` faster, until it reaches `ratio`
 * against every ground. Returned unchanged when it already does.
 */
export function floorContrast(colour, grounds, ratio) {
  if (minContrast(colour, grounds) >= ratio) return toHex(parseColour(colour));
  const candidates = [DEFAULT_INK.light, WHITE].map((pole) => {
    for (let step = 1; step <= 40; step += 1) {
      const moved = mix(pole, colour, step / 40);
      if (minContrast(moved, grounds) >= ratio) return { moved, step };
    }
    return { moved: pole, step: 41 };
  });
  candidates.sort((a, b) => a.step - b.step || minContrast(b.moved, grounds) - minContrast(a.moved, grounds));
  return candidates[0].moved;
}

function readableSolidFill(fill, grounds) {
  let best = null;
  for (const label of [DEFAULT_INK.light, WHITE]) {
    const away = isLightColour(label) ? DEFAULT_INK.light : WHITE;
    for (let step = 0; step <= 40; step += 1) {
      const candidate = step ? mix(away, fill, step / 40) : toHex(parseColour(fill));
      if (contrastRatio(label, candidate) >= COURSE_THEME_FLOORS.text && minContrast(candidate, grounds) >= COURSE_THEME_FLOORS.graphic) {
        if (!best || step < best.step) best = { fill: candidate, label, step };
        break;
      }
    }
  }
  return best ?? { fill: DEFAULT_INK.light, label: WHITE, step: 41 };
}

function stateShade(fill, label, share, grounds) {
  const away = isLightColour(label) ? DEFAULT_INK.light : WHITE;
  const shade = mix(away, fill, share);
  return minContrast(shade, grounds) >= COURSE_THEME_FLOORS.graphic ? shade : fill;
}

function radiusLadder(radius) {
  const r = Math.min(Math.max(Number(radius), RADIUS_RANGE[0]), RADIUS_RANGE[1]);
  const base = tokens.radius.default;
  const scale = (value) => `${Math.round((value * r) / base)}px`;
  return {
    '--aha-radius-xs': scale(tokens.radius.xs),
    '--aha-radius-sm': scale(tokens.radius.sm),
    '--aha-radius-default': scale(tokens.radius.default),
    '--aha-radius-lg': scale(tokens.radius.lg),
    '--aha-radius-xl': scale(tokens.radius.xl),
  };
}

/**
 * The --aha-* values for a course theme. Every input is optional: an unset colour falls back to the DS
 * light theme (or its dark counterpart when the surface is dark), an unset font or radius leaves the DS
 * value in place.
 */
export function courseThemeVars(theme = {}) {
  const surface = parseColour(theme.surface) ? toHex(parseColour(theme.surface)) : WHITE;
  const dark = !isLightColour(surface);
  const rawInk = parseColour(theme.textBody) ? theme.textBody : (dark ? DEFAULT_INK.dark : DEFAULT_INK.light);
  const neutralAt = (ink, step) => mix(ink, surface, grayShare(step));
  const page = parseColour(theme.pageBg) ? toHex(parseColour(theme.pageBg)) : neutralAt(rawInk, 20);

  let ink = floorContrast(rawInk, [surface, page], COURSE_THEME_FLOORS.text);
  const textGrounds = () => [surface, page, neutralAt(ink, 20), neutralAt(ink, 25), neutralAt(ink, 30)];
  ink = floorContrast(ink, textGrounds(), COURSE_THEME_FLOORS.text);

  const neutrals = {};
  for (const step of Object.keys(GRAY)) neutrals[step] = step === '0' ? surface : neutralAt(ink, step);
  const reference = (step) => contrastRatio(GRAY[step], WHITE);
  const hover = neutrals[20];
  const secondary = floorContrast(neutrals[90], textGrounds(), COURSE_THEME_FLOORS.text);
  const tertiary = floorContrast(neutrals[80], textGrounds(), COURSE_THEME_FLOORS.text);
  const iconMuted = floorContrast(neutrals[70], [surface], reference(70));
  const placeholder = floorContrast(mix(ink, surface, (255 - parseColour(tokens.color.textPlaceholder)[0]) / (255 - parseColour(GRAY[100])[0])), [surface], contrastRatio(tokens.color.textPlaceholder, WHITE));

  const grounds = [surface, page];
  const { fill: primary, label: onPrimary } = readableSolidFill(parseColour(theme.primary) ? theme.primary : tokens.color.primary, grounds);
  const brandDefault = primary === tokens.color.primary && onPrimary === WHITE
    && minContrast(tokens.color.primaryHover, grounds) >= COURSE_THEME_FLOORS.graphic && minContrast(tokens.color.primaryActive, grounds) >= COURSE_THEME_FLOORS.graphic;
  const primaryHover = brandDefault ? tokens.color.primaryHover : stateShade(primary, onPrimary, 0.06, grounds);
  const primaryPress = brandDefault ? tokens.color.primaryActive : stateShade(primary, onPrimary, 0.12, grounds);
  const accentTint = mix(primary, surface, 0.05);
  const link = floorContrast(brandDefault ? tokens.color.textLink : primary, [surface, neutrals[25], accentTint], COURSE_THEME_FLOORS.text);
  const linkHover = floorContrast(primaryPress, [surface, accentTint], COURSE_THEME_FLOORS.text);
  const ring = floorContrast(primary, [surface, page, hover], COURSE_THEME_FLOORS.graphic);
  const ringPress = floorContrast(primaryPress, [surface, page, hover], COURSE_THEME_FLOORS.graphic);
  const [r, g, b] = parseColour(ring);
  const [pr, pg, pb] = parseColour(primary);

  const dangerHover = floorContrast(neutrals[90], [surface], COURSE_THEME_FLOORS.text);
  const dangerPress = floorContrast(neutrals[80], [surface], COURSE_THEME_FLOORS.text);

  const vars = {
    '--aha-color-primary': primary,
    '--aha-color-primary-hover': primaryHover,
    '--aha-color-primary-active': primaryPress,
    '--aha-color-success': ink, '--aha-color-warning': ink, '--aha-color-error': ink, '--aha-color-info': ink,

    '--aha-text-default': ink,
    '--aha-text-secondary': secondary,
    '--aha-text-tertiary': tertiary,
    '--aha-text-placeholder': placeholder,
    '--aha-text-disabled': neutrals[60],
    '--aha-text-link': link,
    '--aha-text-link-hover': linkHover,
    '--aha-text-primary-ink': secondary,
    '--aha-text-positive': ink, '--aha-text-negative': ink, '--aha-text-warning': ink,

    '--aha-bg-base': surface,
    '--aha-bg-container': surface,
    '--aha-bg-container-secondary': hover,
    '--aha-bg-container-disabled': neutrals[30],
    '--aha-bg-elevated': surface,
    '--aha-bg-layout': page,
    '--aha-bg-accent': accentTint,
    '--aha-bg-informative': surface, '--aha-bg-positive': surface, '--aha-bg-negative': surface,
    '--aha-bg-warning': surface, '--aha-bg-warning-subtle': surface,
    '--aha-bg-hover': hover,

    '--aha-border-default': neutrals[40],
    '--aha-border': neutrals[40],
    '--aha-border-input': neutrals[50],
    '--aha-border-secondary': neutrals[30],
    '--aha-border-strong': neutrals[50],
    '--aha-border-disabled': neutrals[35],
    '--aha-border-hover': ring,
    '--aha-border-focus': ring,
    '--aha-border-active': ringPress,
    '--aha-border-error': ink, '--aha-border-success': ink, '--aha-border-warning': ink, '--aha-border-info': ink,
    '--aha-split': neutrals[30],
    '--aha-checkbox-border': neutrals[50],

    '--aha-icon-default': secondary,
    '--aha-icon-strong': ink,
    '--aha-icon-muted': iconMuted,
    '--aha-icon-disabled': neutrals[60],
    '--aha-icon-active': ring,

    '--aha-focus': ring,
    '--aha-focus-ring': ring,
    '--aha-focus-ring-soft': `rgba(${r},${g},${b},.3)`,

    '--aha-btn-primary-bg': primary,
    '--aha-btn-primary-bg-hover': primaryHover,
    '--aha-btn-primary-bg-press': primaryPress,
    '--aha-btn-primary-fg': onPrimary,
    '--aha-btn-secondary-bg': surface,
    '--aha-btn-secondary-bg-hover': accentTint,
    '--aha-btn-secondary-border': neutrals[40],
    '--aha-btn-secondary-border-hover': ring,
    '--aha-btn-secondary-border-press': ringPress,
    '--aha-btn-tertiary-bg-hover': accentTint,
    '--aha-btn-tertiary-bg-active': accentTint,
    '--aha-btn-disabled-bg': neutrals[40],
    '--aha-btn-disabled-fg': neutrals[60],
    '--aha-btn-danger-bg': ink,
    '--aha-btn-danger-bg-hover': dangerHover,
    '--aha-btn-danger-bg-press': dangerPress,
    '--aha-btn-danger-ring': ink,
    '--aha-btn-positive-bg': primary,
    '--aha-btn-positive-bg-hover': primaryHover,
    '--aha-btn-positive-bg-press': primaryPress,
    '--aha-btn-positive-fg': onPrimary,
    '--aha-btn-focus-ring': ring,
    '--aha-btn-focus-ring-success': ink,
    '--aha-btn-elevate-primary-hover': `0 4px 12px rgba(${pr},${pg},${pb},.32)`,
    '--aha-btn-encourage-bg': primary,
    '--aha-btn-encourage-bg-hover': primaryHover,
    '--aha-btn-encourage-bg-press': primaryPress,

    '--aha-button-primary-bg': primary,
    '--aha-button-primary-bg-hover': primaryHover,
    '--aha-button-primary-bg-press': primaryPress,
    '--aha-button-primary-text': onPrimary,
    '--aha-button-default-bg': surface,
    '--aha-button-default-text': ink,
    '--aha-button-default-border': neutrals[40],
    '--aha-button-default-bg-hover': accentTint,
    '--aha-button-default-text-hover': linkHover,
    '--aha-button-default-border-hover': ring,
    '--aha-button-default-border-press': ringPress,
    '--aha-button-ghost-bg-hover': accentTint,
    '--aha-button-ghost-bg-press': accentTint,
    '--aha-button-danger-bg': ink,
    '--aha-button-danger-bg-hover': dangerHover,
    '--aha-button-danger-bg-press': dangerPress,
    '--aha-button-danger-text': surface,
    '--aha-button-danger-ring': ink,
    '--aha-button-positive-bg': primary,
    '--aha-button-positive-bg-hover': primaryHover,
    '--aha-button-positive-bg-press': primaryPress,
    '--aha-button-positive-text': onPrimary,
    '--aha-button-disabled-bg': neutrals[40],
    '--aha-button-disabled-text': neutrals[60],
    '--aha-button-focus-ring': ring,
    '--aha-button-focus-ring-success': ink,
    '--aha-button-elevate-primary-hover': `0 4px 12px rgba(${pr},${pg},${pb},.32)`,

    '--aha-viz-ink': ink,
    '--aha-viz-neutral': tertiary,
    '--aha-viz-tint-1': accentTint, '--aha-viz-tint-3': accentTint, '--aha-viz-tint-5': accentTint,
  };
  for (const [step, value] of Object.entries(neutrals)) vars[`--aha-gray-${step}`] = value;
  vars['--aha-gray-100'] = ink;
  vars['--aha-course-text-heading'] = floorContrast(parseColour(theme.textHeading) ? theme.textHeading : ink, [surface, page], COURSE_THEME_FLOORS.text);
  vars['--aha-course-accent'] = floorContrast(parseColour(theme.accent) ? theme.accent : primary, [surface, page], COURSE_THEME_FLOORS.graphic);

  if (theme.fontBody) {
    vars['--aha-font-product'] = theme.fontBody;
    vars['--aha-font-secondary'] = theme.fontBody;
  }
  if (theme.fontBody || theme.fontHeading) vars['--aha-font-display'] = theme.fontHeading || theme.fontBody;
  if (theme.radius !== undefined && theme.radius !== null && theme.radius !== '' && Number.isFinite(Number.parseFloat(theme.radius))) {
    Object.assign(vars, radiusLadder(Number.parseFloat(theme.radius)));
  }
  if (dark) vars['color-scheme'] = 'dark';
  return vars;
}

export const COURSE_THEME_VAR_NAMES = [...new Set([
  ...Object.keys(courseThemeVars({ fontBody: 'a', fontHeading: 'b', radius: 8 })),
  ...Object.keys(courseThemeVars({ surface: GRAY[100] })),
])];

/**
 * Write the course theme onto `target` (default: the document root): every <aha-*> inside it re-skins.
 * Call it again when the theme changes; names the new theme leaves unset are removed. Returns the values.
 */
export function applyCourseTheme(target = document.documentElement, theme = {}) {
  return writeDeckVars(target, COURSE_THEME_VAR_NAMES, courseThemeVars(theme));
}

export default { applyCourseTheme, courseThemeVars, contrastRatio, floorContrast, COURSE_THEME_INPUTS, COURSE_THEME_FLOORS, COURSE_THEME_VAR_NAMES };
