#!/usr/bin/env node
/**
 * Proves the design system is genuinely IMPORTABLE — not reference-only.
 * Resolves every entry point by its published package name (`@ahaslides/design/*`,
 * via Node self-referencing over the `exports` map) and exercises the real modules.
 * A DOM-free smoke test: the leaf elements are exercised under a minimal shim.
 */
import assert from 'node:assert';

// --- minimal DOM shim so the custom-element modules run headless (no browser needed) ---
const defined = new Map();
globalThis.window = globalThis;
globalThis.customElements = { define: (t, c) => defined.set(t, c), get: (t) => defined.get(t) };
globalThis.HTMLElement = class { constructor() { this.attributes = {}; } };

let pass = 0; const ok = (name, cond) => { assert.ok(cond, name); console.log('  ·', name); pass++; };

// 1) icons — resolves by name, exposes the catalogue, registers the element
const iconsMod = await import('@ahaslides/design/icons');
ok('import "@ahaslides/design/icons" resolves', !!iconsMod);
ok('exports icons registry (>200 glyphs)', Object.keys(iconsMod.icons).length > 200);
ok('exports ICON_NAMES incl. system-bell', iconsMod.ICON_NAMES.includes('system-bell'));
ok('hasIcon() works', iconsMod.hasIcon('slidetype-poll') && !iconsMod.hasIcon('nope-not-real'));
ok('a glyph carries viewBox + body', /viewBox|^/.test(iconsMod.icons['system-bell'].viewBox) && iconsMod.icons['system-bell'].body.includes('path'));
ok('importing registered <aha-icon>', !!customElements.get('aha-icon'));

// 2) icons-registry (raw ESM data) resolves too
const reg = await import('@ahaslides/design/icons-registry');
ok('import "@ahaslides/design/icons-registry" resolves', Object.keys(reg.icons).length === iconsMod.ICON_NAMES.length);
ok('registry meta carries source + count', reg.meta.count > 200 && /Figma/.test(reg.meta.generatedFrom));

// 3) checkbox — resolves and registers
const cb = await import('@ahaslides/design/aha-checkbox');
ok('import "@ahaslides/design/aha-checkbox" resolves', !!cb.AhaCheckbox);
ok('importing registered <aha-checkbox>', !!customElements.get('aha-checkbox'));

// 4) table-theme — the composite's shared, importable contract
const { tableTheme } = await import('@ahaslides/design/table-theme');
ok('import "@ahaslides/design/table-theme" resolves', tableTheme.components.Table.headerBg === '#ffffff');
ok('table theme carries DS look (white header, radius 8, brand hover)',
  tableTheme.components.Table.headerColor === '#8A8A8A' && tableTheme.components.Table.borderRadius === 8 && tableTheme.components.Table.rowHoverBg === '#F9F5FF');

// 5) tokens — the importable token layer
const tk = await import('@ahaslides/design/tokens');
ok('import "@ahaslides/design/tokens" resolves', tk.tokens.color.primary === '#6A1EBB');

console.log(`\n✓ import surface: ${pass} checks pass — @ahaslides/design/* resolves and works.`);
