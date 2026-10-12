import io
import json
import os
import shutil
import sys
import tempfile
import unittest
from contextlib import redirect_stderr, redirect_stdout
from unittest import mock

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import design_guard  # noqa: E402


class IconGuardTest(unittest.TestCase):
    def setUp(self):
        self.app = tempfile.mkdtemp()
        with open(os.path.join(self.app, "package.json"), "w") as handle:
            json.dump({"name": "presenter", "dependencies": {"react": "^18.0.0"}}, handle)
        self.design_system = tempfile.mkdtemp()
        with open(os.path.join(self.design_system, "package.json"), "w") as handle:
            json.dump({"name": "@ahaslides-product/design"}, handle)

    def tearDown(self):
        shutil.rmtree(self.app)
        shutil.rmtree(self.design_system)

    def run_guard(self, tool_input, tool_name="Write"):
        payload = json.dumps({"tool_name": tool_name, "tool_input": tool_input, "cwd": self.app})
        out, err = io.StringIO(), io.StringIO()
        with mock.patch.object(sys, "stdin", io.StringIO(payload)), redirect_stdout(out), redirect_stderr(err), \
                mock.patch.object(design_guard.ds_criteria, "load", return_value=None):
            code = design_guard.main()
        return code, err.getvalue()

    def test_inline_svg_in_an_app_component_is_blocked_with_the_search(self):
        code, err = self.run_guard({"file_path": os.path.join(self.app, "src/Help.tsx"),
                                    "content": 'export const Help = () => <svg viewBox="0 0 16 16"><path d="M1 1"/></svg>'})
        self.assertEqual(code, 2)
        self.assertIn("icon-search", err)
        self.assertIn("system-question", err)

    def test_new_svg_file_in_an_app_is_blocked(self):
        code, err = self.run_guard({"file_path": os.path.join(self.app, "src/assets/help.svg"),
                                    "content": '<svg xmlns="http://www.w3.org/2000/svg"></svg>'})
        self.assertEqual(code, 2)
        self.assertIn("New .svg file", err)

    def test_editing_an_existing_svg_file_is_allowed(self):
        existing = os.path.join(self.app, "logo.svg")
        with open(existing, "w") as handle:
            handle.write("<svg></svg>")
        code, _ = self.run_guard({"file_path": existing, "content": "<svg><path/></svg>"})
        self.assertEqual(code, 0)

    def test_marked_sub_glyph_chrome_is_allowed(self):
        code, _ = self.run_guard({"file_path": os.path.join(self.app, "src/Spinner.tsx"),
                                  "content": "return <svg className=\"spin\" /> // ds-lint-allow: svg (spinner arc)"})
        self.assertEqual(code, 0)

    def test_an_edit_that_keeps_existing_svg_is_allowed(self):
        code, _ = self.run_guard({"file_path": os.path.join(self.app, "src/Chart.tsx"),
                                  "old_string": "<svg width={w}>", "new_string": "<svg width={width}>"}, tool_name="Edit")
        self.assertEqual(code, 0)

    def test_an_edit_that_adds_svg_is_blocked(self):
        code, _ = self.run_guard({"file_path": os.path.join(self.app, "src/Toolbar.vue"),
                                  "old_string": "<button>", "new_string": "<button><svg><path d=\"M0 0\"/></svg>"}, tool_name="Edit")
        self.assertEqual(code, 2)

    def test_aha_icon_by_name_is_not_blocked(self):
        code, _ = self.run_guard({"file_path": os.path.join(self.app, "src/Help.tsx"),
                                  "content": '<aha-icon name="system-question" size="16"></aha-icon>'})
        self.assertEqual(code, 0)

    def test_design_system_glyph_source_is_exempt(self):
        code, _ = self.run_guard({"file_path": os.path.join(self.design_system, "icons/svg/system/system-new.svg"),
                                  "content": "<svg></svg>"})
        self.assertEqual(code, 0)

    def test_design_system_docs_generator_is_exempt_but_its_elements_are_not(self):
        code, _ = self.run_guard({"file_path": os.path.join(self.design_system, "generate.mjs"),
                                  "content": "const html = `<svg></svg>`"})
        self.assertEqual(code, 0)
        code, _ = self.run_guard({"file_path": os.path.join(self.design_system, "lib/aha-thing.js"),
                                  "content": "this.innerHTML = `<svg></svg>`"})
        self.assertEqual(code, 2)


    def test_reflowing_existing_svg_tags_onto_more_lines_is_allowed(self):
        code, _ = self.run_guard({"file_path": os.path.join(self.app, "src/Pair.tsx"),
                                  "old_string": "<i><svg a/><svg b/></i>", "new_string": "<i>\n<svg a/>\n<svg b/>\n</i>"}, tool_name="Edit")
        self.assertEqual(code, 0)

    def test_a_second_svg_on_the_same_line_is_blocked(self):
        code, _ = self.run_guard({"file_path": os.path.join(self.app, "src/Pair.tsx"),
                                  "old_string": "<i><svg a/></i>", "new_string": "<i><svg a/><svg b/></i>"}, tool_name="Edit")
        self.assertEqual(code, 2)

    def test_test_files_are_exempt(self):
        for name in ("src/Help.test.tsx", "src/help.spec.ts", "src/__tests__/Help.tsx"):
            code, _ = self.run_guard({"file_path": os.path.join(self.app, name), "content": "expect(html).toContain('<svg')"})
            self.assertEqual(code, 0, name)

    def test_react_native_svg_component_is_not_an_inline_svg(self):
        code, _ = self.run_guard({"file_path": os.path.join(self.app, "src/Logo.tsx"), "content": "<Svg width={16} />"})
        self.assertEqual(code, 0)

    def test_script_files_are_checked_only_in_apps_that_use_the_design_system(self):
        script = {"file_path": os.path.join(self.app, "src/qr.ts"), "content": "const markup = `<svg>${path}</svg>`"}
        self.assertEqual(self.run_guard(script)[0], 0)
        with open(os.path.join(self.app, "package.json"), "w") as handle:
            json.dump({"name": "presenter", "dependencies": {"@ahaslides-product/design": "^0.157.0"}}, handle)
        self.assertEqual(self.run_guard(script)[0], 2)


if __name__ == "__main__":
    unittest.main()
