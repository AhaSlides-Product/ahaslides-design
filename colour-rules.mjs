/* The colour and background rules, read from brand/colour-rules.json and rendered three ways:
   the human page, the agent feeds and the Background library page. No rule text is authored here. */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export const COLOUR_RULES_FILE = 'brand/colour-rules.json';
export const COLOUR_RULES_TEMPLATE_FILE = 'brand/colour-rules.template.html';
export const BACKGROUNDS_MANIFEST_FILE = 'backgrounds/manifest.json';
export const COLOUR_RULES_PAGE = 'foundations/brand-colour-rules.html';
export const BACKGROUND_LIBRARY_PAGE = 'foundations/backgrounds.html';

export function loadColourRules(root) {
  return JSON.parse(readFileSync(join(root, COLOUR_RULES_FILE), 'utf8'));
}

export function loadBackgrounds(root) {
  return JSON.parse(readFileSync(join(root, BACKGROUNDS_MANIFEST_FILE), 'utf8')).backgrounds;
}

const escapeHtml = (text) => String(text ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const SWATCH_CLASS = {
  '#E70E68': 'sw-pink', '#DB005B': 'sw-pinkdark', '#FFFFFF': 'sw-white', '#E70E680D': 'sw-pink5', '#FEF3F7': 'sw-pink5',
  '#E70E684D': 'sw-pink30', '#F8B7D2': 'sw-pink30', '#6A1EBB': 'sw-purple', '#A8A8A8': 'sw-grey', '#FAFAFA': 'sw-faint',
};

function copyChip(hex, withSwatch = true) {
  const swatch = !withSwatch ? ''
    : SWATCH_CLASS[hex] ? `<span class="swatch ${SWATCH_CLASS[hex]}"></span>`
      : `<span class="swatch" style="background:${escapeHtml(hex)}"></span>`;
  return `<button type="button" class="chip" data-copy="${escapeHtml(hex)}" aria-label="Copy ${escapeHtml(hex)}">${swatch}<code>${escapeHtml(hex)}</code><span class="hint">Copy</span></button>`;
}

export function markupToHtml(text) {
  return escapeHtml(text)
    .replace(/\[\[(#[0-9A-Fa-f]{6,8})(\|plain)?\]\]/g, (_, hex, plain) => copyChip(hex, !plain))
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\(\((.+?)\)\)/g, '<small>$1</small>')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2">$1</a>')
    .replace(/\n/g, '<br>');
}

export function markupToText(text) {
  return String(text ?? '')
    .replace(/\[\[(#[0-9A-Fa-f]{6,8})(\|plain)?\]\]/g, '$1')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\(\((.+?)\)\)/g, '$1')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '$1')
    .replace(/\n/g, ' ');
}

const sectionNumber = (section) => section.id.replace(/^s/, '');

/** Every rule in reading order, each with the environments it applies to. */
export function listRules(rules) {
  const list = [];
  for (const section of rules.sections) {
    for (const block of section.blocks) {
      const inherited = block.environment || section.environment || rules.environment;
      const entries = block.type === 'rules' ? block.rules : (block.rule ? [block] : []);
      for (const entry of entries) {
        list.push({
          id: entry.id, section: sectionNumber(section), sectionTitle: section.title, text: markupToText(entry.text),
          environment: entry.environment || inherited, origin: entry.origin || block.origin || 'rules page',
        });
      }
    }
  }
  return list;
}

export function listTables(rules) {
  return rules.sections.flatMap(section => section.blocks.filter(block => block.type === 'table').map(block => ({
    id: block.id, section: sectionNumber(section), sectionTitle: section.title,
    environment: block.environment || section.environment || rules.environment, origin: block.origin || 'rules page',
    columns: block.columns, rows: block.rows.map(row => row.map(markupToText)),
  })));
}

/** The explanatory paragraphs that are not rules, in reading order. */
export function listNotes(rules) {
  return rules.sections.flatMap(section => section.blocks.filter(block => block.type === 'paragraph' && !block.rule).map(block => ({
    section: sectionNumber(section), sectionTitle: section.title, text: markupToText(block.text),
  })));
}

/** Rule id to the judge criteria that cite it, as "surface:C1". */
export function judgeCriteriaByRule(store) {
  const byRule = {};
  for (const [surface, definition] of Object.entries(store?.surfaces || {})) {
    for (const criterion of definition.criteria || []) {
      for (const ruleId of criterion.source || []) (byRule[ruleId] ||= []).push(`${surface}:${criterion.id}`);
    }
  }
  return byRule;
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export function longDate(isoDate) {
  const [year, month, day] = isoDate.split('-').map(Number);
  return `${day} ${MONTHS[month - 1]} ${year}`;
}

/** Splits the page template into its shell and its named parts (trailing "part:<name>" comments). */
export function parseTemplate(templateHtml) {
  const parts = {};
  const shell = templateHtml.replace(/<!-- part:([\w-]+)\n([\s\S]*?)\n-->\n?/g, (_, name, body) => { parts[name] = body; return ''; });
  return { shell, parts };
}

const fill = (template, values) => template.replace(/\{\{(\w+)\}\}/g, (placeholder, key) => (key in values ? values[key] : placeholder));

function paletteValueCell(colour) {
  if (colour.hex) return copyChip(colour.hex);
  if (colour.alphaHex) return `${copyChip(colour.alphaHex)}<br><small>Flat code, where a tool has no transparency:</small><br>${copyChip(colour.flatHex)}`;
  if (colour.tints) return `${escapeHtml(colour.tintsLabel)}<br>${colour.tints.map(hex => copyChip(hex, false)).join(' ')}<br>${markupToHtml(colour.tintsAfter)}`;
  return markupToHtml(colour.valueText);
}

function blockHtml(block, rules, parts, options = {}) {
  const grid = (columns, rows) => fill(parts['rules-table'], {
    head: columns.map(column => `<th>${escapeHtml(column)}</th>`).join('\n'),
    rows: rows.map(row => `<tr>\n${row.map(cell => `<td>${cell}</td>`).join('\n')}\n</tr>`).join('\n'),
  });
  if (block.type === 'paragraph') return `<p>${markupToHtml(block.text)}</p>`;
  if (block.type === 'heading') return `<h3 id="${block.anchor}"${block.origin ? ' class="sub"' : ''}>${escapeHtml(block.text)}</h3>`;
  if (block.type === 'rules') return `<ol${block.start ? ` start="${block.start}"` : ''}>\n${block.rules.map(rule => `<li id="r${rule.id}">${markupToHtml(rule.text)}</li>`).join('\n')}\n</ol>`;
  if (block.type === 'table') return grid(block.columns, block.rows.map(row => row.map(markupToHtml)));
  if (block.type === 'palette') return grid(['Colour', 'Value', 'What it is for'], rules.palette.map(colour => [markupToHtml(colour.name), paletteValueCell(colour), markupToHtml(colour.role)]));
  if (block.type === 'answer-examples') return answerExamplesHtml(block, options);
  if (block.type === 'open') {
    return rules.open.length
      ? `<ol>\n${rules.open.map(point => `<li id="${point.id}"><strong>${escapeHtml(point.title)}.</strong> ${markupToHtml(point.text)} Until it is settled: ${markupToHtml(point.interim)}</li>`).join('\n')}\n</ol>`
      : '<p>Nothing open.</p>';
  }
  throw new Error(`${COLOUR_RULES_FILE}: unknown block type "${block.type}"`);
}

/** The section that holds the correct and wrong answer rules, for pages that show it outside the rules page. */
export function answerSection(rules) {
  return rules.sections.find(section => section.key === 'answers');
}

const ANSWER_TINT_NAMES = { light5: '5', light30: '30', dark5: '5-dark', dark30: '30-dark' };

/** The --ans-* custom properties of the answer examples, filled from the palette (correct and wrong entries). */
export function answerPaletteVariables(rules) {
  return ['correct', 'wrong'].map(kind => {
    const colour = rules.palette.find(entry => entry.id === `answer-${kind}`);
    return [`--ans-${kind}:${colour.hex};`, ...Object.entries(colour.answerTints).map(([step, hex]) => `--ans-${kind}-${ANSWER_TINT_NAMES[step]}:${hex};`)].join(' ');
  }).join(' ');
}

/* Bound only to --ans-* properties, so the same markup renders on the self-contained rules page
   (properties from the palette) and on the Colour page (properties from the --aha-answer-* tokens). */
export const ANSWER_EXAMPLES_CSS = `
.ax{margin:8px 0 16px;font-family:var(--ans-font)}
.ax-h{font-size:16px;font-weight:600;margin:20px 0 8px}
.ax-grid{display:grid;gap:16px;grid-template-columns:repeat(auto-fill,minmax(min(100%,var(--ax-min,300px)),1fr));margin:0 0 8px}
.ax-grid.is-stages{--ax-min:420px}
.ax-grid.is-phones{--ax-min:220px}
.ax-fig{margin:0;min-width:0}
.ax-fig figcaption{font-size:13px;color:var(--ans-ink-2);margin-top:6px}
.ax-light{--ax-c5:var(--ans-correct-5);--ax-c30:var(--ans-correct-30);--ax-w5:var(--ans-wrong-5);--ax-w30:var(--ans-wrong-30);--ax-ink:var(--ans-ink);--ax-surface:var(--ans-page);--ax-panel:var(--ans-panel);--ax-line:var(--ans-line)}
.ax-dark{--ax-c5:var(--ans-correct-5-dark);--ax-c30:var(--ans-correct-30-dark);--ax-w5:var(--ans-wrong-5-dark);--ax-w30:var(--ans-wrong-30-dark);--ax-ink:var(--ans-inverse);--ax-surface:var(--ans-dark);--ax-panel:var(--ans-dark-raised);--ax-line:var(--ans-dark-raised)}
.ax-stage,.ax-phone{background:var(--ax-surface);color:var(--ax-ink);border:1px solid var(--ans-line);border-radius:12px;padding:16px}
.ax-q{font-size:18px;font-weight:600;line-height:1.3;margin:0 0 4px}
.ax-sub{font-size:13px;margin:0 0 12px}
.ax-body{display:flex;flex-wrap:wrap;gap:16px;align-items:stretch}
.ax-list{flex:1 1 180px;display:flex;flex-direction:column;gap:8px;min-width:0}
.ax-row{display:flex;align-items:center;gap:10px;min-height:40px;padding:6px 12px;border-radius:8px;background:var(--ax-surface);box-shadow:inset 0 0 0 1px var(--ax-line);font-size:14px}
.ax-row.is-correct{background:var(--ax-c5);box-shadow:inset 0 0 0 2px var(--ans-correct)}
.ax-row.is-wrong{background:var(--ax-w5);box-shadow:inset 0 0 0 1px var(--ans-wrong)}
.ax-row.is-picked .ax-label{font-weight:600}
.ax-label{flex:1 1 auto;min-width:0;overflow-wrap:anywhere}
.ax-count{font-variant-numeric:tabular-nums;font-weight:600}
.ax-disc{display:inline-flex;align-items:center;justify-content:center;flex:none;width:24px;height:24px;border-radius:999px;color:var(--ans-page)}
.ax-disc.is-small{width:20px;height:20px}
.ax-disc.is-large{width:32px;height:32px}
.ax-disc.is-correct{background:var(--ans-correct)}
.ax-disc.is-wrong{background:var(--ans-wrong)}
.ax-disc svg{display:block}
.ax-chart{flex:1 1 160px;display:flex;align-items:flex-end;justify-content:space-around;gap:8px;min-height:180px;padding:12px;border-radius:8px;background:var(--ax-panel)}
.ax-col{display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:4px;flex:1 1 0;min-width:0;height:100%}
.ax-value{font-size:13px;font-weight:600;font-variant-numeric:tabular-nums}
.ax-bar{width:min(100%,40px);border-radius:4px 4px 0 0;background:var(--ans-neutral)}
.ax-col.is-correct .ax-bar{background:var(--ans-correct)}
.ax-col-label{display:flex;flex-direction:column;align-items:center;gap:4px;font-size:12px;max-width:100%;text-align:center}
.ax-phone{display:flex;flex-direction:column;gap:8px;min-height:380px;padding-bottom:0;overflow:hidden}
.ax-phone .ax-q{margin-bottom:8px}
.ax-banner{display:flex;align-items:center;gap:10px;margin:auto -16px 0;padding:14px 16px;font-size:16px;font-weight:600}
.ax-banner.is-correct{background:var(--ax-c30)}
.ax-banner.is-wrong{background:var(--ax-w30)}
.ax-banner .ax-points{margin-left:auto;font-size:14px;font-weight:400;font-variant-numeric:tabular-nums;white-space:nowrap}
.ax-phone-end{margin-top:auto;height:16px}
.ax-report{background:var(--ans-page);color:var(--ans-ink);border:1px solid var(--ans-line);border-radius:12px;padding:16px;display:flex;flex-direction:column;gap:12px}
.ax-report-name{font-size:18px;font-weight:600;margin:0}
.ax-report-sub{font-size:13px;color:var(--ans-ink-2);margin:2px 0 0}
.ax-card{border:1px solid var(--ans-line);border-radius:12px;padding:12px 16px}
.ax-card-q{font-size:14px;font-weight:600;margin:8px 0 10px}
.ax-cols{display:grid;gap:12px;grid-template-columns:repeat(auto-fit,minmax(min(100%,180px),1fr))}
.ax-colhead{font-size:13px;color:var(--ans-ink-2);margin:0 0 4px}
.ax-box{display:flex;align-items:center;gap:10px;min-height:40px;padding:6px 12px;border-radius:8px;box-shadow:inset 0 0 0 1px var(--ans-line);font-size:14px}
.ax-box .ax-label{flex:1 1 auto}
.ax-box.is-correct{background:var(--ans-correct-5);box-shadow:inset 0 0 0 1px var(--ans-correct)}
.ax-box.is-wrong{background:var(--ans-wrong-5);box-shadow:inset 0 0 0 1px var(--ans-wrong)}
.ax-chip{display:inline-flex;align-items:center;gap:6px;padding:2px 10px 2px 2px;border-radius:999px;font-size:13px;font-weight:600;color:var(--ans-ink)}
.ax-chip.is-correct{background:var(--ans-correct-30)}
.ax-chip.is-wrong{background:var(--ans-wrong-30)}
.ax-table-wrap{overflow-x:auto}
.ax-table{border-collapse:collapse;width:100%;font-size:14px}
.ax-table th,.ax-table td{text-align:left;vertical-align:middle;padding:8px 12px 8px 0;border-bottom:1px solid var(--ans-line);font-weight:400}
.ax-table th{font-size:13px;font-weight:600;color:var(--ans-ink-2)}
`;

/** The applications of section 11: presenting, the audience phone and the report, as static markup. */
export function answerExamplesHtml(block, { icon = () => '' } = {}) {
  const disc = (correct, size = '') => `<span class="ax-disc ${correct ? 'is-correct' : 'is-wrong'}${size ? ` is-${size}` : ''}">${icon(correct ? 'system-check' : 'system-x', size === 'small' ? 12 : 16)}</span>`;
  const deckClass = (deck) => (deck === 'dark' ? 'ax-dark' : 'ax-light');
  const highest = Math.max(1, ...block.options.map(option => option.count));
  const answered = block.options.reduce((sum, option) => sum + option.count, 0);
  const stage = ({ deck, caption }) => {
    const rows = block.options.map(option => `<div class="ax-row ${option.correct ? 'is-correct' : 'is-wrong'}">${disc(!!option.correct)}<span class="ax-label">${escapeHtml(option.label)}</span><span class="ax-count">${option.count}</span></div>`).join('');
    const columns = block.options.map(option => `<div class="ax-col${option.correct ? ' is-correct' : ''}"><span class="ax-value">${option.count}</span><span class="ax-bar" style="height:${Math.max(4, Math.round(option.count / highest * 120))}px"></span><span class="ax-col-label">${disc(!!option.correct, 'small')}${escapeHtml(option.label)}</span></div>`).join('');
    return `<figure class="ax-fig"><div class="ax-stage ${deckClass(deck)}"><p class="ax-q">${escapeHtml(block.question)}</p><p class="ax-sub">${answered} of ${answered} answered</p><div class="ax-body"><div class="ax-list">${rows}</div><div class="ax-chart">${columns}</div></div></div><figcaption>${escapeHtml(caption)}</figcaption></figure>`;
  };
  const phone = (deck, { pick, caption, banner, points }) => {
    const pickedOption = block.options.find(option => option.label === pick);
    const rows = block.options.map(option => {
      const picked = option.label === pick;
      const tone = option.correct ? 'is-correct' : (picked ? 'is-wrong' : 'is-plain');
      return `<div class="ax-row ${tone}${picked ? ' is-picked' : ''}">${disc(!!option.correct)}<span class="ax-label">${escapeHtml(option.label)}</span><span class="ax-count">${option.count}</span></div>`;
    }).join('');
    const end = banner
      ? `<div class="ax-banner ${pickedOption?.correct ? 'is-correct' : 'is-wrong'}">${disc(!!pickedOption?.correct, 'large')}<span>${escapeHtml(banner)}</span><span class="ax-points">${escapeHtml(points || '')}</span></div>`
      : '<div class="ax-phone-end"></div>';
    return `<figure class="ax-fig"><div class="ax-phone ${deckClass(deck)}"><p class="ax-q">${escapeHtml(block.question)}</p>${rows}${end}</div><figcaption>${escapeHtml(caption)}, ${deck === 'dark' ? 'dark' : 'light'} deck</figcaption></figure>`;
  };
  const chip = (correct) => `<span class="ax-chip ${correct ? 'is-correct' : 'is-wrong'}">${disc(correct, 'small')}${correct ? 'Correct' : 'Wrong'}</span>`;
  const { report } = block;
  const cards = report.questions.map((entry, index) => {
    const correct = !!entry.correct;
    const answerColumn = correct ? '' : `<div><p class="ax-colhead">Correct answer</p><div class="ax-box"><span class="ax-label">${escapeHtml(entry.correctAnswer)}</span></div></div>`;
    return `<div class="ax-card"><div class="ax-card-head">${chip(correct)} <span class="ax-report-sub">${index + 1}/${report.questions.length} · ${escapeHtml(entry.points)}</span></div><p class="ax-card-q">${escapeHtml(entry.question)}</p><div class="ax-cols"><div><p class="ax-colhead">Response</p><div class="ax-box ${correct ? 'is-correct' : 'is-wrong'}"><span class="ax-label">${escapeHtml(entry.response)}</span>${disc(correct, 'small')}</div></div>${answerColumn}</div></div>`;
  }).join('');
  const tableRows = report.questions.map(entry => `<tr><td>${escapeHtml(entry.question)}</td><td>${escapeHtml(entry.correctAnswer)}</td><td>${chip(!!entry.correct)}</td></tr>`).join('');
  return `<div class="ax" id="${escapeHtml(block.id)}">
<h4 class="ax-h">Presenting: quiz result reveal</h4>
<div class="ax-grid is-stages">${block.presenting.map(stage).join('')}</div>
<h4 class="ax-h">Audience phone, after the reveal</h4>
${block.audienceDecks.map(deck => `<div class="ax-grid is-phones">${block.audience.map(state => phone(deck, state)).join('')}</div>`).join('\n')}
<h4 class="ax-h">Report</h4>
<figure class="ax-fig"><div class="ax-report"><div><p class="ax-report-name">${escapeHtml(report.participant)}</p><p class="ax-report-sub">${escapeHtml(report.summary)}</p></div>${cards}</div><figcaption>Participant report: each response with the correct answer beside it</figcaption></figure>
<figure class="ax-fig"><div class="ax-report ax-table-wrap"><table class="ax-table"><thead><tr><th>Question</th><th>Correct answer</th><th>Result for ${escapeHtml(report.participant)}</th></tr></thead><tbody>${tableRows}</tbody></table></div><figcaption>Results table: one 30% chip per result</figcaption></figure>
</div>`;
}

const paletteHex = (rules, id) => { const colour = rules.palette.find(entry => entry.id === id); return colour.hex || colour.flatHex; };

/** The human page, self-contained: one file, both font weights embedded. */
export function renderColourRulesPage(rules, { fonts, templateHtml, icon }) {
  const { shell, parts } = parseTemplate(templateHtml);
  const number = (section) => `<span class="num">${sectionNumber(section)}</span>`;
  return fill(shell, {
    title: escapeHtml(rules.title),
    fontRegular: fonts.regular, fontSemiBold: fonts.semiBold,
    vividPink: paletteHex(rules, 'vivid-pink'), darkerPink: paletteHex(rules, 'darker-pink'),
    vividPink5: paletteHex(rules, 'vivid-pink-5'), vividPink30: paletteHex(rules, 'vivid-pink-30'), purple: paletteHex(rules, 'purple'),
    answerVariables: answerPaletteVariables(rules), answerExamplesCss: ANSWER_EXAMPLES_CSS,
    contents: rules.sections.map(section => `<li><a href="#${section.id}">${number(section)}${escapeHtml(section.title)}</a></li>`).join(''),
    lede: markupToHtml(rules.lede),
    updated: longDate(rules.updated),
    glance: rules.glance.map(line => `<li>${markupToHtml(line)}</li>`).join(''),
    sections: rules.sections.map(section =>
      `<h2 id="${section.id}">${number(section)}${escapeHtml(section.title)}</h2>\n${section.blocks.map(block => blockHtml(block, rules, parts, { icon })).join('\n')}`).join('\n'),
    changes: rules.changes.map(change => `<li><span class="ver">${escapeHtml(change.version)}</span><span class="date">${escapeHtml(change.date)}</span><span>${escapeHtml(change.text)}</span></li>`).join(''),
  });
}

const backgroundUrl = (site, entry) => `${site}/backgrounds/${entry.file}`;
const GENERATOR_COMMAND = 'node node_modules/@ahaslides-product/design/build-splash.mjs --layout right --surface pink --width 1200 --height 628 --out splash.svg';

/** The agent feed: every rule with its environments and the judge criteria that cite it. */
export function renderColourRulesAgent(rules, { site, store, backgrounds }) {
  const judgedBy = judgeCriteriaByRule(store);
  const ruleList = listRules(rules).map(rule => ({ ...rule, judgedBy: judgedBy[rule.id] || [] }));
  const judge = `${site}/anti-slop.md (surfaces colour and background)`;
  return JSON.stringify({
    generatedFrom: COLOUR_RULES_FILE,
    title: rules.title,
    updated: rules.updated,
    page: `${site}/${COLOUR_RULES_PAGE}`,
    howToRead: 'Pick your environment, read rulesByEnvironment for its rule ids, then the rules and tables with those ids. A point under open is not settled: follow its interim reading and say so.',
    judge: { product: judge, audience: judge, 'marketing-web': 'the aha-mkt skill', video: 'the aha-mkt skill', 'social-ads': 'the aha-mkt skill' },
    palette: rules.palette.map(colour => ({ ...colour, name: markupToText(colour.name), role: markupToText(colour.role), ...(colour.tintsAfter ? { tintsAfter: markupToText(colour.tintsAfter) } : {}) })),
    glance: rules.glance.map(markupToText),
    rulesByEnvironment: Object.fromEntries(rules.environment.map(name => [name, ruleList.filter(rule => rule.environment.includes(name)).map(rule => rule.id)])),
    rules: ruleList,
    notes: listNotes(rules),
    tables: listTables(rules),
    splash: {
      ...Object.fromEntries(Object.entries(rules.splash).filter(([key]) => !key.startsWith('$'))),
      library: `${site}/${BACKGROUND_LIBRARY_PAGE}`,
      manifest: `${site}/${BACKGROUNDS_MANIFEST_FILE}`,
      files: backgrounds.map(entry => ({ id: entry.id, layout: entry.layout, surface: entry.surface, ratio: entry.ratio, width: entry.width, height: entry.height, url: backgroundUrl(site, entry) })),
      generator: GENERATOR_COMMAND,
    },
    open: rules.open.map(point => ({ ...point, text: markupToText(point.text), interim: markupToText(point.interim) })),
    changes: rules.changes,
  }, null, 2) + '\n';
}

export function renderColourRulesMd(rules, { site, store, backgrounds }) {
  const judgedBy = judgeCriteriaByRule(store);
  const ruleList = listRules(rules);
  const tables = listTables(rules);
  const notes = listNotes(rules);
  const tag = (environment) => `[${environment.join(', ')}]`;
  const paletteValue = (colour) => colour.hex || (colour.alphaHex && `${colour.alphaHex} (flat on white ${colour.flatHex})`)
    || (colour.tints && `${colour.tintsLabel}: ${colour.tints.join(', ')}. ${markupToText(colour.tintsAfter)}`) || colour.valueText;
  let md = `# ${rules.title}\n\n> Generated from ${COLOUR_RULES_FILE} — do not edit by hand. The human page is ${site}/${COLOUR_RULES_PAGE}; the machine feed is ${site}/colour-rules.agent.json.\n> Last updated ${longDate(rules.updated)}. Each rule names the environments it applies to in square brackets. Product and audience work is judged on the anti-slop surfaces colour and background (${site}/anti-slop.md); work in the marketing-web, video and social-ads environments by the aha-mkt skill.\n\n${markupToText(rules.lede)}\n\n`;
  md += `## The rules at a glance\n\n${rules.glance.map((line, index) => `${index + 1}. ${markupToText(line)}`).join('\n')}\n\n`;
  md += `## Rules by environment\n\n${rules.environment.map(name => `- ${name}: ${ruleList.filter(rule => rule.environment.includes(name)).map(rule => rule.id).join(', ')}`).join('\n')}\n\n`;
  md += `## Palette\n\n${rules.palette.map(colour => `- ${markupToText(colour.name)}: ${paletteValue(colour)} — ${markupToText(colour.role)}`).join('\n')}\n\n`;
  for (const section of rules.sections) {
    const number = sectionNumber(section);
    const sectionRules = ruleList.filter(rule => rule.section === number);
    const sectionTables = tables.filter(table => table.section === number);
    const sectionNotes = notes.filter(note => note.section === number);
    if (!sectionRules.length && !sectionTables.length && !sectionNotes.length) continue;
    md += `## ${number}. ${section.title}\n\n`;
    if (sectionNotes.length) md += `${sectionNotes.map(note => note.text).join('\n\n')}\n\n`;
    if (sectionRules.length) md += `${sectionRules.map(rule => `- ${rule.id} ${tag(rule.environment)} ${rule.text}${judgedBy[rule.id] ? ` (judge: ${judgedBy[rule.id].join(', ')})` : ''}`).join('\n')}\n\n`;
    for (const table of sectionTables) {
      md += `Table ${table.id} ${tag(table.environment)}\n\n| ${table.columns.join(' | ')} |\n|${table.columns.map(() => '---').join('|')}|\n${table.rows.map(row => `| ${row.join(' | ')} |`).join('\n')}\n\n`;
    }
  }
  md += `## Splash background files\n\nLibrary page: ${site}/${BACKGROUND_LIBRARY_PAGE} · index: ${site}/${BACKGROUNDS_MANIFEST_FILE}\n\n${backgrounds.map(entry => `- ${entry.name} (${entry.width} by ${entry.height}): ${backgroundUrl(site, entry)}`).join('\n')}\n\nAny other size: \`${GENERATOR_COMMAND}\`\n\n`;
  md += `## Still to decide\n\n${rules.open.length ? rules.open.map(point => `- ${point.id} ${tag(point.environment)} ${point.title}. ${markupToText(point.text)} Until it is settled: ${markupToText(point.interim)}`).join('\n') : 'Nothing open.'}\n\n`;
  md += `## What changed\n\n${rules.changes.map(change => `- ${change.version} (${change.date}): ${change.text}`).join('\n')}\n`;
  return md;
}

export function colourRulesIndexLines(site, backgrounds) {
  return [
    `>   ${site}/${COLOUR_RULES_PAGE}  brand colour rules, the human page — the AhaSlides visual identity colour and background rules (palette, backgrounds, splash layouts, buttons and text, status, charts, what is still open); the token reference is foundations/colour.html`,
    `>   ${site}/colour-rules.md   the same rules for agents, each tagged with its environment (product, audience, marketing-web, video, social-ads) and the judge criteria that check it; machine form at ${site}/colour-rules.agent.json. The page and both feeds are generated from one file, ${COLOUR_RULES_FILE}`,
    `>   ${site}/${BACKGROUND_LIBRARY_PAGE}  background library — the ${backgrounds.length} ready-made Splash backgrounds (centre, right and minimal, on white and on Vivid Pink, at 16:9, 1:1 and 9:16); files at ${site}/backgrounds/<file>.svg, index at ${site}/${BACKGROUNDS_MANIFEST_FILE}; any other size is built with build-splash.mjs from the real splash icon, never redrawn, stretched or recoloured`,
  ];
}

const LAYOUT_ORDER = ['centre', 'right', 'minimal'];
const LAYOUT_LABEL = { centre: 'Centre', right: 'Right', minimal: 'Minimal' };

/** The Background library page body and its styles; generate.mjs wraps them in the docs shell. */
export function renderBackgroundLibrary(rules, backgrounds, { site, headline }) {
  const ruleList = listRules(rules);
  const tile = (entry) =>
    `<figure class="bgl-tile"><a class="bgl-stage" href="../backgrounds/${escapeHtml(entry.file)}" download><img src="../backgrounds/${escapeHtml(entry.file)}" width="${Number(entry.width)}" height="${Number(entry.height)}" alt="${escapeHtml(entry.name)}" loading="lazy"/></a>`
    + `<figcaption><span class="bgl-name">${entry.surface === 'pink' ? 'Vivid Pink' : 'White'}, ${escapeHtml(entry.ratio)}</span><span class="bgl-size">${entry.width} &times; ${entry.height}</span>`
    + `<a class="bgl-file" href="../backgrounds/${escapeHtml(entry.file)}" download>${escapeHtml(entry.file)} &darr;</a></figcaption></figure>`;
  const gallery = LAYOUT_ORDER.filter(layout => backgrounds.some(entry => entry.layout === layout)).map(layout =>
    `<section class="bgl-sec"><h3 class="tok-h3">${LAYOUT_LABEL[layout]}</h3><div class="bgl-grid">${backgrounds.filter(entry => entry.layout === layout).map(tile).join('')}</div></section>`).join('');
  const splashRules = (first, last) => ruleList.filter(rule => { const [section, index] = rule.id.split('.').map(Number); return section === 5 && index >= first && index <= last; });
  const ruleItems = (list) => `<ul class="bgl-rules">${list.map(rule => `<li><a class="bgl-ref" href="brand-colour-rules.html#r${rule.id}">${rule.id}</a> ${escapeHtml(rule.text)}</li>`).join('')}</ul>`;
  const openPoints = rules.open.filter(point => /splash/i.test(point.title));
  const main = `
  <h1>Background library</h1>
  ${headline([`${backgrounds.length} ready-made Splash backgrounds: centre, right and minimal, on white and on Vivid Pink`, 'Each file is built for its exact frame from the real splash icon: never stretch, re-crop, redraw or recolour one', 'Another size is one generator command; every rule is on the Brand colour rules page'])}
  <p class="gen">◆ generated from ${BACKGROUNDS_MANIFEST_FILE} and ${COLOUR_RULES_FILE} (each file records the command that builds it and the date) — fetch files from ${escapeHtml(site)}/backgrounds/&lt;file&gt;</p>

  <div id="background-gallery">${gallery}</div>

  <h2>Where a Splash background is allowed</h2>
  ${ruleItems([...splashRules(6, 6), ...splashRules(12, 12)])}
  <p class="body">On social posts, ads, slides, print and video the background is white or Vivid Pink and nothing else, with or without a Splash: see <a href="brand-colour-rules.html#s4">Brand colour rules, section 4</a>.</p>

  <h2>The three layouts</h2>
  ${ruleItems(splashRules(1, 5))}
  <p class="body">The figures as a table are on <a href="brand-colour-rules.html#s5">Brand colour rules, section 5</a>.</p>

  <h2>Build another size</h2>
  <p class="body">The ready-made files cover 16:9 (1920 &times; 1080), 1:1 (1080 &times; 1080) and 9:16 (1080 &times; 1920). For any other frame, build the file. The generator reads the splash icon from the Logo library and only scales, turns and moves its shapes.</p>
  <pre class="bgl-code"><code>node build-splash.mjs --layout right --surface pink --width 1200 --height 628 --out splash.svg
node build-splash.mjs --all            # rebuild the ready-made set into backgrounds/</code></pre>
  <p class="body">From an app that installs the package: <code>${escapeHtml(GENERATOR_COMMAND)}</code></p>
  ${ruleItems(splashRules(17, 19))}

  <h2>Using a file</h2>
  ${ruleItems([...splashRules(9, 11), ...splashRules(13, 16)])}

  <h2>Still to decide</h2>
  ${openPoints.length ? `<ul class="bgl-rules">${openPoints.map(point => `<li><b>${escapeHtml(point.title)}.</b> ${escapeHtml(markupToText(point.text))} Until it is settled: ${escapeHtml(markupToText(point.interim))}</li>`).join('')}</ul>` : '<p class="body">Nothing open.</p>'}
  <p class="body">The backgrounds used before 8 October 2026 (the purple and old pink files) are retired and are not in this library.</p>`;
  const extraCss = `
  .bgl-sec{margin:0 0 8px}
  .bgl-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:16px;margin-bottom:24px;align-items:end}
  .bgl-tile{margin:0;display:flex;flex-direction:column;gap:8px}
  .bgl-stage{display:block;border:1px solid var(--aha-border-default);border-radius:8px;overflow:hidden;line-height:0;transition:border-color var(--aha-motion-fast) var(--aha-ease-out)}
  .bgl-stage:hover{border-color:var(--aha-color-primary)}
  .bgl-stage:focus-visible,.bgl-file:focus-visible,.bgl-ref:focus-visible{outline:2px solid var(--aha-color-primary);outline-offset:2px}
  .bgl-stage img{display:block;width:100%;height:auto}
  .bgl-tile figcaption{display:flex;flex-wrap:wrap;gap:4px 12px;align-items:baseline;font-size:14px}
  .bgl-name{font-weight:var(--aha-weight-semibold);color:var(--aha-text-default)}
  .bgl-size{color:var(--aha-text-secondary)}
  .bgl-file{flex-basis:100%;font-family:Menlo,monospace;font-size:12px;color:var(--aha-text-secondary);text-decoration:none;overflow-wrap:anywhere}
  .bgl-file:hover{color:var(--aha-text-link)}
  .bgl-rules{margin:0 0 16px;padding-left:20px;font-size:16px;line-height:24px;color:var(--aha-text-default)}
  .bgl-rules li{margin-bottom:8px}
  .bgl-ref{font-family:Menlo,monospace;font-size:12px;color:var(--aha-text-secondary);margin-right:4px}
  .bgl-code{margin:0 0 16px;padding:12px 16px;border:1px solid var(--aha-border-default);border-radius:8px;background:var(--aha-bg-container-secondary);font-size:14px;line-height:22px;white-space:pre-wrap;overflow-wrap:anywhere}`;
  return { main, extraCss };
}
