// motion-script-copy reads lib/marketing-motion.js through node:fs, so it is skipped where node is absent.
import { htmlTags, styleBlocks, cssRules, withoutComments, withoutHtmlComments, lineOf } from './screen-lint-website.js';

export const CARD_DESCRIPTION_MAX_WORDS = 25;

const COMPOSITION_RULES = ['section-gap', 'motion-script-copy', 'step-numbers', 'ds-class-without-css', 'page-font', 'card-description-long'];
export const WEBSITE_COMPOSITION_RULE_GROUPS = { composition: COMPOSITION_RULES };

const VOID_TAGS = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);
const DS_SECTION_ROOT = /^aha-(?:features|numbers|pricing|testimonials|faq|marketing-cards?|footer-banner|footer|logos|comparison|header-section-[a-z0-9-]+)$/;
const DS_CLASS = /^(aha-[a-z0-9]+(?:-[a-z0-9]+)*?)(?:__|--)/;
const CARD_DESCRIPTION_CLASSES = new Set(['aha-marketing-card__text', 'aha-features__item-text', 'aha-numbers__stat-text']);
const VERTICAL_SIDE = /^(?:padding|margin)-(?:top|bottom|block|block-start|block-end)$/;
const NEUTRAL_VALUE = /^(?:0|0px|0rem|0em|auto|none|normal|initial|unset|inherit|revert|revert-layer)$/i;
const SECTION_STEP = /^var\(\s*--aha-section-space-block\s*\)$/i;

const hasClass = (tag, name) => tag.classes.includes(name);
const attributeOf = (text, tag, name) => {
  const head = text.slice(tag.index, tag.end + 1);
  const match = head.match(new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, 'i'));
  return match ? match[1] ?? match[2] : undefined;
};

function blankedRawText(text, tagName) {
  const closer = new RegExp(`</${tagName}\\s*>`, 'gi');
  let blanked = text;
  let resumeAt = 0;
  const blocks = [];
  for (const tag of htmlTags(text)) {
    if (tag.name !== tagName || tag.closing || tag.end < resumeAt) continue;
    closer.lastIndex = tag.end + 1;
    const close = closer.exec(text);
    const end = close ? close.index : text.length;
    blocks.push({ tag, start: tag.end + 1, end, content: text.slice(tag.end + 1, end) });
    blanked = blanked.slice(0, tag.end + 1) + text.slice(tag.end + 1, end).replace(/[^\n]/g, ' ') + blanked.slice(end);
    if (!close) break;
    resumeAt = closer.lastIndex;
  }
  return { blanked, blocks };
}

function elementTree(markup) {
  const root = { name: '#root', parent: null, classes: [], bandCount: 0 };
  const elements = [];
  let current = root;
  for (const tag of htmlTags(markup)) {
    if (tag.closing) {
      let open = current;
      while (open && open.name !== tag.name) open = open.parent;
      if (open && open.parent) { open.end = tag.index; current = open.parent; }
      continue;
    }
    if (tag.selfClosing || VOID_TAGS.has(tag.name)) continue;
    const element = { name: tag.name, tag, parent: current, classes: tag.classes, start: tag.index, end: markup.length };
    elements.push(element);
    current = element;
  }
  const insideBand = (element) => { for (let up = element.parent; up; up = up.parent) if (up.isBand) return true; return false; };
  for (const element of elements) {
    element.isBand = element.name === 'section' && element.classes.some((name) => name.startsWith('aha-'));
    element.isBand = element.isBand && !insideBand(element);
    if (element.isBand) for (let up = element.parent; up; up = up.parent) up.bandCount = (up.bandCount || 0) + 1;
  }
  return elements;
}

const surfaceOf = (element) => (element.classes.some((name) => /--brand$/.test(name)) ? 'brand' : element.classes.some((name) => /--accent$/.test(name)) ? 'accent' : 'white');

function splitSpaces(value) {
  const parts = [];
  let depth = 0;
  let part = '';
  for (const character of value.trim()) {
    if (character === '(') depth += 1;
    if (character === ')') depth = Math.max(0, depth - 1);
    if (/\s/.test(character) && depth === 0) { if (part) parts.push(part); part = ''; } else part += character;
  }
  if (part) parts.push(part);
  return parts;
}

function declarationsOf(body) {
  const declarations = [];
  for (const declaration of body.split(';')) {
    const colon = declaration.indexOf(':');
    if (colon < 0) continue;
    const name = declaration.slice(0, colon).trim().toLowerCase();
    if (!/^[a-z-]+$/.test(name) && !/^--[\w-]+$/.test(name)) continue;
    declarations.push([name, declaration.slice(colon + 1).replace(/!important/i, '').trim()]);
  }
  return declarations;
}

function verticalValues(property, value, onlyGap) {
  const parts = splitSpaces(value);
  if (!parts.length) return [];
  if (property === 'gap' || property === 'row-gap') return [parts[0]];
  if (onlyGap) return [];
  if (VERTICAL_SIDE.test(property)) return parts;
  if (property === 'padding' || property === 'margin') return parts.length >= 3 ? [parts[0], parts[2]] : [parts[0]];
  return [];
}

const offStep = (values) => values.find((value) => !NEUTRAL_VALUE.test(value) && !SECTION_STEP.test(value));

function selectorTargets(selector) {
  const targets = [];
  let depth = 0;
  let item = '';
  for (const character of `${selector},`) {
    if (character === '(' || character === '[') depth += 1;
    if (character === ')' || character === ']') depth = Math.max(0, depth - 1);
    if (character === ',' && depth === 0) { targets.push(item.trim()); item = ''; } else item += character;
  }
  return targets.filter(Boolean).map((single) => {
    const compound = single.split(/\s*[>+~]\s*|\s+/).pop();
    return { single, tag: (compound.match(/^[a-z][a-z0-9]*|^\*/i) || [''])[0].toLowerCase(), classes: [...compound.matchAll(/\.([\w-]+)/g)].map((match) => match[1]), pseudoElement: compound.includes('::') };
  });
}

function sectionGapFindings(text, markup, elements) {
  const findings = [];
  const bands = elements.filter((element) => element.isBand);
  if (!bands.length) return findings;
  const wrappers = new Set(bands.map((band) => band.parent).filter((parent) => parent && parent.name !== '#root' && !['main', 'body', 'html'].includes(parent.name) && parent.bandCount === 1));
  const parents = new Set(bands.map((band) => band.parent).filter((parent) => parent && parent.bandCount >= 2));
  const bandClasses = new Set();
  for (const element of [...bands, ...wrappers]) for (const name of element.classes) if (!name.startsWith('aha-')) bandClasses.add(name);
  const parentClasses = new Set();
  const parentTags = new Set();
  for (const parent of parents) { parent.classes.forEach((name) => parentClasses.add(name)); if (parent.name !== '#root') parentTags.add(parent.name); }

  for (const block of styleBlocks(text)) {
    const css = withoutComments(block.css);
    if (/container\s*:\s*aha-/.test(css)) continue;
    for (const rule of cssRules(css)) {
      if (rule.selector.trim().startsWith('@')) continue;
      for (const target of selectorTargets(rule.selector)) {
        if (target.pseudoElement) continue;
        const bandLevel = (target.tag === 'section' || target.classes.some((name) => bandClasses.has(name))) && !target.classes.some((name) => name.startsWith('aha-') && /^aha-(?:features|numbers|testimonials|faq|pricing|footer-banner)(?![a-z0-9-])/.test(name));
        const parentLevel = parentTags.has(target.tag) || target.classes.some((name) => parentClasses.has(name));
        if (!bandLevel && !parentLevel) continue;
        for (const [property, value] of declarationsOf(rule.body)) {
          const bad = offStep(verticalValues(property, value, !bandLevel));
          if (!bad) continue;
          const line = lineOf(text, block.start + rule.braceAt);
          findings.push({ line, endLine: line, rule: 'section-gap', message: `page CSS sets ${property}: ${bad} on "${target.single.replace(/\s+/g, ' ')}", which spaces a Marketing band — the gap between two bands is one Section step (--aha-section-space-block: 96, 64 and 48 px at 1440, 768 and 375), never a value of the page's own (W2)` });
        }
      }
    }
  }

  for (const element of [...bands, ...wrappers]) {
    const style = attributeOf(text, element.tag, 'style');
    if (!style) continue;
    for (const [property, value] of declarationsOf(style)) {
      const bad = offStep(verticalValues(property, value, false));
      if (!bad) continue;
      const line = lineOf(text, element.start);
      findings.push({ line, endLine: line, rule: 'section-gap', message: `an inline ${property}: ${bad} on a Marketing band — the gap between two bands is one Section step (--aha-section-space-block), never a value of the page's own (W2)` });
    }
  }

  for (let index = 1; index < bands.length; index += 1) {
    const before = bands[index - 1];
    const after = bands[index];
    const between = markup.slice(before.end, after.start);
    const line = lineOf(text, after.start);
    if (/<(?:hr|br)(?![\w-])/i.test(between) || /<([a-z][a-z0-9]*)(?:\s[^<>]*)?>\s*<\/\1\s*>/i.test(between))
      findings.push({ line, endLine: line, rule: 'section-gap', message: 'a divider or spacer element sits between two Marketing bands — add no margin, spacer or divider between sections; the Section padding is the only gap (W2)' });
    else if (before.parent !== after.parent && surfaceOf(before) === surfaceOf(after) && !after.classes.some((name) => /^aha-footer(?![a-z0-9-])/.test(name)))
      findings.push({ line, endLine: line, rule: 'section-gap', message: `two ${surfaceOf(after)} bands are wrapped in their own elements, so the visible gap is two Section paddings (192 px at 1440) — the DS drops the second top padding only for direct sibling sections; put the sections side by side with no wrapper (W2)` });
  }
  return findings;
}

function motionScriptFindings(text, path) {
  const findings = [];
  const nodeBuiltin = typeof process !== 'undefined' && process.getBuiltinModule;
  if (!nodeBuiltin) return findings;
  const fs = process.getBuiltinModule('node:fs');
  const nodePath = process.getBuiltinModule('node:path');
  let shipped;
  try { shipped = fs.readFileSync(new URL('./marketing-motion.js', import.meta.url), 'utf8'); } catch { return findings; }
  const normal = (source) => source.replace(/\r\n?/g, '\n').replace(/^\s*\/\*[\s\S]*?\*\//, '').trim();
  const { blocks } = blankedRawText(text, 'script');
  for (const block of blocks) {
    const source = attributeOf(text, block.tag, 'src');
    const line = lineOf(text, block.tag.index);
    if (source !== undefined) {
      if (!/marketing-motion(?:\.min)?\.js/i.test(source) || /^(?:[a-z][a-z0-9+.-]*:)?\/\//i.test(source) || /^data:/i.test(source)) continue;
      let copy;
      try { copy = fs.readFileSync(nodePath.resolve(nodePath.dirname(path || ''), source.split(/[?#]/)[0]), 'utf8'); } catch { continue; }
      if (normal(copy) !== normal(shipped))
        findings.push({ line, endLine: line, rule: 'motion-script-copy', message: `${source} is not the current DS marketing-motion.js (its content differs from lib/marketing-motion.js) — load the shipped script, do not keep a copy (W9)` });
    } else if (block.content.includes('data-aha-marketing-motion') && normal(block.content) !== normal(shipped))
      findings.push({ line, endLine: line, rule: 'motion-script-copy', message: 'an inline motion script differs from the current DS marketing-motion.js (hash mismatch) — load the shipped lib/marketing-motion.js once instead of pasting or editing a copy (W9)' });
  }
  return findings;
}

const insideStepsRow = (element) => {
  for (let up = element.parent; up; up = up.parent) if (up.classes?.includes('aha-marketing-cards__grid--row')) return true;
  return false;
};

function stepNumberFindings(text, markup, elements) {
  const findings = [];
  for (const element of elements.filter((item) => hasClass(item, 'aha-marketing-card--step'))) {
    const hasRing = elements.some((item) => item.start > element.start && item.start < element.end && hasClass(item, 'aha-marketing-card__number'));
    const line = lineOf(text, element.start);
    if (!hasRing) findings.push({ line, endLine: line, rule: 'step-numbers', message: 'a Step card without the DS number ring (aha-marketing-card__number) — numbered steps use the Cards Step card as shipped (W12)' });
    else if (!insideStepsRow(element)) {
      findings.push({ line, endLine: line, rule: 'step-numbers', message: 'Step cards outside the Steps row — numbered steps sit in aha-marketing-cards__grid--row, never in a grid, rows or a list of their own (W12)' });
    }
  }
  const handRolled = new Set();
  for (const element of elements) {
    for (const name of element.classes) {
      if (name.startsWith('aha-') || handRolled.has(name) || !/(?:^|[-_])steps?(?:[-_\d]|$)/i.test(name)) continue;
      handRolled.add(name);
      const line = lineOf(text, element.start);
      findings.push({ line, endLine: line, rule: 'step-numbers', message: `class "${name}" is a hand-built step — numbered steps are the Cards Steps row (aha-marketing-cards__grid--row) with the DS number ring, never a layout of the page's own (W12)` });
    }
  }
  if (!elements.some((element) => hasClass(element, 'aha-marketing-cards__grid--row')) && !findings.length) {
    let expected = 1;
    let first = 0;
    let lastAt = -1;
    for (const match of markup.matchAll(/<([a-z][a-z0-9]*)((?:\s[^<>]*)?)>\s*0?([1-9])\s*<\/\1\s*>/gi)) {
      if (['td', 'th', 'option', 'li', 'sup', 'sub', 'a', 'button', 'time', 'script', 'style'].includes(match[1].toLowerCase()) || /aha-marketing-card__number/.test(match[2])) continue;
      if (lastAt >= 0 && match.index - lastAt > 2500) expected = 1;
      lastAt = match.index;
      if (Number(match[3]) === 1) { expected = 2; first = match.index; continue; }
      if (Number(match[3]) !== expected) { expected = 1; continue; }
      expected += 1;
      if (expected === 4) {
        const line = lineOf(text, first);
        findings.push({ line, endLine: line, rule: 'step-numbers', message: 'numbers 1, 2, 3 drawn by hand beside three blocks — numbered steps are the Cards Steps row (aha-marketing-cards__grid--row) with the DS number ring (W12)' });
        break;
      }
    }
  }
  return findings;
}

let unstyledHooks;
function intentionallyUnstyledClasses() {
  if (unstyledHooks) return unstyledHooks;
  unstyledHooks = new Set();
  const fs = typeof process !== 'undefined' && process.getBuiltinModule?.('node:fs');
  if (!fs) return unstyledHooks;
  const visit = (node, baseCss = '') => {
    if (Array.isArray(node)) return node.forEach((item) => visit(item, baseCss));
    if (!node || typeof node !== 'object') return;
    const shared = `${baseCss}\n${typeof node.baseCss === 'string' ? node.baseCss : ''}`;
    if (typeof node.html === 'string') {
      const styled = new Set([...`${shared}\n${node.css ?? ''}`.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)].map((match) => match[1]));
      for (const tag of htmlTags(node.html)) for (const name of tag.classes) if (!styled.has(name)) unstyledHooks.add(name);
    }
    Object.values(node).forEach((value) => visit(value, shared));
  };
  const folder = new URL('../marketing/', import.meta.url);
  try {
    for (const file of fs.readdirSync(folder).filter((entry) => entry.endsWith('.json'))) visit(JSON.parse(fs.readFileSync(new URL(file, folder), 'utf8')));
  } catch { unstyledHooks.clear(); }
  return unstyledHooks;
}

function missingClassCssFindings(text, markup, elements) {
  const css = styleBlocks(text).map((block) => withoutComments(block.css)).join('\n');
  if (!css.trim()) return [];
  const missingByFamily = new Map();
  const seen = new Set();
  for (const element of elements) {
    for (const name of element.classes) {
      if (seen.has(name)) continue;
      seen.add(name);
      const root = (name.match(DS_CLASS) || [])[1];
      if (!root || !DS_SECTION_ROOT.test(root) || intentionallyUnstyledClasses().has(name)) continue;
      const family = root === 'aha-marketing-card' ? 'aha-marketing-cards' : root;
      if (new RegExp(`\\.${name}(?![\\w-])`).test(css)) continue;
      if (!missingByFamily.has(family)) missingByFamily.set(family, { line: lineOf(text, element.start), names: [] });
      missingByFamily.get(family).names.push(name);
    }
  }
  const findings = [];
  for (const [family, { line, names }] of missingByFamily) {
    const pastedFamily = new RegExp(`\\.${family.replace(/s$/, '')}s?(?:__|--|(?![\\w-]))`).test(css);
    if (!pastedFamily) continue;
    const listed = names.slice(0, 4).map((name) => `"${name}"`).join(', ') + (names.length > 4 ? ` and ${names.length - 4} more` : '');
    findings.push({ line, endLine: line, rule: 'ds-class-without-css', message: `the markup uses ${family} classes (${listed}) that the page's CSS does not style — paste the whole section snippet, its CSS included, so every class used in the markup is styled (W1)` });
  }
  return findings;
}

const FONT_TOKEN = /^var\(\s*--aha-font-(?:product|display|secondary)\s*(?:,[^)]*)?\)$/i;
const FONT_FAMILY_OK = /^["']?plus jakarta sans["']?$/i;

function fontFindings(text) {
  const findings = [];
  const customProperties = new Map();
  const rules = [];
  for (const block of styleBlocks(text)) {
    const css = withoutComments(block.css);
    for (const rule of cssRules(css)) {
      rules.push({ ...rule, start: block.start });
      for (const [name, value] of declarationsOf(rule.body)) if (name.startsWith('--') && !customProperties.has(name)) customProperties.set(name, value);
    }
  }
  const resolve = (value, depth = 0) => {
    const reference = value.match(/^var\(\s*(--[\w-]+)\s*(?:,\s*(.*))?\)$/i);
    if (!reference || FONT_TOKEN.test(value)) return value;
    if (depth > 4) return value;
    if (customProperties.has(reference[1])) return resolve(customProperties.get(reference[1]), depth + 1);
    return reference[2] ?? value;
  };
  const resolves = (value, shorthand) => {
    const resolved = resolve(value.trim());
    if (/^inherit$/i.test(resolved) || FONT_TOKEN.test(resolved)) return true;
    if (shorthand) return /plus jakarta sans/i.test(resolved) || FONT_TOKEN.test(resolved.split(/\s+/).pop());
    return FONT_FAMILY_OK.test(resolved.split(',')[0].trim());
  };
  const consider = (label, body, index) => {
    for (const [property, value] of declarationsOf(body)) {
      if (property !== 'font-family' && property !== 'font') continue;
      if (resolves(value, property === 'font')) continue;
      const line = lineOf(text, index);
      findings.push({ line, endLine: line, rule: 'page-font', message: `${property} on "${label}" is ${value.slice(0, 60)}, which does not resolve to Plus Jakarta Sans — body text and every heading use the DS font (var(--aha-font-product)), never a page or Webflow font (W14)` });
    }
  };
  for (const rule of rules) {
    if (rule.selector.trim().startsWith('@')) continue;
    for (const target of selectorTargets(rule.selector))
      if (!target.pseudoElement && /^(?:\*|html|body|h[1-6])$/.test(target.tag)) consider(target.single.replace(/\s+/g, ' '), rule.body, rule.start + rule.braceAt);
  }
  for (const tag of htmlTags(text)) {
    if (tag.closing || !/^(?:html|body|h[1-6])$/.test(tag.name)) continue;
    const style = attributeOf(text, tag, 'style');
    if (style) consider(`<${tag.name}>`, style, tag.index);
  }
  return findings;
}

function cardDescriptionFindings(text, markup, elements) {
  const findings = [];
  for (const element of elements) {
    if (!element.classes.some((name) => CARD_DESCRIPTION_CLASSES.has(name))) continue;
    const close = markup.indexOf(`</${element.name}`, element.tag.end + 1);
    const inner = markup.slice(element.tag.end + 1, close < 0 ? markup.length : close).replace(/<[^>]*>/g, ' ');
    const words = inner.split(/\s+/).filter((word) => /[\p{L}\p{N}]/u.test(word)).length;
    if (words <= CARD_DESCRIPTION_MAX_WORDS) continue;
    const line = lineOf(text, element.start);
    findings.push({ line, endLine: line, rule: 'card-description-long', message: `a card description of ${words} words — keep each card description to ${CARD_DESCRIPTION_MAX_WORDS} words or fewer; cut it or link to the page that holds the detail (W10)` });
  }
  return findings;
}

export function websiteCompositionFindings(source, path = '') {
  const text = withoutHtmlComments(source);
  const { blanked: noStyle } = blankedRawText(text, 'style');
  const { blanked: markup } = blankedRawText(noStyle, 'script');
  const elements = elementTree(markup);
  return [
    ...sectionGapFindings(text, markup, elements),
    ...motionScriptFindings(text, path),
    ...stepNumberFindings(text, markup, elements),
    ...missingClassCssFindings(text, markup, elements),
    ...fontFindings(text),
    ...cardDescriptionFindings(text, markup, elements),
  ];
}
