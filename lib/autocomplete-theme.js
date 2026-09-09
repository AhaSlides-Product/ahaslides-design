/**
 * @ahaslides-product/design/autocomplete-theme — the shared AutoComplete theme.
 *
 * AutoComplete is a COMPOSITE: its popup, filtering and free-text-with-suggestions behaviour are
 * too much for a zero-dep web component, so it stays on real Ant (antd v6 in React, ant-design-vue
 * v4 in Vue). AutoComplete renders on Ant's Select internals, so it themes through the Select
 * component token. The two wrappers converge on ONE look via this theme:
 *
 *   import { autocompleteTheme } from '@ahaslides-product/design/autocomplete-theme';
 *   <ConfigProvider theme={autocompleteTheme}><AutoComplete … /></ConfigProvider>
 *
 * DS V3 look: 32px control, radius 8, #E3E3E3 border, brand focus, brand-tint active option.
 * Values bound to the --aha-* token layer.
 */
export const autocompleteTheme = {
  token: {
    colorPrimary: '#6A1EBB',
    borderRadius: 8,
    controlHeight: 32,
    colorBorder: '#E3E3E3',
    colorText: '#1A1A1A',
    colorTextPlaceholder: '#8A8A8A',
    fontFamily: 'var(--aha-font-product, "Plus Jakarta Sans", sans-serif)',
  },
  components: {
    Select: {
      optionSelectedBg: '#F9F5FF',   // brand-tint selected row
      optionActiveBg: '#F7F7F7',     // keyboard/hover row
      borderRadius: 8,
      controlHeight: 32,
    },
  },
};

export default autocompleteTheme;
