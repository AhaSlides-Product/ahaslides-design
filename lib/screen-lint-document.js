import { withoutComments, withoutHtmlComments, lineOf } from './screen-lint-website.js';

/*
 * screen-lint rules for a complete standalone HTML page (it has <html>, <head> or a doctype): a page
 * that never loads the DS, a private palette of raw hex custom properties, and a font stack without
 * Plus Jakarta Sans. Each line-level raw-hex check skips custom properties, so without these a page
 * could define its whole look privately and still pass.
 */
export const DOCUMENT_RULE_GROUPS = {
  'ds-head': ['ds-not-loaded'],
};

const REPORT_GUIDE = 'https://design.ahaslides.io/guidelines/report-images/report-images.md';
const COLOUR_RULES = 'https://design.ahaslides.io/colour-rules.md';
const CDN_LIB = 'https://assets-cdn-public.ahaslides.com/ahaslides-design/latest/lib';
const HEAD_LINES = `<link rel="stylesheet" href="${CDN_LIB}/tokens.css"> and <script type="module" src="${CDN_LIB}/all.js"></script>`;

const STANDALONE = /<!doctype\s+html|<html[\s>]|<head[\s>]/i;
const OWN_STYLING = /<style[\s>]|<link\b[^>]*\bstylesheet\b|\sstyle\s*=\s*["']/i;
const DS_PATH = String.raw`(?:ahaslides-design[@/]|@ahaslides-product/design\b|(?<![\w-])lib/(?:tokens\.css|all\.js|settings\.js|aha-[\w-]+\.js)|(?<![\w-])variables\.css)`;
const DS_REFERENCE = new RegExp(
  String.raw`(?:\b(?:href|src)\s*=\s*["'][^"']*${DS_PATH}`
  + String.raw`|(?:\bfrom|\bimport|@import)\s*(?:\(\s*|url\(\s*)?["']?[^"'\s)]*${DS_PATH})`, 'i');
// An email client strips <link>, <script> and custom properties, so an email cannot load the DS; an app shell gets it from the bundle injected at build.
const EMAIL = /<!--\[if\s+mso|urn:schemas-microsoft-com:office|<table\b[^>]*\brole\s*=\s*["']presentation["']/i;
const APP_SHELL = /<%=|<(div|main)\b[^>]*\bid\s*=\s*["'](?:app|root|__nuxt|__next)["'][^>]*>\s*<\/\1>/i;
const TOKEN_USE = /var\(\s*--aha-/i;
// A bundler entry or local stylesheet can bring the DS in at build time, which this file cannot see.
const LOCAL_ENTRY = /<script\b[^>]*\bsrc\s*=\s*["']?(?![a-z][a-z0-9+.-]*:|\/\/)[^"'\s>]|<link\b(?=[^>]*\bstylesheet\b)[^>]*\bhref\s*=\s*["']?(?![a-z][a-z0-9+.-]*:|\/\/)[^"'\s>]|\b(?:from|import)\s*\(?\s*["'](?:\.{1,2}\/|\/(?!\/))/i;

const STYLE_BLOCK = /(<style\b[^>]*>)([\s\S]*?)<\/style>/gi;
const STYLE_ATTRIBUTE = /\sstyle\s*=\s*(?:"([^"]*)"|'([^']*)')/gi;
const FONT_FACE = /@font-face\s*\{[^}]*\}/gi;
const DECLARATION = /(?<![\w-])(--[A-Za-z_][\w-]*|font-family|font)\s*:\s*((?:[^;{}"']|"[^"]*"|'[^']*')*)/g;

const RAW_HEX = /#[0-9A-Fa-f]{3,8}\b/;
const JAKARTA = /plus\s*jakarta\s*sans/i;
const FONT_KEYWORDS = /^(?:inherit|initial|unset|revert(?:-layer)?|caption|icon|menu|message-box|small-caption|status-bar)$/i;
const MONOSPACE = /\bmonospace\b/i;
const NAMES_A_FAMILY = /["']|,|(?<![\w-])(?:sans-serif|serif|system-ui|ui-sans-serif|ui-serif|cursive|fantasy|-apple-system|BlinkMacSystemFont)(?![\w-])/i;

const SHORTHAND_FAMILY = /[\d.](?:px|em|rem|pt|%)(?:\s*\/\s*[\d.]+[a-z%]*)?\s+[A-Za-z]/i;

const stripVars =(value) => value.replace(/var\([^)]*\)/gi, ' ').trim();

function cssRegions(text) {
  const regions = [];
  for (const block of text.matchAll(STYLE_BLOCK))
    regions.push({ start: block.index + block[1].length, css: block[2] });
  for (const attribute of text.matchAll(STYLE_ATTRIBUTE)) {
    const css = attribute[1] ?? attribute[2];
    regions.push({ start: attribute.index + attribute[0].length - css.length - 1, css });
  }
  return regions;
}

function offDsFont(property, value) {
  const bare = stripVars(value);
  if (!bare || JAKARTA.test(bare) || MONOSPACE.test(bare)) return false;
  if (property === 'font-family') return !FONT_KEYWORDS.test(bare);
  return NAMES_A_FAMILY.test(bare) || SHORTHAND_FAMILY.test(bare);
}

export function documentFindings(source, { tokenRules = true } = {}) {
  const text = withoutHtmlComments(source);
  if (!STANDALONE.test(text)) return [];
  const findings = [];
  const email = EMAIL.test(source);

  if (OWN_STYLING.test(text) && !DS_REFERENCE.test(text) && !TOKEN_USE.test(text) && !LOCAL_ENTRY.test(text) && !email && !APP_SHELL.test(text)) {
    const head = text.search(/<head[\s>]/i);
    const anchor = head >= 0 ? head : text.search(STANDALONE);
    const line = lineOf(text, anchor);
    findings.push({ line, endLine: line, rule: 'ds-not-loaded', severity: 'hard',
      message: `a standalone HTML page that never loads the design system: no DS stylesheet or script and no var(--aha-…) token, so its colours, type and components are all hand-rolled. Add ${HEAD_LINES} to the <head>, then style with the --aha-* tokens and <aha-*> elements; a report or dashboard page follows ${REPORT_GUIDE}. Opt out on this line with ds-lint-allow: ds-not-loaded (why)` });
  }

  if (!tokenRules) return findings;
  const privateColours = new Map();
  for (const { start, css } of cssRegions(text)) {
    const clean = withoutComments(css);
    const fontFaces = [...clean.matchAll(FONT_FACE)].map((m) => [m.index, m.index + m[0].length]);
    for (const declaration of clean.matchAll(DECLARATION)) {
      if (fontFaces.some(([from, to]) => declaration.index >= from && declaration.index < to)) continue;
      const [, property, value] = declaration;
      const line = lineOf(text, start + declaration.index);
      if (property.startsWith('--')) {
        const hex = stripVars(value).match(RAW_HEX);
        if (hex && !email && !/^--aha-/i.test(property))
          privateColours.set(line, [...(privateColours.get(line) || []), `${property}: ${hex[0]}`]);
      } else if (offDsFont(property.toLowerCase(), value)) {
        findings.push({ line, endLine: line, rule: 'off-ds-font', severity: 'hard',
          message: `${property}: ${value.trim().slice(0, 60)} is not the DS font: type is Plus Jakarta Sans only, through var(--aha-font-product) once tokens.css is loaded (colour rule 2.4; ${REPORT_GUIDE} C2). A fallback for other scripts goes after it, never instead of it` });
      }
    }
  }
  for (const [line, declarations] of privateColours)
    findings.push({ line, endLine: line, rule: 'custom-property-hex', severity: 'hard',
      message: `${declarations.join(', ')}: a private palette in raw hex, which the bare-hex check never sees. A page takes its colours from the DS tokens: use var(--aha-…) directly, or alias one (--name: var(--aha-…)); a private light or dark palette is off the DS (${COLOUR_RULES})` });
  return findings;
}
