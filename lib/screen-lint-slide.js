/*
 * screen-lint slide-surface rules — the control rules for a slide type's presenter canvas and
 * audience phone. Pure like the core (no fs, no process, no console); lib/screen-lint.js calls
 * `createSlideControlRules(surface)` once per file and the returned function once per line.
 */

export const SLIDE_SURFACES = ['canvas', 'audience'];

export const SLIDE_RULE_GROUPS = {
  button: ['raw-button', 'button-size-xl', 'button-hand-sizing', 'audience-button-size', 'audience-button-variant'],
  shortcut: ['hand-made-key-chip', 'standalone-key-chip'],
};

const BUTTON_DOC = 'https://design.ahaslides.io/button/index.html';
const ELEMENT_FACTORY = String.raw`(?<![\w$])(?:el|elem|element|h|tag|node|dom|createEl|createElement|createElementNS)`;
const FIRST_ARGUMENT = String.raw`\(\s*(?:[\w$.]+\s*,\s*|["'][^"']*["']\s*,\s*)?`;
const factoryCall = (tagName) => new RegExp(`${ELEMENT_FACTORY}${FIRST_ARGUMENT}["']${tagName}["']\\s*[,)]`);

const COMMENT_LINE = /^\s*(?:\/\/|\/\*|\*(?:\s|\/|$)|<!--(?:(?!-->).)*(?:-->\s*)?$)/;

const BUTTON_MARKUP = /<button(?=[\s>/])/i;
const BUTTON_FACTORY = factoryCall('button');
const ROLE_BUTTON = [
  /(?<![[\w-])role\s*=\s*\\?["']?button\b/i,
  /(?<![\w$-])["']?role["']?\s*:\s*["']button["']/,
  /["']role["']\s*,\s*["']button["']/,
  /\.role\s*=(?!=)\s*["']button["']/,
];

const AHA_BUTTON_FACTORY = new RegExp(factoryCall('aha-button').source, 'g');
const KEY_CHIP_FACTORY = new RegExp(factoryCall('kbd').source, 'g');
const MARKUP_TOKEN = /<aha-button(?![\w-])|<\/aha-button\s*>|<kbd\b/gi;
// A button whose end is assembled elsewhere, or a stylesheet string that never closes its brace on a
// scanned line, must not turn every later line into a finding.
const OPEN_BUTTON_LINE_LIMIT = 30;
const PART_BLOCK_LINE_LIMIT = 20;

const SIZE_XL_ATTRIBUTE = /(?<![\w-])size\s*=\s*\\?["']?xl\b/i;
const SIZE_XL_PROPERTY = /(?<![\w$-])["']?size["']?\s*:\s*["']xl["']/;
const SIZE_XL_SET = /setAttribute\(\s*["']size["']\s*,\s*["']xl["']/;
const INLINE_STYLE = /(?<![\w-])style\s*=\s*\\?["']([^"']*)|(?<![\w$-])["']?style["']?\s*:\s*["']([^"']*)/gi;
const SIZING_DECLARATION = /(?<![\w-])((?:min-)?height|padding(?:-[a-z-]+)?|font-size|border(?:-[a-z]+)*-radius)\s*:/i;
const PART_BUTTON = /::part\(\s*button\s*\)/gi;
const PART_SELECTOR_LINE_LIMIT = 3;

const AUDIENCE_SIZE_ATTRIBUTE = /(?<![\w-])size\s*=\s*\\?["']?(xs|sm|md|lg)\b/i;
const AUDIENCE_SIZE_PROPERTY = /(?<![\w$-])["']?size["']?\s*:\s*["'](xs|sm|md|lg)["']/;
const AUDIENCE_CLOSE_VARIANT = /(?<![\w-])["']?variant["']?\s*[=:]\s*\\?["']?tertiary-deck(?![\w-])/i;
const AUDIENCE_CLOSE_ICON_ONLY = /(?<![\w-])["']?icon-?only["']?(?![\w-])/i;
const PRODUCT_VARIANT_ATTRIBUTE = /(?<![\w-])variant\s*=\s*\\?["']?(secondary|tertiary|danger|link|positive)(?![\w-])/i;
const PRODUCT_VARIANT_PROPERTY = /(?<![\w$-])["']?variant["']?\s*:\s*["'](secondary|tertiary|danger|link|positive)["']/;

const MESSAGES = {
  rawButton: {
    canvas: `a raw <button> on the presenter canvas — in-canvas controls are <aha-button size="lg"> from lib/canvas.js (canvas C3, C17; ${BUTTON_DOC}). A bespoke control the DS does not ship keeps the tag with ds-lint-allow: raw-button (why)`,
    audience: `a raw <button> on the audience phone — actions are <aha-audience-submit> or <aha-button size="touch"> (primary / secondary-deck / tertiary-deck), answers <aha-answer-list>, toggles <aha-audience-chip>, all from lib/audience.js (audience C9, C15). A bespoke control the DS does not ship keeps the tag with ds-lint-allow: raw-button (why)`,
  },
  roleButton: {
    canvas: 'role="button" on a hand-made element on the presenter canvas — use <aha-button size="lg"> (canvas C3, C17). A bespoke control the DS does not ship keeps the role with ds-lint-allow: raw-button (why)',
    audience: 'role="button" on a hand-made element on the audience phone — use <aha-audience-submit>, <aha-button size="touch"> or the audience element that fits (audience C15). A bespoke control the DS does not ship keeps the role with ds-lint-allow: raw-button (why)',
  },
  sizeXl: {
    canvas: '<aha-button size="xl"> — the 52px size is retired on the canvas; presenter controls are size="lg" (40px), themed by applyCanvasDeck (canvas C17)',
    audience: '<aha-button size="xl"> — the audience phone action is size="touch" (48px), or <aha-audience-submit> for the submit',
  },
  inlineSizing: (property) => `inline style sets ${property} on <aha-button> — a button is sized by its size attribute only (canvas C17)`,
  partSizing: (property) => `::part(button) sets ${property} — a button is sized by its size attribute only, never through ::part (canvas C17)`,
  buttonKeyChip: 'a hand-made <kbd> inside <aha-button> — the key chip is the button\'s shortcut attribute: <aha-button shortcut="N">Next</aha-button> (canvas C10)',
  standaloneKeyChip: 'a hand-made <kbd> — if it shows a button\'s key, use the shortcut attribute on <aha-button> or <aha-tooltip> instead (canvas C10)',
  audienceSize: (size) => `<aha-button size="${size}"> on the audience phone — a phone action is size="touch" (48px), below that the tap target is under the 44px floor`,
  audienceVariant: (variant) => `<aha-button variant="${variant}"> on the audience phone — the deck variants are primary, secondary-deck and tertiary-deck; "${variant}" carries product colours that do not track the deck`,
};

function tagEnd(line, from) {
  let quote = '';
  for (let index = from; index < line.length; index++) {
    const character = line[index];
    if (quote) { if (character === quote) quote = ''; }
    else if (character === '"' || character === "'") quote = character;
    else if (character === '>' && line[index - 1] !== '=') return index;
  }
  return -1;
}

function parenthesisedCall(line, from, depth) {
  let quote = '';
  for (let index = from; index < line.length; index++) {
    const character = line[index];
    if (quote) {
      if (character === '\\') index++;
      else if (character === quote) quote = '';
    } else if (character === '"' || character === "'" || character === '`') quote = character;
    else if (character === '(') depth++;
    else if (character === ')' && --depth === 0) return { end: index + 1, depth: 0 };
  }
  return { end: line.length, depth };
}

function declarationsAfterBrace(line, from) {
  const open = line.indexOf('{', from);
  if (open < 0) return null;
  const close = line.indexOf('}', open);
  return { text: line.slice(open + 1, close < 0 ? line.length : close), closed: close >= 0 };
}

export function createSlideControlRules(surface) {
  let openTag = false;
  let elementDepth = 0;
  let elementOpenLines = 0;
  let callDepth = 0;
  let callOpenLines = 0;
  let insidePartBlock = false;
  let partBlockLines = 0;
  let partSelectorLines = 0;

  return function slideControlFindings(line) {
    if (COMMENT_LINE.test(line)) return [];
    const findings = [];
    const hard = (rule, message) => findings.push({ rule, message, severity: 'hard' });
    const warn = (rule, message) => findings.push({ rule, message, severity: 'warn' });

    if (BUTTON_MARKUP.test(line) || BUTTON_FACTORY.test(line)) hard('raw-button', MESSAGES.rawButton[surface]);
    else if (ROLE_BUTTON.some((pattern) => pattern.test(line))) hard('raw-button', MESSAGES.roleButton[surface]);

    const tagSegments = [];
    const keyChips = [];
    if (openTag) {
      const close = tagEnd(line, 0);
      tagSegments.push(line.slice(0, close < 0 ? line.length : close));
      if (close >= 0) openTag = false;
    }
    for (const token of line.matchAll(MARKUP_TOKEN)) {
      const text = token[0].toLowerCase();
      if (text === '<kbd') keyChips.push({ index: token.index, insideButton: elementDepth > 0 });
      else if (text.startsWith('</')) elementDepth = Math.max(0, elementDepth - 1);
      else {
        elementDepth++;
        const close = tagEnd(line, token.index);
        tagSegments.push(line.slice(token.index, close < 0 ? line.length : close));
        openTag = close < 0;
      }
    }
    elementOpenLines = elementDepth > 0 ? elementOpenLines + 1 : 0;
    if (elementOpenLines > OPEN_BUTTON_LINE_LIMIT) { elementDepth = 0; elementOpenLines = 0; }

    const callSegments = [];
    if (callDepth > 0) {
      const call = parenthesisedCall(line, 0, callDepth);
      callSegments.push({ from: 0, to: call.end });
      callDepth = call.depth;
    }
    for (const match of line.matchAll(AHA_BUTTON_FACTORY)) {
      if (callSegments.some((segment) => match.index >= segment.from && match.index < segment.to)) continue;
      const call = parenthesisedCall(line, line.indexOf('(', match.index), 0);
      callSegments.push({ from: match.index, to: call.end });
      callDepth = call.depth;
    }
    callOpenLines = callDepth > 0 ? callOpenLines + 1 : 0;
    if (callOpenLines > OPEN_BUTTON_LINE_LIMIT) { callDepth = 0; callOpenLines = 0; }
    const insideCall = (index) => callSegments.some((segment) => index >= segment.from && index < segment.to);
    for (const match of line.matchAll(KEY_CHIP_FACTORY)) keyChips.push({ index: match.index, insideButton: insideCall(match.index) });
    for (const chip of keyChips) if (!chip.insideButton && insideCall(chip.index)) chip.insideButton = true;

    const buttonText = [...tagSegments, ...callSegments.map((segment) => line.slice(segment.from, segment.to))];
    if (buttonText.some((text) => SIZE_XL_ATTRIBUTE.test(text) || SIZE_XL_PROPERTY.test(text)) || SIZE_XL_SET.test(line))
      hard('button-size-xl', MESSAGES.sizeXl[surface]);
    for (const text of buttonText)
      for (const style of text.matchAll(INLINE_STYLE)) {
        const sizing = (style[1] ?? style[2] ?? '').match(SIZING_DECLARATION);
        if (sizing) hard('button-hand-sizing', MESSAGES.inlineSizing(sizing[1].toLowerCase()));
      }

    const partDeclarations = [];
    let cursor = 0;
    if (insidePartBlock) {
      const close = line.indexOf('}');
      partDeclarations.push(line.slice(0, close < 0 ? line.length : close));
      insidePartBlock = close < 0;
      cursor = close < 0 ? line.length : close + 1;
    } else if (partSelectorLines > 0) {
      const block = /[;}]/.test(line.split('{')[0]) ? null : declarationsAfterBrace(line, 0);
      if (block) { partDeclarations.push(block.text); insidePartBlock = !block.closed; partSelectorLines = 0; }
      else partSelectorLines = /[;}]/.test(line) || partSelectorLines >= PART_SELECTOR_LINE_LIMIT ? 0 : partSelectorLines + 1;
    }
    for (const match of line.matchAll(PART_BUTTON)) {
      if (match.index < cursor) continue;
      const block = declarationsAfterBrace(line, match.index);
      if (!block) { partSelectorLines = 1; continue; }
      partDeclarations.push(block.text);
      insidePartBlock = !block.closed;
    }
    partBlockLines = insidePartBlock ? partBlockLines + 1 : 0;
    if (partBlockLines > PART_BLOCK_LINE_LIMIT) { insidePartBlock = false; partBlockLines = 0; }
    for (const declarations of partDeclarations) {
      const sizing = declarations.match(SIZING_DECLARATION);
      if (sizing) hard('button-hand-sizing', MESSAGES.partSizing(sizing[1].toLowerCase()));
    }

    for (const chip of keyChips) {
      if (chip.insideButton) hard('hand-made-key-chip', MESSAGES.buttonKeyChip);
      else warn('standalone-key-chip', MESSAGES.standaloneKeyChip);
    }

    if (surface === 'audience')
      for (const text of buttonText) {
        const size = text.match(AUDIENCE_SIZE_ATTRIBUTE) || text.match(AUDIENCE_SIZE_PROPERTY);
        const isAudienceClose = size?.[1].toLowerCase() === 'md' && AUDIENCE_CLOSE_VARIANT.test(text) && AUDIENCE_CLOSE_ICON_ONLY.test(text);
        if (size && !isAudienceClose) warn('audience-button-size', MESSAGES.audienceSize(size[1].toLowerCase()));
        const variant = text.match(PRODUCT_VARIANT_ATTRIBUTE) || text.match(PRODUCT_VARIANT_PROPERTY);
        if (variant) warn('audience-button-variant', MESSAGES.audienceVariant(variant[1].toLowerCase()));
      }

    return findings;
  };
}

const HEX_OR_FUNCTION_COLOUR = /#[0-9A-Fa-f]{3,8}\b|\b(?:rgba?|hsla?)\s*\(/i;

/** The deck-world colour and font checks for the audience phone; `css` is the line's CSS with var() removed. */
export function audienceDeckFindings(css) {
  const findings = [];
  const colour = css.match(HEX_OR_FUNCTION_COLOUR);
  if (colour)
    findings.push({ rule: 'canvas-hardcoded-colour', severity: 'hard', message: `hardcoded colour ${colour[0]} — audience colour must read from the deck (applyDeck, xprops) or a bundled --aha-* token, never a literal (audience C1, C2)` });
  if (/font-family\s*:/i.test(css))
    findings.push({ rule: 'canvas-hardcoded-font', severity: 'warn', message: 'font-family literal on the audience phone — font should read from the deck theme (xprops)' });
  return findings;
}
