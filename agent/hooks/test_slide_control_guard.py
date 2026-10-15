#!/usr/bin/env python3
"""Stdlib unittest suite for the slide-control write guard. Run: python3 test_slide_control_guard.py"""
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

DS_PAGE = '<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/ahaslides-product/ahaslides-design@latest/lib/tokens.css">\n'


class SlideControlGuardTest(unittest.TestCase):
    def setUp(self):
        self.root = tempfile.mkdtemp()
        self.slide = os.path.join(self.root, "slide-types", "quiz")
        os.makedirs(self.slide)
        for page in ("presenter.html", "audience.html", "settings.html"):
            with open(os.path.join(self.slide, page), "w") as handle:
                handle.write(DS_PAGE)

    def tearDown(self):
        shutil.rmtree(self.root)

    def run_guard(self, tool_input, tool_name="Write"):
        payload = json.dumps({"tool_name": tool_name, "tool_input": tool_input, "cwd": self.root})
        out, err = io.StringIO(), io.StringIO()
        with mock.patch.object(sys, "stdin", io.StringIO(payload)), redirect_stdout(out), redirect_stderr(err), \
                mock.patch.object(design_guard.ds_criteria, "load", return_value=None):
            code = design_guard.main()
        return code, err.getvalue()

    def slide_file(self, name):
        return os.path.join(self.slide, name)

    def test_a_raw_button_in_presenter_js_is_blocked_with_the_canvas_replacement(self):
        code, err = self.run_guard({"file_path": self.slide_file("presenter.js"),
                                    "content": "var next = el('button', { class: 'next' }, ['Next']);"})
        self.assertEqual(code, 2)
        self.assertIn("[canvas]", err)
        self.assertIn('<aha-button size="lg">', err)
        self.assertIn("ds-lint-allow: raw-button", err)

    def test_a_raw_button_in_audience_html_is_blocked_with_the_audience_replacement(self):
        code, err = self.run_guard({"file_path": self.slide_file("audience.html"),
                                    "content": DS_PAGE + '<button class="submit">Send</button>'})
        self.assertEqual(code, 2)
        self.assertIn("[audience]", err)
        self.assertIn("<aha-audience-submit>", err)

    def test_a_new_presenter_html_is_recognised_from_its_own_content(self):
        fresh = os.path.join(self.root, "slide-types", "new-slide", "presenter.html")
        code, _ = self.run_guard({"file_path": fresh, "content": DS_PAGE + '<div role="button">Go</div>'})
        self.assertEqual(code, 2)

    def test_size_xl_is_blocked_in_markup_and_in_a_factory_call(self):
        code, err = self.run_guard({"file_path": self.slide_file("presenter.html"),
                                    "content": DS_PAGE + '<aha-button variant="primary" size="xl">Reveal</aha-button>'})
        self.assertEqual(code, 2)
        self.assertIn('size="lg"', err)
        code, _ = self.run_guard({"file_path": self.slide_file("presenter.js"),
                                  "content": "var b = el('aha-button', { variant: v, size: 'xl' }, [label]);"})
        self.assertEqual(code, 2)

    def test_size_xl_after_an_arrow_function_in_the_tag_is_blocked(self):
        code, _ = self.run_guard({"file_path": self.slide_file("presenter.html"),
                                  "content": DS_PAGE + '<aha-button @click="() => go()" size="xl">Reveal</aha-button>'})
        self.assertEqual(code, 2)

    def test_a_longer_element_name_is_not_the_button(self):
        code, _ = self.run_guard({"file_path": self.slide_file("presenter.html"),
                                  "content": DS_PAGE + '<aha-button-group size="xl"></aha-button-group>'})
        self.assertEqual(code, 0)

    def test_the_ds_button_passes(self):
        code, err = self.run_guard({"file_path": self.slide_file("presenter.js"),
                                    "content": "var b = el('aha-button', { variant: v, size: 'lg', shortcut: 'N' }, [label]);\n"
                                               "var inner = b.shadowRoot.querySelector('button');\n"
                                               "b.setAttribute('type', 'button');"})
        self.assertEqual((code, err), (0, ""))

    def test_a_marked_bespoke_control_passes(self):
        code, _ = self.run_guard({"file_path": self.slide_file("audience.js"),
                                  "content": "html += '<button class=\"tile\" draggable=\"true\">'; // ds-lint-allow: raw-button (a draggable tile, the DS ships none)"})
        self.assertEqual(code, 0)

    def test_a_comment_that_names_the_tag_passes(self):
        code, _ = self.run_guard({"file_path": self.slide_file("presenter.js"),
                                  "content": "// never a raw <button> here\nvar a = 1;"})
        self.assertEqual(code, 0)

    def test_an_edit_that_keeps_an_existing_button_passes(self):
        code, _ = self.run_guard({"file_path": self.slide_file("audience.js"),
                                  "old_string": "var tile = el('button', { class: 'tile' });\ntile.textContent = 'A';",
                                  "new_string": "var tile = el('button', { class: 'tile' });\ntile.textContent = 'B';"}, "Edit")
        self.assertEqual(code, 0)

    def test_an_edit_that_adds_a_second_button_is_blocked(self):
        code, _ = self.run_guard({"file_path": self.slide_file("audience.js"),
                                  "old_string": "var tile = el('button', { class: 'tile' });",
                                  "new_string": "var tile = el('button', { class: 'tile' });\nvar more = el('button', { class: 'more' });"}, "Edit")
        self.assertEqual(code, 2)

    def test_rewriting_a_file_with_the_same_buttons_passes(self):
        path = self.slide_file("audience.js")
        with open(path, "w") as handle:
            handle.write("var tile = document.createElement('button');\n")
        code, _ = self.run_guard({"file_path": path, "content": "var tile = document.createElement('button');\nvar a = 1;\n"})
        self.assertEqual(code, 0)

    def test_settings_files_are_left_alone(self):
        code, _ = self.run_guard({"file_path": self.slide_file("settings.html"),
                                  "content": DS_PAGE + '<button class="add">Add</button>'})
        self.assertEqual(code, 0)

    def test_a_small_or_large_settings_field_is_blocked(self):
        for snippet in ('<aha-input size="small" placeholder="Small"></aha-input>',
                        '<aha-counted-input slot="control" size="sm" maxlength="60"></aha-counted-input>',
                        "var word = el('aha-select', { size: 'small' });",
                        '<aha-number-with-unit size="large" unit="tries"></aha-number-with-unit>',
                        '<aha-counted-input slot="control" size="lg" maxlength="60"></aha-counted-input>',
                        "var word = el('aha-input', { size: 'large' });",
                        "{ key: 'tries', control: { type: 'number-with-unit', size: 'lg' } },"):
            code, err = self.run_guard({"file_path": self.slide_file("settings.html"), "content": DS_PAGE + snippet})
            self.assertEqual(code, 2, snippet)
            self.assertIn("[settings]", err)
            self.assertIn("default 40px size", err)

    def test_maxlength_on_aha_input_in_settings_is_blocked(self):
        code, err = self.run_guard({"file_path": self.slide_file("settings.js"),
                                    "content": '<aha-input slot="control" maxlength="60"></aha-input>'})
        self.assertEqual(code, 2)
        self.assertIn("<aha-counted-input", err)

    def test_default_settings_fields_and_audience_sizes_pass(self):
        code, _ = self.run_guard({"file_path": self.slide_file("settings.html"),
                                  "content": DS_PAGE + '<aha-counted-input maxlength="60"></aha-counted-input>\n'
                                             '<aha-number-with-unit unit="tries"></aha-number-with-unit>\n'
                                             '<aha-button size="lg">Add</aha-button>'})
        self.assertEqual(code, 0)
        code, _ = self.run_guard({"file_path": self.slide_file("audience.html"),
                                  "content": DS_PAGE + '<aha-counted-input size="lg" maxlength="30"></aha-counted-input>'})
        self.assertEqual(code, 0)

    def test_a_marked_large_settings_field_passes(self):
        code, _ = self.run_guard({"file_path": self.slide_file("settings.html"),
                                  "content": DS_PAGE + '<aha-input size="large"> <!-- ds-lint-allow: field (preview of the audience field) -->'})
        self.assertEqual(code, 0)

    def test_an_unrelated_repo_with_the_same_file_names_is_left_alone(self):
        for relative in ("models/audience.js", "auth/presenter.js", "public/presenter.html"):
            path = os.path.join(self.root, relative)
            os.makedirs(os.path.dirname(path), exist_ok=True)
            code, err = self.run_guard({"file_path": path, "content": "const b = document.createElement('button');\n<button>x</button>"})
            self.assertEqual((code, err), (0, ""), relative)

    def test_other_files_in_a_slide_folder_are_left_alone(self):
        code, _ = self.run_guard({"file_path": self.slide_file("rail.js"),
                                  "content": "var pin = element(doc, 'button', 'pin');"})
        self.assertEqual(code, 0)


if __name__ == "__main__":
    unittest.main()
