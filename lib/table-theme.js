/**
 * @ahaslides/design/table-theme — the shared DataTable theme.
 *
 * Table is a COMPOSITE: too complex to ship as one web component, so it stays on real Ant
 * (antd v6 in React, ant-design-vue v4 in Vue). What makes the two converge on ONE look is
 * this theme — the single importable contract both wrappers pass to their ConfigProvider:
 *
 *   import { tableTheme } from '@ahaslides/design/table-theme';
 *   <ConfigProvider theme={tableTheme}> … <DataTable/> … </ConfigProvider>
 *
 * DS V3 look: white header + secondary-grey labels, dividers-only body (no zebra), radius 8,
 * 16px cells, brand-tint hover. Values bound to the --aha-* token layer where possible.
 */
export const tableTheme = {
  token: {
    colorPrimary: '#6A1EBB',
    borderRadius: 8,
    colorBorderSecondary: '#E3E3E3',
    fontFamily: 'var(--aha-font-product, "Plus Jakarta Sans", sans-serif)',
  },
  components: {
    Table: {
      headerBg: '#ffffff',          // white header (NOT antd grey #fafafa)
      headerColor: '#8A8A8A',       // secondary-grey labels
      headerSplitColor: 'transparent',
      borderColor: '#E3E3E3',       // horizontal dividers only
      rowHoverBg: '#F9F5FF',        // brand-tint hover
      cellPaddingBlock: 16,
      cellPaddingInline: 16,
      borderRadius: 8,
    },
  },
};

export default tableTheme;
