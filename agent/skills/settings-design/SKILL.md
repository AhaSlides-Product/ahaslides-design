---
name: settings-design
description: "The one mandatory runbook for designing, building, naming, labelling or reviewing ANY AhaSlides settings UI against the AhaSlides design system: a settings panel, page, modal or drawer; a slide type's settings.* panel or slide-type config (the editor's right-panel options); course, lesson, presentation, workspace or account settings; preferences; an options dialog. It sequences the work and points at the DS sources, which own every rule: pick each control from the Settings hub control table, name every setting with the label rule, fill the label self-check table (label | \"Changing this …\" sentence | tooltip), group and space the settings, run screen-lint --surface=settings, judge every settings criterion PASS/FAIL, fix, re-judge. Use whenever a task adds, changes, renames or reviews a setting, a toggle, a switch, a checkbox option, a group header or an option label in any settings surface: 'add a toggle', 'add a setting for X', 'name / label / rename this setting', 'settings panel', 'right panel options', 'slide type config', 'preferences page', 'options dialog', 'review these settings', 'are these setting labels clear'. Mandatory, no exception: load it before planning or writing any settings UI, alongside ahaslides-design:aha-design for the rest of the screen. Not for backend config, feature flags, environment settings or settings.json files with no UI."
---

# settings-design — the settings runbook

Every settings surface in AhaSlides runs through this one skill, so every panel reads as one
product. It is **mandatory for any settings design task, with no exception**: the plugin's
write guard blocks a write to settings UI until this skill has been loaded in the session.

This skill does not restate rules. The design system owns them and they change; read them from
the sources below every time, never from memory.

| Source | Installed package (`node_modules/@ahaslides-product/design/…`) | Hosted (public) |
|---|---|---|
| Control table: which DS control each setting type uses | `lib/settings.js` (the elements a panel may use) | `https://design.ahaslides.io/settings/index.html` (`#ctrl-<slug>`) |
| Settings guide: naming, labels, explanation, grouping, sub-settings, gated and danger settings, fields | `guidelines/settings.json` | `https://design.ahaslides.io/guidelines/settings/settings.md` (the hub page above carries the full guide) |
| Judge criteria, surface `settings` (C1 to C20) | `anti-slop/criteria.json` → `surfaces.settings` | `https://design.ahaslides.io/anti-slop.md` |
| UI copy criteria, surface `ux-writing` | `anti-slop/criteria.json` → `surfaces.ux-writing` | same feed |
| Mechanical gate | `screen-lint.mjs --surface=settings` | — |

The rest of the screen (the modal or drawer shell, the page, the app shell, colour) still follows
`ahaslides-design:aha-design`. Run both: this skill owns the settings, aha-design owns everything
around them.

## 1. Scope the surface

1. List every setting the task adds, changes or touches, with its type (on/off, choice, number,
   text, image, list of items, danger action).
2. Pick the surface (inline panel, settings page, modal, drawer) from the guide's "Pick the
   surface first" table. A modal or drawer adds the `overlays` surface for its shell.
3. In a slide type, the settings panel is the `settings.*` file (`settings.html` / `settings.js`).
   It is product UI, not canvas: the `settings` surface applies, not `canvas` or `audience`.

## 2. Pick each control from the hub table

For every setting, find its type in the hub's control table and use the DS control that row
names, loaded through `lib/settings.js`. Never reach for a generic component, a raw `<input>` or
`<button>`, or an AntD look-alike. A setting type the table lacks is a DS gap: say so, and log it
(guide, "Mapping the settings-lab library to the DS").

## 3. Name every setting with the label rule

Apply the guide's "Name and control" and "Labels: say what the setting does" sections to every
setting label, group header and option text, using its worked examples as the bar. Then fill the
self-check table. **This table is a required output of every settings task**, built before any
markup is written and kept up to date:

```
| Label | "Changing this …" sentence | Tooltip (if any) |
|---|---|---|
| <label> | Changing this <what happens, in the user's words> | <the why or the edge case, never the meaning> |
```

One row per setting label, group header and option. If the sentence needs words the label lacks,
rewrite the label. Put the table in the pull request body (or the preview, for a design-only
task) so the requester reviews all wording in one place. It is judged by settings C20 (and C1).

## 4. Explanation, grouping and spacing

Apply the guide's sections in order: "Explanation: name → tooltip → help text", "Grouping —
spacing, never lines or boxes", "Sub-settings", "Plan-gated and dangerous settings", "Fields:
default size, full width when stacked, counter inside", "No empty height", and, in a slide type,
"NumberedItem chip is never restyled". Spacing values come from the guide's spacing hierarchy and
the `--aha-size*` tokens, never raw pixels.

## 5. Mechanical gate

```
node node_modules/@ahaslides-product/design/screen-lint.mjs --surface=settings <files>
```

(in the design-system repo: `node screen-lint.mjs --surface=settings <files>`). Fix every HARD
finding before judging. A control the DS does not ship keeps its tag with
`ds-lint-allow: raw-control (why)` (or `unregistered-element`) on that line; never use the marker
to keep a hand-made control the hub table already covers.

## 6. Judge every settings criterion

Judge **every** criterion of the `settings` surface (C1 to C20 today; read the list from the DS,
criteria get added), plus `ux-writing` for the labels and `overlays` for a modal or drawer shell.
For each: read its `test`, find the evidence (`file:line`), decide **PASS**, **FAIL** or **N/A**
(only when it cannot apply). No partial credit; a criterion you cannot verify is a FAIL. Report:

```
### settings — <files>
| # | Criterion | Verdict |
|---|---|---|
| C1 | <title> | PASS / FAIL / N/A — <evidence> |

**Overall: OK TO SHIP** or **Overall: NEEDS FIX**
```

## 7. Fix and re-judge

Fix every FAIL, update the label table, re-run the gate and the judge on the changed files, and
repeat until **OK TO SHIP**. After three rounds with a FAIL left, stop and report the remaining
FAILs and why they resist.

**Reviewing someone else's settings** ("are these labels clear?", a PR): run steps 3, 5 and 6 and
report, with the label table filled from their labels. Do not edit their code unless asked.

## Enforcement

- The prompt hook adds a "load `ahaslides-design:settings-design` first" line whenever a prompt
  mentions settings.
- The write guard denies a Write or Edit to settings UI (a slide type's `settings.*` file, or a
  file the guard routes to the `settings` surface) until this skill has been loaded in the
  session. `AHA_DESIGN_SETTINGS_SKILL_DISABLE=1` turns off only that block.
- The end-of-turn judge trigger asks for the label table whenever a settings file changed.

When the DS and the code disagree, the DS wins. A rule that looks wrong for a real case is changed
in `ahaslides-design` (`parts/settings.guide.md`, `guidelines/settings.json`,
`anti-slop/criteria.json`), never worked around here.
