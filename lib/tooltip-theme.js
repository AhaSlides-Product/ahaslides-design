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
 * `brandTooltip` is the aha-tooltip `color="brand"` fill.
 */
import { antdBaseTheme, dsAntdTheme } from './antd-base-theme.js';

export const tooltipTheme = dsAntdTheme();

export const brandTooltip = { color: antdBaseTheme.token.colorPrimary };

export default tooltipTheme;
