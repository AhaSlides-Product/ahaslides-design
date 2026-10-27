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
 * DS V3 look: white elevated card, 384 wide, radius 8, ink SemiBold 600 title, stroke status icons (--aha-icon-default).
 * antd has no title-weight or icon-glyph token, so importing this module adds one style rule (`notificationCss`).
 * Values map to the --aha-* layer.
 *
 * The ✕ is the shared tertiary icon-only <aha-button> (size xs), carried in the title by `dismissibleTitle`, with antd's own
 * close turned off (`closable: false`).
 */
import { dsAntdTheme } from './antd-base-theme.js';
import { closeButtonRow } from './close-button-row.js';
import { statusIconCss, injectCss, dsStatusIcon } from './status-icon-css.js';

export const notificationTheme = dsAntdTheme({
  token: {
    colorPrimary: '#E70E68',
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
});

/**
 * Notification title with the shared dismiss ✕, pinned to the title's first line. Pass
 * `closable: false` so antd's own close button is not drawn too. `h` is React's createElement or Vue's h.
 *
 *   api.info({ key, closable: false, title: dismissibleTitle(createElement, 'Export ready', () => api.destroy(key)), description });
 */
export function dismissibleTitle(h, title, onClose, label = 'Close') {
  return closeButtonRow(h, title, onClose, { lineHeight: '24px', label });
}

export const notificationCss = `.ant-notification-notice .ant-notification-notice-title{font-weight:600}${statusIconCss('.ant-notification-notice', 24)}`;
injectCss('data-aha-notification', notificationCss);

export const dsNotificationIcon = (h, type) => dsStatusIcon(h, type, 24);

export default notificationTheme;
