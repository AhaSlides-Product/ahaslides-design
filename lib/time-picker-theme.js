/**
 * @ahaslides-product/design/time-picker-theme — the shared TimePicker theme.
 *
 * TimePicker is a COMPOSITE: its scrolling hour/minute/second columns and locale handling are too
 * much for a zero-dep web component, so it stays on real Ant (antd v6 in React, ant-design-vue v4
 * in Vue). TimePicker is built on Ant's DatePicker internals, so it themes through the DatePicker
 * component token. The two wrappers converge on ONE look via this theme:
 *
 *   import { timePickerTheme } from '@ahaslides-product/design/time-picker-theme';
 *   <ConfigProvider theme={timePickerTheme}><TimePicker … /></ConfigProvider>
 *
 * DS V3 look: 32px field, radius 8, #E3E3E3 border, brand-selected cell. Values bound to the
 * --aha-* token layer. Times use Day.js.
 */
export const timePickerTheme = {
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
      cellHoverBg: '#F7F7F7',        // hovered time cell (gray-20)
      cellActiveWithRangeBg: '#F9F5FF',
    },
  },
};

export default timePickerTheme;
