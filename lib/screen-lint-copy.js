/*
 * screen-lint copy rules - the zero-interpretation subset of UX writing (guidelines/ux-writing.json).
 * Pure like the core (no fs, no process, no console). `copyFindings(source, path)` returns
 * [{ line, rule, message }] for user-visible UI strings only: HTML text nodes, a short list of
 * user-facing attributes, and string literals under UI-text keys in scripts. Comments, CSS, URLs,
 * identifiers, <code>, <pre> and <kbd> are never scanned.
 */

export const COPY_RULE_GROUPS = {
  copy: ['no-dash-punctuation', 'vague-error-copy', 'title-case-slide-name'],
};

const GUIDE = 'https://design.ahaslides.io/ux-writing/index.html';

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

const ATTRIBUTE = /([^\s"'<>\/=]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
const MARKUP = /<!--|<\/?([a-zA-Z][\w-]*)((?:"[^"]*"|'[^']*'|[^>"'])*)(>|$)/g;

const blankComments = (script) =>
  script.replace(/\/\*[^]*?\*\//g, (m) => m.replace(/[^\n]/g, ' ')).replace(/^([ \t]*)\/\/.*$/gm, (_, indent) => indent);

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
    const skipStack = [];
    let cursor = 0;
    const emitText = (end) => {
      if (skipStack.length === 0 && end > cursor) scanText(html.slice(cursor, end), firstLine + lineAt(html, cursor));
    };
    MARKUP.lastIndex = 0;
    let match;
    while ((match = MARKUP.exec(html))) {
      if (match[0] === '<!--') {
        emitText(match.index);
        const close = html.indexOf('-->', match.index + 4);
        cursor = close === -1 ? html.length : close + 3;
        MARKUP.lastIndex = cursor;
        continue;
      }
      emitText(match.index);
      const name = match[1].toLowerCase();
      const closing = match[0].startsWith('</');
      const selfClosing = /\/\s*$/.test(match[2]);
      if (!closing) {
        for (const attr of match[2].matchAll(ATTRIBUTE)) {
          if (!TEXT_ATTRIBUTES.has(attr[1].toLowerCase())) continue;
          const value = attr[2] ?? attr[3];
          const valueStart = match.index + match[0].indexOf(attr[0]) + attr[0].indexOf(value);
          scanText(value, firstLine + lineAt(html, valueStart));
        }
      }
      if (SKIPPED_ELEMENTS.has(name) && !selfClosing) {
        if (closing) skipStack.pop();
        else if (name === 'script' || name === 'style') {
          const closeTag = html.toLowerCase().indexOf(`</${name}`, MARKUP.lastIndex);
          const bodyEnd = closeTag === -1 ? html.length : closeTag;
          if (name === 'script') scanScript(html.slice(MARKUP.lastIndex, bodyEnd), firstLine + lineAt(html, MARKUP.lastIndex));
          MARKUP.lastIndex = bodyEnd;
        } else skipStack.push(name);
      }
      cursor = MARKUP.lastIndex;
    }
    emitText(html.length);
  }

  if (SCRIPT_PATH.test(path)) scanScript(source, 0);
  else scanHtml(source, 0);
  return found;
}
