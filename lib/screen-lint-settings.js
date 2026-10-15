/*
 * screen-lint settings-surface rules — a slide type's settings panel is built from the elements
 * lib/settings.js registers, its fields at the default size. lib/screen-lint.js calls
 * `settingsControlFindings` once per line, and one `createSettingsFieldRules()` per file once per line
 * (it carries a tag or a field variable from one line to the next).
 */
import { SETTINGS_ELEMENTS } from './settings-elements.js';

export const SETTINGS_SURFACES = ['settings'];

export const SETTINGS_RULE_GROUPS = {
  control: ['raw-control', 'unregistered-element'],
  field: ['field-size-large', 'input-maxlength'],
};

const REGISTERED = new Set(SETTINGS_ELEMENTS);
const SETTINGS_DOC = 'https://design.ahaslides.io/settings/index.html';
const COMMENT_LINE = /^\s*(?:\/\/|\/\*|\*(?:\s|\/|$)|<!--(?:(?!-->).)*(?:-->\s*)?$)/;

const RAW_CONTROL_MARKUP = /<(button|input|select|textarea)(?=[\s>/]|$)/gi;
const RAW_CONTROL_FACTORY = /(?<![\w$])(?:el|elem|element|h|tag|node|dom|createEl|createElement|createElementNS)\(\s*(?:[\w$.]+\s*,\s*|["'][^"']*["']\s*,\s*)?["'](button|input|select|textarea)["']\s*[,)]/g;
const ROLE_SWITCH = [
  /(?<![[\w-])role\s*=\s*\\?["']?switch\b/i,
  /(?<![\w$-])["']?role["']?\s*:\s*["']switch["']/,
  /["']role["']\s*,\s*["']switch["']/,
  /\.role\s*=(?!=)\s*["']switch["']/,
];
const AHA_TAG_MARKUP = /<(aha-[a-z0-9-]+)(?![\w-])/gi;
const AHA_TAG_FACTORY = /(?<![\w$])(?:el|elem|element|h|tag|node|dom|createEl|createElement|createElementNS)\(\s*(?:[\w$.]+\s*,\s*|["'][^"']*["']\s*,\s*)?["'](aha-[a-z0-9-]+)["']\s*[,)]/g;

const REPLACEMENT = {
  button: '<aha-button>',
  input: '<aha-input>, <aha-checkbox>, <aha-switch> or <aha-counted-input>',
  select: '<aha-select> or <aha-segmented>',
  textarea: '<aha-counted-textarea>',
  switch: '<aha-switch>',
};

const rawControlMessage = (control) =>
  `a raw ${control === 'switch' ? 'role="switch"' : `<${control}>`} in a settings panel — use ${REPLACEMENT[control]} from lib/settings.js (settings C2, C10, C11; ${SETTINGS_DOC}). A bespoke control the DS does not ship keeps it with ds-lint-allow: raw-control (why)`;

const unregisteredMessage = (tag) =>
  `<${tag}> is not registered by lib/settings.js — a settings panel uses only the elements that entry loads (one script tag), so this renders as an unknown element. Pick one from lib/settings.js, or keep it with ds-lint-allow: unregistered-element (why)`;

export function settingsControlFindings(line) {
  if (COMMENT_LINE.test(line)) return [];
  const findings = [];
  const seenControls = new Set();
  const addControl = (control) => {
    if (seenControls.has(control)) return;
    seenControls.add(control);
    findings.push({ rule: 'raw-control', severity: 'hard', message: rawControlMessage(control) });
  };
  for (const pattern of [RAW_CONTROL_MARKUP, RAW_CONTROL_FACTORY])
    for (const match of line.matchAll(pattern)) addControl(match[1].toLowerCase());
  if (ROLE_SWITCH.some((pattern) => pattern.test(line))) addControl('switch');

  const seenTags = new Set();
  for (const pattern of [AHA_TAG_MARKUP, AHA_TAG_FACTORY])
    for (const match of line.matchAll(pattern)) {
      const tag = match[1].toLowerCase();
      if (REGISTERED.has(tag) || seenTags.has(tag)) continue;
      seenTags.add(tag);
      findings.push({ rule: 'unregistered-element', severity: 'hard', message: unregisteredMessage(tag) });
    }
  return findings;
}

const FIELD_TAGS = ['aha-input', 'aha-counted-input', 'aha-counted-textarea', 'aha-number-with-unit', 'aha-select'];
const FIELD_ALTERNATION = FIELD_TAGS.join('|');
const FIELD_MARKUP = new RegExp(`<(${FIELD_ALTERNATION})(?![\\w-])`, 'gi');
const FIELD_REFERENCE = new RegExp(`["'](?:aha-)?(input|counted-input|counted-textarea|number-with-unit|select)["']`, 'gi');
const FIELD_VARIABLE = new RegExp(`(?:^|[^\\w$.])([A-Za-z_$][\\w$]*)\\s*=\\s*(?:document\\.)?(?:el|elem|element|h|tag|node|dom|createEl|createElement)\\(\\s*["'](${FIELD_ALTERNATION})["']`, 'g');
const LARGE_ATTRIBUTE = /(?<![\w-])size\s*=\s*\\?["']?(large|lg)\b/i;
const LARGE_PROPERTY = /(?<![\w$-])["']?size["']?\s*:\s*["'](large|lg)["']/i;
const MAXLENGTH_ATTRIBUTE = /(?<![\w-])maxlength\s*=/i;
const MAXLENGTH_PROPERTY = /(?<![\w$-])["']?maxlength["']?\s*:/i;
const largeSetOn = (name) => new RegExp(`(?<![\\w$])${name.replace(/\$/g, '\\$')}\\s*(?:\\.setAttribute\\(\\s*["']size["']\\s*,\\s*|\\.size\\s*=\\s*)["'](large|lg)["']`, 'i');
const maxlengthSetOn = (name) => new RegExp(`(?<![\\w$])${name.replace(/\$/g, '\\$')}\\s*(?:\\.setAttribute\\(\\s*["']maxlength["']|\\.maxLength\\s*=(?!=))`, 'i');
const OPEN_TAG_LINE_LIMIT = 12;

const largeMessage = (tag, size) =>
  `<${tag} size="${size}"> in a settings panel — every settings field is the default 40px size; large belongs to the audience field inside <aha-audience-field>, never a settings panel (settings C19; ${SETTINGS_DOC}). Drop the size attribute`;
const MAXLENGTH_MESSAGE =
  `maxlength on <aha-input> in a settings panel — <aha-input> has no character counter, so a cap invites a hand-made counter beside the field. Use <aha-counted-input maxlength="…">: its counter sits inside the field and shows only on focus (settings C19; ${SETTINGS_DOC})`;

const fieldTagOf = (reference) => (reference.startsWith('aha-') ? reference : 'aha-' + reference).toLowerCase();

function tagEnd(line, from) {
  let quote = null;
  for (let index = from; index < line.length; index++) {
    const character = line[index];
    if (quote) { if (character === quote) quote = null; }
    else if (character === '"' || character === "'") quote = character;
    else if (character === '>') return index;
  }
  return -1;
}

export function createSettingsFieldRules() {
  let openTag = null;
  let openTagLines = 0;
  const fieldVariables = new Map();

  return function settingsFieldFindings(line) {
    if (COMMENT_LINE.test(line)) return [];
    const findings = [];
    const reported = new Set();
    const report = (rule, message) => {
      if (reported.has(rule)) return;
      reported.add(rule);
      findings.push({ rule, severity: 'hard', message });
    };
    const checkTag = (tag, text) => {
      const large = text.match(LARGE_ATTRIBUTE);
      if (large) report('field-size-large', largeMessage(tag, large[1].toLowerCase()));
      if (tag === 'aha-input' && MAXLENGTH_ATTRIBUTE.test(text)) report('input-maxlength', MAXLENGTH_MESSAGE);
    };

    if (openTag) {
      const close = tagEnd(line, 0);
      checkTag(openTag, line.slice(0, close < 0 ? line.length : close));
      openTagLines++;
      if (close >= 0 || openTagLines > OPEN_TAG_LINE_LIMIT) openTag = null;
    }
    for (const match of line.matchAll(FIELD_MARKUP)) {
      const tag = match[1].toLowerCase();
      const close = tagEnd(line, match.index);
      checkTag(tag, line.slice(match.index, close < 0 ? line.length : close));
      if (close < 0) { openTag = tag; openTagLines = 0; }
    }

    const references = [...line.matchAll(FIELD_REFERENCE)].map((match) => fieldTagOf(match[1]));
    if (references.length) {
      const large = line.match(LARGE_PROPERTY);
      if (large) report('field-size-large', largeMessage(references[0], large[1].toLowerCase()));
      if (references.includes('aha-input') && MAXLENGTH_PROPERTY.test(line)) report('input-maxlength', MAXLENGTH_MESSAGE);
    }

    for (const match of line.matchAll(FIELD_VARIABLE)) fieldVariables.set(match[1], match[2].toLowerCase());
    for (const [name, tag] of fieldVariables) {
      const large = line.match(largeSetOn(name));
      if (large) report('field-size-large', largeMessage(tag, large[1].toLowerCase()));
      if (tag === 'aha-input' && maxlengthSetOn(name).test(line)) report('input-maxlength', MAXLENGTH_MESSAGE);
    }
    return findings;
  };
}
