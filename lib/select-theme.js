/**
 * @ahaslides-product/design/select-theme — the shared Select (with search) theme.
 *
 * Select is a COMPOSITE: its popup, virtual list, search and tagging are too much to ship as a
 * zero-dep web component, so it stays on real Ant (antd v6 in React, ant-design-vue v4 in Vue).
 * What makes the two converge on ONE look is this theme — the single importable contract both
 * wrappers pass to their ConfigProvider:
 *
 *   import { selectTheme } from '@ahaslides-product/design/select-theme';
 *   <ConfigProvider theme={selectTheme}><Select showSearch … /></ConfigProvider>
 *
 * DS V3 look: 32px control, radius 8, #E3E3E3 border, brand focus, brand-tint selected option.
 * Values bound to the --aha-* token layer.
 */
export const selectTheme = {
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
    Select: {
      optionSelectedBg: '#F9F5FF',       // brand-tint selected row
      optionSelectedColor: '#6A1EBB',
      optionActiveBg: '#F7F7F7',         // keyboard/hover row
      borderRadius: 8,
      controlHeight: 32,
    },
  },
};

export default selectTheme;
