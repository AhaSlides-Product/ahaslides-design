/**
 * @ahaslides-product/design/tag-theme — the antd Tag theme, for an app that still renders antd's Tag.
 *
 *   import { tagTheme } from '@ahaslides-product/design/tag-theme';
 *   <ConfigProvider theme={tagTheme}><Tag>3 pages</Tag></ConfigProvider>
 *
 * New UI uses <aha-tag>. The colours, size and radius sit in the shared base theme (`dsAntdTheme`):
 * #F1F1F1 fill, #4A4A4A label, 12px on an 18px line, 20px tall, radius 4, no visible border.
 * antd fixes the Tag's inline padding at 7px and has no weight token, so importing this module
 * adds one rule (`tagCss`): the aha-tag 600 weight and 6px inline padding.
 */
import { dsAntdTheme } from './antd-base-theme.js';

export const tagTheme = dsAntdTheme();

export const tagCss = '.ant-tag:not(.ant-tag-checkable){font-weight:var(--aha-weight-semibold,600);padding-inline:var(--aha-space-6,6px)}';

if (typeof document !== 'undefined' && !document.querySelector('style[data-aha-tag]')) {
  const style = document.createElement('style');
  style.setAttribute('data-aha-tag', '');
  style.textContent = tagCss;
  document.head.appendChild(style);
}

export default tagTheme;
