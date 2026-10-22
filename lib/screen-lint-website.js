/*
 * screen-lint website-surface rules — a whole website page made of DS Marketing sections.
 * It is product UI plus: the min-width breakpoints the shipped Marketing sections use are accepted
 * inside @container/@media conditions (list generated from marketing/*.json), and two page rules
 * from the website guideline are checked mechanically (one H1, an alt on every image).
 */
import { MARKETING_MIN_WIDTHS } from './marketing-breakpoints.js';

export const WEBSITE_SURFACES = ['website'];

export const WEBSITE_RULE_GROUPS = {
  page: ['multiple-h1', 'img-no-alt'],
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
