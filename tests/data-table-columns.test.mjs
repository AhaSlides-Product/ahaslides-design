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
    React: { createElement, useState, useMemo, useRef, useCallback, useId, useEffect: noop, useInsertionEffect: noop, useLayoutEffect: noop },
    begin: () => { cursor = 0; },
  };
}

const antdNames = ['Radio', 'ConfigProvider', 'Table', 'Button', 'Input', 'InputNumber', 'Checkbox', 'Dropdown', 'Popover', 'Tooltip'];
const antd = Object.fromEntries(antdNames.map((name) => [name, Object.assign(() => null, { displayName: name })]));
antd.Radio.Group = Object.assign(() => null, { displayName: 'Radio.Group' });

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
    editorElement: () => find(tree, (node) => typeof node.type === 'function' && node.type.name === 'ColumnsEditor'),
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

test('a filter trigger is a named <button> in the Tab order that opens without sorting the column', () => {
  const grid = mount({
    columns: [{ key: 'team', title: 'Team', dataIndex: 'team', sorter: () => 0, filter: { type: 'checklist', options: ['A'] } }],
    labels: { filterColumn: 'Lọc' },
  });
  const trigger = grid.table().columns[0].filterDropdownProps.children;
  assert.equal(trigger.type, 'button');
  assert.equal(trigger.props.type, 'button');
  assert.ok(!(trigger.props.tabIndex < 0), 'never taken out of the Tab order');
  assert.equal(trigger.props['aria-label'], 'Lọc: Team');
  assert.equal(trigger.props['data-testid'], 'aha-data-table-filter-team');
  let stopped = 0;
  trigger.props.onKeyDown({ key: 'Enter', stopPropagation: () => { stopped += 1; } });
  trigger.props.onClick({ stopPropagation: () => { stopped += 1; } });
  assert.equal(stopped, 2, 'Enter and click stay on the trigger, so the header does not sort');
});

test('the filter panel is a named dialog whose keys stay inside it, and Escape refocuses its trigger', () => {
  const grid = mount({ columns: [{ key: 'team', title: 'Team', dataIndex: 'team', filter: { type: 'checklist', options: ['A'] } }] });
  const column = grid.table().columns[0];
  let refocused = 0;
  column.filterDropdownProps.children.props.ref({ focus: () => { refocused += 1; } });
  let closed = 0;
  const element = column.filterDropdown({ selectedKeys: [], setSelectedKeys: () => {}, confirm: () => {}, close: () => { closed += 1; } });
  const panel = element.type(element.props);
  assert.equal(panel.props.role, 'dialog');
  assert.equal(panel.props['aria-label'], 'Filter: Team');
  let stopped = 0;
  const stopPropagation = () => { stopped += 1; };
  panel.props.onKeyDown({ key: 'ArrowLeft', altKey: true, stopPropagation });
  assert.equal(stopped, 1, 'Alt+Arrow never reaches the header cell that moves columns');
  assert.equal(closed, 0);
  panel.props.onKeyDown({ key: 'Escape', stopPropagation });
  assert.deepEqual([closed, refocused], [1, 1]);
});

test('a column with antd filters and no DS filter keeps antd\'s own trigger', () => {
  const grid = mount({ columns: [{ key: 'team', title: 'Team', dataIndex: 'team', filters: [{ text: 'A', value: 'A' }] }] });
  const [team] = grid.table().columns;
  assert.equal(team.filterDropdownProps, undefined);
  assert.equal(team.filterIcon, undefined);
});

test('the first sort click sorts ascending unless the column sets its own order', () => {
  const grid = mount({
    columns: [
      { key: 'name', title: 'Name', dataIndex: 'name', sorter: () => 0 },
      { key: 'score', title: 'Score', dataIndex: 'score', sorter: () => 0, sortDirections: ['descend'] },
    ],
  });
  const [name, score] = grid.table().columns;
  assert.deepEqual(name.sortDirections, ['ascend', 'descend']);
  assert.deepEqual(score.sortDirections, ['descend']);
  const idleArrow = (column) => find(column.sortIcon({ sortOrder: null }), (node) => node.type === 'aha-icon').props.name;
  assert.equal(idleArrow(name), 'system-arrow-up');
  assert.equal(idleArrow(score), 'system-arrow-down', 'the idle arrow points the way the first click sorts');
});

test('the date filter has a Clear button that empties the typed date', () => {
  const grid = mount({ columns: [{ key: 'joined', title: 'Joined', dataIndex: 'joined', filter: { type: 'value', inputType: 'date' } }] });
  const picked = [];
  const panel = grid.table().columns[0].filterDropdown({
    selectedKeys: ['2026-03-14'], setSelectedKeys: (keys) => picked.push(keys), confirm: () => {}, clearFilters: () => {},
  });
  const tree = panel.type(panel.props);
  const clear = find(tree, (node) => node.props?.['data-testid'] === 'aha-data-table-filter-joined-panel-clear');
  assert.ok(clear, 'a date filter shows Clear');
  assert.equal(clear.props.disabled, false);
  const field = find(tree, (node) => node.props?.['data-testid'] === 'aha-data-table-filter-joined-panel-input');
  let focused = 0;
  field.props.ref.current = { focus: () => { focused += 1; } };
  clear.props.onClick();
  assert.deepEqual(picked, [[]]);
  assert.equal(focused, 1, 'focus leaves the now-disabled Clear for the date field');
});

test('the Edit columns search says when nothing matches and clears when the popover closes', () => {
  const grid = mount({ columns, columnsEditable: true, columnsSearchable: true });
  const renderEditor = () => { grid.rerender(); const element = grid.editorElement(); return element.type(element.props); };
  const byTestId = (tree, id) => find(tree, (node) => node.props?.['data-testid'] === id);
  let popover = renderEditor();
  assert.ok(byTestId(popover.props.content, 'aha-data-table-columns-column-team'), 'checkbox ids are scoped apart from the toolbar ids');
  byTestId(popover.props.content, 'aha-data-table-columns-search').props.onChange({ target: { value: 'zzz' } });
  popover = renderEditor();
  assert.equal(byTestId(popover.props.content, 'aha-data-table-columns-empty').props.children[0], 'No columns match');
  popover.props.onOpenChange(false);
  popover = renderEditor();
  assert.equal(byTestId(popover.props.content, 'aha-data-table-columns-empty'), null);
  assert.equal(byTestId(popover.props.content, 'aha-data-table-columns-search').props.value, '');
});

test('a checklist filter with multiple:false sets antd filterMultiple:false and a selection replaces the last', () => {
  const grid = mount({
    columns: [
      { key: 'status', title: 'Status', dataIndex: 'status', filter: { type: 'checklist', options: ['Draft', 'Live'], multiple: false } },
      { key: 'team', title: 'Team', dataIndex: 'team', filter: { type: 'checklist', options: ['A', 'B'] } },
    ],
  });
  const [status, team] = grid.table().columns;
  assert.equal(status.filterMultiple, false);
  assert.equal('filterMultiple' in team, false, 'the default mode leaves the column untouched');

  let selected = ['Draft'];
  const element = status.filterDropdown({ selectedKeys: selected, setSelectedKeys: (keys) => { selected = keys; }, confirm() {}, clearFilters() {} });
  const panel = element.type(element.props);
  const group = find(panel, (node) => node.type === antd.Radio.Group);
  assert.ok(group, 'single mode renders a radio group');
  assert.equal(find(panel, (node) => node.type === antd.Checkbox), null);
  group.props.onChange({ target: { value: 'Live' } });
  assert.deepEqual(selected, ['Live']);
});

test('the default checklist still renders checkboxes that accumulate', () => {
  const grid = mount({ columns: [{ key: 'team', title: 'Team', dataIndex: 'team', filter: { type: 'checklist', options: ['A', 'B'] } }] });
  let selected = ['A'];
  const element = grid.table().columns[0].filterDropdown({ selectedKeys: selected, setSelectedKeys: (keys) => { selected = keys; }, confirm() {}, clearFilters() {} });
  const panel = element.type(element.props);
  assert.equal(find(panel, (node) => node.type === antd.Radio.Group), null);
  find(panel, (node) => node.type === antd.Checkbox && node.props.children[0] === 'B').props.onChange({ target: { checked: true } });
  assert.deepEqual(selected, ['A', 'B']);
});

test('filter and column panels shift to stay on screen; a column can still override it', () => {
  const grid = mount({
    columnsEditable: true,
    columns: [
      { key: 'status', title: 'Status', dataIndex: 'status', filter: { type: 'checklist', options: ['A'], multiple: false } },
      { key: 'team', title: 'Team', dataIndex: 'team', filter: { type: 'checklist', options: ['A'] } },
      { key: 'age', title: 'Age', dataIndex: 'age', filter: { type: 'range' }, filterDropdownProps: { autoAdjustOverflow: false } },
    ],
  });
  const [status, team, age] = grid.table().columns;
  assert.deepEqual(status.filterDropdownProps.autoAdjustOverflow, { shiftX: true });
  assert.deepEqual(team.filterDropdownProps.autoAdjustOverflow, { shiftX: true });
  assert.equal(age.filterDropdownProps.autoAdjustOverflow, false);
  const editor = grid.editorElement().type(grid.editor());
  assert.deepEqual(find(editor, (node) => node.type === antd.Popover).props.autoAdjustOverflow, { shiftX: true });
});
