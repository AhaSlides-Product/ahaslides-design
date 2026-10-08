/**
 * @ahaslides-product/design/steps-theme — the shared Steps theme.
 *
 * Steps is a COMPOSITE: its progress state machine, responsive/vertical layouts and clickable
 * navigation ride on real Ant (antd v6 in React, ant-design-vue v4 in Vue) rather than a zero-dep
 * web component. The two converge on ONE look via this theme — the single importable contract both
 * wrappers pass to their ConfigProvider:
 *
 *   import { stepsTheme } from '@ahaslides-product/design/steps-theme';
 *   <ConfigProvider theme={stepsTheme}><Steps … /></ConfigProvider>
 *
 * DS V3 look: brand #E70E68 current/finished step, 32px icon, brand titles. Values bound to the
 * --aha-* token layer.
 */
import { dsAntdTheme } from './antd-base-theme.js';
export const stepsTheme = dsAntdTheme({
  token: {
    colorPrimary: '#E70E68',
    colorText: '#1A1A1A',
    borderRadius: 8,
    fontFamily: 'var(--aha-font-product, "Plus Jakarta Sans", sans-serif)',
  },
  components: {
    Steps: {
      colorPrimary: '#E70E68',   // current/finished accent
      iconSize: 32,
      iconFontSize: 14,
      titleLineHeight: 32,
    },
  },
});

export default stepsTheme;
