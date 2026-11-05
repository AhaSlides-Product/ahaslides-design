/**
 * @ahaslides-product/design/search-result-css — the Search result class layer, as a string.
 *
 * One source for two consumers: <aha-search-result> puts SEARCH_RESULT_CSS in its shadow root, and
 * generate.mjs writes SEARCH_RESULT_HOST_CSS to lib/search-result.css for a host that renders its own
 * result markup. The host file carries the same rules with each Discourse full-page-search selector
 * listed beside its DS class, plus DISCOURSE_EXTRA_CSS for Discourse markup that has no DS twin.
 */
const DISCOURSE = {
  row: '.fps-result',
  body: '.fps-result .fps-topic',
  title: '.fps-result .search-link',
  match: '.fps-result .search-highlight, .search-container .result-count .term',
  meta: '.fps-result .search-category',
  date: '.fps-result .blurb .date',
  blurb: '.fps-result .blurb',
};

const cls = (part) => (part === 'row' ? '.aha-search-result' : `.aha-search-result__${part}`);

const rules = (host) => {
  const s = (part, suffix = '') => {
    const own = `${cls(part)}${suffix}`;
    if (!host) return own;
    return [own, ...DISCOURSE[part].split(', ').map((d) => `${d}${suffix}`)].join(', ');
  };
  return `
${s('row')}{ box-sizing:border-box; display:flex; align-items:flex-start; gap:var(--aha-space-12,12px); min-width:0;
  padding:var(--aha-space-16,16px) 0; border-bottom:1px solid var(--aha-border-secondary,#F1F1F1);
  font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif) }
${s('body')}{ box-sizing:border-box; display:flex; flex-direction:column; gap:var(--aha-space-4,4px); flex:1 1 auto; min-width:0 }
${s('title')}{ align-self:flex-start; max-width:100%; overflow-wrap:anywhere; font-size:var(--aha-size-l,16px);
  line-height:var(--aha-line-height-body,1.5); font-weight:var(--aha-weight-semibold,600);
  color:var(--aha-text-default,#1A1A1A); text-decoration:none; border-radius:var(--aha-radius-xs,4px);
  outline:2px solid transparent; outline-offset:2px;
  transition:outline-color var(--aha-motion-fast,.1s) var(--aha-ease-out,ease-out) }
${s('title', ':hover')}{ text-decoration:underline }
${s('title', ':focus-visible')}{ outline-color:var(--aha-border-focus,#E70E68) }
${s('match')}{ background-color:var(--aha-bg-accent,#E70E680D); color:var(--aha-text-default,#1A1A1A); font-weight:inherit;
  border-radius:var(--aha-radius-xs,4px); -webkit-box-decoration-break:clone; box-decoration-break:clone }
${s('meta')}{ display:flex; flex-wrap:wrap; align-items:center; gap:var(--aha-space-4,4px) var(--aha-space-8,8px);
  font-size:var(--aha-size-default,14px); line-height:var(--aha-line-height-body,1.5); font-weight:var(--aha-weight-regular,400);
  color:var(--aha-text-tertiary,#616161) }
${s('date')}{ font-size:var(--aha-size-default,14px); line-height:var(--aha-line-height-body,1.5); font-weight:var(--aha-weight-regular,400);
  color:var(--aha-text-tertiary,#616161); white-space:nowrap }
${s('blurb')}{ margin:0; font-size:var(--aha-size-default,14px); line-height:var(--aha-line-height-body,1.5);
  font-weight:var(--aha-weight-regular,400); color:var(--aha-text-secondary,#4A4A4A); overflow-wrap:anywhere; overflow:hidden;
  display:-webkit-box; -webkit-box-orient:vertical; -webkit-line-clamp:2; line-clamp:2 }
`;
};

export const SEARCH_RESULT_CSS = rules(false);

export const DISCOURSE_EXTRA_CSS = `
.fps-result .fps-topic .topic{ display:flex; flex-direction:column; gap:var(--aha-space-4,4px); min-width:0 }
.fps-result .search-link .topic-title{ font:inherit; color:inherit }
.fps-result .blurb .date{ margin-inline-end:var(--aha-space-4,4px) }
.semantic-search__searching .badge-notification.--has-results{ box-sizing:border-box; display:inline-flex; align-items:center;
  justify-content:center; height:18px; min-width:18px; padding:0 var(--aha-space-6,6px); border-radius:var(--aha-radius-pill,999px);
  background-color:var(--aha-color-error,#1A1A1A); color:var(--aha-text-inverse,#FFFFFF);
  font-size:11px; line-height:18px; font-weight:var(--aha-weight-semibold,600) }
`;

export const SEARCH_RESULT_HOST_CSS = `${rules(true)}${DISCOURSE_EXTRA_CSS}`;

export default SEARCH_RESULT_CSS;
