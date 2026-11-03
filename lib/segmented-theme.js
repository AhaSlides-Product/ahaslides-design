/**
 * @ahaslides-product/design/segmented-theme — the antd Segmented theme, for an app that still renders antd's Segmented.
 *
 *   import { segmentedTheme } from '@ahaslides-product/design/segmented-theme';
 *   <ConfigProvider theme={segmentedTheme}><Segmented options={['Desktop', 'Mobile']} /></ConfigProvider>
 *
 * New UI uses <aha-segmented>. This theme gives an antd Segmented the same control: #F7F7F7 track,
 * radius 8, 2px track padding, 32px items padded 16px, 14px #4A4A4A labels (#1A1A1A selected and on
 * hover, no hover fill), a white radius-4 thumb and a 2px Vivid Pink keyboard focus ring. The values
 * sit in the shared base theme (`dsAntdTheme`), so any ConfigProvider built on it already has them.
 */
import { dsAntdTheme } from './antd-base-theme.js';

export const segmentedTheme = dsAntdTheme();

export default segmentedTheme;
