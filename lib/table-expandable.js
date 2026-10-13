/**
 * @ahaslides-product/design/table-expandable — expandable (collapse / expand) rows for the DS Table.
 *
 * One hook gives a plain `tableTheme` Table AND the shared DataTable the same row-expansion
 * behaviour, so no call site hand-rolls an antd `expandIcon` caret again. Two shapes:
 *
 *   Detail panel — pass `renderDetail(record)`: the row opens a panel under it (free content, or one
 *                  or several sub-tables, each wrapped in a titled `DetailSection`).
 *   Tree rows    — omit `renderDetail`: rows carrying `children` open into child rows that share
 *                  the parent's columns.
 *
 *   import React from 'react';
 *   import { ConfigProvider, Table } from 'antd';
 *   import { tableTheme } from '@ahaslides-product/design/table-theme';
 *   import { createExpandableRows } from '@ahaslides-product/design/table-expandable';
 *
 *   const { useExpandableRows, DetailSection } = createExpandableRows({ React });   // once, at module scope
 *
 *   function Report({ columns, rows }) {
 *     const { tableProps, decorateColumns } = useExpandableRows({
 *       dataSource: rows, rowKey: 'key', expandAllToggle: true,
 *       renderDetail: (record) => [
 *         <DetailSection key="questions" title="Questions"><Table … /></DetailSection>,
 *         <DetailSection key="pages" title="Pages"><Table … /></DetailSection>,
 *       ],
 *     });
 *     return <ConfigProvider theme={tableTheme}>
 *       <Table rowKey="key" dataSource={rows} columns={decorateColumns(columns)} {...tableProps} />
 *     </ConfigProvider>;
 *   }
 *
 * Zero runtime dependencies: you hand it YOUR React, so it shares your app's instance.
 */

// Registered lazily so importing this module stays safe during server-side rendering.
if (typeof window !== 'undefined') { import('./icons.js'); import('./aha-spin.js'); }

/** Default UI copy. Override any key through the `labels` option (e.g. for i18n). */
export const expandableLabels = {
  expandRow: 'Expand row',
  collapseRow: 'Collapse row',
  expandAll: 'Expand all rows',
  collapseAll: 'Collapse all rows',
  loadingDetail: 'Loading details',
};

const STYLE_ID = 'aha-table-expandable-style';
const CHEVRON_SIZE = 24;
const CELL_LINE_HEIGHT = 22;
const INTERACTIVE_TARGET = 'a,button,input,select,textarea,label,summary,[role="button"],[role="checkbox"],[role="menuitem"],[role="switch"],.ant-checkbox-wrapper,[data-aha-expand-ignore]';

export const expandableStyle = `
.aha-expandable__toggle{box-sizing:border-box;display:inline-flex;align-items:center;justify-content:center;flex:none;width:${CHEVRON_SIZE}px;height:${CHEVRON_SIZE}px;margin-inline-end:var(--aha-space-8,8px);padding:0;border:0;border-radius:var(--aha-radius-xs,4px);background:transparent;color:var(--aha-text-tertiary,#8A8A8A);cursor:pointer;vertical-align:top;margin-block:calc((${CELL_LINE_HEIGHT}px - ${CHEVRON_SIZE}px) / 2);transition:background-color var(--aha-motion-mid) var(--aha-ease-in-out),color var(--aha-motion-mid) var(--aha-ease-in-out)}
.aha-expandable__toggle:hover{background:var(--aha-bg-accent,#FEF3F7);color:var(--aha-text-default,#1A1A1A)}
.aha-expandable__toggle:focus-visible{outline:2px solid var(--aha-color-primary,#E70E68);outline-offset:2px}
.aha-expandable__chevron{display:inline-flex;transform:rotate(0deg);transition:transform var(--aha-motion-mid) var(--aha-ease-in-out)}
.aha-expandable__toggle[aria-expanded="true"] .aha-expandable__chevron{transform:rotate(90deg)}
.aha-expandable__spacer{display:inline-block;flex:none;width:${CHEVRON_SIZE}px;height:${CHEVRON_SIZE}px;margin-inline-end:var(--aha-space-8,8px);vertical-align:top;margin-block:calc((${CELL_LINE_HEIGHT}px - ${CHEVRON_SIZE}px) / 2)}
.aha-expandable__head,.aha-expandable__lead{display:inline-flex;align-items:center;max-width:100%;vertical-align:top}
.aha-expandable__content{min-width:0}
.ant-table-cell-ellipsis .aha-expandable__content{overflow:hidden;text-overflow:ellipsis}
.aha-expandable__row--clickable{cursor:pointer}
.aha-expandable .ant-table{border:1px solid var(--aha-border-default,#E3E3E3);border-radius:var(--aha-radius-default,8px);overflow:clip}
.aha-expandable .ant-table-tbody>tr.aha-expandable__row>td{transition:background-color var(--aha-motion-mid) var(--aha-ease-in-out)}
.aha-expandable .ant-table-tbody>tr.aha-expandable__row--open>td{font-weight:600}
.aha-expandable .ant-table-tbody>tr.aha-expandable__row--open .aha-expandable__toggle{color:var(--aha-color-primary,#E70E68)}
.aha-expandable .ant-table-tbody>tr.aha-expandable__row:not(.ant-table-row-level-0)>td,.aha-expandable .ant-table-tbody>tr.aha-expandable__row:not(.ant-table-row-level-0):hover>td{background:var(--aha-bg-container-secondary,#F7F7F7)}
.aha-expandable .ant-table-tbody>tr.aha-expandable__detail>.ant-table-cell,.aha-expandable .ant-table-tbody>tr.aha-expandable__detail:hover>.ant-table-cell{background:var(--aha-bg-container-secondary,#F7F7F7);padding:var(--aha-space-16,16px) var(--aha-space-16,16px) var(--aha-space-16,16px) calc(var(--aha-space-16,16px) + ${CHEVRON_SIZE}px + var(--aha-space-8,8px))}
.aha-expandable__panel{display:flex;flex-direction:column;gap:var(--aha-space-16,16px);width:0;min-width:100%}
.aha-expandable__section{display:flex;flex-direction:column;gap:var(--aha-space-8,8px);min-width:0}
.aha-expandable__section-title{font-size:var(--aha-size-default,14px);line-height:${CELL_LINE_HEIGHT}px;font-weight:600;color:var(--aha-text-default,#1A1A1A)}
.aha-expandable .aha-expandable__panel .ant-table-wrapper{margin:0}
.aha-expandable .aha-expandable__panel .ant-table-wrapper .ant-table{border:1px solid var(--aha-border-strong,#D4D4D4);border-radius:var(--aha-radius-default,8px);overflow:clip;background:var(--aha-bg-container,#FFFFFF)}
.aha-expandable .aha-expandable__panel .ant-table-wrapper .ant-table .ant-table-thead>tr>th,.aha-expandable .aha-expandable__panel .ant-table-wrapper .ant-table .ant-table-tbody>tr>td{padding:var(--aha-space-8,8px) var(--aha-space-16,16px)}
.aha-expandable .aha-expandable__panel .ant-table-wrapper .ant-table .ant-table-tbody>tr.aha-expandable__detail>.ant-table-cell{padding:var(--aha-space-16,16px) var(--aha-space-16,16px) var(--aha-space-16,16px) calc(var(--aha-space-16,16px) + ${CHEVRON_SIZE}px + var(--aha-space-8,8px))}
.aha-expandable .aha-expandable__panel .ant-table-tbody>tr:last-child>td{border-bottom:0}
.aha-expandable__loading{display:flex;align-items:center;gap:var(--aha-space-8,8px);min-height:var(--aha-space-48,48px);color:var(--aha-text-secondary,#4A4A4A)}
@media (prefers-reduced-motion:reduce){.aha-expandable__toggle,.aha-expandable__chevron{transition:none}}
`;

const rowKeyReader = (rowKey) => (typeof rowKey === 'function' ? rowKey : (record) => record?.[rowKey]);
const domSafe = (value) => String(value).replace(/\s+/g, '_');

function collectKeys(rows, getKey, isExpandable, childrenColumnName, recurse, found = []) {
  for (const record of rows || []) {
    if (isExpandable(record)) found.push(getKey(record));
    if (recurse && Array.isArray(record?.[childrenColumnName])) collectKeys(record[childrenColumnName], getKey, isExpandable, childrenColumnName, recurse, found);
  }
  return found;
}

/**
 * Bind the expandable-rows hook to the caller's React.
 *
 * @param {{ React: object }} deps
 * @returns {{ useExpandableRows: Function, DetailSection: Function }} `DetailSection({ title, children })` is one
 *   titled block of a detail panel; return one or several from `renderDetail` and the panel stacks them on the
 *   DS rhythm. The panel owns all spacing and styles every antd Table inside it as a white bordered sub-table
 *   with one compact density, whatever `size` it is given — so give sub-tables no margin, padding or `size`.
 *   `useExpandableRows(options)` returns
 *   `{ tableProps, decorateColumns, expandedRowKeys, expandAll, collapseAll }`. Spread `tableProps` on the
 *   antd Table and pass its columns through `decorateColumns` (it puts the chevron and the expand-all
 *   toggle in the first column — required in both modes, so detail and tree rows share one layout).
 *   Options: `dataSource`, `rowKey` (same as the Table's), `renderDetail(record)` (omit for tree rows),
 *   `rowExpandable(record)`, `expandAllToggle`, `expandedRowKeys` / `defaultExpandedRowKeys` /
 *   `onExpandedRowsChange(keys)` (expanded state is keyed by row key, so it survives sort, filter and
 *   pagination), `onExpand(expanded, record)` (fire lazy fetches here), `loadingKeys` (rows whose detail is
 *   still loading — the panel shows a spinner slot), `expandRowByClick` (default true), `getRowLabel(record)`
 *   (names the row in the chevron's accessible label), `onRow`, `childrenColumnName`, `indentSize`, `labels`.
 *   Pass a falsy `options` to leave a Table non-expandable.
 */
export function createExpandableRows({ React } = {}) {
  if (!React) throw new Error('createExpandableRows: missing React — pass { React }');
  const h = React.createElement;
  const { useMemo, useState, useCallback, useId } = React;
  const useInsertStyle = React.useInsertionEffect || React.useLayoutEffect;

  function useSharedStyle() {
    useInsertStyle(() => {
      if (document.getElementById(STYLE_ID)) return;
      const style = document.createElement('style');
      style.id = STYLE_ID;
      style.textContent = expandableStyle;
      document.head.appendChild(style);
    }, []);
  }

  const chevron = () => h('span', { className: 'aha-expandable__chevron' }, h('aha-icon', { name: 'system-caret-right', size: '16', decorative: '' }));

  const keepOutOfTabOrderWhenMeasuring = (node) => {
    if (node && node.closest('tr[aria-hidden="true"]')) node.tabIndex = -1;
  };

  function ExpandToggle({ expanded, label, controls, onToggle }) {
    return h('button', {
      type: 'button',
      ref: keepOutOfTabOrderWhenMeasuring,
      className: 'aha-expandable__toggle',
      'aria-expanded': expanded,
      'aria-label': label,
      'aria-controls': controls,
      onClick: onToggle,
    }, chevron());
  }

  function DetailSection({ title, children }) {
    useSharedStyle();
    const titleId = useId();
    return h('section', { className: 'aha-expandable__section', 'aria-labelledby': title ? titleId : undefined },
      title ? h('div', { id: titleId, className: 'aha-expandable__section-title' }, title) : null,
      children);
  }

  function useExpandableRows(options) {
    useSharedStyle();
    const enabled = Boolean(options);
    const {
      dataSource, rowKey = 'key', renderDetail, rowExpandable, expandAllToggle = false,
      expandedRowKeys: controlledKeys, defaultExpandedRowKeys, onExpandedRowsChange, onExpand,
      loadingKeys, expandRowByClick = true, getRowLabel, onRow, childrenColumnName = 'children',
      indentSize = 24, labels: labelOverrides,
    } = options || {};
    const detailMode = typeof renderDetail === 'function';
    const uid = useId();
    const labels = useMemo(() => ({ ...expandableLabels, ...labelOverrides }), [labelOverrides]);
    const [storedKeys, setStoredKeys] = useState(defaultExpandedRowKeys || []);
    const keys = controlledKeys ?? storedKeys;
    const keySet = useMemo(() => new Set(keys), [keys]);
    const loadingSet = useMemo(() => new Set(loadingKeys || []), [loadingKeys]);
    const getKey = useMemo(() => rowKeyReader(rowKey), [rowKey]);

    const isExpandable = useCallback((record) => (detailMode
      ? (rowExpandable ? rowExpandable(record) : true)
      : Array.isArray(record?.[childrenColumnName]) && record[childrenColumnName].length > 0),
    [detailMode, rowExpandable, childrenColumnName]);

    const expandableKeys = useMemo(
      () => collectKeys(dataSource, getKey, isExpandable, childrenColumnName, !detailMode),
      [dataSource, getKey, isExpandable, childrenColumnName, detailMode]);
    const everyOpen = expandableKeys.length > 0 && expandableKeys.every((key) => keySet.has(key));

    const commit = useCallback((next) => {
      if (controlledKeys === undefined) setStoredKeys(next);
      onExpandedRowsChange?.(next);
    }, [controlledKeys, onExpandedRowsChange]);
    const expandAll = useCallback(() => commit(Array.from(new Set([...keys, ...expandableKeys]))), [commit, keys, expandableKeys]);
    const collapseAll = useCallback(() => commit(keys.filter((key) => !expandableKeys.includes(key))), [commit, keys, expandableKeys]);
    const toggleAll = everyOpen ? collapseAll : expandAll;

    const toggleRow = useCallback((record) => {
      const key = getKey(record);
      const opening = !keySet.has(key);
      commit(opening ? [...keys, key] : keys.filter((candidate) => candidate !== key));
      onExpand?.(opening, record);
    }, [getKey, keySet, keys, commit, onExpand]);

    const detailId = (record) => `${uid}-detail-${domSafe(getKey(record))}`;
    const rowId = (record) => `${uid}-row-${domSafe(getKey(record))}`;

    const expandIcon = useCallback(({ expanded, expandable, record }) => {
      if (!expandable) return h('span', { className: 'aha-expandable__spacer', 'aria-hidden': 'true' });
      const rowLabel = getRowLabel ? getRowLabel(record) : null;
      const action = expanded ? labels.collapseRow : labels.expandRow;
      const controls = detailMode
        ? detailId(record)
        : (record[childrenColumnName] || []).map((child) => rowId(child)).join(' ');
      return h(ExpandToggle, {
        expanded, controls,
        label: rowLabel ? `${action}: ${rowLabel}` : action,
        onToggle: (event) => { event.stopPropagation(); toggleRow(record); },
      });
    }, [labels, detailMode, childrenColumnName, getRowLabel, toggleRow, uid, getKey]);

    const expandedRowRender = useCallback((record) => h('div', {
      id: detailId(record),
      className: 'aha-expandable__panel',
      'aria-busy': loadingSet.has(getKey(record)) ? 'true' : undefined,
    }, loadingSet.has(getKey(record))
      ? h('div', { className: 'aha-expandable__loading', role: 'status' }, h('aha-spin', { size: 'small' }), labels.loadingDetail)
      : renderDetail(record)),
    [renderDetail, loadingSet, labels, uid, getKey]);

    const headerToggle = expandAllToggle && expandableKeys.length > 0
      ? h(ExpandToggle, { expanded: everyOpen, label: everyOpen ? labels.collapseAll : labels.expandAll, controls: undefined, onToggle: (event) => { event.stopPropagation(); toggleAll(); } })
      : null;

    const rowProps = useCallback((record, index) => {
      const userProps = onRow ? onRow(record, index) || {} : {};
      const clickable = expandRowByClick && isExpandable(record);
      return {
        ...userProps,
        id: userProps.id ?? (detailMode ? undefined : rowId(record)),
        className: [userProps.className, 'aha-expandable__row', clickable && 'aha-expandable__row--clickable', keySet.has(getKey(record)) && isExpandable(record) && 'aha-expandable__row--open'].filter(Boolean).join(' ') || undefined,
        onClick: (event) => {
          userProps.onClick?.(event);
          if (!clickable || event.defaultPrevented) return;
          if (event.target.closest?.(INTERACTIVE_TARGET)?.closest('tr') === event.currentTarget) return;
          if (typeof window !== 'undefined' && window.getSelection?.()?.toString()) return;
          toggleRow(record);
        },
      };
    }, [onRow, expandRowByClick, isExpandable, detailMode, toggleRow, uid, getKey, keySet]);

    const inlineToggle = useCallback((record) => {
      if (!isExpandable(record)) return h('span', { className: 'aha-expandable__spacer', 'aria-hidden': 'true' });
      return expandIcon({ expanded: keySet.has(getKey(record)), expandable: true, record });
    }, [isExpandable, expandIcon, keySet, getKey]);

    const decorateColumns = useCallback((columns) => {
      if (!enabled || !columns?.length || expandableKeys.length === 0) return columns;
      const [first, ...rest] = columns;
      const decorated = { ...first };
      const headerLead = headerToggle || h('span', { className: 'aha-expandable__spacer', 'aria-hidden': 'true' });
      decorated.title = h('span', { className: 'aha-expandable__head' }, headerLead, first.title);
      if (detailMode) {
        decorated.render = (value, record, index) => {
          const content = first.render ? first.render(value, record, index) : value;
          if (content && typeof content === 'object' && 'children' in content && !React.isValidElement(content)) return content;
          return h('span', { className: 'aha-expandable__lead' }, inlineToggle(record), h('span', { className: 'aha-expandable__content' }, content));
        };
      }
      return [decorated, ...rest];
    }, [enabled, detailMode, headerToggle, inlineToggle, expandableKeys.length]);

    const tableProps = useMemo(() => {
      if (!enabled) return {};
      return {
        className: 'aha-expandable',
        onRow: rowProps,
        expandable: {
          expandedRowKeys: keys,
          onExpandedRowsChange: commit,
          expandRowByClick: false,
          expandIcon,
          ...(detailMode ? { expandIconColumnIndex: -1 } : {}),
          childrenColumnName,
          indentSize,
          ...(detailMode ? {
            expandedRowRender,
            expandedRowClassName: () => 'aha-expandable__detail',
            rowExpandable: isExpandable,
          } : {}),
        },
      };
    }, [enabled, rowProps, keys, commit, expandIcon, childrenColumnName, indentSize, detailMode, expandedRowRender, isExpandable]);

    return { tableProps, decorateColumns, expandedRowKeys: keys, expandAll, collapseAll };
  }

  return { useExpandableRows, DetailSection };
}

export default createExpandableRows;
