#!/usr/bin/env python3
"""Stdlib unittest suite for the Vue 2 new-files-only behaviour. Run: python3 test_legacy_vue.py"""
import io
import json
import os
import subprocess
import sys
import tempfile
import unittest
from contextlib import redirect_stderr, redirect_stdout
from unittest import mock

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import design_guard  # noqa: E402
import design_judge_stop  # noqa: E402
import legacy_vue  # noqa: E402
import prompt_mandate  # noqa: E402
import slop_guard  # noqa: E402

RAW_TABLE = "<template><table><tr><td>x</td></tr></table></template>"
RAW_TABLE_TSX = "export const A = () => <table><tr><td>x</td></tr></table>"


def make_project(root, package_text, name="app"):
    project = os.path.join(root, name)
    os.makedirs(os.path.join(project, "src", "deep"), exist_ok=True)
    if package_text is not None:
        with open(os.path.join(project, "package.json"), "w", encoding="utf-8") as handle:
            handle.write(package_text)
    return project


def package(**deps):
    return json.dumps({"dependencies": deps})


class VueMajor(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)

    def test_versions(self):
        cases = {"^2.6.10": 2, "~2.7.0": 2, "2.x": 2, ">=2 <3": 2, "^3.0.0-0": 3, "^3.4.0": 3, "latest": None}
        for spec, expected in cases.items():
            project = make_project(self.tmp.name, package(vue=spec), "p" + str(abs(hash(spec))))
            self.assertEqual(legacy_vue.vue_major(project), expected, spec)

    def test_range_spanning_majors_is_not_vue2(self):
        for spec in ("^2.6.0 || ^3.0.0", ">=2 <4", ">=2.6.0 <=3.0.0"):
            project = make_project(self.tmp.name, package(vue=spec), "p" + str(abs(hash(spec))))
            self.assertIsNone(legacy_vue.vue_major(project), spec)

    def test_range_within_major_two(self):
        for spec in (">=2.6 <2.8", ">=2.6.0 <3.0.0", "<=2.7.16"):
            project = make_project(self.tmp.name, package(vue=spec), "p" + str(abs(hash(spec))))
            self.assertEqual(legacy_vue.vue_major(project), 2, spec)

    def test_digit_inside_a_name_is_not_a_version(self):
        for spec in ("catalog:vue2", "link:../vue2-fork", "workspace:*"):
            project = make_project(self.tmp.name, package(vue=spec), "p" + str(abs(hash(spec))))
            self.assertIsNone(legacy_vue.vue_major(project), spec)

    def test_aliased_and_tagged_specs(self):
        cases = {"npm:vue@3.4.0": 3, "npm:vue@^2.7.16": 2, "github:vuejs/core#v3.4": 3}
        for spec, expected in cases.items():
            project = make_project(self.tmp.name, package(vue=spec), "p" + str(abs(hash(spec))))
            self.assertEqual(legacy_vue.vue_major(project), expected, spec)

    def test_unversioned_dependency_falls_through_to_dev_dependency(self):
        project = make_project(self.tmp.name, json.dumps(
            {"dependencies": {"vue": "workspace:*"}, "devDependencies": {"vue": "^2.7"}}))
        self.assertTrue(legacy_vue.is_vue2(project))

    def test_peer_dependency(self):
        project = make_project(self.tmp.name, json.dumps({"peerDependencies": {"vue": "^2.6.0"}}))
        self.assertTrue(legacy_vue.is_vue2(project))

    def test_dev_dependency(self):
        project = make_project(self.tmp.name, json.dumps({"devDependencies": {"vue": "^2.7.0"}}))
        self.assertTrue(legacy_vue.is_vue2(project))

    def test_resolves_from_nested_file(self):
        project = make_project(self.tmp.name, package(vue="^2.6.10"))
        self.assertTrue(legacy_vue.is_vue2(os.path.join(project, "src", "deep", "A.vue")))

    def test_no_package_json(self):
        self.assertFalse(legacy_vue.is_vue2(make_project(self.tmp.name, None)))

    def test_unreadable_package_json_fails_open(self):
        self.assertFalse(legacy_vue.is_vue2(make_project(self.tmp.name, "{not json")))

    def test_react_project(self):
        self.assertFalse(legacy_vue.is_vue2(make_project(self.tmp.name, package(react="^18", antd="^5"))))


class HookTestCase(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.vue2 = make_project(self.tmp.name, package(vue="^2.6.10"), "vue2")
        self.vue3 = make_project(self.tmp.name, package(vue="^3.0.0-0"), "vue3")
        self.react = make_project(self.tmp.name, package(react="^18.0.0", antd="^5.0.0"), "react")
        self.bare = make_project(self.tmp.name, None, "bare")
        self.broken = make_project(self.tmp.name, "{not json", "broken")
        log = mock.patch.object(design_guard, "_log")
        self.guard_log = log.start()
        self.addCleanup(log.stop)

    def run_guard(self, project, content, name="Table.vue"):
        payload = json.dumps({"tool_name": "Write", "cwd": project, "tool_input": {
            "file_path": os.path.join(project, "src", name), "content": content}})
        out, err = io.StringIO(), io.StringIO()
        with mock.patch.object(sys, "stdin", io.StringIO(payload)), redirect_stdout(out), redirect_stderr(err), \
                mock.patch.object(design_guard.ds_criteria, "load", return_value=None):
            code = design_guard.main()
        return code, out.getvalue(), err.getvalue()


def commit_all(project):
    git = ["git", "-C", project, "-c", "user.email=t@t", "-c", "user.name=t"]
    subprocess.run(git + ["init", "-q"], check=True)
    subprocess.run(git + ["add", "-A"], check=True)
    subprocess.run(git + ["commit", "-qm", "init"], check=True)


class IsExistingFileTest(HookTestCase):
    def test_committed_file_is_existing_and_new_ones_are_not(self):
        committed = os.path.join(self.vue2, "src", "Old.vue")
        open(committed, "w").write("<template/>")
        commit_all(self.vue2)
        untracked = os.path.join(self.vue2, "src", "Untracked.vue")
        added = os.path.join(self.vue2, "src", "Added.vue")
        open(untracked, "w").write("x")
        open(added, "w").write("x")
        subprocess.run(["git", "-C", self.vue2, "add", "src/Added.vue"], check=True)
        self.assertTrue(legacy_vue.is_existing_file(committed))
        self.assertFalse(legacy_vue.is_existing_file(untracked))
        self.assertFalse(legacy_vue.is_existing_file(added))
        self.assertFalse(legacy_vue.is_existing_file(os.path.join(self.vue2, "src", "Missing.vue")))

    def test_outside_git_a_file_on_disk_is_existing(self):
        path = os.path.join(self.vue2, "src", "A.vue")
        open(path, "w").write("x")
        self.assertTrue(legacy_vue.is_existing_file(path))

    def test_is_legacy_edit_needs_vue2_and_existing(self):
        path = os.path.join(self.vue3, "src", "A.vue")
        open(path, "w").write("x")
        self.assertFalse(legacy_vue.is_legacy_edit(path))
        path2 = os.path.join(self.vue2, "src", "A.vue")
        open(path2, "w").write("x")
        self.assertTrue(legacy_vue.is_legacy_edit(path2))
        self.assertFalse(legacy_vue.is_legacy_edit(os.path.join(self.vue2, "src", "New.vue")))


class DesignGuardTest(HookTestCase):
    def test_vue2_existing_file_is_left_alone(self):
        open(os.path.join(self.vue2, "src", "Table.vue"), "w").write("x")
        code, out, err = self.run_guard(self.vue2, RAW_TABLE)
        self.assertEqual((code, out, err), (0, "", ""))
        self.guard_log.assert_called_with("noop", "vue2_existing_file")

    def test_vue2_new_file_blocks_raw_table(self):
        code, _, err = self.run_guard(self.vue2, RAW_TABLE, "NewTable.vue")
        self.assertEqual(code, 2)
        self.assertIn("aha-design guard", err)

    def test_vue2_new_file_blocks_storybook_kit_import(self):
        code, _, err = self.run_guard(
            self.vue2, "<script>import { Button } from '@ahaslides-product/stpancras-storybook-app'</script>", "NewPanel.vue")
        self.assertEqual(code, 2)
        self.assertIn("<aha-*>", err)

    def test_storybook_kit_import_is_not_flagged_outside_vue2(self):
        code, _, _ = self.run_guard(
            self.vue3, "<script>import x from '@ahaslides-product/stpancras-storybook-app'</script>", "NewPanel.vue")
        self.assertEqual(code, 0)

    def test_vue3_still_blocks_raw_table(self):
        code, _, err = self.run_guard(self.vue3, RAW_TABLE)
        self.assertEqual(code, 2)
        self.assertIn("aha-design guard", err)

    def test_react_still_blocks_raw_table(self):
        code, _, _ = self.run_guard(self.react, RAW_TABLE_TSX, "Table.tsx")
        self.assertEqual(code, 2)

    def test_no_package_json_unchanged(self):
        code, _, _ = self.run_guard(self.bare, RAW_TABLE)
        self.assertEqual(code, 2)

    def test_unreadable_package_json_unchanged(self):
        code, _, _ = self.run_guard(self.broken, RAW_TABLE)
        self.assertEqual(code, 2)


class PromptMandateTest(HookTestCase):
    def run_prompt(self, project):
        payload = json.dumps({"prompt": "build a settings dialog", "cwd": project})
        out = io.StringIO()
        with mock.patch.object(sys, "stdin", io.StringIO(payload)), redirect_stdout(out), \
                mock.patch.object(prompt_mandate.ds_criteria, "load", return_value=None), \
                mock.patch.object(prompt_mandate.firing_log, "record") as record, \
                mock.patch.object(prompt_mandate.firing_log, "last", return_value=None):
            code = prompt_mandate.main()
        self.assertEqual(code, 0)
        return json.loads(out.getvalue())["hookSpecificOutput"]["additionalContext"], record

    def test_vue2_gets_the_notice_and_the_mandate(self):
        context, record = self.run_prompt(self.vue2)
        self.assertTrue(context.startswith(legacy_vue.VUE2_NOTICE))
        self.assertIn("MANDATORY", context)
        self.assertEqual(record.call_args[0][1], "fired")

    def test_vue3_react_bare_broken_keep_the_mandate(self):
        for project in (self.vue3, self.react, self.bare, self.broken):
            context, record = self.run_prompt(project)
            self.assertIn("MANDATORY", context, project)
            self.assertEqual(record.call_args[0][1], "fired")


class StopHooksTest(HookTestCase):
    def test_slop_guard_skips_existing_vue2_files(self):
        vue2_file = os.path.join(self.vue2, "src", "A.vue")
        vue3_file = os.path.join(self.vue3, "src", "A.vue")
        for path in (vue2_file, vue3_file):
            open(path, "w").close()
        payload = json.dumps({"session_id": "s"})
        for files, expect_reason in (([vue2_file], "vue2_existing_files"), ([vue2_file, vue3_file], "no_detector")):
            with mock.patch.object(sys, "stdin", io.StringIO(payload)), \
                    mock.patch.object(slop_guard, "collect_touched_files", return_value=files), \
                    mock.patch.object(slop_guard, "resolve_detector", return_value=None), \
                    mock.patch.object(slop_guard, "_log") as log:
                self.assertEqual(slop_guard.main(), 0)
            self.assertEqual(log.call_args[0][1], expect_reason)

    def test_slop_guard_checks_new_vue2_files(self):
        new_file = os.path.join(self.vue2, "src", "New.vue")
        open(new_file, "w").close()
        commit_all(self.vue2)
        fresh = os.path.join(self.vue2, "src", "Fresh.vue")
        open(fresh, "w").close()
        with mock.patch.object(sys, "stdin", io.StringIO(json.dumps({"session_id": "s"}))), \
                mock.patch.object(slop_guard, "collect_touched_files", return_value=[new_file, fresh]), \
                mock.patch.object(slop_guard, "resolve_detector", return_value=None), \
                mock.patch.object(slop_guard, "_log") as log:
            self.assertEqual(slop_guard.main(), 0)
        self.assertEqual(log.call_args[0][1], "no_detector")

    def test_judge_stop_asks_for_new_vue2_files(self):
        payload = json.dumps({"session_id": "s", "cwd": self.vue2})
        with mock.patch.object(sys, "stdin", io.StringIO(payload)), \
                mock.patch.object(design_judge_stop, "is_frontend_repo", return_value=True), \
                mock.patch.object(design_judge_stop, "changed_ui_files", return_value=["src/New.vue"]), \
                mock.patch.object(design_judge_stop, "load_seen", return_value=set()), \
                mock.patch.object(design_judge_stop, "save_seen"), \
                mock.patch.object(design_judge_stop.ds_criteria, "load", return_value=None), \
                mock.patch.object(design_judge_stop, "_log") as log, \
                redirect_stdout(io.StringIO()):
            self.assertEqual(design_judge_stop.main(), 0)
        self.assertEqual(log.call_args[0][0], "block")

    def test_judge_stop_skips_existing_vue2_only_changes(self):
        open(os.path.join(self.vue2, "src", "A.vue"), "w").close()
        payload = json.dumps({"session_id": "s", "cwd": self.vue2})
        with mock.patch.object(sys, "stdin", io.StringIO(payload)), \
                mock.patch.object(design_judge_stop, "is_frontend_repo", return_value=True), \
                mock.patch.object(design_judge_stop, "changed_ui_files", return_value=["src/A.vue"]), \
                mock.patch.object(design_judge_stop, "_log") as log, \
                redirect_stdout(io.StringIO()) as out:
            self.assertEqual(design_judge_stop.main(), 0)
        self.assertEqual(out.getvalue(), "")
        self.assertEqual(log.call_args[0][:2], ("noop", "vue2_existing_files"))

    def test_judge_stop_still_asks_for_vue3(self):
        payload = json.dumps({"session_id": "s", "cwd": self.vue3})
        with mock.patch.object(sys, "stdin", io.StringIO(payload)), \
                mock.patch.object(design_judge_stop, "is_frontend_repo", return_value=True), \
                mock.patch.object(design_judge_stop, "changed_ui_files", return_value=["src/A.vue"]), \
                mock.patch.object(design_judge_stop, "load_seen", return_value=set()), \
                mock.patch.object(design_judge_stop, "save_seen"), \
                mock.patch.object(design_judge_stop.ds_criteria, "load", return_value=None), \
                mock.patch.object(design_judge_stop, "_log") as log, \
                redirect_stdout(io.StringIO()):
            self.assertEqual(design_judge_stop.main(), 0)
        self.assertEqual(log.call_args[0][0], "block")


if __name__ == "__main__":
    unittest.main()
