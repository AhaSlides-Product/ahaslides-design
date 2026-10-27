/*
 * screen-lint website-surface rules — a whole website page made of DS Marketing sections.
 * It is product UI plus: the min-width breakpoints the shipped Marketing sections use are accepted
 * inside @container/@media conditions (list generated from marketing/*.json), and two page rules
 * from the website guideline are checked mechanically (one H1, an alt on every image), plus four
 * whole-document checks (websiteDocumentFindings): no section eyebrow, band order, no page override
 * of a section's spacing, no class of a removed layout.
 */
import { MARKETING_MIN_WIDTHS } from './marketing-breakpoints.js';
import { MARKETING_REMOVED_CLASSES } from './marketing-removed-layouts.js';

export const WEBSITE_SURFACES = ['website'];

export const WEBSITE_RULE_GROUPS = {
  page: ['multiple-h1', 'img-no-alt', 'section-eyebrow', 'band-order', 'section-spacing-override', 'removed-layout'],
};

const ALLOWED_MIN_WIDTHS = new Set(MARKETING_MIN_WIDTHS);
const QUERY_CONDITION = /@(?:container|media)\b[^{]*/gi;
const COMMENT_ONLY = /^\s*(?:\/\/|\/\*|\*(?:\s|\/|$)|<!--(?:(?!-->).)*(?:-->\s*)?$)/;

export function isMarketingQueryMinWidth(line, matchIndex, pixels) {
  if (!ALLOWED_MIN_WIDTHS.has(pixels)) return false;
  for (const query of line.matchAll(QUERY_CONDITION))
    if (matchIndex >= query.index && matchIndex < query.index + query[0].length) return true;
  return false;
}

export function createWebsitePageRules() {
  let headingCount = 0;
  return (line) => {
    if (COMMENT_ONLY.test(line)) return [];
    const findings = [];
    headingCount += (line.match(/<h1(?=[\s>])/gi) || []).length;
    if (headingCount > 1 && /<h1(?=[\s>])/i.test(line))
      findings.push({ rule: 'multiple-h1', severity: 'hard', message: 'a second <h1> — a page has one H1, in the Header section (W4)' });
    for (const tag of line.match(/<img(?=[\s>/])[^>]*>/gi) || [])
      if (!/(?<![\w-])alt\s*=/i.test(tag))
        findings.push({ rule: 'img-no-alt', severity: 'hard', message: '<img> without alt text — every picture carries alt (W6)' });
    return findings;
  };
}

const SECTION_CLASS = /^aha-(?:features|numbers|pricing|testimonials|faq|marketing-cards|footer-banner|logos)(?![a-z-])/;
const SPACED_SECTION = /\.aha-(?:features|numbers|testimonials|faq|pricing|footer-banner)(?![a-z0-9-])/;
const SPACING_PROPERTY = /^(?:padding|margin|gap|row-gap|column-gap)(?:-[a-z]+)*$/;
const REMOVED_CLASSES = new Set(MARKETING_REMOVED_CLASSES);
const CARD_EYEBROW = /^aha-marketing-card__eyebrow$/;

const lineOf = (text, index) => text.slice(0, index).split('\n').length;
const classTokens = (attributeValue) => attributeValue.split(/\s+/).filter(Boolean);
const blankedOut = (match) => match.replace(/[^\n]/g, ' ');

function blankedBetween(text, open, close) {
  let result = '';
  let position = 0;
  for (;;) {
    const start = text.indexOf(open, position);
    const end = start < 0 ? -1 : text.indexOf(close, start + open.length);
    if (end < 0) return result + text.slice(position);
    result += text.slice(position, start) + blankedOut(text.slice(start, end + close.length));
    position = end + close.length;
  }
}
const withoutComments = (css) => blankedBetween(css, '/*', '*/');
const withoutHtmlComments = (html) => blankedBetween(html, '<!--', '-->');

function* classedTags(text) {
  for (const tag of text.matchAll(/<[a-z][\w-]*\b[^>]*?\sclass\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))[^>]*>/gi))
    yield { index: tag.index, classes: classTokens(tag[1] ?? tag[2] ?? tag[3]) };
}

function eyebrowFindings(text) {
  const findings = [];
  for (const tag of classedTags(text)) {
    const hit = tag.classes.find((name) => /eyebrow/i.test(name) && !CARD_EYEBROW.test(name));
    if (hit) {
      const line = lineOf(text, tag.index);
      findings.push({ line, endLine: line, rule: 'section-eyebrow', message: `a section eyebrow (class "${hit}") — no small label above a section heading, the hero included: a section heading block is h2 and lead (W14, W17)` });
    }
  }
  return findings;
}

function removedLayoutFindings(text) {
  const findings = [];
  for (const tag of classedTags(text)) {
    for (const name of tag.classes)
      if (REMOVED_CLASSES.has(name)) {
        const line = lineOf(text, tag.index);
        findings.push({ line, endLine: line, rule: 'removed-layout', message: `class "${name}" belongs to a Marketing layout the DS has removed, so the page carries a frozen copy of old markup and CSS — paste a current section snippet instead (W1)` });
      }
  }
  return findings;
}

function spacingOverrideFindings(text) {
  const findings = [];
  for (const block of text.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)) {
    const css = withoutComments(block[1]);
    if (/container\s*:\s*aha-/.test(css)) continue;
    const blockStart = block.index + block[0].indexOf(block[1]);
    for (const rule of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      const selector = rule[1].trim();
      if (!SPACED_SECTION.test(selector)) continue;
      const property = [...rule[2].matchAll(/(?:^|;)\s*([a-z-]+)\s*:/gi)].map((m) => m[1].toLowerCase()).find((name) => SPACING_PROPERTY.test(name));
      if (!property) continue;
      const line = lineOf(text, blockStart + rule.index + rule[0].indexOf('{'));
      findings.push({ line, endLine: line, rule: 'section-spacing-override', message: `page CSS sets ${property} on "${selector.replace(/\s+/g, ' ')}" — a Marketing section keeps the vertical padding, header gap and call-to-action gap it ships (W2)` });
    }
  }
  return findings;
}

function sectionBands(text) {
  const bands = [];
  const classesAt = new Map([...classedTags(text)].map((tag) => [tag.index, tag.classes]));
  let depth = 0;
  for (const tag of text.matchAll(/<(\/?)section\b([^>]*)>/gi)) {
    if (tag[1]) { depth = Math.max(0, depth - 1); continue; }
    if (tag[2].trimEnd().endsWith('/')) continue;
    if (depth === 0) {
      const names = classesAt.get(tag.index) || [];
      bands.push({ index: tag.index, names, root: names.find((name) => /^aha-/.test(name)) || '' });
    }
    depth += 1;
  }
  return bands;
}

function bandOrderFindings(text) {
  const findings = [];
  let previousColoured = false;
  let whiteRun = 0;
  let afterLogos = false;
  for (const band of sectionBands(text)) {
    const { root, names } = band;
    if (/^aha-logos(?![a-z-])/.test(root)) { afterLogos = true; continue; }
    const followsLogos = afterLogos;
    afterLogos = false;
    const line = lineOf(text, band.index);
    let coloured;
    if (/^aha-footer-banner(?![a-z-])/.test(root)) coloured = true;
    else if (SECTION_CLASS.test(root)) coloured = names.some((name) => /--(?:accent|brand)$/.test(name));
    else { previousColoured = false; whiteRun = 0; continue; }
    if (coloured) {
      if (followsLogos)
        findings.push({ line, endLine: line, rule: 'band-order', message: 'the band right after the Logos strip is full white, never pale pink or another tint (W5)' });
      else if (previousColoured)
        findings.push({ line, endLine: line, rule: 'band-order', message: 'two coloured bands touch — a full white band always sits between two coloured bands (W5)' });
      whiteRun = 0;
    } else {
      whiteRun += 1;
      if (whiteRun === 3)
        findings.push({ line, endLine: line, rule: 'band-order', message: 'three white content bands in a row — after the Logos strip the body alternates white and pale pink (a Features section with aha-features--accent) (W5)' });
    }
    previousColoured = coloured;
  }
  return findings;
}

export function websiteDocumentFindings(source) {
  const text = withoutHtmlComments(source);
  return [
    ...eyebrowFindings(text),
    ...bandOrderFindings(text),
    ...spacingOverrideFindings(text),
    ...removedLayoutFindings(text),
  ];
}
