#!/usr/bin/env python3
"""aha-design PreToolUse dispatcher — routes a design surface written at a call site to the DS.

Skills are pull-based and get skipped on tasks the model feels fluent in — so a
raw <Table>, a hand-styled Modal, or a lucide icon lands with the design system
never consulted. This hook fires deterministically on the Write/Edit itself and
names the DS anti-slop surface the code touches, with that surface's criteria
read from the DS (the installed package, else the copy this plugin ships from
the same release; never the network, so a write is never slowed down).

Firing modes (per rule in rules.json):
- "block"  -> exit 2, message on stderr. Only where a canonical DS component
              exists (table -> DataTable) or the import is forbidden (icon sets).
- "nudge"  -> exit 0 with hookSpecificOutput.additionalContext; the write proceeds.

Contract:
- reads the hook payload as JSON on stdin (tool_name, tool_input)
- exit 0 -> allow; exit 2 -> block (stderr shown to the model)
- fail-open: any parse/IO/regex error exits 0.

rules.json schema (list of objects):
  surface      required  the DS anti-slop surface key (anti-slop/criteria.json surfaces.<key>)
  action       required  "block" | "nudge"
  signature    required  regex; if it matches the introduced text, the rule fires
  exempt       optional  regex on the introduced text; match -> rule skipped
  exempt_file  optional  regex on the basename; match -> rule skipped
  message      required  guidance surfaced to the model
"""
import json
import os
import re
import sys

try:
    import firing_log
except Exception:  # never let a logging-import problem break a write
    firing_log = None

import ds_criteria
import legacy_vue

CRITERIA_SHOWN_PER_SURFACE = 8

# Frontend-authorable extensions. Includes the ESM/CJS/TS-module variants
# (.mjs/.cjs/.mts/.cts) so a component authored in one of those is still guarded
# rather than silently escaping the dispatcher.
FRONTEND_EXT = re.compile(r"\.(tsx|jsx|ts|js|mjs|cjs|mts|cts|vue)$", re.IGNORECASE)


def _log(outcome, reason=""):
    if firing_log is not None:
        firing_log.record("PreToolUse", outcome, reason)


def _load_rules():
    path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "rules.json")
    with open(path, encoding="utf-8") as fh:
        return json.load(fh)


def _introduced_text(tool_input):
    """Concatenate every string this call would write into the file."""
    parts = []
    for key in ("content", "new_string", "new_str"):
        val = tool_input.get(key)
        if isinstance(val, str):
            parts.append(val)
    for edit in tool_input.get("edits", []) or []:
        if isinstance(edit, dict) and isinstance(edit.get("new_string"), str):
            parts.append(edit["new_string"])
    return "\n".join(parts)


def main():
    try:
        raw = sys.stdin.read()
        data = json.loads(raw) if raw.strip() else {}
    except Exception:
        data = None
    if not isinstance(data, dict):
        _log("noop", "bad_payload")
        return 0

    if data.get("tool_name") not in ("Write", "Edit", "MultiEdit"):
        return 0

    tool_input = data.get("tool_input")
    if not isinstance(tool_input, dict):
        _log("noop", "bad_payload")
        return 0
    path = tool_input.get("file_path") or ""
    if not FRONTEND_EXT.search(path):
        return 0

    text = _introduced_text(tool_input)
    if not text:
        return 0

    absolute_path = path if os.path.isabs(path) else os.path.join(data.get("cwd") or os.getcwd(), path)
    try:
        in_vue2 = legacy_vue.is_vue2(absolute_path)
        legacy_edit = in_vue2 and legacy_vue.is_existing_file(absolute_path)
    except Exception:
        in_vue2 = legacy_edit = False
    if legacy_edit:
        _log("noop", "vue2_existing_file")
        return 0

    base = os.path.basename(path).lower()

    try:
        rules = _load_rules()
    except Exception:
        _log("noop", "no_rules")
        return 0  # fail-open on a missing/broken registry

    blocks, nudges = [], []
    if in_vue2 and legacy_vue.STORYBOOK_KIT in text:
        blocks.append(("aha-design", "New UI in a Vue 2 app must use the design system's <aha-*> web components "
                       "(lib/all.js), not components from " + legacy_vue.STORYBOOK_KIT + ". Read the Vue 2 "
                       "section of the aha-design skill."))
    for rule in rules:
        try:
            sig = rule.get("signature")
            if not sig or not re.search(sig, text):
                continue
            exempt = rule.get("exempt")
            if exempt and re.search(exempt, text):
                continue
            exempt_file = rule.get("exempt_file")
            if exempt_file and re.search(exempt_file, base):
                continue
        except re.error:
            continue  # a malformed rule never breaks the turn

        entry = (rule.get("surface", "aha-design"), rule.get("message", ""))
        (blocks if rule.get("action") == "block" else nudges).append(entry)

    if not blocks and not nudges:
        _log("clean")
        return 0

    criteria = ds_criteria.load(data.get("cwd") or os.getcwd())
    fired_surfaces = [surface for surface, _ in blocks + nudges]

    if blocks:
        msg = "\n\n".join(f"[{surface}] {m}" for surface, m in blocks)
        if nudges:
            msg += "\n\nAlso relevant here: " + ", ".join(s for s, _ in nudges)
        msg += _criteria_footer(criteria, fired_surfaces)
        print("aha-design guard\n\n" + msg, file=sys.stderr)
        _log("block", ",".join(s for s, _ in blocks) + _source_tag(criteria))
        return 2

    if nudges:
        ctx = "aha-design — check these DS surfaces before finalising:\n" + "\n".join(
            f"[{surface}] {m}" for surface, m in nudges
        ) + _criteria_footer(criteria, fired_surfaces)
        out = {
            "hookSpecificOutput": {
                "hookEventName": "PreToolUse",
                "additionalContext": ctx,
            }
        }
        print(json.dumps(out))
        _log("nudge", ",".join(s for s, _ in nudges) + _source_tag(criteria))
        return 0
    return 0


def _source_tag(criteria):
    return ";criteria=" + (criteria["source"] if criteria else "none")


def _criteria_footer(criteria, surfaces):
    lines = ["", "", "Load the `aha-design` skill and judge the result against the DS criteria"]
    if not criteria:
        lines[-1] += " (not readable here — fetch " + ds_criteria.ANTI_SLOP_MD_URL + ")."
        return "\n".join(lines)
    lines[-1] += " (source: {}):".format(criteria["source"])
    for surface in dict.fromkeys(surfaces):
        titles = ds_criteria.criteria_lines(criteria, surface, CRITERIA_SHOWN_PER_SURFACE)
        if titles:
            lines.append("{}: {}".format(surface, "; ".join(titles)))
    return "\n".join(lines)


if __name__ == "__main__":
    sys.exit(main())
