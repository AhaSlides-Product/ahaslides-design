// Page CSS is a <style> block without a shipped section's `container: aha-*`, so the Marketing sections' own CSS is never judged.
import { htmlTags, styleBlocks, cssRules, withoutComments, withoutHtmlComments, lineOf } from './screen-lint-website.js';

const GUIDELINE_RULES = [
  'content-width-uncapped',
  'missing-h1',
  'multiple-primary-buttons',
  'img-empty-alt',
  'stock-photo',
  'brand-not-lockup',
  'missing-navigation',
  'motion-library',
  'motion-own-script',
  'motion-own-animation',
  'card-link-same-tab',
  'new-tab-on-sign-up',
];
export const WEBSITE_GUIDELINE_RULE_GROUPS = { guideline: GUIDELINE_RULES };

const VOID_TAGS = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);
const CONTENT_MAX_PIXELS = 1280;
const HEADING_BLOCK_MAX_PIXELS = 720;
const LEAD_MAX_CHARACTERS = 44;
const DESKTOP_PIXELS = 1440;
const SHIPPED_SECTION_CSS = /container\s*:\s*aha-/;
const CONTENT_BOX_CLASS = /^aha-[a-z0-9-]+__(?:inner|wrap)$/;
const HEADING_BLOCK_CLASS = /^aha-[a-z0-9-]+__(?:header|heading)$/;
const LEAD_CLASS = /^aha-[a-z0-9-]+__lead$/;
const CONTENT_BOX_SELECTOR = /\.aha-[a-z0-9-]+__(?:inner|wrap)(?![\w-])/;
const HEADING_BLOCK_SELECTOR = /\.aha-[a-z0-9-]+__(?:header|heading)(?![\w-])/;
const LEAD_SELECTOR = /\.aha-[a-z0-9-]+__lead(?![\w-])/;
const PRICING_ROOT = /^aha-pricing(?![a-z-])/;
const DESIGN_SYSTEM_DOCS_PAGE = /<meta\s+name="generator"\s+content="ahaslides-design generate\.mjs"/;
const LABELLED_CONTROL = new Set(['a', 'button', 'aha-button']);
const CARD_LINK_CLASS = /^aha-(?:marketing-card|testimonials)__link$/;
const LINK_OUT_LABEL = /^\s*(?:Browse all templates|See all integrations|Read customer stories|Read the docs)\b/i;
const AHASLIDES_PAGE_HOSTS = new Set(['ahaslides.com', 'www.ahaslides.com', 'docs.ahaslides.com']);
const MOTION_LIBRARY = /(?:^|[/@._-])(?:gsap|scrolltrigger|animejs|anime|lottie(?:-web|-player)?|framer-motion|aos|scrollreveal|lenis|locomotive-scroll|scrollmagic|rellax|jarallax|wow|animate|barba)(?:[/@._-]|$)/i;
const OWN_MOTION_SCRIPT = /addEventListener\s*\(\s*['"]scroll['"]|\bonscroll\s*=|IntersectionObserver|requestAnimationFrame|\.animate\s*\(|\bscrollY\b|\bpageYOffset\b|ScrollTimeline/;
const LITERAL_TIMING = /\d*\.?\d+m?s\b|\b(?:ease|ease-in|ease-out|ease-in-out|linear|step-start|step-end)\b|cubic-bezier|steps\s*\(/i;
const SHIPPED_SECTION_SCRIPT = /data-aha-scroller|aha-footer-banner--reveal/;
const INERT_ANIMATION = /^(?:none|initial|inherit|unset|revert)$/i;

const STOCK_PHOTO_HOST = /(?:^|\.)(?:unsplash\.com|pexels\.com|pixabay\.com|picsum\.photos|loremflickr\.com|lorempixel\.com|placeimg\.com|shutterstock\.com|istockphoto\.com|gettyimages\.[a-z.]+|adobestock\.com|stock\.adobe\.com|freepik\.com|depositphotos\.com|dreamstime\.com|123rf\.com|alamy\.com|stocksy\.com|burst\.shopify\.com)$/i;
const ADDRESS_HOST = /(?:^|[\s,("'=])(?:https?:)?\/\/([^/\s?#:,"')]+)/gi;

const blanked = (match) => match.replace(/[^\n]/g, ' ');

function rawTextBlocks(text, tagName) {
  const lower = text.toLowerCase();
  const blocks = [];
  let from = 0;
  for (;;) {
    const open = lower.indexOf(`<${tagName}`, from);
    if (open < 0) break;
    const afterName = lower[open + tagName.length + 1];
    const headEnd = lower.indexOf('>', open);
    if (headEnd < 0) break;
    if (afterName && /[\w-]/.test(afterName)) { from = open + 1; continue; }
    const close = lower.indexOf(`</${tagName}`, headEnd);
    if (close < 0) break;
    const closeEnd = lower.indexOf('>', close);
    const end = closeEnd < 0 ? text.length : closeEnd + 1;
    blocks.push({ start: open, head: text.slice(open + tagName.length + 1, headEnd), body: text.slice(headEnd + 1, close), end });
    from = end;
  }
  return blocks;
}

function markupOf(text) {
  let markup = text;
  for (const tagName of ['script', 'style'])
    for (const block of rawTextBlocks(markup, tagName)) markup = markup.slice(0, block.start) + blanked(markup.slice(block.start, block.end)) + markup.slice(block.end);
  return markup;
}

function attributesOf(text, tag) {
  const attributes = {};
  const head = text.slice(tag.index, tag.end + 1);
  for (const match of head.matchAll(/\s([a-z_:][\w:.-]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/gi)) {
    const name = match[1].toLowerCase();
    if (!(name in attributes)) attributes[name] = match[2] ?? match[3] ?? match[4] ?? '';
  }
  return attributes;
}

function elementsOf(markup) {
  const stack = [];
  const elements = [];
  for (const tag of htmlTags(markup)) {
    if (tag.closing) {
      let at = stack.length - 1;
      while (at >= 0 && stack[at].name !== tag.name) at -= 1;
      if (at >= 0) {
        for (let up = stack.length - 1; up >= at; up -= 1) stack[up].closeAt = tag.index;
        stack.length = at;
      }
      continue;
    }
    const element = { name: tag.name, tag, classes: tag.classes, attributes: attributesOf(markup, tag), parent: stack[stack.length - 1] || null, closeAt: markup.length };
    elements.push(element);
    if (tag.selfClosing || VOID_TAGS.has(tag.name)) element.closeAt = tag.end + 1;
    else stack.push(element);
  }
  return elements;
}

const ancestors = (element) => { const chain = []; for (let up = element.parent; up; up = up.parent) chain.push(up); return chain; };
const insideOf = (element, outer) => element.tag.index > outer.tag.index && element.tag.index < outer.closeAt;
const innerHtml = (markup, element) => markup.slice(element.tag.end + 1, element.closeAt);
const innerText = (html) => html.replace(/<[^>]*>/g, ' ').replace(/&[a-z]+;/gi, ' ').replace(/\s+/g, ' ').trim();
const finding = (text, index, rule, message) => { const line = lineOf(text, index); return { line, endLine: line, rule, message }; };

function declarationsOf(body) {
  const declarations = [];
  let depth = 0;
  let start = 0;
  for (let index = 0; index <= body.length; index += 1) {
    const character = body[index];
    if (character === '(') depth += 1;
    else if (character === ')') depth = Math.max(0, depth - 1);
    else if ((character === ';' && depth === 0) || index === body.length) {
      const match = body.slice(start, index).trim().match(/^([a-z-]+)\s*:\s*([\s\S]*?)(?:\s*!important)?$/i);
      if (match) declarations.push({ name: match[1].toLowerCase(), value: match[2].trim() });
      start = index + 1;
    }
  }
  return declarations;
}

function pixelsOf(value) {
  if (/^none$/i.test(value)) return Infinity;
  const match = value.match(/^(-?[\d.]+)(px|rem|em|vw)$/i);
  if (!match) return null;
  const amount = parseFloat(match[1]);
  const unit = match[2].toLowerCase();
  return unit === 'px' ? amount : unit === 'vw' ? (amount * DESKTOP_PIXELS) / 100 : amount * 16;
}

function widthDeclarationMessage(kind, { name, value }) {
  if (kind === 'content') {
    if (name !== 'max-width' && name !== 'width') return '';
    const pixels = pixelsOf(value);
    return pixels !== null && pixels > CONTENT_MAX_PIXELS ? `${name}: ${value} on a section's content box — section content is capped at ${CONTENT_MAX_PIXELS}px, centred (W3)` : '';
  }
  if (name !== 'max-width') return '';
  if (kind === 'heading') {
    const pixels = pixelsOf(value);
    return pixels !== null && pixels > HEADING_BLOCK_MAX_PIXELS ? `max-width: ${value} on a section heading block — it stays at ${HEADING_BLOCK_MAX_PIXELS}px (W3)` : '';
  }
  const characters = value.match(/^([\d.]+)ch$/i);
  if (/^none$/i.test(value) || (characters && parseFloat(characters[1]) > LEAD_MAX_CHARACTERS)) return `max-width: ${value} on a section lead — lead text stays at ${LEAD_MAX_CHARACTERS}ch (W3)`;
  return '';
}

const kindOfClasses = (classes) => classes.some((name) => CONTENT_BOX_CLASS.test(name)) ? 'content' : classes.some((name) => HEADING_BLOCK_CLASS.test(name)) ? 'heading' : classes.some((name) => LEAD_CLASS.test(name)) ? 'lead' : '';
const subjectsOf = (selectorList) => selectorList.split(',').map((selector) => selector.trim().split(/\s*[>+~]\s*|\s+/).pop());
const kindsOfSelector = (selectorList) => subjectsOf(selectorList).flatMap((subject) => [CONTENT_BOX_SELECTOR.test(subject) && 'content', HEADING_BLOCK_SELECTOR.test(subject) && 'heading', LEAD_SELECTOR.test(subject) && 'lead'].filter(Boolean));

function pageStyleBlocks(text) {
  return styleBlocks(text).map((block) => ({ start: block.start, css: withoutComments(block.css) })).filter((block) => !SHIPPED_SECTION_CSS.test(block.css));
}

function contentWidthFindings(text, elements) {
  const findings = [];
  for (const block of pageStyleBlocks(text))
    for (const rule of cssRules(block.css))
      for (const kind of kindsOfSelector(rule.selector))
        for (const declaration of declarationsOf(rule.body)) {
          const message = widthDeclarationMessage(kind, declaration);
          if (message) findings.push(finding(text, block.start + rule.braceAt, 'content-width-uncapped', message));
        }
  for (const element of elements) {
    const kind = kindOfClasses(element.classes);
    if (!kind || !element.attributes.style) continue;
    for (const declaration of declarationsOf(element.attributes.style)) {
      const message = widthDeclarationMessage(kind, declaration);
      if (message) findings.push(finding(text, element.tag.index, 'content-width-uncapped', message));
    }
  }
  return findings;
}

const topLevelSections = (elements) => elements.filter((element) => element.name === 'section' && !ancestors(element).some((up) => up.name === 'section'));

function headingAndButtonFindings(text, elements, isPage) {
  const findings = [];
  const sections = topLevelSections(elements);
  if (isPage && sections.some((section) => section.classes.some((name) => name.startsWith('aha-'))) && !elements.some((element) => element.name === 'h1'))
    findings.push(finding(text, 0, 'missing-h1', 'the page has no <h1> — a page has one H1, in the Hero section (W4)'));
  for (const section of sections) {
    if (PRICING_ROOT.test(section.classes.find((name) => name.startsWith('aha-')) || '')) continue;
    const onBrand = section.classes.some((name) => name.endsWith('--brand'));
    const primaries = elements.filter((element) => element.name === 'aha-button' && insideOf(element, section) && ((onBrand && element.attributes['data-variant-brand']) || element.attributes.variant) === 'primary');
    const shown = primaries.filter((element) => !ancestors(element).some((up) => up.attributes.hidden !== undefined));
    const alternatives = shown.filter((element) => ancestors(element).some((up) => up.attributes['data-choice'] !== undefined));
    const counted = [...shown.filter((element) => !alternatives.includes(element)), ...alternatives.slice(0, 1)];
    if (counted.length > 1)
      findings.push(finding(text, counted[1].tag.index, 'multiple-primary-buttons', `${counted.length} primary buttons in one section — each section has at most one primary button (W4)`));
  }
  return findings;
}

function imageAndBrandFindings(text, markup, elements, isPage) {
  const findings = [];
  for (const image of elements.filter((element) => element.name === 'img')) {
    const { alt, role } = image.attributes;
    if (alt === undefined || alt.trim() !== '') continue;
    const decorative = image.attributes['aria-hidden'] === 'true' || /^(?:presentation|none)$/i.test(role || '') || ancestors(image).some((up) => up.attributes['aria-hidden'] === 'true' || (LABELLED_CONTROL.has(up.name) && innerText(innerHtml(markup, up)) !== '')) || (image.parent && innerText(innerHtml(markup, image.parent)) !== '');
    if (!decorative) findings.push(finding(text, image.tag.index, 'img-empty-alt', '<img> with an empty alt that is not marked decorative — a picture carries alt text, or aria-hidden="true" when it is only decoration (W6)'));
  }
  for (const brand of elements.filter((element) => element.classes.includes('aha-header__brand')))
    if (!/<aha-product-lockup[\s>/]/i.test(innerHtml(markup, brand)))
      findings.push(finding(text, brand.tag.index, 'brand-not-lockup', 'the site header brand is not <aha-product-lockup> — use the Navigation section as it ships (W7)'));
  if (isPage && topLevelSections(elements).some((section) => section.classes.some((name) => name.startsWith('aha-'))) && !elements.some((element) => element.classes.includes('aha-header')))
    findings.push(finding(text, 0, 'missing-navigation', 'the page has no Navigation section (aha-header) — the site header is the Navigation section with <aha-product-lockup> (W7)'));
  return findings;
}

function stockHostIn(value) {
  for (const match of value.matchAll(ADDRESS_HOST)) if (STOCK_PHOTO_HOST.test(match[1])) return match[1].toLowerCase();
  return '';
}

function stockPhotoFindings(text, elements) {
  const findings = [];
  const report = (index, host) => findings.push(finding(text, index, 'stock-photo', `an image from ${host}, a stock photo host — photos of people, customers and events come only from the AhaSlides Drive photo library or Customer Love (W6)`));
  for (const element of elements) {
    if (element.name === 'img' || element.name === 'source') {
      const host = stockHostIn(` ${element.attributes.src || ''} ${element.attributes.srcset || ''}`);
      if (host) report(element.tag.index, host);
    }
    const inline = element.attributes.style ? stockHostIn(element.attributes.style) : '';
    if (inline) report(element.tag.index, inline);
  }
  for (const block of pageStyleBlocks(text))
    for (const match of block.css.matchAll(/url\(\s*["']?([^"')]*)/gi)) {
      const host = stockHostIn(` ${match[1]}`);
      if (host) report(block.start + match.index, host);
    }
  return findings;
}

function motionFindings(text, checkInlineScripts) {
  const findings = [];
  for (const tag of htmlTags(text)) {
    if (tag.closing) continue;
    const attributes = attributesOf(text, tag);
    const address = tag.name === 'script' ? attributes.src : tag.name === 'link' ? attributes.href : '';
    if (address && MOTION_LIBRARY.test(address))
      findings.push(finding(text, tag.index, 'motion-library', `"${address}" is an animation library — motion comes from lib/marketing-motion.js alone (W9)`));
  }
  if (!checkInlineScripts) return findings;
  for (const { start, head, body } of rawTextBlocks(text, 'script')) {
    if (/\bsrc\s*=/i.test(head) || /type\s*=\s*["']?(?:application\/(?:ld\+)?json|importmap)/i.test(head)) continue;
    const used = SHIPPED_SECTION_SCRIPT.test(body) ? null : body.match(OWN_MOTION_SCRIPT);
    if (used) findings.push(finding(text, start, 'motion-own-script', `an inline script uses ${used[0].trim()} — no hand-written scroll or parallax script on the page; motion comes from lib/marketing-motion.js (W9)`));
  }
  return findings;
}

function animationDeclarationMessage({ name, value }) {
  if (/^animation(?:-name|-timeline)?$/.test(name) && !INERT_ANIMATION.test(value)) return `${name}: ${value} — the page adds no animation of its own; the only loops are the shipped Logos and photo marquees (W9)`;
  if (/^transition(?:-duration|-timing-function)?$/.test(name) && LITERAL_TIMING.test(value.replace(/var\([^)]*\)/gi, '').replace(/\b0m?s\b/g, '')))
    return `${name}: ${value} — hover transitions use var(--aha-motion-*) and var(--aha-ease-*), never a duration or easing of your own (W9)`;
  return '';
}

function ownAnimationFindings(text, elements) {
  const findings = [];
  for (const block of pageStyleBlocks(text)) {
    for (const keyframes of block.css.matchAll(/@(?:-webkit-)?keyframes\s+[\w-]+/gi))
      findings.push(finding(text, block.start + keyframes.index, 'motion-own-animation', `${keyframes[0]} — the page adds no animation of its own; motion comes from lib/marketing-motion.js (W9)`));
    for (const rule of cssRules(block.css))
      for (const declaration of declarationsOf(rule.body)) {
        const message = animationDeclarationMessage(declaration);
        if (message) findings.push(finding(text, block.start + rule.braceAt, 'motion-own-animation', message));
      }
  }
  for (const element of elements.filter((one) => one.attributes.style))
    for (const declaration of declarationsOf(element.attributes.style)) {
      const message = animationDeclarationMessage(declaration);
      if (message) findings.push(finding(text, element.tag.index, 'motion-own-animation', message));
    }
  return findings;
}

const hostOf = (address) => { const match = (address || '').match(/^https?:\/\/([^/?#:]+)/i); return match ? match[1].toLowerCase() : ''; };
const hasNewTabCue = (markup, link) => /visually-hidden/i.test(innerHtml(markup, link)) && /new tab/i.test(innerText(innerHtml(markup, link))) || /new tab/i.test(link.attributes['aria-label'] || '');

function linkFindings(text, markup, elements) {
  const findings = [];
  const links = elements.filter((element) => (element.name === 'a' || element.name === 'aha-button') && element.attributes.href !== undefined);
  const footer = elements.filter((element) => element.name === 'footer' && element.classes.includes('aha-footer'));
  for (const link of links) {
    const label = innerText(innerHtml(markup, link));
    const cardLink = link.classes.some((name) => CARD_LINK_CLASS.test(name));
    const linkOut = LINK_OUT_LABEL.test(label);
    const footerExternal = footer.some((one) => insideOf(link, one)) && hostOf(link.attributes.href) && !AHASLIDES_PAGE_HOSTS.has(hostOf(link.attributes.href));
    if (!cardLink && !linkOut && !footerExternal) continue;
    const problems = [];
    if (!/^_blank$/i.test(link.attributes.target || '')) problems.push('target="_blank"');
    if (!(link.attributes.rel || '').toLowerCase().split(/\s+/).includes('noopener')) problems.push('rel="noopener"');
    if (!hasNewTabCue(markup, link)) problems.push('the visually-hidden "(opens in a new tab)" text');
    if (problems.length) findings.push(finding(text, link.tag.index, 'card-link-same-tab', `this ${footerExternal ? 'Footer link that leaves AhaSlides' : linkOut ? 'link-out button' : 'content card link'} opens in a new tab and needs ${problems.join(', ')} (W15)`));
  }
  const sameTabZones = elements.filter((element) => element.classes.includes('aha-header') || element.classes.includes('aha-footer-banner') || element.classes.some((name) => /^aha-header-section-hero(?:-|$)/.test(name)));
  for (const link of links)
    if (/^_blank$/i.test(link.attributes.target || '') && sameTabZones.some((zone) => insideOf(link, zone)))
      findings.push(finding(text, link.tag.index, 'new-tab-on-sign-up', 'Sign up, the hero call to action and the Navigation links stay in the same tab (W15)'));
  return findings;
}

export function websiteGuidelineFindings(source) {
  const text = withoutHtmlComments(source);
  const markup = markupOf(text);
  const elements = elementsOf(markup);
  const isPage = /<body[\s>]/i.test(markup) && !DESIGN_SYSTEM_DOCS_PAGE.test(text);
  return [
    ...contentWidthFindings(text, elements),
    ...headingAndButtonFindings(text, elements, isPage),
    ...imageAndBrandFindings(text, markup, elements, isPage),
    ...stockPhotoFindings(text, elements),
    ...motionFindings(text, !DESIGN_SYSTEM_DOCS_PAGE.test(text)),
    ...ownAnimationFindings(text, elements),
    ...linkFindings(text, markup, elements),
  ];
}
