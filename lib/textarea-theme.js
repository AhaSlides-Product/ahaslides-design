/**
 * @ahaslides-product/design/textarea-theme — the shared Textarea theme.
 *
 * Textarea is a COMPOSITE: autosize, char-count and the surrounding form integration ride on real
 * Ant (antd v6 in React, ant-design-vue v4 in Vue) rather than a zero-dep web component. The two
 * converge on ONE look via this theme — the single importable contract both wrappers pass to their
 * ConfigProvider:
 *
 *   import { textareaTheme } from '@ahaslides-product/design/textarea-theme';
 *   <ConfigProvider theme={textareaTheme}><Input.TextArea … /></ConfigProvider>
 *
 * DS V3 look: radius 8, #E3E3E3 border, brand focus/hover, #8A8A8A placeholder. Values bound to
 * the --aha-* token layer.
 */
export const textareaTheme = {
  token: {
    colorPrimary: '#6A1EBB',
    borderRadius: 8,
    colorBorder: '#E3E3E3',
    colorText: '#1A1A1A',
    colorTextPlaceholder: '#8A8A8A',
    fontFamily: 'var(--aha-font-product, "Plus Jakarta Sans", sans-serif)',
  },
  components: {
    Input: {
      activeBorderColor: '#6A1EBB',   // brand focus border
      hoverBorderColor: '#D3B4FF',    // purple-30 hover border
      borderRadius: 8,
    },
  },
};

export default textareaTheme;
