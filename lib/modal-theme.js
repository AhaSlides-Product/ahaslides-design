/**
 * @ahaslides-product/design/modal-theme — the shared Modal theme.
 *
 * Modal carries focus-trapping, a mask, scroll-locking and enter/leave motion — too much to rebuild
 * as a web component, and it keeps antd's built-in motion, so it stays a COMPOSITE on real Ant
 * (antd v6 in React, ant-design-vue v4 in Vue). What makes the two converge on ONE look is this
 * theme — the single importable contract both wrappers pass to their ConfigProvider:
 *
 *   import { modalTheme } from '@ahaslides-product/design/modal-theme';
 *   <ConfigProvider theme={modalTheme}><Modal open title="Delete slide?"> … </Modal></ConfigProvider>
 *
 * DS V3 look: white content, radius 8, ink title. Values map to the --aha-* token layer.
 */
export const modalTheme = {
  token: {
    colorPrimary: '#6A1EBB',
    borderRadius: 8,
    colorText: '#1A1A1A',
    colorBgElevated: '#FFFFFF',
    fontFamily: 'var(--aha-font-product, "Plus Jakarta Sans", sans-serif)',
  },
  components: {
    Modal: {
      contentBg: '#FFFFFF',
      headerBg: '#FFFFFF',
      titleColor: '#1A1A1A',
      titleFontSize: 18,
      borderRadiusLG: 8,
    },
  },
};

export default modalTheme;
