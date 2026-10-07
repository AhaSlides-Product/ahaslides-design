#!/usr/bin/env python3
"""aha-design UserPromptSubmit hook — the earliest, always-on forcing point.

Skills are pull-based (the model elects to load them) and get fluency-skipped;
the PreToolUse dispatcher and Stop gate only fire once a frontend file is
actually written. That leaves the *pre-code* phase — planning, designing in
prose, a conversational design question — relying on the model's judgment or a
manual skill call. This hook closes that gap: it fires on EVERY prompt (so it
can't be skipped) and injects aha-design's mandate into context.

Two tiers:
  - ALWAYS: a short mandate ("any AhaSlides UI here? aha-design is mandatory —
    load the skill, don't trust your own style sense"). Fires on every task.
  - WHEN a UI signal is detected BY THIS HOOK (deterministic code, not the
    model's judgment): also inject the DS digest — the anti-slop surfaces and
    their criteria counts, read live from the DS criteria (installed package,
    else the plugin's own copy; see ds_criteria.py) — plus the build -> judge -> fix loop.
    UI-detection lives here, in code, so it can't be fluency-skipped — and it
    stays off genuinely non-UI tasks (backend/CLI/analytics).

The digest never restates rule content: the DS owns the criteria, so the hook
only names the surfaces and points at the source.

Contract: read the UserPromptSubmit payload JSON on stdin; print a JSON object
with hookSpecificOutput.additionalContext on stdout; exit 0. Fail-open: any
parse/IO error exits 0 with no output, so a prompt is never broken.
"""
import json
import os
import re
import sys

try:
    import firing_log
except Exception:  # never let a logging-import problem break a prompt
    firing_log = None

import ds_criteria
import legacy_vue

# Broad on purpose — the digest is a helpful add, and a borderline false positive
# just means a bit of extra context, never a block. Includes VI design terms.
UI_SIGNAL = re.compile(
    r"\b(ui|ux|screen|page|dashboard|form|dialog|modal|drawer|popover|component"
    r"|button|table|grid|layout|theme|colou?r|css|tailwind|antd|ant\s*design"
    r"|frontend|front-end|tsx|jsx|vue|icon|typography|font|spacing|padding"
    r"|responsive|mobile|paywall|toast|badge|tooltip|card|sidebar|navbar|menu"
    r"|render|restyle|design|style"
    # Mock/prototype vocabulary — a "give me a mock" prompt often carries none
    # of the words above, yet a from-scratch mock is exactly where the model
    # falls back to its own (off-brand) taste. These pull the concrete digest in.
    r"|mock|mockup|prototype|wireframe|dock|uploader|widget|hero|banner"
    r"|animation|spinner|loader"
    # Planning/UX vocabulary — the pre-code phase this hook exists to cover.
    r"|flow|usability|interaction|onboarding|wizard|redesign|revamp|microcopy"
    r"|settings|empty\s*state"
    # Functional-surface vocabulary — the wider ecosystem aha-design now owns:
    # docs UI, internal tools, admin, ops. Marketing surfaces route to
    # aha-marketing-skills via the MANDATE text, so a false positive here is harmless.
    r"|docs|help\s*cent(?:er|re)|admin|back-?office|console|ops|status\s*page"
    r"|dev\s*tool|internal\s*tool)\b",
    re.IGNORECASE,
)

MANDATE = (
    "[aha-design] If this task touches an AhaSlides FUNCTIONAL / application "
    "surface — a tool people operate: the product apps (presenter, audience, "
    "editor, dashboard, settings, in-app billing), the docs / help-centre UI, "
    "internal dev tools, admin / back-office panels, status / ops consoles — "
    "designing, planning, building, or reviewing that surface or its flow / "
    "interaction / UI copy (a screen, page, component, form, dialog, chart, "
    "table, setting, empty/error state) — the AhaSlides design system "
    "(@ahaslides-product/design) is MANDATORY. Load the `aha-design` skill BEFORE "
    "producing or planning it: it reads the DS (the installed package, else its "
    "feeds at " + ds_criteria.LLMS_URL + ") and runs the build -> judge -> fix "
    "loop against the DS anti-slop criteria. Do not rely on your own sense of the "
    "house style. For a from-scratch build or redesign, BRAINSTORM FIRST — clarify "
    "scope and inspect the current UI / state before writing code; don't skip it "
    "because the ask sounds simple. Outward MARKETING / brand surfaces (landing & "
    "marketing site, public pricing page, blog, email, social, ads, key art) and "
    "brand voice are aha-marketing-skills, not this. If neither, ignore this line."
)

LOOP = (
    "Loop: identify the surface(s) -> read their DS rules + criteria -> build with DS "
    "components and tokens -> run the DS mechanical gate (screen-lint) -> judge every "
    "criterion PASS/FAIL (no partial credit) -> fix every FAIL and re-judge -> ship only "
    "when all PASS."
)


def digest(criteria):
    if not criteria:
        return (
            "\n\n[aha-design] The DS anti-slop criteria could not be read (no installed "
            "@ahaslides-product/design and the plugin's own copy is missing). Fetch "
            + ds_criteria.ANTI_SLOP_MD_URL + " before building or judging — do not "
            "judge from memory.\n" + LOOP
        )
    surfaces = ", ".join(
        "{} ({})".format(key, len(items)) for key, items in sorted(criteria["surfaces"].items())
    )
    return (
        "\n\n[aha-design — DS anti-slop criteria, source: " + criteria["source"] + "]\n"
        "Surfaces judged (criteria count): " + surfaces + ".\n" + LOOP + "\n"
        "A product-app screen is also judged on `background` and `component-standard`; "
        "add `ux-writing` whenever UI copy changes."
    )


def _has_frontend_project(cwd):
    """Cheap, deterministic: is cwd (or a parent) a frontend project?"""
    d = os.path.abspath(cwd or ".")
    for _ in range(4):
        pkg = os.path.join(d, "package.json")
        if os.path.isfile(pkg):
            try:
                with open(pkg, encoding="utf-8") as fh:
                    txt = fh.read(20000)
                if re.search(r'"(antd|react|vue|@ant-design)', txt):
                    return True
            except Exception:
                return False
        parent = os.path.dirname(d)
        if parent == d:
            break
        d = parent
    return False


def main():
    try:
        raw = sys.stdin.read()
        payload = json.loads(raw) if raw and raw.strip() else {}
    except Exception:
        if firing_log is not None:
            firing_log.record("UserPromptSubmit", "noop", "bad_payload")
        return 0

    prompt = ""
    if isinstance(payload, dict):
        prompt = str(payload.get("prompt") or "")
    cwd = ""
    if isinstance(payload, dict):
        cwd = str(payload.get("cwd") or os.getcwd())

    try:
        vue2 = legacy_vue.is_vue2(cwd)
    except Exception:
        vue2 = False
    context = legacy_vue.VUE2_NOTICE + "\n\n" + MANDATE if vue2 else MANDATE
    try:
        ui = bool(UI_SIGNAL.search(prompt)) or _has_frontend_project(cwd)
    except Exception:
        ui = False
    criteria_source = ""
    if ui:
        criteria = ds_criteria.load(cwd)
        criteria_source = criteria["source"] if criteria else "none"
        context += digest(criteria)

    # #3 Degraded-state notice: this hook fires on EVERY prompt, so it is the one
    # reliable place to surface that the Stop anti-slop floor is currently
    # disabled (no Node >= 22 last time it tried). Nag until a healthy Stop run
    # clears it — a silently-off safety gate is the exact failure this fixes.
    if firing_log is not None:
        try:
            last_stop = firing_log.last("Stop")
            if last_stop and last_stop.get("outcome") == "degraded":
                context += (
                    "\n\n[aha-design] ⚠ The anti-slop FLOOR (Stop gate) is "
                    "currently DISABLED (" + str(last_stop.get("reason", "")) +
                    ") — frontend files are not being craft-checked when a turn "
                    "ends. Fix: install Node >= 22 (Homebrew or nvm) so slop_guard "
                    "can run."
                )
        except Exception:
            pass

    print(json.dumps({
        "hookSpecificOutput": {
            "hookEventName": "UserPromptSubmit",
            "additionalContext": context,
        }
    }))

    if firing_log is not None:
        session_id = payload.get("session_id") if isinstance(payload, dict) else None
        firing_log.record("UserPromptSubmit", "fired",
                          "digest:criteria=" + criteria_source if ui else "mandate", session_id)
    return 0


if __name__ == "__main__":
    sys.exit(main())
