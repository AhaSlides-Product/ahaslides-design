import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { loadVoiceRules, listVoiceRules, retiredWording, renderVoiceRulesAgent, renderVoiceRulesMd } from '../voice-rules.mjs';
import { copyFindings } from '../lib/screen-lint-copy.js';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const voice = loadVoiceRules(root);

test('rule ids are unique and numbered inside their section', () => {
  const ids = listVoiceRules(voice).map(rule => rule.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const rule of listVoiceRules(voice)) assert.ok(rule.id.startsWith(`${rule.section}.`), rule.id);
});

test('every rule has at least one kind of communication, all of them declared', () => {
  const declared = voice.kinds.map(kind => kind.id);
  for (const rule of listVoiceRules(voice)) {
    assert.ok(rule.kinds.length > 0, rule.id);
    for (const kind of rule.kinds) assert.ok(declared.includes(kind), `${rule.id}: ${kind}`);
  }
});

test('internal comms follow the writing rules only', () => {
  const internal = listVoiceRules(voice).filter(rule => rule.kinds.includes('internal'));
  assert.ok(internal.length > 0);
  for (const rule of internal) assert.ok(Number(rule.section) >= 10, rule.id);
});

test('every retired phrase fails the copy lint', () => {
  for (const { phrase } of retiredWording(voice)) {
    const rules = copyFindings(`<p>${phrase}</p>`, 'page.html').map(finding => finding.rule);
    assert.ok(rules.includes('retired-wording'), phrase);
  }
});

test('the agent feed and markdown carry the rules and the retired list', () => {
  const feed = JSON.parse(renderVoiceRulesAgent(voice, { site: 'https://example.test' }));
  assert.equal(feed.owner.email, 'ian@ahaslides.com');
  assert.equal(feed.rules.length, listVoiceRules(voice).length);
  assert.ok(feed.retired.length >= 6);
  assert.ok(feed.rulesByKind.external.length >= feed.rulesByKind.internal.length);
  assert.match(renderVoiceRulesMd(voice, { site: 'https://example.test' }), /## 14\. Retired wording/);
});
