import { test } from 'node:test';
import assert from 'node:assert/strict';
import { closeButtonRow } from '../lib/close-button-row.js';

const h = (type, props, children) => ({ type, props, children });

test('the shared close button is a Tab stop, so an antd focus trap that skips tabindex -1 hosts still reaches it', () => {
  const row = closeButtonRow(h, 'body', () => {});
  const close = row.children.find((node) => node.type === 'aha-button');
  assert.equal(close.props.tabIndex, 0);
});
