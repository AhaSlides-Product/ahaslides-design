/**
 * @ahaslides-product/design/viewport — the ONE mobile breakpoint, framework-agnostic.
 *
 *   import { isMobileViewport, subscribeMobileViewport } from '@ahaslides-product/design/viewport';
 *   const stop = subscribeMobileViewport((isMobile) => …);   // call stop() to unsubscribe
 *
 * Mobile is `(max-width: 767.98px)` — .98 so there is no sub-pixel gap against a 768px min-width
 * rule at fractional device-pixel ratios. This store powers <aha-viewport-switch> and the React
 * useIsMobile() hook; use it for renders that change SHAPE (table → card list, sidebar → drawer).
 * Pure styling does not need it — write `@media (max-width: 767.98px)` in CSS directly.
 * Safe to import during server rendering: with no window it reports desktop (false).
 */
export const MOBILE_MAX_WIDTH = 767.98;
export const MOBILE_MEDIA_QUERY = `(max-width: ${MOBILE_MAX_WIDTH}px)`;

let mediaQueryList = null;
const mobileMediaQueryList = () => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return null;
  if (!mediaQueryList) mediaQueryList = window.matchMedia(MOBILE_MEDIA_QUERY);
  return mediaQueryList;
};

export function isMobileViewport() {
  const list = mobileMediaQueryList();
  return list ? list.matches : false;
}

export function subscribeMobileViewport(onChange) {
  const list = mobileMediaQueryList();
  if (!list) return () => {};
  const listener = () => onChange(list.matches);
  list.addEventListener('change', listener);
  return () => list.removeEventListener('change', listener);
}

export default { MOBILE_MAX_WIDTH, MOBILE_MEDIA_QUERY, isMobileViewport, subscribeMobileViewport };
