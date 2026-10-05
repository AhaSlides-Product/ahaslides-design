#!/usr/bin/env python3
"""aha-design Stop-hook JUDGE TRIGGER.

At end of turn, detects the UNCOMMITTED frontend UI files changed this session
(base = HEAD) and, when there are any, blocks the stop with an instruction to
run the `aha-design` skill's judge step on those files against the DS anti-slop
criteria for the matching surface(s), and apply the fixes. The criteria come
from the DS itself (installed package, else the plugin's own copy — see ds_criteria.py).
It never computes a PASS/FAIL — the judging is the model's; this hook only
forces it to happen.

Contract (mirrors slop_guard.py): read the Stop payload JSON on stdin; ALWAYS
fail-open (any parse/IO/subprocess error, a non-git dir, or a non-frontend repo
-> exit 0 with empty stdout). A trigger can only add protection; it must never
break a turn. On a trigger it prints {"decision":"block","reason":...} to STDOUT
and returns 0. The loop guard (stop_hook_active) plus a per-session seen-cache
keep it low-noise: it fires at most once per distinct set of changed UI files.
"""
import hashlib
import json
import os
import re
import subprocess
import sys

try:
    import firing_log
except Exception:  # a logging-import problem must never break a turn
    firing_log = None

import ds_criteria
import legacy_vue

HOOK_DIR = os.path.dirname(os.path.abspath(__file__))
STATE_DIR = os.path.normpath(os.path.join(HOOK_DIR, "..", ".impeccable"))


def _seen_cache_path():
    # An override keeps the seen-cache out of the shared plugin dir under test.
    return os.environ.get("AHA_DESIGN_JUDGE_SEEN") or os.path.join(STATE_DIR, "judge-seen.json")

UI_EXT = re.compile(r"\.(tsx|jsx|ts|js|vue|css|scss|less)$", re.IGNORECASE)
# A real UI source file lives under a src/ or frontend/ segment.
SRC_SEGMENT = re.compile(r"(^|/)(src|frontend)/")
EXCLUDE = re.compile(
    r"(\.test\.|\.spec\.|\.stories\.|\.d\.ts$|\.config\.|(^|/)__tests__/)",
    re.IGNORECASE,
)
FRONTEND_DEP = re.compile(r"^(antd|@ant-design/|@ahaslides-product/design)")


def _log(outcome, reason="", session_id=None):
    if firing_log is not None:
        firing_log.record("Stop", outcome, reason, session_id)


def read_payload(raw):
    try:
        payload = json.loads(raw) if raw and raw.strip() else {}
    except Exception:
        return {}
    return payload if isinstance(payload, dict) else {}


def is_frontend_repo(cwd):
    """A repo is judged a frontend when package.json declares an AhaSlides UI
    dependency, or a frontend theme directory exists."""
    try:
        with open(os.path.join(cwd, "package.json"), encoding="utf-8") as fh:
            pkg = json.load(fh)
        deps = {}
        for key in ("dependencies", "devDependencies", "peerDependencies"):
            section = pkg.get(key)
            if isinstance(section, dict):
                deps.update(section)
        if any(FRONTEND_DEP.match(name) for name in deps):
            return True
    except Exception:
        pass
    for theme in ("src/theme", "frontend/theme", "src/styles/theme"):
        if os.path.isdir(os.path.join(cwd, theme)):
            return True
    return False


def changed_ui_files(cwd):
    """Uncommitted UI files (base = HEAD): tracked changes plus untracked,
    filtered to real frontend source and returned as repo-relative paths."""
    names = []
    try:
        diff = subprocess.run(
            ["git", "-C", cwd, "diff", "--name-only", "HEAD"],
            capture_output=True, text=True, timeout=5)
        if diff.returncode == 0:
            names += diff.stdout.splitlines()
        untracked = subprocess.run(
            ["git", "-C", cwd, "ls-files", "--others", "--exclude-standard"],
            capture_output=True, text=True, timeout=5)
        if untracked.returncode == 0:
            names += untracked.stdout.splitlines()
    except Exception:
        return []
    out, seen = [], set()
    for name in names:
        if name in seen or not is_ui_file(name):
            continue
        seen.add(name)
        out.append(name)
    return sorted(out)


def is_ui_file(path):
    return bool(
        UI_EXT.search(path)
        and SRC_SEGMENT.search(path)
        and not EXCLUDE.search(path)
    )


BASELINE_SURFACES = ("background", "component-standard")

FILE_SURFACE_HINTS = (
    (re.compile(r"table|grid"), "table"),
    (re.compile(r"icon"), "icons"),
    (re.compile(r"typograph|text|heading"), "typography"),
    (re.compile(r"modal|drawer|popover|dialog|overlay"), "overlays"),
    (re.compile(r"toast|notif|alert|csat|feedback"), "feedback"),
    (re.compile(r"status|badge|pill"), "status-badges"),
    (re.compile(r"setting|config|option"), "settings"),
    (re.compile(r"paywall|upsell|upgrade|plan"), "paywall"),
    (re.compile(r"shell|navbar|sidebar|layout|topbar"), "app-shell"),
    (re.compile(r"empty|skeleton|error|field"), "shared-components"),
)


def map_file(path):
    """The DS anti-slop surface(s) a single changed file should be judged against."""
    low = path.lower()
    base = os.path.basename(low)
    if "audience" in low:
        return {"audience"}
    if "canvas" in low or "slide-type" in low or "slidetype" in low:
        return {"canvas"}
    surfaces = set(BASELINE_SURFACES)
    for pattern, surface in FILE_SURFACE_HINTS:
        if pattern.search(base):
            surfaces.add(surface)
    return surfaces


def surfaces_for(files, criteria=None):
    surfaces = set()
    for f in files:
        surfaces.update(map_file(f))
    if criteria:
        known = [s for s in surfaces if s in criteria["surfaces"]]
        surfaces = set(known) or surfaces
    return sorted(surfaces)


def seen_key(files):
    joined = "\n".join(sorted(files))
    return hashlib.sha1(joined.encode("utf-8")).hexdigest()[:16]


def load_seen(path, session_id):
    try:
        with open(path, encoding="utf-8") as fh:
            data = json.load(fh)
        return set(data.get("sessions", {}).get(session_id, []))
    except Exception:
        return set()


def save_seen(path, session_id, keys):
    try:
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "a+", encoding="utf-8") as fh:
            try:
                import fcntl
                fcntl.flock(fh, fcntl.LOCK_EX)
            except Exception:
                pass
            fh.seek(0)
            raw = fh.read().strip()
            try:
                data = json.loads(raw) if raw else {"version": 1, "sessions": {}}
            except Exception:
                data = {"version": 1, "sessions": {}}
            data.setdefault("sessions", {})[session_id] = sorted(keys)
            fh.seek(0)
            fh.truncate()
            json.dump(data, fh)
    except Exception:
        pass


def render_block(files, surfaces, criteria):
    lines = [
        "aha-design judge trigger — you changed frontend UI files this turn but "
        "did not judge them against the AhaSlides design system. Before finishing, "
        "run the `aha-design` skill's judge step on the changed files: score every "
        "criterion of each surface below PASS / FAIL (N/A only when it cannot apply), "
        "fix every FAIL, re-judge, then confirm.",
        "",
        "Changed UI files:",
    ]
    lines += ["- {}".format(f) for f in files]
    lines.append("")
    if criteria:
        lines.append("DS anti-slop criteria (source: {}):".format(criteria["source"]))
        for surface in surfaces:
            titles = ds_criteria.criteria_lines(criteria, surface)
            lines.append("- {}: {}".format(surface, "; ".join(titles) if titles else "(no criteria)"))
    else:
        lines.append("Surfaces: {}. The DS criteria could not be read here — fetch {} "
                     "and judge against it; do not judge from memory.".format(
                         ", ".join(surfaces), ds_criteria.ANTI_SLOP_MD_URL))
    lines += [
        "",
        "Add further surfaces where the change touches them (a settings panel -> settings, "
        "an overlay -> overlays, UI copy -> ux-writing). "
        "Set AHA_DESIGN_JUDGE_DISABLE=1 to skip this trigger.",
    ]
    return json.dumps({"decision": "block", "reason": "\n".join(lines)})


def main():
    payload = read_payload(sys.stdin.read())
    if payload.get("stop_hook_active") is True:
        return 0
    session_id = str(payload.get("session_id") or "default")
    if os.environ.get("AHA_DESIGN_JUDGE_DISABLE") == "1":
        _log("noop", "disabled", session_id)
        return 0
    cwd = payload.get("cwd") or os.getcwd()
    if not is_frontend_repo(cwd):
        _log("noop", "not_frontend", session_id)
        return 0
    files = changed_ui_files(cwd)
    if not files:
        _log("noop", "no_ui_changes", session_id)
        return 0
    judged = [f for f in files if not legacy_vue.is_legacy_edit(os.path.join(cwd, f))]
    if not judged:
        _log("noop", "vue2_existing_files", session_id)
        return 0
    files = judged
    key = seen_key(files)
    seen_path = _seen_cache_path()
    seen = load_seen(seen_path, session_id)
    if key in seen:
        _log("clean", "already_surfaced", session_id)
        return 0
    seen.add(key)
    save_seen(seen_path, session_id, seen)
    criteria = ds_criteria.load(cwd)
    surfaces = surfaces_for(files, criteria)
    print(render_block(files, surfaces, criteria))
    source = criteria["source"] if criteria else "none"
    _log("block", "{}_files;criteria={}".format(len(files), source), session_id)
    return 0


if __name__ == "__main__":
    sys.exit(main())
