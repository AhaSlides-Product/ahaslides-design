import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseColour } from '../lib/deck.js';
import { courseThemeVars, contrastRatio } from '../lib/course-theming.js';

const rootValues = {};
for (const [, name, value] of readFileSync(new URL('../lib/tokens.css', import.meta.url), 'utf8').matchAll(/(--aha-[a-z0-9-]+):([^;]+);/g)) rootValues[name] ??= value.trim();

const NOT_THEMED = new Set([
  '--aha-text-inverse', '--aha-icon-inverse', '--aha-bg-dark', '--aha-bg-dark-raised', '--aha-bg-overlay',
  '--aha-btn-elevate-primary', '--aha-btn-elevate-secondary', '--aha-button-elevate-primary', '--aha-button-elevate-secondary',
]);

test('the default course theme reproduces every literal DS colour it overrides', () => {
  const vars = courseThemeVars({});
  for (const [name, value] of Object.entries(vars)) {
    const root = rootValues[name];
    if (!root || !root.startsWith('#')) continue;
    assert.deepEqual(parseColour(value), parseColour(root), name);
  }
});

test('every semantic colour token is themed, except the dark and inverse layers', () => {
  const vars = courseThemeVars({});
  const semantic = Object.keys(rootValues).filter((name) => /^--aha-(color|text|bg|border|icon|focus|split|checkbox|btn|button)(-|$)/.test(name));
  const unthemed = semantic.filter((name) => !(name in vars) && !NOT_THEMED.has(name));
  assert.deepEqual(unthemed, []);
});

const THEMES = {
  light: { primary: '#0B6E4F', surface: '#FFFFFF', pageBg: '#F2F7F5', textBody: '#1B2B26' },
  dark: { primary: '#7C5CFF', surface: '#14161F', pageBg: '#0B0C12', textBody: '#E8E8EE' },
  brand: { primary: '#FFB800', surface: '#FFF8E6', pageBg: '#FFB800', textBody: '#3A2A00' },
  lime: { primary: '#C6F432' },
  nearWhitePrimary: { primary: '#FDFDFD' },
  lowContrastInk: { textBody: '#B0B0B0', primary: '#F0F0F0', surface: '#FFFFFF' },
  darkNoInk: { surface: '#202020', primary: '#E70E68' },
};

const PAIRS = [
  ['--aha-text-default', ['--aha-bg-container', '--aha-bg-layout', '--aha-bg-hover', '--aha-bg-container-secondary'], 4.5],
  ['--aha-text-secondary', ['--aha-bg-container', '--aha-bg-layout', '--aha-bg-hover', '--aha-gray-30'], 4.5],
  ['--aha-text-tertiary', ['--aha-bg-container', '--aha-bg-layout', '--aha-bg-hover'], 4.5],
  ['--aha-icon-muted', ['--aha-bg-container'], 3],
  ['--aha-icon-default', ['--aha-bg-container', '--aha-bg-hover'], 4.5],
  ['--aha-course-text-heading', ['--aha-bg-container', '--aha-bg-layout'], 4.5],
  ['--aha-text-link', ['--aha-bg-container', '--aha-gray-25', '--aha-bg-accent'], 4.5],
  ['--aha-text-link-hover', ['--aha-bg-container', '--aha-bg-accent'], 4.5],
  ['--aha-button-primary-text', ['--aha-button-primary-bg', '--aha-button-primary-bg-hover', '--aha-button-primary-bg-press'], 4.5],
  ['--aha-button-positive-text', ['--aha-button-positive-bg', '--aha-button-positive-bg-hover', '--aha-button-positive-bg-press'], 4.5],
  ['--aha-button-danger-text', ['--aha-button-danger-bg', '--aha-button-danger-bg-hover', '--aha-button-danger-bg-press'], 4.5],
  ['--aha-button-default-text', ['--aha-button-default-bg', '--aha-button-default-bg-hover'], 4.5],
  ['--aha-button-default-text-hover', ['--aha-button-default-bg-hover'], 4.5],
  ['--aha-color-primary', ['--aha-bg-container', '--aha-bg-layout'], 3],
  ['--aha-color-primary-hover', ['--aha-bg-container', '--aha-bg-layout'], 3],
  ['--aha-color-primary-active', ['--aha-bg-container', '--aha-bg-layout'], 3],
  ['--aha-focus-ring', ['--aha-bg-container', '--aha-bg-layout', '--aha-bg-hover'], 3],
  ['--aha-border-focus', ['--aha-bg-container', '--aha-bg-layout'], 3],
  ['--aha-border-hover', ['--aha-bg-container', '--aha-bg-layout'], 3],
  ['--aha-border-active', ['--aha-bg-container', '--aha-bg-layout'], 3],
  ['--aha-course-accent', ['--aha-bg-container', '--aha-bg-layout'], 3],
];

for (const [label, theme] of Object.entries(THEMES)) {
  test(`${label} course theme keeps every state readable`, () => {
    const vars = courseThemeVars(theme);
    for (const [ink, grounds, floor] of PAIRS) {
      for (const ground of grounds) {
        const ratio = contrastRatio(vars[ink], vars[ground]);
        assert.ok(ratio >= floor, `${ink} ${vars[ink]} on ${ground} ${vars[ground]} is ${ratio.toFixed(2)}:1, needs ${floor}`);
      }
    }
  });
}

test('a radius scales the DS ladder and is clamped', () => {
  assert.equal(courseThemeVars({ radius: 8 })['--aha-radius-lg'], `${rootValues['--aha-radius-lg']}`);
  assert.equal(courseThemeVars({ radius: 0 })['--aha-radius-default'], '0px');
  assert.equal(courseThemeVars({ radius: 400 })['--aha-radius-default'], '16px');
  assert.equal(courseThemeVars({ radius: 'large' })['--aha-radius-default'], undefined);
});

test('primary-filled controls take the themed on-primary foreground and primary-coloured text takes the link token', () => {
  const source = (name) => readFileSync(new URL(`../lib/${name}.js`, import.meta.url), 'utf8');
  for (const name of ['aha-checkbox', 'aha-switch', 'aha-tag']) assert.match(source(name), /--aha-button-primary-text/, name);
  for (const name of ['aha-tabs', 'aha-radio', 'aha-breadcrumb', 'aha-pagination', 'aha-uploader', 'aha-screen-heading']) {
    assert.match(source(name), /color:var\(--aha-text-link,var\(--aha-color-primary/, name);
  }
  assert.equal(rootValues['--aha-text-link'], 'var(--aha-vivid-pink-dark)');
});
