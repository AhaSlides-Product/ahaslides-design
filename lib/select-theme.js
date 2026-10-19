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
 * The caret is the shared <aha-icon name="system-caret-down" size="16">, passed as `suffixIcon`; inject
 * `selectCaretCss` once so it is #8A8A8A and flips up while open, like Select field.
 *
 * DS V3 look: 40px control (large 48px), radius 8, #E3E3E3 border, brand focus, brand-tint selected option.
 * Values bound to the --aha-* token layer.
 */
import { dsAntdTheme } from './antd-base-theme.js';
export const selectTheme = dsAntdTheme({
  token: {
    colorPrimary: '#E70E68',
    borderRadius: 8,
    controlHeight: 40,
    controlHeightLG: 48,
    colorBorder: '#E3E3E3',
    colorText: '#1A1A1A',
    colorTextPlaceholder: '#8A8A8A',
    fontFamily: 'var(--aha-font-product, "Plus Jakarta Sans", sans-serif)',
  },
  components: {
    Select: {
      optionSelectedBg: '#E70E680D',       // brand-tint selected row
      optionSelectedColor: '#E70E68',
      optionActiveBg: '#F7F7F7',         // keyboard/hover row
      borderRadius: 8,
      controlHeight: 40,
      controlHeightLG: 48,
    },
  },
});

export const selectCaretCss = `
.ant-select .ant-select-suffix, .ant-select .ant-select-arrow { color: #8A8A8A; }
.ant-select .ant-select-suffix aha-icon, .ant-select .ant-select-arrow aha-icon { transition: transform .2s cubic-bezier(0.645,0.045,0.355,1); }
.ant-select.ant-select-open .ant-select-suffix aha-icon, .ant-select.ant-select-open .ant-select-arrow aha-icon { transform: rotate(180deg); }
`;

export default selectTheme;
