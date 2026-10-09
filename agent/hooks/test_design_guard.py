import io
import json
import os
import sys
import unittest
from contextlib import redirect_stdout
from unittest import mock

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import design_guard  # noqa: E402


def run_guard(content, path="src/CourseSettings.tsx"):
    payload = json.dumps({"tool_name": "Write", "tool_input": {"file_path": path, "content": content}})
    out = io.StringIO()
    with mock.patch.object(sys, "stdin", io.StringIO(payload)), redirect_stdout(out), \
            mock.patch.object(design_guard.ds_criteria, "load", return_value=None):
        code = design_guard.main()
    return code, out.getvalue()


class SettingsRoutingTest(unittest.TestCase):
    def test_settings_modal_nudges_settings_and_overlays(self):
        code, out = run_guard('<Modal title="Course settings" open>...</Modal>')
        self.assertEqual(code, 0)
        self.assertIn("[settings]", out)
        self.assertIn("[overlays]", out)

    def test_settings_drawer_component_name_nudges_settings(self):
        _, out = run_guard("export function PreferencesDrawer() { return null }")
        self.assertIn("[settings]", out)

    def test_plain_modal_does_not_nudge_settings(self):
        _, out = run_guard('<Modal title="Delete slide?" open>...</Modal>')
        self.assertNotIn("[settings]", out)
        self.assertIn("[overlays]", out)


class ProductLockupRoutingTest(unittest.TestCase):
    def test_logo_file_in_a_header_nudges_app_shell(self):
        _, out = run_guard('<header><img src="/logo/thesplash.svg" alt="" /><span>Docs</span></header>', "src/SiteHeader.tsx")
        self.assertIn("[app-shell]", out)
        self.assertIn("aha-product-lockup", out)

    def test_product_lockup_does_not_nudge(self):
        _, out = run_guard('<header><aha-product-lockup product="Docs" /></header>', "src/SiteHeader.tsx")
        self.assertNotIn("[app-shell]", out)


if __name__ == "__main__":
    unittest.main()
