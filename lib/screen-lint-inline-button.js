export const INLINE_BUTTON_RULE_GROUPS = { 'inline-button': ['inline-button'] };

const BUTTON_TAG = /<(?:aha-button|AhaButton)\b(?:[^>"'{]|"[^"]*"|'[^']*'|\{[^}]*\})*>/g;
const INLINE_SIZE = /(?<![\w:.-])size\s*=\s*(?:\{\s*)?["']inline["']/;
const FIXED_VARIANT = /(?<![\w:.-])variant\s*=\s*(?:"([^"]*)"|'([^']*)'|\{\s*["']([^"']*)["']\s*\})/;
const ANY_VARIANT = /(?<![\w-])variant\s*=/;
const SPREAD = /\{\s*\.\.\.|(?<![\w:-])v-bind\s*=/;
const SHORTCUT = /(?<![\w-])shortcut\b/;
const NEEDS_TEXT_LINK = 'size inline works with variant text-link only: any other variant, or none, renders a 36px line in the sentence. Add variant="text-link"';
const NO_SHORTCUT = 'size inline draws no shortcut: a key chip does not belong in a sentence. Remove shortcut';

function withoutValues(tag) {
  let bare = tag.replace(/"[^"]*"|'[^']*'/g, '');
  for (let inner = bare.replace(/\{[^{}]*\}/g, ''); inner !== bare; inner = bare.replace(/\{[^{}]*\}/g, '')) bare = inner;
  return bare;
}

// A variant only known at runtime, bound or spread, may well be text-link, so it is never a hard fail.
function lacksTextLink(tag, bare) {
  const fixed = tag.match(FIXED_VARIANT);
  if (fixed) return (fixed[1] ?? fixed[2] ?? fixed[3]) !== 'text-link';
  return !ANY_VARIANT.test(bare) && !SPREAD.test(tag);
}

export function inlineButtonFindings(text) {
  const findings = [];
  for (const tag of text.matchAll(BUTTON_TAG)) {
    if (!INLINE_SIZE.test(tag[0])) continue;
    const line = text.slice(0, tag.index).split('\n').length;
    const endLine = line + tag[0].split('\n').length - 1;
    const bare = withoutValues(tag[0]);
    if (lacksTextLink(tag[0], bare)) findings.push({ line, endLine, rule: 'inline-button', message: NEEDS_TEXT_LINK, severity: 'hard' });
    if (SHORTCUT.test(bare)) findings.push({ line, endLine, rule: 'inline-button', message: NO_SHORTCUT, severity: 'hard' });
  }
  return findings;
}
