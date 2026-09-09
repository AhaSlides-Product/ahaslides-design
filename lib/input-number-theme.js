/**
 * @ahaslides-product/design/input-number-theme — the shared InputNumber theme.
 *
 * InputNumber is a COMPOSITE: its steppers, keyboard step/precision handling and formatter/parser
 * are more than a zero-dep web component should carry, so it stays on real Ant (antd v6 in React,
 * ant-design-vue v4 in Vue). The two converge on ONE look via this theme — the single importable
 * contract both wrappers pass to their ConfigProvider:
 *
 *   import { inputNumberTheme } from '@ahaslides-product/design/input-number-theme';
 *   <ConfigProvider theme={inputNumberTheme}><InputNumber … /></ConfigProvider>
 *
 * DS V3 look: 32px field, radius 8, #E3E3E3 border, brand focus/hover. Values bound to the
 * --aha-* token layer.
 */
export const inputNumberTheme = {
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
    InputNumber: {
      activeBorderColor: '#6A1EBB',   // brand focus border
      hoverBorderColor: '#D3B4FF',    // purple-30 hover border
      borderRadius: 8,
      controlHeight: 32,
    },
  },
};

export default inputNumberTheme;
