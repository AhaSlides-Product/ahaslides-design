import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  loadColourRules, loadBackgrounds, listRules, listTables, judgeCriteriaByRule, markupToHtml, markupToText,
  renderColourRulesPage, renderColourRulesAgent, renderColourRulesMd, renderBackgroundLibrary, COLOUR_RULES_TEMPLATE_FILE,
} from '../colour-rules.mjs';
import { buildSplash, readyMadeSet, loadSplashRules, readIcon, pathBounds, largestHook } from '../build-splash.mjs';
import { loadEnvironmentTable, environmentNames } from '../environments.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (path) => readFileSync(join(root, path), 'utf8');
const rules = loadColourRules(root);
const backgrounds = loadBackgrounds(root);
const store = JSON.parse(read('anti-slop/criteria.json'));
const ruleList = listRules(rules);
const ruleText = (id) => ruleList.find(rule => rule.id === id).text;
const table = (id) => listTables(rules).find(entry => entry.id === id);
const SITE = 'https://design.example';

test('every rule has a unique id inside its section and names known environments', () => {
  const known = environmentNames(loadEnvironmentTable(root));
  const ids = ruleList.map(rule => rule.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const rule of ruleList) {
    assert.equal(rule.id.split('.')[0], rule.section, rule.id);
    assert.ok(rule.environment.length && rule.environment.every(name => known.includes(name)), rule.id);
  }
  assert.deepEqual(rules.environment, known);
  for (const name of known) assert.ok(ruleList.some(rule => rule.environment.includes(name)), name);
});

test('the product app rules reach product and the marketing section rules stay on marketing-web', () => {
  const environmentOf = (id) => ruleList.find(rule => rule.id === id).environment;
  assert.deepEqual(environmentOf('3.6'), ['product']);
  assert.deepEqual(environmentOf('3.7'), ['product']);
  assert.deepEqual(environmentOf('3.3'), ['marketing-web']);
  assert.ok(environmentOf('4.1').includes('video') && environmentOf('4.1').includes('social-ads'));
});

test('the judge criteria and the Background pattern cite rules that exist', () => {
  const ids = new Set(ruleList.map(rule => rule.id));
  for (const surface of ['colour', 'background']) {
    for (const criterion of store.surfaces[surface].criteria) {
      assert.ok(Array.isArray(criterion.source), `${surface} ${criterion.id}`);
      for (const id of criterion.source) assert.ok(ids.has(id), `${surface} ${criterion.id} cites ${id}`);
    }
  }
  const pattern = JSON.parse(read('guidelines/background.json'));
  for (const rule of pattern.rules) for (const id of rule.source) assert.ok(ids.has(id), `guidelines/background.json cites ${id}`);
  assert.deepEqual(judgeCriteriaByRule(store)['3.6'], ['background:C2']);
});

test('the Splash prose states the same figures the generator reads', () => {
  const { centre, right, minimal } = rules.splash.layouts;
  assert.ok(ruleText('5.3').includes(`${centre.iconWidthPerShorterSide.toFixed(1)} times`));
  assert.ok(ruleText('5.4').includes(`${right.iconWidthPerShorterSide.toFixed(1)} times`));
  assert.ok(ruleText('5.4').includes(`${right.meetingPointAcross * 100}% of the way across`));
  assert.ok(ruleText('5.5').includes(`${minimal.hookLengthPerLongerSide} times`));
  const [centreRow, rightRow, minimalRow] = table('splash-layouts').rows;
  assert.equal(centreRow[1], `${centre.iconWidthPerShorterSide * 100}%`);
  assert.equal(rightRow[1], `${right.iconWidthPerShorterSide * 100}%`);
  assert.ok(rightRow[2].startsWith(`${right.meetingPointAcross * 100}% across`));
  assert.ok(minimalRow[1].startsWith(`${Math.round(minimal.iconWidthPerLongerSideOnThePage * 100)}% of the longer side`));
  assert.ok(minimalRow[2].includes(`lower ${minimal.bottomLeftCoversLowerShare * 100}%`) && minimalRow[2].includes(`upper ${minimal.topRightCoversUpperShare * 100}%`));
  assert.ok(ruleText('5.1').includes('Vivid Pink at 5% on a white background, Darker Pink on a Vivid Pink background'));
  const hex = (id) => { const colour = rules.palette.find(entry => entry.id === id); return colour.hex || colour.flatHex; };
  assert.deepEqual(rules.splash.surfaces, { white: { background: hex('white'), hooks: hex('vivid-pink-5') }, pink: { background: hex('vivid-pink'), hooks: hex('darker-pink') } });
});

test('the open point on the minimal layout matches the logo vector', () => {
  const { iconWidth, hooks } = readIcon(read(rules.splash.icon));
  const bounds = pathBounds(largestHook(hooks));
  const hookLength = rules.splash.layouts.minimal.iconWidthPerLongerSideOnThePage * (bounds.bottom - bounds.top) / iconWidth;
  assert.equal(hookLength.toFixed(2), '0.73');
  assert.ok(rules.open.find(point => point.id === 'O1').text.includes('0.73, not 0.77'));
});

test('every ready-made background is exactly what the generator builds, and the manifest lists them all', () => {
  const splashRules = loadSplashRules();
  const set = readyMadeSet(splashRules);
  assert.deepEqual(set.map(entry => entry.file).sort(), readdirSync(join(root, 'backgrounds')).filter(file => file.endsWith('.svg')).sort());
  assert.deepEqual(backgrounds.map(entry => entry.file).sort(), set.map(entry => entry.file).sort());
  for (const entry of set) assert.equal(read(`backgrounds/${entry.file}`), buildSplash({ ...entry, rules: splashRules }), entry.file);
  for (const entry of backgrounds) {
    assert.ok(entry.source && /^\d{4}-\d{2}-\d{2}$/.test(entry.builtOn) && entry.environment.length, entry.id);
    const built = set.find(candidate => candidate.file === entry.file);
    assert.deepEqual([entry.width, entry.height, entry.layout, entry.surface], [built.width, built.height, built.layout, built.surface]);
  }
  assert.ok(set.filter(entry => entry.layout === 'minimal').every(entry => entry.ratio === '16x9'));
});

test('a Splash background keeps the hooks of the icon and only moves them', () => {
  const { hooks } = readIcon(read(rules.splash.icon));
  const svg = buildSplash({ layout: 'right', surface: 'pink', width: 1200, height: 628 });
  for (const hook of hooks) assert.ok(svg.includes(`d="${hook}"`));
  assert.match(svg, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" width="1200" height="628"/);
  assert.throws(() => buildSplash({ layout: 'corner', surface: 'pink', width: 10, height: 10 }), /layout is one of/);
});

test('markup renders a copy code on the page and plain text in the feeds', () => {
  assert.equal(markupToText('then light grey ([[#A8A8A8]]) and **bold** `code` [here](x.html)'), 'then light grey (#A8A8A8) and bold code here');
  const html = markupToHtml('grey [[#A8A8A8]] and plain [[#FDE7F0|plain]] <b>');
  assert.ok(html.includes('data-copy="#A8A8A8"') && html.includes('class="swatch sw-grey"'));
  assert.ok(!/data-copy="#FDE7F0"[^>]*><span class="swatch/.test(html) && html.includes('&lt;b&gt;'));
});

test('a value with quotes cannot break out of an attribute', () => {
  const html = markupToHtml('[x](a"onmouseover="y) and \'q\' & "d"');
  assert.ok(!/href="a"onmouseover/.test(html) && html.includes('a&quot;onmouseover=&quot;y'));
  assert.ok(html.includes('&#39;q&#39; &amp; &quot;d&quot;'));
  const { main } = renderBackgroundLibrary(loadColourRules(root), [{ id: 'x', name: 'n"', file: 'a".svg', layout: 'right', surface: 'pink', ratio: '16:9', width: 1, height: 1 }], { site: 's', headline: () => '' });
  assert.ok(!main.includes('a".svg') && main.includes('a&quot;.svg'));
});

test('the page, the feed and the markdown all carry every rule and every open point', () => {
  const page = renderColourRulesPage(rules, { fonts: { regular: 'AA', semiBold: 'BB' }, templateHtml: read(COLOUR_RULES_TEMPLATE_FILE) });
  const feed = JSON.parse(renderColourRulesAgent(rules, { site: SITE, store, backgrounds }));
  const markdown = renderColourRulesMd(rules, { site: SITE, store, backgrounds });
  assert.ok(!/\{\{\w+\}\}/.test(page) && !page.includes('part:'));
  assert.equal(feed.rules.length, ruleList.length);
  for (const rule of ruleList) {
    assert.ok(page.includes(`id="r${rule.id}"`) || rule.id.startsWith('1.'), rule.id);
    assert.ok(markdown.includes(`- ${rule.id} [`), rule.id);
  }
  for (const section of rules.sections) assert.ok(page.includes(`<h2 id="${section.id}">`));
  for (const point of rules.open) {
    assert.ok(page.includes(`id="${point.id}"`) && markdown.includes(point.title));
    assert.ok(feed.open.some(entry => entry.id === point.id));
  }
  assert.ok(!page.includes('Nothing open.'));
  assert.equal(feed.splash.files.length, backgrounds.length);
  assert.ok(feed.rulesByEnvironment.product.includes('3.6') && !feed.rulesByEnvironment.video.includes('3.6'));
  assert.equal(rules.changes[0].version, 'v10');
});
