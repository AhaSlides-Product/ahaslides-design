/**
 * @ahaslides-product/design/notification-theme — the shared Notification theme.
 *
 * Notification is antd's imperative `notification` API — a richer, stacking message with a title +
 * description — and keeps antd's built-in enter/leave motion, so it stays a COMPOSITE on real Ant
 * (antd v6 in React, ant-design-vue v4 in Vue). What makes the two converge on ONE look is this
 * theme — the single importable contract both wrappers pass to their ConfigProvider:
 *
 *   import { notificationTheme } from '@ahaslides-product/design/notification-theme';
 *   const [api, holder] = notification.useNotification();   // holder inside <ConfigProvider theme>
 *   api.open({ message: 'Export ready', description: 'Your CSV is ready to download.' });
 *
 * DS V3 look: white elevated card, 384 wide, radius 8, ink title. Values map to the --aha-* layer.
 *
 * The ✕ is the shared <aha-close-button>, carried in the title by `dismissibleTitle`, with antd's own
 * close turned off (`closable: false`).
 */
import { closeButtonRow } from './aha-close-button.js';

export const notificationTheme = {
  token: {
    colorPrimary: '#6A1EBB',
    borderRadius: 8,
    colorText: '#1A1A1A',
    colorTextHeading: '#1A1A1A',
    colorBgElevated: '#FFFFFF',
    fontFamily: 'var(--aha-font-product, "Plus Jakarta Sans", sans-serif)',
  },
  components: {
    Notification: {
      width: 384,
      borderRadiusLG: 8,
      colorBgElevated: '#FFFFFF',
    },
  },
};

/**
 * Notification title with the shared dismiss ✕, centred on the title's first line. Pass
 * `closable: false` so antd's own close button is not drawn too. `h` is React's createElement or Vue's h.
 *
 *   api.info({ key, closable: false, title: dismissibleTitle(createElement, 'Export ready', () => api.destroy(key)), description });
 */
export function dismissibleTitle(h, title, onClose, label = 'Close') {
  return closeButtonRow(h, title, onClose, { lineHeight: '24px', containerPadding: '24px', label });
}

export default notificationTheme;
