export const ALERT_LINK_RULE_GROUPS = { 'alert-button-link': ['alert-button-link'] };

const ALERT_BLOCK = /<(aha-alert|aha-info-box)\b[^>]*>([\s\S]*?)<\/\1>/gi;
const ACTION_BUTTON = /<aha-button\b[^>]*\bslot\s*=\s*["']action["'][^>]*>[\s\S]*?<\/aha-button>/gi;
const MESSAGE_BUTTON = /<aha-button\b/i;
const MESSAGE_LINK_RULE = 'a link in an Alert or info box message is a plain <a href> in the standard inline style, never an <aha-button> in the sentence (it renders as a button and breaks the line spacing); a separate action goes in slot="action"';

export function alertButtonLinkFindings(text) {
  const findings = [];
  for (const block of text.matchAll(ALERT_BLOCK)) {
    const message = block[2].replace(ACTION_BUTTON, (action) => action.replace(/[^\n]/g, ' '));
    const hit = MESSAGE_BUTTON.exec(message);
    if (!hit) continue;
    const bodyStart = block.index + block[0].indexOf('>') + 1;
    const line = text.slice(0, bodyStart + hit.index).split('\n').length;
    findings.push({ line, endLine: line, rule: 'alert-button-link', message: MESSAGE_LINK_RULE, severity: 'hard' });
  }
  return findings;
}
