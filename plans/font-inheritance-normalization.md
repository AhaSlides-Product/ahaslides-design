# Spec: normalize font inheritance across all leaf web components (+ enforce it)

**Status:** draft (for agent enhancement)
**Precedent:** PR #98 (`fix/alert-inherit-host-font`) — the first component fixed this way.
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

Two systemic gaps made it worse:

1. **Inconsistency.** Leaves handle font three different ways today (see §3), so the behaviour is
   unpredictable across the library.
2. **No gate.** `standards.mjs` has **no font rule**, so nothing prevents a new component from
   re-introducing the anti-pattern.

## 2. Goal

- One canonical, documented way every leaf handles `font-family`.
- Host apps get correct inheritance with zero per-component config; standalone usage stays branded.
- A `standards.mjs` rule that fails the anti-pattern, so it can't regress.
- Shipped as **one** normalization PR (per-component review, not a blanket sed), gated green.

## 3. Current state (audit — verify per component; the quick classifier over-flags)

A heuristic scan of `lib/aha-*.js` found four buckets. **The heuristic is approximate** — e.g.
`segmented` pins the font on its `.track` wrapper but its actual label (`.seg`) already inherits, and
several `? other` components already set the correct `:host` default. Each component must be read
individually before changing it.

| Bucket | Meaning | Action |
|---|---|---|
| **Content-pinned** (like old `alert`) | `font-family: var(--aha-font-product,…)` on a **text-bearing** content element | **Fix** → canonical pattern |
| **Wrapper-pinned** (e.g. `segmented`) | font pinned on a non-text wrapper; visible text already `inherit` | Fix only if it affects rendered text; else normalize for consistency |
| **Correct** (`tabs`, `collapse`, `color-picker`, `section-header`, `result`, `alert` post-#98) | `:host` default + content `inherit` | none |
| **No font** (`flex`, `grid`, `space`, `skeleton`) | no `font-family` anywhere | leave (or add `:host` default only if it renders text) |

> TODO(agent): produce the definitive per-component table by reading each `lib/aha-*.js`, listing
> the exact selectors that set `font-family` and whether they bear visible text. Do not trust the
> bucket labels above without confirming in source.

## 4. Canonical pattern (decision)

Match the existing correct leaves (`tabs` / `collapse` / `result` / `alert`):

```css
:host{ /* …display… */ font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif) }
.text-bearing-element{ /* … */ font-family:inherit; /* keep explicit font-size / line-height / weight */ }
```

- **Standalone** (bare HTML + `tokens.css`): `:host` supplies the DS product font.
- **Host app**: sets `--aha-font-product` (or the element inherits it) → the component matches the app.
- Keep per-element `font-size` / `line-height` / `font-weight` as-is; only `font-family` changes to
  `inherit` on content.

> OPEN QUESTION (agent to resolve): should we instead adopt the pure-inherit-page style
> (`segmented`: no `:host` font, content `inherit`) and have `tokens.css` set a base
> `:root { font-family: var(--aha-font-product) }` for standalone? That gives zero-config host
> inheritance without needing the host to set the token. Trade-off: `tokens.css` then imposes a font
> on the host `:root`, which some consumers may not want. Recommendation: keep the `:host`-default
> pattern above unless there's a reason to change `tokens.css`.

## 5. Exceptions (do NOT force to product font)

- **Monospace surfaces** (code/kbd inside any component) keep `--aha-font-mono`.
- **`aha-loader`**, decorative/icon-only components with no user text — review individually.
- Any component that intentionally uses `--aha-font-display` / `--aha-font-secondary` keeps it, but
  should still route through `:host` + `inherit` so a host can override.
- Escape hatch for a justified deviation, matching the repo's existing convention:
  `/* ds-lint-allow: font (why) */` on that line.

## 6. New `standards.mjs` gate

Add a rule to the per-leaf source scan (alongside the colour/radius/motion checks):

- **Flag:** a `font-family` declaration whose value references `--aha-font-product`
  (or a literal font stack) on any selector **other than `:host`**, unless the line carries a
  `ds-lint-allow: font (…)` escape hatch.
- **Allow:** `font-family:inherit` on content; `font-family:var(--aha-font-product,…)` on `:host`;
  `--aha-font-mono` for code surfaces.
- **Message:** point at this spec and the canonical pattern.
- **Rollout:** ship as `warn` first (so the normalization PR and the gate can land together without a
  chicken-and-egg red), then flip to hard `fail` once all leaves are normalized.

> TODO(agent): confirm exactly how `standards.mjs` classifies leaves and where the visual-standard
> scan lives, and implement the check in that path with a unit/self-test if the repo has one.

## 7. Non-goals

- No change to `contracts/*.json` unless a component's `conformance` should start measuring font
  (optional; today the alert conformance measures colour/border/radius/padding only).
- No composite (AntD) theme changes — this is leaf web components only.
- No token renames.

## 8. Verification

- `npm run check` green (generate → standards → screen-lint self-test → qa).
- The `qa` render gate measures colour/border/radius/padding, **not** font, so font changes don't
  affect it — but run it anyway to catch accidental layout regressions.
- Optional: extend one representative `conformance` block to assert `fontFamily` resolves to the
  inherited host value in a themed harness, so the render gate also pins inheritance.

## 9. Rollout

- One PR: normalize all offending leaves + add the (initially `warn`) gate.
- CHANGELOG top entry `## X.Y.Z — YYYY-MM-DD` + matching `package.json` version bump + real PR ref
  (the gate enforces this).
- Live to consumers on merge via `/gh/@master` (no release tag needed).
- Follow-up PR (or same, once green): flip the gate `warn → fail`.

## 10. Open questions for the enhancing agents

1. Definitive per-component table (§3 TODO) — which leaves actually pin **visible text**?
2. Canonical pattern confirmation (§4 open question) — `:host`-default vs `tokens.css` base.
3. Exact `standards.mjs` implementation point + self-test (§6 TODO).
4. Should any `conformance` block start measuring inherited font (§8)?
5. One PR vs batches (e.g. by group: inputs, feedback, layout) for reviewability?
