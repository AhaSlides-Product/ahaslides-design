# Changelog

All notable changes to `@ahaslides-product/design`, **newest first**.

**The rule:** every merge adds one entry here. Who sets the version depends on the repo variable
`AUTO_VERSION`:

- **Off (the default): you bump it.** The entry heads as `## X.Y.Z — YYYY-MM-DD` and the PR sets
  `version` in `package.json` and `agent/.claude-plugin/plugin.json` to the same `X.Y.Z`. The top
  entry's version MUST equal `package.json` → `version` — `standards.mjs` enforces it, so a PR that
  forgets either goes red. The `v<version>` release tag (what `npm publish` ships) matches too.
- **On: the merge bumps it.** The entry heads as `## Unreleased` and the PR never touches a version
  file. On merge, `publish.yml` (`auto-version.mjs`) picks the number (an entry with only `### Fixed`
  is a patch, anything else a minor; a `Version-bump: patch|minor|major|none` line in the PR body
  overrides it), turns the heading into `## X.Y.Z — YYYY-MM-DD`, fills each `(#504)` with the real
  number and commits `chore(release): X.Y.Z` to master. Run the gate locally as `AUTO_VERSION=on npm run check`.

The gate rejects an unfilled `(#129)` placeholder in every released entry: link the **real** PR number
(under `## Unreleased`, `(#518)` is fine; the release fills it in).

**Format** — one entry per version:

```
## X.Y.Z — YYYY-MM-DD   ← "## Unreleased" instead while AUTO_VERSION is on
### Added        ← new component / prop / token / export
### Changed      ← behaviour or API change to something that already shipped
### Fixed        ← bug / gate / doc fix, no API change
### Removed       ← a removed export / component / token
- one short bullet per change, written for a consumer; link the real PR: (#123) — never a bare (#125)
```

Include only the sections you touched. **Versioning is [SemVer](https://semver.org)** — pre-1.0:
an additive change (new component/prop/token) bumps **MINOR** (`0.x.0`); a fix with no API change
bumps **PATCH** (`0.0.x`); a breaking change also bumps MINOR until 1.0, and is called out in the bullet.



## 0.1073.0 — 2026-11-06
### Fixed
- Audience C5, C7 and C23 and canvas C7 and C12 no longer send a Developer Platform judge to `manifest.json`, which those pages do not have. They read the flag from `entry_setting` in the judge brief. (#129)

## 0.1071.0 — 2026-11-05
### Changed
- Audience judge C3, C5, C9, C13, C14, C19 and C28 now scope a mode C self-paced view (`setting.audienceQuizSelfPaced: true`). Below 480px wide the phone values hold; from 480px type may scale to set caps (question 48px, option labels 40px, scene titles 56px, body 32px, controls and metadata 20px) (a self-painted question is 22px on a phone), the layout may leave one column, and from 960px a stretched phone column fails. The page draws its own single Time's up notice and verdict, because the host draws neither there. `audience.*` and modes A and B do not change. Eight new audience eval cases. (#709)

## 0.1064.0 — 2026-11-05
### Added
- `<aha-poll>` (`@ahaslides-product/design/aha-poll`): a poll or vote block built from `<aha-radio>` or `<aha-checkbox>` rows, a primary `<aha-button>` Vote and `<aha-progressbar>` results with a percent and a vote count, a 14px tertiary voter line, `results="always|on-vote|on-close"` and a closed state. Fires `vote`; the host sets `voted`, `counts` and `voters` (#707)
- `lib/discourse-poll.css` (`@ahaslides-product/design/discourse-poll.css`): a class layer that restyles the Discourse poll plugin's own markup to the Poll values, with a Discourse theme tab mapping each plugin class (#707)
