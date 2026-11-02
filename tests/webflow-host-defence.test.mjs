import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

const marketingDirectory = new URL('../marketing/', import.meta.url);

const collectCss = (value, found = []) => {
  if (Array.isArray(value)) value.forEach((item) => collectCss(item, found));
  else if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      if ((key === 'css' || key === 'baseCss') && typeof child === 'string') found.push(child);
      else collectCss(child, found);
    }
  }
  return found;
};

const sections = readdirSync(marketingDirectory)
  .filter((file) => file.endsWith('.json'))
  .map((file) => ({ file, css: collectCss(JSON.parse(readFileSync(new URL(file, marketingDirectory), 'utf8'))) }));

const rulesWhere = (css, selectorPattern) =>
  [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    .map(([, selector, body]) => ({ selector: selector.trim(), body }))
    .filter(({ selector }) => selectorPattern.test(selector));

test('a blockquote reset in a marketing section also clears the host border', () => {
  for (const { file, css } of sections) {
    for (const rule of css.flatMap((text) => rulesWhere(text, /blockquote\)?$/))) {
      if (/(^|;)\s*(margin|padding):0/.test(rule.body)) {
        assert.match(rule.body, /border:\s*0/, `${file}: ${rule.selector}`);
      }
    }
  }
});

test('a marketing section title rule sets display so a host h2{display:flex} cannot centre-break it', () => {
  for (const { file, css } of sections) {
    const titleRules = css.flatMap((text) => rulesWhere(text, /^\.aha-[\w-]+__(title|heading)$/));
    const selectors = new Set(titleRules.map((rule) => rule.selector));
    const withoutDisplay = [...selectors].filter((selector) =>
      !titleRules.some((rule) => rule.selector === selector && /display:/.test(rule.body)));
    assert.deepEqual(withoutDisplay, [], file);
  }
});

test('the Step card number badge ships with the Cards base CSS every card embed includes', () => {
  const cards = JSON.parse(readFileSync(new URL('cards.json', marketingDirectory), 'utf8'));
  assert.match(cards.baseCss, /\.aha-marketing-card__number\{/);
});
