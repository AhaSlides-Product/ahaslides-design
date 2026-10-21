/*
 * screen-lint button-styling rules: a button drawn with its own CSS instead of <aha-button>, and CSS
 * that re-paints an <aha-button> from outside. Both read whole CSS rule blocks, so a hover override
 * on its own line is caught as well as the base rule. lib/screen-lint.js reports each finding on the
 * line its selector starts on, where a ds-lint-allow marker silences it.
 */
export const BUTTON_STYLE_RULES = ['hand-rolled-button', 'restyled-button'];

const BUTTON_DOC = 'https://design.ahaslides.io/button/index.html';
const BUTTON_WORD = /^(?:button|btn|cta)$/i;
const PART_AROUND_BUTTON = /^(?:buttons|btns|ctas|group|row|wrap|wrapper|list|bar|container|area|section|block|text|label|icon|title|copy)$/i;
const PAINT_PROPERTY = /^(?:background(?:-color|-image)?|border(?:-(?:top|right|bottom|left|block|inline)(?:-(?:start|end))?)?(?:-color)?|color|box-shadow)$/i;
const SHAPE_PROPERTY = /^(?:height|min-height|padding(?:-[a-z-]+)?|font-(?:size|weight|family)|font|line-height|border(?:-[a-z-]+)?|outline(?:-[a-z-]+)?|text-decoration(?:-[a-z-]+)?|letter-spacing)$/i;
const RESET_VALUE = /^(?:none|0(?:px)?|transparent|inherit|initial|unset|revert|currentcolor)$/i;

const blankComments = (text) => text.replace(/\/\*[\s\S]*?\*\/|<!--[\s\S]*?-->/g, (comment) => comment.replace(/[^\n]/g, ' '));

// A selector list we can trust as CSS: quotes, parentheses, "=" or ";" outside an attribute
// selector or a pseudo-class argument mean the "{" opened a JS block, not a rule.
function cssSelectorList(text) {
  const selector = text.replace(/^[\s\S]*<style\b[^>]*>/i, '').trim();
  if (!selector || selector.startsWith('@')) return null;
  const bare = selector.replace(/\[[^\]]*\]/g, '').replace(/::?[a-z-]+\((?:[^()]|\([^()]*\))*\)/gi, '');
  return /^[\w\s.#:,>+~*\\-]+$/.test(bare) ? selector : null;
}

function splitTopLevel(text, separator) {
  const parts = [];
  let depth = 0, current = '';
  for (const character of text) {
    if (character === '(' || character === '[') depth++;
    else if (character === ')' || character === ']') depth--;
    if (character === separator && depth === 0) { parts.push(current); current = ''; }
    else current += character;
  }
  parts.push(current);
  return parts.map((part) => part.trim()).filter(Boolean);
}

const subjectOf = (selector) => splitTopLevel(selector.replace(/\s*([>+~])\s*/g, ' '), ' ').pop() || '';
const withoutArguments = (compound) => compound.replace(/\((?:[^()]|\([^()]*\))*\)/g, '');

// BEM: the element (after "__") names the thing, else the block does; "space-between-buttons__title" is a title.
function namesButton(className) {
  const thing = className.split('__').pop().split('--')[0];
  const words = thing.split(/[-_]/);
  return words.some((word) => BUTTON_WORD.test(word)) && !PART_AROUND_BUTTON.test(words[words.length - 1]);
}

function isHandRolledButton(selector) {
  const subject = withoutArguments(subjectOf(selector));
  if (/^aha-button\b/i.test(subject)) return false;
  const classes = [...subject.matchAll(/\.([\w-]+)/g)].map((match) => match[1]);
  return classes.some(namesButton) || /^button(?![\w-])/i.test(subject) || /\[role=["']?button["']?\]/i.test(subject);
}

const targetsDsButton = (selector) => /^aha-button(?![\w-])/i.test(subjectOf(selector));

function declarationsOf(body) {
  return splitTopLevel(body, ';').map((declaration) => {
    const colon = declaration.indexOf(':');
    if (colon < 0) return null;
    return { property: declaration.slice(0, colon).trim().toLowerCase(), value: declaration.slice(colon + 1).replace(/!important/i, '').trim() };
  }).filter((declaration) => declaration && !declaration.property.startsWith('--'));
}

const paints = ({ property, value }) => PAINT_PROPERTY.test(property) && !RESET_VALUE.test(value) && !/\btransparent\b|\bnone\b/i.test(value);
const restyles = ({ property, value }) => (PAINT_PROPERTY.test(property) || SHAPE_PROPERTY.test(property)) && !/^(?:inherit|initial|unset|revert)$/i.test(value);

/* Returns Map<lineIndex, finding[]>, the line being where the rule's selector starts. */
export function buttonStyleFindingsByLine(text) {
  const source = blankComments(text);
  const byLine = new Map();
  for (const match of source.matchAll(/([^{};]*)\{([^{}]*)\}/g)) {
    const selectorList = cssSelectorList(match[1]);
    if (!selectorList) continue;
    const selectors = splitTopLevel(selectorList, ',');
    const declarations = declarationsOf(match[2]);
    const handRolled = selectors.filter(isHandRolledButton);
    const painted = declarations.filter(paints).map((declaration) => declaration.property);
    const dsButton = selectors.filter(targetsDsButton);
    const restyled = declarations.filter(restyles).map((declaration) => declaration.property);
    const findings = [];
    if (handRolled.length && painted.length)
      findings.push({ rule: 'hand-rolled-button', severity: 'hard', message: `"${handRolled[0]}" paints its own button (${[...new Set(painted)].join(', ')}): every button, call to action and header Log in / Sign up is <aha-button variant size> (href for a link, type="submit" in a form), themed only through --aha-button-* tokens on a container — ${BUTTON_DOC}` });
    if (dsButton.length && restyled.length)
      findings.push({ rule: 'restyled-button', severity: 'hard', message: `"${dsButton[0]}" overrides <aha-button>'s ${[...new Set(restyled)].join(', ')}: a DS button is never re-coloured, re-hovered, re-bordered or re-sized from outside — pick its variant and size, or set --aha-button-* tokens on a container (flex, width, margin and order are fine) — ${BUTTON_DOC}` });
    if (!findings.length) continue;
    const selectorStart = match.index + match[1].lastIndexOf(selectorList);
    const line = source.slice(0, selectorStart).split('\n').length - 1;
    byLine.set(line, [...(byLine.get(line) || []), ...findings]);
  }
  return byLine;
}
