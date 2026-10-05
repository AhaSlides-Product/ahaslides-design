#!/usr/bin/env python3
"""Shared Vue 2 detection for every aha-design hook.

Legacy Vue 2 apps get the design system on NEW files only (built with the DS web
components, never the old storybook kit); existing files are left untouched. Each
hook asks this module whether the file it is acting on is an existing file of a
Vue 2 app. Fail-open: anything unreadable or unrecognised answers "not Vue 2",
which keeps the normal behaviour.
"""
import json
import os
import re
import subprocess

MAX_LEVELS = 12
DEP_SECTIONS = ("dependencies", "devDependencies", "peerDependencies")
# The lookbehind skips digits inside a name ("catalog:vue2") or a prerelease tag ("-0").
VERSION = re.compile(r"(<)?(?<![\w.+-])v?(\d+)((?:\.\d+)*)")

VUE2_NOTICE = (
    "[aha-design] This is a legacy Vue 2 app. New screens, components and features are built with the "
    "design system's framework-free web components (<aha-*> from lib/all.js), never with components from "
    "@ahaslides-product/stpancras-storybook-app. Existing screens stay untouched unless the task asks to "
    "change them. See the Vue 2 section of the aha-design skill."
)
STORYBOOK_KIT = "@ahaslides-product/stpancras-storybook-app"


def _nearest_package_json(start):
    directory = os.path.abspath(start or ".")
    if not os.path.isdir(directory):
        directory = os.path.dirname(directory)
    for _ in range(MAX_LEVELS):
        candidate = os.path.join(directory, "package.json")
        if os.path.isfile(candidate):
            return candidate
        parent = os.path.dirname(directory)
        if parent == directory:
            break
        directory = parent
    return None


def _admitted_major(exclusive_upper_bound, major, minor_and_patch):
    # "<3" and "<3.0.0" admit nothing above major 2.
    if exclusive_upper_bound and not minor_and_patch.strip(".0"):
        return int(major) - 1
    return int(major)


def vue_major(start):
    """Major version of the `vue` dependency in the package.json nearest to
    `start` (a file or directory). None when there is none to read, or when the
    declared range spans more than one major."""
    try:
        package_path = _nearest_package_json(start)
        if not package_path:
            return None
        with open(package_path, encoding="utf-8") as handle:
            package = json.load(handle)
        for section in DEP_SECTIONS:
            spec = (package.get(section) or {}).get("vue")
            if not isinstance(spec, str):
                continue
            majors = {_admitted_major(*version) for version in VERSION.findall(spec)}
            if len(majors) == 1:
                return majors.pop()
            if majors:
                return None
    except Exception:
        return None
    return None


def is_vue2(start):
    return vue_major(start) == 2


def _is_in_head(path):
    directory, name = os.path.split(os.path.abspath(path))
    try:
        listed = subprocess.run(["git", "-C", directory, "ls-tree", "--name-only", "HEAD", "--", name],
                                capture_output=True, text=True, timeout=5)
        if listed.returncode != 0:
            return None
        return bool(listed.stdout.strip())
    except Exception:
        return None


def is_existing_file(path):
    """True when `path` is a file that already existed before this change: on disk
    and committed at HEAD. Files that are missing, untracked or only added in the
    working diff are new. Outside git, a file on disk counts as existing."""
    try:
        if not os.path.exists(path):
            return False
        in_head = _is_in_head(path)
        return True if in_head is None else in_head
    except Exception:
        return False


def is_legacy_edit(path):
    """True for an existing file in a Vue 2 app: the one case where the design
    hooks stay silent."""
    return is_vue2(path) and is_existing_file(path)
