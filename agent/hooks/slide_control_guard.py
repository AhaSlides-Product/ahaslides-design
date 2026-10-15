"""Blocks a hand-made control added to a build-less slide type's presenter, audience or settings file.

On a slide type's presenter canvas and audience phone every control is a design-system element, so
this stops, at write time, the two things the DS screen-lint hard-fails that have a one-for-one
replacement: a raw <button> / role="button" (rule raw-button) and <aha-button size="xl">
(rule button-size-xl). In its settings panel it stops a large settings field (rule field-size-large)
and maxlength on <aha-input> (rule input-maxlength). The lint stays the authority and also covers
::part sizing, key chips and the other settings rules.

Where it applies: presenter.*, audience.* and settings.* (.html, .js) that slide_type.py recognises as
a slide type's files. Never: a comment line, a line marked `ds-lint-allow: <rule> (why)`, and an edit
that only keeps or moves what is already in the file. Fail-open: any error allows the write.
"""
import os
import re

import slide_type

ELEMENT_FACTORY = r"(?<![\w$])(?:el|elem|element|h|tag|node|dom|createEl|createElement|createElementNS)"
FIRST_ARGUMENT = r"\(\s*(?:[\w$.]+\s*,\s*|[\"'][^\"']*[\"']\s*,\s*)?"
RAW_BUTTON = re.compile(
    r"<button(?=[\s>/])"
    r"|" + ELEMENT_FACTORY + FIRST_ARGUMENT + r"[\"']button[\"']\s*[,)]"
    r"|(?<![\[\w-])role\s*=\s*\\?[\"']?button\b"
    r"|(?<![\w$-])[\"']?role[\"']?\s*:\s*[\"']button[\"']"
    r"|[\"']role[\"']\s*,\s*[\"']button[\"']",
    re.IGNORECASE)
SIZE_XL = re.compile(
    r"<aha-button(?![\w-])(?:\"[^\"]*\"|'[^']*'|=>|[^>\"'])*?(?<![\w-])size\s*=\s*\\?[\"']?xl\b"
    r"|[\"']aha-button[\"'].*(?<![\w$-])[\"']?size[\"']?\s*:\s*[\"']xl[\"']"
    r"|setAttribute\(\s*[\"']size[\"']\s*,\s*[\"']xl[\"']",
    re.IGNORECASE)
SETTINGS_FIELD = r"aha-(?:input|counted-input|counted-textarea|number-with-unit|select)"
FIELD_REFERENCE = r"[\"'](?:aha-)?(?:input|counted-input|counted-textarea|number-with-unit|select)[\"']"
FIELD_SIZE_LARGE = re.compile(
    r"<" + SETTINGS_FIELD + r"(?![\w-])(?:\"[^\"]*\"|'[^']*'|=>|[^>\"'])*?(?<![\w-])size\s*=\s*\\?[\"']?(?:large|lg)\b"
    r"|" + FIELD_REFERENCE + r".*(?<![\w$-])[\"']?size[\"']?\s*:\s*[\"'](?:large|lg)[\"']",
    re.IGNORECASE)
INPUT_MAXLENGTH = re.compile(
    r"<aha-input(?![\w-])(?:\"[^\"]*\"|'[^']*'|=>|[^>\"'])*?(?<![\w-])maxlength\s*="
    r"|[\"'](?:aha-)?input[\"'].*(?<![\w$-])[\"']?maxlength[\"']?\s*:",
    re.IGNORECASE)
COMMENT_LINE = re.compile(r"^\s*(?://|/\*|\*(?:\s|/|$)|<!--)")
ALLOW_BUTTON = re.compile(r"ds-lint-allow:\s*[a-z, -]*\bbutton\b", re.IGNORECASE)
ALLOW_FIELD = re.compile(r"ds-lint-allow:\s*[a-z, -]*\b(?:field|field-size-large|input-maxlength)\b", re.IGNORECASE)

REPLACEMENT = {
    "canvas": "in-canvas presenter controls are <aha-button size=\"lg\"> from lib/canvas.js, themed by "
              "applyCanvasDeck, with the key in the shortcut attribute (canvas C3, C10, C17)",
    "audience": "audience actions are <aha-audience-submit> or <aha-button size=\"touch\"> (primary / "
                "secondary-deck / tertiary-deck), answers <aha-answer-list>, toggles <aha-audience-chip>, "
                "all from lib/audience.js (audience C9, C15)",
}


def _count(pattern, text, honour_marker, marker=ALLOW_BUTTON):
    total = 0
    for line in (text or "").splitlines():
        if COMMENT_LINE.search(line) or (honour_marker and marker.search(line)):
            continue
        total += len(pattern.findall(line))
    return total


def _settings_problems(before, after, name):
    problems = []
    if _count(FIELD_SIZE_LARGE, after, True, ALLOW_FIELD) > _count(FIELD_SIZE_LARGE, before, True, ALLOW_FIELD):
        problems.append("a large settings field in " + name + ": every settings field (input, counted input or "
                        "textarea, number with unit, select) is the default 40px size; drop size=\"large\" / \"lg\" "
                        "(settings C19).")
    if _count(INPUT_MAXLENGTH, after, True, ALLOW_FIELD) > _count(INPUT_MAXLENGTH, before, True, ALLOW_FIELD):
        problems.append("maxlength on <aha-input> in " + name + ": use <aha-counted-input maxlength=\"…\">, whose "
                        "counter sits inside the field and shows only on focus (settings C19).")
    if not problems:
        return None
    return "settings", "Settings field off the DS default — " + " Also ".join(problems) \
        + " The DS screen-lint (--surface=settings) hard-fails both at hand-off."


def _read(path):
    try:
        with open(path, encoding="utf-8") as handle:
            return handle.read()
    except Exception:
        return ""


def _before_and_after(tool_name, tool_input, absolute_path):
    if tool_name == "Write":
        return _read(absolute_path), tool_input.get("content") or ""
    if tool_name == "MultiEdit":
        edits = [edit for edit in tool_input.get("edits") or [] if isinstance(edit, dict)]
        return ("\n".join(edit.get("old_string") or "" for edit in edits),
                "\n".join(edit.get("new_string") or "" for edit in edits))
    return tool_input.get("old_string") or "", tool_input.get("new_string") or ""


def check(tool_name, tool_input, cwd):
    """The (surface, message) to block this write with, or None to allow it."""
    path = tool_input.get("file_path") or ""
    if not path:
        return None
    absolute_path = path if os.path.isabs(path) else os.path.join(cwd or os.getcwd(), path)
    surface = slide_type.surface_for(absolute_path)
    if surface is None:
        return None
    before, after = _before_and_after(tool_name, tool_input, absolute_path)
    if not slide_type.is_slide_type_file(absolute_path, after):
        return None
    name = os.path.basename(path)
    if not slide_type.is_control_surface(absolute_path):
        return _settings_problems(before, after, name)
    problems = []
    if _count(RAW_BUTTON, after, True) > _count(RAW_BUTTON, before, True):
        problems.append("a raw <button> or role=\"button\" in " + name + ": " + REPLACEMENT[surface] + ". A control the "
                        "DS does not ship (a draggable tile, a seek-bar grip) keeps its tag on a line marked "
                        "ds-lint-allow: raw-button (why).")
    if _count(SIZE_XL, after, False) > _count(SIZE_XL, before, False):
        problems.append("<aha-button size=\"xl\"> in " + name + ": the 52px size is not used on a slide surface; "
                        + ("presenter controls are size=\"lg\" (40px)." if surface == "canvas"
                           else "a phone action is size=\"touch\" (48px)."))
    if not problems:
        return None
    return surface, "Hand-made control on a slide type's " + ("presenter canvas" if surface == "canvas" else "audience phone") \
        + " — " + " Also ".join(problems) + " The DS screen-lint (--surface=" + surface + ") hard-fails both at hand-off."
