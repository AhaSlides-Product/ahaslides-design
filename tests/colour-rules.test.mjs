import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  loadColourRules, loadBackgrounds, listRules, listNotes, listTables, judgeCriteriaByRule, markupToHtml, markupToText,
  renderColourRulesPage, renderColourRulesAgent, renderColourRulesMd, renderBackgroundLibrary, COLOUR_RULES_TEMPLATE_FILE,
} from '../colour-rules.mjs';
import { buildSplash, buildSplashIcon, iconSet, readyMadeSet, loadSplashRules, readIcon, largestHook } from '../build-splash.mjs';
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

test('the product app rules reach product and the coloured-section rules reach product and web', () => {
  const environmentOf = (id) => ruleList.find(rule => rule.id === id).environment;
  assert.deepEqual(environmentOf('3.6'), ['product']);
  assert.deepEqual(environmentOf('3.7'), ['product']);
  for (const id of ['3.2', '3.3', '3.4', '3.5']) assert.deepEqual(environmentOf(id), ['product', 'web']);
  assert.deepEqual(environmentOf('9.5'), ['product', 'audience', 'web', 'video', 'social-ads']);
  assert.ok(environmentOf('4.1').includes('video') && environmentOf('4.1').includes('social-ads'));
});

test('no rule text names marketing as a surface: every rule says which medium it applies to', () => {
  const readerFacing = (key, value) => (key === 'origin' || key === 'environment' || key.startsWith('$') ? undefined : value);
  const offending = JSON.stringify(rules, readerFacing).match(/[^"]*marketing[^"]*/gi) || [];
  assert.deepEqual(offending, []);
  for (const feed of [renderColourRulesMd(rules, { site: SITE, store, backgrounds }), JSON.stringify(JSON.parse(read('guidelines/background.json')).lead)]) {
    assert.deepEqual(feed.replace(/aha-marketing-[a-z-]+/g, '').match(/marketing/gi) || [], []);
  }
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
  assert.ok(ruleText('5.5').includes(`${minimal.iconWidthPerLongerSide} times`));
  const percent = (share) => `${Number((share * 100).toFixed(2))}%`;
  const [centreRow, rightRow, minimalRow] = table('splash-layouts').rows;
  assert.ok(centreRow[1].startsWith(`${centre.iconWidthPerShorterSide * 100}%`));
  assert.equal(centreRow[2], `${percent(centre.meetingPointAcross)} across, ${percent(centre.meetingPointDown)} down`);
  assert.ok(ruleText('5.3').includes(`${percent(centre.meetingPointAcross)} of the way across and ${percent(centre.meetingPointDown)} of the way down`));
  assert.equal(centre.wideFrameAspectThreshold, 16 / 9);
  assert.equal(centre.wideFrameFollow, 0.5);
  assert.ok(rightRow[1].startsWith(`${right.iconWidthPerShorterSide * 100}%`));
  assert.equal(rightRow[2], `${percent(right.meetingPointAcross)} across, ${percent(right.meetingPointDown)} down`);
  assert.ok(ruleText('5.4').includes(`${percent(right.meetingPointDown)} of the way down`));
  assert.equal(right.wideFrameAspectThreshold, 16 / 9);
  assert.equal(right.wideFrameFollow, 0.5);
  assert.ok(minimalRow[1].includes(`${minimal.iconWidthPerLongerSide} times the longer side`));
  for (const share of [minimal.bottomLeftOutsideLeftEdge, minimal.bottomLeftRiseAboveBottomEdge, minimal.topRightOutsideRightEdge, minimal.topRightDropBelowTopEdge]) {
    assert.ok(minimalRow[2].includes(percent(share)) && ruleText('5.5').includes(percent(share)), percent(share));
  }
  assert.ok(ruleText('5.19').includes(`${minimal.iconWidthPerLongerSide} times`));
  for (const text of [ruleText('5.5'), ruleText('5.8'), ruleText('5.19'), minimalRow[1] + minimalRow[2]]) assert.ok(text.includes('at most twice the shorter side') || text.includes('2:1'), text.slice(0, 40));
  assert.equal(minimal.longerSideAtMostShorterSideTimes, 2);
  assert.ok(ruleText('5.1').includes('Vivid Pink at 5% on a white background, Darker Pink on a Vivid Pink background'));
  const hex = (id) => { const colour = rules.palette.find(entry => entry.id === id); return colour.hex || colour.flatHex; };
  assert.deepEqual(rules.splash.surfaces, { white: { background: hex('white'), hooks: hex('vivid-pink-5') }, pink: { background: hex('vivid-pink'), hooks: hex('darker-pink') } });
});

test('the right splash is 4.5 times the shorter side, grows past 16:9 and meets at 75% across, 55% down', () => {
  const placement = (width, height) => {
    const svg = buildSplash({ layout: 'right', surface: 'white', width, height });
    return Number(svg.match(/scale\(([\d.]+)\)/)[1]) * readIcon(readFileSync(new URL('../logo/thesplash.svg', import.meta.url), 'utf8')).iconWidth;
  };
  const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 0.01, `${actual} vs ${expected}`);
  near(placement(3840, 1080), 4.5 * 1080 * Math.SQRT2);
  near(placement(1080, 3840), 4.5 * 1080 * Math.SQRT2);
  near(placement(2520, 1080), 4.5 * 1080 * Math.sqrt((21 / 9) / (16 / 9)));
  near(placement(1920, 1080), 4.5 * 1080);
  near(placement(1080, 1080), 4.5 * 1080);
  const { right } = rules.splash.layouts;
  assert.deepEqual([right.meetingPointAcross, right.meetingPointDown], [0.75, 0.55]);
});

test('the centre splash grows by the square root of the aspect beyond 16:9, wide or tall', () => {
  const iconWidthOf = (width, height) => {
    const svg = buildSplash({ layout: 'centre', surface: 'white', width, height });
    const scale = Number(svg.match(/scale\(([\d.]+)\)/)[1]);
    return scale * readIcon(readFileSync(new URL('../logo/thesplash.svg', import.meta.url), 'utf8')).iconWidth;
  };
  const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 0.01, `${actual} vs ${expected}`);
  near(iconWidthOf(3840, 1080), 4.5 * 1080 * Math.SQRT2);
  near(iconWidthOf(1080, 3840), 4.5 * 1080 * Math.SQRT2);
  near(iconWidthOf(2520, 1080), 4.5 * 1080 * Math.sqrt((21 / 9) / (16 / 9)));
  near(iconWidthOf(1920, 1080), 4.5 * 1080);
  near(iconWidthOf(1080, 1920), 4.5 * 1080);
  near(iconWidthOf(1080, 1080), 4.5 * 1080);
});

function outlinePoints(pathData) {
  const tokens = pathData.match(/[MCLHZ]|-?\d*\.?\d+(?:e-?\d+)?/g);
  const points = [];
  let x = 0, y = 0, index = 0, command = null;
  while (index < tokens.length) {
    if (/[A-Z]/.test(tokens[index])) { command = tokens[index++]; if (command === 'Z') continue; }
    if (command === 'M' || command === 'L') { x = Number(tokens[index]); y = Number(tokens[index + 1]); index += 2; points.push([x, y]); }
    else if (command === 'H') { x = Number(tokens[index++]); points.push([x, y]); }
    else {
      const [x1, y1, x2, y2, x3, y3] = tokens.slice(index, index + 6).map(Number);
      index += 6;
      for (let step = 1; step <= 50; step++) {
        const t = step / 50, u = 1 - t;
        points.push([u ** 3 * x + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t ** 3 * x3, u ** 3 * y + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t ** 3 * y3]);
      }
      x = x3; y = y3;
    }
  }
  return points;
}

const boxOf = (points, [a, b, c, d, e, f]) => {
  const xs = points.map(([x, y]) => a * x + c * y + e), ys = points.map(([x, y]) => b * x + d * y + f);
  return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
};

test('the minimal Splash puts each hook where the approved demo puts it, on every frame shape', () => {
  const hookPoints = outlinePoints(largestHook(readIcon(read(rules.splash.icon)).hooks));
  const frames = [[1600, 900], [1000, 500], [1080, 1350], [1080, 1920], [1080, 1080], [1920, 1080]];
  for (const [width, height] of frames) {
    const longerSide = Math.max(width, height), unit = longerSide / 1600;
    const demoBoxes = [
      boxOf(hookPoints, [-0.04176 * unit, -2.28576 * unit, 2.27056 * unit, -0.04144 * unit, -633.632 * unit, height + 505.344 * unit]),
      boxOf(hookPoints, [0, 2.28608 * unit, -2.27088 * unit, 0, width + 648.128 * unit, -473.024 * unit]),
    ];
    const svg = buildSplash({ layout: 'minimal', surface: 'pink', width, height });
    const generated = [...svg.matchAll(/translate\(([-\d.]+) ([-\d.]+)\) rotate\((-?90)\) scale\(([\d.]+)\)/g)].map(([, e, f, turn, scale]) => {
      const s = Number(scale);
      return boxOf(hookPoints, turn === '-90' ? [0, -s, s, 0, Number(e), Number(f)] : [0, s, -s, 0, Number(e), Number(f)]);
    });
    assert.equal(generated.length, 2);
    generated.forEach((box, hook) => box.forEach((edge, side) => {
      assert.ok(Math.abs(edge - demoBoxes[hook][side]) <= 0.01 * longerSide, `${width}x${height} hook ${hook} edge ${side}`);
    }));
  }
});

test('a very wide or tall frame lays the minimal hooks out as for twice its shorter side', () => {
  const hookPlacements = (svg) => [...svg.matchAll(/translate\(([-\d.]+) ([-\d.]+)\) rotate\((-?90)\) scale\(([\d.]+)\)/g)].map(match => match.slice(1, 5).join(' '));
  const sameHooks = (wide, reference) => assert.deepEqual(hookPlacements(buildSplash({ layout: 'minimal', surface: 'pink', ...wide })).map(placement => placement.split(' ')[3]), hookPlacements(buildSplash({ layout: 'minimal', surface: 'pink', ...reference })).map(placement => placement.split(' ')[3]));
  sameHooks({ width: 1920, height: 320 }, { width: 640, height: 320 });
  sameHooks({ width: 320, height: 1920 }, { width: 320, height: 640 });
  const banner = hookPlacements(buildSplash({ layout: 'minimal', surface: 'pink', width: 1920, height: 320 }));
  const reference = hookPlacements(buildSplash({ layout: 'minimal', surface: 'pink', width: 640, height: 320 }));
  const bannerBottomLeft = banner[0].split(' ').map(Number), referenceBottomLeft = reference[0].split(' ').map(Number);
  assert.equal(bannerBottomLeft[0], referenceBottomLeft[0]);
  assert.equal(bannerBottomLeft[1], referenceBottomLeft[1]);
});

test('the ready-made backgrounds are unchanged by the cap', () => {
  for (const { file, layout, surface, width, height } of readyMadeSet()) {
    assert.equal(buildSplash({ layout, surface, width, height }), read(`backgrounds/${file}`), file);
  }
});

test('the centre Splash puts the whole icon where the approved social posts put it', () => {
  const { hooks } = readIcon(read(rules.splash.icon));
  const points = hooks.flatMap(hook => outlinePoints(hook));
  const references = [
    ['centre', 100, 100, [0.56110, 0, 0, 0.55738, -182.406, -137.278]],
    ['centre', 160, 90, [0.50499, 0, 0, 0.50164, -129.166, -123.550]],
  ];
  for (const [layout, width, height, matrix] of references) {
    const svg = buildSplash({ layout, surface: 'pink', width, height });
    const [across, down, scale, offsetX, offsetY] = svg.match(/<g fill="[^"]+" transform="translate\(([-\d.]+) ([-\d.]+)\) scale\(([\d.]+)\) translate\(([-\d.]+) ([-\d.]+)\)"/).slice(1).map(Number);
    const generated = boxOf(points, [scale, 0, 0, scale, across + scale * offsetX, down + scale * offsetY]);
    const expected = boxOf(points, matrix);
    if (layout === 'centre') { const shift = (rules.splash.layouts.centre.meetingPointDown - 0.5) * height; expected[1] += shift; expected[3] += shift; }
    const shorterSide = Math.min(width, height);
    generated.forEach((edge, side) => { assert.ok(Math.abs(edge - expected[side]) <= 0.02 * shorterSide, `${layout} ${width}x${height} edge ${side}: ${edge} against ${expected[side]}`); });
  }
});

test('every ready-made background is exactly what the generator builds, and the manifest lists them all', () => {
  const splashRules = loadSplashRules();
  const set = readyMadeSet(splashRules);
  const icons = iconSet(splashRules);
  assert.deepEqual([...set, ...icons].map(entry => entry.file).sort(), readdirSync(join(root, 'backgrounds')).filter(file => file.endsWith('.svg')).sort());
  for (const entry of icons) assert.equal(read(`backgrounds/${entry.file}`), buildSplashIcon({ ...entry, rules: splashRules }), entry.file);
  const manifestIcons = JSON.parse(read('backgrounds/manifest.json')).icons;
  assert.deepEqual(manifestIcons.map(entry => `${entry.id}.svg`).sort(), icons.map(entry => entry.file).sort());
  assert.deepEqual(backgrounds.map(entry => entry.file).sort(), set.map(entry => entry.file).sort());
  for (const entry of set) assert.equal(read(`backgrounds/${entry.file}`), buildSplash({ ...entry, rules: splashRules }), entry.file);
  for (const entry of backgrounds) {
    assert.ok(entry.source && /^\d{4}-\d{2}-\d{2}$/.test(entry.builtOn) && entry.environment.length, entry.id);
    const built = set.find(candidate => candidate.file === entry.file);
    assert.deepEqual([entry.width, entry.height, entry.layout, entry.surface], [built.width, built.height, built.layout, built.surface]);
  }
  for (const layout of Object.keys(splashRules.layouts)) assert.deepEqual(set.filter(entry => entry.layout === layout && entry.surface === 'white').map(entry => entry.ratio).sort(), Object.keys(splashRules.frames).sort(), layout);
});

test('a Splash background keeps the hooks of the icon and only moves them', () => {
  const { hooks } = readIcon(read(rules.splash.icon));
  const svg = buildSplash({ layout: 'right', surface: 'pink', width: 1200, height: 628 });
  for (const hook of hooks) assert.ok(svg.includes(`d="${hook}"`));
  const icon = buildSplashIcon({ surface: 'pink', rules: rules.splash });
  for (const hook of hooks) assert.ok(icon.includes(`d="${hook}"`));
  assert.match(icon, /fill="#DB005B"/);
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

test('the page, the feed and the markdown all carry every rule', () => {
  const page = renderColourRulesPage(rules, { templateHtml: read(COLOUR_RULES_TEMPLATE_FILE) });
  const feed = JSON.parse(renderColourRulesAgent(rules, { site: SITE, store, backgrounds }));
  const markdown = renderColourRulesMd(rules, { site: SITE, store, backgrounds });
  assert.ok(!/\{\{\w+\}\}/.test(page) && !page.includes('part:'));
  assert.equal(feed.rules.length, ruleList.length);
  for (const rule of ruleList) {
    assert.ok(page.includes(`id="r${rule.id}"`) || rule.id.startsWith('1.'), rule.id);
    assert.ok(markdown.includes(`- ${rule.id} [`), rule.id);
  }
  for (const section of rules.sections) assert.ok(page.includes(`<h2 id="${section.id}">`));
  const notes = listNotes(rules);
  assert.ok(notes.some(note => note.section === '3' && note.text.startsWith('Which rules apply depends on how the page is built')));
  assert.deepEqual(feed.notes, notes);
  for (const note of notes) assert.ok(markdown.includes(note.text), note.text);
  for (const point of rules.open) {
    assert.ok(page.includes(`id="${point.id}"`) && markdown.includes(point.title));
    assert.ok(feed.open.some(entry => entry.id === point.id));
  }
  assert.deepEqual(rules.open, []);
  assert.ok(page.includes('Nothing open.') && feed.open.length === 0);
  assert.equal(feed.splash.files.length, backgrounds.length);
  assert.ok(feed.rulesByEnvironment['marketing-web'].join() === feed.rulesByEnvironment.web.join());
  assert.ok(feed.rulesByEnvironment.product.includes('3.6') && !feed.rulesByEnvironment.video.includes('3.6'));
  assert.ok(feed.rulesByEnvironment['report-image'].includes('3.11') && !feed.rulesByEnvironment.product.includes('3.11'));
  for (const id of ['5.1', '5.3', '5.5', '5.11', '5.19']) {
    assert.ok(rules.environment.every(name => feed.rulesByEnvironment[name].includes(id)), `splash rule ${id} applies to every environment`);
  }
  assert.equal(rules.changes[0].version, 'v24');
  const reportRule = rules.sections.flatMap(section => section.blocks || []).flatMap(block => block.rules || []).find(rule => rule.id === '3.11').text;
  assert.match(reportRule, /read-only report page/);
  assert.match(reportRule, /table rows alternate white and light grey/);
});

const flatten = (hex, share, base) => '#' + [1, 3, 5].map(index => Math.round(parseInt(hex.slice(index, index + 2), 16) * share + parseInt(base.slice(index, index + 2), 16) * (1 - share)).toString(16).padStart(2, '0').toUpperCase()).join('');
const answerSectionOf = () => rules.sections.find(section => section.key === 'answers');

test('the answer pair in the rules, the palette and the tokens is one set of values', () => {
  const tokens = JSON.parse(read('tokens.canonical.json')).color.answer;
  const rows = table('answer-colours').rows;
  assert.deepEqual(Object.keys(tokens).filter(key => !key.startsWith('$')).sort(), ['correct', 'correctTint30', 'correctTint5', 'wrong', 'wrongTint30', 'wrongTint5']);
  for (const kind of ['correct', 'wrong']) {
    const colour = rules.palette.find(entry => entry.id === `answer-${kind}`);
    assert.equal(tokens[kind], colour.hex);
    const { light5, light30 } = colour.answerTints;
    assert.deepEqual(Object.keys(colour.answerTints), ['light5', 'light30']);
    assert.deepEqual([tokens[`${kind}Tint5`], tokens[`${kind}Tint30`]], [light5, light30]);
    const channels = (hex) => [1, 3, 5].map(index => parseInt(hex.slice(index, index + 2), 16));
    [[light5, 0.05], [light30, 0.3]].forEach(([tint, share]) => {
      const expected = channels(flatten(colour.hex, share, '#FFFFFF'));
      assert.ok(channels(tint).every((value, index) => Math.abs(value - expected[index]) <= 1), `${kind} ${tint} is ${share * 100}% on white`);
    });
    const row = rows.find(entry => entry[0].toLowerCase().startsWith(kind));
    assert.deepEqual(row.slice(1), [colour.hex, light5, light30]);
  }
});

test('the answer section sits before Still to decide, holds five rules and keeps every earlier rule id', () => {
  assert.deepEqual(rules.sections.map(section => section.id).slice(-2), ['s11', 's12']);
  assert.equal(answerSectionOf().id, 's11');
  assert.equal(rules.sections.at(-1).key, 'open');
  assert.deepEqual(ruleList.filter(rule => rule.section === '11').map(rule => rule.id), Array.from({ length: 5 }, (_, index) => `11.${index + 1}`));
  for (const [id, words] of [['1.1', 'section 11'], ['7.1', 'section 11'], ['8.5', 'section 11']]) assert.ok(ruleText(id).includes(words), id);
  assert.deepEqual(rules.open, []);
});

test('section 11 keeps its rules in one closed panel, and the feeds keep every word', () => {
  const page = renderColourRulesPage(rules, { templateHtml: read(COLOUR_RULES_TEMPLATE_FILE), icon: (name) => `<i data-icon="${name}"></i>` });
  const section = answerSectionOf();
  const panels = section.blocks.filter(block => block.type === 'panel');
  assert.deepEqual(panels.map(panel => panel.title), ['Rules']);
  assert.ok(page.includes(`<details class="panel" id="${panels[0].id}"><summary>`));
  assert.ok(!/<details class="panel"[^>]*\sopen/.test(page));
  assert.equal(rules.sections.filter(entry => entry.blocks.some(block => block.type === 'panel')).length, 1);
  const markdown = renderColourRulesMd(rules, { site: SITE, store, backgrounds });
  for (const rule of ruleList.filter(entry => entry.section === '11')) assert.ok(markdown.includes(markupToText(rule.text)), rule.id);
  assert.ok(!page.includes('class="ax-') && !markdown.includes('Table answer-contrast'));
});

test('the Splash CSS recipe carries the generator figures and the 802-unit frame basis is in rules 5.3 and 5.4', () => {
  const recipe = rules.splash.cssRecipe.join('\n');
  const { centre, right } = rules.splash.layouts;
  const { x, y } = rules.splash.meetingPoint;
  const icon = readIcon(readFileSync(new URL('../logo/thesplash.svg', import.meta.url), 'utf8'));
  assert.ok(recipe.includes(`calc(${centre.iconWidthPerShorterSide}*min(100cqw,100cqh)`));
  assert.ok(recipe.includes(`9/16`) && Math.abs(16 / 9 - centre.wideFrameAspectThreshold) < 1e-9 && centre.wideFrameFollow === 0.5);
  assert.ok(recipe.includes(`*${(x / icon.iconWidth).toFixed(6)}`) && recipe.includes(`*${(y / icon.iconWidth).toFixed(6)}`));
  assert.ok(recipe.includes(`${Math.round(centre.meetingPointDown * 100)}cqh`) && centre.meetingPointDown === right.meetingPointDown);
  assert.ok(recipe.includes('@supports'));
  for (const id of ['5.3', '5.4']) assert.ok(ruleText(id).includes('802-unit frame') && ruleText(id).includes('4.104'), id);
});
