import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lintHtml } from '../lib/screen-lint.js';

const rulesOf = (source, surface = 'settings') => lintHtml(source, { surface }).findings.map((f) => f.rule);

test('an aha-button in an alert or info box sentence fails', () => {
  assert.ok(rulesOf('<aha-info-box variant="warning">Question <aha-button variant="link" size="xs">2</aha-button> has no prompt.</aha-info-box>').includes('alert-button-link'));
  assert.ok(rulesOf('<aha-alert type="info">See <aha-button variant="link">Help</aha-button></aha-alert>', 'product').includes('alert-button-link'));
});

test('a plain link, a button in slot="action" and an allow comment pass', () => {
  assert.ok(!rulesOf('<aha-info-box>Question <a href="#q2">2</a> has no prompt.</aha-info-box>').includes('alert-button-link'));
  assert.ok(!rulesOf('<aha-alert type="info">Saved<aha-button slot="action" variant="link">Undo</aha-button></aha-alert>', 'product').includes('alert-button-link'));
  assert.ok(!rulesOf('<aha-alert type="info">See <aha-button variant="link">Help</aha-button></aha-alert> <!-- ds-lint-allow: alert-button-link (legacy) -->', 'product').includes('alert-button-link'));
});
