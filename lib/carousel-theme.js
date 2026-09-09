/**
 * @ahaslides-product/design/carousel-theme — the shared Carousel theme.
 *
 * Carousel carries slide transitions, autoplay, and dot/arrow controls — it keeps antd's built-in
 * motion, so it stays a COMPOSITE on real Ant (antd v6 in React, ant-design-vue v4 in Vue). What
 * makes the two converge on ONE look is this theme — the single importable contract both wrappers
 * pass to their ConfigProvider:
 *
 *   import { carouselTheme } from '@ahaslides-product/design/carousel-theme';
 *   <ConfigProvider theme={carouselTheme}><Carousel autoplay> … </Carousel></ConfigProvider>
 *
 * DS V3 look: brand-primary active dot, radius 8 slides. Values map to the --aha-* token layer.
 */
export const carouselTheme = {
  token: {
    colorPrimary: '#6A1EBB',
    borderRadius: 8,
    fontFamily: 'var(--aha-font-product, "Plus Jakarta Sans", sans-serif)',
  },
  components: {
    Carousel: {
      dotWidth: 16,
      dotHeight: 4,
      dotActiveWidth: 28,    // brand-primary active dot, wider
      dotGap: 8,
      arrowSize: 20,
      arrowOffset: 12,
    },
  },
};

export default carouselTheme;
