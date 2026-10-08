/**
 * @ahaslides-product/design/popconfirm-theme — the shared Popconfirm theme.
 *
 * Popconfirm is a COMPOSITE: the popover, positioning, focus trap and the two action buttons are
 * too much for a zero-dep web component, so it stays on real Ant (antd v6 in React,
 * ant-design-vue v4 in Vue). Both converge on ONE look via this theme — the single importable
 * contract each wrapper passes to its ConfigProvider:
 *
 *   import { popconfirmTheme } from '@ahaslides-product/design/popconfirm-theme';
 *   <ConfigProvider theme={popconfirmTheme}><Popconfirm …>…</Popconfirm></ConfigProvider>
 *
 * DS V3 look: radius-8 popover, #E3E3E3 borders, #1A1A1A text, and action buttons at the DS small
 * button size (28px tall, 4px corners, 14px semibold label).
 *
 * Button roles follow the colour rules: the safe choice is the primary button. A plain confirm
 * (Publish, Apply) keeps antd's defaults, a Vivid Pink confirm beside an outlined Cancel. A destructive
 * confirm (Delete, Remove) spreads `destructiveConfirm`, which makes Cancel the Vivid Pink primary and
 * the confirm the dark danger button:
 *
 *   <Popconfirm title="Delete this slide?" okText="Delete" {...destructiveConfirm}
 *     icon={<aha-icon name="system-warning-circle" size="16" style={{ marginInlineEnd: 8 }} />}> … </Popconfirm>
 */
import { dsAntdTheme } from './antd-base-theme.js';
export const popconfirmTheme = dsAntdTheme({
  token: {
    borderRadiusLG: 8,
    borderRadiusSM: 4,
    controlHeight: 32,
    controlHeightSM: 28,
    colorTextHeading: '#1A1A1A',
  },
  components: {
    Popover: { borderRadiusLG: 8, colorBgElevated: '#FFFFFF' },
    Button: { controlHeight: 32, paddingInlineSM: 8, contentFontSizeSM: 14 },
  },
});

/** Popconfirm props for a destructive confirm: Cancel is the primary button, the confirm is the danger button. */
export const destructiveConfirm = {
  okButtonProps: { danger: true, type: 'primary' },
  cancelButtonProps: { type: 'primary' },
};

export default popconfirmTheme;
