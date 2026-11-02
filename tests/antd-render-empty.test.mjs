import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRenderEmpty } from '../lib/antd-render-empty.js';

const h = (tag, props, child) => ({ tag, props, child });

test('a Table gets the empty-table illustration in the image slot', () => {
  const node = createRenderEmpty({ h })('Table');
  assert.equal(node.tag, 'aha-empty');
  assert.equal(node.props.description, 'No data');
  assert.equal(node.child.tag, 'aha-illustration');
  assert.deepEqual([node.child.props.slot, node.child.props.name], ['image', 'empty-table']);
});

test('dropdown-style components get the simple image, a List the default', () => {
  const renderEmpty = createRenderEmpty({ h });
  for (const name of ['Select', 'TreeSelect', 'Cascader', 'Transfer']) assert.equal(renderEmpty(name).props.image, 'simple', name);
  assert.equal(renderEmpty('List').props.image, 'default');
  assert.equal(renderEmpty().props.image, 'default');
});

test('labels override the caption per component, falling back to default', () => {
  const renderEmpty = createRenderEmpty({ h, labels: { Select: 'No options', default: 'Nothing here' } });
  assert.equal(renderEmpty('Select').props.description, 'No options');
  assert.equal(renderEmpty('List').props.description, 'Nothing here');
});
