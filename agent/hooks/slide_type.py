#!/usr/bin/env python3
"""Recognise a build-less slide type's surface files for the aha-design hooks.

A build-less slide type (the Developer Platform) is a folder of plain files with no package.json
and no src/ segment: presenter.html, audience.html and settings.html, each beside its presenter.js,
audience.js or settings.js. Those names are common in unrelated repos (models/audience.js,
auth/presenter.js), so a file counts only when a surface page in its own folder, or the text being
written, loads the design system from the CDN or the slide platform SDK.

Never raises: any IO problem means "not a slide-type file".
"""
import os
import re
import subprocess

SURFACE_FILE = re.compile(r"^(presenter|audience|settings)\.(html|js)$", re.IGNORECASE)
SURFACE_PAGES = ("presenter.html", "audience.html", "settings.html")
SLIDE_TYPE_MARKER = re.compile(r"ahaslides-design@|aha-slide-plugin|AhaSlidePlugin")
SURFACE_OF = {"presenter": "canvas", "audience": "audience", "settings": "settings"}
PAGE_READ_BYTES = 262144


def _page_carries_marker(page_path):
    try:
        with open(page_path, encoding="utf-8", errors="ignore") as fh:
            return bool(SLIDE_TYPE_MARKER.search(fh.read(PAGE_READ_BYTES)))
    except Exception:
        return False


def is_slide_type_file(absolute_path, written_text=""):
    """True when `absolute_path` is a surface file of a build-less slide type."""
    try:
        if not SURFACE_FILE.match(os.path.basename(absolute_path)):
            return False
        if written_text and absolute_path.lower().endswith(".html") and SLIDE_TYPE_MARKER.search(written_text):
            return True
        folder = os.path.dirname(absolute_path)
        return any(_page_carries_marker(os.path.join(folder, page)) for page in SURFACE_PAGES)
    except Exception:
        return False


def surface_for(path):
    """The DS anti-slop surface a slide-type file is judged on: canvas, audience or settings."""
    stem = os.path.basename(path).lower().split(".")[0]
    return SURFACE_OF.get(stem)


def is_control_surface(path):
    """presenter.* and audience.* carry the slide's own controls; settings.* is product UI."""
    return surface_for(path) in ("canvas", "audience")


def changed_files(cwd):
    """Uncommitted slide-type surface files (base = HEAD, plus untracked), repo-relative and sorted."""
    names = []
    try:
        for command in (["diff", "--name-only", "HEAD"], ["ls-files", "--others", "--exclude-standard"]):
            listed = subprocess.run(["git", "-C", cwd, *command], capture_output=True, text=True, timeout=5)
            if listed.returncode == 0:
                names += listed.stdout.splitlines()
    except Exception:
        return []
    return sorted({name for name in names if is_slide_type_file(os.path.join(cwd, name))})
