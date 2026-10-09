/**
 * Docs-site global search — the header field, its client runtime, and the build-time index.
 *
 * The index is crawled from the BUILT site (every dist/**.html page, its h1/subtitle and anchored
 * headings) and enriched from the same sources the site is generated from: contracts (element,
 * props, variant options), the icon registry and the --aha-* token layer. It ships as one static
 * dist/search-index.json, fetched lazily on first open — GitHub Pages has no backend.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

/* One DS glyph per result type — every name must resolve in icons/registry.json. */
const SEARCH_TYPE_ICONS = {
  component: 'system-squares-four',
  guideline: 'system-book-simple',
  foundation: 'system-palette',
  audience: 'system-users-three',
  feed: 'system-code',
  page: 'system-file',
  section: 'system-paragraph',
  token: 'system-sliders-horizontal',
  more: 'system-arrow-right',
};
export const SEARCH_GLYPHS = [...new Set([
  ...Object.values(SEARCH_TYPE_ICONS),
  'system-magnifying-glass', 'system-magnifying-glass-exclamation', 'system-x', 'system-warning-circle',
  'system-circle-notch', 'system-arrow-up', 'system-arrow-down', 'system-key-return',
])];

const GROUPS = [
  ['component', 'Components'], ['guideline', 'Guidelines'], ['foundation', 'Foundations'],
  ['token', 'Tokens'], ['icon', 'Icons'], ['audience', 'Audience Library'],
  ['section', 'Sections'], ['page', 'Pages'], ['feed', 'Agent feeds'],
];
const AREAS = {
  overview: { type: 'page', label: 'Overview' },
  foundations: { type: 'foundation', label: 'Foundations' },
  components: { type: 'component', label: 'Components' },
  patterns: { type: 'component', label: 'Patterns' },
  settings: { type: 'component', label: 'Settings' },
  audience: { type: 'audience', label: 'Audience Library' },
  charts: { type: 'component', label: 'Charts' },
  guidelines: { type: 'guideline', label: 'Guidelines' },
  developers: { type: 'page', label: 'For developers' },
  feeds: { type: 'feed', label: 'Agent feeds' },
};

const decode = (s) => s.replace(/&nbsp;/g, ' ').replace(/&mdash;/g, '—').replace(/&rarr;/g, '→').replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
function stripTags(html) {
  let text = String(html || ''), previous;
  do { previous = text; text = text.replace(/<[^>]*>/g, ' '); } while (text !== previous);
  return text.replace(/[<>]/g, ' ');
}
const textOf = (html) => decode(stripTags(html)).replace(/\s+/g, ' ').trim();
const slugify = (s) => textOf(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'section';
const PROTECTED_TAGS = ['script', 'style', 'pre', 'template'];
/* Split HTML into alternating [content, protected block, content, …] — script/style/pre/template
   bodies are code or live preview, never docs prose, so headings inside them are left alone. */
function splitProtected(html) {
  const lower = html.toLowerCase(), chunks = [];
  let cursor = 0;
  for (;;) {
    let start = -1, tag = '';
    for (const candidate of PROTECTED_TAGS) {
      const at = lower.indexOf('<' + candidate, cursor);
      if (at >= 0 && (start < 0 || at < start) && /[\s>]/.test(lower[at + candidate.length + 1] || '')) { start = at; tag = candidate; }
    }
    if (start < 0) break;
    const close = lower.indexOf('</' + tag, start);
    const end = close < 0 ? html.length : lower.indexOf('>', close) + 1 || html.length;
    chunks.push(html.slice(cursor, start), html.slice(start, end));
    cursor = end;
  }
  chunks.push(html.slice(cursor));
  return chunks;
}
const stripNonContent = (html) => splitProtected(html).filter((_, index) => index % 2 === 0).join(' ');

/* A heading is a docs heading (anchor + index it) when it carries no class, or one of the docs
   classes — never a class from a live preview (aha-section__title, aha-type__h2, …). */
const DOC_HEADING = /<(h2|h3)((?:\s+(?:class="(?:grp-h|tok-h3|pat-h3)"|style="[^"]*"|id="[^"]*"))*)\s*>([\s\S]*?)<\/\1>/g;

/** Give every docs heading in a page's main HTML a stable id so search results can deep-link to it.
 *  Script/pre/style blocks are left untouched; existing ids are kept. */
export function anchorHeadings(html) {
  const used = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]));
  return splitProtected(html).map((chunk, index) => index % 2 ? chunk : chunk.replace(DOC_HEADING, (whole, tag, attrs, inner) => {
    if (/\bid="/.test(attrs) || (tag === 'h3' && !/class="(tok-h3|pat-h3)"/.test(attrs))) return whole;
    const slug = slugify(inner);
    let id = slug, n = 2;
    while (used.has(id)) id = `${slug}-${n++}`;
    used.add(id);
    return `<${tag} id="${id}"${attrs}>${inner}</${tag}>`;
  })).join('');
}

function walkHtml(dir) {
  return readdirSync(dir).flatMap(name => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return walkHtml(full);
    return name.endsWith('.html') && !name.startsWith('_') ? [full] : [];
  });
}

/** Crawl the built site + enrich from the DS sources → the search index object. */
export function buildSearchIndex({ outDir, contracts, icons, tokenCss, version }) {
  const items = [];
  const add = (type, title, url, subtitle = '', keywords = '', extra = {}) =>
    items.push({ t: type, n: title, u: url, s: subtitle, k: keywords, ...extra });
  const bySlug = new Map(contracts.map(c => [c.slug, c]));
  const pageText = [];

  for (const file of walkHtml(outDir)) {
    const url = relative(outDir, file).split(sep).join('/');
    const html = readFileSync(file, 'utf8');
    const area = (html.match(/class="doc-body" data-section="([^"]+)"/) || [])[1];
    if (!area) continue;
    const main = stripNonContent((html.match(/<main class="doc-main">([\s\S]*)<\/main>/) || [])[1] || '');
    const title = textOf((main.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/) || [])[1]) || url;
    const subtitle = textOf((main.match(/<p class="subtitle">([\s\S]*?)<\/p>/) || [])[1]);
    const slug = url.endsWith('/index.html') ? url.split('/').slice(-2)[0] : '';
    const c = bySlug.get(slug) || contracts.find(x => x.docPage === url);
    const keywords = c ? [
      c.element && `<${c.element}>`, c.group, c.badge,
      ...(c.props || []).map(p => p.name),
      ...((c.playground && c.playground.controls) || []).flatMap(ctl => (ctl.options || []).map(o => o.label)),
    ].filter(Boolean).join(' ') : '';
    const { type, label } = AREAS[area] || { type: 'page', label: '' };
    const titleShort = title.split(' — ')[0].trim();
    add(type, titleShort, url, subtitle || label, keywords, { a: label || undefined });

    const headings = [];
    for (const m of main.matchAll(/<(h2|h3) id="([^"]+)"[^>]*>([\s\S]*?)<\/\1>/g)) {
      const text = textOf(m[3]);
      if (!text) continue;
      headings.push({ id: m[2], index: m.index });
      const headingType = area === 'audience' ? 'audience' : 'section';
      add(headingType, text, `${url}#${m[2]}`, label ? `${titleShort} · ${label}` : titleShort);
    }
    pageText.push({ url, main, headings, area });
  }

  // Tokens deep-link to the Foundations heading they are shown under; anything unlisted there
  // lands on the raw variables.css feed.
  const foundationPages = pageText.filter(p => p.area === 'foundations');
  for (const m of tokenCss.matchAll(/(--aha-[a-z0-9-]+)\s*:\s*([^;]+);/g)) {
    const [, name, value] = m;
    let url = 'feeds/variables-css.html';
    for (const p of foundationPages) {
      const at = p.main.search(new RegExp(name + '(?![a-z0-9-])'));
      if (at < 0) continue;
      const heading = p.headings.filter(h => h.index < at).pop();
      url = heading ? `${p.url}#${heading.id}` : p.url;
      break;
    }
    const isColour = /^(#|rgba?\(|hsla?\()/i.test(value.trim());
    add('token', name, url, value.trim(), name.replace(/^--aha-/, '').replace(/-/g, ' '), isColour ? { v: value.trim() } : {});
  }

  for (const [name, meta] of Object.entries(icons.icons || {})) {
    add('icon', name, `icons/index.html?q=${encodeURIComponent(name)}`, `${meta.family} icon`, name.replace(/^[a-z]+-/, '').replace(/-/g, ' '), { i: name });
  }

  return { version, groups: GROUPS, typeIcons: SEARCH_TYPE_ICONS, count: items.length, items };
}

/** The header widget. `base` is the page's relative prefix to the site root. */
export function searchHeaderHtml(base) {
  return `<div class="ds-search" data-root="${base}" role="search">
    <button class="ds-search-toggle" type="button" aria-label="Search the design system" aria-expanded="false"><aha-icon name="system-magnifying-glass" size="16" decorative></aha-icon></button>
    <div class="ds-search-box">
      <aha-icon class="ds-search-glass" name="system-magnifying-glass" size="16" decorative></aha-icon>
      <input class="ds-search-input" type="text" role="combobox" aria-label="Search the design system" aria-autocomplete="list" aria-expanded="false" aria-controls="ds-search-list" placeholder="Search the design system" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="search"/>
      <kbd class="ds-search-kbd" aria-hidden="true" title="Press / or Ctrl K to search">/</kbd>
      <button class="ds-search-close" type="button" aria-label="Close search"><aha-icon name="system-x" size="16" decorative></aha-icon></button>
    </div>
    <div class="ds-search-panel" data-open="false">
      <div class="ds-search-state"></div>
      <div class="ds-search-list" id="ds-search-list" role="listbox" aria-label="Search results" tabindex="-1"></div>
      <div class="ds-search-foot" aria-hidden="true"><span><kbd><aha-icon name="system-arrow-up" size="12" decorative></aha-icon></kbd><kbd><aha-icon name="system-arrow-down" size="12" decorative></aha-icon></kbd> to move</span><span><kbd><aha-icon name="system-key-return" size="12" decorative></aha-icon></kbd> to open</span><span><kbd>Esc</kbd> to close</span></div>
      <div class="ds-search-live" role="status" aria-live="polite"></div>
    </div>
  </div>`;
}

export const SEARCH_CSS = `
.ds-search{position:relative;flex:0 0 auto;display:flex;align-items:center}
.ds-search-toggle{display:none;align-items:center;justify-content:center;width:var(--aha-control-height-root);height:var(--aha-control-height-root);padding:0;border:1px solid transparent;border-radius:var(--aha-radius-default);background:transparent;color:var(--aha-icon-default);cursor:pointer;transition:background var(--aha-motion-fast) var(--aha-ease-out),color var(--aha-motion-fast) var(--aha-ease-out)}
.ds-search-toggle:hover{background:var(--aha-bg-hover);color:var(--aha-color-primary)}
.ds-search-toggle:focus-visible,.ds-search-close:focus-visible{outline:none;box-shadow:0 0 0 var(--aha-space-2) var(--aha-focus-ring-soft);border-color:var(--aha-border-focus)}
.ds-search-box{position:relative;display:flex;align-items:center;width:min(calc(var(--aha-space-100) * 2.4),24vw);min-width:calc(var(--aha-space-100) * 1.6);height:var(--aha-control-height-root);border:1px solid var(--aha-border-input);border-radius:var(--aha-radius-default);background:var(--aha-bg-container);transition:border-color var(--aha-motion-fast) var(--aha-ease-out),box-shadow var(--aha-motion-fast) var(--aha-ease-out),width var(--aha-motion-mid) var(--aha-ease-out)}
.ds-search-box:hover{border-color:var(--aha-border-hover)}
.ds-search-box:focus-within{border-color:var(--aha-border-focus);box-shadow:0 0 0 var(--aha-space-2) var(--aha-focus-ring-soft);width:min(calc(var(--aha-space-100) * 3.2),32vw)}
.ds-search-glass{position:absolute;left:var(--aha-space-10);color:var(--aha-icon-muted);pointer-events:none}
.ds-search-input{flex:1 1 auto;min-width:0;height:100%;padding:0 var(--aha-space-8) 0 calc(var(--aha-space-10) + var(--aha-space-24));border:0;background:transparent;outline:none;font-family:var(--aha-font-product);font-size:var(--aha-size-default);color:var(--aha-text-default)}
.ds-search-input::placeholder{color:var(--aha-text-placeholder)}
.ds-search-kbd,.ds-search-foot kbd{display:inline-flex;align-items:center;justify-content:center;min-width:var(--aha-space-20);height:var(--aha-space-20);padding:0 var(--aha-space-6);border:1px solid var(--aha-border-default);border-radius:var(--aha-radius-xs);background:var(--aha-bg-container-secondary);font-family:var(--aha-font-product);font-size:var(--aha-size-sm);line-height:1;color:var(--aha-text-tertiary)}
.ds-search-kbd{margin-right:var(--aha-space-8);transition:opacity var(--aha-motion-fast) var(--aha-ease-out)}
.ds-search-box:focus-within .ds-search-kbd{opacity:0}
.ds-search-close{display:none;align-items:center;justify-content:center;flex:0 0 auto;width:var(--aha-control-height-root);height:var(--aha-control-height-root);padding:0;border:1px solid transparent;border-radius:var(--aha-radius-default);background:transparent;color:var(--aha-icon-default);cursor:pointer;transition:background var(--aha-motion-fast) var(--aha-ease-out)}
.ds-search-close:hover{background:var(--aha-bg-hover)}

.ds-search-panel{position:absolute;top:calc(100% + var(--aha-space-8));right:0;z-index:40;width:min(calc(var(--aha-space-100) * 5.6),calc(100vw - var(--aha-space-32)));max-height:min(calc(var(--aha-space-100) * 5.2),calc(100vh - var(--aha-space-96)));display:flex;flex-direction:column;background:var(--aha-bg-elevated);border:1px solid var(--aha-border-secondary);border-radius:var(--aha-radius-lg);box-shadow:0 var(--aha-space-8) var(--aha-space-24) var(--aha-ink-a10);overflow:hidden;opacity:0;visibility:hidden;transform:translateY(calc(var(--aha-space-4) * -1));transition:opacity var(--aha-motion-mid) var(--aha-ease-out),transform var(--aha-motion-mid) var(--aha-ease-out),visibility 0s linear var(--aha-motion-mid)}
.ds-search-panel[data-open="true"]{opacity:1;visibility:visible;transform:none;transition:opacity var(--aha-motion-mid) var(--aha-ease-out),transform var(--aha-motion-mid) var(--aha-ease-out),visibility 0s linear 0s}
.ds-search-list{overflow-y:auto;overscroll-behavior:contain;padding:0 var(--aha-space-8)}
.ds-search-list:not(:empty){padding:var(--aha-space-8)}
.ds-search-group+.ds-search-group{margin-top:var(--aha-space-8)}
.ds-search-group-h{display:flex;justify-content:space-between;align-items:center;padding:var(--aha-space-6) var(--aha-space-8);font-size:var(--aha-size-sm);line-height:var(--aha-space-16);font-weight:var(--aha-weight-semibold);letter-spacing:var(--aha-letter-spacing-subtext);text-transform:uppercase;color:var(--aha-text-tertiary)}
.ds-search-group-h b{font-weight:var(--aha-weight-regular)}
.ds-search-opt{display:flex;align-items:center;gap:var(--aha-space-10);min-height:var(--aha-control-height-lg);padding:var(--aha-space-6) var(--aha-space-8);border-radius:var(--aha-radius-default);color:var(--aha-text-default);text-decoration:none;cursor:pointer;transition:background var(--aha-motion-fast) var(--aha-ease-out),color var(--aha-motion-fast) var(--aha-ease-out)}
.ds-search-opt:hover{background:var(--aha-bg-hover)}
.ds-search-opt[aria-selected="true"]{background:var(--aha-bg-accent);color:var(--aha-text-default)}
.ds-search-lead{flex:0 0 auto;display:inline-flex;align-items:center;justify-content:center;width:var(--aha-space-28);height:var(--aha-space-28);border-radius:var(--aha-radius-sm);background:var(--aha-bg-container-secondary);color:var(--aha-icon-default)}
.ds-search-opt[aria-selected="true"] .ds-search-lead{background:var(--aha-bg-container);color:var(--aha-color-primary)}
.ds-search-swatch{width:var(--aha-space-16);height:var(--aha-space-16);border-radius:var(--aha-radius-xs);border:1px solid var(--aha-border-secondary)}
.ds-search-txt{flex:1 1 auto;min-width:0;display:flex;flex-direction:column}
.ds-search-t{font-size:var(--aha-size-default);line-height:var(--aha-space-20);font-weight:var(--aha-weight-semibold);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ds-search-s{font-size:var(--aha-size-sm);line-height:var(--aha-space-16);color:var(--aha-text-tertiary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ds-search-t mark{background:transparent;color:var(--aha-color-primary);text-decoration:underline;text-underline-offset:var(--aha-space-2)}
.ds-search-go{flex:0 0 auto;color:var(--aha-icon-muted);opacity:0;transition:opacity var(--aha-motion-fast) var(--aha-ease-out)}
.ds-search-opt[aria-selected="true"] .ds-search-go{opacity:1;color:var(--aha-color-primary)}
.ds-search-state{color:var(--aha-text-secondary);font-size:var(--aha-size-default)}
.ds-search-state:not(:empty){display:flex;flex-direction:column;align-items:center;gap:var(--aha-space-8);padding:var(--aha-space-28) var(--aha-space-20);text-align:center}
.ds-search-state b{color:var(--aha-text-default);font-weight:var(--aha-weight-semibold)}
.ds-search-state .ds-search-hint{color:var(--aha-text-tertiary);font-size:var(--aha-size-sm)}
.ds-search-state aha-icon{color:var(--aha-icon-muted)}
.ds-search-state[data-kind="error"] aha-icon{color:var(--aha-color-error)}
.ds-search-retry{margin-top:var(--aha-space-4);height:var(--aha-control-height-root);padding:0 var(--aha-space-16);border:1px solid var(--aha-button-default-border);border-radius:var(--aha-radius-default);background:var(--aha-button-default-bg);color:var(--aha-button-default-text);font-family:var(--aha-font-product);font-size:var(--aha-size-default);cursor:pointer;transition:background var(--aha-motion-fast) var(--aha-ease-out),border-color var(--aha-motion-fast) var(--aha-ease-out)}
.ds-search-retry:hover{background:var(--aha-button-default-bg-hover);border-color:var(--aha-button-default-border-hover)}
.ds-search-spin{animation:ds-search-spin calc(var(--aha-motion-slow) * 3) linear infinite}
@keyframes ds-search-spin{to{transform:rotate(360deg)}}
.ds-search-chips{display:flex;flex-wrap:wrap;justify-content:center;gap:var(--aha-space-6)}
.ds-search-chip{height:var(--aha-control-height-sm);padding:0 var(--aha-space-10);border:1px solid var(--aha-border-secondary);border-radius:var(--aha-radius-pill);background:var(--aha-bg-container);color:var(--aha-text-secondary);font-family:var(--aha-font-product);font-size:var(--aha-size-sm);cursor:pointer;transition:border-color var(--aha-motion-fast) var(--aha-ease-out),color var(--aha-motion-fast) var(--aha-ease-out)}
.ds-search-chip:hover{border-color:var(--aha-color-primary);color:var(--aha-color-primary)}
.ds-search-foot{display:flex;flex-wrap:wrap;gap:var(--aha-space-16);padding:var(--aha-space-8) var(--aha-space-16);border-top:1px solid var(--aha-border-secondary);background:var(--aha-bg-container-secondary);font-size:var(--aha-size-sm);color:var(--aha-text-tertiary)}
.ds-search-foot span{display:inline-flex;align-items:center;gap:var(--aha-space-4)}
.ds-search-live{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}

/* ---- header reflow: tabs scroll instead of pushing the page wide ---- */
.top-nav{min-width:0;overflow-x:auto;scrollbar-width:none}
.top-nav::-webkit-scrollbar{display:none}
.top-nav a{flex:0 0 auto}
/* frees enough header width to fit every top-nav tab with no internal scroll at 1440px — the
   site's widest responsive-check width (screen-lint.mjs --measure) */
@media (max-width:1489px){.hmeta>span{display:none}.doc-header{gap:var(--aha-space-16)}}
@media (max-width:767px){
  .doc-header{padding:0 var(--aha-space-16);gap:var(--aha-space-8)}
  .hmeta{display:none}
  .top-nav a{padding:0 var(--aha-space-10)}
  .ds-search{position:static}
  .ds-search-toggle{display:inline-flex}
  .ds-search-box{position:absolute;inset:0;z-index:41;width:auto;min-width:0;height:auto;padding:0 var(--aha-space-8) 0 var(--aha-space-16);border:0;border-radius:0;box-shadow:none;background:var(--aha-bg-container);opacity:0;visibility:hidden;transition:opacity var(--aha-motion-mid) var(--aha-ease-out),visibility 0s linear var(--aha-motion-mid)}
  .ds-search-box:focus-within{width:auto;box-shadow:none}
  .ds-search[data-expanded="true"] .ds-search-box{opacity:1;visibility:visible;transition:opacity var(--aha-motion-mid) var(--aha-ease-out),visibility 0s linear 0s}
  .ds-search-glass{left:calc(var(--aha-space-16) + var(--aha-space-10))}
  .ds-search-input{height:var(--aha-control-height-lg);border:1px solid var(--aha-border-focus);border-radius:var(--aha-radius-default);box-shadow:0 0 0 var(--aha-space-2) var(--aha-focus-ring-soft);font-size:var(--aha-size-l)}
  .ds-search-kbd{display:none}
  .ds-search-close{display:inline-flex;margin-left:var(--aha-space-4)}
  .ds-search-panel{position:fixed;top:var(--aha-space-64);left:0;right:0;width:auto;max-height:calc(100vh - var(--aha-space-64));border-radius:0;border-width:1px 0 0}
  .ds-search-foot{display:none}
}
@media (prefers-reduced-motion:reduce){.ds-search-panel,.ds-search-panel[data-open="true"]{transform:none}.ds-search-spin{animation:none}}
`;

export const SEARCH_JS = `
(function(){
  var host=document.querySelector('.ds-search'); if(!host||host.__bound) return; host.__bound=true;
  var root=new URL(host.getAttribute('data-root')||'./', location.href).href;
  var input=host.querySelector('.ds-search-input'), panel=host.querySelector('.ds-search-panel'),
      list=host.querySelector('.ds-search-list'), state=host.querySelector('.ds-search-state'),
      live=host.querySelector('.ds-search-live'), toggle=host.querySelector('.ds-search-toggle'),
      closeBtn=host.querySelector('.ds-search-close');
  var CAPS={icon:8,token:6,section:6,audience:6,component:6}, DEFAULT_CAP=5;
  var TYPE_BONUS={component:40,guideline:30,foundation:25,audience:15,page:15,feed:10,token:5,icon:0,section:-5};
  var SUGGEST=['button','primary','arrow','modal','spacing'];
  var index=null, loading=null, active=-1, options=[];

  function esc(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
  function norm(s){ return String(s||'').toLowerCase().replace(/colour/g,'color').replace(/[^a-z0-9]+/g,' ').trim(); }
  function icon(name,size,cls){ return '<aha-icon name="'+esc(name)+'" size="'+(size||16)+'" decorative'+(cls?' class="'+cls+'"':'')+'></aha-icon>'; }

  function load(){
    if(index) return Promise.resolve(index);
    if(loading) return loading;
    loading=fetch(root+'search-index.json').then(function(r){ if(!r.ok) throw new Error(r.status); return r.json(); })
      .then(function(data){
        data.items.forEach(function(it){ it.nt=norm(it.n); it.ct=it.nt.replace(/ /g,''); it.hay=it.nt+' '+norm(it.k)+' '+norm(it.s); });
        index=data; return data;
      })
      .catch(function(e){ loading=null; throw e; });
    return loading;
  }

  function score(it,q,cq,terms){
    var s=0;
    if(it.nt===q||it.ct===cq) s=1000;
    else if(it.nt.indexOf(q)===0||it.ct.indexOf(cq)===0) s=800-Math.min(it.nt.length-q.length,100);
    else if(terms.every(function(t){ return (' '+it.nt).indexOf(' '+t)>=0; })) s=600-Math.min(it.nt.length,100);
    else if(it.nt.indexOf(q)>=0||it.ct.indexOf(cq)>=0) s=400-Math.min(it.nt.length,100);
    else if(terms.every(function(t){ return it.hay.indexOf(t)>=0; })){
      s=100; terms.forEach(function(t){ if(it.nt.indexOf(t)>=0) s+=40; });
      // A heading matched only through its parent page's name ("API" under Checkbox) is noise.
      if(it.t==='section'&&s===100) s=0;
    }
    return s ? s+(TYPE_BONUS[it.t]||0) : 0;
  }
  function highlight(title,raw){
    var at=title.toLowerCase().indexOf(raw.toLowerCase());
    if(!raw||at<0) return esc(title);
    return esc(title.slice(0,at))+'<mark>'+esc(title.slice(at,at+raw.length))+'</mark>'+esc(title.slice(at+raw.length));
  }
  function lead(it){
    if(it.t==='icon') return '<span class="ds-search-lead">'+icon(it.i,16)+'</span>';
    if(it.v) return '<span class="ds-search-lead"><span class="ds-search-swatch" style="background:'+esc(it.v)+'"></span></span>';
    return '<span class="ds-search-lead">'+icon(index.typeIcons[it.t]||index.typeIcons.page,16)+'</span>';
  }
  function option(id,href,leadHtml,title,sub){
    return '<a class="ds-search-opt" role="option" id="'+id+'" aria-selected="false" tabindex="-1" href="'+esc(href)+'">'+leadHtml
      +'<span class="ds-search-txt"><span class="ds-search-t">'+title+'</span>'+(sub?'<span class="ds-search-s">'+esc(sub)+'</span>':'')+'</span>'
      +icon('system-key-return',16,'ds-search-go')+'</a>';
  }

  function setState(kind,html){ state.setAttribute('data-kind',kind||''); state.innerHTML=html||''; }
  function showHint(){
    list.innerHTML=''; options=[]; setActive(-1);
    setState('hint', icon('system-magnifying-glass',24)+'<span><b>Search the whole design system</b></span>'
      +'<span class="ds-search-hint">Components, props, icons, tokens, guidelines and every docs section.</span>'
      +'<span class="ds-search-chips">'+SUGGEST.map(function(s){ return '<button class="ds-search-chip" type="button" data-q="'+s+'">'+s+'</button>'; }).join('')+'</span>');
    live.textContent='';
  }
  function showLoading(){ list.innerHTML=''; options=[]; setActive(-1); setState('loading', icon('system-circle-notch',24,'ds-search-spin')+'<span>Loading the search index…</span>'); live.textContent='Loading search'; }
  function showError(){
    list.innerHTML=''; options=[]; setActive(-1);
    setState('error', icon('system-warning-circle',24)+'<span><b>Search is unavailable right now</b></span><span class="ds-search-hint">The search index could not be loaded. Check your connection and try again.</span><button class="ds-search-retry" type="button">Try again</button>');
    live.textContent='Search is unavailable';
  }

  function render(){
    var raw=input.value.trim();
    if(!raw){ showHint(); return; }
    if(!index){ showLoading(); load().then(render, showError); return; }
    var q=norm(raw), cq=q.replace(/ /g,''), terms=q.split(' ').filter(Boolean);
    if(!q){ showHint(); return; }
    var groups={};
    index.items.forEach(function(it){
      var s=score(it,q,cq,terms); if(!s) return;
      (groups[it.t]||(groups[it.t]=[])).push({it:it,s:s});
    });
    var order=index.groups.filter(function(g){ return groups[g[0]]; }).map(function(g){
      var hits=groups[g[0]].sort(function(a,b){ return b.s-a.s||a.it.n.length-b.it.n.length; });
      return {key:g[0],label:g[1],hits:hits,top:hits[0].s};
    }).sort(function(a,b){ return b.top-a.top; });
    var total=order.reduce(function(n,g){ return n+g.hits.length; },0), html='', n=0;
    order.forEach(function(g){
      var cap=CAPS[g.key]||DEFAULT_CAP, gid='ds-search-g-'+g.key;
      html+='<div class="ds-search-group" role="group" aria-labelledby="'+gid+'"><div class="ds-search-group-h" id="'+gid+'"><span>'+esc(g.label)+'</span><b>'+g.hits.length+'</b></div>';
      g.hits.slice(0,cap).forEach(function(h){
        var it=h.it, sub=it.t==='component'&&it.a ? it.a+(it.s?' · '+it.s:'') : it.s;
        html+=option('ds-search-o'+(n++), root+it.u, lead(it), highlight(it.n,raw), sub);
      });
      if(g.key==='icon'&&g.hits.length>cap){
        html+=option('ds-search-o'+(n++), root+'icons/index.html?q='+encodeURIComponent(raw), '<span class="ds-search-lead">'+icon(index.typeIcons.more,16)+'</span>',
          'See all '+g.hits.length+' icons matching “'+esc(raw)+'”', 'Opens the icon library, filtered');
      }
      html+='</div>';
    });
    if(!total){
      list.innerHTML=''; options=[]; setActive(-1);
      setState('empty', icon('system-magnifying-glass-exclamation',24)+'<span>No results for <b>“'+esc(raw)+'”</b></span>'
        +'<span class="ds-search-hint">Try a component name, an icon name (e.g. arrow) or a token (e.g. primary).</span>');
      live.textContent='No results';
      return;
    }
    setState('','');
    list.innerHTML=html;
    options=[].slice.call(list.querySelectorAll('[role="option"]'));
    setActive(0);
    live.textContent=total+' result'+(total===1?'':'s');
  }

  function setActive(i){
    if(options[active]) options[active].setAttribute('aria-selected','false');
    active=i;
    var o=options[active];
    if(o){ o.setAttribute('aria-selected','true'); input.setAttribute('aria-activedescendant',o.id); o.scrollIntoView({block:'nearest'}); }
    else input.removeAttribute('aria-activedescendant');
  }
  function isOpen(){ return panel.getAttribute('data-open')==='true'; }
  function open(){
    if(!isOpen()){ panel.setAttribute('data-open','true'); input.setAttribute('aria-expanded','true'); }
    render();
  }
  function close(){
    panel.setAttribute('data-open','false'); input.setAttribute('aria-expanded','false'); setActive(-1);
    host.setAttribute('data-expanded','false'); toggle.setAttribute('aria-expanded','false');
  }
  function expand(){
    host.setAttribute('data-expanded','true'); toggle.setAttribute('aria-expanded','true');
    input.focus(); open();
  }
  function narrow(){ return getComputedStyle(toggle).display!=='none'; }

  input.addEventListener('focus', function(){ load().catch(function(){}); open(); });
  input.addEventListener('input', function(){ if(!isOpen()) open(); else render(); });
  input.addEventListener('keydown', function(e){
    if(e.key==='ArrowDown'||e.key==='ArrowUp'){
      if(!isOpen()){ open(); e.preventDefault(); return; }
      if(!options.length) return;
      e.preventDefault();
      var d=e.key==='ArrowDown'?1:-1;
      setActive((active+d+options.length)%options.length);
    } else if(e.key==='Enter'){
      if(options[active]){ e.preventDefault(); options[active].click(); }
    } else if(e.key==='Escape'){
      e.preventDefault();
      var wasNarrow=narrow();
      close(); input.blur(); if(wasNarrow) toggle.focus();
    }
  });
  list.addEventListener('mousemove', function(e){
    var o=e.target.closest('[role="option"]'); if(o&&options.indexOf(o)!==active) setActive(options.indexOf(o));
  });
  list.addEventListener('click', function(e){
    if(e.target.closest('[role="option"]')){ close(); input.blur(); }
  });
  state.addEventListener('click', function(e){
    var chip=e.target.closest('.ds-search-chip');
    if(chip){ input.value=chip.getAttribute('data-q'); input.focus(); render(); return; }
    if(e.target.closest('.ds-search-retry')){ input.focus(); render(); }
  });
  panel.addEventListener('mousedown', function(e){ e.preventDefault(); });
  host.addEventListener('focusout', function(e){ if(!host.contains(e.relatedTarget)) close(); });
  toggle.addEventListener('click', expand);
  closeBtn.addEventListener('click', function(){ close(); toggle.focus(); });
  document.addEventListener('pointerdown', function(e){ if(!host.contains(e.target)) close(); });
  document.addEventListener('keydown', function(e){
    if(e.defaultPrevented||e.isComposing) return;
    var t=e.composedPath?e.composedPath()[0]:e.target;
    if(t!==input&&t&&(t.isContentEditable||/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
    var shortcut=(e.key==='k'||e.key==='K')&&(e.metaKey||e.ctrlKey)&&!e.altKey;
    if(shortcut||(e.key==='/'&&t!==input&&!e.metaKey&&!e.ctrlKey&&!e.altKey)){ e.preventDefault(); narrow()?expand():input.focus(); }
  });
  window.addEventListener('popstate', function(){ close(); });
  var mac=/Mac|iPhone|iPad/.test(navigator.platform||'');
  host.querySelector('.ds-search-kbd').setAttribute('title','Press / or '+(mac?'⌘':'Ctrl')+' K to search');
})();
`;
