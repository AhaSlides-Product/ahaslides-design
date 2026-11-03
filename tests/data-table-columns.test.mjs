import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createDataTable } from '../lib/aha-data-table.js';

// A minimal React: enough hooks to render DataTable's own function once per call, with its state
// kept between renders, so a test reads the columns DataTable hands to antd's Table.
function fakeReact() {
  let slots = [];
  let cursor = 0;
  const createElement = (type, props, ...children) => ({ type, props: { ...props, children } });
  const useState = (initial) => {
    const index = cursor++;
    if (!(index in slots)) slots[index] = typeof initial === 'function' ? initial() : initial;
    return [slots[index], (next) => { slots[index] = typeof next === 'function' ? next(slots[index]) : next; }];
  };
  const useMemo = (compute) => { cursor++; return compute(); };
  const useRef = (initial) => useState({ current: initial })[0];
  const useCallback = (callback) => { cursor++; return callback; };
  const noop = () => { cursor++; };
  const useId = () => useState(() => `id${cursor}`)[0];
  return {
    React: { createElement, useState, useMemo, useRef, useCallback, useId, useInsertionEffect: noop, useLayoutEffect: noop },
    begin: () => { cursor = 0; },
  };
}

const antdNames = ['ConfigProvider', 'Table', 'Button', 'Input', 'InputNumber', 'Checkbox', 'Dropdown', 'Popover', 'Tooltip'];
const antd = Object.fromEntries(antdNames.map((name) => [name, Object.assign(() => null, { displayName: name })]));

function find(node, match) {
  if (!node || typeof node !== 'object') return null;
  if (Array.isArray(node)) {
    for (const child of node) { const hit = find(child, match); if (hit) return hit; }
    return null;
  }
  if (match(node)) return node;
  return find(node.props?.children, match);
}

function mount(props) {
  const { React, begin } = fakeReact();
  const DataTable = createDataTable({ React, antd });
  let current = props;
  const render = () => { begin(); return DataTable(current); };
  let tree = render();
  const table = () => find(tree, (node) => node.type === antd.Table).props;
  const editor = () => {
    const element = find(tree, (node) => typeof node.type === 'function' && node.type.name === 'ColumnsEditor');
    return element && element.props;
  };
  return {
    shown: () => table().columns.map((column) => column.key),
    table,
    editor,
    rerender: (next) => { if (next) current = { ...current, ...next }; tree = render(); },
  };
}

const columns = [
  { key: 'name', title: 'Name', dataIndex: 'name', hideable: false },
  { key: 'team', title: 'Team', dataIndex: 'team' },
  { key: 'score', title: 'Score', dataIndex: 'score' },
  { key: 'joined', title: 'Joined', dataIndex: 'joined' },
];

test('without the new props every column shows and the editor has no Reset', () => {
  const grid = mount({ columns, columnsEditable: true });
  assert.deepEqual(grid.shown(), ['name', 'team', 'score', 'joined']);
  assert.equal(grid.editor().onReset, undefined);
  grid.editor().onToggle('team', false);
  grid.rerender();
  assert.deepEqual(grid.shown(), ['name', 'score', 'joined']);
});

test('visibleColumns controls the shown set; a toggle reports the next keys and waits for the prop', () => {
  const changes = [];
  const toggles = [];
  const grid = mount({
    columns, columnsEditable: true, visibleColumns: ['team'],
    onVisibleColumnsChange: (keys) => changes.push(keys), onColumnToggle: (key, visible) => toggles.push([key, visible]),
  });
  assert.deepEqual(grid.shown(), ['name', 'team'], 'a hideable:false column stays shown');
  grid.editor().onToggle('score', true);
  grid.rerender();
  assert.deepEqual(toggles, [['score', true]]);
  assert.deepEqual(changes, [['name', 'team', 'score']]);
  assert.deepEqual(grid.shown(), ['name', 'team'], 'controlled: nothing moves until the app passes new keys');
  grid.rerender({ visibleColumns: changes[0] });
  assert.deepEqual(grid.shown(), ['name', 'team', 'score']);
});

test('defaultVisibleColumns seeds the shown set and Reset restores it, firing onColumnsReset first', () => {
  const events = [];
  const grid = mount({
    columns, columnsEditable: true, defaultVisibleColumns: ['name', 'score'],
    onColumnsReset: () => events.push('reset'), onVisibleColumnsChange: (keys) => events.push(keys),
  });
  assert.deepEqual(grid.shown(), ['name', 'score']);
  grid.editor().onToggle('joined', true);
  grid.rerender();
  assert.deepEqual(grid.shown(), ['name', 'score', 'joined']);
  grid.editor().onReset();
  grid.rerender();
  assert.deepEqual(grid.shown(), ['name', 'score']);
  assert.deepEqual(events, [['name', 'score', 'joined'], 'reset', ['name', 'score']]);
});

test('opening Edit columns reaches onColumnsEditorOpenChange', () => {
  const opened = [];
  const grid = mount({ columns, columnsEditable: true, onColumnsEditorOpenChange: (open) => opened.push(open) });
  grid.editor().onOpenChange(true);
  assert.deepEqual(opened, [true]);
});

test('the value filter matches text by substring, numbers exactly and dates by calendar day', () => {
  const grid = mount({
    columns: [
      { key: 'name', title: 'Name', dataIndex: 'name', filter: { type: 'value' } },
      { key: 'score', title: 'Score', dataIndex: 'score', filter: { type: 'value', inputType: 'number' } },
      { key: 'joined', title: 'Joined', dataIndex: 'joined', filter: { type: 'value', inputType: 'date' } },
    ],
  });
  const [name, score, joined] = grid.table().columns;
  assert.equal(name.onFilter('ana ', { name: 'Ana Silva' }), true);
  assert.equal(name.onFilter('bob', { name: 'Ana Silva' }), false);
  assert.equal(score.onFilter(88, { score: '88' }), true);
  assert.equal(score.onFilter(8, { score: 88 }), false);
  assert.equal(score.onFilter(0, { score: '' }), false, 'an empty cell is not 0');
  assert.equal(joined.onFilter('2026-03-14', { joined: '2026-03-14' }), true);
  assert.equal(joined.onFilter('2026-03-14', { joined: new Date(2026, 2, 14, 18, 30) }), true);
  assert.equal(joined.onFilter('2026-03-14', { joined: new Date(2026, 2, 15) }), false);
  assert.equal(joined.onFilter('2026-03-14', { joined: null }), false);
});
