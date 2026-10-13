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
 * Validation messages match the field error row: importing this module adds one `.ant-form-item-explain-error` rule (`formErrorCss`), a 12px x-circle glyph and 12px text.
 * DS V3 look: 40px controls (large 48px; Button 36px, the DS md size), radius 8, #E3E3E3 borders, brand primary submit, #4A4A4A labels,
 * #1A1A1A error. Values bound to the --aha-* token layer.
 */
import { dsAntdTheme } from './antd-base-theme.js';
export const formTheme = dsAntdTheme({
  token: {
    colorPrimary: '#E70E68',
    borderRadius: 8,
    controlHeight: 40,
    controlHeightLG: 48,
    colorBorder: '#E3E3E3',
    colorText: '#1A1A1A',
    colorTextHeading: '#1A1A1A',
    colorTextPlaceholder: '#8A8A8A',
    colorError: '#1A1A1A',
    fontFamily: 'var(--aha-font-product, "Plus Jakarta Sans", sans-serif)',
  },
  components: {
    Form: {
      labelColor: '#4A4A4A',             // secondary-ink labels
      itemMarginBottom: 20,
      verticalLabelPadding: '0 0 4px',
    },
    Input: { borderRadius: 8, controlHeight: 40, controlHeightLG: 48 },
    Button: { borderRadius: 8, controlHeight: 36 },
  },
});

export const formErrorCss = `.ant-form-item-explain-error{display:flex;align-items:flex-start;gap:4px;margin-top:4px;font-size:var(--aha-size-sm,12px);line-height:18px;color:var(--aha-text-negative,#1A1A1A)}.ant-form-item-explain-error::before{content:"";flex:0 0 auto;width:12px;height:12px;margin-top:3px;background:currentColor;-webkit-mask:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none' stroke='%23000' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M10.33 5.67 5.67 10.33M5.67 5.67l4.66 4.66M15 8A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z'/%3E%3C/svg%3E") center/12px 12px no-repeat;mask:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none' stroke='%23000' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M10.33 5.67 5.67 10.33M5.67 5.67l4.66 4.66M15 8A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z'/%3E%3C/svg%3E") center/12px 12px no-repeat}`;

if (typeof document !== 'undefined' && !document.querySelector('style[data-aha-form-error]')) {
  const style = document.createElement('style');
  style.setAttribute('data-aha-form-error', '');
  style.textContent = formErrorCss;
  document.head.appendChild(style);
}

export default formTheme;
