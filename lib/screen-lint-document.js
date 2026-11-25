import { htmlTags, styleBlocks, withoutComments, withoutHtmlComments } from './screen-lint-website.js';

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
const HEAD_LINES = `<link rel="stylesheet" href="${CDN_LIB}/tokens.css">, <link rel="stylesheet" href="${CDN_LIB}/fonts.css"> and <script type="module" src="${CDN_LIB}/all.js"></script>`;

const DOCTYPE = /<!doctype\s+html/i;
const DS_PATH = /ahaslides-design[@/]|@ahaslides-product\/design\b|(?<![\w-])lib\/(?:tokens\.css|all\.js|settings\.js|aha-[\w-]+\.js)|(?<![\w-])variables\.css/i;
const IMPORT = /(?:\bfrom|\bimport|@import)\s*(?:url)?\(?\s*(["']?)([^"'\s)]*)/gi;
const EXTERNAL = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i;
const LOCAL_PATH = /^(?:\.{1,2}\/|\/(?!\/))/;
// An email client strips <link>, <script> and custom properties, so an email cannot load the DS; an app shell gets it from the bundle injected at build.
const EMAIL = /<!--\[if\s+mso|urn:schemas-microsoft-com:office/i;
const APP_MOUNT = /^(?:app|root|__nuxt|__next)$/;
const TOKEN_USE = /var\(\s*--aha-/i;
const STYLE_ATTRIBUTE_NEEDLE = /\sstyle\s*=\s*["']/i;

const isStylesheet = (tag) => tag.name === 'link' && /(?:^|\s)stylesheet(?:\s|$)/i.test(tag.attributes.rel ?? '');

function pageSignals(text, tags) {
  const signals = { standalone: DOCTYPE.test(text), ownStyling: STYLE_ATTRIBUTE_NEEDLE.test(text), dsReference: false, localEntry: false, email: false, appShell: text.includes('<%='), head: -1, html: -1 };
  tags.forEach((tag, index) => {
    if (tag.closing) return;
    if (tag.name === 'html' || tag.name === 'head') signals.standalone = true;
    if (tag.name === 'head' && signals.head < 0) signals.head = tag.index;
    if (tag.name === 'html' && signals.html < 0) signals.html = tag.index;
    if (tag.name === 'style' || isStylesheet(tag)) signals.ownStyling = true;
    for (const url of [tag.attributes.href, tag.attributes.src])
      if (url && DS_PATH.test(url)) signals.dsReference = true;
    // A bundler entry or local stylesheet can bring the DS in at build time, which this file cannot see.
    const entry = tag.name === 'script' ? tag.attributes.src : isStylesheet(tag) ? tag.attributes.href : undefined;
    if (entry && !EXTERNAL.test(entry)) signals.localEntry = true;
    if (tag.name === 'table' && /^presentation$/i.test(tag.attributes.role ?? '')) signals.email = true;
    const next = tags[index + 1];
    if ((tag.name === 'div' || tag.name === 'main') && APP_MOUNT.test(tag.attributes.id ?? '')
      && next?.closing && next.name === tag.name && !text.slice(tag.end + 1, next.index).trim()) signals.appShell = true;
  });
  for (const [, quote, path] of text.matchAll(IMPORT)) {
    if (DS_PATH.test(path)) signals.dsReference = true;
    if (quote && LOCAL_PATH.test(path)) signals.localEntry = true;
  }
  return signals;
}

const STYLE_ATTRIBUTE = /\sstyle\s*=\s*(?:"([^"]*)"|'([^']*)')/gi;
const FONT_FACE = /@font-face\s*\{[^{}]*\}/gi;
const DECLARATION = /(?<![\w-])(--[A-Za-z_][\w-]*|font-family|font)\s*:\s*((?:[^;{}"']|"[^"]*"|'[^']*')*)/g;

const RAW_HEX = /#[0-9A-Fa-f]{3,8}\b/;
const JAKARTA = /plus\s*jakarta\s*sans/i;
const FONT_KEYWORDS = /^(?:inherit|initial|unset|revert(?:-layer)?|caption|icon|menu|message-box|small-caption|status-bar)$/i;
const MONOSPACE = /\bmonospace\b/i;
const NAMES_A_FAMILY = /["']|,|(?<![\w-])(?:sans-serif|serif|system-ui|ui-sans-serif|ui-serif|cursive|fantasy|-apple-system|BlinkMacSystemFont)(?![\w-])/i;

const SHORTHAND_FAMILY = /[\d.](?:px|em|rem|pt|%)(?:\s*\/\s*[\d.]+[a-z%]*)?\s+[A-Za-z]/i;

const FONT_TOKEN = /var\(\s*--aha-font-(?:product|display|secondary|mono)\s*[,)]/i;
const stripVars = (value) => value.replace(/var\([^()]*\)/gi, ' ').trim();

function cssRegions(text) {
  const regions = styleBlocks(text);
  for (const attribute of text.matchAll(STYLE_ATTRIBUTE)) {
    const css = attribute[1] ?? attribute[2];
    regions.push({ start: attribute.index + attribute[0].length - css.length - 1, css });
  }
  return regions;
}

function lineIndex(text) {
  const breaks = [];
  for (let at = text.indexOf('\n'); at >= 0; at = text.indexOf('\n', at + 1)) breaks.push(at);
  return (offset) => {
    let low = 0;
    let high = breaks.length;
    while (low < high) {
      const middle = (low + high) >> 1;
      if (breaks[middle] < offset) low = middle + 1; else high = middle;
    }
    return low + 1;
  };
}

function offDsFont(property, value) {
  const token = value.search(FONT_TOKEN);
  if (token >= 0 && !value.slice(0, token).includes(',')) return false;
  const bare = stripVars(value);
  if (!bare || JAKARTA.test(bare) || MONOSPACE.test(bare)) return false;
  if (property === 'font-family') return !FONT_KEYWORDS.test(bare);
  return NAMES_A_FAMILY.test(bare) || SHORTHAND_FAMILY.test(bare);
}

export function documentFindings(source, { tokenRules = true } = {}) {
  const text = withoutHtmlComments(source);
  const tags = [...htmlTags(text)];
  const page = pageSignals(text, tags);
  if (!page.standalone) return [];
  const findings = [];
  const lineAt = lineIndex(text);
  const email = page.email || EMAIL.test(source);

  if (page.ownStyling && !page.dsReference && !TOKEN_USE.test(text) && !page.localEntry && !email && !page.appShell) {
    const doctype = text.search(DOCTYPE);
    const anchor = page.head >= 0 ? page.head : doctype >= 0 ? doctype : page.html;
    const line = lineAt(anchor);
    findings.push({ line, endLine: line, rule: 'ds-not-loaded', severity: 'hard',
      message: `a standalone HTML page that never loads the design system: no DS stylesheet or script and no var(--aha-…) token, so its colours, type and components are all hand-rolled. Add ${HEAD_LINES} to the <head>, then style with the --aha-* tokens and <aha-*> elements; a report or dashboard page follows ${REPORT_GUIDE}. Opt out on this line with ds-lint-allow: ds-not-loaded (why)` });
  }

  if (!tokenRules) return findings;
  const privateColours = new Map();
  for (const { start, css } of cssRegions(text)) {
    const clean = withoutComments(css).replace(FONT_FACE, (block) => block.replace(/[^\n]/g, ' '));
    for (const declaration of clean.matchAll(DECLARATION)) {
      const [, property, value] = declaration;
      const line = lineAt(start + declaration.index);
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
