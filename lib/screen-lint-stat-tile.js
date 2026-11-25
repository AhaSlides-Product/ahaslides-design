import { withoutHtmlComments } from './screen-lint-website.js';

export const STAT_TILE_RULE_GROUPS = { 'stat-tile-accent': ['stat-tile-accent'] };

const STAT_TILE_TAG = /<(aha-stat-tile|AhaStatTile)\b((?:[^>"'{]|"[^"]*"|'[^']*'|\{[^}]*\})*)>/g;
const ACCENT_LOOK = /(?:^|\s):?look\s*=\s*(?:"'?accent'?"|'"?accent"?'|\{\s*["'`]accent["'`]\s*\})/;
const META_TAG = /<meta\b[^>]*>/gi;
const SURFACE_NAME = /\bname\s*=\s*["']?aha-surface["']?(?=[\s/>]|$)/i;
const SURFACE_REPORT = /\bcontent\s*=\s*["']?report["']?(?=[\s/>]|$)/i;
const MESSAGE = 'more than one <aha-stat-tile look="accent"> in one file: on an app screen the accent look is the emphasis look, the one highlighted panel colour rule 3.7 allows per screen and the only Stat tile with a pink bar (rule 6.8); leave the rest plain (soft grey bar), or justify with ds-lint-allow: stat-tile-accent (why). A report page (head line <meta name="aha-surface" content="report">) may carry as many accent tiles as it needs (rule 3.11)';

const isReportPage = (html) => {
  for (const tag of html.matchAll(META_TAG)) {
    if (SURFACE_NAME.test(tag[0]) && SURFACE_REPORT.test(tag[0])) return true;
  }
  return false;
};

export function statTileAccentFindings(text) {
  const visible = withoutHtmlComments(text);
  if (isReportPage(visible)) return [];
  const accent = [];
  for (const tag of visible.matchAll(STAT_TILE_TAG)) {
    if (!ACCENT_LOOK.test(tag[2])) continue;
    const line = text.slice(0, tag.index).split('\n').length;
    accent.push({ line, endLine: line + tag[0].split('\n').length - 1 });
  }
  return accent.slice(1).map(({ line, endLine }) => ({ line, endLine, rule: 'stat-tile-accent', message: MESSAGE, severity: 'hard' }));
}
