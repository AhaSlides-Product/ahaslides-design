import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  loadEnvironmentTable, environmentNames, canonicalEnvironment, fileSystemReader, collectItems, environmentProblem, evaluateEnvironmentGate,
  declaredEnvironments, checkPullRequestDeclaration, withRouteHeader, routeLines, ENVIRONMENT_BASELINE_FILE,
} from '../environments.mjs';
import { scanRoutes } from '../route-scan.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const table = loadEnvironmentTable(root);
const SITE = 'https://design.example';

const memoryReader = (files) => ({
  listJson: (folder) => Object.keys(files).filter(path => path.startsWith(`${folder}/`) && path.endsWith('.json')).map(path => path.slice(folder.length + 1)).sort(),
  read: (path) => (path in files ? JSON.stringify(files[path]) : null),
});
const itemsFrom = (files) => collectItems(table, memoryReader(files));

test('the table is the closed list of six environments, each with a complete route', () => {
  assert.deepEqual(environmentNames(table), ['product', 'audience', 'web', 'video', 'social-ads', 'report-image']);
  for (const [name, environment] of Object.entries(table.environments)) {
    assert.ok(environment.label && environment.summary, name);
    assert.deepEqual(Object.keys(environment.route), ['guidelines', 'judge', 'lint', 'plugin', 'owner'], name);
  }
});

test('every source folder and folder environment is real', () => {
  for (const source of table.sources) {
    assert.ok(source.kind && source.key && (source.folder || (source.file && source.list)), JSON.stringify(source));
    for (const name of source.folderEnvironments || []) assert.ok(name in table.environments, name);
  }
});

test('a new environment is data only: it reaches the llms.txt routes and the header without code', () => {
  const wider = structuredClone(table);
  wider.environments.print = { label: 'Print', summary: 'Posters and handouts.', route: { guidelines: ['{site}/print.md'], judge: 'j', lint: 'l', plugin: 'p', owner: 'o' } };
  const lines = routeLines(wider, SITE).join('\n');
  assert.match(lines, /### print — Print/);
  assert.match(lines, /- guidelines: https:\/\/design\.example\/print\.md/);
  assert.match(withRouteHeader('design.md', '# x\n', SITE, wider), /social-ads, report-image, print\)/);
});

test('every item in the repo is collected, and the baseline names only items still missing an environment', () => {
  const items = collectItems(table, fileSystemReader(root));
  assert.ok(items.some(item => item.id === 'contract:button'));
  assert.ok(items.some(item => item.id === 'marketing:hero'));
  assert.ok(items.some(item => item.id === 'brand:visual-identity-colour-rules'));
  const baseline = JSON.parse(readFileSync(join(root, ENVIRONMENT_BASELINE_FILE), 'utf8')).missing;
  const missing = new Set(items.filter(item => environmentProblem(item, table) === 'missing').map(item => item.id));
  assert.deepEqual(baseline.filter(id => !missing.has(id)), []);
  assert.deepEqual([...baseline].sort(), baseline);
});

test('the deprecated marketing-web id validates and routes as web', () => {
  assert.equal(canonicalEnvironment('marketing-web'), 'web');
  assert.equal(canonicalEnvironment('product'), 'product');
  assert.equal(environmentProblem({ environment: ['marketing-web'] }, table), null);
  const [item] = collectItems({ sources: [{ kind: 'contract', file: 'x.json', list: 'items', key: 'slug' }] }, { read: () => JSON.stringify({ items: [{ slug: 'a', environment: ['marketing-web', 'web', 'product'] }] }) });
  assert.deepEqual(item.environment, ['web', 'product']);
  assert.deepEqual(environmentNames(table).includes('marketing-web'), false);
});

test('environment must be a non-empty list of known names', () => {
  const problem = (environment) => environmentProblem({ environment }, table);
  assert.equal(problem(undefined), 'missing');
  assert.equal(problem([]), 'missing');
  assert.equal(problem('product'), 'unknown');
  assert.equal(problem(['product', 'tv']), 'unknown');
  assert.equal(problem(['product', 'audience']), null);
});

test('gate: a new item without an environment fails, an untouched baselined one passes', () => {
  const base = { 'contracts/old.json': { slug: 'old', name: 'Old' } };
  const now = { ...base, 'contracts/new.json': { slug: 'new', name: 'New' } };
  const { failures } = evaluateEnvironmentGate({ table, items: itemsFrom(now), baseline: ['contract:old'], baseItems: itemsFrom(base), baseBaseline: ['contract:old'] });
  assert.equal(failures.length, 1);
  assert.match(failures[0], /contract:new .* is new and declares no environment/);
});

test('gate: changing a baselined item fails until it declares an environment', () => {
  const base = { 'contracts/old.json': { slug: 'old', name: 'Old' } };
  const changed = { 'contracts/old.json': { slug: 'old', name: 'Old, renamed' } };
  const result = evaluateEnvironmentGate({ table, items: itemsFrom(changed), baseline: ['contract:old'], baseItems: itemsFrom(base), baseBaseline: ['contract:old'] });
  assert.match(result.failures.join(), /contract:old .* changed in this pull request/);
  const declared = { 'contracts/old.json': { slug: 'old', name: 'Old, renamed', environment: ['product'] } };
  const stale = evaluateEnvironmentGate({ table, items: itemsFrom(declared), baseline: ['contract:old'], baseItems: itemsFrom(base), baseBaseline: ['contract:old'] });
  assert.match(stale.failures.join(), /now declare an environment or no longer exist/);
  assert.deepEqual(stale.nextBaseline, []);
  assert.deepEqual(evaluateEnvironmentGate({ table, items: itemsFrom(declared), baseline: [], baseItems: itemsFrom(base), baseBaseline: ['contract:old'] }).failures, []);
});

test('gate: an unknown environment fails even on an old item', () => {
  const files = { 'marketing/promo.json': { slug: 'promo', environment: ['tiktok'] } };
  const { failures } = evaluateEnvironmentGate({ table, items: itemsFrom(files), baseline: [], baseItems: itemsFrom(files), baseBaseline: [] });
  assert.match(failures.join(), /marketing:promo .* unknown environment/);
});

test('gate: the baseline may only shrink', () => {
  const files = { 'contracts/a.json': { slug: 'a' }, 'contracts/b.json': { slug: 'b' } };
  const { failures } = evaluateEnvironmentGate({ table, items: itemsFrom(files), baseline: ['contract:a', 'contract:b'], baseItems: itemsFrom(files), baseBaseline: ['contract:a'] });
  assert.equal(failures.length, 1);
  assert.match(failures[0], /may only shrink, but this pull request adds: contract:b/);
});

test('gate: list sources (a manifest array) are items too', () => {
  const files = { 'logo/manifest.json': { logos: [{ id: 'zoom', environment: ['product'] }, { id: 'tiktok' }] } };
  const { failures } = evaluateEnvironmentGate({ table, items: itemsFrom(files), baseline: [], baseItems: null, baseBaseline: null });
  assert.equal(failures.length, 1);
  assert.match(failures[0], /logo:tiktok/);
});

test('pull request: the Environment: line is read loosely but matched exactly', () => {
  assert.equal(declaredEnvironments('no line here'), null);
  assert.deepEqual(declaredEnvironments('Environment:'), []);
  assert.deepEqual(declaredEnvironments('intro\n**Environment:** `video`, Social-Ads\n'), ['video', 'social-ads']);
});

test('pull request: an item folder change needs a declaration matching the changed items', () => {
  const changedItems = itemsFrom({ 'marketing/promo.json': { slug: 'promo', environment: ['video', 'social-ads'] } });
  const check = (body, changedFiles = ['marketing/promo.json']) => checkPullRequestDeclaration({ table, body, changedFiles, changedItems });
  assert.deepEqual(check('', ['lib/aha-button.js']), { required: false, problems: [] });
  assert.match(check('').problems[0], /needs a line "Environment:/);
  assert.match(check('Environment: video').problems[0], /changed items declare social-ads, video/);
  assert.match(check('Environment: video, social-ads, tv').problems[0], /unknown environment\(s\) tv/);
  assert.deepEqual(check('Environment: social-ads video').problems, []);
  const svgOnly = checkPullRequestDeclaration({ table, body: 'Environment: product', changedFiles: ['illustrations/svg/empty/x.svg'], changedItems: [] });
  assert.deepEqual(svgOnly, { required: true, problems: [] });
});

test('route header: text and CSS feeds get three lines on top, JSON objects a route key, JSON arrays stay as they are', () => {
  const markdown = withRouteHeader('design.md', '# Title\n', SITE, table);
  assert.equal(markdown.split('\n').slice(0, 3).filter(line => line.startsWith('> ')).length, 3);
  assert.ok(markdown.endsWith('# Title\n'));
  assert.match(withRouteHeader('variables.css', ':root{}\n', SITE, table), /^\/\*\n \* Route: start at https:\/\/design\.example\/llms\.txt/);
  const json = JSON.parse(withRouteHeader('icons.agent.json', '{"count":1}', SITE, table));
  assert.deepEqual(Object.keys(json), ['route', 'count']);
  assert.equal(json.route.index, `${SITE}/llms.txt`);
  assert.equal(withRouteHeader('guidelines.agent.json', '[1]', SITE, table), '[1]');
});

test('route scan reports missing, unknown and folder mismatches without failing', () => {
  const report = scanRoutes(table, itemsFrom({
    'contracts/plain.json': { slug: 'plain' },
    'contracts/ad.json': { slug: 'ad', environment: ['social-ads'] },
    'marketing/promo.json': { slug: 'promo', environment: ['tv'] },
    'marketing/hero.json': { slug: 'hero', environment: ['web'] },
  }));
  assert.deepEqual(report.counts, { items: 4, missing: 1, unknown: 1, folderMismatch: 1 });
  assert.equal(report.folderMismatch[0].id, 'contract:ad');
  assert.deepEqual(report.folderMismatch[0].outside, ['social-ads']);
});
