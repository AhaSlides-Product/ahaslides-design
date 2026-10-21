/*
 * screen-lint hand-rolled-button rule — every button is <aha-button>. Pure (no fs,
 * no process, no console) and run once per whole file
 * because a CSS rule spans lines. It reads CSS rule blocks wherever they sit (a .css file, a <style>
 * block, a component's style string) and reports two things:
 *   1. a class or element styled into a button: a button, link, [role=button] or a class named
 *      button / btn / cta given a fill plus a button shape, or a fill/border/shadow on its states;
 *   2. a restyled DS Button: a rule on aha-button, aha-button::part(…) or .aha-button that sets a
 *      look property (colour, fill, border, shadow, height, padding, type), any :hover/:active/:focus
 *      rule on it, or a --aha-button-* token redefined anywhere but a :root / :host token sheet
 *      (theme-scoped ones such as :root[data-theme=dark] or :host(.dark) included, in or out of @media).
 * Layout on <aha-button> (margin, flex, width, order, align-self) is allowed.
 */

export const BUTTON_RULE_GROUPS = { 'hand-rolled-button': ['hand-rolled-button'] };

const BUTTON_DOC = 'https://design.ahaslides.io/button/index.html';
const HAND_ROLLED_MESSAGE = (selector) => `"${selector}" draws its own button — every button, header and CTA buttons in vendored marketing blocks included, is <aha-button variant="…" size="…"> (href for a link). Delete the bespoke button CSS (${BUTTON_DOC}); a control the DS does not ship keeps it with ds-lint-allow: hand-rolled-button (why)`;
const RESTYLED_MESSAGE = (selector) => `"${selector}" restyles the DS Button — never re-colour, re-size or re-hover <aha-button>; pick the variant and size that fit (${BUTTON_DOC}). Only layout (margin, flex, width, order, align-self) may be set on it`;
const TOKEN_MESSAGE = (token) => `${token} redefined — the --aha-button-* tokens belong to the DS; re-theming them re-colours every button inside. Pick a Button variant, or keep a DS-owned surface with ds-lint-allow: hand-rolled-button (why)`;

const BUTTON_WORDS = new Set(['button', 'btn', 'cta']);
const CONTAINER_WORDS = new Set(['group', 'groups', 'wrap', 'wrapper', 'row', 'rows', 'bar', 'section', 'band', 'container', 'list', 'area', 'banner', 'panel', 'box', 'grid', 'stack', 'block', 'strip', 'holder', 'region', 'zone', 'card', 'set', 'content', 'inner', 'title', 'heading', 'text', 'copy', 'image', 'img', 'form', 'label', 'icon', 'hero', 'description', 'subtitle', 'header', 'body']);
const DECORATIVE_PSEUDO_ELEMENT = /::?(?:before|after)\b/i;
const STATE_PSEUDO = /:(?:hover|active|focus|focus-visible|focus-within)\b/i;
const RESET_VALUE = /^(?:inherit|initial|unset|revert|revert-layer)$/i;
const NO_FILL = /^(?:none|transparent|inherit|initial|unset|revert|0)$/i;
const NO_SHAPE = /^(?:none|0|0px|auto|inherit|initial|unset|revert|0 0|0px 0px)$/i;
const DS_BUTTON_LOOK = /^(?:color|background(?:-[a-z]+)?|border(?:-[a-z-]+)?|box-shadow|outline(?:-[a-z]+)?|(?:min-|max-)?height|padding(?:-[a-z-]+)?|font(?:-[a-z]+)?|line-height|letter-spacing|text-decoration(?:-[a-z]+)?|text-transform|opacity|filter)$/i;
const BUTTON_TOKEN_DECLARATION = /(?<![\w-])(--aha-button-[\w-]+)\s*:(?!:)/g;
const SELECTOR_CHARACTERS = /^[\w\s.#:,>+~*\-&%\\]+$/;
const TOKEN_SHEET_COMPOUND = String.raw`(?::root|:host(?:\([^()]*\))?)(?:\[[^[\]]*\]|\.[\w-]+|:not\([^()]*\))*`;
const TOKEN_HOME_SELECTOR = new RegExp(`^${TOKEN_SHEET_COMPOUND}(?:\\s*,\\s*${TOKEN_SHEET_COMPOUND})*$`, 'i');

function blankComments(text) {
  let blanked = '';
  let cursor = 0;
  for (let start = text.indexOf('/*'); start >= 0; start = text.indexOf('/*', cursor)) {
    const close = text.indexOf('*/', start + 2);
    const end = close < 0 ? text.length : close + 2;
    blanked += text.slice(cursor, start) + text.slice(start, end).replace(/[^\n]/g, ' ');
    cursor = end;
  }
  return blanked + text.slice(cursor);
}
function lineLocator(text) {
  const lineStarts = [0];
  for (let index = text.indexOf('\n'); index >= 0; index = text.indexOf('\n', index + 1)) lineStarts.push(index + 1);
  return (index) => {
    let low = 0;
    let high = lineStarts.length - 1;
    while (low < high) {
      const middle = (low + high + 1) >> 1;
      if (lineStarts[middle] <= index) low = middle; else high = middle - 1;
    }
    return low + 1;
  };
}

function declarationsOf(body) {
  const declarations = new Map();
  for (const chunk of body.split(';')) {
    const colon = chunk.indexOf(':');
    if (colon < 0) continue;
    const property = chunk.slice(0, colon).trim().toLowerCase();
    const value = chunk.slice(colon + 1).replace(/!important/i, '').trim();
    if (/^-?-?[a-z][a-z-]*$/.test(property) && value) declarations.set(property, value);
  }
  return declarations;
}

// One backward pass, so a line of unclosed "<a<a<a" cannot make it quadratic.
function endOfLastTag(text) {
  let nextClose = -1;
  for (let index = text.length - 1; index >= 0; index--) {
    if (text[index] === '>') nextClose = index;
    else if (text[index] === '<') {
      if (nextClose > index && /^<\/?[a-z]/i.test(text.slice(index, index + 3))) return nextClose + 1;
      nextClose = -1;
    }
  }
  return 0;
}

// The selector is what sits on the line(s) right before the brace: a trailing comma joins the line above.
function selectorOf(prelude) {
  const lines = prelude.split('\n');
  const kept = [lines.pop()];
  while (lines.length && /,\s*$/.test(lines[lines.length - 1])) kept.push(lines.pop());
  let selector = kept.reverse().join(' ');
  selector = selector.slice(endOfLastTag(selector));
  return { selector: selector.trim(), lineCount: kept.length };
}

const withoutBracketsAndArguments = (selector) => selector.replace(/\[[^[\]]*\]/g, 'x').replace(/\([^()]*\)/g, '').replace(/\([^()]*\)/g, '');
const looksLikeSelector = (selector) => selector && !selector.startsWith('@') && SELECTOR_CHARACTERS.test(withoutBracketsAndArguments(selector));

function subjectOf(part) {
  const compounds = part.replace(/\([^()]*\)/g, (inner) => inner.replace(/[\s>+~]/g, '')).trim().split(/\s*[\s>+~]\s*/);
  return compounds[compounds.length - 1] || '';
}

// "signup-btn", "aha-header__button--primary" and "ctaButton" name a button; "btn-group" and "cta-section" name what holds one.
function isButtonName(name) {
  const words = name.split(/[-_]+|(?<=[a-z0-9])(?=[A-Z])/).map((word) => word.toLowerCase());
  return words.some((word, index) => BUTTON_WORDS.has(word) && !CONTAINER_WORDS.has(words[index + 1]));
}

const namesContainer = (name) => name.split(/[-_]+|(?<=[a-z0-9])(?=[A-Z])/).some((word) => CONTAINER_WORDS.has(word.toLowerCase()));

function classifySubject(subject) {
  const bare = subject.replace(/::?[a-z-]+(?:\([^()]*\))?/gi, '');
  if (/^aha-button(?![\w-])|\.aha-button(?![\w-])/i.test(bare) || /^aha-button(?![\w-])/i.test(subject)) return 'ds-button';
  if (/^:host\b/i.test(subject)) return 'none';
  if (DECORATIVE_PSEUDO_ELEMENT.test(subject)) return 'none';
  if (/^button(?![\w-])|\[role=["']?button["']?\]|^input\[type=["']?(?:submit|button|reset)["']?\]/i.test(bare)) return 'button';
  for (const token of bare.match(/[.#][\w-]+/g) || [])
    if (isButtonName(token.slice(1))) return 'button';
  if (/^a(?![\w-])/i.test(bare) && !(bare.match(/\.[\w-]+/g) || []).some((token) => namesContainer(token.slice(1)))) return 'link';
  return 'none';
}

const hasFill = (declarations) => ['background', 'background-color'].some((property) => declarations.has(property) && !NO_FILL.test(declarations.get(property)));
const hasShape = (declarations) => ['border', 'border-radius', 'box-shadow', 'height', 'min-height', 'padding'].some((property) => declarations.has(property) && !NO_SHAPE.test(declarations.get(property)));
const hasEdge = (declarations) => ['border', 'border-color', 'box-shadow'].some((property) => declarations.has(property) && !NO_SHAPE.test(declarations.get(property)));
const hasLinkButtonShape = (declarations) => ['border-radius', 'box-shadow', 'height', 'min-height'].some((property) => declarations.has(property) && !NO_SHAPE.test(declarations.get(property)));

const NESTED_SELECTOR_LIMIT = 64;
// Only each compound's subject is classified, so a parent is carried as its subjects and the list is capped.
function resolveNesting(selector, parentSubjects) {
  const parts = selector.split(',').map((piece) => piece.trim()).filter(Boolean);
  if (!parentSubjects.length) return parts;
  const resolved = new Set();
  for (const part of parts) {
    if (!part.includes('&')) resolved.add(part);
    else for (const parent of parentSubjects) resolved.add(part.replaceAll('&', parent));
    if (resolved.size >= NESTED_SELECTOR_LIMIT) break;
  }
  return [...resolved].slice(0, NESTED_SELECTOR_LIMIT);
}

function findingFor(selectorParts, declarations) {
  for (const part of selectorParts) {
    const subject = subjectOf(part);
    const kind = classifySubject(subject);
    const isState = STATE_PSEUDO.test(subject);
    if (kind === 'ds-button') {
      if (isState || [...declarations].some(([property, value]) => DS_BUTTON_LOOK.test(property) && !RESET_VALUE.test(value))) return RESTYLED_MESSAGE(part);
    } else if (kind === 'button') {
      if ((hasFill(declarations) && hasShape(declarations)) || (isState && (hasFill(declarations) || hasEdge(declarations)))) return HAND_ROLLED_MESSAGE(part);
    } else if (kind === 'link') {
      if (hasFill(declarations) && hasLinkButtonShape(declarations)) return HAND_ROLLED_MESSAGE(part);
    }
  }
  return '';
}

/**
 * Hand-rolled and restyled buttons in one source file.
 * Returns [{ line, endLine, rule: 'hand-rolled-button', message, severity: 'hard' }]; the caller
 * drops a finding when any line from `line` to `endLine` carries ds-lint-allow: hand-rolled-button (why).
 */
export function handRolledButtonFindings(source) {
  const text = blankComments(String(source));
  const lineAt = lineLocator(text);
  const findings = [];
  const tokenHomeBlocks = [];
  const open = [];
  let segmentStart = 0;
  for (let index = 0; index < text.length; index++) {
    const character = text[index];
    if (character !== '{' && character !== '}' && character !== ';') continue;
    const segment = text.slice(segmentStart, index);
    segmentStart = index + 1;
    if (character === '{') {
      const { selector, lineCount } = selectorOf(segment);
      const parentSubjects = open.length ? open[open.length - 1].subjects : [];
      const isStyleRule = looksLikeSelector(selector);
      const resolved = isStyleRule ? resolveNesting(selector, parentSubjects) : [];
      const subjects = isStyleRule ? resolved.map(subjectOf) : parentSubjects;
      open.push({ selector, isStyleRule, resolved, subjects, start: index, line: lineAt(index) - lineCount + 1, body: [] });
      continue;
    }
    const block = open[open.length - 1];
    if (!block) continue;
    block.body.push(segment);
    if (character === ';') continue;
    open.pop();
    if (TOKEN_HOME_SELECTOR.test(block.selector)) tokenHomeBlocks.push([block.start, index]);
    if (!block.isStyleRule) continue;
    const declarations = declarationsOf(block.body.join(';'));
    if (!declarations.size) continue;
    const message = findingFor(block.resolved, declarations);
    if (message) findings.push({ line: block.line, endLine: lineAt(index), rule: 'hand-rolled-button', message, severity: 'hard' });
  }
  findings.sort((first, second) => first.line - second.line);
  tokenHomeBlocks.sort((first, second) => first[0] - second[0]);
  let home = 0;
  for (const match of text.matchAll(BUTTON_TOKEN_DECLARATION)) {
    while (home < tokenHomeBlocks.length && tokenHomeBlocks[home][1] < match.index) home++;
    // :root / :host (theme-scoped too) is where the DS token sheet defines them, and a vendored copy must pass.
    if (home < tokenHomeBlocks.length && tokenHomeBlocks[home][0] < match.index) continue;
    const line = lineAt(match.index);
    findings.push({ line, endLine: line, rule: 'hand-rolled-button', message: TOKEN_MESSAGE(match[1]), severity: 'hard' });
  }
  return findings;
}
