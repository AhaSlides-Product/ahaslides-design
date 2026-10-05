#!/usr/bin/env python3
"""aha-design Stop-hook anti-slop FLOOR gate.

Fires impeccable's craft-floor detector over the AhaSlides frontend files
touched this session and feeds findings into aha-design's build->judge->fix
loop. impeccable is the FLOOR (direction-agnostic anti-slop mechanics);
aha-design's design system is the DIRECTION and wins where it has a codified
rule. No impeccable transformer/direction command is ever run.

Contract (mirrors design_guard.py): read the Stop payload JSON on stdin; ALWAYS
fail-open (any parse/IO/subprocess/timeout error -> exit 0, stdout empty). The
gate can only add protection; it can never break a turn. On a Stop block this
hook prints a JSON object {"decision":"block","reason":...} to STDOUT and
returns 0 (unlike design_guard.py's PreToolUse stderr+exit-2 block).
"""
import fcntl
import glob
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys

try:
    import firing_log
except Exception:  # never let a logging-import problem break a turn
    firing_log = None

import legacy_vue

FRONTEND_EXT = re.compile(r"\.(tsx|jsx|ts|js|mjs|cjs|mts|cts|vue)$", re.IGNORECASE)
HOOK_DIR = os.path.dirname(os.path.abspath(__file__))


def _log(outcome, reason="", session_id=None):
    if firing_log is not None:
        firing_log.record("Stop", outcome, reason, session_id)

DETECTOR_GLOB = ("{home}/.claude/plugins/cache/impeccable/impeccable/"
                 "*/skills/impeccable/scripts/detect.mjs")

# One level up from hooks/ => the plugin root: agent/.impeccable/
STATE_DIR = os.path.normpath(os.path.join(HOOK_DIR, "..", ".impeccable"))
SEEN_CACHE = os.path.join(STATE_DIR, "slop-seen.json")
GAP_LEDGER = os.path.join(STATE_DIR, "gap-ledger.jsonl")

DETECTOR_TIMEOUT_S = 20
MIN_NODE_MAJOR = 22


def read_payload(raw):
    try:
        return json.loads(raw) if raw and raw.strip() else {}
    except Exception:
        return {}


def _semver_key(path):
    m = re.search(r"/impeccable/impeccable/([^/]+)/skills/", path)
    if not m:
        return (0, 0, 0, False, "")
    base, _, prerelease = m.group(1).partition("-")
    parts = base.split(".")
    nums = [int(p) if p.isdigit() else 0 for p in parts[:3]]
    while len(nums) < 3:
        nums.append(0)
    return (*nums, not prerelease, prerelease)


def resolve_detector(home):
    hits = [p for p in glob.glob(DETECTOR_GLOB.format(home=home))
            if os.path.isfile(p)]
    if not hits:
        return None
    hits.sort(key=_semver_key)
    return hits[-1]


def _node_major(node_bin):
    """Major version of a node binary, or None if it can't be run."""
    try:
        out = subprocess.run(
            [node_bin, "-e", "process.stdout.write(String(process.versions.node))"],
            capture_output=True, text=True, timeout=5,
        )
    except Exception:
        return None
    if out.returncode != 0:
        return None
    m = re.match(r"\s*(\d+)", out.stdout or "")
    return int(m.group(1)) if m else None


def find_node():
    """Resolve a Node >= MIN_NODE_MAJOR binary, or None.

    The detector needs Node >= 22. The bare ``node`` on PATH is often a stale nvm
    default (e.g. Node 20) even when a newer Homebrew/nvm Node is installed — which
    silently disabled this gate. So probe, in priority order: PATH, the common
    Homebrew locations, then every installed nvm version, and return the first that
    is >= MIN_NODE_MAJOR instead of giving up on a stale PATH ``node``.
    """
    candidates = []
    on_path = shutil.which("node")
    if on_path:
        candidates.append(on_path)
    candidates += ["/opt/homebrew/bin/node", "/usr/local/bin/node"]
    nvm_root = os.path.expanduser("~/.nvm/versions/node")
    if os.path.isdir(nvm_root):
        for name in sorted(os.listdir(nvm_root), reverse=True):
            candidates.append(os.path.join(nvm_root, name, "bin", "node"))
    seen = set()
    for cand in candidates:
        if not cand or cand in seen:
            continue
        seen.add(cand)
        if cand != on_path and not os.path.isfile(cand):
            continue
        major = _node_major(cand)
        if major is not None and major >= MIN_NODE_MAJOR:
            return cand
    return None


def _files_from_transcript(path):
    files = []
    try:
        with open(path, encoding="utf-8") as fh:
            for line in fh:
                try:
                    o = json.loads(line)
                except Exception:
                    continue
                msg = o.get("message") if isinstance(o, dict) else None
                content = msg.get("content") if isinstance(msg, dict) else None
                if not isinstance(content, list):
                    continue
                for b in content:
                    if not isinstance(b, dict) or b.get("type") != "tool_use":
                        continue
                    if b.get("name") not in ("Write", "Edit", "MultiEdit"):
                        continue
                    fp = (b.get("input") or {}).get("file_path")
                    if isinstance(fp, str):
                        files.append(fp)
    except Exception:
        return []
    return files


def _files_from_git(cwd):
    names = []
    try:
        diff = subprocess.run(["git", "-C", cwd, "diff", "--name-only", "HEAD"],
                              capture_output=True, text=True, timeout=5)
        if diff.returncode == 0:
            names += diff.stdout.splitlines()
        untr = subprocess.run(
            ["git", "-C", cwd, "ls-files", "--others", "--exclude-standard"],
            capture_output=True, text=True, timeout=5)
        if untr.returncode == 0:
            names += untr.stdout.splitlines()
        cached = subprocess.run(
            ["git", "-C", cwd, "diff", "--name-only", "--cached", "HEAD"],
            capture_output=True, text=True, timeout=5)
        if cached.returncode == 0:
            names += cached.stdout.splitlines()
        else:
            # No HEAD yet (empty repo): fall back to listing all staged files
            staged = subprocess.run(
                ["git", "-C", cwd, "ls-files", "--cached"],
                capture_output=True, text=True, timeout=5)
            if staged.returncode == 0:
                names += staged.stdout.splitlines()
    except Exception:
        return []
    return [os.path.join(cwd, n) for n in names]


def collect_touched_files(payload, cwd):
    tp = payload.get("transcript_path") if isinstance(payload, dict) else None
    if isinstance(tp, str) and tp:
        raw = _files_from_transcript(tp)   # transcript is authoritative for THIS turn
    else:
        raw = _files_from_git(cwd)          # only when there is no transcript at all
    seen, out = set(), []
    for f in raw:
        if not FRONTEND_EXT.search(f):
            continue
        ap = os.path.abspath(f)
        if ap in seen or not os.path.isfile(ap):
            continue
        seen.add(ap)
        out.append(ap)
    return out


def build_detector_cmd(node, detector, files):
    return [node, detector, "--json", *files]


def run_detector(cmd, timeout=DETECTOR_TIMEOUT_S):
    try:
        out = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
    except Exception:
        return []
    text = (out.stdout or "").strip()
    if not text:
        return []
    try:
        data = json.loads(text)
    except Exception:
        return []
    return data if isinstance(data, list) else []


def load_rules():
    try:
        with open(os.path.join(HOOK_DIR, "slop_rules.json"), encoding="utf-8") as fh:
            data = json.load(fh)
        return data if isinstance(data, list) else []
    except FileNotFoundError:
        print("slop_guard: slop_rules.json not found — rule routing disabled",
              file=sys.stderr)
        return []
    except Exception as exc:
        print("slop_guard: bad slop_rules.json ({}) — rule routing disabled".format(exc),
              file=sys.stderr)
        return []


def _finding_text(f):
    keys = ("antipattern", "rule", "id", "name", "message", "description",
            "title", "family", "snippet")
    return " ".join(str(f.get(k, "")) for k in keys).strip()


def map_findings(findings, rules):
    corrections, gaps = [], []
    for f in findings:
        if not isinstance(f, dict) or f.get("advisory") is True:
            continue
        text = _finding_text(f)
        owner = None
        for rule in rules:
            try:
                if re.search(rule.get("signature", ""), text, re.IGNORECASE):
                    owner = rule.get("surface")
                    break
            except re.error:
                continue
        entry = {
            "text": text,
            "file": f.get("file") or f.get("path") or "",
            "line": f.get("line"),
            "owner": owner or "floor",
        }
        corrections.append(entry)
        if owner is None:
            gaps.append(entry)
    return corrections, gaps


def finding_key(c):
    h = hashlib.sha1((c.get("text") or "").encode("utf-8")).hexdigest()[:16]
    return "{}::{}::{}".format(c.get("file", ""), c.get("line"), h)


def select_fresh(corrections, seen):
    """Corrections whose finding_key is not already in `seen` (the per-session
    dedup that makes the Stop-block fire at most once per unique finding)."""
    return [c for c in corrections if finding_key(c) not in seen]


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
        # create if absent, then lock for the whole read-modify-write
        with open(path, "a+", encoding="utf-8") as fh:
            fcntl.flock(fh, fcntl.LOCK_EX)
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


def log_gaps(path, gaps):
    if not gaps:
        return
    try:
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "a", encoding="utf-8") as fh:
            for g in gaps:
                fh.write(json.dumps({
                    "file": os.path.basename(g.get("file", "")),
                    "text": (g.get("text") or "")[:200],
                }) + "\n")
    except Exception:
        pass


def render_block(corrections):
    lines = ["aha-design anti-slop floor — impeccable flagged issues to fix "
             "before finishing:"]
    for c in corrections:
        loc = c.get("file", "")
        if c.get("line"):
            loc += ":{}".format(c["line"])
        lines.append("- [{}] {}: {}".format(c.get("owner", "floor"), loc,
                                             c.get("text", "")))
    lines.append("")
    lines.append(
        "Fix each by aligning to the AhaSlides design system (load the `aha-design` "
        "skill and apply the named DS surface's criteria); where the owner is "
        "[floor], apply the craft-floor mechanic. "
        "Do NOT run impeccable direction commands (bolder/delight/colorize/"
        "animate) — the DS is the only direction.")
    return json.dumps({"decision": "block", "reason": "\n".join(lines)})


def main():
    payload = read_payload(sys.stdin.read())
    if payload.get("stop_hook_active") is True:
        return 0
    session_id = str(payload.get("session_id") or "default")
    home = os.path.expanduser("~")
    detector = resolve_detector(home)
    files = collect_touched_files(payload, os.getcwd())
    judged = [f for f in files if not legacy_vue.is_legacy_edit(f)]
    if files and not judged:
        _log("noop", "vue2_existing_files", session_id)
        return 0
    files = judged
    if not detector or not files:
        # Nothing to check this turn — not a failure, just an idle run.
        _log("noop", "no_detector" if not detector else "no_frontend_files", session_id)
        return 0
    node = find_node()
    if not node:
        # LOUD, not silent: frontend files were touched this turn but the gate
        # cannot run. A silently-disabled safety gate is worse than none — it
        # reads as "protected" while catching nothing. The firing-log `degraded`
        # entry also drives the prompt-mandate nag until Node >= 22 is installed.
        sys.stderr.write(
            "slop_guard: anti-slop gate DISABLED — no Node >= {maj} found on PATH, "
            "Homebrew, or nvm. Frontend files touched this turn were NOT checked. "
            "Install Node >= {maj}, or put it ahead of nvm on PATH.\n".format(
                maj=MIN_NODE_MAJOR)
        )
        _log("degraded", "no_node_ge_{}".format(MIN_NODE_MAJOR), session_id)
        return 0
    findings = run_detector(build_detector_cmd(node, detector, files))
    if not findings:
        _log("clean", "no_findings", session_id)
        return 0
    corrections, gaps = map_findings(findings, load_rules())
    if not corrections:
        _log("clean", "no_corrections", session_id)
        return 0
    seen = load_seen(SEEN_CACHE, session_id)
    fresh = select_fresh(corrections, seen)
    if not fresh:
        _log("clean", "already_surfaced", session_id)
        return 0  # every finding already surfaced once this session -> allow stop
    fresh_keys = {finding_key(c) for c in fresh}
    seen.update(fresh_keys)
    save_seen(SEEN_CACHE, session_id, seen)
    log_gaps(GAP_LEDGER, [g for g in gaps if finding_key(g) in fresh_keys])
    print(render_block(fresh))
    _log("block", "{}_findings".format(len(fresh)), session_id)
    return 0


if __name__ == "__main__":
    sys.exit(main())
