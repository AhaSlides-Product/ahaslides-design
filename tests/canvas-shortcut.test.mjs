import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { evaluateInPage, resolveChrome, withPage } from '../cdp.mjs';
import { shortcutPieces } from '../lib/shortcut-key.js';

const fixture = pathToFileURL(fileURLToPath(new URL('./canvas-shortcut.html', import.meta.url))).href;
const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';
const readyExpr = '!!window.canvasFixtureReady';

test('shortcut keys follow the platform: glyphs on a Mac, words elsewhere, Enter as the return icon', () => {
  assert.deepEqual(shortcutPieces('Mod+Enter', true), ['⌘', { icon: 'system-key-return' }]);
  assert.deepEqual(shortcutPieces('Mod+Enter', false), ['Ctrl', { icon: 'system-key-return' }]);
  assert.deepEqual(shortcutPieces('Shift+Enter', false), ['Shift', { icon: 'system-key-return' }]);
  assert.deepEqual(shortcutPieces('Mod+Shift+K', true), ['⌘⇧K']);
  assert.deepEqual(shortcutPieces('Mod+K', false), ['Ctrl K']);
  assert.deepEqual(shortcutPieces('Escape', true), ['Esc']);
  assert.deepEqual(shortcutPieces('', true), []);
});

const deckVars = String.raw`(async () => {
  const { canvasDeckVars } = await import('../lib/canvas-deck.js');
  return { pink: canvasDeckVars({ accent: '#E70E68' }), pale: canvasDeckVars({ accent: '#F8B7D2' }) };
})()`;

test('canvas deck: accent hover and press darken 12% and 22%, label and chip wash follow the accent', { skip }, async () => {
  const { pink, pale } = await evaluateInPage(fixture, deckVars, { readyExpr, timeout: 45000 });
  assert.equal(pink['--aha-button-primary-bg-hover'], '#CB0C5C');
  assert.equal(pink['--aha-button-primary-bg-press'], '#B40B51');
  assert.equal(pink['--aha-button-primary-text'], '#FFFFFF');
  assert.equal(pink['--aha-button-primary-shortcut-bg'], 'rgba(0,0,0,.2)');
  assert.equal(pink['--aha-button-elevate-primary-hover'], 'var(--aha-button-elevate-primary)');
  assert.equal(pale['--aha-button-primary-text'], '#1A1A1A');
  assert.match(pale['--aha-button-primary-shortcut-bg'], /10%/);
});

const measure = String.raw`(async () => {
  const frame = () => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)));
  await customElements.whenDefined('aha-icon'); await frame();
  const chipOf = (id) => document.getElementById(id).shadowRoot.querySelector('.shortcut');
  const box = (el) => { const r = el.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height), right: r.right, left: r.left }; };
  const style = (el) => getComputedStyle(el);
  const out = {};
  const primary = document.getElementById('primary');
  const button = primary.shadowRoot.querySelector('button');
  const chip = chipOf('primary');
  out.primaryButton = box(button);
  out.primaryChip = { ...box(chip), radius: style(chip).borderRadius, font: style(chip).fontSize + '/' + style(chip).fontWeight, bg: style(chip).backgroundColor, color: style(chip).color, hidden: chip.hidden, ariaHidden: chip.getAttribute('aria-hidden'), icon: !!chip.querySelector('aha-icon[name="system-key-return"]') };
  out.chipEndInset = Math.round(button.getBoundingClientRect().right - chip.getBoundingClientRect().right);
  out.primaryHoverBg = style(button).getPropertyValue('--aha-button-primary-bg-hover').trim();
  out.darkLabelChipBg = style(chipOf('dark-label')).backgroundColor;
  out.darkLabelText = style(document.getElementById('dark-label').shadowRoot.querySelector('button')).color;
  out.secondaryChip = { ...box(chipOf('secondary')), bg: style(chipOf('secondary')).backgroundColor };
  out.disabledChipBg = style(chipOf('disabled')).backgroundColor;
  out.iconOnlyChipDisplay = style(chipOf('mute')).display;
  const shadowRootBefore = primary.shadowRoot.querySelector('button');
  primary.setAttribute('shortcut', 'Mod+Shift+K');
  out.sameButtonAfterShortcutChange = primary.shadowRoot.querySelector('button') === shadowRootBefore;
  out.chipTextAfterChange = chip.textContent;
  out.chipSquareAfterChange = chip.classList.contains('square');
  primary.removeAttribute('shortcut');
  out.chipHiddenWhenRemoved = chip.hidden;

  const tip = document.getElementById('tip');
  const bubble = tip.shadowRoot.querySelector('.bubble');
  const tipChip = bubble.querySelector('.shortcut');
  out.tipBubble = { ...box(bubble), font: style(bubble).fontSize + '/' + style(bubble).fontWeight + '/' + style(bubble).lineHeight, padding: style(bubble).padding, shadow: style(bubble).boxShadow, whiteSpace: style(bubble).whiteSpace };
  out.tipChip = { ...box(tipChip), font: style(tipChip).fontSize, bg: style(tipChip).backgroundColor, ariaHidden: tipChip.getAttribute('aria-hidden'), text: tipChip.textContent };
  out.tipChipEndInset = Math.round(bubble.getBoundingClientRect().right - tipChip.getBoundingClientRect().right);
  out.tipNameToChip = Math.round(tipChip.getBoundingClientRect().left - bubble.getBoundingClientRect().left - 12);
  tip.setAttribute('text', 'Mute the background music for everyone in the room');
  out.longTipHeight = Math.round(bubble.getBoundingClientRect().height);
  const defaultBubble = document.getElementById('default-tip').shadowRoot.querySelector('.bubble');
  out.defaultBubble = { font: style(defaultBubble).fontSize + '/' + style(defaultBubble).lineHeight, padding: style(defaultBubble).padding, shadow: style(defaultBubble).boxShadow, chipHidden: defaultBubble.querySelector('.shortcut').hidden };
  return out;
})()`;

test('the shortcut chip and the lg tooltip render the signed-off canvas values', { skip }, async () => {
  const r = await evaluateInPage(fixture, measure, { readyExpr, timeout: 45000 });
  assert.equal(r.primaryButton.h, 40);
  assert.deepEqual([r.primaryChip.w, r.primaryChip.h], [24, 24]);
  assert.equal(r.primaryChip.radius, '4px');
  assert.equal(r.primaryChip.font, '14px/400');
  assert.equal(r.primaryChip.bg, 'rgba(0, 0, 0, 0.2)');
  assert.equal(r.primaryChip.ariaHidden, 'true');
  assert.equal(r.primaryChip.icon, true);
  assert.equal(r.chipEndInset, 9, '8px end padding inside the 1px border');
  assert.equal(r.primaryHoverBg, '#CB0C5C');
  assert.equal(r.darkLabelText, 'rgb(26, 26, 26)');
  assert.match(r.darkLabelChipBg, /0\.1\)$/);
  assert.equal(r.secondaryChip.h, 24);
  assert.ok(r.secondaryChip.w > 24, 'a word key grows wider');
  assert.match(r.secondaryChip.bg, /0\.16\)$/);
  assert.match(r.disabledChipBg, /0\.16\)$/);
  assert.equal(r.iconOnlyChipDisplay, 'none');
  assert.equal(r.sameButtonAfterShortcutChange, true, 'a shortcut change does not rebuild the shadow DOM');
  assert.equal(r.chipTextAfterChange, 'Ctrl Shift K');
  assert.equal(r.chipSquareAfterChange, false);
  assert.equal(r.chipHiddenWhenRemoved, true);

  assert.equal(r.tipBubble.h, 36);
  assert.equal(r.tipBubble.font, '16px/400/24px');
  assert.equal(r.tipBubble.padding, '6px 6px 6px 12px');
  assert.match(r.tipBubble.shadow, /^(rgba\(255, 255, 255, 0\.2\)|color\(srgb 1 1 1 \/ 0\.2\)) 0px 0px 0px 1px$/);
  assert.equal(r.tipBubble.whiteSpace, 'nowrap');
  assert.deepEqual([r.tipChip.w, r.tipChip.h], [24, 24]);
  assert.equal(r.tipChip.font, '14px');
  assert.match(r.tipChip.bg, /0\.16\)$/);
  assert.equal(r.tipChip.ariaHidden, 'true');
  assert.equal(r.tipChipEndInset, 6);
  assert.equal(r.longTipHeight, 36, 'the lg tooltip stays on one line past 280px');
  assert.equal(r.defaultBubble.font, '12px/18px');
  assert.equal(r.defaultBubble.padding, '6px 10px');
  assert.equal(r.defaultBubble.chipHidden, true);
});

async function descriptionOf(command, expression) {
  const { result } = await command('Runtime.evaluate', { expression });
  const { nodes } = await command('Accessibility.getPartialAXTree', { objectId: result.objectId, fetchRelatives: false });
  const node = nodes.find((n) => !n.ignored) || nodes[0];
  return { name: node.name?.value ?? '', description: node.description?.value ?? '' };
}

test('a tooltip text reaches the trigger\'s accessible description', { skip }, async () => {
  const r = await withPage(fixture, async (command) => {
    await command('Accessibility.enable');
    return {
      ahaButton: await descriptionOf(command, `document.getElementById('mute').shadowRoot.querySelector('button')`),
      native: await descriptionOf(command, `document.getElementById('native')`),
      help: await descriptionOf(command, `document.getElementById('help-tip').shadowRoot.querySelector('.help')`),
    };
  }, { readyExpr, timeout: 45000 });
  assert.equal(r.ahaButton.name, 'Mute music (M)');
  assert.equal(r.ahaButton.description, 'Mute music');
  assert.equal(r.native.description, 'Copy link');
  assert.equal(r.help.description, 'Help hint');
});
