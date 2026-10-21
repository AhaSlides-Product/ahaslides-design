import io
import json
import os
import sys
import unittest
from contextlib import redirect_stdout
from unittest import mock

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import prompt_mandate  # noqa: E402


def run_mandate(prompt):
    payload = json.dumps({"prompt": prompt, "cwd": "/"})
    out = io.StringIO()
    with mock.patch.object(sys, "stdin", io.StringIO(payload)), redirect_stdout(out), \
            mock.patch.object(prompt_mandate.ds_criteria, "load", return_value=None), \
            mock.patch.object(prompt_mandate, "firing_log", None):
        prompt_mandate.main()
    return json.loads(out.getvalue())["hookSpecificOutput"]["additionalContext"]


class ProductLockupMandateTest(unittest.TestCase):
    def test_every_prompt_carries_the_product_lockup_rule(self):
        self.assertIn("<aha-product-lockup", run_mandate("summarise last week's tickets"))

    def test_a_microsite_prompt_gets_the_digest(self):
        context = run_mandate("build the careers microsite")
        self.assertIn("Loop:", context)

    def test_a_landing_page_prompt_is_covered_by_the_design_system(self):
        context = run_mandate("build the new pricing landing page")
        self.assertIn("Loop:", context)
        self.assertIn("no separate marketing web surface", context)
        self.assertNotIn("aha-marketing-skills, not this", context)


class SettingsSkillMandateTest(unittest.TestCase):
    def test_a_settings_prompt_requires_the_settings_design_skill(self):
        context = run_mandate("add a toggle to the course settings panel")
        self.assertIn("ahaslides-design:settings-design", context)
        self.assertIn("no exception", context)

    def test_other_prompts_do_not_carry_the_settings_line(self):
        self.assertNotIn("settings-design", run_mandate("build the new pricing landing page"))


if __name__ == "__main__":
    unittest.main()
