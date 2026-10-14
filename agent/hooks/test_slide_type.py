#!/usr/bin/env python3
"""Stdlib unittest suite for slide_type.py. Run: python3 test_slide_type.py"""
import os
import subprocess
import sys
import tempfile
import unittest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import slide_type  # noqa: E402

DS_PAGE = '<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/ahaslides-product/ahaslides-design@latest/lib/tokens.css">'
SDK_PAGE = '<script src="https://assets-cdn-public.ahaslides.com/aha-slide-plugin/latest/aha-slide-plugin.global.js"></script>'


def write(root, relative, content=""):
    path = os.path.join(root, relative)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as handle:
        handle.write(content)
    return path


class IsSlideTypeFile(unittest.TestCase):
    def setUp(self):
        self.root = tempfile.mkdtemp()

    def test_every_surface_file_beside_a_page_that_loads_the_ds(self):
        write(self.root, "slide-types/quiz/presenter.html", DS_PAGE)
        for name in ("presenter.html", "presenter.js", "audience.js", "settings.js", "audience.html", "settings.html"):
            self.assertTrue(slide_type.is_slide_type_file(os.path.join(self.root, "slide-types/quiz", name)), name)

    def test_a_page_that_loads_only_the_platform_sdk_counts(self):
        write(self.root, "quiz/audience.html", SDK_PAGE)
        self.assertTrue(slide_type.is_slide_type_file(os.path.join(self.root, "quiz/audience.js")))

    def test_a_new_page_is_recognised_from_the_text_being_written(self):
        path = os.path.join(self.root, "new-slide/presenter.html")
        self.assertTrue(slide_type.is_slide_type_file(path, DS_PAGE))
        self.assertFalse(slide_type.is_slide_type_file(path, "<p>Hello</p>"))

    def test_same_named_files_in_unrelated_repos_are_not_slide_types(self):
        for relative in ("models/audience.js", "auth/presenter.js", "src/api/audience.js", "k6/audience.js"):
            self.assertFalse(slide_type.is_slide_type_file(write(self.root, relative, "module.exports = {}")), relative)

    def test_a_script_is_not_recognised_from_its_own_text(self):
        path = os.path.join(self.root, "lib/audience.js")
        self.assertFalse(slide_type.is_slide_type_file(path, "window.AhaSlidePlugin.create()"))

    def test_a_plain_html_page_with_a_surface_name_is_not_a_slide_type(self):
        self.assertFalse(slide_type.is_slide_type_file(write(self.root, "docs/settings.html", "<h1>Settings</h1>")))

    def test_other_files_in_a_slide_folder_are_not_surface_files(self):
        write(self.root, "quiz/presenter.html", DS_PAGE)
        for name in ("config.js", "handler.js", "index.html", "presenter-editor.js"):
            self.assertFalse(slide_type.is_slide_type_file(os.path.join(self.root, "quiz", name)), name)


class Surfaces(unittest.TestCase):
    def test_each_file_maps_to_its_surface(self):
        self.assertEqual(slide_type.surface_for("quiz/presenter.js"), "canvas")
        self.assertEqual(slide_type.surface_for("quiz/presenter.html"), "canvas")
        self.assertEqual(slide_type.surface_for("quiz/audience.html"), "audience")
        self.assertEqual(slide_type.surface_for("quiz/settings.js"), "settings")

    def test_only_presenter_and_audience_carry_the_slide_controls(self):
        self.assertTrue(slide_type.is_control_surface("quiz/presenter.js"))
        self.assertTrue(slide_type.is_control_surface("quiz/audience.html"))
        self.assertFalse(slide_type.is_control_surface("quiz/settings.js"))
        self.assertFalse(slide_type.is_control_surface("quiz/config.js"))


class ChangedFiles(unittest.TestCase):
    def test_lists_changed_and_untracked_slide_files_only(self):
        with tempfile.TemporaryDirectory() as root:
            subprocess.run(["git", "-C", root, "init", "-q"], check=True)
            subprocess.run(["git", "-C", root, "config", "user.email", "t@t"], check=True)
            subprocess.run(["git", "-C", root, "config", "user.name", "t"], check=True)
            write(root, "slide-types/quiz/presenter.html", DS_PAGE)
            write(root, "slide-types/quiz/presenter.js", "var a = 1;")
            write(root, "models/audience.js", "module.exports = {}")
            subprocess.run(["git", "-C", root, "add", "-A"], check=True)
            subprocess.run(["git", "-C", root, "commit", "-qm", "init"], check=True)
            write(root, "slide-types/quiz/presenter.js", "var a = 2;")
            write(root, "slide-types/quiz/audience.js", "var b = 1;")
            write(root, "models/audience.js", "module.exports = { a: 1 }")
            write(root, "notes.md", "x")
            self.assertEqual(slide_type.changed_files(root),
                             ["slide-types/quiz/audience.js", "slide-types/quiz/presenter.js"])

    def test_a_folder_that_is_not_a_repository_lists_nothing(self):
        with tempfile.TemporaryDirectory() as root:
            self.assertEqual(slide_type.changed_files(root), [])


if __name__ == "__main__":
    unittest.main()
