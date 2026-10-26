/*
 * screen-lint copy rules - the zero-interpretation subset of UX writing (guidelines/ux-writing.json).
 * Pure like the core (no fs, no process, no console). `copyFindings(source, path)` returns
 * [{ line, rule, message }] for user-visible UI strings only: HTML text nodes, a short list of
 * user-facing attributes, and string literals under UI-text keys in scripts. Comments, CSS, URLs,
 * identifiers, <code>, <pre> and <kbd> are never scanned.
 */

export const COPY_RULE_GROUPS = {
  copy: ['no-dash-punctuation', 'vague-error-copy', 'title-case-slide-name', 'retired-wording'],
};

const GUIDE = 'https://design.ahaslides.io/ux-writing/index.html';
const VOICE_RULES = 'https://design.ahaslides.io/voice-rules.md';

const COPY_RULES = [
  {
    rule: 'no-dash-punctuation',
    pattern: /[–—]|&(?:mdash|ndash);|&#(?:8211|8212|x2013|x2014);/gi,
    message: (hit) => `"${hit}" is a dash used as punctuation in UI text (UXW-8). Replace it with a full stop, comma, colon or parentheses, and write a range as "1 to 10" - ${GUIDE}`,
  },
  {
    rule: 'vague-error-copy',
    pattern: /something went wrong|an error occurred|\boops\b|unexpected error|some items could not be loaded/gi,
    message: (hit) => `"${hit}" is vague error copy (UXW-2). Name the object and what happened, then give a next step, for example "Couldn't load your presentations. Check your connection and try again." - ${GUIDE}`,
  },
  {
    rule: 'title-case-slide-name',
    pattern: /\b(?:Multiple Choice|Word Cloud|Open[- ]Ended|Spinner Wheel|Rating Scale)\b/g,
    message: (hit) => `"${hit}" is Title Case (UXW-1). Slide-type names are sentence case: "Multiple choice", "Word cloud", "Open-ended", "Spinner wheel", "Rating scale" - ${GUIDE}`,
  },
  {
    rule: 'retired-wording',
    pattern: /interactive[- ]presentation (?:software|platform)|sleepy (?:meetings|slides)|attention gremlins?/gi,
    message: (hit) => `"${hit}" is retired wording. Describe AhaSlides as "an all-in-one engagement platform for teams and classrooms" or "AhaSlides takes the work out of engagement." - ${VOICE_RULES} (section 14)`,
  },
];

const TEXT_ATTRIBUTES = new Set(['title', 'aria-label', 'aria-description', 'placeholder', 'alt', 'label', 'heading']);
const SKIPPED_ELEMENTS = new Set(['script', 'style', 'code', 'pre', 'kbd', 'samp']);
const SCRIPT_PATH = /\.(?:m?js|cjs|jsx?|tsx?)$/i;

const UI_TEXT_KEY = '(?:label|title|placeholder|text|message|tooltip|description|heading|caption|ariaLabel|alt)';
const JS_STRING = String.raw`(["'\`])((?:\\.|(?!\1)[^\\\n])*)\1`;
const SCRIPT_LITERALS = [
  { pattern: new RegExp(String.raw`(?<![\w$.-])["']?${UI_TEXT_KEY}["']?\s*:\s*${JS_STRING}`, 'g'), group: 2 },
  { pattern: new RegExp(String.raw`\.(?:textContent|innerText|title|placeholder|ariaLabel)\s*=(?!=)\s*${JS_STRING}`, 'g'), group: 2 },
  { pattern: new RegExp(String.raw`setAttribute\(\s*["'](?:title|aria-label|aria-description|placeholder|alt|label)["']\s*,\s*${JS_STRING}`, 'g'), group: 2 },
  { pattern: new RegExp(String.raw`\.innerHTML\s*=(?!=)\s*${JS_STRING}`, 'g'), group: 2, html: true },
];

const isNameStart = (character) => /[a-zA-Z]/.test(character);
const isSpace = (character) => character === ' ' || character === '\t' || character === '\n' || character === '\r' || character === '\f';

const KEYWORDS_BEFORE_REGEX = new Set(['return', 'typeof', 'instanceof', 'in', 'of', 'new', 'delete', 'void', 'throw', 'case', 'do', 'else', 'yield', 'await']);

function slashStartsRegex(script, slashIndex) {
  let index = slashIndex - 1;
  while (index >= 0 && isSpace(script[index])) index--;
  if (index < 0) return true;
  const previous = script[index];
  if ((previous === '+' || previous === '-') && script[index - 1] === previous) return false;
  if (previous === ')' || previous === ']' || previous === '}' || previous === '"' || previous === "'" || previous === '`') return false;
  if (!/[\w$]/.test(previous)) return true;
  const wordEnd = index + 1;
  while (index >= 0 && /[\w$]/.test(script[index])) index--;
  return KEYWORDS_BEFORE_REGEX.has(script.slice(index + 1, wordEnd));
}

function regexLiteralEnd(script, slashIndex) {
  let index = slashIndex + 1;
  let inClass = false;
  while (index < script.length && script[index] !== '\n') {
    const character = script[index];
    if (character === '\\') index++;
    else if (character === '[') inClass = true;
    else if (character === ']') inClass = false;
    else if (character === '/' && !inClass) return index + 1;
    index++;
  }
  return slashIndex + 1;
}

function blankComments(script) {
  const characters = script.split('');
  const blank = (from, to) => { for (let index = from; index < to; index++) if (characters[index] !== '\n') characters[index] = ' '; };
  let index = 0;
  let quote = '';
  while (index < script.length) {
    const character = script[index];
    if (quote) {
      if (character === '\\') index++;
      else if (character === quote || (character === '\n' && quote !== '`')) quote = '';
      index++;
    } else if (character === '"' || character === "'" || character === '`') {
      quote = character;
      index++;
    } else if (script.startsWith('/*', index)) {
      const close = script.indexOf('*/', index + 2);
      const end = close === -1 ? script.length : close + 2;
      blank(index, end);
      index = end;
    } else if (script.startsWith('//', index)) {
      const newline = script.indexOf('\n', index);
      const end = newline === -1 ? script.length : newline;
      blank(index, end);
      index = end;
    } else if (character === '/' && slashStartsRegex(script, index)) {
      index = regexLiteralEnd(script, index);
    } else index++;
  }
  return characters.join('');
}

function readTag(html, start) {
  let index = start + 1;
  const closing = html[index] === '/';
  if (closing) index++;
  if (index >= html.length || !isNameStart(html[index])) return null;
  const nameStart = index;
  while (index < html.length && /[\w-]/.test(html[index])) index++;
  const name = html.slice(nameStart, index).toLowerCase();
  const attributes = [];
  let lastSignificant = '';
  while (index < html.length && html[index] !== '>') {
    if (isSpace(html[index])) { index++; continue; }
    const attributeStart = index;
    while (index < html.length && !isSpace(html[index]) && !'="\'<>/'.includes(html[index])) index++;
    const attributeName = html.slice(attributeStart, index).toLowerCase();
    if (index === attributeStart) { lastSignificant = html[index]; index++; continue; }
    lastSignificant = '';
    let cursor = index;
    while (cursor < html.length && isSpace(html[cursor])) cursor++;
    if (html[cursor] !== '=') continue;
    cursor++;
    while (cursor < html.length && isSpace(html[cursor])) cursor++;
    const quote = html[cursor];
    if (quote !== '"' && quote !== "'") { index = cursor; continue; }
    const close = html.indexOf(quote, cursor + 1);
    const valueEnd = close === -1 ? html.length : close;
    attributes.push({ name: attributeName, value: html.slice(cursor + 1, valueEnd), valueIndex: cursor + 1 });
    index = close === -1 ? html.length : close + 1;
  }
  const selfClosing = lastSignificant === '/';
  return { name, closing, selfClosing, attributes, end: Math.min(index + 1, html.length) };
}

export function copyFindings(source, path = '') {
  const found = [];
  const lineAt = (base, index) => (base.slice(0, index).match(/\n/g) || []).length;

  function scanText(text, line) {
    for (const { rule, pattern, message } of COPY_RULES)
      for (const match of text.matchAll(pattern)) {
        const offset = lineAt(text, match.index);
        found.push({ line: line + offset, rule, message: message(match[0]) });
      }
  }

  function scanScript(script, firstLine) {
    const code = blankComments(script);
    for (const { pattern, group, html } of SCRIPT_LITERALS)
      for (const match of code.matchAll(pattern)) {
        const literalStart = match.index + match[0].indexOf(match[group]);
        const line = firstLine + lineAt(code, literalStart);
        if (html) scanHtml(match[group], line);
        else scanText(match[group], line);
      }
  }

  function scanHtml(html, firstLine) {
    const lowered = html.toLowerCase();
    let skipDepth = 0;
    let cursor = 0;
    const emitText = (end) => {
      if (skipDepth === 0 && end > cursor) scanText(html.slice(cursor, end), firstLine + lineAt(html, cursor));
    };
    let index = html.indexOf('<');
    while (index !== -1) {
      if (html.startsWith('<!--', index)) {
        emitText(index);
        const close = html.indexOf('-->', index + 4);
        cursor = close === -1 ? html.length : close + 3;
        index = html.indexOf('<', cursor);
        continue;
      }
      const tag = readTag(html, index);
      if (!tag) { index = html.indexOf('<', index + 1); continue; }
      emitText(index);
      if (!tag.closing && skipDepth === 0)
        for (const attribute of tag.attributes)
          if (TEXT_ATTRIBUTES.has(attribute.name)) scanText(attribute.value, firstLine + lineAt(html, attribute.valueIndex));
      cursor = tag.end;
      if (SKIPPED_ELEMENTS.has(tag.name) && !tag.selfClosing) {
        if (tag.closing) skipDepth = Math.max(0, skipDepth - 1);
        else if (tag.name === 'script' || tag.name === 'style') {
          const closeTag = lowered.indexOf(`</${tag.name}`, tag.end);
          const bodyEnd = closeTag === -1 ? html.length : closeTag;
          if (tag.name === 'script') scanScript(html.slice(tag.end, bodyEnd), firstLine + lineAt(html, tag.end));
          cursor = bodyEnd;
        } else skipDepth++;
      }
      index = html.indexOf('<', cursor);
    }
    emitText(html.length);
  }

  if (SCRIPT_PATH.test(path)) scanScript(source, 0);
  else scanHtml(source, 0);
  return found;
}
