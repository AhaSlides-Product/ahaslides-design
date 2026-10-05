#!/usr/bin/env bash
# aha-design UserPromptSubmit hook: injects the design-system mandate on every
# prompt (short mandate always; the DS anti-slop surfaces when this hook detects a UI
# signal). Delegates to prompt_mandate.py. Fail-open (exit 0) if no python is
# available so a prompt is never broken by a missing interpreter.
for py in python3 python; do
  if command -v "$py" >/dev/null 2>&1; then
    exec "$py" "${CLAUDE_PLUGIN_ROOT}/hooks/prompt_mandate.py"
  fi
done
exit 0
