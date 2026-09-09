/**
 * @ahaslides-product/design/form-theme — the shared Form theme.
 *
 * Form is a COMPOSITE: validation, layout and the controls it hosts are too much for a zero-dep
 * web component, so it stays on real Ant (antd v6 in React, ant-design-vue v4 in Vue). The two
 * converge on ONE look via this theme — the single importable contract both wrappers pass to
 * their ConfigProvider:
 *
 *   import { formTheme } from '@ahaslides-product/design/form-theme';
 *   <ConfigProvider theme={formTheme}><Form …>…</Form></ConfigProvider>
 *
 * DS V3 look: 36px controls, radius 8, #E3E3E3 borders, brand primary submit, #4A4A4A labels,
 * #F5222D error. Values bound to the --aha-* token layer.
 */
export const formTheme = {
  token: {
    colorPrimary: '#6A1EBB',
    borderRadius: 8,
    controlHeight: 36,
    colorBorder: '#E3E3E3',
    colorText: '#1A1A1A',
    colorTextHeading: '#1A1A1A',
    colorTextPlaceholder: '#8A8A8A',
    colorError: '#F5222D',
    fontFamily: 'var(--aha-font-product, "Plus Jakarta Sans", sans-serif)',
  },
  components: {
    Form: {
      labelColor: '#4A4A4A',             // secondary-ink labels
      itemMarginBottom: 20,
      verticalLabelPadding: '0 0 4px',
    },
    Input: { borderRadius: 8, controlHeight: 36 },
    Button: { borderRadius: 8, controlHeight: 36 },
  },
};

export default formTheme;
