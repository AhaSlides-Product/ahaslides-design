import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

export const ENVIRONMENT_TABLE_FILE = 'environments.json';
export const ENVIRONMENT_BASELINE_FILE = 'environments.baseline.json';
export const ENVIRONMENT_BASELINE_ABOUT = 'Items that shipped before every item had to declare "environment". standards.mjs fails a new or changed item without one, and fails when this list grows or names an item that no longer needs it; shrink it with node standards.mjs --update-baseline.';

export function loadEnvironmentTable(root) {
  return JSON.parse(readFileSync(join(root, ENVIRONMENT_TABLE_FILE), 'utf8'));
}

export const DEPRECATED_ENVIRONMENT_ALIASES = { 'marketing-web': 'web' };

export function canonicalEnvironment(name) {
  return typeof name === 'string' && Object.hasOwn(DEPRECATED_ENVIRONMENT_ALIASES, name) ? DEPRECATED_ENVIRONMENT_ALIASES[name] : name;
}

const canonicalEnvironments = (value) => Array.isArray(value) ? [...new Set(value.map(canonicalEnvironment))] : value;

export function environmentNames(table) {
  return Object.keys(table.environments);
}

export function fileSystemReader(root) {
  return {
    listJson: (folder) => existsSync(join(root, folder)) ? readdirSync(join(root, folder)).filter(f => f.endsWith('.json')).sort() : [],
    read: (path) => existsSync(join(root, path)) ? readFileSync(join(root, path), 'utf8') : null,
  };
}

export function gitReader(root, ref) {
  const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  return {
    listJson: (folder) => { try { return git('ls-tree', '--name-only', `${ref}:${folder}`).split('\n').filter(f => f.endsWith('.json')).sort(); } catch { return []; } },
    read: (path) => { try { return git('show', `${ref}:${path}`); } catch { return null; } },
  };
}

const parseJson = (text) => { try { return JSON.parse(text); } catch { return null; } };

export function collectItems(table, reader) {
  const items = [];
  for (const source of table.sources) {
    const entries = source.folder
      ? reader.listJson(source.folder).map(file => ({ path: `${source.folder}/${file}`, content: parseJson(reader.read(`${source.folder}/${file}`)) }))
      : (parseJson(reader.read(source.file))?.[source.list] || []).map(content => ({ path: source.file, content }));
    for (const { path, content } of entries) {
      if (!content || typeof content !== 'object') continue;
      const key = content[source.key] ?? path;
      items.push({ id: `${source.kind}:${key}`, kind: source.kind, key, path, environment: canonicalEnvironments(content.environment), content, source });
    }
  }
  return items;
}

export function environmentProblem(item, table) {
  const value = item.environment;
  if (value === undefined || (Array.isArray(value) && value.length === 0)) return 'missing';
  if (!Array.isArray(value) || value.some(name => typeof name !== 'string' || !(canonicalEnvironment(name) in table.environments))) return 'unknown';
  return null;
}

export function environmentsOutsideFolder(item) {
  const allowed = item.source.folderEnvironments;
  if (!allowed || !Array.isArray(item.environment)) return [];
  return item.environment.filter(name => !allowed.includes(name));
}

const withoutEnvironment = ({ environment, ...rest }) => JSON.stringify(rest);

export function newOrChangedItemIds(items, baseItems) {
  const before = new Map(baseItems.map(item => [item.id, withoutEnvironment(item.content)]));
  return new Set(items.filter(item => before.get(item.id) !== withoutEnvironment(item.content)).map(item => item.id));
}

/* baseItems / baseBaseline are null when no base branch can be read: the changed-item and growth checks then wait for CI. */
export function evaluateEnvironmentGate({ table, items, baseline, baseItems = null, baseBaseline = null }) {
  const failures = [];
  const baselined = new Set(baseline);
  const changed = baseItems ? newOrChangedItemIds(items, baseItems) : new Set();
  const stillMissing = new Set();
  const names = environmentNames(table).join(', ');
  for (const item of items) {
    const problem = environmentProblem(item, table);
    if (problem === 'unknown') failures.push(`${item.id} (${item.path}) names an unknown environment ${JSON.stringify(item.environment)}: use one or more of ${names}`);
    if (problem !== 'missing') continue;
    stillMissing.add(item.id);
    if (!baselined.has(item.id)) failures.push(`${item.id} (${item.path}) is new and declares no environment: add "environment": [...] with one or more of ${names}`);
    else if (changed.has(item.id)) failures.push(`${item.id} (${item.path}) changed in this pull request, so it must declare "environment" (one or more of ${names}) and leave the baseline`);
  }
  const stale = baseline.filter(id => !stillMissing.has(id));
  if (stale.length) failures.push(`${ENVIRONMENT_BASELINE_FILE} lists ${stale.length} item(s) that now declare an environment or no longer exist — run node standards.mjs --update-baseline: ${stale.slice(0, 8).join(', ')}${stale.length > 8 ? ` (+${stale.length - 8} more)` : ''}`);
  if (baseBaseline) {
    const before = new Set(baseBaseline);
    const added = baseline.filter(id => !before.has(id));
    if (added.length) failures.push(`${ENVIRONMENT_BASELINE_FILE} may only shrink, but this pull request adds: ${added.join(', ')} — declare "environment" on the item instead`);
  }
  return { failures, nextBaseline: baseline.filter(id => stillMissing.has(id)) };
}

export function declaredEnvironments(pullRequestBody) {
  const line = String(pullRequestBody || '').match(/^[ \t*_>-]*Environment[*_]*:(.*)$/mi);
  if (!line) return null;
  return [...new Set(line[1].replace(/[`*_]/g, '').split(/[\s,]+/).filter(Boolean).map(name => canonicalEnvironment(name.toLowerCase())))];
}

export function checkPullRequestDeclaration({ table, body, changedFiles, changedItems }) {
  const touched = changedFiles.filter(file => table.declarationPaths.some(prefix => file.startsWith(prefix)));
  if (!touched.length) return { required: false, problems: [] };
  const names = environmentNames(table);
  const declared = declaredEnvironments(body);
  if (!declared || !declared.length) {
    return { required: true, problems: [`this pull request changes ${touched.slice(0, 5).join(', ')}${touched.length > 5 ? ` (+${touched.length - 5} more)` : ''}, so its body needs a line "Environment: <one or more of ${names.join(', ')}>"`] };
  }
  const problems = [];
  const unknown = declared.filter(name => !names.includes(name));
  if (unknown.length) problems.push(`Environment: line names unknown environment(s) ${unknown.join(', ')} — use one or more of ${names.join(', ')}`);
  const fromItems = [...new Set(changedItems.flatMap(item => Array.isArray(item.environment) ? item.environment : []))].sort();
  const declaredSorted = [...declared].sort();
  if (fromItems.length && JSON.stringify(fromItems) !== JSON.stringify(declaredSorted)) {
    problems.push(`Environment: line says ${declaredSorted.join(', ')} but the changed items declare ${fromItems.join(', ')} — make the line match the items`);
  }
  return { required: true, problems };
}

export function routeHeaderLines(site, table) {
  return [
    `Route: start at ${site}/llms.txt, section "Routes": pick your environment (${environmentNames(table).join(', ')}) and follow its guidelines, judge, lint and owner.`,
    `Before you build: read ${site}/anti-slop.md (the binary judge) and ${site}/guidelines.llms.txt (composition patterns).`,
    'Claude Code: install the plugin ahaslides-design@ahaslides-design (/plugin marketplace add AhaSlides-Product/ahaslides-design).',
  ];
}

export function withRouteHeader(fileName, content, site, table) {
  const lines = routeHeaderLines(site, table);
  if (fileName.endsWith('.json')) {
    const data = JSON.parse(content);
    if (Array.isArray(data)) return content;
    const route = { index: `${site}/llms.txt`, environments: environmentNames(table), antiSlop: `${site}/anti-slop.md`, guidelines: `${site}/guidelines.llms.txt`, plugin: 'ahaslides-design@ahaslides-design', note: lines.join(' ') };
    return JSON.stringify({ route, ...data }, null, 2) + '\n';
  }
  if (fileName.endsWith('.css')) return `/*\n${lines.map(line => ` * ${line}`).join('\n')}\n */\n${content}`;
  return `${lines.map(line => `> ${line}`).join('\n')}\n\n${content}`;
}

export function routeLines(table, site) {
  const resolve = (value) => String(value).replaceAll('{site}', site);
  const lines = [
    '## Routes — pick your environment first',
    '',
    `Contract, guideline, website section and brand items declare \`environment\` (one or more of: ${environmentNames(table).join(', ')}); older items still being backfilled show no tag. Find the environment your task is for and follow its route.`,
    '',
  ];
  for (const [name, environment] of Object.entries(table.environments)) {
    lines.push(`### ${name} — ${environment.label}`, '', environment.summary);
    for (const [step, value] of Object.entries(environment.route)) {
      lines.push(`- ${step}: ${Array.isArray(value) ? value.map(resolve).join(' · ') : resolve(value)}`);
    }
    lines.push('');
  }
  return lines;
}
