# UX writing — composition guide

> Distilled from `aha-design-ux-writing`. The skill holds the full rationale, the worked
> before/after library (`references/patterns.md`), and all `UXW-x` assertions; this guide is
> the shippable checklist. The DS now OWNS this build ruleset — the judge and evals stay in the
> skill. When the two ever disagree, the skill wins and this file is regenerated.

UX writing is the most cross-cutting surface in the product: the same words and casing appear on a
button, a menu item, a tooltip, an empty state, and an error message, across the editor, dashboard,
settings, and audience UIs. This pattern adds no new control — it reuses the Button label, the
functional Icon, and the `--aha-color*` feedback tokens, and defines the **wording conventions**
that keep every string reading as one product. It owns **what** the copy says and **how** it's
cased — not how the surface looks (the component skills) and not the brand voice it's said in
(`aha-branding`).

## Pick the surface first

| Surface | Use for |
| --- | --- |
| **Label / CTA / menu / tab** | The name of an action or destination — sentence case, one canonical form reused everywhere |
| **Heading / dialog title** | Section and dialog titles — sentence case; the title carries the OUTCOME |
| **Empty state** | Success-but-no-data — encouraging copy + a primary create action, never an apology |
| **Error / load-failure message** | A recoverable problem — name the object, give the next step, expose the recovery control |

## Casing — sentence case is the house default · UXW-1

Sentence case is the default for **all** AhaSlides product UI text: button & CTA labels, menu /
tab / nav items, **slide-type and interactive-component names**, section headings, tooltips and
helper text, dialog titles, empty states, and message copy.

- **Capitalize the first letter only.** Keep **proper nouns, brand names, and acronyms** as-is.
- ✅ **"View report"**  ❌ "View Report" · "VIEW REPORT" · "view report"
- **Slide-type & interactive-component names are sentence case too:**
  - ✅ "Multiple choice" · "Word cloud" · "Open-ended" · "Spinner wheel" · "Brainstorm" · "Rating scale"
  - ✅ acronyms/brand kept: "Q&A" · "AI slide" · "AhaSlides"
  - ❌ "Multiple Choice" · "Word Cloud" · "Open-Ended" · "Spinner Wheel"
- **One canonical form, everywhere.** Pick one cased form for a label and use it in every place it
  appears — button, menu, tooltip, analytics label. AI-generated UI drifts ("View Report" on the
  card, "View report" in the menu); **the canonical answer is sentence case "View report"** — never
  ship both.

**The one exception — a typography role, not a violation.** The styled **all-caps** eyebrow /
overline / chip label (the `capitalized` role) is intentionally uppercased and is owned by
`aha-design-typography`. It is a deliberate style, not a casing mistake — don't "fix" it to sentence
case, and don't cite it to justify Title Case elsewhere.

## Errors, empty states & feedback microcopy

### The anatomy of a good message

| Part | What it is | When |
| --- | --- | --- |
| **OUTCOME** | what happened, in the user's terms | always |
| **CAUSE** | why, in plain language | when it helps the user act |
| **NEXT** | what to do now | always, for anything recoverable |
| **ACTION** | the button/link that does the NEXT | whenever a one-tap recovery exists |

- **Title = the OUTCOME. Body = the NEXT step.** Not the reverse.
- Drop CAUSE when it's noise ("a network request failed") but keep it when it changes what the user
  does ("You're offline", "That file is over 50 MB").
- A message with an OUTCOME but no NEXT is a **dead-end** — the "*Error? so what now?*" reaction.

### Be specific — name the object and what happened · UXW-2

- ❌ "Some items could not be loaded." → ✅ "Couldn't load some presentations."
- ❌ "Something went wrong." / "An error occurred." / "Oops!" → name the object + verb.
- Prefer a concrete count ("3 presentations didn't load") over "some".
- **Banned as a standalone message:** *Something went wrong · An error occurred · Oops ·
  Unexpected error · Some items could not be loaded · Failed.*

### Never dead-end — always give the next step, and the action if one exists · UXW-3

Any message about a **recoverable** problem must tell the user what to do now and expose the recovery
as a real control when a one-tap recovery exists (Retry, Reload, Log in again, Go back, Contact
support). The recovery lives **in the message**, not only in a toast that vanishes.

### Human, blameless, jargon-free · UXW-4

- **Don't blame the user.** ❌ "You entered an invalid file." → ✅ "That file type isn't
  supported — try a PNG or JPG."
- **No raw codes / stack / HTTP status as the headline** — tuck any code into secondary detail.
- **Lead with the user's goal, not the system's failure.** ❌ "An exception was thrown" →
  ✅ "We couldn't open your presentation."

### Match severity to reality · UXW-5

- A **transient, retryable** hiccup is an info/warning with a calm "Try again", not a blaring red
  "Error" — over-alarming trains users to ignore real errors.
- A **destructive or data-loss** outcome states the stakes plainly ("This permanently deletes 12
  responses."). Don't cry wolf; don't bury the lede.

### An empty state is not an error · UXW-6

- **Empty (success, no data):** encouraging + a **primary next action**. ✅ "No presentations yet.
  **Create your first one.**" Never an apology, never a red alarm.
- **Failure (couldn't load):** follow UXW-2/3 — name it, offer Retry. Never disguise a failure as
  emptiness ("No presentations" when the fetch errored hides the Retry the user needs).

### Put the message where it survives — right home & shape · UXW-7

- **(a) Survives.** Recovery-required copy must not live only in an auto-dismissing toast; it
  belongs in an inline Alert or on the page. (Surface mechanics owned by `aha-design-feedback`; this
  is about not stranding the *words*.)
- **(b) Shape (only when there's a title + body).** Title carries the outcome; body the next step —
  not inverted. A shapeless single-string message is fine here — its vagueness is a UXW-2 problem,
  not a UXW-7 one.

### Worked example

> ❌ ⚠️ **Some items could not be loaded.**  →  ✅ ⓘ **Some presentations didn't load.** Check your connection and **try again**.  → [ Try again ]

Vague object → named (UXW-2); dead-end → next step + Retry (UXW-3); calm retryable tone, not a fatal
red error (UXW-5).

## Universal principles (every string)

Applied by every area above; the areas make them concrete.

- **Consistent** — one canonical form per label/term, used everywhere.
- **Specific** — name the real object; no vague placeholders.
- **Actionable** — tell the user what to do next; labels name the action.
- **Human & plain** — blameless, jargon-free, front-loaded.

## Areas still to fill

The skill is deliberately incomplete — these areas are owned there but not yet written. Until they
are, apply the universal principles above; each lands here with its own rule + ref as it's written.

- **Action-label style** — verb-first, concise button/CTA labels ("Create presentation", not
  "Presentation creation"); primary vs secondary phrasing.
- **Terminology & glossary** — one word per concept across the product (presentation vs deck vs
  slideshow); the canonical AhaSlides term list.
- **Tooltips & helper text** — when to add, length, imperative vs descriptive.
- **Onboarding & first-run copy** — empty-first-run states, coach marks, checklists.
- **Confirmation & consent copy** — the words in destructive/consequential dialogs.

---

*Full detail, the before/after library, and the stubbed areas live in the `aha-design-ux-writing`
skill. Self-check any copy with `aha-design-ux-writing-judge` and fix every FAIL before shipping.
Stay in your lane: the surface LOOK is `aha-design-feedback` / `aha-design-shared-components`, the
type SCALE is `aha-design-typography`, and the brand VOICE is `aha-branding:aha-branding-tone-voice`.*
