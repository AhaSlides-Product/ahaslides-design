#!/usr/bin/env bash
# aha-design PreToolUse dispatcher: names the DS surface a write touches, with
# that surface's criteria (block a raw table or a forbidden icon set, nudge the
# rest). Delegates to design_guard.py. Fail-open (exit 0) if no python is
# available so the turn is never broken by a missing interpreter.
for py in python3 python; do
  if command -v "$py" >/dev/null 2>&1; then
    exec "$py" "${CLAUDE_PLUGIN_ROOT}/hooks/design_guard.py"
  fi
done
exit 0
