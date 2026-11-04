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
 *
 * It also carries the DS type scale (antd Title levels 1 to 5 at the aha-text level sizes, body line height
 * 1.5, secondary and tertiary text greys), fontHeight from that line height (antd derives it from its own
 * 22/14, which leaves a Select 1px short of its height), and the DS look for the antd parts an app uses without wrapping
 * them in a composite theme: Modal (so Modal.confirm matches modal-theme), Tooltip, Tag and Segmented.
 */
import { tokens } from './tokens.js';

const { size, lineHeight, radius, color, layout } = tokens;
const gray = color.primitives.gray;
const fontHeightOf = (fontSize, height) => Math.round(fontSize * height);
const tooltipPadding = { block: 6, inline: 10 };
const segmentedItem = { height: 32, paddingInline: 16, trackPadding: 2 };

export const antdBaseTheme = {
  token: {
    colorPrimary: '#E70E68',
    colorPrimaryHover: '#DB005B',
    colorPrimaryActive: '#DB005B',
    colorPrimaryBg: '#E70E680D',
    colorPrimaryBgHover: '#E70E680D',
    colorPrimaryBorder: '#E70E68',
    colorPrimaryBorderHover: '#DB005B',
    colorPrimaryText: '#E70E68',
    colorPrimaryTextHover: '#DB005B',
    colorPrimaryTextActive: '#DB005B',
    colorSuccess: '#1A1A1A',
    colorWarning: '#1A1A1A',
    colorError: '#1A1A1A',
    colorInfo: '#1A1A1A',
    colorLink: color.textLink,
    colorLinkHover: color.textLinkHover,
    colorLinkActive: color.textLinkHover,
    controlOutline: 'rgba(231,14,104,.3)',
    controlItemBgActive: '#E70E680D',
    controlItemBgActiveHover: '#E70E680D',
    colorText: '#1A1A1A',
    colorBorder: '#E3E3E3',
    colorBgElevated: '#FFFFFF',
    borderRadius: 8,
    fontFamily: 'var(--aha-font-product, "Plus Jakarta Sans", sans-serif)',
    colorTextHeading: color.textDefault,
    colorTextDescription: color.textSecondary,
    colorTextTertiary: color.textTertiary,
    colorTextPlaceholder: color.textPlaceholder,
    lineHeight: lineHeight.body,
    fontHeight: fontHeightOf(size.default, lineHeight.body),
    fontSizeHeading1: size.h3,
    fontSizeHeading2: size.h4,
    fontSizeHeading3: size.xl,
    fontSizeHeading4: size.h6,
    fontSizeHeading5: size.l,
    lineHeightHeading1: lineHeight.heading,
    lineHeightHeading2: lineHeight.heading,
    lineHeightHeading3: lineHeight.heading,
    lineHeightHeading4: lineHeight.heading,
    lineHeightHeading5: lineHeight.heading,
  },
  components: {
    Button: {
      fontWeight: 600,
      primaryShadow: '0 2px 0 rgba(0,0,0,.04)',
      defaultShadow: '0 2px 0 rgba(0,0,0,.016)',
      dangerShadow: '0 2px 0 rgba(0,0,0,.04)',
      colorBgContainerDisabled: '#E3E3E3',
      borderColorDisabled: '#E3E3E3',
      colorTextDisabled: '#B5B5B5',
      defaultHoverBg: '#E70E680D',
      defaultHoverColor: '#DB005B',
      defaultHoverBorderColor: '#E70E68',
      defaultActiveBg: '#E70E680D',
      defaultActiveColor: '#DB005B',
      defaultActiveBorderColor: '#DB005B',
    },
    // antd derives the title from fontSizeHeading5, which is now the 16px level 5
    Modal: {
      titleFontSize: size.h6,
      titleLineHeight: lineHeight.body,
      titleColor: color.textDefault,
      borderRadiusLG: radius.default,
    },
    // antd pads the bubble paddingSM / 2 by paddingXS and sets its min height from controlHeight
    Tooltip: {
      colorBgSpotlight: color.bgDark,
      colorTextLightSolid: color.textInverse,
      fontSize: size.sm,
      lineHeight: lineHeight.body,
      borderRadius: radius.sm,
      paddingSM: tooltipPadding.block * 2,
      paddingXS: tooltipPadding.inline,
      controlHeight: tooltipPadding.block * 2 + size.sm * lineHeight.body,
      maxWidth: layout.tooltipMaxWidth,
    },
    // the line box is lineHeightSM × 12px inside a 1px border: 18 + 2 = the 20px aha-tag
    Tag: {
      defaultBg: gray['30'],
      defaultColor: color.textSecondary,
      colorBorder: 'transparent',
      fontSizeSM: size.sm,
      lineHeightSM: lineHeight.body,
      borderRadiusSM: radius.xs,
    },
    // antd sizes an item as controlHeight minus the track padding on both sides, padded controlPaddingHorizontal - 1px
    // ant-design-vue 4 reads the track, label and hover fill from these global aliases, not the item tokens
    Segmented: {
      trackBg: gray['20'],
      colorBgLayout: gray['20'],
      colorTextLabel: color.textSecondary,
      colorFillSecondary: 'transparent',
      trackPadding: segmentedItem.trackPadding,
      itemSelectedBg: color.bgElevated,
      itemColor: color.textSecondary,
      itemHoverColor: color.textDefault,
      itemSelectedColor: color.textDefault,
      itemHoverBg: 'transparent',
      itemActiveBg: 'transparent',
      controlHeight: segmentedItem.height + segmentedItem.trackPadding * 2,
      controlPaddingHorizontal: segmentedItem.paddingInline + 1,
      borderRadius: radius.default,
      borderRadiusSM: radius.xs,
      lineWidthFocus: 2,
      boxShadowTertiary: '0 1px 2px rgba(26,26,26,.12)',
    },
    Message: {
      colorText: color.textDefault,
      colorTextHeading: color.textDefault,
    },
    Notification: {
      colorText: color.textSecondary,
      colorTextHeading: color.textDefault,
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
  const token = { ...base.token, ...theme.token };
  if (theme.token && !('fontHeight' in theme.token) && ('fontSize' in theme.token || 'lineHeight' in theme.token)) {
    token.fontHeight = fontHeightOf(token.fontSize ?? size.default, token.lineHeight);
  }
  return { ...theme, token, components };
}

export default dsAntdTheme;
