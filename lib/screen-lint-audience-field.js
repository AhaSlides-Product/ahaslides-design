// A participant's text fields are the large 48px size; a developer's request is the only other size.

export const AUDIENCE_FIELD_RULES = ['audience-field-size'];

const FIELD_TAGS = ['aha-input', 'aha-counted-input', 'aha-counted-textarea', 'aha-select', 'aha-autocomplete'];
const FIELD_ALTERNATION = FIELD_TAGS.join('|');
const FIELD_MARKUP = new RegExp(`<(${FIELD_ALTERNATION})(?![\\w-])`, 'gi');
const FACTORY = String.raw`(?<![\w$])(?:el|elem|element|h|tag|node|dom|createEl|createElement)`;
const FIELD_FACTORY = new RegExp(`${FACTORY}\\(\\s*(?:[\\w$.]+\\s*,\\s*|["'][^"']*["']\\s*,\\s*)?["'](${FIELD_ALTERNATION})["']`, 'gi');
const COMMENT_LINE = /^\s*\/\//;
const SPAN_LIMIT = 1500;
const DOC = 'https://design.ahaslides.io/audience/index.html';

const escapeForRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const message = (tag) =>
  `<${tag}> without size="lg" on a participant page (audience or self-paced-view) — every participant text field is the large 48px size with 16px text (audience C5; ${DOC}): <aha-counted-input size="lg"> or <aha-counted-textarea size="lg"> in <aha-audience-field>. Only when the slide-type developer explicitly asked for another size: ds-lint-allow: size (developer request: <their words>) on the line of the element, or on the line of its setAttribute / .size when the size is set there`;

const isLarge = (text) => (/^(?:large|lg)$/i.test(text.trim()) ? 'ok' : 'bad');

// 'ok' = a large literal, 'bad' = any other literal, 'dynamic' = not decidable here.
function judgeLiteral(raw) {
  const quoted = raw.trim().match(/^(["'`])([^"'`$\\]*)\1$/);
  return quoted ? isLarge(quoted[2]) : 'dynamic';
}

const BOUND_SIZE = /^(?::|v-bind:)?size$/i;

function readString(text, from) {
  const quote = text[from];
  let index = from + 1;
  while (index < text.length && text[index] !== quote) index += text[index] === '\\' ? 2 : 1;
  return Math.min(index, text.length - 1);
}

function readBraces(text, from) {
  let depth = 0;
  for (let index = from; index < text.length; index++) {
    const character = text[index];
    if (character === '"' || character === "'" || character === '`') index = readString(text, index);
    else if (character === '{') depth++;
    else if (character === '}' && --depth === 0) return index;
  }
  return text.length - 1;
}

// Name/value pairs of an element's open tag; a value is only ever read from its own attribute.
function attributeVerdicts(span) {
  const verdicts = [];
  let index = span.search(/[\s/>]/);
  if (index < 0) return verdicts;
  while (index < span.length) {
    const character = span[index];
    if (/[\s/]/.test(character)) { index++; continue; }
    if (character === '>') break;
    if (character === '{') {
      const close = readBraces(span, index);
      if (span.slice(index, close).includes('...')) verdicts.push('dynamic');
      index = close + 1;
      continue;
    }
    let end = index;
    while (end < span.length && !/[\s=>/]/.test(span[end])) end++;
    const name = span.slice(index, end);
    index = end;
    while (/\s/.test(span[index] ?? '')) index++;
    let value = null, braced = false;
    if (span[index] === '=') {
      index++;
      while (/\s/.test(span[index] ?? '')) index++;
      let from = index;
      while (span[from] === '\\') from++;
      if (span[from] === '"' || span[from] === "'") {
        const close = readString(span, from);
        value = span.slice(from + 1, close).replace(/\\+$/, '');
        index = close + 1;
        while (span[index] === '\\') index++;
      } else if (span[index] === '{') {
        const close = readBraces(span, index);
        value = span.slice(index + 1, close);
        braced = true;
        index = close + 1;
      } else {
        end = index;
        while (end < span.length && !/[\s>]/.test(span[end])) end++;
        value = span.slice(index, end);
        index = end;
      }
    }
    if (/^v-bind$/i.test(name)) verdicts.push('dynamic');
    else if (BOUND_SIZE.test(name)) {
      if (value === null) verdicts.push('bad');
      else if (braced || name.includes(':')) verdicts.push(judgeLiteral(value));
      else verdicts.push(/\$\{|\{\{/.test(value) ? 'dynamic' : isLarge(value));
    }
  }
  return verdicts;
}

// Keys of a props object literal; a size inside a string value is never a key.
function propVerdicts(props) {
  const verdicts = [];
  for (let index = 0; index < props.length; index++) {
    const character = props[index];
    if (character === '/' && props[index + 1] === '/') { while (index < props.length && props[index] !== '\n') index++; continue; }
    if (character === '/' && props[index + 1] === '*') { const close = props.indexOf('*/', index + 2); index = close < 0 ? props.length : close + 1; continue; }
    if (character === '.' && props.startsWith('...', index)) { verdicts.push('dynamic'); index += 2; continue; }
    let key = null, end = index;
    if (character === '"' || character === "'" || character === '`') { end = readString(props, index); key = props.slice(index + 1, end); }
    else if (/[\w$]/.test(character) && !/[\w$.]/.test(props[index - 1] ?? '')) {
      while (end < props.length && /[\w$]/.test(props[end])) end++;
      key = props.slice(index, end);
      end--;
    } else continue;
    let after = end + 1;
    while (/\s/.test(props[after] ?? '')) after++;
    if (key === 'size' && props[after] === ':') {
      after++;
      while (/\s/.test(props[after] ?? '')) after++;
      const opener = props[after];
      if (opener === '"' || opener === "'" || opener === '`') {
        const close = readString(props, after);
        verdicts.push(judgeLiteral(props.slice(after, close + 1)));
        end = close;
      } else verdicts.push('dynamic');
    } else if (key === 'size' && /[,}]/.test(props[after] ?? '')) verdicts.push('dynamic');
    index = end;
  }
  return verdicts;
}

function combine(verdicts) {
  if (verdicts.includes('ok')) return 'ok';
  if (verdicts.includes('dynamic')) return 'dynamic';
  return verdicts.includes('bad') ? 'bad' : null;
}

function maskComments(text) {
  const out = text.split('');
  const blank = (from, to) => { for (let index = from; index < to; index++) if (out[index] !== '\n') out[index] = ' '; };
  let block = text.indexOf('/*'), html = text.indexOf('<!--');
  while (block >= 0 || html >= 0) {
    const useBlock = html < 0 || (block >= 0 && block < html);
    const start = useBlock ? block : html;
    const close = text.indexOf(useBlock ? '*/' : '-->', start + (useBlock ? 2 : 4));
    if (close < 0) break;
    const stop = close + (useBlock ? 2 : 3);
    blank(start, stop);
    if (block >= 0 && block < stop) block = text.indexOf('/*', stop);
    if (html >= 0 && html < stop) html = text.indexOf('<!--', stop);
  }
  return out.join('').split('\n').map((line) => (COMMENT_LINE.test(line) ? ' '.repeat(line.length) : line)).join('\n');
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
    const verdict = combine(attributeVerdicts(span));
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
      verdict = props.startsWith('{') ? combine(propVerdicts(props)) : props ? 'dynamic' : null;
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
          const next = judgeLiteral(set[1]);
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
