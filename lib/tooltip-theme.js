/**
 * @ahaslides-product/design/tooltip-theme — the antd Tooltip theme, for an app that still renders antd's Tooltip.
 *
 *   import { tooltipTheme, brandTooltip } from '@ahaslides-product/design/tooltip-theme';
 *   <ConfigProvider theme={tooltipTheme}><Tooltip title="Rename">…</Tooltip></ConfigProvider>
 *   <Tooltip title="New" {...brandTooltip}>…</Tooltip>
 *
 * New UI uses <aha-tooltip>. This theme gives an antd Tooltip the same bubble: solid #1A1A1A, white
 * 12/18 text, radius 6, padding 6 10, 30px minimum height, wrapping at 280px. The values sit in the
 * shared base theme (`dsAntdTheme`), so any ConfigProvider built on it already has them.
 * `brandTooltip` is the aha-tooltip `color="brand"` fill. In ant-design-vue 4 also bind `vueTooltip`
 * on each <a-tooltip> for the 280px width.
 */
import { antdBaseTheme, dsAntdTheme } from './antd-base-theme.js';

export const tooltipTheme = dsAntdTheme();

export const brandTooltip = { color: antdBaseTheme.token.colorPrimary };

// ant-design-vue 4 fixes the bubble width at 250px after the theme merges, so the 280px cap has to ride on the overlay
export const vueTooltip = { overlayStyle: { maxWidth: `${antdBaseTheme.components.Tooltip.maxWidth}px` } };

export default tooltipTheme;
