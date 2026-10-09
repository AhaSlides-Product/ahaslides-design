/*
 * screen-lint core — the pure, side-effect-free engine behind screen-lint.mjs.
 * No fs, no process, no console: runs in Node, browsers and Cloudflare workerd.
 * Public entry: `lintHtml(source, { surface, path?, iconNames? })` -> `{ path, findings }`.
 */
import { ICON_NAMES } from './icon-names.js';

const RADIUS_SCALE = new Set([0, 4, 6, 8, 12, 16, 999, 9999]);
const RESPONSIVE_FLOOR = 360;
const ICON_GALLERY = 'https://design.ahaslides.io/icons/index.html';
const KNOWN_ICON_NAMES = new Set(ICON_NAMES);

const RULE_GROUPS = {
  gradient: ['gradient-fill'],
  radius: ['radius-off-scale'],
  responsive: ['min-width-trap', 'overflow-x-scroll'],
  chart: ['chart-lib-import'],
  icon: ['unknown-icon'],
  a11y: ['icon-only-no-name'],
  hex: ['raw-hex', 'canvas-hardcoded-colour'],
  font: ['canvas-hardcoded-font'],
  weight: ['off-scale-weight'],
  lockup: ['hand-set-lockup'],
};
const ALLOW_MARKER = /ds-lint-allow\b(?::\s*([a-z][a-z-]*(?:\s*,\s*[a-z][a-z-]*)*)\s*\(([^)]*\S[^)]*)\))?/i;

function parseAllow(line) {
  const match = line.match(ALLOW_MARKER);
  if (!match) return { present: false, rules: new Set() };
  if (!match[1]) return { present: true, bare: true, rules: new Set() };
  const rules = new Set();
  for (const id of match[1].toLowerCase().split(/\s*,\s*/)) {
    rules.add(id);
    for (const grouped of RULE_GROUPS[id] || []) rules.add(grouped);
  }
  return { present: true, bare: false, rules };
}

// Icon names literally referenced on a line — the element form and the data-prop form, mirroring
// standards.mjs iconRefs(). Only a literal that looks like an icon name (kebab, carries a "-") is
// checked; a dynamic binding with no literal is left to runtime.
function iconNamesIn(line) {
  const names = new Set();
  for (const tag of line.match(/<aha-icon\b[^>]*>/gi) || []) {
    const m = tag.match(/(?::|\s)name\s*=\s*(?:"([^"]*)"|'([^']*)')/i);
    const s = m && (m[1] ?? m[2]);
    if (s && /^[^"'{}?()\s]+$/.test(s) && s.includes('-')) names.add(s);
  }
  for (const m of line.matchAll(/(?<![\w-])icon\\?["']?\s*[:=]\s*\\?["']([^"'\\]+)\\?["']/gi)) {
    const s = m[1];
    if (/^[^"'{}?()\s]+$/.test(s) && s.includes('-')) names.add(s);
  }
  return names;
}

/* CSS-value contexts we scan for colour/gradient/radius/font — avoids hex in a URL, id, or href. */
const COLOR_PROP = /(?:^|[;{"'\s])(?:color|background(?:-color|-image)?|fill|stroke|border(?:-[a-z]+)?|box-shadow|outline|caret-color)\s*:/i;
const styleText = (line) => {
  // Scan the line ONCE if it carries CSS (an inline style attr, a colour attribute like the badge
  // `color="…"`, or a bare CSS property in a <style>/theme block). Scanning the whole line once —
  // rather than the attr AND the line — avoids double-reporting the same hit.
  if (/style\s*=|(?:^|[\s;{])color\s*=|border-radius|font-size|font-family|gradient/i.test(line) || COLOR_PROP.test(line))
    return line;
  return '';
};
// strip var(--aha-…, #fallback) so a token fallback is never mistaken for a bare literal
const stripVars = (s) => s.replace(/var\([^)]*\)/gi, ' ');

const AHASLIDES_MARK = /\b(?:thesplash|ahaslides-logo)(?:-white|-black)?\.svg\b/i;
const HEADER_BRAND_CLASS = /\b(?:class|className|id)\s*=\s*["'{][^"'}]*\b(?:brand|logo|header|navbar|nav-bar|topbar|top-bar|masthead|rail)/i;
const regionDepthChange = (line) =>
  (line.match(/<(?:header|nav)\b/gi) || []).length - (line.match(/<\/(?:header|nav)\s*>/gi) || []).length;

/* ---- the rules ---- */
// severity: 'hard' fails the build; 'warn' never does.
function lintSource(text, surf, knownIcons) {
  const lines = text.split(/\r?\n/);
  const hard = [], warn = [];
  let primaryCount = 0;
  let headerDepth = 0;

  lines.forEach((raw, i) => {
    const L = `L${i + 1}`;
    const allow = parseAllow(raw);
    const ok = (ruleId) => allow.rules.has(ruleId);
    if (allow.bare)
      warn.push([`${L}`, 'ds-lint-allow-bare', 'bare ds-lint-allow no longer suppresses anything — name the rule(s) and give a reason: ds-lint-allow: <rule-id>[,<rule-id>] (<reason>)']);
    const css = stripVars(styleText(raw));
    const inHeader = headerDepth > 0 || /<(?:header|nav)\b/i.test(raw);
    headerDepth = Math.max(0, headerDepth + regionDepthChange(raw));

    // WARN, not hard: existing headers still show the logo file; promote once consumers have migrated
    if (!ok('hand-set-lockup') && AHASLIDES_MARK.test(raw) && !/aha-product-lockup/i.test(raw)
        && (inHeader || HEADER_BRAND_CLASS.test(raw)))
      warn.push([`${L}`, 'hand-set-lockup', 'the AhaSlides logo or The Splash set by hand in a header or nav: the top-left brand of every site, microsite and app header is <aha-product-lockup product="<name>"> (no product attribute when no name is approved) — https://design.ahaslides.io/product-lockup/index.html']);

    /* ---- shared HARD ---- */
    // gradient on a background/fill (border-image AI-affordance is the documented exception)
    if (!ok('gradient-fill') && /(linear|radial|conic)-gradient/i.test(css)
        && /(background|fill)/i.test(css) && !/border-image|mask/i.test(css))
      hard.push([`${L}`, 'gradient-fill', 'gradient on a background/fill — backgrounds are flat; only a border-image AI-affordance may gradient']);

    // off-scale border-radius
    if (!ok('radius-off-scale'))
      for (const m of css.matchAll(/border-radius\s*:\s*([0-9.]+)px/gi))
        if (!RADIUS_SCALE.has(parseFloat(m[1])))
          hard.push([`${L}`, 'radius-off-scale', `border-radius ${m[1]}px is off the 4/6/8/12/16 scale`]);

    // responsive: a fixed min-width ≥ the 360px phone floor can't reflow — it forces a horizontal scroll
    if (!ok('min-width-trap'))
      for (const m of stripVars(raw).matchAll(/min-width\s*:\s*([0-9]+)px/gi))
        if (parseFloat(m[1]) >= RESPONSIVE_FLOOR)
          hard.push([`${L}`, 'min-width-trap', `min-width ${m[1]}px is at/above the ${RESPONSIVE_FLOOR}px phone floor — the screen can't reflow on a phone (horizontal scroll). Use a fluid width (max-width/%/min()), or justify with ds-lint-allow: responsive (why)`]);
    // responsive (WARN): overflow-x scroll/auto papers over a layout that doesn't fit — reflow instead of scroll
    if (!ok('overflow-x-scroll'))
      for (const m of stripVars(raw).matchAll(/overflow-x\s*:\s*(scroll|auto)/gi))
        warn.push([`${L}`, 'overflow-x-scroll', `overflow-x: ${m[1]} — a horizontal scroll usually hides a non-reflowing layout; prefer wrapping/stacking on small screens (a wide data table is the legitimate exception)`]);

    if (!ok('chart-lib-import')) {
      const lib = raw.match(/(?:from\s+|import\s*\(?\s*|require\(\s*)['"](chart\.js(?:\/[^'"]*)?|react-chartjs-2|recharts|echarts(?:-for-react)?|d3(?:-[a-z-]+)?|highcharts(?:-react-official)?|apexcharts|react-apexcharts|victory|@nivo\/[a-z-]+|vue-chartjs)['"]/i);
      if (lib)
        hard.push([`${L}`, 'chart-lib-import', `"${lib[1]}" — result/data charts use the DS <aha-chart>; @ant-design/plots only for a type <aha-chart> does not ship`]);
    }

    // unknown icon name — a name that isn't in the DS registry renders the dashed error box at runtime
    if (!ok('unknown-icon') && knownIcons)
      for (const nm of iconNamesIn(raw))
        if (!knownIcons.has(nm))
          hard.push([`${L}`, 'unknown-icon', `icon "${nm}" is not a glyph in the DS icon library — it renders as a dashed error box. Pick a real name from the gallery (${ICON_GALLERY}) or add the SVG to the DS`]);

    // icon-only interactive control with no accessible name
    const iconOnlyBtn = /<aha-button\b[^>]*\bicon-only\b[^>]*>/i.test(raw);
    const bareIconBtn = /<button\b[^>]*>\s*(?:<aha-icon\b|<svg\b|<i\b)[^<]*(?:<\/aha-icon>|<\/svg>|<\/i>)?\s*<\/button>/i.test(raw);
    if (!ok('icon-only-no-name') && (iconOnlyBtn || bareIconBtn)
        && !/aria-label\s*=|aria-labelledby\s*=|title\s*=/i.test(raw))
      hard.push([`${L}`, 'icon-only-no-name', 'icon-only control has no accessible name — add aria-label (X2)']);

    /* ---- world-specific colour ---- */
    const hexes = (css.match(/#[0-9A-Fa-f]{3,8}\b/g) || []);
    const funcs = (css.match(/\b(?:rgba?|hsla?)\s*\(/gi) || []);
    if (surf === 'canvas') {
      // Canvas/Audience: colour + font come from the deck (xprops) at runtime — nothing hardcoded.
      if (!ok('canvas-hardcoded-colour') && (hexes.length || funcs.length))
        hard.push([`${L}`, 'canvas-hardcoded-colour', `hardcoded colour ${(hexes[0] || funcs[0])} — canvas colour must read from the deck theme (xprops), never a literal (C1)`]);
      for (const m of css.matchAll(/font-size\s*:\s*([^;}"']*)/gi)) {
        const v = m[1];
        if (/[\d.](?:vw|vh|vmin|vmax)\b|clamp\(/i.test(v))
          hard.push([`${L}`, 'canvas-viewport-font', `font-size ${v.trim()} uses a viewport unit/clamp — resolves wrong under the stage transform (CV4)`]);
        const px = (v.match(/([0-9.]+)px/) || [])[1];
        if (px && parseFloat(px) < 16)
          hard.push([`${L}`, 'canvas-tiny-font', `font-size ${px}px is below the 16px canvas floor — illegible from the back of the room (CV4)`]);
      }
      if (!ok('canvas-hardcoded-font') && /font-family\s*:/i.test(css))
        warn.push([`${L}`, 'canvas-hardcoded-font', 'font-family literal on canvas — font should read from the deck theme (xprops)']);
    } else {
      // Product UI: colour binds to a --aha-* token; a bare hex is a defect (border-image excepted).
      if (!ok('raw-hex'))
        for (const h of hexes)
          hard.push([`${L}`, 'raw-hex', `bare hex ${h} — bind to a token: var(--aha-…, ${h})`]);
      // the product type scale is weights 400/600 ONLY — 500/700/bold are off-scale
      if (!ok('off-scale-weight'))
        for (const m of css.matchAll(/font-weight\s*:\s*(\d{3}|bold(?:er)?)\b/gi)) {
          const w = m[1].toLowerCase();
          const n = /^bold/.test(w) ? 700 : parseInt(w, 10);
          if (n !== 400 && n !== 600)
            hard.push([`${L}`, 'off-scale-weight', `font-weight ${m[1]} — the type scale is 400/600 only (PU10)`]);
        }
    }

    /* ---- product-UI region heuristics (WARN — never fail; meaningless on a component snippet) ---- */
    if (surf === 'product') {
      if (/\b(?:variant|type)\s*=\s*["']primary["']|class\s*=\s*["'][^"']*\bprimary[^"']*btn/i.test(raw)) primaryCount++;
      // box-in-a-box: a bordered/card container whose style also sits on a line that opens another
      if (/border\s*:|box-shadow\s*:|class\s*=\s*["'][^"']*\bcard\b/i.test(raw)
          && /<[a-z][^>]*(border\s*:|box-shadow\s*:|class\s*=\s*["'][^"']*\bcard\b)[^>]*>.*<[a-z][^>]*(border\s*:|box-shadow\s*:|\bcard\b)/i.test(raw))
        warn.push([`${L}`, 'box-in-box', 'a bordered/card container nested directly inside another — hierarchy is space, not nested boxes (PU2)']);
    }
  });

  if (surf === 'product' && primaryCount > 1)
    warn.push(['—', 'multi-primary', `${primaryCount} primary actions detected — a view has ONE loud action (PU1). (heuristic: ignore if these are separate regions/a component demo)`]);

  // one finding per (line, rule, message) — a hit seen in >1 CSS context is still one defect
  const uniq = (arr) => [...new Map(arr.map(f => [f.join('|'), f])).values()];
  return { hard: uniq(hard), warn: uniq(warn) };
}

const toFinding = (severity) => ([where, rule, message]) =>
  ({ rule, line: where === '—' ? 0 : parseInt(where.slice(1), 10), message, severity });

export function lintHtml(source, { surface, path = '', iconNames } = {}) {
  if (surface !== 'product' && surface !== 'canvas')
    throw new Error('lintHtml: surface must be "product" or "canvas"');
  const knownIcons = iconNames ? new Set(iconNames) : KNOWN_ICON_NAMES;
  const { hard, warn } = lintSource(String(source), surface, knownIcons);
  const findings = [...hard.map(toFinding('hard')), ...warn.map(toFinding('warn'))];
  return { path, findings };
}


