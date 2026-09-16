# Spec: normalize font inheritance across all leaf web components (+ enforce it)

**Status:** implemented — all leaves normalized + gate shipped (this PR).
**Precedent:** PR #98 (`fix/alert-inherit-host-font`) — the pattern this generalizes. (NB: #98 is not
yet on `master`; this PR normalizes `aha-alert` itself, so the library is self-consistent regardless.)
**Owner:** DS maintainers

---

## 1. Problem

A leaf web component that sets `font-family` **on its shadow content** cannot inherit the
consuming app's typography. Because the shadow boundary isolates styles, the pinned value wins and
the component's text drifts from the surrounding UI in a themed host app — different fallback chain,
letter-spacing, and smoothing — even when the host also uses Plus Jakarta Sans.

This surfaced with `aha-alert` embedded in a themed AntD app: its text read as "off" next to the
app's own PJS. Root cause was `.alert { font-family: var(--aha-font-product,…) }` on the content
instead of inheriting.

Two systemic gaps made it worse, and both are closed by this PR:

1. **Inconsistency.** Leaves handled font three different ways. → Now one canonical pattern (§4).
2. **No gate.** `standards.mjs` had no font rule. → Now a hard-fail gate on the per-leaf source scan (§6).

## 2. Goal (met)

- One canonical, documented way every leaf handles `font-family`. ✅ (§4)
- Host apps get correct inheritance with zero per-component config; standalone stays branded. ✅
- A `standards.mjs` rule that fails the anti-pattern, so it can't regress. ✅ (§6)
- Shipped as **one** normalization PR (per-component review, not a blanket sed), gated green. ✅

## 3. Audit — the definitive per-component table

The heuristic buckets in the original draft over-flagged (e.g. `csat` and `divider` set the product
font on a **multi-line `:host{…}`** block — the naive line-scan read the continuation line as
"content"). The authoritative classifier is the shipped gate itself (§6): its "is the declaration's
selector subject `:host`?" test *is* the audit. Running it on `master` produced the exact list below.

**24 components pinned the product font on a non-`:host` (content/wrapper) selector — all fixed.**
Every one of them had a bare `:host` with **no** `font-family`, so each fix (a) added the product font
to `:host` and (b) switched the content declaration(s) to `font-family:inherit` (size/line-height/
weight/letter-spacing untouched):

| Component | content selector(s) → `inherit` |
|---|---|
| `aha-add-item-button` | the pill `button` |
| `aha-alert` | `.alert` |
| `aha-avatar` | `.avatar` (single-avatar block; the group/stack block bears no text) |
| `aha-badge` | `.marker`, `.status`, `.ribbon`, `.chip` |
| `aha-button` | `button` |
| `aha-card` | `.card` |
| `aha-card-select` | `.card` |
| `aha-checkbox` | `label` |
| `aha-counted-input` | `.field`, `.counter` |
| `aha-counted-textarea` | `.field`, `.counter` |
| `aha-image` | `.mask`, `.fallback` |
| `aha-image-action-button` | `.mi` |
| `aha-input` | `.field` |
| `aha-number-with-unit` | `.field`, `.unit`, `.msg` |
| `aha-progress` | `.wrap` |
| `aha-radio` | `label` |
| `aha-rate` | `.stars` (glyph container — normalized for consistency) |
| `aha-segmented` | `.track` (wrapper; `.seg` label was already `inherit`) |
| `aha-select` | `.trigger`, `.option` |
| `aha-status-badge` | `.pill` |
| `aha-switch` | `.children` (in-track on/off text) |
| `aha-tag` | `.chip` |
| `aha-tooltip` | `.bubble` |
| `aha-user-info` | `.row` |

**Already correct — `:host` default + content inherit or silent (no change):** `aha-breadcrumb`,
`aha-collapse`, `aha-color-picker`, `aha-csat`, `aha-descriptions`, `aha-divider`, `aha-dropdown`,
`aha-empty`, `aha-image-dropzone`, `aha-info-box`, `aha-list`, `aha-menu`, `aha-mode-field`,
`aha-numbered-item`, `aha-option-row`, `aha-pagination`, `aha-paywall`, `aha-popover`,
`aha-question-list`, `aha-result`, `aha-screen-heading`, `aha-settings-list`, `aha-spin`,
`aha-statistic`, `aha-tabs`, `aha-uploader`.

**No font (layout/skeleton primitives, no user text):** `aha-flex`, `aha-grid`, `aha-space`,
`aha-skeleton`.

## 4. Canonical pattern (decided: `:host`-default)

```css
:host{ /* …display… */ font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif) }
.text-bearing-element{ /* … */ font-family:inherit; /* keep explicit font-size / line-height / weight */ }
```

- **Standalone** (bare HTML + `tokens.css`): `:host` supplies the DS product font.
- **Host app**: sets `--aha-font-product` (or the element inherits it) → the component matches the app.
- Keep per-element `font-size` / `line-height` / `font-weight` as-is; only `font-family` changes.

**Open question resolved — `:host`-default, NOT a `tokens.css` `:root` base.** `lib/tokens.css`
deliberately defines the `--aha-font-product` *token* on `:root` but sets no `font-family` there.
Adding `:root{ font-family: var(--aha-font-product) }` would give zero-config inheritance but would
impose a font on every consumer's document `:root` — a side effect some hosts don't want, and the
opposite of "opt in via the token." The `:host`-default keeps standalone branded and lets a host
override purely by setting `--aha-font-product` (or by inheriting into the element). This also matches
the leaves that were already correct, so the library converges on one shape.

## 5. Exceptions (unchanged, and honored by the gate)

- **Monospace** (`--aha-font-mono`) and **display/secondary** (`--aha-font-display` /
  `--aha-font-secondary`) are a distinct surface, not the product-font anti-pattern — the gate allows
  them on any selector (they should still route through `:host` where practical so a host can
  override, but that isn't force-gated). No leaf currently pins these on content.
- Per-line escape hatch, matching the repo convention: `/* ds-lint-allow: font (why) */` (the gate
  reads `ds-lint-allow: … font …` on the offending line).

## 6. The `standards.mjs` gate (shipped)

Added to the per-leaf **source** scan (the same pass as the colour/radius/motion/a11y/responsive
checks), element mode only:

- **Flag** (`hits` → hard FAIL): a `font-family` declaration that references `--aha-font-product`
  (or a bare literal font stack — a quoted family or a known family/generic keyword *not* inside a
  `var(...)`) on a rule whose selector subject is **not** `:host`.
- **Allow:** `font-family:inherit`; `font-family:var(--aha-font-product,…)` on `:host`
  (subject test permits only a bare `:host` / `:host([…])`); `--aha-font-mono/display/secondary`;
  any line carrying `ds-lint-allow: … font`.
- **Implementation notes:**
  - The CSS lives in a JS template literal, so the first rule's `:host` selector is preceded by JS
    (`const STYLE = \``) with no brace boundary. The scanner takes the selector tail after the last
    `;` or backtick (neither can appear in a CSS selector), dropping the JS prefix — without this,
    every leading `:host{…}` false-positives.
  - Rule blocks are matched with a flat `([^{}]+)\{([^{}]*)\}` matcher; a `@media` wrapper's braces
    make the matcher fall through to the inner rule, which is exactly what we want to check.
  - Line numbers are computed from the match offset so findings point at the real source line.
- **Rollout decision — HARD FAIL from day one, no warn phase.** The draft proposed warn-first to
  avoid a chicken-and-egg red. But because this PR normalizes **every** offending leaf in the same
  change, the gate ships hard-fail *and* green — there's nothing to warn about. This mirrors the
  existing motion/a11y/responsive gates exactly: hard-fail by default, with a small greppable
  `FONT_DEBT` map (element-tag → kinds) as the only escape valve for pre-gate debt. `FONT_DEBT` ships
  **empty**, so the gate is fully hard. No separate "flip warn→fail" follow-up is needed.
  - Finding kind: `inherit`. Debt entry shape: `'aha-x': ['inherit']` (routes that file's finding to
    WARN instead of FAIL — remove it the moment the component is fixed).

## 7. Non-goals (held)

- No `contracts/*.json` change (the alert conformance still measures colour/border/radius/padding).
- No composite (AntD theme) changes — leaf web components only.
- No token renames.
- The hand-copied `parts/*.preview.html` demos are **not** touched: they render standalone (with
  `tokens.css`), so with the product font on `:host` they display identical PJS; qa measures
  colour/border/radius/padding, not font, so there is no drift to gate. (Open question #4: no
  `conformance` block starts measuring font — the render gate doesn't cover typography and the goal is
  achieved purely at the source level.)

## 8. Verification

- `node standards.mjs` → **0 fail** (font findings clean; the pre-existing 36 warnings are unrelated
  anti-slop/pattern-backlog warns).
- Every fixed leaf verified to now carry the product font on `:host` **and** `inherit` on the content
  that was pinned (the gate proves the latter; a `:host`-font grep proves the former).
- `npm run check` (generate → standards → screen-lint self-test → qa). qa measures colour/border/
  radius/padding — font changes don't move it — but it's run to catch accidental layout regressions.
  (qa needs headless Chrome; a `screenshot 0KB` line is local Chrome contention, not a code failure.)

## 9. Rollout

- **One PR:** normalize all 24 offending leaves + add the (hard-fail, empty-`FONT_DEBT`) gate.
- CHANGELOG top entry `## X.Y.Z — YYYY-MM-DD` + matching `package.json` version bump; PR ref filled
  once the PR is open (the gate hard-fails a leftover `(#PR)` placeholder, so it is added, not left).
- Live to consumers on merge via `/gh/@master` (no release tag needed).

## 10. Open questions — resolved

1. **Definitive per-component table** → §3 (24 fixed; correct/no-font buckets enumerated).
2. **Canonical pattern** → §4: `:host`-default (not a `tokens.css` `:root` base).
3. **`standards.mjs` implementation point + behaviour** → §6: per-leaf source scan, element mode,
   hard-fail with empty `FONT_DEBT`, selector-subject test with the template-literal + `@media`
   caveats handled.
4. **Should conformance measure font?** → No (§7): the goal is met at source level; qa doesn't cover
   typography and adding it would be redundant scope.
5. **One PR vs batches** → One PR (§9): per-component diffs are small and independently reviewable,
   and shipping the gate with the fixes is what lets it land hard-fail-and-green.
