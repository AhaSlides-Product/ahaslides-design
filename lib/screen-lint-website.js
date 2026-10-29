/*
 * screen-lint website-surface rules — a whole website page made of DS Marketing sections.
 * It is product UI plus: the min-width breakpoints the shipped Marketing sections use are accepted
 * inside @container/@media conditions (list generated from marketing/*.json), and two page rules
 * from the website guideline are checked mechanically (one H1, an alt on every image), plus nine
 * whole-document checks (websiteDocumentFindings): no section eyebrow, band order, no page override
 * of a section's spacing, no class of a removed layout, a Vivid Pink hero, Features Tabs kept
 * to parallel choices with short descriptions, the one hero video, no light grey quote or frame
 * and no square image outside the Vivid Pink frame.
 */
import { MARKETING_MIN_WIDTHS } from './marketing-breakpoints.js';
import { MARKETING_REMOVED_CLASSES } from './marketing-removed-layouts.js';

export const WEBSITE_SURFACES = ['website'];

export const WEBSITE_RULE_GROUPS = {
  page: ['multiple-h1', 'img-no-alt', 'section-eyebrow', 'band-order', 'section-spacing-override', 'removed-layout', 'hero-not-brand', 'tabs-description-long', 'steps-as-tabs', 'autoplay-video-extra', 'autoplay-video-attributes', 'autoplay-video-motion', 'grey-quote-or-frame', 'square-image-unframed'],
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
    const attributes = {};
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
      if (text[cursor] !== '=') { if (attributeName && !(attributeName in attributes)) attributes[attributeName] = ''; continue; }
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
      if (attributeName && !(attributeName in attributes)) attributes[attributeName] = value;
      if (attributeName === 'class' && classValue === undefined) { classValue = value; classUnquoted = unquoted; }
    }
    if (end < 0) return;
    const selfClosing = text[end - 1] === '/';
    if (selfClosing && classUnquoted && classValue.endsWith('/')) classValue = classValue.slice(0, -1);
    position = end + 1;
    yield { index: start, end, name, closing, selfClosing, attributes, classes: classValue ? classTokens(classValue) : [] };
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
    if (tag.closing) {
      depth = Math.max(0, depth - 1);
      if (depth === 0 && bands.length) bands[bands.length - 1].end = tag.index;
      continue;
    }
    if (tag.selfClosing) continue;
    if (depth === 0)
      bands.push({ index: tag.index, end: Infinity, names: tag.classes, root: tag.classes.find((name) => /^aha-/.test(name)) || '' });
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
const SEQUENCE_HEADING = /how\s+it\s+works|^\s*how\s+to\b|step[\s-]by[\s-]step|in\s+\w+\s+(?:easy\s+)?steps|\bsteps\b/i;

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
  const close = text.toLowerCase().indexOf(`</${tag.name}`, tag.end);
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

const HERO_VIDEO_PAUSE_VERSION = [0, 543, 0];
const HERO_CLASS = /^aha-header-section-hero-/;

function motionScriptPausesHeroVideo(tags) {
  return tags.some((tag) => {
    const source = tag.name === 'script' && !tag.closing && tag.attributes.src;
    if (!source || !/marketing-motion(?:\.js)?(?:[?#]|$)/.test(source)) return false;
    const version = source.match(/@v?(\d+)\.(\d+)\.(\d+)\//);
    if (!version) return true;
    const found = version.slice(1).map(Number);
    for (let place = 0; place < 3; place += 1)
      if (found[place] !== HERO_VIDEO_PAUSE_VERSION[place]) return found[place] > HERO_VIDEO_PAUSE_VERSION[place];
    return true;
  });
}

function reducedMotionBlocks(text) {
  const blocks = [];
  const marker = /prefers-reduced-motion\s*:\s*reduce\b/gi;
  for (let hit = marker.exec(text); hit; hit = marker.exec(text)) {
    const open = text.indexOf('{', hit.index);
    if (open < 0) break;
    let depth = 0;
    let cursor = open;
    for (; cursor < text.length; cursor += 1) {
      if (text[cursor] === '{') depth += 1;
      else if (text[cursor] === '}' && --depth === 0) break;
    }
    blocks.push(text.slice(open, cursor + 1));
    marker.lastIndex = Math.max(marker.lastIndex, open + 1);
  }
  return blocks;
}

function pageStopsHeroVideo(text, tags) {
  if (motionScriptPausesHeroVideo(tags)) return true;
  if (reducedMotionBlocks(text).some((block) => /(?<![.#\w-])video(?![\w-])|\.pause\s*\(/i.test(block))) return true;
  return /matchMedia\s*\([^)]*prefers-reduced-motion\s*:\s*reduce\b/i.test(text) && /\.pause\s*\(/.test(text);
}

function videoFindings(text) {
  const findings = [];
  const tags = [...htmlTags(text)];
  const hero = sectionBands(text).find((band) => band.names.some((name) => HERO_CLASS.test(name)));
  const autoplaying = tags.filter((tag) => tag.name === 'video' && !tag.closing && 'autoplay' in tag.attributes);
  autoplaying.forEach((tag, order) => {
    const line = lineOf(text, tag.index);
    const inHero = hero && tag.index > hero.index && tag.index < hero.end;
    if (order > 0 || !inHero)
      findings.push({ line, endLine: line, rule: 'autoplay-video-extra', message: order > 0 ? 'a second autoplaying video — a page has exactly one, the hero video (W9)' : 'an autoplaying video outside the hero section — only the hero video may autoplay (W9)' });
    const missing = ['muted', 'loop', 'playsinline', 'poster'].filter((name) => !(name in tag.attributes) || (name === 'poster' && !tag.attributes.poster));
    if (missing.length)
      findings.push({ line, endLine: line, rule: 'autoplay-video-attributes', message: `the autoplaying hero video lacks ${missing.join(', ')} — it carries autoplay, muted, loop, playsinline and a poster (W9)` });
    if (!pageStopsHeroVideo(text, tags))
      findings.push({ line, endLine: line, rule: 'autoplay-video-motion', message: 'nothing stops the autoplaying hero video under prefers-reduced-motion — load lib/marketing-motion.js from release 0.543.0 or later, which pauses it, or pause it inside a prefers-reduced-motion rule or matchMedia check that targets the video (W9)' });
  });
  return findings;
}

const LIGHT_GREY = /#f[67]f[67]f[67]\b/i;
const GREY_SELECTOR = /blockquote|(?<![a-z])(?:rail|frame)(?![a-z])/i;
const GREY_PROPERTY = /^(?:background(?:-color)?|border-left(?:-color)?|border-inline-start(?:-color)?)$/;

function greyDeclarations(body) {
  return body.split(';').map((declaration) => declaration.trim().match(/^([a-z-]+)\s*:\s*(.*)$/i)).filter((match) => match && GREY_PROPERTY.test(match[1].toLowerCase()) && LIGHT_GREY.test(match[2])).map((match) => match[1].toLowerCase());
}

function greyFrameFindings(text) {
  const findings = [];
  for (const block of styleBlocks(text)) {
    for (const rule of cssRules(withoutComments(block.css))) {
      const selector = rule.selector.trim();
      if (!GREY_SELECTOR.test(selector)) continue;
      const property = greyDeclarations(rule.body)[0];
      if (!property) continue;
      const line = lineOf(text, block.start + rule.braceAt);
      findings.push({ line, endLine: line, rule: 'grey-quote-or-frame', message: `page CSS paints ${property} light grey on "${selector.replace(/\s+/g, ' ')}" — a quote, rail or image frame is never light grey: use the Vivid Pink frame or the pale pink accent (W6)` });
    }
  }
  for (const tag of htmlTags(text)) {
    if (tag.closing || !tag.attributes.style) continue;
    const named = tag.name === 'blockquote' || tag.classes.some((name) => GREY_SELECTOR.test(name));
    const property = named && greyDeclarations(tag.attributes.style)[0];
    if (!property) continue;
    const line = lineOf(text, tag.index);
    findings.push({ line, endLine: line, rule: 'grey-quote-or-frame', message: `an inline ${property} light grey on a ${tag.name === 'blockquote' ? 'blockquote' : `"${tag.classes.join(' ')}"`} — a quote, rail or image frame is never light grey (W6)` });
  }
  return findings;
}

const VOID_TAGS = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);
const FRAMED_SECTION = /^aha-(?:features|marketing-cards)(?![a-z-])/;
const SMALL_IMAGE_CLASS = /logo|avatar|icon|badge|splash/i;
const SQUARE_MINIMUM_PIXELS = 200;
const MAX_OPEN_TAGS = 200;
const SQUARE_RATIO = /aspect-ratio\s*:\s*1(?:\s*\/\s*1)?\s*(?:;|$)/i;

function squareImageFindings(text) {
  const findings = [];
  const open = [];
  for (const tag of htmlTags(text)) {
    if (tag.name === 'img' && !tag.closing) {
      const { width, height, style = '' } = tag.attributes;
      const squareBox = /^\d+$/.test(width ?? '') && width === height && Number(width) >= SQUARE_MINIMUM_PIXELS;
      const inFramedSection = open.some((entry) => entry.classes.some((name) => FRAMED_SECTION.test(name)));
      const inPinkFrame = [...open, tag].some((entry) => entry.classes.some((name) => /pink-frame/.test(name)));
      const small = tag.classes.some((name) => SMALL_IMAGE_CLASS.test(name));
      if ((squareBox || SQUARE_RATIO.test(style)) && inFramedSection && !inPinkFrame && !small) {
        const line = lineOf(text, tag.index);
        findings.push({ line, endLine: line, rule: 'square-image-unframed', message: 'a square image filling its slot — a square or portrait image sits in the Vivid Pink frame (aha-features__photo--pink-frame or aha-marketing-card__media--pink-frame), never edge to edge (W6)' });
      }
      continue;
    }
    if (tag.selfClosing || VOID_TAGS.has(tag.name)) continue;
    if (tag.closing) {
      for (let at = open.length - 1; at >= 0; at -= 1)
        if (open[at].name === tag.name) { open.length = at; break; }
    } else if (open.length < MAX_OPEN_TAGS) open.push(tag);
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
    ...videoFindings(text),
    ...greyFrameFindings(text),
    ...squareImageFindings(text),
  ];
}
