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
        self.assertIn("marketing surface", context)


if __name__ == "__main__":
    unittest.main()
