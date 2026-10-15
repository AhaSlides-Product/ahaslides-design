/*
 * screen-lint settings-surface rules — a slide type's settings panel is built from the elements
 * lib/settings.js registers. Pure like the core; lib/screen-lint.js calls `settingsControlFindings`
 * once per line.
 */
import { SETTINGS_ELEMENTS } from './settings-elements.js';

export const SETTINGS_SURFACES = ['settings'];

export const SETTINGS_RULE_GROUPS = {
  control: ['raw-control', 'unregistered-element'],
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
