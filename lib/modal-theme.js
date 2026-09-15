/**
 * @ahaslides-product/design/modal-theme — the shared Modal theme.
 *
 * Modal carries focus-trapping, a mask, scroll-locking and enter/leave motion — too much to rebuild
 * as a web component, and it keeps antd's built-in motion, so it stays a COMPOSITE on real Ant
 * (antd v6 in React, ant-design-vue v4 in Vue). What makes the two converge on ONE look is this
 * theme — the single importable contract both wrappers pass to their ConfigProvider:
 *
 *   import { modalTheme, modalStyles } from '@ahaslides-product/design/modal-theme';
 *   <ConfigProvider theme={modalTheme}><Modal open styles={modalStyles()} title="Delete slide?"> … </Modal></ConfigProvider>
 *
 * DS V3 look: white content, radius 8, ink title. Values map to the --aha-* token layer.
 * DS V3 height: capped to the viewport via `modalStyles` — a modal never grows past the screen.
 */
export const modalTheme = {
  token: {
    colorPrimary: '#6A1EBB',
    borderRadius: 8,
    colorText: '#1A1A1A',
    colorBgElevated: '#FFFFFF',
    fontFamily: 'var(--aha-font-product, "Plus Jakarta Sans", sans-serif)',
  },
  components: {
    Modal: {
      contentBg: '#FFFFFF',
      headerBg: '#FFFFFF',
      titleColor: '#1A1A1A',
      titleFontSize: 18,
      borderRadiusLG: 8,
    },
  },
};

/**
 * DS V3 size policy — a modal MUST NOT grow bigger than the screen, in EITHER axis.
 * There are three size tiers (the Action-modal use cases; a Confirmation modal always
 * uses `simple`). Each pairs a target px width with a viewport cap, so the dialog opens
 * at its natural width on a roomy screen and shrinks to fit a smaller one — never
 * overflowing. antd's Modal tokens don't cover width/height, so the cap ships as two
 * props both wrappers pass to <Modal>:
 *
 *   • WIDTH  → the `width` prop, via `modalWidth(size)` → `min(<target px>, <vw cap>)`.
 *     antd centres the dialog by ITS width, so the cap must live on the prop, not inner
 *     styles (which would leave the box off-centre).
 *   • HEIGHT → `styles={modalStyles(size)}`. Height is `auto` up to the cap; past it the
 *     BODY scrolls while the title + footer stay pinned.
 *
 *   simple      504 · 35vw · 75vh — confirm · alert · short form (rename) · single action
 *   complexity  720 · 50vw · 80vh — create/edit many fields · long form · multi-action
 *   rich       1280 · 90vw · 90vh — templates selector · long, continuously-scrolling content
 */
export const modalMaxWidth  = { simple: '35vw', complexity: '50vw', rich: '90vw' };
export const modalMaxHeight = { simple: '75vh', complexity: '80vh', rich: '90vh' };
const MODAL_TARGET_W = { simple: 504, complexity: 720, rich: 1280 };

/**
 * Value for the Modal `width` prop: the size's target px width, capped to its vw so the
 * dialog never grows wider than the screen (and stays centred). Defaults to `simple`.
 *   <Modal width={modalWidth('complexity')} …>   →   width: min(720px, 50vw)
 */
export const modalWidth = (size = 'simple') => `min(${MODAL_TARGET_W[size]}px, ${modalMaxWidth[size]})`;

/**
 * Spread onto <Modal styles={modalStyles()}> (React) / :styles (Vue). Caps the dialog
 * height to the size and makes the body the scroll region, so a long modal never grows
 * taller than the screen. Pair with `width={modalWidth(size)}` for the width cap.
 * Defaults to `simple`; pass 'complexity' | 'rich'.
 */
export const modalStyles = (size = 'simple') => ({
  // `container` is the antd v6 dialog box (.ant-modal-container) — NOT `content`, which
  // is a dead key in v6/rc-dialog. Make it a flex column and cap its height; the body
  // (the flex-grow child) becomes the scroll region.
  container: { display: 'flex', flexDirection: 'column', maxHeight: modalMaxHeight[size] },
  body: { flex: '1 1 auto', minHeight: 0, overflowY: 'auto' },
});

export default modalTheme;
