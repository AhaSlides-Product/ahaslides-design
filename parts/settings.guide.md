# Settings — composition guide

> Distilled from the retired `aha-design-settings` plugin skill, which the DS now owns. This guide holds the full rationale, worked
> BAD/GOOD examples, and all 52 `SETTINGS-xx` assertions; this guide is the shippable
> checklist. When the two ever disagree, this guide wins.

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

- **Name = clear noun phrase**, or a short when/who/what clause when that is clearer ("When the module opens", "Who can open this course"). No filler leading verb. "Progress bar", not "Show progress bar". The control already says on/off; the label names what is acted on. Clear beats short: see "Labels: say what the setting does" below. (Narrow exception: a manual/automatic *mode* toggle may keep its verb — "Show results manually".)
- **No decorative leading icon.** Panel icons are functional only — drag handle, image, delete, `?` help. A trophy on "Leaderboard" is decorative and comes out, however on-topic.
- **Toggle vs checkbox:** toggle when the change takes effect immediately; checkbox when options are saved together or express consent. **Never mix the two in one group.**
- **Placement:** narrow control inline (label left, control right); wide control (textarea, wide select, radio group, image dropzone) drops below the label.

## Labels: say what the setting does

**The test.** Someone opening this panel for the first time reads only the label (no tooltip, no help text) and can say what changes when they change it. If they have to guess, the label fails. Clear beats short, every time.

1. **Name the function in the words users already use**, not a coined term, a metaphor or domain jargon. "Pass mark" becomes "Complete module condition".
2. **Clear before short.** 2 to 6 words is fine. Cut filler (the, a, your, Enable, Allow, Show), never the word that carries the meaning.
3. **No lone abstract noun** as a setting label or group header that hides what it controls: "Opening", "Completion", "Behaviour", "Mode", "Display", "General options". Say the object and the moment: "Opening" becomes "When the module opens"; "Completion" becomes "When the module is complete".
4. **Say which object and where it shows** when that is ambiguous. "Team name" (which team? where does it appear?) becomes "Organisation name on certificate".
5. **Use the conventional term** people know from other products, not an internal or invented one. "Signer" becomes "Signature".
6. **Options and values meet the same test.** Each option states its outcome ("After the previous module is passed"), and a number field carries its unit in the label or the control ("Correct answers needed (%)").
7. **A tooltip is a backup, never the crutch.** If the label only makes sense after reading its tooltip, rewrite the label. A tooltip adds the why or an edge case, never the meaning (UXW-9).
8. **One term per concept** across the surface and its learner-facing side. If the trainer sets "Complete module condition", the learner view and reports do not call the same thing "pass mark".

### Worked examples

Real labels from the e-learning editor. "Keep" rows already pass and show what good looks like.

| Today | Rule-compliant label | Why |
| --- | --- | --- |
| Pass mark | Complete module condition | Rule 1: a term borrowed from exams, not what the trainer is setting |
| Opening (module group header) | When the module opens | Rule 3: lone abstract noun |
| Completion (module group header) | When the module is complete | Rule 3: lone abstract noun |
| Completion (course settings tab) | Course completion | Rule 3: says which object |
| Tracking (LMS export) | When the LMS marks it complete | Rule 7: the label only made sense with its intro line |
| LMS key | LMS name in reports | Rule 1: "key" is a system term; the field names the LMS in the report |
| Reporting options (group header) | What is sent to AhaSlides | Rule 3: "options" hides what the group controls |
| Report to the LMS as: Completed / Passed | Completed (learner finished) / Passed (learner reached the score) | Rule 6: each option states its outcome |
| Module score: "Pass mark 80%" (learner side) | Score needed to complete: 80% | Rule 8: the trainer side calls it "Complete module condition" |
| Signer (certificate) | Signature | Rule 5: the term people know |
| Team name (certificate) | Organisation name on certificate | Rule 4: which team, and where it shows |
| Who can open this course | Keep | States the outcome; a question label is fine when it is the clearest form |
| Minimum correct answers + % | Keep | Plain words, unit in the control (rule 6); the tooltip adds only the edge case (rule 7) |
| Minimum learning time | Keep | Plain words; the tooltip adds that idle time is not counted, the why, not the meaning |

**Self-check before shipping.** Write every label in a table: `label | "Changing this …" sentence | tooltip (if any)`. If the sentence needs words the label lacks, the label is missing them. Put that table in the PR body or preview of any settings build, so the requester reviews all wording in one place instead of guessing from screenshots. Judged by C20.

Rationale: plain language, one term per concept and labels that let people anticipate what happens are the common ground of Shopify Polaris content fundamentals (polaris-react.shopify.com/content/fundamentals) and Microsoft's app-settings guidelines (learn.microsoft.com/en-us/windows/apps/design/app-settings/guidelines-for-app-settings); essential meaning never lives only in a tooltip (UXW-9).

## Explanation: name → tooltip → help text

This is the single most common AI failure — do not give every setting a description line.

1. **Name only** — the default; carries most settings.
2. **`?` tooltip** — the home for any "what/why/how it interacts" elaboration. Costs no standing weight. The glyph is a question-mark from the shared Icon (never an info circle), same glyph/size/placement across the panel, shared black tooltip with the arrow on the icon. Tooltip copy follows UXW-9 in the UX writing guideline (one short idea).
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
| Sub-setting → parent | `size` / `sizeMS` | 16 |
| Between sibling settings | `sizeLG` | 24 |
| Between groups | `sizeXL` | 32 |
| Danger zone | `sizeXXL` | 48 |

- **Never a divider line** between settings, groups, or the danger zone — more distance means a wider gap.
- **Never a card/tinted/bordered container** around plain settings or a lone toggle; a filled box signals a *selectable* object. Reserve it for real selectable items and the repeatable composite-item wrapper.
- **Group shape:** 2–6 settings; header is a noun phrase or a short when/who/what clause (2–6 words, clear before short; never a lone abstract noun such as "Completion"), sentence case, no colon; **only the header carries weight — semibold (600)** (the `SectionHeader` weight), member/single-control labels regular (400) in primary text (`--aha-text-default` #1A1A1A). A group title is for a real group of two or more settings — never over a single field or a single list.
- **No control in a group header.** No toggle, switch, input, select or button in the header or its action slot; a control is a settings item (label left, control right). Plain text such as a count may stay.
- **Order:** most-used first; a dependent sub-setting directly under its parent; dangerous last.

## NumberedItem chip is never restyled

The number chip on `NumberedItem` is stock: a muted-grey 22px pill. Never override it with `::part(chip)` or replace it with a custom badge. The settings number is a plain ordinal and never mirrors the canvas marker (for example a navy pin badge with a white ring). Configure the item only through `n`, `label`, `variant`, `deletable`, `candelete` and the default body slot.

## Sub-settings

A setting that only applies when a parent is on is **hidden when the parent is off** — not shown disabled. When visible it reads as *nested*: indented 24 (`sizeLG`), 16 below the parent (`size` / `sizeMS`), and a regular 400 label in secondary text (`--aha-text-secondary` #4A4A4A) — never a top-level peer, never bracketed by its own separators.

## Plan-gated and dangerous settings

- **Plan-gated:** stays **visible but locked** (crown badge) — never hidden. The badge opens the shared Paywall popover (owned by the `paywall` guide).
- **Danger zone:** dangerous/irreversible settings sit **last**, set apart by the largest gap (48). CTA is the **danger Button** (`colorError`, no hardcoded hex); red never on the label. Any irreversible action **requires a confirmation modal** (per the `overlays` guide) — never a bare toggle flip.

## Fields: default size, full width when stacked, counter inside

- **One size.** Every settings field (Input, CountedInput, CountedTextarea, NumberWithUnit, Select) is the default 40px size. Never `size="small"`, `"sm"`, `"large"` or `"lg"`: no small field and no dense row in a settings panel, and 48px with 16px text is the audience phone field's size. Porting from AntD or slide-type-creator, their `size="large"` or `size="small"` field maps to the DS default.
- **Full width when stacked.** In a stacked row (label above) the field fills the panel width, also when it sits in a wrapper with helper text below it. A stacked SettingRow and the settings list's stacked item do this for every DS field; never give the field its own fixed width.
- **Counter inside, on focus.** A capped field is `<aha-counted-input>` or `<aha-counted-textarea>`: the counter sits inside the field and shows only while it is focused. Never a counter beside or below the field, and never `maxlength` on a plain `<aha-input>`.
- `screen-lint.mjs --surface=settings` hard-fails a small or large field (`field-size`) and `maxlength` on `<aha-input>` (`input-maxlength`); the judge checks the rest as C19.

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
| **ModeField** | *label + inline exclusive mode control (the DS Radio-Button-Group), body swaps in place* | **mapped** → `mode-field` |
| **CountedInput** | *single-line field + focus-only char counter (persistent overlay inside the field, no remount)* | **mapped** → `counted-input` |
| **CountedTextarea** | *multi-line CountedInput; grows minRows–maxRows* | **mapped** → `counted-textarea` |
| **CardSelect** | *single-select icon+label card grid* | **mapped** → `card-select` |
| **NumberWithUnit** | *digit input + hover stepper (clamped, maxDigits) + unit-in-full + optional error line* | **mapped** → `number-with-unit` |
| **OptionRow** | *repeatable option row: drag handle, correct toggle, borderless textarea + counter, image, delete* | **mapped** → `option-row` |
| **NumberedItem** | *numbered composite-item wrapper: chip + `<Label> N` header + hover delete + grey container* | **mapped** → `numbered-item` |
| **QuestionList** | *collapsible questions (prompt + OptionRow choices, header slots at every position, status line with warning/error border, delete revealed on hover or keyboard focus); composes Collapse, SettingRow, CountedInput, OptionRow, AddItemButton and FieldError* | **mapped** → `question-list` |
| **ImageDropzone** | *full-width settings-only image field; emits intents, host runs the upload modals* | **mapped** → `image-dropzone` |
| **ImageActionButton** | *per-option image control (empty/loading/thumbnail + Change/Edit/Delete)* | **mapped** → `image-action-button` |
| **InfoBox** | *settings callout drawn by the DS Alert (aha-alert)* | **mapped** → `info-box` |

Backlog controls are real gaps, not licence to re-implement: author each here (contract + `lib/` +
parts + conformance), then flip its `composedOf` entry from `missing → available` and move its row to
**mapped**. Until then, a surface needing one composes the closest DS primitives and follows the rules
above.

---

*Full detail, screenshots, and the slide-type config specifics (§10) live in the
the DS `settings` guide. Self-check any built surface with the DS anti-slop judge (`settings` surface)
and fix every FAIL before shipping.*
