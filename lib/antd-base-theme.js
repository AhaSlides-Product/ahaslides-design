/**
 * @ahaslides-product/design/antd-base-theme — the colour rules every antd composite theme starts from.
 *
 *   import { dsAntdTheme } from '@ahaslides-product/design/antd-base-theme';
 *   export const myTheme = dsAntdTheme({ token: { controlHeight: 32 }, components: { Table: { … } } });
 *
 * antd derives a control's hover, press, focus and status colours from its seed colours, and those
 * derived shades (a lighter pink hover, a blue info icon, a green success tick) are off the AhaSlides
 * colour list. `dsAntdTheme` pins each of them to a listed colour, then lays the composite's own
 * tokens on top. Every `*-theme` export in this package is built with it.
 */
export const antdBaseTheme = {
  token: {
    colorPrimary: '#E70E68',
    colorPrimaryHover: '#DB005B',
    colorPrimaryActive: '#DB005B',
    colorPrimaryBg: '#FEF3F7',
    colorPrimaryBgHover: '#FEF3F7',
    colorPrimaryBorder: '#E70E68',
    colorPrimaryBorderHover: '#DB005B',
    colorPrimaryText: '#E70E68',
    colorPrimaryTextHover: '#DB005B',
    colorPrimaryTextActive: '#DB005B',
    colorSuccess: '#1A1A1A',
    colorWarning: '#1A1A1A',
    colorError: '#1A1A1A',
    colorInfo: '#1A1A1A',
    colorLink: '#E70E68',
    colorLinkHover: '#DB005B',
    colorLinkActive: '#DB005B',
    controlOutline: 'rgba(231,14,104,.3)',
    controlItemBgActive: '#FEF3F7',
    controlItemBgActiveHover: '#FEF3F7',
    colorText: '#1A1A1A',
    colorBorder: '#E3E3E3',
    colorBgElevated: '#FFFFFF',
    borderRadius: 8,
    fontFamily: 'var(--aha-font-product, "Plus Jakarta Sans", sans-serif)',
  },
  components: {
    Button: {
      fontWeight: 600,
      primaryShadow: '0 2px 0 rgba(0,0,0,.04)',
      defaultShadow: '0 2px 0 rgba(0,0,0,.016)',
      dangerShadow: '0 2px 0 rgba(0,0,0,.04)',
      defaultHoverBg: '#FEF3F7',
      defaultHoverColor: '#E70E68',
      defaultHoverBorderColor: '#E70E68',
      defaultActiveBg: '#FEF3F7',
      defaultActiveColor: '#E70E68',
      defaultActiveBorderColor: '#DB005B',
    },
  },
};

/**
 * A composite theme on top of the AhaSlides colour rules: `theme.token` overrides the base tokens, and
 * each `theme.components.<Name>` is merged into the base entry for that component rather than replacing it.
 */
export function dsAntdTheme(theme = {}, base = antdBaseTheme) {
  const components = { ...base.components };
  for (const [name, own] of Object.entries(theme.components || {})) components[name] = { ...base.components[name], ...own };
  return { ...theme, token: { ...base.token, ...theme.token }, components };
}

export default dsAntdTheme;
