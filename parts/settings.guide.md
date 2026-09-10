# Settings — composition guide

> Distilled from `aha-design-settings`. The skill holds the full rationale, worked
> BAD/GOOD examples, and all 52 `SETTINGS-xx` assertions; this guide is the shippable
> checklist. When the two ever disagree, the skill wins and this file is regenerated.

Settings panels are the most-repeated surface in the product. They reuse existing
components — Checkbox, Button, Icon, the spacing scale — so this pattern adds no new
control; it defines the **conventions** that keep every panel reading as one product.

## Pick the surface first

| Surface | Use for |
| --- | --- |
| **Inline panel** (editor right pane) | Per-object settings, immediate effect on the canvas |
| **Settings page** (route) | Workspace / account-level settings that affect a whole scope |
| **Modal** | A one-time action or short flow, not persisted on its own |
| **Drawer** | 3–8 settings that supplement a primary view |

A single-block panel growing past 8–10 settings is a signal to re-group or split, not to keep adding.

## Name and control

- **Name = short noun phrase.** No leading verb. "Progress bar", not "Show progress bar". The control already says on/off; the label names what is acted on. (Narrow exception: a manual/automatic *mode* toggle may keep its verb — "Show results manually".)
- **No decorative leading icon.** Panel icons are functional only — drag handle, image, delete, `?` help. A trophy on "Leaderboard" is decorative and comes out, however on-topic.
- **Toggle vs checkbox:** toggle when the change takes effect immediately; checkbox when options are saved together or express consent. **Never mix the two in one group.**
- **Placement:** narrow control inline (label left, control right); wide control (textarea, wide select, radio group, image dropzone) drops below the label.

## Explanation: name → tooltip → help text

This is the single most common AI failure — do not give every setting a description line.

1. **Name only** — the default; carries most settings.
2. **`?` tooltip** — the home for any "what/why/how it interacts" elaboration. Costs no standing weight. The glyph is a question-mark from the shared Icon (never an info circle), same glyph/size/placement across the panel, shared dark-navy tooltip with the arrow on the icon.
3. **Help text** — only a must-see consequence that is hard to undo (≤90 chars, states the consequence, ends with a period). **Default zero per panel.** Never a `?` and a help line on the same setting.

**Ship gate:** count the help-text lines. More than one is almost always the anti-pattern.

> **One home for guidance.** The canonical `SettingRow` puts *all* "what/why/how it interacts"
> elaboration in the `?` tooltip — it has no separate always-visible description line. AhaSlides keeps
> one narrow addition on top of that: the rare **must-see consequence** help line (tier 3 above), which
> is near-zero per panel and states a hard-to-undo consequence, not a description. Everything else is a
> tooltip or nothing. Never run a `?` tooltip *and* a help line on the same setting.

## Grouping — spacing, never lines or boxes

Hierarchy comes from the gap size, on the `--aha-size*` scale — monotonic so whitespace alone reads as structure:

| Relationship | Token | px |
| --- | --- | --- |
| Name → its help text | `sizeXXS` | 4 |
| Sub-setting → parent | `sizeXS` | 8 |
| Between sibling settings | `size` / `sizeMS` | 16 |
| Between groups | `sizeXL` | 32 |
| Danger zone | `sizeXXL` | 48 |

- **Never a divider line** between settings, groups, or the danger zone — more distance means a wider gap.
- **Never a card/tinted/bordered container** around plain settings or a lone toggle; a filled box signals a *selectable* object. Reserve it for real selectable items and the repeatable composite-item wrapper.
- **Group shape:** 2–6 settings; header is a 1–3 word noun phrase, sentence case, no colon; **only the header carries weight — semibold (600)** (the `SectionHeader` weight), member/single-control labels regular (400).
- **Order:** most-used first; a dependent sub-setting directly under its parent; dangerous last.

## Sub-settings

A setting that only applies when a parent is on is **hidden when the parent is off** — not shown disabled. When visible it reads as *nested*: indented (`sizeLG`), tighter gap above (`sizeXS`), and de-emphasised label — never a top-level peer, never bracketed by its own separators.

## Plan-gated and dangerous settings

- **Plan-gated:** stays **visible but locked** (crown badge) — never hidden. The badge opens the shared Paywall popover (owned by `aha-design-paywall`).
- **Danger zone:** dangerous/irreversible settings sit **last**, set apart by the largest gap (48). CTA is the **danger Button** (`colorError`, no hardcoded hex); red never on the label. Any irreversible action **requires a confirmation modal** (per `aha-design-overlays`) — never a bare toggle flip.

## No empty height

Every object occupies only its real content height. A container that renders nothing visible — an empty section, an empty list wrapper, an empty-body settings iframe — is removed or collapsed to zero, never left holding space. This is the top source of editor "mystery gaps".

## Mapping the settings-lab library to the DS

The composed settings controls have one source of truth — slide-type-creator's `@/iframe/settings`
library (`ui-standard.json → settingsLibrary`). This is the canonical, one-per-component mapping from
each library control to its AhaSlides-design form. A control resolves to one of three homes: a **DS
component** you reuse today; a **DS convention** this pattern documents (no dedicated element needed);
or a **backlog gap** — a composite the DS does not yet ship, tracked in `composedOf` (`status:
missing`) so a fully-compliant surface is buildable by reuse once it lands. Never hand-roll a control
the library already defines.

| settings-lab control | DS form | Home |
| --- | --- | --- |
| **SectionHeader** | `<aha-settings-list>` group header — semibold (600), optional `?` tooltip + action slot | convention (in `settings-list`) |
| **SettingRow** | `<aha-settings-item>` / a `settings-list` schema row — label left / control right, or stacked | **mapped** → `settings-list` |
| **SubSettingGroup** | *sub-settings* rule — indent-only, hidden (not disabled) when the parent is off | convention |
| **HelpTooltip** | `<aha-tooltip>` + `<aha-icon>` `?` glyph (the *help-glyph* rule) | **mapped** → `tooltip` |
| **DropdownMenu** | `<aha-dropdown>` + `<aha-menu>` — themed action menu | **mapped** → `dropdown` |
| **ModeField** | *label + inline exclusive mode control (outline radio / segmented), body swaps in place* | backlog |
| **CountedInput** | *single-line field + focus-only char counter (persistent sibling, no remount)* | backlog |
| **CountedTextarea** | *multi-line CountedInput; grows minRows–maxRows* | backlog |
| **CardSelect** | *single-select icon+label card grid* | backlog |
| **NumberWithUnit** | *digit input + hover stepper (clamped, maxDigits) + unit-in-full + optional error line* | backlog |
| **OptionRow** | *repeatable option row: drag handle, correct toggle, borderless textarea + counter, image, delete* | backlog |
| **NumberedItem** | *numbered composite-item wrapper: chip + `<Label> N` header + hover delete + grey container* | backlog |
| **QuestionList** | *collapsible questions (prompt + OptionRow choices); composes NumberedItem/OptionRow* | backlog |
| **ImageDropzone** | *full-width settings-only image field; emits intents, host runs the upload modals* | backlog |
| **ImageActionButton** | *per-option image control (empty/loading/thumbnail + Change/Edit/Delete)* | backlog |
| **InfoBox** | *settings-only tinted callout; bespoke, not Ant Alert* | backlog |

Backlog controls are real gaps, not licence to re-implement: author each here (contract + `lib/` +
parts + conformance), then flip its `composedOf` entry from `missing → available` and move its row to
**mapped**. Until then, a surface needing one composes the closest DS primitives and follows the rules
above.

---

*Full detail, screenshots, and the slide-type config specifics (§10) live in the
`aha-design-settings` skill. Self-check any built surface with `aha-design-settings-judge`
and fix every FAIL before shipping.*
