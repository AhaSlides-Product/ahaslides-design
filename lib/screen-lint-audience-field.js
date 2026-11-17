// A participant's text fields are the large 48px size; a developer's request is the only other size.

export const AUDIENCE_FIELD_RULES = ['audience-field-size'];

const FIELD_TAGS = ['aha-input', 'aha-counted-input', 'aha-counted-textarea', 'aha-select', 'aha-autocomplete'];
const FIELD_ALTERNATION = FIELD_TAGS.join('|');
const FIELD_MARKUP = new RegExp(`<(${FIELD_ALTERNATION})(?![\\w-])`, 'gi');
const FIELD_FACTORY = new RegExp(`(?<![\\w$])(?:el|elem|element|h|tag|node|dom|createEl|createElement)\\(\\s*(?:[\\w$.]+\\s*,\\s*|["'][^"']*["']\\s*,\\s*)?["'](${FIELD_ALTERNATION})["']`, 'gi');
const LARGE_ATTRIBUTE = /(?<![\w-])size\s*=\s*\\?["']?(?:large|lg)(?![\w-])/i;
const LARGE_PROPERTY = /(?<![\w$-])["']?size["']?\s*:\s*["'](?:large|lg)["']/i;
const COMMENT_LINE = /^\s*(?:\/\/|\/\*|\*(?:\s|\/|$)|<!--(?:(?!-->).)*(?:-->\s*)?$)/;
const CALL_LENGTH_LIMIT = 1500;
const TAG_LENGTH_LIMIT = 1500;
const DOC = 'https://design.ahaslides.io/audience/index.html';

const escapeForRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const largeSetOn = (name) => new RegExp(`(?<![\\w$])${escapeForRegExp(name)}\\s*(?:\\.setAttribute\\(\\s*["']size["']\\s*,\\s*|\\.size\\s*=\\s*)["'](?:large|lg)["']`);

const message = (tag) =>
  `<${tag}> on the audience phone without size="lg" — every participant text field is the large 48px size with 16px text (audience C5; ${DOC}): <aha-counted-input size="lg"> or <aha-counted-textarea size="lg"> in <aha-audience-field>. Only when the slide-type developer explicitly asked for another size: ds-lint-allow: size (developer request: <their words>)`;

function markupEnd(text, from) {
  let quote = '';
  const stop = Math.min(text.length, from + TAG_LENGTH_LIMIT);
  for (let index = from; index < stop; index++) {
    const character = text[index];
    if (quote) { if (character === quote) quote = ''; }
    else if (character === '"' || character === "'") quote = character;
    else if (character === '>' && text[index - 1] !== '=') return index;
  }
  return stop;
}

function callEnd(text, open) {
  let depth = 0;
  let quote = '';
  const stop = Math.min(text.length, open + CALL_LENGTH_LIMIT);
  for (let index = open; index < stop; index++) {
    const character = text[index];
    if (quote) { if (character === '\\') index++; else if (character === quote) quote = ''; }
    else if (character === '"' || character === "'" || character === '`') quote = character;
    else if (character === '(') depth++;
    else if (character === ')' && --depth === 0) return index;
  }
  return stop;
}

export function audienceFieldFindings(text) {
  const findings = [];
  const lineStarts = [0];
  for (let index = 0; index < text.length; index++) if (text[index] === '\n') lineStarts.push(index + 1);
  const lineAt = (offset) => {
    let low = 0, high = lineStarts.length - 1;
    while (low < high) {
      const middle = (low + high + 1) >> 1;
      if (lineStarts[middle] <= offset) low = middle; else high = middle - 1;
    }
    return low + 1;
  };
  const commented = (offset) => {
    const start = lineStarts[lineAt(offset) - 1];
    const end = text.indexOf('\n', offset);
    return COMMENT_LINE.test(text.slice(start, end < 0 ? text.length : end));
  };
  const seen = new Set();
  const report = (tag, start, end) => {
    if (seen.has(start) || commented(start)) return;
    seen.add(start);
    findings.push({ rule: 'audience-field-size', line: lineAt(start), endLine: lineAt(end), message: message(tag) });
  };

  for (const match of text.matchAll(FIELD_MARKUP)) {
    const end = markupEnd(text, match.index);
    if (!LARGE_ATTRIBUTE.test(text.slice(match.index, end))) report(match[1].toLowerCase(), match.index, end);
  }

  for (const match of text.matchAll(FIELD_FACTORY)) {
    const open = text.indexOf('(', match.index);
    const end = callEnd(text, open);
    if (LARGE_PROPERTY.test(text.slice(open, end + 1))) continue;
    const assigned = text.slice(Math.max(0, match.index - 80), match.index).match(/([A-Za-z_$][\w$]*)\s*=\s*(?:document\.)?$/);
    if (assigned && largeSetOn(assigned[1]).test(text)) continue;
    report(match[1].toLowerCase(), match.index, end);
  }
  return findings;
}

export const isAudienceFieldPage = (surface, path = '') =>
  surface !== 'settings' && surface !== 'website'
  && (surface === 'audience' || /^self-paced-view/i.test(String(path).split(/[\\/]/).pop()));
