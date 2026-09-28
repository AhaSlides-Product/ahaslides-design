# anti-slop — the DS-owned judge store and its accuracy evals

- **`criteria.json`** — the store: one entry per surface, each a list of binary judge criteria
  (`C1…`, or a judge's own letter such as typography's `J1…`). `generate.mjs` compiles it into the
  `anti-slop.md` / `anti-slop.agent.json` feeds.
- **`evals/<surface>/evals.json`** — the accuracy set for that surface: labelled cases a judge must
  score correctly. Fixtures a case points at live next to it under `evals/<surface>/fixtures/`.
- **`evals-harness.mjs`** — validates the sets (deterministic) and scores a model against them (live).

## Eval-set format

```json
{
  "surface": "table",
  "judgedAgainst": "anti-slop/criteria.json surfaces.table",
  "portedFrom": { "plugin": "aha-design", "version": "1.80.0", "commit": "b514997", "judge": "…", "path": "…" },
  "evals": [
    {
      "id": 1,
      "prompt": "Review this …",
      "files": [{ "path": "fixtures/<case>/Screen.html" }],
      "label": "bad-example",
      "expected": { "overall": "NEEDS_FIX", "criteria": { "C2": "FAIL" } },
      "expected_output": "prose a human reads",
      "assertions": ["soft, advisory-only checks"],
      "source": { "judge": "aha-design-table-judge", "id": 2, "remap": "why this case differs from the plugin's" }
    }
  ]
}
```

`expected` is the only thing graded: `overall` (`OK_TO_SHIP` | `NEEDS_FIX`) plus the per-criterion
verdicts the case pins. A `good-control` expects `OK_TO_SHIP` and no FAIL; a `bad-example` expects
`NEEDS_FIX` and at least one FAIL. A criterion a case leaves N/A (e.g. an unused table freeze) is
simply not pinned. `portedFrom` is `null` for a DS-authored set. A DS-authored case in a ported set carries
`source.authored` instead of a plugin id. A plugin case with no DS criterion to grade it against is
left out and listed under the set's optional `notPorted` (`[{ id, reason }]`), so the gap stays visible.

## Tier 1 — deterministic gate (no model, runs in `npm run check` and CI)

`standards.mjs` fails the build unless, for every surface in `criteria.json`:

1. `evals/<surface>/evals.json` exists and names its surface, with unique case ids;
2. every case is well-formed and its label agrees with its expected overall;
3. every expected criterion id exists in that surface's criteria;
4. the set has both a PASS (`good-control`) and a FAIL (`bad-example`) case;
5. every `files[].path` fixture resolves inside the surface's folder;
6. no case cites a frozen plugin snapshot (`contract.json`, `typography.json`, `review.html`, `references/`).

It also fails on an `evals/` folder with no matching surface, and on a broken verdict parser. A
criterion with no FAIL case is a warning: it is unmeasured. Run the same checks alone with
`npm run evals:anti-slop -- --self-test`.

Adding a surface to `criteria.json` therefore means adding its eval set in the same PR.

## Tier 2 — live scoring (model in the loop, run by hand)

```bash
npm run evals:anti-slop -- --surface table --dry-run                  # print the exact prompts, no model call
npm run evals:anti-slop -- --surface table --samples 3                # score one surface
npm run evals:anti-slop -- --all --samples 3 --min-accuracy 0.9       # score every surface, exit 1 below 90 %
npm run evals:anti-slop -- --all --judge-cmd "claude -p --model opus" # choose the headless model call
```

Each case's prompt carries the surface's **store** criteria (id, title, test) and its live DS
targets, then the case and its inlined fixtures; the judge must answer with the verdict table and
an `Overall:` line. So the score measures the DS criteria themselves, not a plugin skill's copy of
them. Each case is sampled `--samples` times (default 3) and majority-voted — one sample is noisy in
both directions. Output: a PASS/FAIL line per case, a per-criterion `expected→got` confusion table
(which criterion the judge gets wrong, which one pass rate hides), and overall accuracy.
`--judge-cmd` receives the prompt on stdin (default `claude -p`); `--timeout` is per call, in seconds.
Before any model call the chosen surfaces' sets must pass the Tier 1 checks. Exit codes: `0` done,
`1` below `--min-accuracy` (or a failed `--self-test`), `2` a usage error, an invalid eval set or a
missing judge command. A judge call that fails or times out is logged and counted as no verdict.

## Writing a case

- Prefer a fixture (real code under `fixtures/`) to prose; it exercises the read-the-code path.
- Isolate: a bad-example should break exactly one criterion so cross-criterion bleed is visible.
- Keep test cases disjoint from any teaching example in the judge's own rubric (no open-book evals).
- Judge against the live DS — cite a contract (`<slug>.agent.json`), `tokens.canonical.json` or the
  doc-site render, never a plugin snapshot.
