#!/usr/bin/env bash
# aha-design Stop hook: at end of turn, detects uncommitted frontend UI changes
# and asks for the DS judge on them, per matching DS surface. Delegates to
# design_judge_stop.py. Fail-open (exit 0) if no python is available so a missing
# interpreter never breaks the turn.
for py in python3 python; do
  if command -v "$py" >/dev/null 2>&1; then
    exec "$py" "${CLAUDE_PLUGIN_ROOT}/hooks/design_judge_stop.py"
  fi
done
exit 0
