#!/usr/bin/env bash
# aha-design Stop hook: fires impeccable's craft-floor detector over the
# frontend files touched this session and feeds findings into the
# build->judge->fix loop. Delegates to slop_guard.py. Fail-open (exit 0) if no
# python is available so the turn is never broken by a missing interpreter.
for py in python3 python; do
  if command -v "$py" >/dev/null 2>&1; then
    exec "$py" "${CLAUDE_PLUGIN_ROOT}/hooks/slop_guard.py"
  fi
done
exit 0
