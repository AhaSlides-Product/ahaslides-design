/*
 * screen-lint answer-colour rules (colour rules section 11). lib/screen-lint.js calls
 * `answerColourFindings(lines, index)` once per line; `lines` gives the rule's selector context.
 */
export const ANSWER_RULE_GROUPS = {
  'answer-colour': ['answer-colour-text', 'answer-colour-context'],
};

const COLOUR_RULES_DOC = 'https://design.ahaslides.io/colour-rules.md';
const COMMENT_LINE = /^\s*(?:\/\/|\/\*|\*(?:\s|\/|$)|<!--(?:(?!-->).)*(?:-->\s*)?$)/;
const ANSWER_TOKEN_USE = /var\(\s*--aha-answer-[a-z0-9-]+/i;
const ANSWER_TOKEN_NAME = /--aha-answer-[a-z0-9-]+/gi;
const TEXT_COLOUR_PROPERTY = /(?<![\w-])(?:color|-webkit-text-fill-color|caret-color|caretColor|WebkitTextFillColor|webkitTextFillColor)["']?\s*:\s*[^;}]*var\(\s*--aha-answer-/;
const TAILWIND_TEXT_COLOUR = /(?<![\w-])(?:text|caret)-\[(?:color:)?var\(\s*--aha-answer-/;
const ANSWER_MARKER = /(?<![a-z])(?:correct|wrong|incorrect|answer|result|tick(?!et)|cross(?!word|fade|hair|over)|reveal|verdict|score)/i;

const OPEN_TAG_LOOKBACK = 10;

function openTagStart(lines, index) {
  for (let start = index; start >= Math.max(0, index - OPEN_TAG_LOOKBACK); start--) {
    const line = lines[start].replace(/=>/g, '');
    const afterLastClose = line.slice(line.lastIndexOf('>') + 1);
    if (/<[a-z]/i.test(start === index ? line : afterLastClose)) return start;
    if (start < index && line.includes('>')) return -1;
  }
  return -1;
}

function contextStart(lines, index) {
  const tagStart = openTagStart(lines, index);
  if (tagStart >= 0) return tagStart;
  let start = index;
  while (start > 0 && !lines[start].includes('{')) start--;
  while (start > 0 && lines[start - 1].trimEnd().endsWith(',')) start--;
  return start;
}

function selectorContext(lines, index) {
  return lines.slice(contextStart(lines, index), index + 1).join('\n').replace(/<!--.*?-->|\/\*.*?\*\//gs, ' ').replace(ANSWER_TOKEN_NAME, ' ').replace(/([a-z])([A-Z])/g, '$1 $2');
}

export function answerColourFindings(lines, index) {
  const raw = lines[index];
  if (COMMENT_LINE.test(raw) || !ANSWER_TOKEN_USE.test(raw)) return [];
  const findings = [];
  if (TEXT_COLOUR_PROPERTY.test(raw) || TAILWIND_TEXT_COLOUR.test(raw))
    findings.push({ rule: 'answer-colour-text', severity: 'hard', message: `an --aha-answer-* token as a text colour — text is never green or red, it stays the default ink (colour rule 11.2, ${COLOUR_RULES_DOC})` });
  if (!ANSWER_MARKER.test(selectorContext(lines, index)))
    findings.push({ rule: 'answer-colour-context', severity: 'hard', message: `an --aha-answer-* token on something that is not an answer, a correct or wrong mark or a result — green and red mark correct and wrong answers and nothing else: not status, errors, buttons or decoration (colour rule 11.1, ${COLOUR_RULES_DOC}). Name the element for what it marks, or justify with ds-lint-allow: answer-colour (why)` });
  return findings;
}
