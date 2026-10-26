#!/usr/bin/env python3
"""Stdlib unittest suite for settings_skill.py and the settings-skill block in design_guard.py."""
import io
import json
import os
import sys
import tempfile
import unittest
from contextlib import redirect_stderr, redirect_stdout
from unittest import mock

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import design_guard  # noqa: E402
import settings_skill  # noqa: E402

DS_PAGE = '<script type="module" src="https://cdn.jsdelivr.net/gh/ahaslides-product/ahaslides-design@latest/lib/settings.js"></script>'
SETTINGS_MODAL = '<Modal title="Course settings" open>...</Modal>'


def tool_use(name, tool_input):
    return {"type": "assistant", "message": {"role": "assistant", "content": [
        {"type": "tool_use", "id": "toolu_1", "name": name, "input": tool_input}]}}


def user_text(text):
    return {"type": "user", "message": {"role": "user", "content": text}}


def write_transcript(path, entries):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as handle:
        for entry in entries:
            handle.write(json.dumps(entry) + "\n")
    return path


class PromptSignal(unittest.TestCase):
    def test_settings_phrasing_is_detected(self):
        for prompt in ("add a toggle for the leaderboard", "name this setting", "the course settings panel",
                       "redesign the preferences page", "options dialog for export", "right panel options",
                       "slide type config for the quiz", "label a setting"):
            self.assertTrue(settings_skill.prompt_signal(prompt), prompt)

    def test_unrelated_prompts_are_not(self):
        for prompt in ("summarise last week's tickets", "fix the login redirect", "build the pricing page"):
            self.assertFalse(settings_skill.prompt_signal(prompt), prompt)


class LoadedInSession(unittest.TestCase):
    def setUp(self):
        self.root = tempfile.mkdtemp()
        self.transcript = os.path.join(self.root, "session.jsonl")

    def test_skill_tool_call_counts(self):
        write_transcript(self.transcript, [tool_use("Skill", {"skill": "ahaslides-design:settings-design"})])
        self.assertTrue(settings_skill.loaded_in_session(self.transcript))

    def test_reading_the_skill_file_counts(self):
        write_transcript(self.transcript, [tool_use("Read", {"file_path": "/x/agent/skills/settings-design/SKILL.md"})])
        self.assertTrue(settings_skill.loaded_in_session(self.transcript))

    def test_slash_command_counts(self):
        write_transcript(self.transcript, [user_text("<command-name>/ahaslides-design:settings-design</command-name>")])
        self.assertTrue(settings_skill.loaded_in_session(self.transcript))

    def test_a_mention_in_a_prompt_or_another_skill_does_not_count(self):
        write_transcript(self.transcript, [
            user_text("please use agent/skills/settings-design/SKILL.md and ahaslides-design:settings-design"),
            tool_use("Skill", {"skill": "ahaslides-design:aha-design"}),
        ])
        self.assertFalse(settings_skill.loaded_in_session(self.transcript))

    def test_a_sub_agent_that_loaded_it_counts_for_the_session(self):
        write_transcript(self.transcript, [user_text("go")])
        write_transcript(os.path.join(self.root, "session", "subagents", "agent-1.jsonl"),
                         [tool_use("Skill", {"skill": "ahaslides-design:settings-design"})])
        self.assertTrue(settings_skill.loaded_in_session(self.transcript))

    def test_a_sub_agent_sees_the_main_session_load(self):
        write_transcript(self.transcript, [tool_use("Skill", {"skill": "ahaslides-design:settings-design"})])
        sub_agent = write_transcript(os.path.join(self.root, "session", "subagents", "agent-1.jsonl"), [user_text("go")])
        self.assertTrue(settings_skill.loaded_in_session(sub_agent))

    def test_a_missing_transcript_fails_open(self):
        self.assertTrue(settings_skill.loaded_in_session(""))
        self.assertTrue(settings_skill.loaded_in_session(os.path.join(self.root, "nope.jsonl")))


class GuardBlocksSettingsWithoutTheSkill(unittest.TestCase):
    def setUp(self):
        self.root = tempfile.mkdtemp()
        self.transcript = write_transcript(os.path.join(self.root, "t", "session.jsonl"), [user_text("add a toggle")])

    def run_guard(self, path, content, env=None):
        payload = json.dumps({"tool_name": "Write", "cwd": self.root, "transcript_path": self.transcript,
                              "tool_input": {"file_path": path, "content": content}})
        out, err = io.StringIO(), io.StringIO()
        environment = {k: v for k, v in os.environ.items() if k != settings_skill.DISABLE_ENV}
        environment.update(env or {})
        with mock.patch.object(sys, "stdin", io.StringIO(payload)), redirect_stdout(out), redirect_stderr(err), \
                mock.patch.dict(os.environ, environment, clear=True), \
                mock.patch.object(design_guard.ds_criteria, "load", return_value=None), \
                mock.patch.object(design_guard, "firing_log", None):
            code = design_guard.main()
        return code, err.getvalue()

    def slide_type_settings_file(self):
        folder = os.path.join(self.root, "slide-types", "quiz")
        os.makedirs(folder, exist_ok=True)
        with open(os.path.join(folder, "settings.html"), "w", encoding="utf-8") as handle:
            handle.write(DS_PAGE)
        return os.path.join(folder, "settings.js")

    def load_skill(self):
        write_transcript(self.transcript, [tool_use("Skill", {"skill": "ahaslides-design:settings-design"})])

    def test_slide_type_settings_file_is_blocked_until_the_skill_is_loaded(self):
        path = self.slide_type_settings_file()
        code, err = self.run_guard(path, "panel.append(row)")
        self.assertEqual(code, 2)
        self.assertIn("ahaslides-design:settings-design", err)
        self.assertIn(settings_skill.DISABLE_ENV, err)
        self.load_skill()
        self.assertEqual(self.run_guard(path, "panel.append(row)")[0], 0)

    def test_app_file_routed_to_settings_is_blocked_until_the_skill_is_loaded(self):
        path = os.path.join(self.root, "src", "CourseSettings.tsx")
        self.assertEqual(self.run_guard(path, SETTINGS_MODAL)[0], 2)
        self.load_skill()
        self.assertEqual(self.run_guard(path, SETTINGS_MODAL)[0], 0)

    def test_non_settings_writes_are_not_blocked(self):
        path = os.path.join(self.root, "src", "DeleteDialog.tsx")
        self.assertEqual(self.run_guard(path, '<Modal title="Delete slide?" open>...</Modal>')[0], 0)
        presenter = os.path.join(os.path.dirname(self.slide_type_settings_file()), "presenter.js")
        self.assertEqual(self.run_guard(presenter, "stage.append(card)")[0], 0)

    def test_test_files_are_exempt(self):
        path = os.path.join(self.root, "src", "CourseSettings.test.tsx")
        self.assertEqual(self.run_guard(path, SETTINGS_MODAL)[0], 0)

    def test_the_escape_hatch_turns_off_only_this_block(self):
        path = self.slide_type_settings_file()
        self.assertEqual(self.run_guard(path, "panel.append(row)", env={settings_skill.DISABLE_ENV: "1"})[0], 0)

    def test_no_transcript_fails_open(self):
        self.transcript = ""
        self.assertEqual(self.run_guard(self.slide_type_settings_file(), "panel.append(row)")[0], 0)


if __name__ == "__main__":
    unittest.main()
