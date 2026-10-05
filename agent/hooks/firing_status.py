#!/usr/bin/env python3
"""aha-design firing-status reader.

Prints a human summary of hooks/../.impeccable/firing-log.jsonl so you can answer
"are the aha-design hooks firing?" from one command instead of manually invoking
each hook:

    python3 agent/hooks/firing_status.py

Shows, per hook: total runs, the outcome breakdown, and the last-seen time. Then
a top-line verdict, and a LOUD warning if the Stop floor's most recent run was
`degraded` (no Node >= 22 — the anti-slop gate is silently catching nothing).

Exit code: 0 normally, 1 if the Stop floor is currently degraded (so CI or a
wrapper can gate on it). Empty/absent log => exit 0 with a "no runs yet" note.
"""
import collections
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import firing_log  # noqa: E402


def main():
    entries = firing_log.read_all()
    if not entries:
        print("aha-design firing-status: no runs logged yet at\n  {}".format(
            firing_log.FIRING_LOG))
        print("(Run any prompt / edit a frontend file / finish a turn to populate it.)")
        return 0

    by_hook = collections.defaultdict(list)
    for e in entries:
        by_hook[e.get("hook", "?")].append(e)

    print("aha-design firing-status  —  {} runs logged".format(len(entries)))
    print("  log: {}".format(firing_log.FIRING_LOG))
    print()
    for hook in ("UserPromptSubmit", "PreToolUse", "Stop"):
        runs = by_hook.get(hook)
        if not runs:
            print("  {:<16} — never fired".format(hook))
            continue
        outcomes = collections.Counter(r.get("outcome", "?") for r in runs)
        breakdown = ", ".join("{}×{}".format(v, k) for k, v in outcomes.most_common())
        last = runs[-1]
        print("  {:<16} {:>4} runs  [{}]".format(hook, len(runs), breakdown))
        print("  {:<16}      last: {} ({})".format(
            "", last.get("ts_iso", "?"), last.get("outcome", "?")))

    degraded = firing_log.last("Stop")
    degraded = degraded and degraded.get("outcome") == "degraded"
    print()
    if degraded:
        last = firing_log.last("Stop")
        print("  ⚠  STOP FLOOR DEGRADED — last Stop run could not execute the "
              "anti-slop detector")
        print("     reason: {}".format(last.get("reason", "unknown")))
        print("     the floor is silently catching nothing; install Node >= 22.")
        return 1
    print("  ✓  all logged hooks are firing")
    return 0


if __name__ == "__main__":
    sys.exit(main())
