/*
 * screen-lint website-surface rules — a whole website page made of DS Marketing sections.
 * It is product UI plus: the min-width breakpoints the shipped Marketing sections use are accepted
 * inside @container/@media conditions (list generated from marketing/*.json), and two page rules
 * from the website guideline are checked mechanically (one H1, an alt on every image), plus four
 * whole-document checks (websiteDocumentFindings): no section eyebrow, band order, no page override
 * of a section's spacing, no class of a removed layout, a Vivid Pink hero, and Features Tabs kept
 * to parallel choices with short descriptions.
 */
import { MARKETING_MIN_WIDTHS } from './marketing-breakpoints.js';
import { MARKETING_REMOVED_CLASSES } from './marketing-removed-layouts.js';

export const WEBSITE_SURFACES = ['website'];

export const WEBSITE_RULE_GROUPS = {
  page: ['multiple-h1', 'img-no-alt', 'section-eyebrow', 'band-order', 'section-spacing-override', 'removed-layout', 'hero-not-brand', 'tabs-description-long', 'steps-as-tabs'],
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

const isSpace = (character) => character === ' ' || character === '\n' || character === '\t' || character === '\r' || character === '\f';
const isNameCharacter = (character) => /[A-Za-z0-9-]/.test(character);

function* htmlTags(text) {
  const unclosedQuote = new Set();
  let position = 0;
  for (;;) {
    const start = text.indexOf('<', position);
    if (start < 0) return;
    position = start + 1;
    const closing = text[position] === '/';
    let cursor = closing ? position + 1 : position;
    const nameStart = cursor;
    while (cursor < text.length && isNameCharacter(text[cursor])) cursor += 1;
    if (cursor === nameStart || !/[A-Za-z]/.test(text[nameStart])) continue;
    const name = text.slice(nameStart, cursor).toLowerCase();
    let classValue;
    let classUnquoted = false;
    let end = -1;
    while (cursor < text.length) {
      const character = text[cursor];
      if (character === '>') { end = cursor; break; }
      if (isSpace(character) || character === '/') { cursor += 1; continue; }
      const attributeStart = cursor;
      while (cursor < text.length && !isSpace(text[cursor]) && !'=>/'.includes(text[cursor])) cursor += 1;
      const attributeName = text.slice(attributeStart, cursor).toLowerCase();
      if (cursor === attributeStart) cursor += 1;
      while (isSpace(text[cursor])) cursor += 1;
      if (text[cursor] !== '=') continue;
      cursor += 1;
      while (isSpace(text[cursor])) cursor += 1;
      const quote = text[cursor];
      let value;
      let unquoted = false;
      if (quote === '"' || quote === "'") {
        const close = unclosedQuote.has(quote) ? -1 : text.indexOf(quote, cursor + 1);
        if (close < 0) {
          unclosedQuote.add(quote);
          cursor = text.indexOf('>', cursor);
          if (cursor < 0) return;
          continue;
        }
        value = text.slice(cursor + 1, close);
        cursor = close + 1;
      } else {
        const valueStart = cursor;
        while (cursor < text.length && !isSpace(text[cursor]) && text[cursor] !== '>') cursor += 1;
        value = text.slice(valueStart, cursor);
        unquoted = true;
      }
      if (attributeName === 'class' && classValue === undefined) { classValue = value; classUnquoted = unquoted; }
    }
    if (end < 0) return;
    const selfClosing = text[end - 1] === '/';
    if (selfClosing && classUnquoted && classValue.endsWith('/')) classValue = classValue.slice(0, -1);
    position = end + 1;
    yield { index: start, end, name, closing, selfClosing, classes: classValue ? classTokens(classValue) : [] };
  }
}

const classedTags = (text) => [...htmlTags(text)].filter((tag) => !tag.closing && tag.classes.length);

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

function cssRules(css) {
  const rules = [];
  let selectorStart = 0;
  let braceAt = -1;
  let selector = '';
  for (let index = 0; index < css.length; index += 1) {
    const character = css[index];
    if (character !== '{' && character !== '}') continue;
    if (character === '{') { braceAt = index; selector = css.slice(selectorStart, index); }
    else {
      if (braceAt >= 0) rules.push({ braceAt, selector, body: css.slice(braceAt + 1, index) });
      braceAt = -1;
    }
    selectorStart = index + 1;
  }
  return rules;
}

function styleBlocks(text) {
  const blocks = [];
  const closer = /<\/style\s*>/gi;
  let blockEnd = 0;
  for (const tag of htmlTags(text)) {
    if (tag.name !== 'style' || tag.closing || tag.end < blockEnd) continue;
    closer.lastIndex = tag.end + 1;
    const close = closer.exec(text);
    blocks.push({ start: tag.end + 1, css: text.slice(tag.end + 1, close ? close.index : text.length) });
    if (!close) break;
    blockEnd = closer.lastIndex;
  }
  return blocks;
}

function spacingOverrideFindings(text) {
  const findings = [];
  for (const block of styleBlocks(text)) {
    const css = withoutComments(block.css);
    if (/container\s*:\s*aha-/.test(css)) continue;
    for (const rule of cssRules(css)) {
      const selector = rule.selector.trim();
      if (!SPACED_SECTION.test(selector)) continue;
      const property = rule.body.split(';').map((declaration) => declaration.trim().match(/^([a-z-]+)\s*:/i)).filter(Boolean).map((match) => match[1].toLowerCase()).find((name) => SPACING_PROPERTY.test(name));
      if (!property) continue;
      const line = lineOf(text, block.start + rule.braceAt);
      findings.push({ line, endLine: line, rule: 'section-spacing-override', message: `page CSS sets ${property} on "${selector.replace(/\s+/g, ' ')}" — a Marketing section keeps the vertical padding, header gap and call-to-action gap it ships (W2)` });
    }
  }
  return findings;
}

function sectionBands(text) {
  const bands = [];
  let depth = 0;
  for (const tag of htmlTags(text)) {
    if (tag.name !== 'section') continue;
    if (tag.closing) { depth = Math.max(0, depth - 1); continue; }
    if (tag.selfClosing) continue;
    if (depth === 0)
      bands.push({ index: tag.index, names: tag.classes, root: tag.classes.find((name) => /^aha-/.test(name)) || '' });
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

const HERO_ROOT = /^aha-header-section-hero-(?!pink$)[a-z-]+$/;
const TABS_CLASS = /^aha-features--(?:tabs-screenshots|compact-tabs)$/;
const TAB_DESCRIPTION_LIMIT = 90;
const STEP_TITLE = /^\s*(?:step\s*)?\d+\s*[.:)\-]?(?:\s|$)/i;
const SEQUENCE_HEADING = /how\s+it\s+works|how\s+to\b|step[\s-]by[\s-]step|in\s+\w+\s+(?:easy\s+)?steps|\bsteps\b/i;

function heroSurfaceFindings(text) {
  const first = sectionBands(text)[0];
  if (!first) return [];
  const root = first.names.find((name) => HERO_ROOT.test(name));
  if (!root || first.names.some((name) => name.endsWith('--brand'))) return [];
  const line = lineOf(text, first.index);
  return [{ line, endLine: line, rule: 'hero-not-brand', message: `the Hero "${root}" is in its White or Accent state — a landing page opens with the Vivid Pink hero: add ${root}--brand and surface="brand" on its Buttons (colour rule 3.5, W5)` }];
}

const innerText = (html) => html.replace(/<[^>]*>/g, ' ').replace(/&[a-z]+;/gi, ' ').replace(/\s+/g, ' ').trim();

function textAfter(text, tag) {
  const close = text.indexOf('</', tag.end);
  return innerText(text.slice(tag.end + 1, close < 0 ? text.length : close));
}

function tabsFindings(text) {
  const findings = [];
  const tags = [...htmlTags(text)];
  for (const section of tags) {
    if (section.name !== 'section' || section.closing || !section.classes.some((name) => TABS_CLASS.test(name))) continue;
    const closeAt = text.indexOf('</section', section.end);
    const inside = tags.filter((tag) => tag.index > section.index && (closeAt < 0 || tag.index < closeAt) && !tag.closing);
    const sectionLine = lineOf(text, section.index);
    const heading = inside.find((tag) => tag.name === 'h2');
    const titles = inside.filter((tag) => tag.classes.includes('aha-features__item-title')).map((tag) => textAfter(text, tag));
    const tablist = inside.find((tag) => /\brole\s*=\s*["']?tablist/i.test(text.slice(tag.index, tag.end + 1)));
    const tablistLabel = tablist ? (text.slice(tablist.index, tablist.end + 1).match(/\baria-label\s*=\s*"([^"]*)"/i) || [, ''])[1] : '';
    const headerWords = [heading, ...inside.filter((tag) => tag.classes.some((name) => /eyebrow/i.test(name)))].filter(Boolean).map((tag) => textAfter(text, tag));
    if ([...headerWords, tablistLabel].some((words) => SEQUENCE_HEADING.test(words)) || (titles.length > 1 && titles.every((title) => STEP_TITLE.test(title))))
      findings.push({ line: sectionLine, endLine: sectionLine, rule: 'steps-as-tabs', message: 'a how it works or numbered steps section built as Features Tabs — steps are a sequence: use Step cards (Cards Steps row, or a Cards grid for four or more), tabs are for parallel choices (W12)' });
    for (const tag of inside.filter((one) => one.classes.includes('aha-features__item-text'))) {
      const words = textAfter(text, tag);
      if (words.length > TAB_DESCRIPTION_LIMIT) {
        const line = lineOf(text, tag.index);
        findings.push({ line, endLine: line, rule: 'tabs-description-long', message: `a tab description of ${words.length} characters — keep each Features Tabs description to one short sentence of ${TAB_DESCRIPTION_LIMIT} or fewer (W12)` });
      }
    }
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
    ...heroSurfaceFindings(text),
    ...tabsFindings(text),
  ];
}
