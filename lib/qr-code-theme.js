/**
 * @ahaslides-product/design/qr-code-theme — the shared QR code theme.
 *
 * QR code encoding + canvas/SVG rendering is real work best left to Ant's QRCode, so it stays a
 * COMPOSITE on real Ant (antd v6 in React, ant-design-vue v4 in Vue). What makes the two converge
 * on ONE look is this theme — the single importable contract both wrappers pass to ConfigProvider:
 *
 *   import { qrCodeTheme } from '@ahaslides-product/design/qr-code-theme';
 *   <ConfigProvider theme={qrCodeTheme}><QRCode value="https://ahaslides.com" /></ConfigProvider>
 *
 * DS V3 look: ink #1A1A1A modules on white, framed by a 1px #E3E3E3 radius-8 container. Values
 * map to the --aha-* token layer.
 */
export const qrCodeTheme = {
  token: {
    colorPrimary: '#6A1EBB',
    borderRadius: 8,
    colorText: '#1A1A1A',              // QR module ink
    colorBorderSecondary: '#E3E3E3',   // framing border
    fontFamily: 'var(--aha-font-product, "Plus Jakarta Sans", sans-serif)',
  },
};

export default qrCodeTheme;
