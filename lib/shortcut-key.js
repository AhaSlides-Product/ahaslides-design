/**
 * @ahaslides-product/design/shortcut-key — the keyboard-shortcut chip that <aha-button shortcut>
 * and <aha-tooltip shortcut> draw after their label.
 *
 *   shortcut="M" | "Esc" | "Enter" | "Shift+Enter" | "Mod+Enter"
 *
 * Display only: the chip binds no key and is hidden from assistive tech (the control's own name
 * carries the key). Keys join with "+". `Mod` is the presenter's command key, ⌘ on a Mac and Ctrl
 * elsewhere; on a Mac every modifier draws as its glyph (⌘ ⇧ ⌥ ⌃), elsewhere as a word (Ctrl, Shift,
 * Alt). Enter draws the DS icon system-key-return. A single visible character is a 24 × 24 square;
 * a longer key keeps the 24px height and grows with 6px side padding.
 */

export const SHORTCUT_CHIP_STYLE = `
  .shortcut{ flex:none; display:inline-flex; align-items:center; justify-content:center; gap:var(--aha-space-4,4px);
    box-sizing:border-box; height:24px; min-width:24px; padding:0 var(--aha-space-6,6px); border-radius:var(--aha-radius-xs,4px);
    font:400 var(--aha-size-default,14px)/1 var(--aha-font-product,"Plus Jakarta Sans",sans-serif); letter-spacing:.02em; color:inherit;
    background:color-mix(in srgb, currentColor 16%, transparent) }
  .shortcut[hidden]{ display:none }
  .shortcut.square{ padding:0; width:24px }
  .shortcut aha-icon{ display:inline-flex; line-height:0 }
`;

const APPLE_GLYPH = { Mod: '⌘', Cmd: '⌘', Meta: '⌘', Ctrl: '⌃', Shift: '⇧', Alt: '⌥', Option: '⌥' };
const OTHER_WORD = { Mod: 'Ctrl', Cmd: 'Ctrl', Meta: 'Ctrl', Ctrl: 'Ctrl', Shift: 'Shift', Alt: 'Alt', Option: 'Alt' };
const RETURN_KEYS = new Set(['enter', 'return']);
const ESCAPE_KEYS = new Set(['esc', 'escape']);

export function isApplePlatform(navigatorLike = globalThis.navigator) {
  const platform = navigatorLike?.userAgentData?.platform || navigatorLike?.platform || '';
  return /mac|iphone|ipad|ipod/i.test(platform);
}

/** The chip's content in order: strings, and `{ icon }` for a key drawn as a DS icon. */
export function shortcutPieces(value, apple = isApplePlatform()) {
  const keys = String(value ?? '').split('+').map((key) => key.trim()).filter(Boolean);
  const pieces = [];
  for (const key of keys) {
    const lower = key.toLowerCase();
    const modifier = Object.keys(APPLE_GLYPH).find((name) => name.toLowerCase() === lower);
    let piece;
    if (modifier) piece = apple ? APPLE_GLYPH[modifier] : OTHER_WORD[modifier];
    else if (RETURN_KEYS.has(lower)) piece = { icon: 'system-key-return' };
    else if (ESCAPE_KEYS.has(lower)) piece = 'Esc';
    else piece = key;
    const previous = pieces[pieces.length - 1];
    if (typeof piece === 'string' && typeof previous === 'string') pieces[pieces.length - 1] = previous + (apple ? '' : ' ') + piece;
    else pieces.push(piece);
  }
  return pieces;
}

/** Fill a persistent chip element in place; an empty value hides it. */
export function fillShortcutChip(chip, value, apple = isApplePlatform()) {
  const pieces = shortcutPieces(value, apple);
  const visibleCharacters = pieces.reduce((count, piece) => count + (typeof piece === 'string' ? [...piece.replace(/\s/g, '')].length : 1), 0);
  chip.replaceChildren(...pieces.map((piece) => {
    if (typeof piece === 'string') return document.createTextNode(piece);
    const icon = document.createElement('aha-icon');
    icon.setAttribute('name', piece.icon);
    icon.setAttribute('size', '16');
    icon.setAttribute('decorative', '');
    return icon;
  }));
  chip.classList.toggle('square', visibleCharacters === 1);
  chip.hidden = pieces.length === 0;
  if (pieces.some((piece) => typeof piece !== 'string') && typeof customElements !== 'undefined' && !customElements.get('aha-icon')) {
    import('./icons.js');
  }
  return pieces;
}
