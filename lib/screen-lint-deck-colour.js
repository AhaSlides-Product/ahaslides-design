const COLOUR_DECLARATION = /(?:^|[;{"'\s])(?:color|background(?:-color|-image)?|fill|stroke|border(?:-[a-z]+)*|box-shadow|outline(?:-color)?|caret-color|text-decoration-color)\s*:\s*([^;}"]*)/gi;
const PRODUCT_COLOUR_TOKEN = /var\(\s*(--aha-(?!color-primary(?![a-z0-9-]))(?:text|border|bg|surface|icon|color|link)(?![a-z0-9])[a-z0-9-]*)/gi;
const MESSAGE = 'use --aha-deck-* (deck tokens) for colour on the canvas';

const DECK_VAR_OPEN = /var\(\s*--aha-(?:deck|answer|viz)-[a-z0-9-]*\s*,/gi;

function withoutDeckFallbacks(value) {
  let result = value;
  for (let match = DECK_VAR_OPEN.exec(result); match; match = DECK_VAR_OPEN.exec(result)) {
    let depth = 1, end = match.index + match[0].length;
    while (end < result.length && depth) depth += result[end] === '(' ? 1 : result[end] === ')' ? -1 : 0, end++;
    result = result.slice(0, match.index) + ' ' + result.slice(end);
    DECK_VAR_OPEN.lastIndex = 0;
  }
  return result;
}

export function offDeckColourFindings(line) {
  const hits = [];
  for (const [, declared] of line.matchAll(COLOUR_DECLARATION)) {
    const value = withoutDeckFallbacks(declared);
    if (/color-mix\s*\(/i.test(value)) hits.push('color-mix()');
    for (const [, token] of value.matchAll(PRODUCT_COLOUR_TOKEN)) hits.push(token);
  }
  return [...new Set(hits)].map(hit => ({
    rule: 'canvas-off-deck-colour',
    severity: 'warn',
    message: `${hit} on a hand-built element — ${MESSAGE} (applyCanvasDeck writes the ladder from xprops)`,
  }));
}
