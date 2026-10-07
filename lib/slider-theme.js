/**
 * @ahaslides-product/design/slider-theme — the shared Slider theme.
 *
 * Slider is a COMPOSITE: its drag handling, marks, range thumbs and keyboard stepping are more than
 * a zero-dep web component should carry, so it stays on real Ant (antd v6 in React, ant-design-vue
 * v4 in Vue). The two converge on ONE look via this theme — the single importable contract both
 * wrappers pass to their ConfigProvider:
 *
 *   import { sliderTheme } from '@ahaslides-product/design/slider-theme';
 *   <ConfigProvider theme={sliderTheme}><Slider … /></ConfigProvider>
 *
 * DS V3 look: brand #E70E68 track + handle, gray-30 rail, 4px rail. Values bound to the --aha-*
 * token layer.
 */
export const sliderTheme = {
  token: {
    colorPrimary: '#E70E68',
    borderRadius: 8,
    fontFamily: 'var(--aha-font-product, "Plus Jakarta Sans", sans-serif)',
  },
  components: {
    Slider: {
      railBg: '#F1F1F1',            // gray-30 rest rail
      railHoverBg: '#E3E3E3',       // gray-40 hover rail
      trackBg: '#E70E68',           // brand track
      trackHoverBg: '#DB005B',      // purple-80 hover track
      handleColor: '#E70E68',       // brand handle ring
      handleActiveColor: '#DB005B',
      dotActiveBorderColor: '#E70E68',
      railSize: 4,
      handleSize: 14,
      handleSizeHover: 16,
    },
  },
};

export default sliderTheme;
