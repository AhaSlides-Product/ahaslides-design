/**
 * @ahaslides-product/design/aha-data-table — the shared DataTable (React · antd v6).
 *
 * Every AhaSlides data grid renders through this one component; a raw antd <Table> styled per
 * call site, or a hand-rolled <table>, is the drift it replaces. Call sites pass data + columns
 * only — the DS V3 look (white header, grey labels, dividers only, radius 8, 16px cells, gray-30
 * hover) and behaviour (single-arrow sort, checklist / range / value filters, drag reorder, right-click
 * freeze, resize, rows-per-page, edit columns) live here, once.
 *
 * Zero runtime dependencies: you hand it YOUR React + antd, so it shares your app's instances
 * (one React, one antd theme context) and works the same from a bundler or a CDN page.
 *
 *   import React from 'react';
 *   import { ConfigProvider, Table, Button, Input, InputNumber, Checkbox, Dropdown, Popover, Tooltip } from 'antd';
 *   import { createDataTable } from '@ahaslides-product/design/aha-data-table';
 *
 *   export const DataTable = createDataTable({
 *     React, antd: { ConfigProvider, Table, Button, Input, InputNumber, Checkbox, Dropdown, Popover, Tooltip },
 *   });   // once, at module scope — never inside a render
 *
 *   <DataTable rowKey="key" dataSource={rows} reorderable freezable resizable columnsEditable
 *     toolbarTitle="Leaderboard"
 *     columns={[
 *       { key: 'name',  title: 'Name',  dataIndex: 'name',  sorter: (a, b) => a.name.localeCompare(b.name), help: 'Participant name' },
 *       { key: 'team',  title: 'Team',  dataIndex: 'team',  filter: { type: 'checklist', options: ['Growth', 'Product'] } },
 *       { key: 'score', title: 'Score', dataIndex: 'score', sorter: (a, b) => a.score - b.score, filter: { type: 'range' } },
 *     ]} />
 *
 * A checklist filter is multi-select by default. `filter: { type: 'checklist', options, multiple: false }` makes it
 * single-choice: DS radios, picking one replaces the last, Reset clears it, and the column gets antd
 * `filterMultiple: false`. For server-side filtering pass `filteredValue` and an `onChange(pagination, filters)`;
 * `filters[key]` is then a one-item array (`['live']`) or `null`, so read `filters.status?.[0]`.
 *
 * Icons come from the DS library (<aha-icon> by name); this module registers it in the browser.
 * With no rows the body shows <aha-empty> with the empty-table illustration and the `noData`
 * label; pass `locale={{ emptyText }}` to replace it.
 */
import { tableTheme } from './table-theme.js';
import { dsAntdTheme } from './antd-base-theme.js';
import { createExpandableRows, expandableLabels } from './table-expandable.js';

// Registered lazily so importing this module stays safe during server-side rendering.
if (typeof window !== 'undefined') {
  import('./icons.js').catch(() => {});
  import('./aha-empty.js').catch(() => {});
  import('./illustrations-empty.js').catch(() => {});
}

/**
 * The antd theme the DataTable renders under — the shared `tableTheme`, completed to the DS V3
 * contract (contracts/table.json): gray-30 row hover, and a white header / body even on the
 * sorted column (antd tints both grey by default).
 */
export const dataTableTheme = dsAntdTheme({
  token: { ...tableTheme.token, colorText: '#1A1A1A' },
  components: {
    ...tableTheme.components,
    Table: {
      ...tableTheme.components.Table,
      rowHoverBg: '#F1F1F1',
      headerBorderRadius: 0,
      headerSortActiveBg: '#FFFFFF',
      headerSortHoverBg: '#F1F1F1',
      bodySortBg: '#FFFFFF',
      headerFilterHoverBg: '#E70E680D',
    },
  },
});

/** Default UI copy. Override any key through the `labels` prop (e.g. for i18n). */
export const dataTableLabels = {
  searchInFilters: 'Search in filters',
  reset: 'Reset',
  apply: 'Apply',
  filterColumn: 'Filter',
  clearValue: 'Clear',
  minValue: 'Min value',
  maxValue: 'Max value',
  enterValue: 'Enter a value',
  freezeColumn: 'Freeze column',
  defreezeColumn: 'Defreeze column',
  editColumns: 'Edit columns',
  searchColumns: 'Search columns',
  resetColumns: 'Reset columns',
  noColumnsMatch: 'No columns match',
  resizeColumn: 'Resize column',
  noData: 'No data',
  ...expandableLabels,
};

const ANTD_MEMBERS = ['ConfigProvider', 'Table', 'Button', 'Input', 'InputNumber', 'Checkbox', 'Dropdown', 'Popover', 'Tooltip'];
const STYLE_ID = 'aha-data-table-style';
const MIN_COLUMN_WIDTH = 80;
const KEYBOARD_RESIZE_STEP = 16;
// antd's corner placements only flip: a panel too wide for either side of a mid-table trigger stays off-screen, so it must shift
const PANEL_OVERFLOW = { shiftX: true };

const STYLE = `
.aha-data-table .ant-table{border:1px solid var(--aha-border-default,#E3E3E3);border-radius:var(--aha-radius-default,8px);overflow:clip}
/* cancels the border's 2px so the scrollport matches the width rc-table gives the empty cell */
.aha-data-table .ant-table-container{margin:-1px}
.aha-data-table__toolbar{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:var(--aha-space-8,8px);margin-bottom:var(--aha-space-12,12px)}
.aha-data-table__title{margin:0;font-size:var(--aha-size-h6,18px);font-weight:600;line-height:inherit;color:var(--aha-text-default,#1A1A1A)}
.aha-data-table__actions{display:flex;flex-wrap:wrap;gap:var(--aha-space-8,8px)}
.aha-data-table__search{flex:1 1 220px;max-width:320px;margin-inline-start:auto}
.aha-data-table__heading{display:inline-flex;align-items:center;gap:var(--aha-space-6,6px)}
.aha-data-table__handle{display:inline-flex;color:var(--aha-text-tertiary,#616161);opacity:0;transition:opacity var(--aha-motion-mid) var(--aha-ease-in-out)}
.aha-data-table th:hover .aha-data-table__handle,.aha-data-table th:focus-visible .aha-data-table__handle{opacity:1}
.aha-data-table__help{display:inline-flex;color:var(--aha-text-tertiary,#616161);cursor:help}
.aha-data-table th.aha-data-table__th{transition:background-color var(--aha-motion-fast) var(--aha-ease-in-out),box-shadow var(--aha-motion-fast) var(--aha-ease-in-out)}
.aha-data-table th[draggable="true"]{cursor:grab}
.aha-data-table th.aha-data-table__th:not(.ant-table-cell-fix){position:relative}
.aha-data-table th.aha-data-table__th--dragging{background:var(--aha-gray-30,#F1F1F1)}
.aha-data-table th.aha-data-table__th--drop-before{box-shadow:inset 2px 0 0 0 var(--aha-color-primary,#E70E68)}
.aha-data-table th.aha-data-table__th--drop-after{box-shadow:inset -2px 0 0 0 var(--aha-color-primary,#E70E68)}
.aha-data-table__sort{display:inline-flex;color:var(--aha-icon-muted,#8A8A8A);transition:color var(--aha-motion-mid) var(--aha-ease-in-out)}
.aha-data-table__sort--on{color:var(--aha-text-default,#1A1A1A)}
.aha-data-table .ant-table-filter-trigger{border-radius:var(--aha-radius-xs,4px);color:var(--aha-text-tertiary,#616161);transition:background-color var(--aha-motion-mid) var(--aha-ease-in-out),color var(--aha-motion-mid) var(--aha-ease-in-out),box-shadow var(--aha-motion-mid) var(--aha-ease-in-out)}
.aha-data-table .ant-table-filter-trigger:hover{background:var(--aha-bg-accent,#E70E680D);color:var(--aha-text-default,#1A1A1A)}
.aha-data-table .ant-table-filter-trigger.ant-dropdown-open{background:var(--aha-bg-accent,#E70E680D);color:var(--aha-text-default,#1A1A1A)}
.aha-data-table .ant-table-filter-trigger.active{background:var(--aha-color-primary,#E70E68);color:var(--aha-text-inverse,#FFFFFF)}
.aha-data-table button.ant-table-filter-trigger{border:0;background:transparent;font:inherit;cursor:pointer;outline:none}
.aha-data-table button.ant-table-filter-trigger:focus-visible{box-shadow:0 0 0 2px var(--aha-focus-ring,#E70E68)}
.aha-data-table .ant-table-tbody>tr.aha-data-table__row--highlight>td,.aha-data-table .ant-table-tbody>tr.aha-data-table__row--highlight:hover>td{background:var(--aha-bg-accent,#E70E680D)}
.aha-data-table__resize{position:absolute;top:0;right:0;bottom:0;width:8px;display:flex;justify-content:center;cursor:col-resize;z-index:2;touch-action:none}
.aha-data-table__resize::after{content:"";width:2px;background:transparent;transition:background-color var(--aha-motion-fast) var(--aha-ease-in-out)}
.aha-data-table__resize:hover::after,.aha-data-table__resize:focus-visible::after,.aha-data-table__resize--active::after{background:var(--aha-color-primary,#E70E68)}
.aha-data-table__resize:focus-visible{outline:none}
.aha-data-table-pop{width:min(248px,calc(100vw - 32px));font-family:var(--aha-font-product)}
.aha-data-table-pop__search{margin-bottom:var(--aha-space-10,10px)}
.aha-data-table-pop__list{max-height:190px;overflow:auto;display:flex;flex-direction:column;gap:var(--aha-space-10,10px)}
.aha-data-table-pop__radios.ant-radio-group{display:flex;flex-direction:column;gap:var(--aha-space-10,10px)}
.aha-data-table-pop__empty{color:var(--aha-text-tertiary,#616161)}
.aha-data-table-pop__label{font-size:var(--aha-size-default,14px);color:var(--aha-text-default,#1A1A1A);margin-bottom:var(--aha-space-6,6px)}
.aha-data-table-pop__label + .ant-input-number{width:100%}
.aha-data-table-pop__label ~ .aha-data-table-pop__label{margin-top:var(--aha-space-12,12px)}
.aha-data-table-pop__value{width:100%}
.aha-data-table-pop__field{display:flex;gap:var(--aha-space-8,8px);align-items:center}
.aha-data-table-pop__field .aha-data-table-pop__value{flex:1 1 auto;min-width:0}
.aha-data-table-pop__foot{display:flex;justify-content:space-between;align-items:center;gap:var(--aha-space-8,8px);margin-top:var(--aha-space-12,12px);padding-top:var(--aha-space-10,10px);border-top:1px solid var(--aha-border-default,#E3E3E3)}
.aha-data-table-pop__reset.ant-btn{color:var(--aha-text-tertiary,#616161)}
.ant-dropdown .ant-table-filter-dropdown:has(.aha-data-table-pop){padding:var(--aha-space-12,12px)}
`;

const columnKeyOf = (column) => String(column.key ?? (Array.isArray(column.dataIndex) ? column.dataIndex.join('.') : column.dataIndex));
const valueAt = (record, dataIndex) =>
  Array.isArray(dataIndex) ? dataIndex.reduce((value, part) => (value == null ? value : value[part]), record) : record?.[dataIndex];
const normaliseOptions = (options = []) =>
  options.map((option) => (option !== null && typeof option === 'object' ? option : { label: String(option), value: option }));
const parseRange = (encoded) => {
  const [min, max] = String(encoded ?? '|').split('|');
  const toNumber = (text) => (text === '' || text === undefined ? null : Number(text));
  return [toNumber(min), toNumber(max)];
};
const encodeRange = (min, max) => `${min ?? ''}|${max ?? ''}`;
const pad2 = (number) => String(number).padStart(2, '0');
const calendarDay = (value) => {
  if (value == null || value === '') return null;
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
};
const matchesValue = (inputType, cellValue, value) => {
  if (cellValue == null || String(cellValue).trim() === '') return false;
  if (inputType === 'number') return Number(cellValue) === Number(value);
  if (inputType === 'date') {
    const day = calendarDay(cellValue);
    return day !== null && day === calendarDay(value);
  }
  return String(cellValue).toLowerCase().includes(String(value).trim().toLowerCase());
};

function moveColumn(order, fromKey, toKey, side) {
  if (fromKey === toKey) return order;
  const next = order.filter((key) => key !== fromKey);
  const targetIndex = next.indexOf(toKey);
  if (targetIndex < 0) return order;
  next.splice(side === 'after' ? targetIndex + 1 : targetIndex, 0, fromKey);
  return next;
}

function reconcileOrder(order, keys) {
  const known = new Set(keys);
  const kept = order.filter((key) => known.has(key));
  return kept.concat(keys.filter((key) => !kept.includes(key)));
}

/**
 * Build the DataTable component bound to the caller's React + antd.
 *
 * @param {{ React: object, antd: object }} deps — `antd` must provide ConfigProvider, Table, Button,
 *   Input, InputNumber, Checkbox, Dropdown, Popover and Tooltip (a namespace import works). `Radio` is only
 *   needed by a column that sets `filter: { multiple: false }` (antd v6 always ships it).
 * @returns {Function} the `DataTable` React component. Props: every antd Table prop, plus
 *   `columns` (each `{ key, title, dataIndex, … }` with optional `help`, `filter: { type: 'checklist', options, multiple? } | { type: 'range' }
 *   | { type: 'value', inputType: 'text' | 'number' | 'date', label }` and `hideable: false`), `toolbarTitle`, `toolbarTitleLevel`,
 *   `toolbarSearch`, `toolbarActions`, `reorderable`, `freezable`, `resizable`, `columnsEditable`, `columnsSearchable`,
 *   `highlightedRowKey`, `testIdPrefix`, `visibleColumns` / `defaultVisibleColumns` /
 *   `onVisibleColumnsChange(visibleKeys)`, `onColumnsEditorOpenChange(open)`, `onColumnToggle(key, visible)`,
 *   `onColumnsReset()`, `expandableRows` (the `useExpandableRows` options from table-expandable) and `labels`.
 *   `DataTable.DetailSection` is the titled block to return from `expandableRows.renderDetail`.
 */
export function createDataTable({ React, antd } = {}) {
  const missing = !React ? ['React'] : ANTD_MEMBERS.filter((name) => !antd || !antd[name]);
  if (missing.length) throw new Error(`createDataTable: missing ${missing.join(', ')} — pass { React, antd: { ${ANTD_MEMBERS.join(', ')} } }`);

  const h = React.createElement;
  const { useMemo, useRef, useState, useCallback, useEffect } = React;
  const useInsertStyle = React.useInsertionEffect || React.useLayoutEffect;
  const { ConfigProvider, Table, Button, Input, InputNumber, Checkbox, Dropdown, Popover, Tooltip } = antd;
  const { Radio } = antd;
  const { useExpandableRows, DetailSection } = createExpandableRows({ React });

  const icon = (name, size = 16) => h('aha-icon', { name, size: String(size), decorative: '' });

  function useSharedStyle() {
    useInsertStyle(() => {
      if (document.getElementById(STYLE_ID)) return;
      const style = document.createElement('style');
      style.id = STYLE_ID;
      style.textContent = STYLE;
      document.head.appendChild(style);
    }, []);
  }

  function SortIcon({ sortOrder, firstDirection = 'ascend' }) {
    const direction = sortOrder || firstDirection;
    return h('span', { className: 'aha-data-table__sort' + (sortOrder ? ' aha-data-table__sort--on' : '') },
      icon(direction === 'descend' ? 'system-arrow-down' : 'system-arrow-up', 16));
  }

  const FOCUSABLE = 'input:not([disabled]),button:not([disabled]),[tabindex]:not([tabindex="-1"])';

  function usePanel({ testId, visible, close, dialogLabel, returnFocus }) {
    const ref = useRef(null);
    useEffect(() => {
      if (!visible) return undefined;
      const frame = requestAnimationFrame(() => ref.current?.querySelector(FOCUSABLE)?.focus());
      return () => cancelAnimationFrame(frame);
    }, [visible]);
    return {
      ref, className: 'aha-data-table-pop', 'data-testid': testId, role: 'dialog', 'aria-label': dialogLabel,
      onKeyDown: (event) => {
        event.stopPropagation();
        if (event.key !== 'Escape') return;
        close?.();
        returnFocus?.();
      },
    };
  }

  function PopoverFooter({ labels, testId, onReset, onApply }) {
    return h('div', { className: 'aha-data-table-pop__foot' },
      h(Button, { type: 'text', size: 'small', className: 'aha-data-table-pop__reset', 'data-testid': `${testId}-reset`, onClick: onReset }, labels.reset),
      h(Button, { type: 'primary', size: 'small', 'data-testid': `${testId}-apply`, onClick: onApply }, labels.apply));
  }

  function ChecklistFilter({ options, multiple = true, labels, testId, visible, close, dialogLabel, returnFocus, selectedKeys, setSelectedKeys, confirm, clearFilters }) {
    const [query, setQuery] = useState('');
    const panel = usePanel({ testId, visible, close, dialogLabel, returnFocus });
    const shown = options.filter((option) => option.label.toLowerCase().includes(query.toLowerCase()));
    if (!multiple && !Radio) throw new Error('createDataTable: filter { multiple: false } needs antd.Radio — pass it in { React, antd: { …, Radio } }');
    const list = multiple
      ? shown.map((option) => h(Checkbox, {
        key: String(option.value), checked: selectedKeys.includes(option.value),
        onChange: (event) => setSelectedKeys(event.target.checked
          ? [...selectedKeys, option.value]
          : selectedKeys.filter((selected) => selected !== option.value)),
      }, option.label))
      : h(Radio.Group, {
        className: 'aha-data-table-pop__radios', 'aria-label': dialogLabel, value: selectedKeys[0] ?? null,
        onChange: (event) => setSelectedKeys([event.target.value]),
      }, shown.map((option) => h(Radio, { key: String(option.value), value: option.value }, option.label)));
    return h('div', panel,
      h(Input, {
        className: 'aha-data-table-pop__search', value: query, allowClear: true, placeholder: labels.searchInFilters, 'data-testid': `${testId}-search`,
        'aria-label': labels.searchInFilters, prefix: icon('system-magnifying-glass', 16), onChange: (event) => setQuery(event.target.value),
      }),
      h('div', { className: 'aha-data-table-pop__list' }, list),
      h(PopoverFooter, {
        labels, testId,
        onReset: () => { clearFilters?.(); setQuery(''); confirm(); },
        onApply: () => confirm(),
      }));
  }

  function RangeFilter({ labels, testId, visible, close, dialogLabel, returnFocus, selectedKeys, setSelectedKeys, confirm, clearFilters }) {
    const panel = usePanel({ testId, visible, close, dialogLabel, returnFocus });
    const [min, max] = parseRange(selectedKeys[0]);
    const update = (nextMin, nextMax) =>
      setSelectedKeys(nextMin == null && nextMax == null ? [] : [encodeRange(nextMin, nextMax)]);
    return h('div', panel,
      h('div', { className: 'aha-data-table-pop__label' }, labels.minValue),
      h(InputNumber, { value: min, 'aria-label': labels.minValue, 'data-testid': `${testId}-min`, onChange: (value) => update(value, max) }),
      h('div', { className: 'aha-data-table-pop__label' }, labels.maxValue),
      h(InputNumber, { value: max, 'aria-label': labels.maxValue, 'data-testid': `${testId}-max`, onChange: (value) => update(min, value) }),
      h(PopoverFooter, { labels, testId, onReset: () => { clearFilters?.(); confirm(); }, onApply: () => confirm() }));
  }

  function ValueFilter({ inputType = 'text', label, labels, testId, visible, close, dialogLabel, returnFocus, selectedKeys, setSelectedKeys, confirm, clearFilters }) {
    const panel = usePanel({ testId, visible, close, dialogLabel, returnFocus });
    const fieldRef = useRef(null);
    const value = selectedKeys[0];
    const update = (next) => setSelectedKeys(next == null || String(next).trim() === '' ? [] : [next]);
    const common = { ref: fieldRef, className: 'aha-data-table-pop__value', 'aria-label': label, 'data-testid': `${testId}-input`, onPressEnter: () => confirm() };
    const isDate = inputType === 'date';
    const field = inputType === 'number'
      ? h(InputNumber, { ...common, value: value ?? null, placeholder: labels.enterValue, onChange: update })
      : h(Input, {
        ...common, type: isDate ? 'date' : 'text', value: value ?? '', allowClear: !isDate,
        placeholder: labels.enterValue, onChange: (event) => update(event.target.value),
      });
    const clearDate = isDate ? h(Button, {
      type: 'text', size: 'small', disabled: value == null || value === '',
      'aria-label': `${labels.clearValue}: ${label}`, 'data-testid': `${testId}-clear`,
      onClick: () => { update(null); fieldRef.current?.focus?.(); },
    }, labels.clearValue) : null;
    return h('div', panel,
      h('div', { className: 'aha-data-table-pop__label' }, label),
      clearDate ? h('div', { className: 'aha-data-table-pop__field' }, field, clearDate) : field,
      h(PopoverFooter, { labels, testId, onReset: () => { clearFilters?.(); confirm(); }, onApply: () => confirm() }));
  }

  const filterTrigger = ({ label, labels, testId, filtered, open, triggerRef, children }) => h('button', {
    ref: triggerRef,
    type: 'button',
    className: 'ant-table-filter-trigger' + (filtered ? ' active' : ''),
    'aria-label': `${labels.filterColumn}: ${label}`,
    'aria-haspopup': 'dialog',
    'aria-expanded': open ? 'true' : 'false',
    'data-testid': testId,
    onClick: (event) => event.stopPropagation(),
    onKeyDown: (event) => { if (event.key === 'Enter' || event.key === ' ') event.stopPropagation(); },
  }, children);

  function HeaderCell(props) {
    const { dataTableColumn: column, children, className, ...rest } = props;
    const cellRef = useRef(null);
    const [dropSide, setDropSide] = useState(null);
    const [dragging, setDragging] = useState(false);
    const [resizing, setResizing] = useState(false);
    if (!column) return h('th', { className, ...rest }, children);

    const { key, label, labels, draggable, frozen, onFreezeToggle, onMove, onDropColumn, dragKeyRef, resizable, width, onResize } = column;
    const classes = [className, 'aha-data-table__th',
      dragging && 'aha-data-table__th--dragging',
      dropSide && `aha-data-table__th--drop-${dropSide}`].filter(Boolean).join(' ');

    const startResize = (event) => {
      event.preventDefault();
      event.stopPropagation();
      event.currentTarget.setPointerCapture(event.pointerId);
      const startX = event.clientX;
      const startWidth = cellRef.current ? cellRef.current.getBoundingClientRect().width : (width || MIN_COLUMN_WIDTH);
      event.currentTarget.dataset.startX = String(startX);
      event.currentTarget.dataset.startWidth = String(startWidth);
      setResizing(true);
    };
    const trackResize = (event) => {
      if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
      const { startX, startWidth } = event.currentTarget.dataset;
      onResize(key, Math.max(MIN_COLUMN_WIDTH, Math.round(Number(startWidth) + event.clientX - Number(startX))));
    };
    const endResize = (event) => {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
      setResizing(false);
    };
    const currentWidth = () => Math.round(width || (cellRef.current ? cellRef.current.getBoundingClientRect().width : MIN_COLUMN_WIDTH));
    const resizeByKeyboard = (event) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      event.stopPropagation();
      const delta = event.key === 'ArrowRight' ? KEYBOARD_RESIZE_STEP : -KEYBOARD_RESIZE_STEP;
      onResize(key, Math.max(MIN_COLUMN_WIDTH, currentWidth() + delta));
    };

    const onKeyDown = (event) => {
      rest.onKeyDown?.(event);
      if (!onMove || !event.altKey || (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight')) return;
      event.preventDefault();
      onMove(key, event.key === 'ArrowLeft' ? -1 : 1);
    };

    const dragProps = draggable ? {
      draggable: true,
      onDragStart: (event) => {
        dragKeyRef.current = key;
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', key);
        setDragging(true);
      },
      onDragEnd: () => { dragKeyRef.current = null; setDragging(false); },
    } : {};
    const dropProps = onDropColumn ? {
      onDragOver: (event) => {
        if (!dragKeyRef.current || dragKeyRef.current === key) return;
        event.preventDefault();
        const box = event.currentTarget.getBoundingClientRect();
        const side = frozen || event.clientX >= box.left + box.width / 2 ? 'after' : 'before';
        if (side !== dropSide) setDropSide(side);
      },
      onDragLeave: () => setDropSide(null),
      onDrop: (event) => {
        event.preventDefault();
        if (dragKeyRef.current) onDropColumn(dragKeyRef.current, key, dropSide || 'before');
        setDropSide(null);
      },
    } : {};

    const cell = h('th', {
      ...rest,
      ...dragProps,
      ...dropProps,
      ref: cellRef,
      className: classes,
      ...(rest['aria-label'] !== undefined && { 'aria-label': label }),
      tabIndex: rest.tabIndex ?? (onMove || onFreezeToggle ? 0 : undefined),
      onKeyDown,
    },
    children,
    resizable ? h('span', {
      className: 'aha-data-table__resize' + (resizing ? ' aha-data-table__resize--active' : ''),
      role: 'separator', 'aria-orientation': 'vertical', tabIndex: 0,
      'aria-label': `${labels.resizeColumn}: ${label}`,
      'aria-valuenow': width ? Math.round(width) : undefined, 'aria-valuemin': MIN_COLUMN_WIDTH,
      draggable: false,
      onPointerDown: startResize, onPointerMove: trackResize, onPointerUp: endResize, onPointerCancel: endResize,
      onKeyDown: resizeByKeyboard, onClick: (event) => event.stopPropagation(),
    }) : null);

    if (!onFreezeToggle) return cell;
    return h(Dropdown, {
      trigger: ['contextMenu'],
      menu: {
        items: [{ key: 'freeze', label: frozen ? labels.defreezeColumn : labels.freezeColumn, icon: icon(frozen ? 'system-push-pin-slash' : 'system-push-pin', 16) }],
        onClick: () => onFreezeToggle(key),
      },
    }, cell);
  }

  const headerComponents = { header: { cell: HeaderCell } };

  function ColumnsEditor({ columns, hidden, onToggle, onReset, onOpenChange, searchable, labels, testId }) {
    const [query, setQuery] = useState('');
    const needle = searchable ? query.trim().toLowerCase() : '';
    const shown = needle ? columns.filter((column) => column.label.toLowerCase().includes(needle)) : columns;
    const content = h('div', { className: 'aha-data-table-pop', 'data-testid': `${testId}-panel` },
      searchable ? h(Input, {
        className: 'aha-data-table-pop__search', value: query, allowClear: true, placeholder: labels.searchColumns,
        'aria-label': labels.searchColumns, 'data-testid': `${testId}-search`, prefix: icon('system-magnifying-glass', 16),
        onChange: (event) => setQuery(event.target.value),
      }) : null,
      h('div', { className: 'aha-data-table-pop__list' },
        shown.length ? shown.map((column) => h(Checkbox, {
          key: column.key,
          checked: !hidden.includes(column.key),
          disabled: column.hideable === false,
          'data-testid': `${testId}-column-${column.key}`,
          onChange: (event) => onToggle(column.key, event.target.checked),
        }, column.label)) : h('div', { className: 'aha-data-table-pop__empty', role: 'status', 'data-testid': `${testId}-empty` }, labels.noColumnsMatch)),
      onReset ? h('div', { className: 'aha-data-table-pop__foot' },
        h(Button, {
          type: 'text', size: 'small', className: 'aha-data-table-pop__reset', 'data-testid': `${testId}-reset`,
          onClick: () => { setQuery(''); onReset(); },
        }, labels.resetColumns)) : null);
    const openChange = (open) => {
      if (!open) setQuery('');
      onOpenChange?.(open);
    };
    return h(Popover, { trigger: 'click', placement: 'bottomRight', autoAdjustOverflow: PANEL_OVERFLOW, content, onOpenChange: openChange },
      h(Button, { icon: icon('system-sliders-horizontal', 16), 'data-testid': `${testId}-button` }, labels.editColumns));
  }

  function DataTable(props) {
    const {
      columns = [], toolbarTitle, toolbarTitleLevel = 2, toolbarSearch, toolbarActions, reorderable = false, freezable = false,
      resizable = false, columnsEditable = false, columnsSearchable = false, visibleColumns, defaultVisibleColumns,
      onVisibleColumnsChange, onColumnsEditorOpenChange, onColumnToggle, onColumnsReset, highlightedRowKey,
      testIdPrefix = 'aha-data-table', expandableRows, labels: labelOverrides, pagination, scroll, components, locale, ...tableProps
    } = props;
    useSharedStyle();
    const labels = useMemo(() => ({ ...dataTableLabels, ...labelOverrides }), [labelOverrides]);

    const keyed = useMemo(() => columns.map((column) => ({ column, key: columnKeyOf(column) })), [columns]);
    const byKey = useMemo(() => new Map(keyed.map((entry) => [entry.key, entry.column])), [keyed]);
    const keys = useMemo(() => keyed.map((entry) => entry.key), [keyed]);

    const [storedOrder, setOrder] = useState(keys);
    const [frozenKey, setFrozenKey] = useState(null);
    const hiddenOutside = (visibleKeys) => (visibleKeys
      ? keys.filter((key) => !visibleKeys.includes(key) && byKey.get(key).hideable !== false)
      : []);
    const [storedHidden, setHidden] = useState(() => hiddenOutside(defaultVisibleColumns));
    const visibilityControlled = visibleColumns !== undefined;
    const hidden = useMemo(
      () => (visibilityControlled ? hiddenOutside(visibleColumns) : storedHidden),
      [visibilityControlled, visibleColumns, storedHidden, keys, byKey],
    );
    const [widths, setWidths] = useState({});
    const [appliedFilters, setAppliedFilters] = useState({});
    const [openFilterKey, setOpenFilterKey] = useState(null);
    const filterTriggers = useRef({});
    const dragKeyRef = useRef(null);

    const expansion = useExpandableRows(expandableRows ? {
      dataSource: tableProps.dataSource, rowKey: tableProps.rowKey ?? 'key', onRow: tableProps.onRow, labels: labelOverrides, ...expandableRows,
    } : null);

    const order = useMemo(() => reconcileOrder(storedOrder, keys), [storedOrder, keys]);
    const activeFrozenKey = frozenKey && byKey.has(frozenKey) ? frozenKey : null;
    const labelOf = (key) => {
      const title = byKey.get(key)?.title;
      return typeof title === 'string' || typeof title === 'number' ? String(title) : key;
    };

    const dropColumn = useCallback((fromKey, toKey, side) => {
      if (fromKey === activeFrozenKey) return;
      setOrder((previous) => moveColumn(reconcileOrder(previous, keys), fromKey, toKey, toKey === activeFrozenKey ? 'after' : side));
    }, [keys, activeFrozenKey]);

    const moveByKeyboard = useCallback((key, step) => {
      if (key === activeFrozenKey) return;
      setOrder((previous) => {
        const current = reconcileOrder(previous, keys).filter((candidate) => !hidden.includes(candidate));
        const neighbour = current[current.indexOf(key) + step];
        if (!neighbour || neighbour === activeFrozenKey) return previous;
        return moveColumn(reconcileOrder(previous, keys), key, neighbour, step > 0 ? 'after' : 'before');
      });
    }, [keys, activeFrozenKey, hidden]);

    const toggleFreeze = useCallback((key) => {
      if (key === activeFrozenKey) { setFrozenKey(null); return; }
      setFrozenKey(key);
      setOrder((previous) => [key, ...reconcileOrder(previous, keys).filter((candidate) => candidate !== key)]);
    }, [keys, activeFrozenKey]);

    const resizeColumn = useCallback((key, width) => setWidths((previous) => ({ ...previous, [key]: width })), []);

    const applyHidden = (nextHidden) => {
      if (!visibilityControlled) setHidden(nextHidden);
      onVisibleColumnsChange?.(order.filter((key) => !nextHidden.includes(key)));
    };

    const toggleHidden = (key, visible) => {
      onColumnToggle?.(key, visible);
      applyHidden(visible ? hidden.filter((candidate) => candidate !== key) : [...hidden, key]);
    };

    const resetColumns = () => {
      onColumnsReset?.();
      applyHidden(hiddenOutside(defaultVisibleColumns));
    };
    const showColumnsReset = visibilityControlled || defaultVisibleColumns !== undefined || onColumnsReset !== undefined;

    const filterDropdownPropsFor = (column, key, testId) => {
      const own = column.filterDropdownProps || {};
      const applied = 'filteredValue' in column ? column.filteredValue
        : (Object.prototype.hasOwnProperty.call(appliedFilters, key) ? appliedFilters[key] : column.defaultFilteredValue);
      const open = own.open ?? openFilterKey === key;
      const content = typeof column.filterIcon === 'function'
        ? column.filterIcon(!!applied?.length)
        : column.filterIcon || icon('system-funnel', 16);
      return {
        autoAdjustOverflow: PANEL_OVERFLOW,
        ...own,
        onOpenChange: (next, info) => {
          setOpenFilterKey((current) => (next ? key : current === key ? null : current));
          own.onOpenChange?.(next, info);
        },
        children: own.children ?? filterTrigger({
          label: labelOf(key), labels, testId, filtered: !!applied?.length, open, children: content,
          triggerRef: (node) => { filterTriggers.current[key] = node; },
        }),
      };
    };

    const shapedColumns = useMemo(() => {
      const visibleOrder = (activeFrozenKey ? [activeFrozenKey, ...order.filter((key) => key !== activeFrozenKey)] : order)
        .filter((key) => !hidden.includes(key));
      return visibleOrder.map((key) => {
        const { help, filter, hideable, ...column } = byKey.get(key);
        const filterTestId = `${testIdPrefix}-filter-${key}`;
        const panelProps = {
          labels, testId: `${filterTestId}-panel`, dialogLabel: `${labels.filterColumn}: ${labelOf(key)}`,
          returnFocus: () => filterTriggers.current[key]?.focus(),
        };
        const sortDirections = column.sortDirections || ['ascend', 'descend'];
        const isFrozen = key === activeFrozenKey;
        const width = widths[key] ?? column.width;
        const options = filter?.type === 'checklist' ? normaliseOptions(filter.options) : null;
        const heading = h('span', { className: 'aha-data-table__heading' },
          reorderable && !isFrozen ? h('span', { className: 'aha-data-table__handle' }, icon('system-drag', 16)) : null,
          column.title,
          help ? h(Tooltip, { title: help }, h('span', { className: 'aha-data-table__help', tabIndex: 0, role: 'img', 'aria-label': String(help) }, icon('system-question', 16))) : null);
        const userHeaderCell = column.onHeaderCell;
        return {
          ...column,
          key,
          title: heading,
          width,
          fixed: isFrozen ? 'left' : column.fixed,
          sortDirections: column.sorter ? sortDirections : column.sortDirections,
          sortIcon: column.sorter ? (column.sortIcon || ((iconProps) => SortIcon({ ...iconProps, firstDirection: sortDirections[0] }))) : column.sortIcon,
          ...(filter?.type === 'checklist' && filter.multiple === false ? { filterMultiple: false } : {}),
          filterIcon: filter ? (column.filterIcon || icon('system-funnel', 16)) : column.filterIcon,
          filterDropdown: filter ? (column.filterDropdown || ((dropdownProps) => (filter.type === 'range'
            ? h(RangeFilter, { ...dropdownProps, ...panelProps })
            : filter.type === 'value'
              ? h(ValueFilter, { ...dropdownProps, ...panelProps, inputType: filter.inputType, label: filter.label ?? labelOf(key) })
              : h(ChecklistFilter, { ...dropdownProps, ...panelProps, options, multiple: filter.multiple !== false })))) : column.filterDropdown,
          filterDropdownProps: filter ? filterDropdownPropsFor(column, key, filterTestId) : column.filterDropdownProps,
          onFilter: filter && !column.onFilter ? (value, record) => {
            const cellValue = valueAt(record, column.dataIndex);
            if (filter.type === 'value') return matchesValue(filter.inputType, cellValue, value);
            if (filter.type !== 'range') return cellValue === value || String(cellValue) === String(value);
            const [min, max] = parseRange(value);
            const numeric = Number(cellValue);
            return (min == null || numeric >= min) && (max == null || numeric <= max);
          } : column.onFilter,
          onHeaderCell: (headerColumn) => ({
            ...(userHeaderCell ? userHeaderCell(headerColumn) : {}),
            dataTableColumn: {
              key, label: labelOf(key), labels, frozen: isFrozen, dragKeyRef, width,
              draggable: reorderable && !isFrozen,
              onDropColumn: reorderable ? dropColumn : null,
              onMove: reorderable && !isFrozen ? moveByKeyboard : null,
              onFreezeToggle: freezable ? toggleFreeze : null,
              resizable,
              onResize: resizeColumn,
            },
          }),
        };
      });
    }, [order, hidden, widths, byKey, activeFrozenKey, reorderable, freezable, resizable, labels, dropColumn, moveByKeyboard, toggleFreeze, resizeColumn,
      appliedFilters, openFilterKey, testIdPrefix]);
    const finalColumns = useMemo(() => expansion.decorateColumns(shapedColumns), [expansion.decorateColumns, shapedColumns]);
    const truncatesToFit = !freezable && !resizable && shapedColumns.some((column) => column.ellipsis);

    const editable = columnsEditable
      ? h(ColumnsEditor, {
        columns: order.map((key) => ({ key, label: labelOf(key), hideable: byKey.get(key).hideable })), hidden, onToggle: toggleHidden,
        onReset: showColumnsReset ? resetColumns : undefined, onOpenChange: onColumnsEditorOpenChange, searchable: columnsSearchable,
        labels, testId: `${testIdPrefix}-columns`,
      })
      : null;
    const showToolbar = toolbarTitle || toolbarSearch || toolbarActions || editable;
    const titleLevel = Math.min(6, Math.max(1, Math.round(Number(toolbarTitleLevel)) || 2));

    const rowKeyOf = (record, index) => {
      const rowKey = tableProps.rowKey ?? 'key';
      return typeof rowKey === 'function' ? rowKey(record, index) : record?.[rowKey];
    };
    const baseOnRow = expansion.tableProps.onRow ?? tableProps.onRow;
    const highlightProps = highlightedRowKey === undefined || highlightedRowKey === null ? {} : {
      onRow: (record, index) => {
        const own = baseOnRow ? baseOnRow(record, index) || {} : {};
        if (rowKeyOf(record, index) !== highlightedRowKey) return own;
        return { ...own, className: [own.className, 'aha-data-table__row--highlight'].filter(Boolean).join(' '), 'aria-current': 'true' };
      },
    };

    const trackFilters = (paging, filters, ...rest) => {
      setAppliedFilters(filters || {});
      tableProps.onChange?.(paging, filters, ...rest);
    };

    return h(ConfigProvider, { theme: dataTableTheme }, h('div', { className: 'aha-data-table' },
      showToolbar ? h('div', { className: 'aha-data-table__toolbar', 'data-testid': `${testIdPrefix}-toolbar` },
        toolbarTitle
          ? h(`h${titleLevel}`, { className: 'aha-data-table__title', 'data-testid': `${testIdPrefix}-title` }, toolbarTitle)
          : h('span', { className: 'aha-data-table__title' }),
        toolbarSearch ? h('div', { className: 'aha-data-table__search', 'data-testid': `${testIdPrefix}-search` }, toolbarSearch) : null,
        h('div', { className: 'aha-data-table__actions', 'data-testid': `${testIdPrefix}-actions` }, editable, toolbarActions)) : null,
        h(Table, {
          ...tableProps,
          ...expansion.tableProps,
          ...highlightProps,
          onChange: trackFilters,
          className: [tableProps.className, expansion.tableProps.className].filter(Boolean).join(' ') || undefined,
          columns: finalColumns,
          components: components ? { ...components, header: { ...headerComponents.header, ...components.header } } : headerComponents,
          tableLayout: resizable ? 'fixed' : tableProps.tableLayout,
          scroll: { x: truncatesToFit ? undefined : 'max-content', ...scroll },
          pagination: pagination === false ? false : { showSizeChanger: true, ...pagination },
          locale: { emptyText: h('aha-empty', { description: labels.noData },
            h('aha-illustration', { slot: 'image', name: 'empty-table', size: '64', decorative: '' })), ...locale },
        })));
  }

  DataTable.displayName = 'DataTable';
  DataTable.DetailSection = DetailSection;
  return DataTable;
}

export default createDataTable;
