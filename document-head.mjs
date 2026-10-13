export const TITLE_SEPARATOR = ' | ';
export const FAVICON_FOLDER = 'logo/favicon';
export const ROOT_FAVICON_FILE = 'favicon.ico';

const escapeHtml = (text) => String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * The document title in the format of guidelines/page-title-favicon.json: the page name first, the
 * site name last. Omit `page` on the site's home page. `section` goes in the middle only when two
 * pages of the site share a name; `environment` marks a build that is not production.
 */
export function documentTitle({ site, page, section, environment }) {
  if (!site) throw new Error('documentTitle: site name is required');
  const title = [page, section, site].filter(Boolean).join(TITLE_SEPARATOR);
  return environment ? `[${environment}] ${title}` : title;
}

/** The favicon links for a page that sits `base` (a relative prefix such as "../") below the site root. */
export function faviconLinks(base = '') {
  return [
    `<link rel="icon" href="${base}${ROOT_FAVICON_FILE}" sizes="16x16 32x32 48x48"/>`,
    `<link rel="icon" type="image/png" sizes="32x32" href="${base}${FAVICON_FOLDER}/favicon-32.png"/>`,
    `<link rel="apple-touch-icon" sizes="180x180" href="${base}${FAVICON_FOLDER}/favicon-180.png"/>`,
  ].join('\n');
}

/** The `<title>` element plus the favicon links, ready for a page's `<head>`. */
export function documentHead({ title, base = '' }) {
  if (!title) throw new Error('documentHead: every page needs its own title');
  return `<title>${escapeHtml(title)}</title>\n${faviconLinks(base)}`;
}

/** Replaces the `<title>` of a finished standalone page with `documentHead`. */
export function withDocumentHead(html, { title, base = '' }) {
  if (!/<title>[\s\S]*?<\/title>/.test(html)) throw new Error('withDocumentHead: the page has no <title> to replace');
  return html.replace(/<title>[\s\S]*?<\/title>/, () => documentHead({ title, base }));
}

/** Records each title a build emits and throws when two pages claim the same one. */
export function uniqueTitleRegistry() {
  const pageByTitle = new Map();
  return (title, page) => {
    if (pageByTitle.has(title) && pageByTitle.get(title) !== page) throw new Error(`document title "${title}" is used by both ${pageByTitle.get(title)} and ${page}; add the section as a middle segment`);
    pageByTitle.set(title, page);
    return title;
  };
}
