import './icons.js';
import { icons } from './icons-registry.js';

const GLYPH_BY_ANTD_ICON = {
  'check-circle': 'system-check-circle',
  'info-circle': 'system-info',
  'exclamation-circle': 'system-warning-circle',
  'close-circle': 'system-x-circle',
};

const STATUS_GLYPH = {
  success: 'system-check-circle',
  info: 'system-info',
  warning: 'system-warning-circle',
  error: 'system-x-circle',
};

const maskUrl = (glyphName) => {
  const { viewBox, body } = icons[glyphName];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">${body.replaceAll('currentColor', '#000')}</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
};

export function statusIconCss(iconSelector) {
  const hideFilled = Object.keys(GLYPH_BY_ANTD_ICON).map((antdName) => `${iconSelector} .anticon-${antdName} svg`).join(',') + '{display:none}';
  const stroke = Object.entries(GLYPH_BY_ANTD_ICON).map(([antdName, glyphName]) =>
    `${iconSelector} .anticon-${antdName}::before{content:"";display:block;width:1em;height:1em;background-color:var(--aha-icon-default,#4A4A4A);-webkit-mask:${maskUrl(glyphName)} center/contain no-repeat;mask:${maskUrl(glyphName)} center/contain no-repeat}`);
  return [hideFilled, ...stroke].join('');
}

export function injectCss(marker, css) {
  if (typeof document === 'undefined' || document.querySelector(`style[${marker}]`)) return;
  const style = document.createElement('style');
  style.setAttribute(marker, '');
  style.textContent = css;
  document.head.appendChild(style);
}

export function dsStatusIcon(h, type, size = 16) {
  return h('aha-icon', { name: STATUS_GLYPH[type], size: String(size), style: { color: 'var(--aha-icon-default, #4A4A4A)', lineHeight: 0 } });
}
