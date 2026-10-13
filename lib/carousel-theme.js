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
 * antd paints the active dot with a white overlay (`li.slick-active::after`) no token reaches, so importing
 * this module adds one rule (`carouselDotsCss`): grey 70 rest dots (3.45:1 on white), a Vivid Pink active dot, a focus ring.
 * DS V3 look: brand-primary active dot, radius 8 slides. Values map to the --aha-* token layer.
 */
import { dsAntdTheme } from './antd-base-theme.js';
export const carouselTheme = dsAntdTheme({
  token: {
    colorPrimary: '#E70E68',
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
});

export const carouselDotsCss = '.ant-carousel .slick-dots li button{background:var(--aha-gray-70,#8A8A8A);opacity:1}.ant-carousel .slick-dots li button:focus-visible{outline:2px solid var(--aha-focus-ring,#E70E68);outline-offset:2px}.ant-carousel .slick-dots li.slick-active button,.ant-carousel .slick-dots li.slick-active::after{background:var(--aha-color-primary,#E70E68)}';

if (typeof document !== 'undefined' && !document.querySelector('style[data-aha-carousel-dots]')) {
  const style = document.createElement('style');
  style.setAttribute('data-aha-carousel-dots', '');
  style.textContent = carouselDotsCss;
  document.head.appendChild(style);
}

export default carouselTheme;
