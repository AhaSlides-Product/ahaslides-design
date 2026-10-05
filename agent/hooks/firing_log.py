#!/usr/bin/env python3
"""aha-design hook firing-log — a shared, fail-safe heartbeat.

Every aha-design hook records one line here on each run, so "does the gate
actually fire?" is answerable from a file instead of by manually invoking the
hooks. This closes the silent-no-op blind spot: a *fail-open* hook that has been
disabled by a missing interpreter or a stale environment (e.g. no Node >= 22 for
the Stop floor) looks identical to a healthy one at the point of use — the only
durable evidence that it ran, and what it decided, is this log.

Never raises: logging is best-effort and must never break a turn. Every public
function swallows all errors and degrades to a no-op / None.

Log location: agent/.impeccable/firing-log.jsonl (a rolling
heartbeat capped at MAX_LINES, not an audit archive). Read it with
`firing_status.py`.
"""
import fcntl
import json
import os
import time

HOOK_DIR = os.path.dirname(os.path.abspath(__file__))
# One level up from hooks/ => the plugin root: agent/.impeccable/
STATE_DIR = os.path.normpath(os.path.join(HOOK_DIR, "..", ".impeccable"))
FIRING_LOG = os.path.join(STATE_DIR, "firing-log.jsonl")

# Keep the log bounded — it is a rolling heartbeat, not an audit archive.
MAX_LINES = 500


def record(hook, outcome, reason="", session_id=None):
    """Append one heartbeat line. Best-effort; swallows every error.

    hook     the hook event name (UserPromptSubmit | PreToolUse | Stop)
    outcome  a short machine token: fired | clean | nudge | block | noop | degraded
    reason   optional short human detail (e.g. "no_node_ge_22", "digest")
    """
    try:
        entry = {
            "ts": round(time.time(), 3),
            "ts_iso": time.strftime("%Y-%m-%dT%H:%M:%S%z"),
            "hook": hook,
            "outcome": outcome,
        }
        if reason:
            entry["reason"] = reason
        if session_id:
            entry["session"] = str(session_id)
        os.makedirs(STATE_DIR, exist_ok=True)
        with open(FIRING_LOG, "a+", encoding="utf-8") as fh:
            fcntl.flock(fh, fcntl.LOCK_EX)
            fh.write(json.dumps(entry) + "\n")
            # Bound the file: if it has grown past MAX_LINES, keep only the tail.
            fh.seek(0)
            lines = fh.readlines()
            if len(lines) > MAX_LINES:
                fh.seek(0)
                fh.truncate()
                fh.writelines(lines[-MAX_LINES:])
    except Exception:
        pass


def last(hook=None):
    """Most recent entry (optionally filtered by hook name), or None."""
    try:
        with open(FIRING_LOG, encoding="utf-8") as fh:
            lines = fh.readlines()
    except Exception:
        return None
    for line in reversed(lines):
        line = line.strip()
        if not line:
            continue
        try:
            o = json.loads(line)
        except Exception:
            continue
        if hook is None or o.get("hook") == hook:
            return o
    return None


def read_all():
    """Every valid entry, oldest-first. Empty list on any error."""
    out = []
    try:
        with open(FIRING_LOG, encoding="utf-8") as fh:
            for line in fh:
                line = line.strip()
                if not line:
                    continue
                try:
                    out.append(json.loads(line))
                except Exception:
                    continue
    except Exception:
        return []
    return out
