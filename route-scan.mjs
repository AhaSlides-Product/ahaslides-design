#!/usr/bin/env node
/**
 * route-scan.mjs — report-only scan of item environments, for a routine to run. Always exits 0.
 *   node route-scan.mjs          readable report
 *   node route-scan.mjs --json   { missing, unknown, folderMismatch, counts }
 * Lists items with no environment, an unknown environment, or an environment its folder does not
 * serve (environments.json → sources[].folderEnvironments). It never blocks: the item's owner decides.
 */
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEnvironmentTable, fileSystemReader, collectItems, environmentProblem, environmentsOutsideFolder } from './environments.mjs';

export function scanRoutes(table, items) {
  const describe = (item) => ({ id: item.id, path: item.path, environment: item.environment ?? null });
  const missing = items.filter(item => environmentProblem(item, table) === 'missing').map(describe);
  const unknown = items.filter(item => environmentProblem(item, table) === 'unknown').map(describe);
  const folderMismatch = items
    .filter(item => environmentProblem(item, table) === null && environmentsOutsideFolder(item).length)
    .map(item => ({ ...describe(item), folderServes: item.source.folderEnvironments, outside: environmentsOutsideFolder(item) }));
  return { missing, unknown, folderMismatch, counts: { items: items.length, missing: missing.length, unknown: unknown.length, folderMismatch: folderMismatch.length } };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const root = dirname(fileURLToPath(import.meta.url));
  const table = loadEnvironmentTable(root);
  const report = scanRoutes(table, collectItems(table, fileSystemReader(root)));
  if (process.argv.includes('--json')) console.log(JSON.stringify(report, null, 2));
  else {
    const { counts } = report;
    console.log(`route scan: ${counts.items} item(s) · ${counts.missing} with no environment · ${counts.unknown} unknown · ${counts.folderMismatch} outside their folder`);
    for (const item of report.unknown) console.log(`  unknown   ${item.id}  ${item.path}  ${JSON.stringify(item.environment)}`);
    for (const item of report.folderMismatch) console.log(`  mismatch  ${item.id}  ${item.path}  ${item.outside.join(', ')} (folder serves ${item.folderServes.join(', ')})`);
    for (const item of report.missing) console.log(`  missing   ${item.id}  ${item.path}`);
  }
}
