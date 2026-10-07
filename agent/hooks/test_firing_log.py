#!/usr/bin/env python3
"""Stdlib unittest suite for firing_log.py. Run: python3 test_firing_log.py"""
import importlib
import os
import sys
import tempfile
import unittest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import firing_log as fl


class RecordAndRead(unittest.TestCase):
    def setUp(self):
        # Redirect the log to a temp file so tests never touch the real state dir.
        self._tmp = tempfile.mkdtemp()
        self._orig = fl.FIRING_LOG
        fl.FIRING_LOG = os.path.join(self._tmp, "firing-log.jsonl")

    def tearDown(self):
        fl.FIRING_LOG = self._orig

    def test_record_then_read_all(self):
        fl.record("UserPromptSubmit", "fired", "mandate")
        fl.record("Stop", "degraded", "no_node_ge_22", session_id="s1")
        rows = fl.read_all()
        self.assertEqual(len(rows), 2)
        self.assertEqual(rows[0]["hook"], "UserPromptSubmit")
        self.assertEqual(rows[0]["outcome"], "fired")
        self.assertEqual(rows[1]["reason"], "no_node_ge_22")
        self.assertEqual(rows[1]["session"], "s1")
        # every row is timestamped
        self.assertIn("ts", rows[0])

    def test_last_filters_by_hook(self):
        fl.record("Stop", "clean")
        fl.record("UserPromptSubmit", "fired")
        fl.record("Stop", "degraded", "no_node_ge_22")
        self.assertEqual(fl.last("Stop")["outcome"], "degraded")
        self.assertEqual(fl.last("UserPromptSubmit")["outcome"], "fired")
        self.assertEqual(fl.last()["hook"], "Stop")

    def test_last_none_when_empty(self):
        self.assertIsNone(fl.last())
        self.assertEqual(fl.read_all(), [])

    def test_rotation_keeps_tail(self):
        for i in range(fl.MAX_LINES + 50):
            fl.record("Stop", "clean", str(i))
        rows = fl.read_all()
        self.assertEqual(len(rows), fl.MAX_LINES)
        # the oldest 50 were dropped; the last recorded reason survives
        self.assertEqual(rows[-1]["reason"], str(fl.MAX_LINES + 49))

    def test_record_never_raises_on_bad_dir(self):
        fl.FIRING_LOG = "/proc/nonexistent/definitely/cannot/write.jsonl"
        # Must swallow the error, not raise.
        fl.record("Stop", "clean")
        self.assertIsNone(fl.last())


if __name__ == "__main__":
    unittest.main()
