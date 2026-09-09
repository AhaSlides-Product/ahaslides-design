/**
 * @ahaslides-product/design/drawer-theme — the shared Drawer theme.
 *
 * Drawer carries a mask, focus-trapping, scroll-locking and a slide-in from an edge — too much to
 * rebuild as a web component, and it keeps antd's built-in motion, so it stays a COMPOSITE on real
 * Ant (antd v6 in React, ant-design-vue v4 in Vue). What makes the two converge on ONE look is this
 * theme — the single importable contract both wrappers pass to their ConfigProvider:
 *
 *   import { drawerTheme } from '@ahaslides-product/design/drawer-theme';
 *   <ConfigProvider theme={drawerTheme}><Drawer open title="Slide settings"> … </Drawer></ConfigProvider>
 *
 * DS V3 look: white panel, ink title, brand actions. Values map to the --aha-* token layer.
 */
export const drawerTheme = {
  token: {
    colorPrimary: '#6A1EBB',
    borderRadius: 8,
    colorText: '#1A1A1A',
    colorTextHeading: '#1A1A1A',
    colorBgElevated: '#FFFFFF',
    fontFamily: 'var(--aha-font-product, "Plus Jakarta Sans", sans-serif)',
  },
  components: {
    Drawer: {
      colorBgElevated: '#FFFFFF',   // white panel surface
      colorText: '#1A1A1A',
    },
  },
};

export default drawerTheme;
