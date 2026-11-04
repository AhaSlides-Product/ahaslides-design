export const INLINE_BUTTON_RULE_GROUPS = { 'inline-button': ['inline-button'] };

const BUTTON_TAG = /<(?:aha-button|AhaButton)\b(?:[^>"'{]|"[^"]*"|'[^']*'|\{[^}]*\})*>/g;
const INLINE_SIZE = /\bsize\s*=\s*(?:\{\s*)?["']inline["']/;
const TEXT_LINK = /\bvariant\s*=\s*(?:\{\s*)?["']text-link["']/;
const SHORTCUT = /\bshortcut\b/;
const NEEDS_TEXT_LINK = 'size inline works with variant text-link only: any other variant, or none, renders a 36px line in the sentence. Add variant="text-link"';
const NO_SHORTCUT = 'size inline draws no shortcut: a key chip does not belong in a sentence. Remove shortcut';

export function inlineButtonFindings(text) {
  const findings = [];
  for (const tag of text.matchAll(BUTTON_TAG)) {
    if (!INLINE_SIZE.test(tag[0])) continue;
    const line = text.slice(0, tag.index).split('\n').length;
    const endLine = line + tag[0].split('\n').length - 1;
    if (!TEXT_LINK.test(tag[0])) findings.push({ line, endLine, rule: 'inline-button', message: NEEDS_TEXT_LINK, severity: 'hard' });
    if (SHORTCUT.test(tag[0].replace(/"[^"]*"|'[^']*'/g, ''))) findings.push({ line, endLine, rule: 'inline-button', message: NO_SHORTCUT, severity: 'hard' });
  }
  return findings;
}
