#!/usr/bin/env node
/**
 * standards.mjs — THE component gate.
 *
 * A component does not pass unless it meets the reusable standard. For EVERY contract in
 * contracts/*.json this enforces, and fails the build (exit 1) on any miss:
 *
 *   1. Contract is complete        — the fields the generator + agents rely on are present.
 *   2. It declares how it's reused  — a `reuse` block naming a real package entry point.
 *   3. That entry is published      — the subpath is in package.json "exports" and the file exists.
 *   4. It actually imports          — `import '@ahaslides-product/design/<entry>'` resolves and runs.
 *   5. It registers / exports       — leaf: registers its custom element; composite: exports its artifact.
 *   6. Its snippets consume the DS  — reference @ahaslides-product/design, never a fake pkg or a banned library.
 *   7. It's render-gated            — carries a `conformance` block so qa.mjs can measure the real UI.
 *   8. Its icons come from the DS   — every <aha-icon name="…"> resolves in the icon registry (the
 *                                     published gallery); no inline <svg> glyph bypasses the library.
 *   9. It's OPERABLE, not just drawn — an interactive element carries the keyboard/aria contract of the
 *                                     role it declares: a roving-widget role has arrow-key nav, a global
 *                                     listener is removed on disconnect, and aria STATE stays in sync
 *                                     (observedAttributes). qa.mjs proves the render; this proves the a11y.
 *
 * This is the "can a teammate contribute safely?" gate: add contracts/<slug>.json + lib/<entry>.js,
 * and this proves your component registers and is genuinely reusable — or it fails, loudly, per rule.
 * (Render truth — does it LOOK right — is qa.mjs. Run both via `npm run check`.)
 */
import { readdirSync, readFileSync, existsSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { ART_SOURCES, coloursInSvg, recolourSvg } from './recolour-art.mjs';
import { FROZEN_SNAPSHOT, validateEvalSets, selfTest as evalHarnessSelfTest } from './anti-slop/evals-harness.mjs';

const root = dirname(fileURLToPath(import.meta.url));
const CDIR = join(root, 'contracts');
const GDIR = join(root, 'guidelines');   // guideline artifacts — prose composition guides (settings, …)
const PDIR = join(root, 'parts');
const DIST = join(root, 'dist');
const read = (p) => (existsSync(p) ? readFileSync(p, 'utf8') : '');
const PKG = JSON.parse(read(join(root, 'package.json')));
const EXPORTS = PKG.exports || {};

/* ===== the VISUAL STANDARD — the "same quality" bar =====
   standards.mjs used to prove a component was *reusable* (importable, registered, consumed by its
   real name). It did NOT prove the component was *on-standard* — that lived only in the aha-design
   skills + judges, which run solely when a contributor chooses to. So a teammate could ship an
   off-palette colour, an off-scale radius, or a nonexistent token and pass both gates.
   These primitives make the house non-negotiables (palette, the 4/6/8/12/16 radius scale, real
   --aha-* tokens) something the gate ENFORCES — not something the author has to remember. */
const TOKENS = JSON.parse(read(join(root, 'tokens.canonical.json')) || '{}');
const BASELINE_PATH = join(root, 'standards.baseline.json');
const BASELINE_SPACING_PX = (existsSync(BASELINE_PATH) ? JSON.parse(readFileSync(BASELINE_PATH, 'utf8')).spacingPx : null) || {};
const UPDATE_BASELINE = process.argv.includes('--update-baseline');
const ACKNOWLEDGE_TOKENS = process.argv.includes('--acknowledge-tokens');
const RADIUS_SCALE = new Set([0, 4, 6, 8, 12, 16, 999]);   // --aha-radius-* ; pill = 999
const NEUTRALS = new Set(['#FFFFFF', '#000000']);          // universal; 'transparent' handled in inPalette
const normHex = (h) => { h = h.toUpperCase(); return /^#[0-9A-F]{3}$/.test(h) ? '#' + [...h.slice(1)].map(c => c + c).join('') : h; };
// every hex the canonical token set blesses — the palette an on-standard colour must land in
const PALETTE = new Set(); JSON.stringify(TOKENS, (key, value) => (key.startsWith('$') || key === 'openItems' ? undefined : value)).replace(/#[0-9A-Fa-f]{3,8}/g, (h) => (PALETTE.add(normHex(h)), h));
// the generated custom properties an author may legitimately bind tokensUsed to (source file, always present)
const CSSVARS = new Set([...read(join(root, 'lib', 'tokens.css')).matchAll(/--aha-[a-z0-9-]+/g)].map(m => m[0]));
const rgbToHex = (s) => { const m = String(s).match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i); return m ? normHex('#' + [1, 2, 3].map(i => (+m[i]).toString(16).padStart(2, '0')).join('')) : null; };
const isColour = (v) => /^\s*(#[0-9A-Fa-f]{3,8}|rgba?\()/.test(String(v));
const isPx = (v) => /^\s*\d+(\.\d+)?px\s*$/.test(String(v));
const inPalette = (v) => { const s = String(v).trim(); if (/^transparent$/i.test(s)) return true; const hex = s.startsWith('#') ? normHex(s) : rgbToHex(s); return !!hex && (PALETTE.has(hex) || NEUTRALS.has(hex)); };

/* ===== the ICON LIBRARY — the single source every component icon must come from =====
   icons/registry.json (built by build-icons.mjs from Figma DS V3) IS the icon library published
   at the gallery below. The house rule is: a component never hand-rolls a glyph — it summons one
   BY NAME via <aha-icon name="…">, and that name must be a real glyph in the registry. This gate
   makes it enforceable: every named icon a component references (in its source, its snippets, or
   its contract) must resolve here, and an inline <svg> glyph in element source is a bypass (caught
   in the source scan below). */
const ICON_REGISTRY = JSON.parse(read(join(root, 'icons', 'registry.json')) || '{"icons":{}}');
const ICON_NAMES = new Set(Object.keys(ICON_REGISTRY.icons || {}));
const ICON_GALLERY = 'https://ahaslides-product.github.io/ahaslides-design/icons/index.html';
// Pull every icon referenced by name from a blob of source / snippet / contract text. A DS icon
// reaches the runtime by two paths, and BOTH must be gated or a bad name ships green:
//   1. the ELEMENT — <aha-icon name="…"> (also :name= for Vue-bind, name={…} for JSX);
//   2. as DATA — an "icon":"…" property inside a component's items tree, a playground option, a
//      preview or the contract JSON (the Menu row {"icon":"system-chart-bar"} is never a tag, so
//      path 1 alone never saw it — the hole that kept shipping broken names).
// A plain static value is one literal; a dynamic binding (ternary) is mined for its quoted string
// literals so those are checked too. A pure-variable binding (name={icon}) carries no literal —
// left to runtime. Only a literal that looks like an icon name (kebab, carries a "-") is validated.
function iconRefs(text) {
  const names = new Set();
  const str = String(text);
  // 1) the element form
  for (const tag of str.match(/<aha-icon\b[^>]*>/gi) || []) {
    const m = tag.match(/(?::|\s)name\s*=\s*(?:"([^"]*)"|'([^']*)'|\{([^}]*)\})/i);
    if (!m) continue;
    const quoted = m[1] ?? m[2];
    if (quoted != null && /^[^"'{}?()\s]+$/.test(quoted) && quoted.includes('-')) { names.add(quoted); continue; }
    for (const lit of (m[1] ?? m[2] ?? m[3] ?? '').match(/['"]([^'"]+)['"]/g) || []) {
      const s = lit.slice(1, -1); if (s.includes('-')) names.add(s);   // a literal inside a dynamic binding
    }
  }
  // 2) the data form — an icon property written "icon":"…" (JSON) or icon:"…" / :icon="…" (JS/Vue).
  //    Backslashes are tolerated so a value escaped inside a stringified-JSON playground option
  //    (\"icon\":\"…\") is still caught. Same literal-only rule as the element form (must carry a "-").
  for (const m of str.matchAll(/(?<![\w-])icon\\?["']?\s*[:=]\s*\\?["']([^"'\\]+)\\?["']/gi)) {
    const s = m[1];
    if (/^[^"'{}?()\s]+$/.test(s) && s.includes('-')) names.add(s);
  }
  return names;
}

// Minimal DOM shim so the custom-element modules import + self-register headlessly (no browser).
const els = new Map();
globalThis.window = globalThis;
globalThis.customElements = { define: (t, c) => els.set(t, c), get: (t) => els.get(t) };
globalThis.HTMLElement = class { constructor() { this.attributes = {}; } };

const REQUIRED = ['name', 'slug', 'group', 'tier', 'summary', 'props', 'spec', 'snippets', 'opinion', 'surfaces', 'preview', 'conformance'];
// A pattern is a composition guide, not a component — different required shape.
const GUIDELINE_REQUIRED = ['name', 'slug', 'kind', 'summary', 'skillRef', 'surfaces', 'composedOf', 'rules'];
// Backlog policy — a pattern that names a component the DS doesn't ship yet.
//   false → WARN: the doc-only pattern lands, the gap is tracked loudly (the pattern pulls the roadmap into the open).
//   true  → HARD FAIL: the referenced components must exist here first before the pattern can pass.
const PATTERN_BACKLOG_HARD_FAIL = false;
// Motion policy — interactive leaf states must animate via the shared motion tokens (--aha-motion-* durations
// + --aha-ease-* curves), not snap and not a bare timing literal; and the transition must live on a PERSISTENT
// node (a subtree rebuild on the state change kills it — the Switch-click bug).
//
// Motion findings are a HARD FAIL by default — so a NEW component can't ship any of them. The only grace is
// MOTION_DEBT below: a tiny, explicit, greppable allow-list of components that already shipped a given defect
// before this gate existed. Those stay WARN (don't brick CI) until Fleet restructures them (Slack PRO38-5).
// Remove each entry as its component is fixed; when MOTION_DEBT is empty the motion gate is fully hard, no exceptions.
// Keys are the element tag; values are the finding kinds grandfathered for it: 'dead' | 'snap' | 'literal' | 'bounce' | 'sync'.
const MOTION_DEBT = {
  // Empty: every grandfathered leaf has been restructured to build once and mutate persistent nodes
  // (PRO38-5). The motion gate is now fully hard — no component gets a pass on snap/dead/literal/sync/bounce.
};
// Accessibility policy — an interactive component must be OPERABLE, not just look right. The render
// gate (qa.mjs) proves it draws + animates; it proves NOTHING about roles, keyboard, or aria state.
// So a whole batch of widgets shipped gate-green with broken a11y (PRO38-8 review): roving roles with
// no arrow-key nav, a leaked document listener, a stale aria-expanded. These source checks close that
// blind spot. Kinds: 'role' (a roving-widget role — radio/tab/menu/option/… — with no arrow-key
// navigation), 'leak' (a document/window listener added with no matching remove — leaks on every
// mount), 'observed' (sets an aria-* STATE attribute imperatively but declares no observedAttributes,
// so an external/framework-driven attribute change silently desyncs the aria — the collapse case), and
// 'toggle' (a <button> toggles a selection class on state but never syncs aria-pressed/aria-checked,
// so a screen reader hears a plain button, not a selected one — the csat / color-picker swatch case).
//
// HARD FAIL by default — a NEW component can't ship any of them. A11Y_DEBT is the same escape hatch as
// MOTION_DEBT: a tiny, greppable allow-list of (element tag → kinds) grandfathered as WARN for debt
// that predates this gate. master ships NONE today, so it starts empty — the gate is fully hard. Add
// an entry only to grandfather real pre-existing debt, and delete it the moment the component is fixed.
const A11Y_DEBT = {
  // 'aha-example': ['role'],   // pre-gate debt tracked on <ticket> — remove when fixed
};
// Responsive policy — product UI is FLUID: it reflows from a 360px phone up and never traps its width.
// The zero-interpretation source tell is a fixed `min-width` px literal at or above the 360px floor: it
// CANNOT shrink to fit a phone, so it forces a horizontal scroll — a device defect. (A fixed `width` below
// the floor is fine — it's a max the element occupies and shrinks in a flex/inline context; a min-width ≥
// floor is the definitive trap.) The render-side truth — does the demo actually overflow at 360 — is qa.mjs's
// responsive sweep; this catches the trap statically so CI hard-fails it without a browser.
// HARD FAIL by default (same escape hatch as MOTION_DEBT/A11Y_DEBT): a NEW component can't ship a
// min-width trap. master ships NONE today (every lib min-width is ≤300px), so it starts empty — fully hard.
// Kinds: 'minwidth' (a fixed min-width ≥ the 360px floor). Per-line override: ds-lint-allow: responsive (why).
const RESPONSIVE_FLOOR = 360;
const RESPONSIVE_DEBT = {
  // 'aha-example': ['minwidth'],   // pre-gate responsive debt tracked on <ticket> — remove when fixed
};
// Font policy — a leaf must let its shadow text INHERIT the host app's typography. The product font is
// pinned ONCE on :host (so standalone usage stays DS-branded); every text-bearing content element then
// inherits it (font-family:inherit). A font-family that names --aha-font-product (or a bare literal font
// stack) on a NON-:host selector re-isolates the text behind the shadow boundary — a themed host can't
// override it and the text drifts off the app's own font (the aha-alert case, PR #98). The mono/display/
// secondary tokens are a distinct surface, not the product-font anti-pattern, so they're allowed.
// HARD FAIL by default (same escape hatch as MOTION/A11Y/RESPONSIVE debt); this PR normalizes every leaf,
// so it starts empty — fully hard. Kind: 'inherit'. Per-line override: ds-lint-allow: font (why).
// Spec: plans/font-inheritance-normalization.md.
const FONT_DEBT = {
  // 'aha-example': ['inherit'],   // pre-gate font debt tracked on <ticket> — remove when fixed
};
// Roving-widget roles: an AT user drives these with the arrow keys (a single tab-stop, roving focus).
// Declaring one obliges the component to implement arrow-key navigation — a click handler is not enough.
// (Container/single-control roles like dialog/switch/checkbox are NOT here: they need focus-management
// or Space/Enter, a different contract, checked elsewhere — flagging them would false-positive.)
const ROVING_ROLES = /role\s*=\s*["'](radiogroup|radio|tablist|tab|menu|menubar|menuitem|menuitemradio|menuitemcheckbox|listbox|option|tree|treeitem|grid|gridcell|combobox)["']/i;
const BANNED = [
  [/@aha\/design\b/, 'the old placeholder specifier @aha/design — must be @ahaslides-product/design'],
  [/@aha\/ui-react\b|@aha\/ui-vue\b/, 'a fictional package — a composite snippet must import the real vendor library + the shared theme'],
  [/lucide|heroicons|font-?awesome|@ant-design\/icons/i, 'a non-DS icon set — use <aha-icon> by name'],
  [/@mui\/|@chakra-ui\/|@radix-ui\/|@mantine\/|react-bootstrap/i, 'a non-AntD component library'],
];

const results = [];
const contracts = readdirSync(CDIR).filter(f => f.endsWith('.json')).map(f => JSON.parse(read(join(CDIR, f))));

for (const ct of contracts) {
  const checks = [];
  const chk = (name, cond, note = '') => checks.push([name, !!cond, cond ? '' : note]);

  // 1) contract completeness
  const missing = REQUIRED.filter(k => ct[k] == null || (Array.isArray(ct[k]) && !ct[k].length));
  chk('contract complete (all required fields)', missing.length === 0, `missing: ${missing.join(', ')}`);
  chk('docs page highlights (1–4 short bullets)', Array.isArray(ct.highlights) && ct.highlights.length >= 1 && ct.highlights.length <= 4 && ct.highlights.every(h => typeof h === 'string' && h.trim()), 'add highlights: 1–4 short bullet strings (rendered under the page title)');
  // Decision: every component supports all three — HTML / React / Vue — and HTML LEADS (it's the
  // default doc tab + agent-feed snippet). Enforce both, not just "≥2 snippets".
  const snippetKeys = (ct.snippets || []).map(s => s.key);
  chk('HTML snippet leads (listed first)', snippetKeys[0] === 'html', 'list the { key:"html" } snippet FIRST — docs + feed lead with it');
  chk('ships React + Vue snippets (all three)', snippetKeys.includes('react') && snippetKeys.includes('vue'), 'every component supports HTML/React/Vue — add the missing snippet');
  chk('≥1 prop documented', Array.isArray(ct.props) && ct.props.length >= 1);

  // 2) declares reuse
  const r = ct.reuse;
  chk('declares a `reuse` entry point', r && typeof r.entry === 'string', 'add "reuse": { entry, registers|exportsNamed }');

  if (r && r.entry) {
    // 3) entry is a published package export that exists on disk
    const mapped = EXPORTS[r.entry];
    chk(`reuse.entry "${r.entry}" is in package.json exports`, !!mapped, 'add it to "exports"');
    chk('entry file exists on disk', mapped && existsSync(resolve(root, mapped)), mapped ? `${mapped} missing` : '');

    // 4) it imports by its published name (self-reference over exports); 5) registers/exports
    const spec = PKG.name + r.entry.replace(/^\./, '');
    try {
      const mod = await import(spec);
      chk(`import "${spec}" resolves`, !!mod);
      if (r.registers) {
        chk(`registers <${r.registers}> on import`, !!customElements.get(r.registers), 'element not defined after import');
      } else {
        chk('composite exports a shared artifact (reuse.exportsNamed)', Array.isArray(r.exportsNamed) && r.exportsNamed.length >= 1,
          'a composite must export a reusable artifact (e.g. a theme)');
      }
      for (const nm of (r.exportsNamed || [])) chk(`exports \`${nm}\``, nm in mod, 'named export missing');
    } catch (e) {
      chk(`import "${spec}" resolves`, false, e.message.split('\n')[0]);
    }
  }

  // 6) snippets consume the DS (real package) and no fakes / banned libs
  const snippetText = (ct.snippets || []).map(s => read(join(PDIR, s.file))).join('\n');
  chk('a snippet imports @ahaslides-product/design', /@ahaslides-product\/design/.test(snippetText) || ct.tier?.includes('composite'),
    'snippets must show consuming the real package');
  for (const [re, why] of BANNED) chk(`snippets free of: ${why}`, !re.test(snippetText), 'found in a snippet');

  // 6d) THEMED IMPERATIVE OVERLAYS — antd's message/notification/Modal have a STATIC form
  //     (message.success(), notification.open(), Modal.confirm()) that renders OUTSIDE the React tree,
  //     so it does NOT read the ConfigProvider theme — the overlay ships un-themed (default antd),
  //     silently breaking the "one DS look across React + Vue" guarantee. qa.mjs only measures the
  //     React conformance harness, so it never catches a Vue snippet that took the static shortcut.
  //     A snippet that consumes these APIs must use the HOOK form (useMessage/useNotification/useModal
  //     + contextHolder) so the overlay is themed. Checked per snippet so we can name the offender.
  for (const s of (ct.snippets || [])) {
    const t = read(join(PDIR, s.file));
    const usesStatic = /\b(message|notification|Modal)\.(success|error|info|warning|open|loading|confirm)\s*\(/.test(t);
    const usesHook = /use(Message|Notification|Modal)\s*\(/.test(t);
    if (usesStatic && !usesHook)
      chk(`snippet "${s.key}": themed overlay via the hook (not the static API)`, false,
        'static message()/notification()/Modal.confirm() renders outside ConfigProvider — use useMessage()/useNotification()/useModal() + contextHolder so it consumes the DS theme');
  }

  // 6c) ICONS COME FROM THE DS LIBRARY — every glyph a component uses must be a real icon in the
  //     registry (the published gallery), summoned as <aha-icon name="…">. Gather every named
  //     reference from the component's own source + all its snippets + preview + the contract text,
  //     and prove each resolves. A typo or a non-DS name renders the dashed error box at runtime —
  //     here it fails the gate loudly instead.
  const iconEntry = r && r.entry && EXPORTS[r.entry] ? read(resolve(root, EXPORTS[r.entry])) : '';
  const iconText = [iconEntry, snippetText, ct.preview ? read(join(PDIR, ct.preview)) : '', JSON.stringify(ct)].join('\n');
  for (const nm of iconRefs(iconText)) {
    chk(`icon "${nm}" is in the DS icon library`, ICON_NAMES.has(nm),
      `not a glyph in icons/registry.json — pick a name from the gallery (${ICON_GALLERY}) or add the SVG + re-run build-icons.mjs`);
  }

  // 6b) EVERY component ships a paste-and-run HTML snippet — no exceptions — so end-users can
  //     vibe-code decks/courses/hubs with no build step. LEAF: the custom element is the native
  //     form (the snippet uses <element> directly). COMPOSITE (no framework-free element): a
  //     CDN-React runnable page — React + antd loaded from a CDN so it still opens-and-renders.
  const isLeaf = !!(ct.reuse && ct.reuse.registers) || /leaf/.test(ct.tier || '');
  const html = (ct.snippets || []).find(s => s.key === 'html');
  chk('ships an HTML (paste-and-run) snippet', !!html, 'add a { key:"html" } snippet in parts/<slug>.html.txt — every component needs one');
  if (html) {
    const htmlText = read(join(PDIR, html.file));
    // The snippet must consume the DS from a public CDN — either the npm package
    // (@ahaslides-product/design) or the repo via jsDelivr /gh/ (ahaslides-product/ahaslides-design).
    const consumesDS = /@ahaslides-product\/design|ahaslides-product\/ahaslides-design/.test(htmlText);
    if (isLeaf) {
      chk('HTML snippet imports the DS + uses the element', consumesDS && new RegExp(`<${ct.element}[\\s>]`).test(htmlText),
        'a leaf HTML snippet must import the DS element from a public CDN and use its custom element');
    } else {
      // composite: a CDN-React page — must consume the DS (e.g. the shared theme) and be runnable
      // (loads React from a CDN, mounts into the DOM), not a hand-styled raw table.
      chk('HTML snippet is a runnable CDN-React page consuming the DS', consumesDS && /esm\.sh|cdn|unpkg|jsdelivr/i.test(htmlText) && /react/i.test(htmlText),
        'a composite HTML snippet must load React from a CDN and consume the DS (e.g. the shared theme)');
    }
    // Guardrail: the jsDelivr /gh/ ref must be SINGLE-SOURCED via the @__REF__ placeholder
    // (generate.mjs injects the live ref). A hardcoded @v1.2.3 in the source freezes the CDN at a
    // stale tag — exactly the bug where components added after that tag 404 at runtime.
    if (/ahaslides-product\/ahaslides-design@/.test(htmlText)) {
      chk('CDN ref is single-sourced (@__REF__, not a hardcoded tag)',
        htmlText.includes('@__REF__') && !/ahaslides-design@v?\d+\.\d+\.\d+/.test(htmlText),
        'pin the /gh/ ref as @__REF__ (generate.mjs injects it) — never a hardcoded @vX.Y.Z');
    }
  }

  // 7) render-gated (qa.mjs measures it; here we require the block exists AND actually measures the look)
  chk('carries a `conformance` block (render-gated by qa.mjs)', !!ct.conformance && !!ct.conformance.measure);

  // 7b) CONFORMANCE COVERAGE — the render gate is only as strong as this block. A block that
  //     measures one property passes qa.mjs trivially, so a hollow contract looked as "done" as a
  //     rigorous one. Require the block to actually pin the look: a tier-floor of assertions, at
  //     least one COLOUR (proves colour binding renders) and one DIMENSION (proves geometry).
  //     Value-classified, not by key name — an author names their own keys.
  const exp = (ct.conformance && ct.conformance.expect) || {};
  const expKeys = Object.keys(exp), expVals = Object.values(exp);
  const floor = isLeaf ? 4 : 6;
  chk(`conformance measures ≥${floor} properties`, expKeys.length >= floor, `only ${expKeys.length} — too thin to prove the render; measure colour + size + a state`);
  chk('conformance measures ≥1 colour', expVals.some(isColour), 'add a colour assertion (bg/border/fg) so qa proves the colour binding, not just geometry');
  chk('conformance measures ≥1 dimension (px)', expVals.some(isPx), 'add a size/radius assertion so qa proves the geometry');

  // 7c) THE VISUAL STANDARD on the published contract — the "same quality" bar, now enforced:
  //     every measured radius is on the 4/6/8/12/16 scale, every measured colour is on-palette,
  //     and every token the contract claims to use actually exists. These caught nothing before.
  for (const [k, v] of Object.entries(exp)) {
    if (/radius/i.test(k) && isPx(v)) chk(`expect.${k} radius on the 4/6/8/12/16 scale`, RADIUS_SCALE.has(parseFloat(v)), `${v} is off the radius scale`);
    if (isColour(v)) chk(`expect.${k} colour is on-palette`, inPalette(v), `${v} is not a canonical token value — bind to the palette`);
  }
  // tokensUsed must be VERIFIABLE against the real theming source — no drift between what a
  // contract claims and what the component is actually themed by. The source differs by tier:
  //   leaf      → each entry is a DS custom property: --aha-<entry> exists in the token source.
  //   composite → each entry is a key of the exported theme artifact: a `token.<key>`, or a
  //               component override written "Comp.key" (e.g. "Table.headerBg").
  if (r && r.entry) {
    if (isLeaf && CSSVARS.size) {
      for (const t of (ct.tokensUsed || [])) chk(`tokensUsed "${t}" is a real --aha-${t}`, CSSVARS.has('--aha-' + t), 'a leaf token is a DS custom property — fix the name or add the token to the source');
    } else if (!isLeaf) {
      try {
        const artifact = (await import(PKG.name + r.entry.replace(/^\./, '')))[(r.exportsNamed || [])[0]] || {};
        const tokenKeys = new Set(Object.keys(artifact.token || {}));
        const compKeys = new Set();
        for (const [cn, obj] of Object.entries(artifact.components || {})) for (const k of Object.keys(obj || {})) compKeys.add(`${cn}.${k}`);
        for (const t of (ct.tokensUsed || [])) chk(`tokensUsed "${t}" is a key of the theme artifact`, t.includes('.') ? compKeys.has(t) : tokenKeys.has(t), 'a composite token must exist in the exported theme (token.<key> or Comp.key)');
      } catch { /* import failure already reported by the reuse check above */ }
    }
  }

  results.push({ slug: ct.slug || ct.name, checks });
}

/* ===== the VISUAL STANDARD on component SOURCE =====
   The contract is the published truth, but the lib module is what actually ships. Enforce the same
   bar on it, classifying by the reuse role a contract declares:
     • ELEMENT (leaf, `reuse.registers`) — colour binds to a --aha-* token (no BARE hex outside a
       var(--aha-…, fallback)), and any literal border-radius is on the scale.
     • THEME (composite artifact, no `registers`) — literals are expected (it maps the DS into a
       vendor theme) but every hex must stay ON-PALETTE, so the theme can't drift off the system.
     • DEFINITION layers (tokens.*, the icon registry) are the value SOURCE — not scanned.
   A genuinely-decorative exception (a sub-scale tick radius, a white checkmark stroke) carries an
   auditable, greppable escape hatch on its own line: `ds-lint-allow: hex,radius (why)`. */
const libFindings = [];
const spacingPxBaselineNext = {};
const spacingPxLowered = [];
for (const ct of contracts) {
  const r = ct.reuse; if (!r || !r.entry) continue;
  const mapped = EXPORTS[r.entry]; if (!mapped || !/\.js$/.test(mapped)) continue;
  const mode = r.registers ? 'element' : 'theme';
  const isIconRuntime = r.registers === 'aha-icon';   // the <aha-icon> element IS the library runtime — it draws the <svg>
  const raw = read(resolve(root, mapped));
  const lines = raw.split('\n');
  // blank out comment bodies but preserve line count so findings map to real line numbers
  const code = raw.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' ')).split('\n').map(l => l.replace(/\/\/.*$/, ''));
  const hits = [];
  const motionFindings = [];   // [kind, msg] tuples — hard fail unless the component grandfathers that kind (MOTION_DEBT)
  const a11yFindings = [];      // [kind, msg] tuples — hard fail unless grandfathered (A11Y_DEBT); kinds: role | leak | observed | toggle
  const responsiveFindings = []; // [kind, msg] tuples — hard fail unless grandfathered (RESPONSIVE_DEBT); kinds: minwidth
  const fontFindings = [];       // [kind, msg] tuples — hard fail unless grandfathered (FONT_DEBT); kind: inherit
  let spacingPxCount = 0;
  code.forEach((line, i) => {
    const allow = (lines[i].match(/ds-lint-allow:\s*([a-z, ]+)/i) || [, ''])[1];
    const allowHex = /hex/.test(allow), allowSpacing = /spacing/.test(allow), allowRadius = /radius/.test(allow), allowMotion = /motion/.test(allow);
    const allowSvg = /svg/.test(allow);
    const allowResponsive = /responsive/.test(allow);
    // a fixed min-width ≥ the 360px floor can't shrink to fit a phone — it forces a horizontal scroll (element + theme)
    if (!allowResponsive)
      for (const m of line.matchAll(/min-width\s*:\s*([0-9]+)px/gi))
        if (parseFloat(m[1]) >= RESPONSIVE_FLOOR)
          responsiveFindings.push(['minwidth', `L${i + 1}: min-width ${m[1]}px is at/above the ${RESPONSIVE_FLOOR}px phone floor — it can't reflow on a phone (horizontal scroll). Use a fluid width (max-width/%/min()) or drop below the floor; justify with ds-lint-allow: responsive (why)`]);
    if (mode === 'element') {
      const bare = line.replace(/var\(\s*--aha-[a-z0-9-]+\s*(,[^)]*)?\)/gi, 'TOK');   // fallbacks are fine; the token is the real value
      if (!allowHex) for (const h of bare.match(/#[0-9A-Fa-f]{3,8}\b/g) || []) hits.push(`L${i + 1}: bare hex ${h} — bind to a token: var(--aha-…, ${h})`);
      if (!allowSpacing)
        for (const m of bare.matchAll(/(?<![a-z-])(?:padding|margin|gap|row-gap|column-gap)(?:-(?:top|right|bottom|left|inline|block)(?:-(?:start|end))?)?\s*:\s*([^;}`"']+)/gi))
          if ((m[1].match(/-?\d*\.?\d+px/g) || []).some(px => Math.abs(parseFloat(px)) > 1)) spacingPxCount++;
      if (!allowRadius) for (const m of line.matchAll(/border-radius\s*:\s*([0-9.]+)px/gi)) if (!RADIUS_SCALE.has(parseFloat(m[1]))) hits.push(`L${i + 1}: border-radius ${m[1]}px off the 4/6/8/12/16 scale`);
      // a transition's timing must come from a motion token — a bare literal (.12s/150ms) is the drift (.1/.12/.15) we're killing
      if (!allowMotion && /transition/i.test(line))
        for (const m of bare.match(/(?:\d*\.\d+|\d+)\s*m?s\b/g) || []) motionFindings.push(['literal', `L${i + 1}: bare transition timing ${m.trim()} — bind to a motion token (var(--aha-motion-mid) var(--aha-ease-in-out))`]);
      // no bounce/elastic easing — a cubic-bezier whose control-point Y leaves [0,1] overshoots (back/elastic),
      // which reads dated/tacky and isn't how AntD (or a real object) decelerates. Use an exponential ease-out.
      if (!allowMotion) for (const m of line.matchAll(/cubic-bezier\(\s*-?[0-9.]+\s*,\s*(-?[0-9.]+)\s*,\s*-?[0-9.]+\s*,\s*(-?[0-9.]+)\s*\)/gi)) {
        const y1 = parseFloat(m[1]), y2 = parseFloat(m[2]);
        if (y1 < 0 || y1 > 1 || y2 < 0 || y2 > 1) motionFindings.push(['bounce', `L${i + 1}: bounce/elastic easing ${m[0]} — the curve overshoots (control-point Y outside 0–1). Use an exponential ease-out (var(--aha-ease-out) / --aha-ease-in-out), not a "back" ease`]);
      }
      // an inline <svg> glyph bypasses the icon library — a component must summon glyphs by name via
      // <aha-icon name="…">. Genuine sub-glyph chrome (a spinner, a checkmark tick) is an auditable
      // exception on that line: ds-lint-allow: svg (why). The icon runtime itself is exempt — it IS the drawer.
      if (!allowSvg && !isIconRuntime && /<svg\b/i.test(line)) hits.push(`L${i + 1}: inline <svg> — use an <aha-icon name="…"> from the DS library, or justify chrome with ds-lint-allow: svg (why)`);
    } else {
      for (const h of line.match(/#[0-9A-Fa-f]{3,8}\b/g) || []) if (!inPalette(h)) hits.push(`L${i + 1}: off-palette ${h} — a theme must map to a canonical token value`);
    }
  });
  if (mode === 'element') {
    const file = mapped.replace(/^\.\//, '');
    const allowed = BASELINE_SPACING_PX[file] || 0;
    if (UPDATE_BASELINE) spacingPxBaselineNext[file] = spacingPxCount;
    if (spacingPxCount > allowed) hits.push(`${spacingPxCount - allowed} new raw spacing px declaration(s) (padding/margin/gap > 1px; ${spacingPxCount} found, ${allowed} baselined) — bind to var(--aha-space-N, Npx), or justify a line with ds-lint-allow: spacing (why)`);
    else if (spacingPxCount < allowed) spacingPxLowered.push(`${file}: ${spacingPxCount} < baseline ${allowed} — run node standards.mjs --update-baseline to ratchet it down`);
  }
  // per-file motion smells (element only)
  if (mode === 'element') {
    const body = code.join('\n');
    /* ===== FONT INHERITANCE (element only) — a leaf must let its shadow text inherit the host app's
       typography. Pin the product font ONCE on :host; every text-bearing content element inherits it
       (font-family:inherit). A font-family that names --aha-font-product (or a bare literal font stack)
       on a selector whose subject is NOT :host re-isolates the text behind the shadow boundary, so a
       themed host can't override it and the text drifts off the app's font (the aha-alert case, PR #98).
       Allowed: font-family on :host; inherit on content; the mono/display/secondary tokens (a distinct
       surface). Per-line escape: ds-lint-allow: font (why). Spec: plans/font-inheritance-normalization.md.
       Rule blocks are flat CSS (a @media wrapper's braces make the flat matcher fall through to the inner
       rule, which is what we want to check); the subject test allows only a bare :host / :host([…]). */
    const hostSubject = (sel) => sel.split(',').every(s => /^:host(\([^)]*\))?$/.test(s.trim()));
    for (let m, RULE_RE = /([^{}]+)\{([^{}]*)\}/g; (m = RULE_RE.exec(body));) {
      // The style is CSS inside a JS template literal; the first rule's selector is preceded by JS
      // (`const STYLE = \``) with no brace boundary — keep only the tail after the last ; or backtick,
      // neither of which can appear in a CSS selector, so the JS prefix drops away.
      const sel = m[1].split(/[;`]/).pop().trim();
      if (!sel || hostSubject(sel)) continue;
      const declStart = m.index + m[0].indexOf('{') + 1;
      for (const fm of m[2].matchAll(/font-family\s*:\s*([^;}]+)/gi)) {
        const v = fm[1].trim();
        if (/^inherit$/i.test(v)) continue;
        const stripped = v.replace(/var\([^()]*\)/g, ' ');   // drop var(--token, fallback…) — the token is the value
        const refsProduct = /--aha-font-product\b/.test(v);
        const bareLiteral = /["']/.test(stripped) || /\b(plus jakarta sans|inter|nunito|roboto|menlo|monaco|segoe ui|-apple-system|sans-serif|serif|monospace)\b/i.test(stripped);
        if (!refsProduct && !bareLiteral) continue;          // only mono/display/secondary or a plain keyword → allowed
        const ln = body.slice(0, declStart + fm.index).split('\n').length;
        if (/ds-lint-allow:\s*[a-z, ]*font/i.test(lines[ln - 1] || '')) continue;
        fontFindings.push(['inherit', `L${ln}: font-family on "${sel.replace(/\s+/g, ' ').slice(0, 48)}" pins the product font on shadow content — a themed host can't override it, so the text drifts off the app's typography. Pin the font on :host and set font-family:inherit here (plans/font-inheritance-normalization.md §4). Justify a deviation with ds-lint-allow: font (why).`]);
      }
    }
    const interactive = /:hover|:focus|:focus-visible|:focus-within|:active|:checked|cursor\s*:\s*pointer|\[(?:checked|open|disabled)\]/i.test(body);
    const animates = /transition|@keyframes|animation\s*:/i.test(body);
    const fileAllows = /ds-lint-allow:\s*[a-z, ]*motion/i.test(raw);
    // (a) an interactive element whose states SNAP — no transition declared at all
    if (interactive && !animates && !fileAllows)
      motionFindings.push(['snap', `interactive element declares no transition — hover/focus/checked/open states must animate (var(--aha-motion-mid) var(--aha-ease-in-out)), never snap`]);
    // (b) a DEAD transition — the element declares one but rebuilds its whole subtree on a state change, so the
    //     browser has no "from" state and it never fires (the Switch-click bug — survives even after the CSS is
    //     correct). The transition must live on a PERSISTENT node: toggle the attribute/class, mutate in place.
    //     STATE = any animatable-state attr; RE-RENDER = any wholesale subtree rebuild (innerHTML/replaceChildren/
    //     render()), whether triggered from attributeChangedCallback OR a property setter. Broad on purpose — a new
    //     component shouldn't be able to dodge the check by renaming the attr or swapping the rebuild mechanism.
    // Precise toggle-states — the ones that pair with a :host([x]) rule to animate a property. (NOT value/loading/etc.:
    // those trigger a re-render too, but the transition there is usually on :hover/:focus — a different concern, not a
    // dead transition. Flagging them would false-positive on legit fields like Input.)
    const STATE_RE = /\b(checked|open|active|selected|expanded|pressed|indeterminate|toggled|collapsed)\b/i;
    const stateAttrs = (body.match(/observedAttributes[\s\S]{0,200}?\[([^\]]*)\]/) || [, ''])[1];
    const setterRenders = /set\s+\w+\s*\([^)]*\)\s*\{[^}]*(?:_render|this\.render|innerHTML\s*=|replaceChildren)/.test(body);
    const togglesState = STATE_RE.test(stateAttrs) || setterRenders;
    const rebuilds = /(innerHTML\s*=|replaceChildren\s*\(|\.render\s*\()/.test(body) &&
                     (/attributeChangedCallback/.test(body) || setterRenders);
    if (animates && togglesState && rebuilds && !fileAllows) {
      const which = (stateAttrs.replace(/['"\s]/g, '').split(',').filter(a => STATE_RE.test(a)).join('/')) || 'a state setter';
      motionFindings.push(['dead', `transition may be DEAD — a state change (${which}) triggers a full subtree rebuild (innerHTML/replaceChildren/render), so the declared transition can't fire across it. Toggle the attribute/class on a persistent node instead of rebuilding the subtree (the Switch-click case)`]);
    }
    // (c) the EXAMPLE must show the SAME motion as the shipped component. The preview is a hand-kept copy
    //     (a self-contained reimplementation — and qa.mjs measures IT, not lib), so it drifts: it has dropped
    //     a transition before. Flag any transition lib ships that the preview is missing → the example lies.
    const txns = (s) => new Set([...s.matchAll(/transition\s*:\s*([^;}`]+)/gi)]
      .map(m => m[1].replace(/\s+/g, ' ').trim().toLowerCase())
      .filter(t => t && !/^none\b/.test(t)));
    const pv = read(join(PDIR, (ct.slug || '') + '.preview.html'));
    // A preview that IMPORTS the shipped element module (../lib/<entry>.js) runs the REAL element,
    // not a hand-copied reimplementation — so it CANNOT drift, and the sync check doesn't apply. This
    // is stronger than a kept-in-sync copy, and it's how the smart-widget previews stay truthful.
    const entryMod = (r.entry || r.registers || '').replace(/^\.\//, '').replace(/\.js$/, '');
    const importsReal = !!entryMod && new RegExp('import[^;\\n]*[\'"][^\'"]*(?:' +
      entryMod.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '|' +
      (r.registers || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')(?:\\.js)?[\'"]').test(pv);
    if (pv && !fileAllows && !importsReal) {
      const missing = [...txns(raw)].filter(t => !txns(pv).has(t));
      if (missing.length)
        motionFindings.push(['sync', `example out of sync — parts/${ct.slug}.preview.html neither imports the shipped <${r.registers}> nor inlines its motion: it is missing ${missing.length} transition(s) the component ships (e.g. "${missing[0].slice(0, 48)}…"), so the rendered example shows different motion than the element — and qa measures the preview, not lib. Either import ../lib/${entryMod}.js (best — it can't drift) or keep the inlined copy in sync.`]);
    }

    /* ===== the ACCESSIBILITY STANDARD (element only) — an interactive component must be OPERABLE.
       qa.mjs proves it renders + animates; these prove it can be driven by keyboard/AT. Source-level,
       deterministic, no browser. A genuinely-justified exception carries `ds-lint-allow: a11y (why)`. */
    const a11yAllows = /ds-lint-allow:\s*[a-z, ]*a11y/i.test(raw);
    if (!a11yAllows) {
      // (role) a roving-widget role (radio/tab/menuitem/option/…) obliges arrow-key navigation — the
      //   arrow keys ARE the interaction model (single tab-stop, roving focus). A click handler alone
      //   leaves the announced role a lie: AT users can't move within the widget. Require evidence of
      //   arrow-key handling (an ArrowUp/Down/Left/Right reference); Escape/Enter alone doesn't count.
      const rm = body.match(ROVING_ROLES);
      if (rm && !/\bArrow(Up|Down|Left|Right)\b/.test(body))
        a11yFindings.push(['role', `declares role="${rm[1]}" (a roving widget: arrow keys drive it) but has no arrow-key navigation — a click handler isn't enough. Implement roving-tabindex + ArrowUp/Down/Left/Right handling, or drop to a role whose contract you meet (the rate/tabs/menu/segmented case).`]);
      // (leak) a listener bound to document/window in connect but never removed leaks on every
      //   mount/unmount (and its closure pins the element). Each added global event needs a matching
      //   removeEventListener for the same event. (Listeners on `this`/shadow nodes are GC'd with the
      //   element — only document/window are scanned.)
      const added = [...body.matchAll(/\b(?:document|window)\.addEventListener\(\s*['"]([a-z]+)['"]/gi)].map(m => m[1].toLowerCase());
      const removed = new Set([...body.matchAll(/\b(?:document|window)\.removeEventListener\(\s*['"]([a-z]+)['"]/gi)].map(m => m[1].toLowerCase()));
      for (const ev of new Set(added)) if (!removed.has(ev))
        a11yFindings.push(['leak', `document/window addEventListener('${ev}') has no matching removeEventListener('${ev}') in disconnectedCallback — it leaks on every mount/unmount (and an anonymous handler can't be removed at all). Store the handler and remove it on disconnect (the popover keydown-leak case).`]);
      // (observed) the component sets an aria-* STATE attribute imperatively (evidence of dynamic
      //   state) but declares no observedAttributes — so when the matching host attribute changes from
      //   outside (a framework binding the attr, a consumer setAttribute), the visual state flips via
      //   :host([x]) CSS while the aria value stays frozen at its mount value. The declared state and
      //   the announced state desync. Observe the state attribute(s) and re-sync aria in the callback.
      const setsAriaState = /setAttribute\(\s*['"]aria-(expanded|checked|selected|pressed|current|valuenow)['"]/i.test(body);
      if (setsAriaState && !/observedAttributes/.test(body))
        a11yFindings.push(['observed', `sets an aria-* state attribute imperatively but declares no observedAttributes — an external/framework-driven attribute change flips the :host([state]) visuals while aria-* stays frozen (screen reader reads the wrong state). Add observedAttributes + an attributeChangedCallback that re-syncs the aria (the collapse controlled-open case).`]);
      // (toggle) a <button> that toggles a SELECTION class on state (selected/active/pressed/on) but
      //   exposes no aria-pressed/aria-checked/aria-selected is a silent toggle: the visual .selected
      //   flips while a screen reader hears an ordinary button with no state. (A button carrying a
      //   roving/selectable role — radio/tab/menuitem/option — syncs its own aria and is exempt.)
      //   Sync aria-pressed to the state (the csat / color-picker swatch case).
      const togglesSelection = /classList\.toggle\(\s*['"](selected|active|pressed|checked|on)['"]/.test(body);
      const rendersButton = /<button\b/.test(body) || /part\s*=\s*["']button["']/.test(body);
      const hasAriaState = /aria-(pressed|checked|selected)\b/.test(body);
      const hasSelectableRole = /role\s*=\s*["'](radio|tab|menuitem|menuitemradio|menuitemcheckbox|option|switch|checkbox)["']/i.test(body);
      if (togglesSelection && rendersButton && !hasAriaState && !hasSelectableRole)
        a11yFindings.push(['toggle', `a <button> toggles a selection class on state but exposes no aria-pressed/aria-checked — a screen reader hears a plain button, not a selected one. Sync aria-pressed (or aria-checked) to the state in the same place you toggle the class (the csat / color-picker swatch case).`]);
    }
  }
  // HARD FAIL by default — a NEW component can't ship any motion defect. Only the exact (component, kind) pairs
  // in MOTION_DEBT get a WARN pass (known pre-gate debt, tracked on PRO38-5); everything else fails the file.
  const debt = MOTION_DEBT[r.registers] || [];
  const motionHits = [];
  for (const [kind, msg] of motionFindings) (debt.includes(kind) ? motionHits : hits).push(debt.includes(kind) ? `${msg}  [grandfathered: ${r.registers}/${kind} — PRO38-5]` : msg);
  // Same hard-fail-with-grandfather handling for the accessibility findings (A11Y_DEBT).
  const a11yDebt = A11Y_DEBT[r.registers] || [];
  for (const [kind, msg] of a11yFindings) (a11yDebt.includes(kind) ? motionHits : hits).push(a11yDebt.includes(kind) ? `${msg}  [grandfathered a11y: ${r.registers}/${kind}]` : msg);
  // Same hard-fail-with-grandfather handling for the responsive findings (RESPONSIVE_DEBT).
  const respDebt = RESPONSIVE_DEBT[r.registers] || [];
  for (const [kind, msg] of responsiveFindings) (respDebt.includes(kind) ? motionHits : hits).push(respDebt.includes(kind) ? `${msg}  [grandfathered responsive: ${r.registers}/${kind}]` : msg);
  // Same hard-fail-with-grandfather handling for the font-inheritance findings (FONT_DEBT).
  const fontDebt = FONT_DEBT[r.registers] || [];
  for (const [kind, msg] of fontFindings) (fontDebt.includes(kind) ? motionHits : hits).push(fontDebt.includes(kind) ? `${msg}  [grandfathered font: ${r.registers}/${kind}]` : msg);
  libFindings.push({ file: mapped.replace(/^\.\//, ''), mode, hits, motionHits });
}

/* ===== guidelines — prose composition guides. A guideline ships no primitive; it reuses components
   and documents conventions. It's gated on: completeness, a real skillRef, a composedOf reuse graph
   that resolves into the component set, rules that trace back to the skill, and (if it ships a
   wrapper) the same import/export checks a composite gets. ===== */
const contractSlugs = new Set(contracts.map(c => c.slug));
// custom-element tag → slug, for the elements the DS actually ships (leaves that register)
const TAG_TO_SLUG = new Map(contracts.filter(c => c.reuse?.registers).map(c => [c.reuse.registers, c.slug]));
/* anti-slop — the DS-owned criteria store. Feeds + gate read it; a guideline rule that names a
   judge criterion (C\d+, or a judge's own letter like J\d+) for a wired surface must resolve here. */
const ANTISLOP_PATH = join(root, 'anti-slop', 'criteria.json');
const ANTISLOP = existsSync(ANTISLOP_PATH) ? JSON.parse(read(ANTISLOP_PATH)) : null;
const JUDGE_CRITERION_ID = /^[A-Z]\d+$/;
const LIVE_TARGET_SOURCE = /^(tokens\.canonical\.json|contracts|icons\/registry\.json|contracts\/[a-z0-9-]+\.json|guidelines\/[a-z0-9-]+\.json)$/;
const guidelines = existsSync(GDIR)
  ? readdirSync(GDIR).filter(f => f.endsWith('.json')).map(f => JSON.parse(read(join(GDIR, f))))
  : [];
const guidelineResults = [];
for (const p of guidelines) {
  const checks = [], warns = [];
  const chk = (name, cond, note = '') => checks.push([name, !!cond, cond ? '' : note]);
  const warn = (name, note = '') => warns.push([name, note]);

  // 1) completeness + kind + the skill it distils
  const missing = GUIDELINE_REQUIRED.filter(k => p[k] == null || (Array.isArray(p[k]) && !p[k].length));
  chk('guideline complete (all required fields)', missing.length === 0, `missing: ${missing.join(', ')}`);
  chk('docs page highlights (1–4 short bullets)', Array.isArray(p.highlights) && p.highlights.length >= 1 && p.highlights.length <= 4 && p.highlights.every(h => typeof h === 'string' && h.trim()), 'add highlights: 1–4 short bullet strings (rendered under the page title)');
  chk('kind is "guideline"', p.kind === 'guideline');
  chk('links a build skill (skillRef.build)', p.skillRef && typeof p.skillRef.build === 'string', 'add skillRef.build — the design skill it distils');

  // 2) composedOf — the reuse graph must resolve into the component set (the teeth)
  chk('declares composedOf (what it reuses)', Array.isArray(p.composedOf) && p.composedOf.length >= 1);
  for (const dep of (p.composedOf || [])) {
    if (!dep || !dep.ref) { chk('composedOf entry has a ref', false, 'each entry needs { ref, as, use, status }'); continue; }
    if (dep.as === 'component') {
      if (dep.status === 'available') {
        chk(`composedOf: "${dep.ref}" exists as a component`, contractSlugs.has(dep.ref), 'marked available but no such contract — fix the slug or mark it missing');
      } else if (PATTERN_BACKLOG_HARD_FAIL) {
        chk(`composedOf backlog: "${dep.ref}" exists`, contractSlugs.has(dep.ref), 'referenced component not in the DS — add it here first');
      } else {
        warn(`composedOf backlog: "${dep.ref}" not in the DS yet`, 'a compliant surface needs it — add it here so the pattern is buildable by reuse');
      }
    } else if (dep.as === 'token') {
      chk(`composedOf: "${dep.ref}" binds an --aha-* token`, /^--aha-/.test(dep.ref), 'token refs bind to --aha-* vars');
    } else {
      chk(`composedOf: "${dep.ref}" declares its kind`, false, 'as must be "component" or "token"');
    }
  }

  // 3) rules — the checklist, each traceable to a skill assertion
  chk('has ≥1 rule', Array.isArray(p.rules) && p.rules.length >= 1);
  chk('every rule traces to a skill assertion (ref)',
    (p.rules || []).every(x => x && x.rule && Array.isArray(x.ref) && x.ref.length >= 1),
    'each rule needs ref: ["SETTINGS-xx", …] back to the skill');

  // 3b) anti-slop consistency — for a surface wired into the store, every C\d+ rule ref must
  //     resolve to a real criterion id; non-C\d+ refs (UXW-n, §n) are build-assertion ids and are
  //     warn-only. Coverage (every store criterion referenced) is enforced ONLY for DS-AUTHORED
  //     surfaces — a seeded surface's guideline still uses build-assertion ids (re-keyed in Phase 2).
  const _surface = ANTISLOP?.surfaces?.[p.slug];
  if (_surface) {
    const _storeCrit = new Set((_surface.criteria || []).map(c => c.id));
    for (const ref of new Set((p.rules || []).flatMap(r => r.ref || []))) {
      if (JUDGE_CRITERION_ID.test(ref)) {
        chk(`anti-slop: rule ref ${ref} resolves in store surface "${p.slug}"`, _storeCrit.has(ref),
          `no such criterion in anti-slop/criteria.json surfaces.${p.slug} — fix the ref or add the criterion`);
      } else {
        warn(`anti-slop: rule ref "${ref}" is a build-assertion id (not a C\\d+ judge criterion)`,
          'seeded surfaces reference build assertions; Phase-2 fan-out re-keys these to judge criteria');
      }
    }
    if (_surface.origin === 'authored') {
      const _referenced = new Set((p.rules || []).flatMap(r => (r.ref || []).filter(x => JUDGE_CRITERION_ID.test(x))));
      for (const id of _storeCrit)
        chk(`anti-slop: store criterion ${id} is covered by a rule in "${p.slug}"`, _referenced.has(id),
          `surfaces.${p.slug} defines ${id} but no authored rule references it`);
    }
  }

  // 4) the guide narrative doesn't smuggle in a banned library
  const guideText = p.guide ? read(join(PDIR, p.guide)) : '';
  for (const [re, why] of BANNED) chk(`guide free of: ${why}`, !re.test(guideText), 'found in the guide');

  // 4b) the guide and the reuse graph agree — every shipped DS element the guide points authors
  //     at (a `<aha-*>` that resolves to a real contract) must be declared in composedOf, so the
  //     machine-readable reuse graph can't drift from the human-readable mapping. Elements the DS
  //     doesn't ship as a contract (e.g. a sub-part like <aha-settings-item>) are ignored.
  const composedRefs = new Set((p.composedOf || []).map(d => d.ref));
  const guideSlugs = new Set([...guideText.matchAll(/<(aha-[a-z0-9-]+)[\s/>]/g)]
    .map(m => TAG_TO_SLUG.get(m[1])).filter(Boolean));
  for (const slug of guideSlugs)
    chk(`guide cites <${[...TAG_TO_SLUG].find(([, s]) => s === slug)[0]}> — composedOf declares "${slug}"`,
      composedRefs.has(slug), 'the guide points authors at this DS element but the reuse graph omits it — add it to composedOf');

  // 5) optional composition code — gated like a composite when present
  if (p.reuse && p.reuse.entry) {
    const mapped = EXPORTS[p.reuse.entry];
    chk(`reuse.entry "${p.reuse.entry}" is in package.json exports`, !!mapped, 'add it to "exports"');
    chk('entry file exists on disk', mapped && existsSync(resolve(root, mapped)), mapped ? `${mapped} missing` : '');
    const spec = PKG.name + p.reuse.entry.replace(/^\./, '');
    try {
      const mod = await import(spec);
      chk(`import "${spec}" resolves`, !!mod);
      for (const nm of (p.reuse.exportsNamed || [])) chk(`exports \`${nm}\``, nm in mod, 'named export missing');
    } catch (e) { chk(`import "${spec}" resolves`, false, e.message.split('\n')[0]); }
  }

  guidelineResults.push({ slug: p.slug || p.name, checks, warns });
}

/* ===== anti-slop store + feeds — the DS is the official anti-slop tool ===== */
const antislopChecks = [];
const achk = (name, cond, note = '') => antislopChecks.push([name, !!cond, cond ? '' : note]);
const antislopWarnings = [];
if (ANTISLOP) {
  achk('anti-slop store declares the DS as owner', ANTISLOP.owner === 'ahaslides-design', 'owner must be "ahaslides-design"');
  achk('anti-slop store has ≥1 surface', ANTISLOP.surfaces && Object.keys(ANTISLOP.surfaces).length >= 1);
  for (const [key, s] of Object.entries(ANTISLOP.surfaces || {})) {
    achk(`surface "${key}": origin is seeded|authored`, s.origin === 'seeded' || s.origin === 'authored', `origin="${s.origin}"`);
    achk(`surface "${key}": ≥1 well-formed criterion`,
      Array.isArray(s.criteria) && s.criteria.length >= 1 && s.criteria.every(c => JUDGE_CRITERION_ID.test(c.id) && c.title && c.test),
      'each criterion needs { id:C\\d+ (or the judge\'s own letter, e.g. J\\d+), title, test }');
    const criterionIds = (s.criteria || []).map(c => c.id);
    achk(`surface "${key}": criterion ids are unique`, new Set(criterionIds).size === criterionIds.length,
      'two criteria share an id — rule refs and judge verdicts would be ambiguous');
    if (s.origin === 'seeded')
      achk(`surface "${key}": records its seed provenance`, !!(s.seededFrom?.version && s.skillRef?.judge),
        'a seeded surface needs seededFrom.version + skillRef.judge — re-run sync-skills.mjs import');
    const targets = s.targets || [];
    const targetSources = targets.map(t => t?.source);
    achk(`surface "${key}": each target is listed once`, new Set(targetSources).size === targetSources.length,
      'a target source appears twice — merge the two uses into one target');
    achk(`surface "${key}": has a matching guideline (guidelines/${key}.json) or live DS targets`,
      guidelines.some(p => p.slug === key) || targets.length >= 1,
      'a wired surface needs a guideline to supply its rules, or targets naming the live DS sources it is judged against');
    for (const t of targets)
      achk(`surface "${key}": target "${t?.source}" is a live DS source`,
        LIVE_TARGET_SOURCE.test(t?.source) && existsSync(join(root, t.source)) && !!t.use,
        'targets name a DS contract / tokens.canonical.json / icons/registry.json / guideline that exists, with a use');
    for (const c of (s.criteria || []))
      achk(`surface "${key}": ${c.id} judges against the live DS, not a frozen snapshot`, !FROZEN_SNAPSHOT.test(`${c.title} ${c.test}`),
        'the test cites a plugin snapshot (contract.json / typography.json / review.html / references/) — point it at the DS contract or tokens');
  }
  const evalGate = validateEvalSets(ANTISLOP);
  for (const [name, ok, note] of evalGate.checks) achk(name, ok, note);
  antislopWarnings.push(...evalGate.warnings);
  const harnessFailures = evalHarnessSelfTest();
  achk('evals: verdict parser + grader self-test', harnessFailures.length === 0, harnessFailures.join('; '));
  achk('anti-slop.md feed exists', existsSync(join(DIST, 'anti-slop.md')), 'run npm run generate');
  achk('anti-slop.agent.json feed exists', existsSync(join(DIST, 'anti-slop.agent.json')), 'run npm run generate');
  achk('anti-slop.md is generated (not hand-edited)', existsSync(join(DIST, 'anti-slop.md')) && /do not edit by hand/.test(read(join(DIST, 'anti-slop.md'))), 'feed missing the generated banner');
}

/* ===== repo gate — CHANGELOG + version ===========================================================
   House rule: every merge ships a CHANGELOG entry AND bumps the package version. The changelog is
   the consumer-facing record of what each published version changed; the version is what `npm
   publish` ships on the v* tag. A rule that isn't gated is a suggestion — so this makes it real:
   a PR that forgets either goes red here, like any other standard.
   Format (CHANGELOG.md, newest first):
     ## X.Y.Z — YYYY-MM-DD      (em-dash or hyphen; the TOP entry must equal package.json "version")
     ### Added | Changed | Fixed | Removed
     - one bullet per change, linking the real PR: (#58)   ← never a leftover "(#PR)" placeholder
   ================================================================================================= */
const repoChecks = [];
{
  const rchk = (name, cond, note = '') => repoChecks.push([name, !!cond, cond ? '' : note]);
  const changelog = read(join(root, 'CHANGELOG.md'));
  rchk('CHANGELOG.md exists', !!changelog, 'add a CHANGELOG.md at the repo root (newest entry on top)');
  if (changelog) {
    const m = changelog.match(/^##\s+(\d+\.\d+\.\d+)\s+[—-]\s+(\d{4}-\d{2}-\d{2})\s*$/m);
    rchk('top entry heads the file as "## X.Y.Z — YYYY-MM-DD"', !!m,
      'the newest change must head the file as "## <semver> — <YYYY-MM-DD>"');
    if (m) {
      rchk(`top version ${m[1]} matches package.json ${PKG.version}`, m[1] === PKG.version,
        `they must match — bump package.json "version" to ${m[1]} (or fix the heading)`);
      // The version must not go BACKWARDS — the "branched off a stale base" trap that shipped a PR cut
      // from a branch ~18 versions behind master: it reused an already-published version (v0.37.0 was
      // already a tag) that would REVERT everything merged since. Guard it against the published git
      // tags: the version must be ≥ the latest release (== is master just after its own publish; < is a
      // stale base). Doesn't pin > (that would false-fail master post-release). No tags fetched (a
      // shallow CI checkout) → skip rather than false-fail; use fetch-depth:0/fetch-tags to keep it live.
      try {
        const tags = execFileSync('git', ['tag', '-l', 'v*'], { cwd: root, encoding: 'utf8' })
          .split('\n').map(t => t.trim()).filter(t => /^v\d+\.\d+\.\d+$/.test(t)).map(t => t.slice(1));
        const cmp = (a, b) => { const A = a.split('.').map(Number), B = b.split('.').map(Number); return A[0] - B[0] || A[1] - B[1] || A[2] - B[2]; };
        if (tags.length) {
          const latest = tags.slice().sort(cmp).pop();
          rchk(`version ${PKG.version} is not behind the latest release v${latest}`, cmp(PKG.version, latest) >= 0,
            `${PKG.version} < ${latest}: you branched off a STALE base and would revert merged work — rebase onto master and bump above ${latest} (git fetch origin master --tags first)`);
        }
      } catch { /* no git / no tags (fresh or shallow CI) — skip rather than false-fail */ }
      // the block from this heading up to the next "## " must carry at least one "- " bullet
      const block = changelog.slice(changelog.indexOf(m[0]) + m[0].length).split(/\n##\s/)[0];
      rchk('top entry lists ≥1 change bullet', /^\s*-\s+\S/m.test(block),
        'describe what changed as "- …" bullets under the version heading');
      // a bullet's trailing PR ref must be a real number "(#123)" — never a leftover template
      // placeholder like "(#PR)". Only the ref position (end of a line) is inspected, so prose
      // that *mentions* "(#PR)" mid-sentence (e.g. this bullet) doesn't false-trigger.
      const badRef = (block.match(/\(#[^)\n]*\)\s*$/gm) || [])
        .map(s => s.trim()).find(s => !/^\(#\d+\)$/.test(s));
      rchk('top entry PR refs are real numbers (no "(#PR)" placeholder)', !badRef,
        badRef ? `${badRef} is an unfilled PR-ref placeholder — replace it with the real number, e.g. (#58)` : '');
    }
  }
}

/* ===== TOKEN ACKNOWLEDGEMENT — every leaf token path in tokens.canonical.json must be listed in
   tokens.acknowledged.json. A NEW token (e.g. an agent-proposed effect.blur.md) fails the gate until its
   path is added there, so the token owner's sign-off is a visible one-line diff in the PR instead of
   passing silently. Removing a token needs no acknowledgement. */
{
  const rchk = (name, cond, note = '') => repoChecks.push([name, !!cond, cond ? '' : note]);
  const leafPaths = (node, prefix = '') => Array.isArray(node)
    ? node.map(v => `${prefix}.${v}`)
    : (node && typeof node === 'object')
      ? Object.entries(node).filter(([k]) => !k.startsWith('$')).flatMap(([k, v]) => leafPaths(v, prefix ? `${prefix}.${k}` : k))
      : [prefix];
  const ackPath = join(root, 'tokens.acknowledged.json');
  const current = leafPaths(TOKENS).sort();
  if (ACKNOWLEDGE_TOKENS) writeFileSync(ackPath, JSON.stringify({ $about: 'Token paths the design-system owner has signed off. A new path in tokens.canonical.json fails standards.mjs until it is added here in the same PR.', tokens: current }, null, 1) + '\n');
  const acknowledged = new Set(existsSync(ackPath) ? JSON.parse(readFileSync(ackPath, 'utf8')).tokens : []);
  const unacknowledged = current.filter(t => !acknowledged.has(t));
  rchk('every token in tokens.canonical.json is acknowledged', unacknowledged.length === 0,
    `new token(s) need owner sign-off — add to tokens.acknowledged.json (node standards.mjs --acknowledge-tokens): ${unacknowledged.slice(0, 8).join(', ')}${unacknowledged.length > 8 ? ` (+${unacknowledged.length - 8} more)` : ''}`);
}
/* ===== COLOUR ALLOW-LIST — tokens, the Colour page with the docs chrome around its swatches, the art the
   DS owns (illustrations, third-party logos, file-type icons) and every demo, contract and element source.
   The AhaSlides logo itself is the one drawing that keeps its own colours. */
{
  const rchk = (name, cond, note = '') => repoChecks.push([name, !!cond, cond ? '' : note]);
  const VIVID_PINK = '#E70E68', LOGO_PURPLE = '#6A1EBB';
  const ALLOWED_COLOURS = new Set([VIVID_PINK, '#DB005B', '#FEF3F7', '#F8B7D2']);
  const isNeutral = (hex) => hex.slice(1, 3) === hex.slice(3, 5) && hex.slice(3, 5) === hex.slice(5, 7);
  const coloursIn = (text) => [
    ...[...String(text).matchAll(/(?<![&\w])#([0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3})(?![\w-])/g)].map(m => normHex(m[0]).slice(0, 7)),
    ...[...String(text).matchAll(/rgba?\(\s*\d+[\s,]+\d+[\s,]+\d+/g)].map(m => rgbToHex(m[0].replace(/\s+/g, ',').replace(/,+/g, ', '))),
  ];
  const offList = (text, purpleAllowed) => [...new Set(coloursIn(text).filter(hex => !(isNeutral(hex) || ALLOWED_COLOURS.has(hex) || (purpleAllowed && hex === LOGO_PURPLE))))];
  const tokenLeaves = (node, path = '') => (node && typeof node === 'object')
    ? Object.entries(node).filter(([key]) => !key.startsWith('$')).flatMap(([key, value]) => tokenLeaves(value, path ? `${path}.${key}` : key))
    : [[path, node]];
  const offListTokens = tokenLeaves(TOKENS).flatMap(([path, value]) => offList(value, path === 'color.primitives.logoPurple').map(hex => `${path} ${hex}`));
  rchk('every colour token is on the allowed colour list', offListTokens.length === 0,
    `allowed: Vivid Pink ${VIVID_PINK}, Darker Pink #DB005B, #FEF3F7, #F8B7D2, white, black, neutral greys, and ${LOGO_PURPLE} at color.primitives.logoPurple only — off the list: ${offListTokens.slice(0, 8).join(', ')}${offListTokens.length > 8 ? ` (+${offListTokens.length - 8} more)` : ''}`);
  const colourPagePath = join(DIST, 'foundations', 'colour.html');
  const offListOnPage = existsSync(colourPagePath) ? offList(read(colourPagePath).replace(/<svg class="logo"[\s\S]*?<\/svg>/g, '').replace(/href="#[^"]*"/g, ''), true) : null;
  rchk('the built Colour page shows only allowed colours', offListOnPage && offListOnPage.length === 0,
    offListOnPage ? `off the list on dist/foundations/colour.html: ${offListOnPage.slice(0, 12).join(', ')}` : 'dist/foundations/colour.html is missing — run node generate.mjs first');

  const artToRecolour = ART_SOURCES.flatMap(({ files, map }) => files().filter(path => recolourSvg(read(path), map) !== read(path)).map(path => relative(root, path)));
  rchk('illustrations, third-party logos and file-type icons are drawn in the allowed colours', artToRecolour.length === 0,
    `run node recolour-art.mjs, then node build-icons.mjs && node build-illustrations.mjs — off the list: ${artToRecolour.slice(0, 8).join(', ')}${artToRecolour.length > 8 ? ` (+${artToRecolour.length - 8} more)` : ''}`);
  const offListInRegistry = ['icons', 'illustrations'].flatMap(kind => {
    const entries = JSON.parse(read(join(root, kind, 'registry.json')) || '{}')[kind] || {};
    return Object.entries(entries).filter(([, entry]) => offList(coloursInSvg(entry.body || '').join(' '), false).length).map(([name]) => `${kind}/${name}`);
  });
  rchk('the icon and illustration registries carry only allowed colours', offListInRegistry.length === 0,
    `a registry is stale or an import brought colour in — recolour the source SVG and rebuild: ${offListInRegistry.slice(0, 8).join(', ')}${offListInRegistry.length > 8 ? ` (+${offListInRegistry.length - 8} more)` : ''}`);

  /* A demo teaches by example, so a placeholder cover or a sample deck accent is held to the list too.
     Each exemption names why the file has to spell out an off-list colour. */
  const OFF_LIST_SOURCE_EXEMPT = {
    'lib/aha-color-picker.js': 'the default presets are colours a presenter picks for their own content',
    'parts/audience.guide.md': 'names forbidden colours as counter-examples',
    'parts/canvas.guide.md': 'names forbidden colours as counter-examples',
    'guidelines/audience.json': 'names forbidden colours as counter-examples',
    'guidelines/canvas.json': 'names forbidden colours as counter-examples',
  };
  const sourceFiles = [
    ...['parts', 'contracts', 'guidelines'].flatMap(dir => readdirSync(join(root, dir)).map(f => `${dir}/${f}`)),
    ...readdirSync(join(root, 'lib')).filter(f => /^aha-.*\.js$|-theme\.js$|^audience-deck\.js$|^viewport\.js$/.test(f)).map(f => `lib/${f}`),
    'generate.mjs',
  ].filter(f => !(f in OFF_LIST_SOURCE_EXEMPT));
  const offListSources = sourceFiles.flatMap(f => offList(read(join(root, f)).replace(/%23(?=[0-9a-fA-F]{6}\b)/g, '#'), false).map(hex => `${f} ${hex}`));
  rchk('demos, contracts, guidelines and element sources use only allowed colours', offListSources.length === 0,
    `use Vivid Pink, its tints, black, white or a grey (a demo placeholder too) — off the list: ${offListSources.slice(0, 10).join(', ')}${offListSources.length > 10 ? ` (+${offListSources.length - 10} more)` : ''}`);

  /* antd derives hover, press, focus and status shades from its seed colours; only the shared base pins them. */
  const bareThemes = readdirSync(join(root, 'lib')).filter(f => f.endsWith('-theme.js') && f !== 'antd-base-theme.js' && !/dsAntdTheme\(/.test(read(join(root, 'lib', f)))).map(f => `lib/${f}`);
  const barePreviews = readdirSync(PDIR).filter(f => /\.(preview|conformance)\.html$/.test(f) && /<ConfigProvider theme=\{(?!window\.__ahaDsTheme\()/.test(read(join(PDIR, f)))).map(f => `parts/${f}`);
  rchk('every antd theme is built on the shared base (dsAntdTheme)', bareThemes.length + barePreviews.length === 0,
    `wrap the theme in dsAntdTheme(...) (lib) or window.__ahaDsTheme(...) (a CDN preview), or antd falls back to its own hover and status colours: ${[...bareThemes, ...barePreviews].join(', ')}`);
}
{
  const retiredSkillRefs = [];
  for (const dir of ['guidelines', 'parts']) for (const f of existsSync(join(root, dir)) ? readdirSync(join(root, dir)) : [])
    if (/\.(json|md)$/.test(f) && /aha-design:aha-design-|`aha-design-[a-z-]+`\s+skill/.test(read(join(root, dir, f)))) retiredSkillRefs.push(`${dir}/${f}`);
  repoChecks.push(['guideline pages do not point at retired aha-design-* skills', retiredSkillRefs.length === 0,
    `the plugin ships one skill (aha-design); point at the DS guide / anti-slop feed instead: ${retiredSkillRefs.join(', ')}`]);
}
/* ===== sideEffects — a bundler (webpack / vue-cli) drops an import whose module is not listed as a side
   effect, so `import '@ahaslides-product/design/tokens.css'` or a custom-element registration import
   would silently vanish from a consumer build. A pattern without a slash matches the basename, as in webpack. */
{
  const rchk = (name, cond, note = '') => repoChecks.push([name, !!cond, cond ? '' : note]);
  const patterns = (PKG.sideEffects || []).map(p => {
    const source = p.replace(/^\.\//, '').replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*\*/g, '\u0000').replace(/\*/g, '[^/]*').replace(/\u0000/g, '.*');
    return p.includes('/') ? new RegExp(`^${source}$`) : new RegExp(`(^|/)${source}$`);
  });
  const isSideEffect = (path) => patterns.some(re => re.test(path.replace(/^\.\//, '')));
  const exportTargets = (node) => typeof node === 'string' ? [node] : node && typeof node === 'object' ? Object.values(node).flatMap(exportTargets) : [];
  const cssExports = [...new Set(exportTargets(PKG.exports).filter(t => t.endsWith('.css')))];
  const uncoveredCss = cssExports.filter(t => !isSideEffect(t));
  rchk('every exported .css file is listed in package.json sideEffects', uncoveredCss.length === 0,
    `a bundler tree-shakes these CSS imports away — add them (or "*.css") to sideEffects: ${uncoveredCss.join(', ')}`);
  const registrations = readdirSync(join(root, 'lib')).filter(f => f.endsWith('.js'))
    .filter(f => f === 'all.js' || /customElements\.define\(/.test(read(join(root, 'lib', f))))
    .map(f => `./lib/${f}`).filter(f => !isSideEffect(f));
  rchk('every custom-element registration entry point is listed in package.json sideEffects', registrations.length === 0,
    `importing these only for their registration would be tree-shaken away — add them to sideEffects: ${registrations.join(', ')}`);
}
/* ===== agent plugin — the DS ships its own Claude Code plugin from agent/, listed by the repo-root
   marketplace. The plugin version is the package version, so every release bumps both, and its
   criteria copy is the store's, so the skill, hooks and rules ship as one version. */
{
  const rchk = (name, cond, note = '') => repoChecks.push([name, !!cond, cond ? '' : note]);
  const readJson = (path) => { try { return JSON.parse(read(join(root, path))); } catch { return null; } };
  const marketplace = readJson('.claude-plugin/marketplace.json');
  const listed = marketplace?.plugins?.find(p => p.name === 'ahaslides-design');
  rchk('marketplace lists the ahaslides-design plugin from ./agent', marketplace?.name === 'ahaslides-design' && listed?.source === './agent',
    '.claude-plugin/marketplace.json must be named "ahaslides-design" and list plugin "ahaslides-design" with source "./agent"');
  rchk('marketplace entry carries no version of its own', listed && !('version' in listed),
    'the version lives in agent/.claude-plugin/plugin.json only — drop it from the marketplace entry');
  const plugin = readJson('agent/.claude-plugin/plugin.json');
  rchk(`agent plugin version ${plugin?.version} matches package.json ${PKG.version}`, plugin?.name === 'ahaslides-design' && plugin?.version === PKG.version,
    `bump agent/.claude-plugin/plugin.json "version" to ${PKG.version} — the plugin releases with the package`);
  rchk('agent plugin ships the aha-design skill and its hooks',
    existsSync(join(root, 'agent', 'skills', 'aha-design', 'SKILL.md')) && existsSync(join(root, 'agent', 'hooks', 'hooks.json')),
    'agent/skills/aha-design/SKILL.md and agent/hooks/hooks.json must exist');
  const bundled = join(root, 'agent', 'anti-slop', 'criteria.json');
  rchk('agent plugin criteria copy equals anti-slop/criteria.json',
    existsSync(bundled) && read(bundled) === read(join(root, 'anti-slop', 'criteria.json')),
    'run npm run generate — it rewrites agent/anti-slop/criteria.json from the store; commit the result');
}
if (UPDATE_BASELINE) writeFileSync(BASELINE_PATH, JSON.stringify({ $about: 'Per-file count of raw padding/margin/gap px declarations (> 1px) in component source, grandfathered. standards.mjs fails when a file exceeds its count; lower it with --update-baseline.', spacingPx: spacingPxBaselineNext }, null, 1) + '\n');
for (const note of spacingPxLowered) console.log(`ratchet: ${note}`);

/* ---- report ---- */
let pass = 0, fail = 0, warnCount = 0;
console.log('\n=== AhaSlides DS — STANDARDS gate ===\n');
console.log('components');
for (const r of results) {
  const ok = r.checks.every(x => x[1]);
  ok ? pass++ : fail++;
  console.log(`${ok ? '✓' : '✗'} ${r.slug}`);
  for (const [n, v, note] of r.checks) console.log(`      ${v ? '·' : '✗ FAIL:'} ${n}${!v && note ? `  [${note}]` : ''}`);
}
if (guidelineResults.length) {
  console.log('\nguidelines');
  for (const r of guidelineResults) {
    const ok = r.checks.every(x => x[1]);
    ok ? pass++ : fail++;
    console.log(`${ok ? '✓' : '✗'} ${r.slug}  [pattern]`);
    for (const [n, v, note] of r.checks) console.log(`      ${v ? '·' : '✗ FAIL:'} ${n}${!v && note ? `  [${note}]` : ''}`);
    for (const [n, note] of r.warns) { warnCount++; console.log(`      ⚠ WARN: ${n}${note ? `  [${note}]` : ''}`); }
  }
}
if (libFindings.length) {
  console.log('\ncomponent source (visual standard)');
  for (const f of libFindings) {
    const ok = f.hits.length === 0;
    ok ? pass++ : fail++;
    console.log(`${ok ? '✓' : '✗'} ${f.file}  [${f.mode}]`);
    if (ok) console.log(`      · ${f.mode === 'element' ? 'colour token-bound, radius on-scale' : 'every hex on-palette'}`);
    for (const h of f.hits) console.log(`      ✗ FAIL: ${h}`);
    for (const h of (f.motionHits || [])) { warnCount++; console.log(`      ⚠ WARN: ${h}`); }
  }
}
if (ANTISLOP) {
  console.log('\nanti-slop (official tool)');
  const ok = antislopChecks.every(x => x[1]);
  ok ? pass++ : fail++;
  console.log(`${ok ? '✓' : '✗'} store + feeds`);
  for (const [n, v, note] of antislopChecks) console.log(`      ${v ? '·' : '✗ FAIL:'} ${n}${!v && note ? `  [${note}]` : ''}`);
  for (const [n, note] of antislopWarnings) { warnCount++; console.log(`      ⚠ WARN: ${n}${note ? `  [${note}]` : ''}`); }
}
{
  console.log('\nrepo');
  const ok = repoChecks.every(x => x[1]);
  ok ? pass++ : fail++;
  console.log(`${ok ? '✓' : '✗'} CHANGELOG + version`);
  for (const [n, v, note] of repoChecks) console.log(`      ${v ? '·' : '✗ FAIL:'} ${n}${!v && note ? `  [${note}]` : ''}`);
}
console.log(`\n${pass} artifact(s) meet the standard / ${fail} fail${warnCount ? ` · ${warnCount} warning(s)` : ''}\n`);
if (!contracts.length && !guidelines.length) { console.log('No contracts or guidelines found — nothing to gate.'); }
process.exit(fail ? 1 : 0);
