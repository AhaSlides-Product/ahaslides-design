// A participant's text fields are the large 48px size; a developer's request is the only other size.

export const AUDIENCE_FIELD_RULES = ['audience-field-size'];

const FIELD_TAGS = ['aha-input', 'aha-counted-input', 'aha-counted-textarea', 'aha-select', 'aha-autocomplete'];
const FIELD_ALTERNATION = FIELD_TAGS.join('|');
const FIELD_MARKUP = new RegExp(`<(${FIELD_ALTERNATION})(?![\\w-])`, 'gi');
const FACTORY = String.raw`(?<![\w$])(?:el|elem|element|h|tag|node|dom|createEl|createElement)`;
const FIELD_FACTORY = new RegExp(`${FACTORY}\\(\\s*(?:[\\w$.]+\\s*,\\s*|["'][^"']*["']\\s*,\\s*)?["'](${FIELD_ALTERNATION})["']`, 'gi');
const ATTRIBUTE_SIZE = /(?<![\w$-])(:|v-bind:)?size\s*=\s*(\\*"[^"]*\\*"|\\*'[^']*\\*'|\{(?:[^{}]|\{[^{}]*\})*\}|[^\s>]+)/gi;
const PROPERTY_SIZE = /(?<![\w$-])["']?size["']?\s*:\s*("[^"\n]*"|'[^'\n]*'|`[^`]*`|[^\s,}]+)/gi;
const COMMENT_LINE = /^\s*\/\//;
const SPAN_LIMIT = 1500;
const DOC = 'https://design.ahaslides.io/audience/index.html';

const escapeForRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const message = (tag) =>
  `<${tag}> without size="lg" on a participant page (audience or self-paced-view) — every participant text field is the large 48px size with 16px text (audience C5; ${DOC}): <aha-counted-input size="lg"> or <aha-counted-textarea size="lg"> in <aha-audience-field>. Only when the slide-type developer explicitly asked for another size: ds-lint-allow: size (developer request: <their words>) on the line of the element, or on the line of its setAttribute / .size when the size is set there`;

// 'ok' = a large literal, 'bad' = any other literal, 'dynamic' = not decidable here.
function judge(raw, bound, property = false) {
  const isLarge = (text) => (/^(?:large|lg)$/i.test(text.trim()) ? 'ok' : 'bad');
  const literalOf = (expression) => {
    const quoted = expression.trim().match(/^(["'`])([^"'`$\\]*)\1$/);
    return quoted ? isLarge(quoted[2]) : 'dynamic';
  };
  let value = raw.trim();
  if (property) return literalOf(value);
  const delimited = value.match(/^\\*(["'])([\s\S]*?)\\*\1$/);
  if (delimited) value = delimited[2];
  else if (value.startsWith('{') && value.endsWith('}')) { value = value.slice(1, -1); bound = true; }
  if (bound) return literalOf(value.trim().replace(/^\{([\s\S]*)\}$/, '$1'));
  if (/\$\{|\{\{|\.\.\./.test(value)) return 'dynamic';
  return isLarge(value);
}

function judgeSpan(span) {
  let verdict = null;
  const note = (next) => { if (verdict !== 'ok' && !(verdict === 'dynamic' && next === 'bad')) verdict = next; };
  for (const match of span.matchAll(ATTRIBUTE_SIZE)) note(judge(match[2], Boolean(match[1])));
  for (const match of span.matchAll(PROPERTY_SIZE)) note(judge(match[1], false, true));
  if (/\.\.\.|Object\.assign\s*\(/.test(span) && verdict !== 'ok') verdict = 'dynamic';
  return verdict;
}

function maskComments(text) {
  const blank = (from, to) => ' '.repeat(to - from).replace(/ /g, (_, i) => (text[from + i] === '\n' ? '\n' : ' '));
  let out = text.replace(/\/\*[\s\S]*?\*\/|<!--[\s\S]*?-->/g, (hit, offset) => blank(offset, offset + hit.length));
  out = out.split('\n').map((line) => (COMMENT_LINE.test(line) ? ' '.repeat(line.length) : line)).join('\n');
  return out;
}

function markupEnd(text, from) {
  let quote = '';
  let braces = 0;
  const stop = Math.min(text.length, from + SPAN_LIMIT);
  for (let index = from; index < stop; index++) {
    const character = text[index];
    if (quote) { if (character === quote) quote = ''; }
    else if (character === '"' || character === "'") quote = character;
    else if (character === '{') braces++;
    else if (character === '}') braces = Math.max(0, braces - 1);
    else if (character === '>' && braces === 0 && text[index - 1] !== '=') return index;
  }
  return stop;
}

// Walks a call's parentheses, skipping strings and comments; returns each top-level argument's [start, end).
function callArguments(text, open) {
  const args = [];
  let depth = 0, quote = '', start = open + 1;
  const stop = Math.min(text.length, open + SPAN_LIMIT);
  for (let index = open; index < stop; index++) {
    const character = text[index];
    if (quote) { if (character === '\\') index++; else if (character === quote) quote = ''; continue; }
    if (character === '/' && text[index + 1] === '/') { while (index < stop && text[index] !== '\n') index++; continue; }
    if (character === '/' && text[index + 1] === '*') { const close = text.indexOf('*/', index + 2); index = close < 0 ? stop : close + 1; continue; }
    if (character === '"' || character === "'" || character === '`') quote = character;
    else if (character === '(' || character === '[' || character === '{') depth++;
    else if (character === ')' || character === ']' || character === '}') {
      depth--;
      if (depth === 0) { args.push([start, index]); return { args, end: index }; }
    } else if (character === ',' && depth === 1) { args.push([start, index]); start = index + 1; }
  }
  args.push([start, stop]);
  return { args, end: stop };
}

export function audienceFieldFindings(source) {
  const text = maskComments(source);
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
  const seen = new Set();
  const report = (tag, start, end) => {
    if (seen.has(start)) return;
    seen.add(start);
    findings.push({ rule: 'audience-field-size', line: lineAt(start), endLine: lineAt(end), message: message(tag) });
  };

  for (const match of text.matchAll(FIELD_MARKUP)) {
    const end = markupEnd(text, match.index);
    const span = text.slice(match.index, end);
    if (span.length === match[0].length && !new RegExp(`</${match[1]}`, 'i').test(text)) continue;
    const verdict = judgeSpan(span);
    if (verdict === null || verdict === 'bad') report(match[1].toLowerCase(), match.index, end);
  }

  for (const match of text.matchAll(FIELD_FACTORY)) {
    const open = text.indexOf('(', match.index);
    const { args, end } = callArguments(text, open);
    const tagAt = text.indexOf(match[1], open);
    const propsArg = args.find(([from]) => from > tagAt);
    const before = text.slice(Math.max(0, match.index - 80), match.index);
    if (/Object\.assign\s*\(\s*(?:document\.)?$/.test(before)) continue;

    let verdict = null;
    if (propsArg) {
      const props = text.slice(propsArg[0], propsArg[1]).trim();
      verdict = props.startsWith('{') ? judgeSpan(props) : props ? 'dynamic' : null;
    }
    let reportEnd = end;
    if (verdict !== 'ok' && verdict !== 'dynamic') {
      const assigned = before.match(/([A-Za-z_$][\w$]*)\s*=\s*(?:document\.)?$/);
      if (assigned) {
        const name = escapeForRegExp(assigned[1]);
        const rest = text.slice(end);
        const redeclared = rest.search(new RegExp(`(?<![\\w$.])${name}\\s*=\\s*(?:document\\.)?${FACTORY}\\(`));
        const scope = redeclared < 0 ? rest : rest.slice(0, redeclared);
        const setter = new RegExp(`(?<![\\w$.])${name}\\s*(?:\\.setAttribute\\(\\s*["']size["']\\s*,\\s*|\\.size\\s*=(?!=)\\s*)([^;\\n)]*)`, 'g');
        for (const set of scope.matchAll(setter)) {
          const next = judge(set[1], false);
          if (next === 'ok' || (next === 'dynamic' && verdict !== 'ok')) verdict = next;
          else if (verdict === null) verdict = 'bad';
          reportEnd = Math.max(reportEnd, end + set.index + set[0].length);
        }
      }
    }
    if (verdict === null || verdict === 'bad') report(match[1].toLowerCase(), match.index, reportEnd);
  }
  return findings;
}

export const isAudienceFieldPage = (surface, path = '') =>
  surface !== 'settings' && surface !== 'website'
  && (surface === 'audience' || /^self-paced-view/i.test(String(path).split(/[\\/]/).pop()));
