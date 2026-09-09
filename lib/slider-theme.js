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
 * DS V3 look: brand #6A1EBB track + handle, gray-30 rail, 4px rail. Values bound to the --aha-*
 * token layer.
 */
export const sliderTheme = {
  token: {
    colorPrimary: '#6A1EBB',
    borderRadius: 8,
    fontFamily: 'var(--aha-font-product, "Plus Jakarta Sans", sans-serif)',
  },
  components: {
    Slider: {
      railBg: '#F1F1F1',            // gray-30 rest rail
      railHoverBg: '#E3E3E3',       // gray-40 hover rail
      trackBg: '#6A1EBB',           // brand track
      trackHoverBg: '#5715A0',      // purple-80 hover track
      handleColor: '#6A1EBB',       // brand handle ring
      handleActiveColor: '#5715A0',
      dotActiveBorderColor: '#6A1EBB',
      railSize: 4,
      handleSize: 14,
      handleSizeHover: 16,
    },
  },
};

export default sliderTheme;
