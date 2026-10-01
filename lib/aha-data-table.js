/**
 * @ahaslides-product/design/aha-data-table — the shared DataTable (React · antd v6).
 *
 * Every AhaSlides data grid renders through this one component; a raw antd <Table> styled per
 * call site, or a hand-rolled <table>, is the drift it replaces. Call sites pass data + columns
 * only — the DS V3 look (white header, grey labels, dividers only, radius 8, 16px cells, gray-30
 * hover) and behaviour (single-arrow sort, checklist / range filters, drag reorder, right-click
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
 * Icons come from the DS library (<aha-icon> by name); this module registers it in the browser.
 */
import { tableTheme } from './table-theme.js';
import { createExpandableRows, expandableLabels } from './table-expandable.js';

// Registered lazily so importing this module stays safe during server-side rendering.
if (typeof window !== 'undefined') import('./icons.js');

/**
 * The antd theme the DataTable renders under — the shared `tableTheme`, completed to the DS V3
 * contract (contracts/table.json): gray-30 row hover, and a white header / body even on the
 * sorted column (antd tints both grey by default).
 */
export const dataTableTheme = {
  token: { ...tableTheme.token, colorText: '#1A1A1A' },
  components: {
    Table: {
      ...tableTheme.components.Table,
      rowHoverBg: '#F1F1F1',
      headerBorderRadius: 0,
      headerSortActiveBg: '#FFFFFF',
      headerSortHoverBg: '#F1F1F1',
      bodySortBg: '#FFFFFF',
      headerFilterHoverBg: '#F9F5FF',
    },
  },
};

/** Default UI copy. Override any key through the `labels` prop (e.g. for i18n). */
export const dataTableLabels = {
  searchInFilters: 'Search in filters',
  reset: 'Reset',
  apply: 'Apply',
  minValue: 'Min value',
  maxValue: 'Max value',
  freezeColumn: 'Freeze column',
  defreezeColumn: 'Defreeze column',
  editColumns: 'Edit columns',
  resizeColumn: 'Resize column',
  ...expandableLabels,
};

const ANTD_MEMBERS = ['ConfigProvider', 'Table', 'Button', 'Input', 'InputNumber', 'Checkbox', 'Dropdown', 'Popover', 'Tooltip'];
const STYLE_ID = 'aha-data-table-style';
const MIN_COLUMN_WIDTH = 80;
const KEYBOARD_RESIZE_STEP = 16;

const STYLE = `
.aha-data-table .ant-table{border:1px solid var(--aha-border,#E3E3E3);border-radius:var(--aha-radius-default,8px);overflow:hidden}
.aha-data-table .aha-expandable__panel .ant-table{border:0;border-radius:0}
.aha-data-table__toolbar{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:var(--aha-space-8,8px);margin-bottom:var(--aha-space-12,12px)}
.aha-data-table__title{font-size:var(--aha-size-h6,18px);font-weight:600;color:var(--aha-text-default,#1A1A1A)}
.aha-data-table__actions{display:flex;flex-wrap:wrap;gap:var(--aha-space-8,8px)}
.aha-data-table__heading{display:inline-flex;align-items:center;gap:var(--aha-space-6,6px)}
.aha-data-table__handle{display:inline-flex;color:var(--aha-text-tertiary,#8A8A8A);opacity:0;transition:opacity var(--aha-motion-mid) var(--aha-ease-in-out)}
.aha-data-table th:hover .aha-data-table__handle,.aha-data-table th:focus-visible .aha-data-table__handle{opacity:1}
.aha-data-table__help{display:inline-flex;color:var(--aha-text-tertiary,#8A8A8A);cursor:help}
.aha-data-table th.aha-data-table__th{transition:background-color var(--aha-motion-fast) var(--aha-ease-in-out),box-shadow var(--aha-motion-fast) var(--aha-ease-in-out)}
.aha-data-table th[draggable="true"]{cursor:grab}
.aha-data-table th.aha-data-table__th:not(.ant-table-cell-fix){position:relative}
.aha-data-table th.aha-data-table__th--dragging{background:var(--aha-gray-30,#F1F1F1)}
.aha-data-table th.aha-data-table__th--drop-before{box-shadow:inset 2px 0 0 0 var(--aha-color-primary,#6A1EBB)}
.aha-data-table th.aha-data-table__th--drop-after{box-shadow:inset -2px 0 0 0 var(--aha-color-primary,#6A1EBB)}
.aha-data-table__sort{display:inline-flex;color:var(--aha-text-disabled,#B5B5B5);transition:color var(--aha-motion-mid) var(--aha-ease-in-out)}
.aha-data-table__sort--on{color:var(--aha-text-default,#1A1A1A)}
.aha-data-table .ant-table-filter-trigger{border-radius:var(--aha-radius-xs,4px);color:var(--aha-text-tertiary,#8A8A8A);transition:background-color var(--aha-motion-mid) var(--aha-ease-in-out),color var(--aha-motion-mid) var(--aha-ease-in-out)}
.aha-data-table .ant-table-filter-trigger:hover{background:var(--aha-purple-10,#F9F5FF);color:var(--aha-color-primary,#6A1EBB)}
.aha-data-table .ant-table-filter-trigger.ant-dropdown-open{background:var(--aha-purple-15,#F0E4FF);color:var(--aha-color-primary,#6A1EBB)}
.aha-data-table .ant-table-filter-trigger.active{background:var(--aha-color-primary,#6A1EBB);color:var(--aha-text-inverse,#FFFFFF)}
.aha-data-table__resize{position:absolute;top:0;right:0;bottom:0;width:8px;display:flex;justify-content:center;cursor:col-resize;z-index:2;touch-action:none}
.aha-data-table__resize::after{content:"";width:2px;background:transparent;transition:background-color var(--aha-motion-fast) var(--aha-ease-in-out)}
.aha-data-table__resize:hover::after,.aha-data-table__resize:focus-visible::after,.aha-data-table__resize--active::after{background:var(--aha-color-primary,#6A1EBB)}
.aha-data-table__resize:focus-visible{outline:none}
.aha-data-table-pop{width:min(248px,calc(100vw - 32px));font-family:var(--aha-font-product)}
.aha-data-table-pop__search{margin-bottom:var(--aha-space-10,10px)}
.aha-data-table-pop__list{max-height:190px;overflow:auto;display:flex;flex-direction:column;gap:var(--aha-space-10,10px)}
.aha-data-table-pop__label{font-size:var(--aha-size-default,14px);color:var(--aha-text-default,#1A1A1A);margin-bottom:var(--aha-space-6,6px)}
.aha-data-table-pop__label + .ant-input-number{width:100%}
.aha-data-table-pop__label ~ .aha-data-table-pop__label{margin-top:var(--aha-space-12,12px)}
.aha-data-table-pop__foot{display:flex;justify-content:space-between;align-items:center;gap:var(--aha-space-8,8px);margin-top:var(--aha-space-12,12px);padding-top:var(--aha-space-10,10px);border-top:1px solid var(--aha-border,#E3E3E3)}
.aha-data-table-pop__reset.ant-btn{color:var(--aha-text-tertiary,#8A8A8A)}
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
 *   Input, InputNumber, Checkbox, Dropdown, Popover and Tooltip (a namespace import works).
 * @returns {Function} the `DataTable` React component. Props: every antd Table prop, plus
 *   `columns` (each `{ key, title, dataIndex, … }` with optional `help`, `filter: { type: 'checklist', options } | { type: 'range' }`
 *   and `hideable: false`), `toolbarTitle`, `toolbarActions`, `reorderable`, `freezable`, `resizable`,
 *   `columnsEditable` and `labels`.
 */
export function createDataTable({ React, antd } = {}) {
  const missing = !React ? ['React'] : ANTD_MEMBERS.filter((name) => !antd || !antd[name]);
  if (missing.length) throw new Error(`createDataTable: missing ${missing.join(', ')} — pass { React, antd: { ${ANTD_MEMBERS.join(', ')} } }`);

  const h = React.createElement;
  const { useMemo, useRef, useState, useCallback } = React;
  const useInsertStyle = React.useInsertionEffect || React.useLayoutEffect;
  const { ConfigProvider, Table, Button, Input, InputNumber, Checkbox, Dropdown, Popover, Tooltip } = antd;
  const { useExpandableRows } = createExpandableRows({ React });

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

  function SortIcon({ sortOrder }) {
    return h('span', { className: 'aha-data-table__sort' + (sortOrder ? ' aha-data-table__sort--on' : '') },
      icon(sortOrder === 'ascend' ? 'system-arrow-up' : 'system-arrow-down', 16));
  }

  function PopoverFooter({ labels, onReset, onApply }) {
    return h('div', { className: 'aha-data-table-pop__foot' },
      h(Button, { type: 'text', size: 'small', className: 'aha-data-table-pop__reset', onClick: onReset }, labels.reset),
      h(Button, { type: 'primary', size: 'small', onClick: onApply }, labels.apply));
  }

  function ChecklistFilter({ options, labels, selectedKeys, setSelectedKeys, confirm, clearFilters }) {
    const [query, setQuery] = useState('');
    const shown = options.filter((option) => option.label.toLowerCase().includes(query.toLowerCase()));
    return h('div', { className: 'aha-data-table-pop' },
      h(Input, {
        className: 'aha-data-table-pop__search', value: query, allowClear: true, placeholder: labels.searchInFilters,
        'aria-label': labels.searchInFilters, prefix: icon('system-magnifying-glass', 16), onChange: (event) => setQuery(event.target.value),
      }),
      h('div', { className: 'aha-data-table-pop__list' },
        shown.map((option) => h(Checkbox, {
          key: String(option.value), checked: selectedKeys.includes(option.value),
          onChange: (event) => setSelectedKeys(event.target.checked
            ? [...selectedKeys, option.value]
            : selectedKeys.filter((selected) => selected !== option.value)),
        }, option.label))),
      h(PopoverFooter, {
        labels,
        onReset: () => { clearFilters?.(); setQuery(''); confirm(); },
        onApply: () => confirm(),
      }));
  }

  function RangeFilter({ labels, selectedKeys, setSelectedKeys, confirm, clearFilters }) {
    const [min, max] = parseRange(selectedKeys[0]);
    const update = (nextMin, nextMax) =>
      setSelectedKeys(nextMin == null && nextMax == null ? [] : [encodeRange(nextMin, nextMax)]);
    return h('div', { className: 'aha-data-table-pop' },
      h('div', { className: 'aha-data-table-pop__label' }, labels.minValue),
      h(InputNumber, { value: min, 'aria-label': labels.minValue, onChange: (value) => update(value, max) }),
      h('div', { className: 'aha-data-table-pop__label' }, labels.maxValue),
      h(InputNumber, { value: max, 'aria-label': labels.maxValue, onChange: (value) => update(min, value) }),
      h(PopoverFooter, { labels, onReset: () => { clearFilters?.(); confirm(); }, onApply: () => confirm() }));
  }

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

  function ColumnsEditor({ columns, hidden, onToggle, labels }) {
    const content = h('div', { className: 'aha-data-table-pop' },
      h('div', { className: 'aha-data-table-pop__list' },
        columns.map((column) => h(Checkbox, {
          key: column.key,
          checked: !hidden.includes(column.key),
          disabled: column.hideable === false,
          onChange: (event) => onToggle(column.key, event.target.checked),
        }, column.label))));
    return h(Popover, { trigger: 'click', placement: 'bottomRight', content },
      h(Button, { icon: icon('system-sliders-horizontal', 16) }, labels.editColumns));
  }

  function DataTable(props) {
    const {
      columns = [], toolbarTitle, toolbarActions, reorderable = false, freezable = false, resizable = false,
      columnsEditable = false, expandableRows, labels: labelOverrides, pagination, scroll, components, ...tableProps
    } = props;
    useSharedStyle();
    const labels = useMemo(() => ({ ...dataTableLabels, ...labelOverrides }), [labelOverrides]);

    const keyed = useMemo(() => columns.map((column) => ({ column, key: columnKeyOf(column) })), [columns]);
    const byKey = useMemo(() => new Map(keyed.map((entry) => [entry.key, entry.column])), [keyed]);
    const keys = useMemo(() => keyed.map((entry) => entry.key), [keyed]);

    const [storedOrder, setOrder] = useState(keys);
    const [frozenKey, setFrozenKey] = useState(null);
    const [hidden, setHidden] = useState([]);
    const [widths, setWidths] = useState({});
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

    const toggleHidden = useCallback((key, visible) =>
      setHidden((previous) => (visible ? previous.filter((candidate) => candidate !== key) : [...previous, key])), []);

    const shapedColumns = useMemo(() => {
      const visibleOrder = (activeFrozenKey ? [activeFrozenKey, ...order.filter((key) => key !== activeFrozenKey)] : order)
        .filter((key) => !hidden.includes(key));
      return visibleOrder.map((key) => {
        const { help, filter, hideable, ...column } = byKey.get(key);
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
          sortDirections: column.sorter ? (column.sortDirections || ['descend', 'ascend']) : column.sortDirections,
          sortIcon: column.sorter ? (column.sortIcon || SortIcon) : column.sortIcon,
          filterIcon: filter ? (column.filterIcon || icon('system-funnel', 16)) : column.filterIcon,
          filterDropdown: filter ? (column.filterDropdown || ((dropdownProps) => (filter.type === 'range'
            ? h(RangeFilter, { ...dropdownProps, labels })
            : h(ChecklistFilter, { ...dropdownProps, labels, options })))) : column.filterDropdown,
          onFilter: filter && !column.onFilter ? (value, record) => {
            const cellValue = valueAt(record, column.dataIndex);
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
    }, [order, hidden, widths, byKey, activeFrozenKey, reorderable, freezable, resizable, labels, dropColumn, moveByKeyboard, toggleFreeze, resizeColumn]);
    const finalColumns = useMemo(() => expansion.decorateColumns(shapedColumns), [expansion.decorateColumns, shapedColumns]);

    const editable = columnsEditable
      ? h(ColumnsEditor, { columns: order.map((key) => ({ key, label: labelOf(key), hideable: byKey.get(key).hideable })), hidden, onToggle: toggleHidden, labels })
      : null;
    const showToolbar = toolbarTitle || toolbarActions || editable;

    return h('div', { className: 'aha-data-table' },
      showToolbar ? h('div', { className: 'aha-data-table__toolbar' },
        h('span', { className: 'aha-data-table__title' }, toolbarTitle),
        h('div', { className: 'aha-data-table__actions' }, editable, toolbarActions)) : null,
      h(ConfigProvider, { theme: dataTableTheme },
        h(Table, {
          ...tableProps,
          ...expansion.tableProps,
          columns: finalColumns,
          components: components ? { ...components, header: { ...headerComponents.header, ...components.header } } : headerComponents,
          tableLayout: resizable ? 'fixed' : tableProps.tableLayout,
          scroll: { x: 'max-content', ...scroll },
          pagination: pagination === false ? false : { showSizeChanger: true, ...pagination },
        })));
  }

  DataTable.displayName = 'DataTable';
  return DataTable;
}

export default createDataTable;
