#!/usr/bin/env python3
"""The settings-design skill is mandatory for settings UI: detection shared by the aha-design hooks.

- prompt_signal(prompt): the prompt talks about settings UI, so the prompt hook adds the
  "load settings-design first" line.
- loaded_in_session(transcript_path): the session (or one of its sub-agents) invoked the skill, by
  the Skill tool, a /settings-design slash command, or by reading its SKILL.md.

Never raises. A transcript that cannot be read counts as "loaded", so a write is never blocked on an
IO problem.
"""
import glob
import json
import os
import re

SKILL = "ahaslides-design:settings-design"
DISABLE_ENV = "AHA_DESIGN_SETTINGS_SKILL_DISABLE"
SKILL_FILE = "settings-design/SKILL.md"

PROMPT_SIGNAL = re.compile(
    r"\b(settings?|preferences|toggles?|switch(es)?"
    r"|options?\s+(dialog|modal|panel|page|drawer|menu)"
    r"|right[-\s]?panel|config(uration)?\s+panel|slide[-\s]?type\s+config(uration)?)\b",
    re.IGNORECASE,
)

SLASH_COMMAND = re.compile(r"<command-name>/?(?:[\w-]+:)?settings-design</command-name>")


def disabled():
    return os.environ.get(DISABLE_ENV) == "1"


def prompt_signal(prompt):
    try:
        return bool(PROMPT_SIGNAL.search(prompt or ""))
    except Exception:
        return False


def _tool_use_loads_skill(item):
    if not isinstance(item, dict) or item.get("type") != "tool_use":
        return False
    tool_input = item.get("input")
    if not isinstance(tool_input, dict):
        return False
    if item.get("name") == "Skill":
        return str(tool_input.get("skill") or "").endswith("settings-design")
    return any(isinstance(value, str) and SKILL_FILE in value for value in tool_input.values())


def _entry_loads_skill(entry):
    message = entry.get("message") if isinstance(entry, dict) else None
    if not isinstance(message, dict):
        return False
    content = message.get("content")
    if isinstance(content, str):
        return bool(SLASH_COMMAND.search(content))
    if not isinstance(content, list):
        return False
    for item in content:
        if _tool_use_loads_skill(item):
            return True
        if isinstance(item, dict) and item.get("type") == "text" and SLASH_COMMAND.search(str(item.get("text") or "")):
            return True
    return False


def _file_loads_skill(path):
    with open(path, encoding="utf-8", errors="ignore") as fh:
        for line in fh:
            if "settings-design" not in line:
                continue
            try:
                if _entry_loads_skill(json.loads(line)):
                    return True
            except ValueError:
                continue
    return False


def _session_transcripts(transcript_path):
    folder = os.path.dirname(transcript_path)
    if os.path.basename(folder) == "subagents":
        session_folder = os.path.dirname(folder)
        main_transcript = session_folder + ".jsonl"
    else:
        session_folder = os.path.splitext(transcript_path)[0]
        main_transcript = transcript_path
    sub_agents = sorted(glob.glob(os.path.join(session_folder, "subagents", "*.jsonl")))
    paths = [transcript_path, main_transcript] + sub_agents
    return [path for path in dict.fromkeys(paths) if os.path.isfile(path)]


def loaded_in_session(transcript_path):
    """True when the skill was loaded this session, or when that cannot be told (fail-open)."""
    if not transcript_path or not os.path.isfile(transcript_path):
        return True
    try:
        return any(_file_loads_skill(path) for path in _session_transcripts(transcript_path))
    except Exception:
        return True


def block_message(target):
    return (
        "Settings UI write blocked: " + target + " is a settings surface, and the `" + SKILL + "` skill "
        "has not been loaded in this session. Settings design is mandatory through that skill, no "
        "exception: load `" + SKILL + "` now, follow its steps (hub control table, label rule and the "
        "label self-check table), then retry this write. Set " + DISABLE_ENV + "=1 to turn off only "
        "this block."
    )
