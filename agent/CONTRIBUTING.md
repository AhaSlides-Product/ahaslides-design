# Changing the agent plugin

`agent/` is the `ahaslides-design` Claude Code plugin, listed by the repo-root
`.claude-plugin/marketplace.json` and released with every version of this repo. It is a **shim**:
the DS owns every rule, component, token, composition guideline and anti-slop judge criterion,
and the eval sets that measure the judge. The plugin only makes the DS fire: one skill that
reads it, and hooks that force that skill into the work.

## Where a change goes

| You want to… | Change it in |
|---|---|
| Add or edit a rule, a judge criterion, a surface, or a judge eval case | `anti-slop/criteria.json`, `anti-slop/evals/<surface>/`, `guidelines/` (repo root) |
| Change how the loop is run (sources, report shape, fix rounds) | `agent/skills/aha-design/SKILL.md` |
| Make a code pattern route to a DS surface at write time | `agent/hooks/rules.json` (`surface`, `action`, `signature`, `message`) |
| Route an impeccable anti-pattern to a DS surface | `agent/hooks/slop_rules.json` |
| Change which surfaces the end-of-turn judge asks for | `FILE_SURFACE_HINTS` in `agent/hooks/design_judge_stop.py` |

Never copy rule text into the plugin — a copy drifts from the DS. Messages in `rules.json` name
the surface and the one thing the write got wrong; the criteria come from the DS at run time.

## Where the criteria come from

`agent/hooks/ds_criteria.py`: the installed package's `anti-slop/criteria.json` (the version the
consumer builds against), else `agent/anti-slop/criteria.json`. A marketplace install copies only
`agent/`, so that copy is written by `generate.mjs` from the store; never edit it by hand. Every
hook logs which source it used to `agent/.impeccable/firing-log.jsonl`;
`python3 agent/hooks/firing_status.py` reads it.

## Checks

`npm run check` covers it: `standards.mjs` fails when `agent/.claude-plugin/plugin.json`'s
version differs from `package.json` or the criteria copy differs from the store, and
`node --test tests/*.test.mjs` runs every `agent/hooks/test_*.py` suite (also in CI). One suite
by hand: `python3 agent/hooks/test_ds_criteria.py`.
