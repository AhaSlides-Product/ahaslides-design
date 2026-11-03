import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { antdBaseTheme } from '../lib/antd-base-theme.js';
import { popconfirmTheme, destructiveConfirm } from '../lib/popconfirm-theme.js';

const { button } = JSON.parse(readFileSync(new URL('../tokens.canonical.json', import.meta.url), 'utf8')).color;
const upper = (hex) => hex.toUpperCase();

test('antd Button disabled colours are the aha-button disabled tokens', () => {
  const b = antdBaseTheme.components.Button;
  assert.equal(upper(b.colorBgContainerDisabled), upper(button.disabledBg));
  assert.equal(upper(b.borderColorDisabled), upper(button.disabledBg));
  assert.equal(upper(b.colorTextDisabled), upper(button.disabledFg));
});

test('a destructive confirm has one primary: Cancel, with a default confirm button', () => {
  assert.equal(destructiveConfirm.cancelButtonProps.type, 'primary');
  assert.equal(destructiveConfirm.okButtonProps.type, 'default');
  assert.equal(destructiveConfirm.okButtonProps.danger, undefined);
});

test('the popconfirm small button radius is the aha-button sm radius', () => {
  assert.equal(popconfirmTheme.components.Button.borderRadiusSM, 4);
});
