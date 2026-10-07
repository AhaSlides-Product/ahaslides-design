/**
 * Builds a dismissible row for a framework render function — the way Toast (antd message),
 * Notification (antd notification), Modal and Drawer carry the shared ✕. Works with React's
 * `createElement` and Vue's `h`. Safe to import on a server: the <aha-close-button> element is
 * registered only in a browser.
 *
 *   closeButtonRow(h, content, onClose, { lineHeight, label })
 *
 * `lineHeight` is the first line's line box, so the ✕ sits with its centre 2.5px above that line's centre.
 */
if (typeof window !== 'undefined') import('./aha-close-button.js');

export function closeButtonRow(h, content, onClose, { lineHeight = '22px', label = 'Close' } = {}) {
  return h('div', { style: { display: 'flex', alignItems: 'flex-start', gap: 'var(--aha-space-8, 8px)', minWidth: 0 } }, [
    h('div', { key: 'content', style: { flex: '1 1 auto', minWidth: 0 } }, content),
    h('aha-close-button', {
      key: 'close',
      label,
      onClick: onClose,
      style: { '--aha-close-line-height': lineHeight },
    }),
  ]);
}
