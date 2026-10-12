"""Blocks a hand-made icon: an inline <svg> or a new .svg file written outside the design system.

Icons come from the DS library by name (<aha-icon name="...">), found by meaning with the DS icon
search. Where it applies:
- markup files (.tsx .jsx .vue .svelte .astro): always;
- script and page files (.ts .js .mjs .cjs .html .htm): only when the nearest package.json depends on
  @ahaslides-product/design, since such files often build SVG strings for charts, QR codes or exports;
- a new .svg file: anywhere outside the design system's own glyph, illustration and logo sources.
Never: test files (*.test.*, *.spec.*, __tests__/), a line marked `ds-lint-allow: svg (why)`
(sub-glyph chrome such as a spinner or a tick, as the DS standards gate allows), an edit that only
keeps or moves <svg> tags already in the file, react-native-svg's capitalised <Svg>, and the design
system repo outside lib/. Fail-open: any error allows the write.
"""
import json
import os
import re

DS_PACKAGE = "@ahaslides-product/design"
DS_SOURCE_FOLDERS = re.compile(r"(^|/)(icons/svg|illustrations|logo)/")
DS_ELEMENT_SOURCE = re.compile(r"(^|/)lib/")
MARKUP_EXT = re.compile(r"\.(tsx|jsx|vue|svelte|astro)$", re.IGNORECASE)
SCRIPT_EXT = re.compile(r"\.(ts|js|mjs|cjs|mts|cts|html|htm)$", re.IGNORECASE)
TEST_FILE = re.compile(r"(\.(test|spec)\.[a-z]+$)|(^|/)__tests__/", re.IGNORECASE)
INLINE_SVG = re.compile(r"<svg\b")
ALLOW_SVG = re.compile(r"ds-lint-allow:\s*[a-z, ]*\bsvg\b", re.IGNORECASE)
MAX_LEVELS = 12

SEARCH_HINT = (
    "Search the DS icon library by meaning first: `node node_modules/@ahaslides-product/design/icon-search.mjs <words>` "
    "(in the design-system repo `npm run icon-search <words>`), https://design.ahaslides.io/icons/index.html?q=<words>, "
    "or the \"Find by meaning\" list in https://design.ahaslides.io/icons.llms.txt — e.g. \"help\" finds system-question, "
    "\"delete\" finds system-trash. Then use it by name: <aha-icon name=\"...\" size=\"16\">. Logos come from the Logo library, "
    "charts from <aha-chart>, spot art from <aha-illustration>. If nothing fits, add the glyph to the design system "
    "(ahaslides-design icons/svg, with meaning words and an Icon search: line in its pull request), never to this app. "
    "Genuine sub-glyph chrome (a spinner, a tick) is allowed on a line marked ds-lint-allow: svg (why)."
)


def _package_jsons(path):
    directory = os.path.dirname(os.path.abspath(path))
    for _ in range(MAX_LEVELS):
        package_json = os.path.join(directory, "package.json")
        if os.path.isfile(package_json):
            try:
                with open(package_json, encoding="utf-8") as handle:
                    yield directory, json.load(handle)
            except Exception:
                pass
        parent = os.path.dirname(directory)
        if parent == directory:
            break
        directory = parent


def _ds_repo_root(path):
    for directory, package in _package_jsons(path):
        if package.get("name") == DS_PACKAGE:
            return directory
    return None


def _uses_design_system(path):
    for _, package in _package_jsons(path):
        for field in ("dependencies", "devDependencies", "peerDependencies"):
            if DS_PACKAGE in (package.get(field) or {}):
                return True
        return False
    return False


def _unmarked_svg_count(text):
    return sum(len(INLINE_SVG.findall(line)) for line in (text or "").splitlines() if not ALLOW_SVG.search(line))


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
    """The block message for a hand-made icon in this write, or None to allow it."""
    path = tool_input.get("file_path") or ""
    if not path:
        return None
    absolute_path = path if os.path.isabs(path) else os.path.join(cwd or os.getcwd(), path)
    ds_root = _ds_repo_root(absolute_path)
    relative = os.path.relpath(absolute_path, ds_root).replace(os.sep, "/") if ds_root else ""

    if path.lower().endswith(".svg"):
        if tool_name != "Write" or os.path.exists(absolute_path):
            return None
        if ds_root and DS_SOURCE_FOLDERS.search(relative):
            return None
        if ALLOW_SVG.search(tool_input.get("content") or ""):
            return None
        return "[icons] New .svg file " + os.path.basename(path) + " — a hand-made icon bypasses the design system. " + SEARCH_HINT

    if TEST_FILE.search(path.replace(os.sep, "/")):
        return None
    if ds_root:
        if not DS_ELEMENT_SOURCE.search(relative) or not (MARKUP_EXT.search(path) or SCRIPT_EXT.search(path)):
            return None
    elif not MARKUP_EXT.search(path):
        if not SCRIPT_EXT.search(path) or not _uses_design_system(absolute_path):
            return None
    before, after = _before_and_after(tool_name, tool_input, absolute_path)
    added = _unmarked_svg_count(after) - _unmarked_svg_count(before)
    if added <= 0:
        return None
    return "[icons] Inline <svg> in " + os.path.basename(path) + " — a hand-drawn glyph bypasses the design system's icon library. " + SEARCH_HINT
