#!/usr/bin/env python3
"""Load the AhaSlides design system's anti-slop judge criteria for the hooks.

The DS owns the criteria in `anti-slop/criteria.json`; the hooks only point at
them. Resolution order:

  1. AHA_DESIGN_CRITERIA_FILE, when set (a criteria.json or anti-slop.agent.json);
  2. the installed package — `node_modules/@ahaslides-product/design/anti-slop/criteria.json`
     found by walking up from the working directory, so a repo is judged on the
     DS version it builds against;
  3. the copy this plugin ships, `anti-slop/criteria.json` at the plugin root,
     written by the DS generator from the same release as these hooks.

No network: the plugin always carries its own release's criteria.
`load()` never raises: with no readable source it returns None and the caller degrades.
Both shapes (package store and feed) carry `surfaces.<key>.criteria[]`, so the
result is normalised to {"source": str, "surfaces": {key: [{id, title, test}]}}.
"""
import json
import os

PACKAGE = os.path.join("node_modules", "@ahaslides-product", "design")
PACKAGE_CRITERIA = os.path.join(PACKAGE, "anti-slop", "criteria.json")
FEED_SITE = "https://design.ahaslides.io"
LLMS_URL = FEED_SITE + "/llms.txt"
ANTI_SLOP_MD_URL = FEED_SITE + "/anti-slop.md"

PLUGIN_ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
BUNDLED_CRITERIA = os.path.join(PLUGIN_ROOT, "anti-slop", "criteria.json")
PLUGIN_MANIFEST = os.path.join(PLUGIN_ROOT, ".claude-plugin", "plugin.json")
PARENT_LEVELS_SEARCHED = 6


def _normalise(document):
    surfaces = document.get("surfaces") if isinstance(document, dict) else None
    if not isinstance(surfaces, dict) or not surfaces:
        return None
    out = {}
    for key, entry in surfaces.items():
        criteria = entry.get("criteria") if isinstance(entry, dict) else None
        if not isinstance(criteria, list):
            continue
        out[key] = [
            {"id": str(c.get("id", "")), "title": str(c.get("title", "")), "test": str(c.get("test", ""))}
            for c in criteria if isinstance(c, dict)
        ]
    return out or None


def _read_json(path):
    with open(path, encoding="utf-8") as fh:
        return json.load(fh)


def _version_of(manifest_path):
    try:
        return str(_read_json(manifest_path).get("version") or "")
    except Exception:
        return ""


def _tagged(kind, version):
    return kind + "@" + version if version else kind


def find_package(cwd):
    directory = os.path.abspath(cwd or ".")
    for _ in range(PARENT_LEVELS_SEARCHED):
        if os.path.isfile(os.path.join(directory, PACKAGE_CRITERIA)):
            return os.path.join(directory, PACKAGE)
        parent = os.path.dirname(directory)
        if parent == directory:
            break
        directory = parent
    return None


def _from_package(cwd):
    root = find_package(cwd)
    if not root:
        return None
    try:
        surfaces = _normalise(_read_json(os.path.join(root, "anti-slop", "criteria.json")))
    except Exception:
        return None
    if not surfaces:
        return None
    return {"source": _tagged("package", _version_of(os.path.join(root, "package.json"))), "surfaces": surfaces}


def _from_plugin():
    try:
        surfaces = _normalise(_read_json(BUNDLED_CRITERIA))
    except Exception:
        return None
    if not surfaces:
        return None
    return {"source": _tagged("plugin", _version_of(PLUGIN_MANIFEST)), "surfaces": surfaces}


def load(cwd=None):
    try:
        explicit = os.environ.get("AHA_DESIGN_CRITERIA_FILE")
        if explicit:
            surfaces = _normalise(_read_json(explicit))
            return {"source": "file", "surfaces": surfaces} if surfaces else None
        return _from_package(cwd or os.getcwd()) or _from_plugin()
    except Exception:
        return None


def criteria_lines(result, surface, limit=None):
    """`C1 title` lines for one surface, or [] when unknown."""
    if not result:
        return []
    criteria = result["surfaces"].get(surface) or []
    if limit is not None:
        criteria = criteria[:limit]
    return ["{} {}".format(c["id"], c["title"]) for c in criteria]
