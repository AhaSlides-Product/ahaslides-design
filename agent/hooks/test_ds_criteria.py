#!/usr/bin/env python3
"""Stdlib unittest suite for ds_criteria.py and the hooks that read it. Run: python3 test_ds_criteria.py"""
import json
import os
import subprocess
import sys
import re
import tempfile
import unittest
from unittest import mock

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ds_criteria  # noqa: E402

HOOK_DIR = os.path.dirname(os.path.abspath(__file__))
STORE = {
    "owner": "ahaslides-design",
    "surfaces": {
        "table": {"surface": "table", "criteria": [
            {"id": "C1", "title": "Shared DataTable", "test": "renders through DataTable"}]},
        "overlays": {"surface": "overlays", "criteria": [
            {"id": "C1", "title": "Right surface", "test": "modal vs drawer"}]},
    },
}


def write_json(path, document):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(document, fh)


class Isolated(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.root = self.temporary.name
        self.environment = mock.patch.dict(os.environ, {})
        self.environment.start()
        os.environ.pop("AHA_DESIGN_CRITERIA_FILE", None)

    def tearDown(self):
        self.environment.stop()
        self.temporary.cleanup()


class Load(Isolated):
    def test_installed_package_wins_and_reports_its_version(self):
        package = os.path.join(self.root, "node_modules", "@ahaslides-product", "design")
        write_json(os.path.join(package, "anti-slop", "criteria.json"), STORE)
        write_json(os.path.join(package, "package.json"), {"version": "0.66.0"})
        nested = os.path.join(self.root, "apps", "web")
        os.makedirs(nested)
        result = ds_criteria.load(nested)
        self.assertEqual(result["source"], "package@0.66.0")
        self.assertEqual(ds_criteria.criteria_lines(result, "table"), ["C1 Shared DataTable"])

    def test_without_a_package_the_plugin_copy_of_its_own_release_is_used(self):
        result = ds_criteria.load(self.root)
        self.assertEqual(result["source"], "plugin@" + ds_criteria._version_of(ds_criteria.PLUGIN_MANIFEST))
        self.assertIn("table", result["surfaces"])

    def test_broken_package_falls_through_to_the_plugin_copy(self):
        package = os.path.join(self.root, "node_modules", "@ahaslides-product", "design")
        os.makedirs(os.path.join(package, "anti-slop"))
        with open(os.path.join(package, "anti-slop", "criteria.json"), "w") as fh:
            fh.write("{not json")
        self.assertTrue(ds_criteria.load(self.root)["source"].startswith("plugin@"))

    def test_no_readable_source_returns_none(self):
        missing = os.path.join(self.root, "missing.json")
        with mock.patch.object(ds_criteria, "BUNDLED_CRITERIA", missing):
            self.assertIsNone(ds_criteria.load(self.root))

    def test_explicit_file_accepts_the_feed_shape(self):
        feed = os.path.join(self.root, "anti-slop.agent.json")
        write_json(feed, {"loop": "…", "surfaces": STORE["surfaces"]})
        os.environ["AHA_DESIGN_CRITERIA_FILE"] = feed
        self.assertEqual(sorted(ds_criteria.load(self.root)["surfaces"]), ["overlays", "table"])


class Hooks(Isolated):
    def run_hook(self, script, payload):
        return subprocess.run([sys.executable, os.path.join(HOOK_DIR, script)],
                              input=json.dumps(payload), capture_output=True, text=True,
                              env=dict(os.environ))

    def test_guard_blocks_a_raw_table_and_cites_the_ds_criteria(self):
        criteria = os.path.join(self.root, "criteria.json")
        write_json(criteria, STORE)
        os.environ["AHA_DESIGN_CRITERIA_FILE"] = criteria
        process = self.run_hook("design_guard.py", {"tool_name": "Write", "tool_input": {
            "file_path": "src/Grid.tsx", "content": "<Table dataSource={rows}/>"}})
        self.assertEqual(process.returncode, 2)
        self.assertIn("[table]", process.stderr)
        self.assertIn("table: C1 Shared DataTable", process.stderr)

    def test_guard_nudges_with_the_plugin_copy_of_the_criteria(self):
        process = self.run_hook("design_guard.py", {"tool_name": "Edit", "cwd": self.root, "tool_input": {
            "file_path": "src/Confirm.tsx", "new_string": "<Modal open/>"}})
        self.assertEqual(process.returncode, 0)
        context = json.loads(process.stdout)["hookSpecificOutput"]["additionalContext"]
        self.assertIn("[overlays]", context)
        self.assertIn("source: plugin@", context)

    def test_guard_leaves_clean_code_alone(self):
        process = self.run_hook("design_guard.py", {"tool_name": "Write", "tool_input": {
            "file_path": "src/Card.tsx", "content": "<DataTable rows={rows}/>"}})
        self.assertEqual((process.returncode, process.stdout), (0, ""))

    def test_mandate_lists_the_ds_surfaces_on_a_ui_prompt(self):
        criteria = os.path.join(self.root, "criteria.json")
        write_json(criteria, STORE)
        os.environ["AHA_DESIGN_CRITERIA_FILE"] = criteria
        process = self.run_hook("prompt_mandate.py", {"prompt": "build the results table", "cwd": self.root})
        context = json.loads(process.stdout)["hookSpecificOutput"]["additionalContext"]
        self.assertIn("overlays (1), table (1)", context)
        self.assertIn("`aha-design` skill", context)

    def test_mandate_stays_short_on_a_non_ui_prompt(self):
        process = self.run_hook("prompt_mandate.py", {"prompt": "fix the cron job retry", "cwd": self.root})
        context = json.loads(process.stdout)["hookSpecificOutput"]["additionalContext"]
        self.assertNotIn("Surfaces judged", context)


RETIRED_SKILL = re.compile(
    r"\baha-design-(antd|audience|background|canvas|component-standard|feedback|icons|overlays"
    r"|paywall|settings|shared-components|status-badges|table|typography|ux-writing)(-judge)?\b")


def registry(name):
    with open(os.path.join(HOOK_DIR, name), encoding="utf-8") as fh:
        return json.load(fh)


class Registries(unittest.TestCase):
    def test_every_routed_surface_exists_in_the_criteria_shipped_with_the_plugin(self):
        shipped = ds_criteria._from_plugin()
        self.assertIsNotNone(shipped, "agent/anti-slop/criteria.json is missing — run npm run generate")
        for name in ("rules.json", "slop_rules.json"):
            for rule in registry(name):
                self.assertIn(rule["surface"], shipped["surfaces"], (name, rule))
                re.compile(rule["signature"])

    def test_nothing_in_the_plugin_points_at_a_retired_per_surface_skill(self):
        hits = []
        for directory, subdirectories, files in os.walk(ds_criteria.PLUGIN_ROOT):
            subdirectories[:] = [d for d in subdirectories if d not in ("anti-slop", ".impeccable")]
            for name in files:
                if name.endswith((".md", ".json", ".py", ".sh")) and not name.startswith("test_"):
                    with open(os.path.join(directory, name), encoding="utf-8", errors="replace") as fh:
                        hits += [os.path.join(directory, name) for line in fh if RETIRED_SKILL.search(line)]
        self.assertEqual(hits, [])

    def test_every_rule_names_a_surface_and_a_known_action(self):
        for name in ("rules.json", "slop_rules.json"):
            with open(os.path.join(HOOK_DIR, name), encoding="utf-8") as fh:
                for rule in json.load(fh):
                    self.assertTrue(rule.get("surface"), (name, rule))
                    self.assertNotIn("skill", rule, (name, rule))
                    if name == "rules.json":
                        self.assertIn(rule.get("action"), ("block", "nudge"), rule)


if __name__ == "__main__":
    unittest.main()
