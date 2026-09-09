/**
 * @ahaslides-product/design/popconfirm-theme — the shared Popconfirm theme.
 *
 * Popconfirm is a COMPOSITE: the popover, positioning, focus trap and the two action buttons are
 * too much for a zero-dep web component, so it stays on real Ant (antd v6 in React,
 * ant-design-vue v4 in Vue). Both converge on ONE look via this theme — the single importable
 * contract each wrapper passes to its ConfigProvider:
 *
 *   import { popconfirmTheme } from '@ahaslides-product/design/popconfirm-theme';
 *   <ConfigProvider theme={popconfirmTheme}><Popconfirm …>…</Popconfirm></ConfigProvider>
 *
 * DS V3 look: radius-8 popover, brand primary confirm button, #E3E3E3 borders, #1A1A1A text.
 * Values map onto the --aha-* token layer; every hex stays on the canonical palette.
 */
export const popconfirmTheme = {
  token: {
    colorPrimary: '#6A1EBB',
    borderRadius: 8,
    borderRadiusLG: 8,
    controlHeight: 32,
    colorBorder: '#E3E3E3',
    colorText: '#1A1A1A',
    colorTextHeading: '#1A1A1A',
    colorWarning: '#FF7747',
    colorBgElevated: '#FFFFFF',
    fontFamily: 'var(--aha-font-product, "Plus Jakarta Sans", sans-serif)',
  },
  components: {
    Popover: { borderRadiusLG: 8, colorBgElevated: '#FFFFFF' },
    Button: { borderRadius: 8, controlHeight: 32 },
  },
};

export default popconfirmTheme;
