/**
 * @ahaslides-product/design/toast-theme — the shared Toast (antd message) theme.
 *
 * Toast is antd's imperative `message` API — a transient, auto-dismissing confirmation — and keeps
 * antd's built-in enter/leave motion, so it stays a COMPOSITE on real Ant (antd v6 in React,
 * ant-design-vue v4 in Vue). What makes the two converge on ONE look is this theme — the single
 * importable contract both wrappers pass to their ConfigProvider:
 *
 *   import { toastTheme } from '@ahaslides-product/design/toast-theme';
 *   const [api, holder] = message.useMessage();      // holder inside <ConfigProvider theme={toastTheme}>
 *   api.success('Slide saved');
 *
 * DS V3 look: white elevated pill, ink text, radius 8. Values map to the --aha-* token layer.
 */
export const toastTheme = {
  token: {
    colorPrimary: '#6A1EBB',
    borderRadius: 8,
    colorText: '#1A1A1A',
    colorBgElevated: '#FFFFFF',
    fontFamily: 'var(--aha-font-product, "Plus Jakarta Sans", sans-serif)',
  },
  components: {
    Message: {
      contentBg: '#FFFFFF',     // white elevated surface
      contentPadding: '9px 12px',
    },
  },
};

export default toastTheme;
