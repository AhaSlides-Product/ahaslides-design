/*
 * screen-lint hand-rolled-button rule — every button is <aha-button>. Pure like the core (no fs,
 * no process, no console); lib/screen-lint.js calls `handRolledButtonFindings(text)` once per file
 * because a CSS rule spans lines. It reads CSS rule blocks wherever they sit (a .css file, a <style>
 * block, a component's style string) and reports two things:
 *   1. a class or element styled into a button: a button, link, [role=button] or a class named
 *      button / btn / cta given a fill plus a button shape, or a fill/border/shadow on its states;
 *   2. a restyled DS Button: a rule on aha-button, aha-button::part(…) or .aha-button that sets a
 *      look property (colour, fill, border, shadow, height, padding, type), any :hover/:active/:focus
 *      rule on it, or a --aha-button-* token redefined anywhere but the :root / :host token sheet.
 * Layout on <aha-button> (margin, flex, width, order, align-self) is allowed.
 */

export const BUTTON_RULE_GROUPS = { 'hand-rolled-button': ['hand-rolled-button'] };

const BUTTON_DOC = 'https://design.ahaslides.io/button/index.html';
const HAND_ROLLED_MESSAGE = (selector) => `"${selector}" draws its own button — every button, header and CTA buttons in vendored marketing blocks included, is <aha-button variant="…" size="…"> (href for a link). Delete the bespoke button CSS (${BUTTON_DOC}); a control the DS does not ship keeps it with ds-lint-allow: hand-rolled-button (why)`;
const RESTYLED_MESSAGE = (selector) => `"${selector}" restyles the DS Button — never re-colour, re-size or re-hover <aha-button>; pick the variant and size that fit (${BUTTON_DOC}). Only layout (margin, flex, width, order, align-self) may be set on it`;
const TOKEN_MESSAGE = (token) => `${token} redefined — the --aha-button-* tokens belong to the DS; re-theming them re-colours every button inside. Pick a Button variant, or keep a DS-owned surface with ds-lint-allow: hand-rolled-button (why)`;

const BUTTON_CLASS_TOKEN = /(?:^|[-_])(?:button|btn|cta)(?:$|[-_])/i;
const STATE_PSEUDO = /:(?:hover|active|focus|focus-visible|focus-within)\b/i;
const RESET_VALUE = /^(?:inherit|initial|unset|revert|revert-layer)$/i;
const NO_FILL = /^(?:none|transparent|inherit|initial|unset|revert|0)$/i;
const NO_SHAPE = /^(?:none|0|0px|auto|inherit|initial|unset|revert|0 0|0px 0px)$/i;
const DS_BUTTON_LOOK = /^(?:color|background(?:-[a-z]+)?|border(?:-[a-z-]+)?|box-shadow|outline(?:-[a-z]+)?|(?:min-|max-)?height|padding(?:-[a-z-]+)?|font(?:-[a-z]+)?|line-height|letter-spacing|text-decoration(?:-[a-z]+)?|text-transform|opacity|filter)$/i;
const BUTTON_TOKEN_DECLARATION = /(?<![\w-])(--aha-button-[\w-]+)\s*:(?!:)/g;
const SELECTOR_CHARACTERS = /^[\w\s.#:,>+~*\-&%\\]+$/;
const TOKEN_HOME_SELECTOR = /^(?::root|:host)(?:\s*,\s*(?::root|:host))*$/i;

const blankComments = (text) => text.replace(/\/\*[^]*?\*\//g, (comment) => comment.replace(/[^\n]/g, ' '));
const lineAt = (text, index) => text.slice(0, index).split('\n').length;

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

// The selector is what sits on the line(s) right before the brace: a trailing comma joins the line above.
function selectorBefore(text, braceIndex) {
  const lines = text.slice(0, braceIndex).split('\n');
  const kept = [lines.pop()];
  while (lines.length && /,\s*$/.test(lines[lines.length - 1])) kept.unshift(lines.pop());
  const selector = kept.join(' ').replace(/^[^]*<\/?[a-z][^>]*>/i, '').replace(/^[^]*[{};]/, '').trim();
  return { selector, lineCount: kept.length };
}

const withoutBracketsAndArguments = (selector) => selector.replace(/\[[^\]]*\]/g, 'x').replace(/\([^()]*\)/g, '').replace(/\([^()]*\)/g, '');
const looksLikeSelector = (selector) => selector && !selector.startsWith('@') && SELECTOR_CHARACTERS.test(withoutBracketsAndArguments(selector));

function subjectOf(part) {
  const compounds = part.replace(/\([^()]*\)/g, (inner) => inner.replace(/[\s>+~]/g, '')).trim().split(/\s*[\s>+~]\s*/);
  return compounds[compounds.length - 1] || '';
}

function classifySubject(subject) {
  const bare = subject.replace(/::?[a-z-]+(?:\([^)]*\))?/gi, '');
  if (/^aha-button\b|\.aha-button(?![\w-])/i.test(bare) || /^aha-button\b/i.test(subject)) return 'ds-button';
  if (/^:host\b/i.test(subject)) return 'none';
  if (/^button\b|\[role=["']?button["']?\]|^input\[type=["']?(?:submit|button|reset)["']?\]/i.test(bare)) return 'button';
  for (const token of bare.match(/[.#][\w-]+/g) || [])
    if (BUTTON_CLASS_TOKEN.test(token.slice(1))) return 'button';
  if (/^a\b/i.test(bare)) return 'link';
  return 'none';
}

const hasFill = (declarations) => ['background', 'background-color'].some((property) => declarations.has(property) && !NO_FILL.test(declarations.get(property)));
const hasShape = (declarations) => ['border', 'border-radius', 'box-shadow', 'height', 'min-height', 'padding'].some((property) => declarations.has(property) && !NO_SHAPE.test(declarations.get(property)));
const hasEdge = (declarations) => ['border', 'border-color', 'box-shadow'].some((property) => declarations.has(property) && !NO_SHAPE.test(declarations.get(property)));
const hasLinkButtonShape = (declarations) => ['border-radius', 'box-shadow', 'height', 'min-height'].some((property) => declarations.has(property) && !NO_SHAPE.test(declarations.get(property)));

/**
 * Hand-rolled and restyled buttons in one source file.
 * Returns [{ line, endLine, rule: 'hand-rolled-button', message, severity: 'hard' }]; the caller
 * drops a finding when any line from `line` to `endLine` carries ds-lint-allow: hand-rolled-button (why).
 */
export function handRolledButtonFindings(source) {
  const text = blankComments(String(source));
  const findings = [];
  const tokenHomeBlocks = [];
  for (const match of text.matchAll(/\{([^{}]*)\}/g)) {
    const { selector, lineCount } = selectorBefore(text, match.index);
    if (TOKEN_HOME_SELECTOR.test(selector)) tokenHomeBlocks.push([match.index, match.index + match[0].length]);
    if (!looksLikeSelector(selector)) continue;
    const declarations = declarationsOf(match[1]);
    if (!declarations.size) continue;
    const line = lineAt(text, match.index) - lineCount + 1;
    const endLine = lineAt(text, match.index + match[0].length);
    for (const part of selector.split(',').map((piece) => piece.trim()).filter(Boolean)) {
      const subject = subjectOf(part);
      const kind = classifySubject(subject);
      const isState = STATE_PSEUDO.test(subject);
      let message = '';
      if (kind === 'ds-button') {
        if (isState || [...declarations].some(([property, value]) => DS_BUTTON_LOOK.test(property) && !RESET_VALUE.test(value))) message = RESTYLED_MESSAGE(part);
      } else if (kind === 'button') {
        if ((hasFill(declarations) && hasShape(declarations)) || (isState && (hasFill(declarations) || hasEdge(declarations)))) message = HAND_ROLLED_MESSAGE(part);
      } else if (kind === 'link') {
        if (hasFill(declarations) && hasLinkButtonShape(declarations)) message = HAND_ROLLED_MESSAGE(part);
      }
      if (message) { findings.push({ line, endLine, rule: 'hand-rolled-button', message, severity: 'hard' }); break; }
    }
  }
  for (const match of text.matchAll(BUTTON_TOKEN_DECLARATION)) {
    // :root / :host is where the DS token sheet itself defines them, and a vendored copy of it must pass.
    if (tokenHomeBlocks.some(([start, end]) => match.index > start && match.index < end)) continue;
    const line = lineAt(text, match.index);
    findings.push({ line, endLine: line, rule: 'hand-rolled-button', message: TOKEN_MESSAGE(match[1]), severity: 'hard' });
  }
  return findings;
}
