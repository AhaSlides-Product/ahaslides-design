/**
 * @ahaslides-product/design/datepicker-theme — the shared DatePicker theme.
 *
 * DatePicker is a COMPOSITE: its calendar panel, ranges and locale handling are too much for a
 * zero-dep web component, so it stays on real Ant (antd v6 in React, ant-design-vue v4 in Vue).
 * The two converge on ONE look via this theme — the single importable contract both wrappers
 * pass to their ConfigProvider:
 *
 *   import { datepickerTheme } from '@ahaslides-product/design/datepicker-theme';
 *   <ConfigProvider theme={datepickerTheme}><DatePicker … /></ConfigProvider>
 *
 * DS V3 look: 32px field, radius 8, #E3E3E3 border, brand-selected cell. Values bound to the
 * --aha-* token layer.
 */
export const datepickerTheme = {
  token: {
    colorPrimary: '#6A1EBB',
    borderRadius: 8,
    controlHeight: 32,
    colorBorder: '#E3E3E3',
    colorText: '#1A1A1A',
    colorTextPlaceholder: '#8A8A8A',
    fontFamily: 'var(--aha-font-product, "Plus Jakarta Sans", sans-serif)',
  },
  components: {
    DatePicker: {
      borderRadius: 8,
      controlHeight: 32,
      cellActiveWithRangeBg: '#F9F5FF',   // brand-tint in-range cells
      cellHoverBg: '#F7F7F7',
    },
  },
};

export default datepickerTheme;
