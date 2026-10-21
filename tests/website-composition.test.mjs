import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const readJson = (path) => JSON.parse(readFileSync(new URL(`../${path}`, import.meta.url), 'utf8'));

const guideline = readJson('guidelines/website.json');
const criteria = readJson('anti-slop/criteria.json').surfaces.website.criteria;
const agentCriteria = readJson('agent/anti-slop/criteria.json').surfaces.website.criteria;
const evals = readJson('anti-slop/evals/website/evals.json').evals;
const cardsCss = readJson('marketing/cards.json').baseCss;
const featuresCss = readJson('marketing/features.json').baseCss;

for (const id of ['W11', 'W12', 'W13']) {
  test(`${id} has a guideline rule, a criterion, a synced copy and a failing eval`, () => {
    assert.ok(guideline.rules.some((rule) => rule.ref.includes(id)), 'guideline rule');
    assert.ok(criteria.some((criterion) => criterion.id === id), 'criterion');
    assert.ok(agentCriteria.some((criterion) => criterion.id === id), 'plugin copy of the criterion');
    const failing = evals.find((entry) => entry.expected.criteria[id] === 'FAIL');
    assert.ok(failing, 'eval that fails it');
    assert.ok(existsSync(new URL(`../anti-slop/evals/website/${failing.files[0].path}`, import.meta.url)), 'fixture exists');
    for (const control of evals.filter((entry) => entry.label === 'good-control')) {
      assert.equal(control.expected.criteria[id], 'PASS');
    }
  });
}

test('the Cards grid and the Features icon grid balance by item count', () => {
  for (const css of [cardsCss, featuresCss]) {
    assert.match(css, /:has\(>:first-child:last-child\)\{grid-template-columns:minmax\(0,36rem\)/);
    assert.match(css, /:has\(>:nth-child\(2\):last-child\),[^{]*:has\(>:nth-child\(4\):last-child\)\{grid-template-columns:repeat\(2,/);
    assert.match(css, /:nth-child\(3n\+2\):last-child:nth-child\(n\+5\)\)>:last-child\{grid-column:4 \/ span 2\}/);
    assert.match(css, /:nth-child\(3n\+1\):last-child:nth-child\(n\+7\)\)>:last-child\{grid-column:2\}/);
  }
});

test('the Steps row and the image-led grid keep their own layout', () => {
  assert.match(cardsCss, /\.aha-marketing-cards__grid:not\(\.aha-marketing-cards__grid--image-led\):not\(\.aha-marketing-cards__grid--row\):has/);
});
