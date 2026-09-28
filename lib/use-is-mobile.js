/**
 * @ahaslides-product/design/use-is-mobile — the React useIsMobile() hook (react is an optional peer).
 *
 *   import { useIsMobile } from '@ahaslides-product/design/use-is-mobile';
 *   const isMobile = useIsMobile();
 *   return isMobile ? <CardList rows={rows} /> : <DataTable rows={rows} />;
 *
 * True below 768px (`(max-width: 767.98px)`), re-rendering when the viewport crosses the breakpoint.
 * For SHAPE switches only — pure styling belongs in `@media (max-width: 767.98px)`. Server renders
 * (and the hydration pass) see false, then settle on the client.
 */
import { useSyncExternalStore } from 'react';
import { isMobileViewport, subscribeMobileViewport } from './viewport.js';

const serverSnapshot = () => false;

export function useIsMobile() {
  return useSyncExternalStore(subscribeMobileViewport, isMobileViewport, serverSnapshot);
}

export default useIsMobile;
