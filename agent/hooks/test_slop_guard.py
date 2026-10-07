#!/usr/bin/env python3
"""Stdlib unittest suite for slop_guard.py. Run: python3 test_slop_guard.py"""
import os
import sys
import json
import tempfile
import unittest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import slop_guard as sg


class ReadPayload(unittest.TestCase):
    def test_valid_json(self):
        self.assertEqual(sg.read_payload('{"a": 1}'), {"a": 1})

    def test_empty_is_empty_dict(self):
        self.assertEqual(sg.read_payload(""), {})
        self.assertEqual(sg.read_payload("   "), {})

    def test_malformed_is_empty_dict(self):
        self.assertEqual(sg.read_payload("{not json"), {})


class ResolveDetector(unittest.TestCase):
    def _make(self, home, version):
        d = os.path.join(home, ".claude", "plugins", "cache", "impeccable",
                         "impeccable", version, "skills", "impeccable", "scripts")
        os.makedirs(d, exist_ok=True)
        p = os.path.join(d, "detect.mjs")
        open(p, "w").close()
        return p

    def test_none_when_absent(self):
        with tempfile.TemporaryDirectory() as home:
            self.assertIsNone(sg.resolve_detector(home))

    def test_picks_highest_semver(self):
        with tempfile.TemporaryDirectory() as home:
            self._make(home, "3.8.0")
            hi = self._make(home, "4.1.1")
            self._make(home, "4.1.0")
            self.assertEqual(sg.resolve_detector(home), hi)

    def test_prerelease_not_tied_with_release(self):
        with tempfile.TemporaryDirectory() as home:
            pre = self._make(home, "4.1.1-beta")
            hi = self._make(home, "4.1.1")
            self.assertEqual(sg.resolve_detector(home), hi)


class CollectTouchedFiles(unittest.TestCase):
    def _transcript(self, home, file_paths):
        tp = os.path.join(home, "transcript.jsonl")
        with open(tp, "w", encoding="utf-8") as fh:
            for fp in file_paths:
                fh.write(json.dumps({
                    "message": {"content": [
                        {"type": "tool_use", "name": "Edit",
                         "input": {"file_path": fp}}
                    ]}
                }) + "\n")
        return tp

    def test_transcript_frontend_only_existing(self):
        with tempfile.TemporaryDirectory() as home:
            good = os.path.join(home, "Panel.tsx")
            open(good, "w").close()
            missing = os.path.join(home, "Gone.vue")   # referenced, not on disk
            readme = os.path.join(home, "README.md")    # non-frontend ext
            open(readme, "w").close()
            tp = self._transcript(home, [good, missing, readme])
            out = sg.collect_touched_files({"transcript_path": tp}, home)
            self.assertEqual(out, [os.path.abspath(good)])

    def test_no_transcript_no_git_is_empty(self):
        with tempfile.TemporaryDirectory() as home:
            self.assertEqual(sg.collect_touched_files({}, home), [])

    def test_git_fallback_success(self):
        import subprocess
        with tempfile.TemporaryDirectory() as repo:
            subprocess.run(["git", "-C", repo, "init", "-q"], check=True)
            fp = os.path.join(repo, "Widget.tsx")
            open(fp, "w").close()
            subprocess.run(["git", "-C", repo, "add", "Widget.tsx"], check=True)
            out = sg.collect_touched_files({}, repo)
            self.assertIn(os.path.abspath(fp), out)


RULES = [
    {"surface": "icons", "signature": r"emoji|\bglyph\b"},
    {"surface": "background", "signature": r"contrast"},
]


class SeenCacheAndKey(unittest.TestCase):
    def test_key_stable(self):
        c = {"file": "P.tsx", "line": 4, "text": "emoji-as-icon"}
        self.assertEqual(sg.finding_key(c), sg.finding_key(dict(c)))

    def test_roundtrip_and_fresh(self):
        with tempfile.TemporaryDirectory() as d:
            path = os.path.join(d, "seen.json")
            self.assertEqual(sg.load_seen(path, "s1"), set())
            sg.save_seen(path, "s1", {"k1", "k2"})
            self.assertEqual(sg.load_seen(path, "s1"), {"k1", "k2"})
            self.assertEqual(sg.load_seen(path, "other"), set())


class GapLedger(unittest.TestCase):
    def test_append_writes_lines(self):
        with tempfile.TemporaryDirectory() as d:
            path = os.path.join(d, "sub", "gaps.jsonl")
            sg.log_gaps(path, [{"file": "/a/P.tsx", "text": "zero-offset-shadow"}])
            with open(path, encoding="utf-8") as fh:
                rows = [json.loads(x) for x in fh if x.strip()]
            self.assertEqual(rows[0]["file"], "P.tsx")
            self.assertIn("shadow", rows[0]["text"])


class MapFindings(unittest.TestCase):
    def test_advisory_skipped(self):
        c, g = sg.map_findings([{"rule": "em-dash", "advisory": True}], RULES)
        self.assertEqual(c, [])
        self.assertEqual(g, [])

    def test_owner_match_not_a_gap(self):
        c, g = sg.map_findings(
            [{"rule": "emoji-as-icon", "file": "P.tsx", "line": 4}], RULES)
        self.assertEqual(len(c), 1)
        self.assertEqual(c[0]["owner"], "icons")
        self.assertEqual(g, [])

    def test_unmatched_is_floor_and_gap(self):
        c, g = sg.map_findings(
            [{"rule": "zero-offset-shadow", "file": "P.tsx"}], RULES)
        self.assertEqual(c[0]["owner"], "floor")
        self.assertEqual(len(g), 1)

    def test_real_antipattern_id_routes_to_ds_surface(self):
        rules = sg.load_rules()  # reads the shipped slop_rules.json
        c, g = sg.map_findings([{"antipattern": "gradient-text", "file": "P.tsx"}], rules)
        self.assertEqual(c[0]["owner"], "background")
        self.assertEqual(g, [])

    def test_unmapped_antipattern_falls_to_floor(self):
        rules = sg.load_rules()
        c, g = sg.map_findings([{"antipattern": "bounce-easing", "file": "P.tsx"}], rules)
        self.assertEqual(c[0]["owner"], "floor")
        self.assertEqual(len(g), 1)


class Detector(unittest.TestCase):
    def test_build_cmd(self):
        self.assertEqual(
            sg.build_detector_cmd("node", "/x/detect.mjs", ["a.tsx", "b.vue"]),
            ["node", "/x/detect.mjs", "--json", "a.tsx", "b.vue"])

    def test_run_parses_json_array(self):
        payload = json.dumps([{"rule": "gradient-text", "advisory": False}])
        cmd = ["python3", "-c", f"print({payload!r})"]
        self.assertEqual(sg.run_detector(cmd),
                         [{"rule": "gradient-text", "advisory": False}])

    def test_run_bad_json_is_empty(self):
        cmd = ["python3", "-c", "print('not json')"]
        self.assertEqual(sg.run_detector(cmd), [])

    def test_run_nonlist_is_empty(self):
        cmd = ["python3", "-c", "print('{\"a\": 1}')"]
        self.assertEqual(sg.run_detector(cmd), [])


class FindNode(unittest.TestCase):
    def test_returns_path_or_none(self):
        # Real environment: just assert it never raises and returns a node path
        # string (that exists) or None.
        result = sg.find_node()
        self.assertTrue(result is None or isinstance(result, str))
        if isinstance(result, str):
            self.assertTrue(os.path.isfile(result))


class EmitBlock(unittest.TestCase):
    def test_block_json_shape(self):
        out = sg.render_block([
            {"text": "emoji-as-icon", "file": "P.tsx", "line": 4,
             "owner": "icons"},
            {"text": "zero-offset-shadow", "file": "P.tsx", "line": None,
             "owner": "floor"},
        ])
        obj = json.loads(out)
        self.assertEqual(obj["decision"], "block")
        self.assertIn("[icons]", obj["reason"])
        self.assertIn("[floor]", obj["reason"])
        self.assertIn("Do NOT run impeccable direction", obj["reason"])


class SelectFresh(unittest.TestCase):
    def test_all_seen_returns_empty(self):
        c = [{"file": "P.tsx", "line": 4, "text": "emoji-as-icon"}]
        seen = {sg.finding_key(c[0])}
        self.assertEqual(sg.select_fresh(c, seen), [])

    def test_unseen_pass_through(self):
        c = [{"file": "P.tsx", "line": 4, "text": "emoji-as-icon"}]
        self.assertEqual(sg.select_fresh(c, set()), c)


if __name__ == "__main__":  # keep this the LAST block in the file
    unittest.main()
