import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { markupToHtml, markupToText, longDate, parseTemplate, sectionBlocks, escapeHtml, sectionNumber, fill, withDeprecatedAliases } from './colour-rules.mjs';

export const VOICE_RULES_FILE = 'brand/voice-rules.json';
export const VOICE_RULES_TEMPLATE_FILE = 'brand/voice-rules.template.html';
export const VOICE_RULES_PAGE = 'foundations/brand-voice-rules.html';

export function loadVoiceRules(root) {
  return JSON.parse(readFileSync(join(root, VOICE_RULES_FILE), 'utf8'));
}

const kindIds = (voice) => voice.kinds.map(kind => kind.id);

/** Every rule in reading order with the environments and kinds of communication it applies to. */
export function listVoiceRules(voice) {
  const list = [];
  for (const section of voice.sections) {
    for (const block of sectionBlocks(section)) {
      if (block.type !== 'rules') continue;
      for (const rule of block.rules) {
        list.push({
          id: rule.id, section: sectionNumber(section), sectionTitle: section.title, text: markupToText(rule.text),
          environment: rule.environment || section.environment || voice.environment,
          kinds: rule.kinds || section.kinds || kindIds(voice),
          origin: rule.origin || 'brand guidelines v2.2',
        });
      }
    }
  }
  return list;
}

export function listVoiceTables(voice) {
  return voice.sections.flatMap(section => sectionBlocks(section).filter(block => block.type === 'table').map(block => ({
    id: block.id, section: sectionNumber(section), sectionTitle: section.title, kinds: section.kinds || kindIds(voice),
    columns: block.columns, rows: block.rows.map(row => row.map(markupToText)),
  })));
}

/** The retired wording table as [phrase, use instead] pairs. */
export function retiredWording(voice) {
  const table = voice.sections.flatMap(sectionBlocks).find(block => block.type === 'table' && block.id === 'retired-wording');
  return table.rows.map(([phrase, replacement]) => ({ phrase: markupToText(phrase), replacement: markupToText(replacement) }));
}

function blockHtml(block, parts) {
  const grid = (columns, rows) => fill(parts['rules-table'], {
    head: columns.map(column => `<th>${escapeHtml(column)}</th>`).join('\n'),
    rows: rows.map(row => `<tr>\n${row.map(cell => `<td>${cell}</td>`).join('\n')}\n</tr>`).join('\n'),
  });
  const tag = (rule) => (rule.kinds || rule.environment ? `<span class="tag">${escapeHtml([...(rule.kinds || []), ...(rule.environment || [])].join(', '))}</span>` : '');
  if (block.type === 'paragraph') return `<p>${markupToHtml(block.text)}</p>`;
  if (block.type === 'heading') return `<h3 id="${block.anchor}" class="sub">${escapeHtml(block.text)}</h3>`;
  if (block.type === 'quote') return `<blockquote>${markupToHtml(block.text)}</blockquote>`;
  if (block.type === 'list') return `${block.label ? `<p><strong>${escapeHtml(block.label)}</strong></p>` : ''}<ul>\n${block.items.map(item => `<li>${markupToHtml(item)}</li>`).join('\n')}\n</ul>`;
  if (block.type === 'table') return grid(block.columns, block.rows.map(row => row.map(markupToHtml)));
  if (block.type === 'rules') {
    return `<ol class="rule-list">\n${block.rules.map(rule => `<li id="r${rule.id}"><span class="rule-id">${rule.id}</span>${markupToHtml(rule.text)}${tag(rule)}${rule.origin ? `<span class="origin">Source: ${escapeHtml(rule.origin)}</span>` : ''}</li>`).join('\n')}\n</ol>`;
  }
  throw new Error(`${VOICE_RULES_FILE}: unknown block type "${block.type}"`);
}

export function renderVoiceRulesPage(voice, { fonts, templateHtml, palette }) {
  const { shell, parts } = parseTemplate(templateHtml);
  const number = (section) => `<span class="num">${sectionNumber(section)}</span>`;
  return fill(shell, {
    title: escapeHtml(voice.title),
    fontRegular: fonts.regular, fontSemiBold: fonts.semiBold,
    vividPink: palette.vividPink, darkerPink: palette.darkerPink, vividPink5: palette.vividPink5, vividPink30: palette.vividPink30, purple: palette.purple,
    contents: voice.sections.map(section => `<li><a href="#${section.id}">${number(section)}${escapeHtml(section.title)}</a></li>`).join(''),
    lede: markupToHtml(voice.lede),
    updated: longDate(voice.updated),
    ownerNote: `Owner: ${escapeHtml(voice.owner.name)} (<a href="mailto:${escapeHtml(voice.owner.email)}">${escapeHtml(voice.owner.email)}</a>). Change a rule here and nowhere else.`,
    kinds: voice.kinds.map(kind => `<li><strong>${escapeHtml(kind.label)}.</strong> ${markupToHtml(kind.summary)}</li>`).join(''),
    glance: voice.glance.map(line => `<li>${markupToHtml(line)}</li>`).join(''),
    sections: voice.sections.map(section =>
      `<h2 id="${section.id}">${number(section)}${escapeHtml(section.title)}</h2>\n${section.blocks.map(block => blockHtml(block, parts)).join('\n')}`).join('\n'),
    changes: voice.changes.map(change => `<li><span class="ver">${escapeHtml(change.version)}</span><span class="date">${escapeHtml(change.date)}</span><span>${escapeHtml(change.text)}</span></li>`).join(''),
  });
}

export function renderVoiceRulesAgent(voice, { site }) {
  const ruleList = listVoiceRules(voice);
  const byIds = (key, names) => Object.fromEntries(names.map(name => [name, ruleList.filter(rule => rule[key].includes(name)).map(rule => rule.id)]));
  return JSON.stringify({
    generatedFrom: VOICE_RULES_FILE,
    title: voice.title,
    updated: voice.updated,
    page: `${site}/${VOICE_RULES_PAGE}`,
    owner: voice.owner,
    howToRead: 'Pick the kind of communication you are writing (external, product or internal), read rulesByKind for its rule ids, then the rules and tables with those ids. Visual rules are not here: see colour-rules.md and the design system.',
    kinds: voice.kinds,
    glance: voice.glance.map(markupToText),
    rulesByKind: byIds('kinds', kindIds(voice)),
    rulesByEnvironment: withDeprecatedAliases(byIds('environment', voice.environment)),
    rules: ruleList,
    tables: listVoiceTables(voice),
    retired: retiredWording(voice),
    changes: voice.changes,
  }, null, 2) + '\n';
}

export function renderVoiceRulesMd(voice, { site }) {
  const ruleList = listVoiceRules(voice);
  const tag = (rule) => `[${rule.kinds.join(', ')}]`;
  let md = `# ${voice.title}\n\n> Generated from ${VOICE_RULES_FILE}, do not edit by hand. The human page is ${site}/${VOICE_RULES_PAGE}; the machine feed is ${site}/voice-rules.agent.json.\n> Last updated ${longDate(voice.updated)}. Owner: ${voice.owner.name} (${voice.owner.email}). Each rule names the kinds of communication it applies to in square brackets. Visual rules are in ${site}/colour-rules.md and the design system, not here.\n\n${markupToText(voice.lede)}\n\n`;
  md += `## Which rules apply to your work\n\n${voice.kinds.map(kind => `- ${kind.id}: ${kind.label}. ${markupToText(kind.summary)}`).join('\n')}\n\n`;
  md += `## The rules at a glance\n\n${voice.glance.map((line, index) => `${index + 1}. ${markupToText(line)}`).join('\n')}\n\n`;
  md += `## Rules by kind of communication\n\n${kindIds(voice).map(name => `- ${name}: ${ruleList.filter(rule => rule.kinds.includes(name)).map(rule => rule.id).join(', ')}`).join('\n')}\n\n`;
  for (const section of voice.sections) {
    md += `## ${sectionNumber(section)}. ${section.title}\n\n`;
    for (const block of sectionBlocks(section)) {
      if (block.type === 'paragraph') md += `${markupToText(block.text)}\n\n`;
      else if (block.type === 'quote') md += `> ${markupToText(block.text)}\n\n`;
      else if (block.type === 'heading') md += `### ${block.text}\n\n`;
      else if (block.type === 'list') md += `${block.label ? `${block.label}:\n\n` : ''}${block.items.map(item => `- ${markupToText(item)}`).join('\n')}\n\n`;
      else if (block.type === 'table') md += `| ${block.columns.join(' | ')} |\n|${block.columns.map(() => '---').join('|')}|\n${block.rows.map(row => `| ${row.map(markupToText).join(' | ')} |`).join('\n')}\n\n`;
      else if (block.type === 'rules') md += `${block.rules.map(rule => { const full = ruleList.find(entry => entry.id === rule.id); return `- ${rule.id} ${tag(full)} ${markupToText(rule.text)}${rule.origin ? ` (source: ${rule.origin})` : ''}`; }).join('\n')}\n\n`;
    }
  }
  md += `## What changed\n\n${voice.changes.map(change => `- ${change.version} (${change.date}): ${change.text}`).join('\n')}\n`;
  return md;
}

export function voiceRulesIndexLines(site) {
  return [
    `>   ${site}/${VOICE_RULES_PAGE}  brand voice rules, the human page: the one source of the AhaSlides verbal brand (why, positioning, audiences, messaging pillars, opinions, brand spices, tone and voice, writing rules, retired wording, which rules apply to which kind of communication)`,
    `>   ${site}/voice-rules.md   the same rules for agents, each tagged with the kind of communication it applies to (external, product, internal); machine form at ${site}/voice-rules.agent.json. The page and both feeds are generated from one file, ${VOICE_RULES_FILE}. Read this before writing any copy; visual rules are in colour-rules.md`,
  ];
}
