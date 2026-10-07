#!/usr/bin/env python3
"""Stdlib unittest suite for design_judge_stop.py. Run: python3 test_design_judge_stop.py"""
import json
import os
import subprocess
import sys
import tempfile
import unittest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import design_judge_stop as dj


class ReadPayload(unittest.TestCase):
    def test_valid_empty_malformed(self):
        self.assertEqual(dj.read_payload('{"a": 1}'), {"a": 1})
        self.assertEqual(dj.read_payload(""), {})
        self.assertEqual(dj.read_payload("   "), {})
        self.assertEqual(dj.read_payload("{not json"), {})


class IsUiFile(unittest.TestCase):
    def test_real_ui_files(self):
        for p in ("src/components/Button.tsx", "frontend/theme/tokens.scss",
                  "apps/web/src/pages/Home.vue", "src/styles/main.css"):
            self.assertTrue(dj.is_ui_file(p), p)

    def test_excluded(self):
        for p in ("src/Button.test.tsx", "src/Button.spec.ts",
                  "src/Button.stories.tsx", "src/types/api.d.ts",
                  "src/vite.config.ts", "src/__tests__/x.ts"):
            self.assertFalse(dj.is_ui_file(p), p)

    def test_non_ui(self):
        for p in ("README.md", "package.json", "components/Button.tsx",
                  "docs/guide.mdx", "server/handler.ts"):
            self.assertFalse(dj.is_ui_file(p), p)


CRITERIA = {
    "source": "file",
    "surfaces": {
        "background": [{"id": "C1", "title": "White by default", "test": ""}],
        "component-standard": [{"id": "C1", "title": "Measured values", "test": ""}],
        "table": [{"id": "C1", "title": "Shared DataTable", "test": ""}],
    },
}


class MapFile(unittest.TestCase):
    def test_general_component_gets_the_baseline(self):
        self.assertEqual(dj.map_file("src/components/Card.tsx"),
                         {"background", "component-standard"})

    def test_named_surfaces_add_to_the_baseline(self):
        self.assertIn("table", dj.map_file("src/DataTable.tsx"))
        self.assertIn("icons", dj.map_file("src/Icon.tsx"))
        self.assertIn("typography", dj.map_file("src/Heading.tsx"))
        self.assertIn("overlays", dj.map_file("src/DeleteModal.tsx"))
        self.assertIn("background", dj.map_file("src/DeleteModal.tsx"))

    def test_slide_iframes_map_to_their_own_surface(self):
        self.assertEqual(dj.map_file("src/canvas/Canvas.vue"), {"canvas"})
        self.assertEqual(dj.map_file("audience/src/Answer.vue"), {"audience"})

    def test_surfaces_for_drops_surfaces_the_ds_does_not_have(self):
        out = dj.surfaces_for(["src/DataTable.tsx", "src/Icon.tsx"], CRITERIA)
        self.assertEqual(out, ["background", "component-standard", "table"])

    def test_surfaces_for_keeps_everything_without_criteria(self):
        out = dj.surfaces_for(["src/Icon.tsx"], None)
        self.assertEqual(out, sorted(set(out)))
        self.assertIn("icons", out)


class FrontendGate(unittest.TestCase):
    def _pkg(self, root, deps):
        with open(os.path.join(root, "package.json"), "w", encoding="utf-8") as fh:
            json.dump({"dependencies": deps}, fh)

    def test_antd_dep_is_frontend(self):
        with tempfile.TemporaryDirectory() as root:
            self._pkg(root, {"antd": "^6.0.0"})
            self.assertTrue(dj.is_frontend_repo(root))

    def test_ahaslides_design_dep_is_frontend(self):
        with tempfile.TemporaryDirectory() as root:
            self._pkg(root, {"@ahaslides-product/design": "1.0.0"})
            self.assertTrue(dj.is_frontend_repo(root))

    def test_theme_dir_is_frontend(self):
        with tempfile.TemporaryDirectory() as root:
            os.makedirs(os.path.join(root, "src", "theme"))
            self.assertTrue(dj.is_frontend_repo(root))

    def test_plain_repo_is_not_frontend(self):
        with tempfile.TemporaryDirectory() as root:
            self._pkg(root, {"express": "^4.0.0"})
            self.assertFalse(dj.is_frontend_repo(root))


class SeenCache(unittest.TestCase):
    def test_round_trip_and_stability(self):
        with tempfile.TemporaryDirectory() as root:
            path = os.path.join(root, ".impeccable", "judge-seen.json")
            k = dj.seen_key(["src/b.tsx", "src/a.tsx"])
            self.assertEqual(k, dj.seen_key(["src/a.tsx", "src/b.tsx"]))
            self.assertEqual(dj.load_seen(path, "s1"), set())
            dj.save_seen(path, "s1", {k})
            self.assertEqual(dj.load_seen(path, "s1"), {k})
            self.assertEqual(dj.load_seen(path, "other"), set())


class MainEndToEnd(unittest.TestCase):
    """Run the hook as a subprocess against a throwaway git repo."""
    def setUp(self):
        self._seen = tempfile.NamedTemporaryFile(delete=False, suffix=".json")
        self._seen.close()
        os.unlink(self._seen.name)
        self._criteria = tempfile.NamedTemporaryFile("w", delete=False, suffix=".json")
        json.dump({"surfaces": {k: {"criteria": v} for k, v in CRITERIA["surfaces"].items()}},
                  self._criteria)
        self._criteria.close()

    def tearDown(self):
        for path in (self._seen.name, self._criteria.name):
            if os.path.exists(path):
                os.unlink(path)

    def _run(self, cwd, payload, env=None):
        e = dict(os.environ)
        e["AHA_DESIGN_JUDGE_SEEN"] = self._seen.name
        e["AHA_DESIGN_CRITERIA_FILE"] = self._criteria.name
        if env:
            e.update(env)
        proc = subprocess.run(
            [sys.executable, os.path.join(dj.HOOK_DIR, "design_judge_stop.py")],
            input=json.dumps(payload), capture_output=True, text=True, env=e)
        return proc

    def _git_repo(self, root):
        subprocess.run(["git", "-C", root, "init", "-q"], check=True)
        subprocess.run(["git", "-C", root, "config", "user.email", "t@t"], check=True)
        subprocess.run(["git", "-C", root, "config", "user.name", "t"], check=True)
        with open(os.path.join(root, "package.json"), "w") as fh:
            json.dump({"dependencies": {"antd": "^6.0.0"}}, fh)
        subprocess.run(["git", "-C", root, "add", "-A"], check=True)
        subprocess.run(["git", "-C", root, "commit", "-qm", "init"], check=True)

    def test_loop_guard_exits_silent(self):
        p = self._run(dj.HOOK_DIR, {"stop_hook_active": True})
        self.assertEqual(p.returncode, 0)
        self.assertEqual(p.stdout.strip(), "")

    def test_disable_flag_exits_silent(self):
        with tempfile.TemporaryDirectory() as root:
            self._git_repo(root)
            os.makedirs(os.path.join(root, "src"))
            open(os.path.join(root, "src", "Card.tsx"), "w").close()
            p = self._run(dj.HOOK_DIR, {"cwd": root},
                          env={"AHA_DESIGN_JUDGE_DISABLE": "1"})
            self.assertEqual(p.stdout.strip(), "")

    def test_non_frontend_repo_silent(self):
        with tempfile.TemporaryDirectory() as root:
            subprocess.run(["git", "-C", root, "init", "-q"], check=True)
            os.makedirs(os.path.join(root, "src"))
            open(os.path.join(root, "src", "Card.tsx"), "w").close()
            p = self._run(dj.HOOK_DIR, {"cwd": root})
            self.assertEqual(p.stdout.strip(), "")

    def test_blocks_on_changed_ui_file(self):
        with tempfile.TemporaryDirectory() as root:
            self._git_repo(root)
            os.makedirs(os.path.join(root, "src"))
            open(os.path.join(root, "src", "Card.tsx"), "w").close()
            p = self._run(dj.HOOK_DIR, {"cwd": root, "session_id": "s1"})
            self.assertEqual(p.returncode, 0)
            out = json.loads(p.stdout)
            self.assertEqual(out["decision"], "block")
            self.assertIn("src/Card.tsx", out["reason"])
            self.assertIn("background: C1 White by default", out["reason"])
            self.assertIn("source: file", out["reason"])

    def test_no_ui_changes_silent(self):
        with tempfile.TemporaryDirectory() as root:
            self._git_repo(root)
            open(os.path.join(root, "notes.md"), "w").close()
            p = self._run(dj.HOOK_DIR, {"cwd": root})
            self.assertEqual(p.stdout.strip(), "")


if __name__ == "__main__":
    unittest.main()
