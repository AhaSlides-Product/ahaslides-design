// Usage: node changelog-between.mjs <CHANGELOG.md> <oldVersion> <newVersion>
// Prints every CHANGELOG entry newer than oldVersion, up to and including newVersion.
import { readFileSync } from 'node:fs';

const [changelogPath, oldVersion, newVersion] = process.argv.slice(2);
const parse = (version) => version.split('.').map(Number);
const compare = (left, right) => {
  const [a, b] = [parse(left), parse(right)];
  for (let index = 0; index < 3; index++) if (a[index] !== b[index]) return a[index] - b[index];
  return 0;
};

const output = [];
let keep = false;
for (const line of readFileSync(changelogPath, 'utf8').split('\n')) {
  const header = line.match(/^## (\d+\.\d+\.\d+)\b/);
  if (header) keep = compare(header[1], oldVersion) > 0 && compare(header[1], newVersion) <= 0;
  if (keep) output.push(line);
}
process.stdout.write(output.join('\n').trim() + '\n');
