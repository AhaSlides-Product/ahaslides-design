import { withoutHtmlComments } from './screen-lint-website.js';
import { lineLocator } from './screen-lint-button.js';

export const CONTROL_SIZE_RULE_GROUPS = {
  'tooltip-size': ['tooltip-size'],
  'button-size-unset': ['button-size-unset'],
};

// A bare < ends the scan so an unclosed tag cannot make every later < rescan the rest of the file.
const TAG = /<([A-Za-z][\w.-]*)\b((?:[^<>"'{]|"[^"]*"|'[^']*'|\{[^}]*\})*)>/g;
const TAG_EDGE = /<(\/?)([A-Za-z][\w.-]*)/g;
const TOOLTIP_TAG = /tooltip/i;
const BUTTON_TAG = /^(?:aha-button|AhaButton|(?:design-?system|ds)-?button)$/i;
const LG_SIZE = /(?<![\w:.-])size\s*=\s*(?:"lg"|'lg'|\{\s*["'`]lg["'`]\s*\})|(?<![\w.-])(?:v-bind)?:size\s*=\s*(?:"\s*'lg'\s*"|'\s*"lg"\s*')/;
const ATTR = /\s([\w:.-]+)(?:\s*=\s*(?:"[^"]*"|'[^']*'|\{[^}]*\}|[^\s>]+))?/g;
const SIZE_ATTR = /^(?:v-bind)?:?size$/;
const ANY_SIZE = /(?<![\w.-])(?:v-bind)?:?size\s*=/;
const ICON_ONLY = /(?<![\w.-])(?:v-bind)?:?(?:icon-only|iconOnly)\b/;
const ICON_ONLY_OFF = /(?<![\w.-])(?:v-bind)?:?(?:icon-only|iconOnly)\s*=\s*(?:"\s*false\s*"|'\s*false\s*'|\{\s*false\s*\})/;
const SPREAD = /(?<!\S)\{\s*\.\.\.|(?<![\w:-])v-bind\s*=/;
const ROW_NAME = /header|toolbar|top-?bar|app-?bar/i;
const ROW_CLASS = /(?<![\w.-])(?:class|className|id)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
const ROLE_TOOLBAR = /(?<![\w.-])role\s*=\s*["']toolbar["']/;

const TOOLTIP_MESSAGE = 'tooltip size="lg" is the canvas tooltip (16px name on a 24px line, lib/aha-tooltip.js): on product, settings, audience and website screens a tooltip is the default size (12px), so it matches every other tooltip there. Drop size="lg"; a presenting-view control-bar tooltip (app-shell C6) is linted with --surface=canvas or marked ds-lint-allow: tooltip-size (presenter control bar)';
const BUTTON_REASON = {
  row: 'it sits in a header or toolbar row',
  sibling: 'other buttons in this file set a size',
  'icon-only': 'an icon-only button is a header, toolbar or row action',
};
const buttonMessage = (reason) => `button with no size: ${BUTTON_REASON[reason]}, and with no size it takes the default height of the button or its wrapper, which can stand taller or shorter than its neighbours (a 40px icon button beside 36px ones). Set size explicitly; header and toolbar actions are size="md" (app-shell C7)`;

const withoutQuoted = (tag) => tag.replace(/"[^"]*"|'[^']*'/g, '');
const withoutValues = (tag) => {
  let bare = withoutQuoted(tag);
  for (let inner = bare.replace(/\{[^{}]*\}/g, ''); inner !== bare; inner = bare.replace(/\{[^{}]*\}/g, '')) bare = inner;
  return bare;
};

function tagsOf(plain) {
  const lineAt = lineLocator(plain);
  return [...plain.matchAll(TAG)].map((match) => ({ name: match[1], source: match[0], bare: withoutValues(match[0]),
    index: match.index, end: match.index + match[0].length, line: lineAt(match.index), endLine: lineAt(match.index + match[0].length - 1),
    selfClosing: /\/\s*>$/.test(match[0]) }));
}

function isRowContainer(tag) {
  if (tag.selfClosing) return false;
  if (ROW_NAME.test(tag.name) || ROLE_TOOLBAR.test(tag.source)) return true;
  return [...tag.source.matchAll(ROW_CLASS)].some((named) => (named[1] ?? named[2]).split(/\s+/).some((token) => ROW_NAME.test(token)));
}

function rowRanges(plain, tags) {
  const byIndex = new Map(tags.map((tag) => [tag.index, tag]));
  const open = new Map();
  const ranges = [];
  for (const edge of plain.matchAll(TAG_EDGE)) {
    const name = edge[2].toLowerCase();
    const stack = open.get(name) || open.set(name, []).get(name);
    if (edge[1]) { const row = stack.pop(); if (row) ranges.push([row.end, edge.index]); continue; }
    const tag = byIndex.get(edge.index);
    if (tag && !tag.selfClosing) stack.push(isRowContainer(tag) ? tag : null);
  }
  for (const stack of open.values()) for (const row of stack) if (row) ranges.push([row.end, plain.length]);
  return ranges;
}

export function tooltipSizeFindings(text) {
  return tagsOf(withoutHtmlComments(text))
    .filter((tag) => TOOLTIP_TAG.test(tag.name) &&
      [...tag.source.matchAll(ATTR)].some((attr) => SIZE_ATTR.test(attr[1]) && LG_SIZE.test(attr[0])))
    .map(({ line, endLine }) => ({ line, endLine, rule: 'tooltip-size', message: TOOLTIP_MESSAGE, severity: 'hard' }));
}

export function buttonSizeFindings(text) {
  const plain = withoutHtmlComments(text);
  const tags = tagsOf(plain);
  const rows = rowRanges(plain, tags);
  const buttons = tags.filter((tag) => BUTTON_TAG.test(tag.name));
  const sized = buttons.filter((tag) => ANY_SIZE.test(tag.bare));
  const findings = [];
  for (const tag of buttons) {
    if (ANY_SIZE.test(tag.bare) || SPREAD.test(withoutQuoted(tag.source))) continue;
    const reason = rows.some(([start, end]) => tag.index >= start && tag.index < end) ? 'row'
      : sized.length ? 'sibling'
      : ICON_ONLY.test(tag.bare) && !ICON_ONLY_OFF.test(tag.source) ? 'icon-only' : null;
    if (reason) findings.push({ line: tag.line, endLine: tag.endLine, rule: 'button-size-unset', message: buttonMessage(reason), severity: 'warn' });
  }
  return findings;
}
