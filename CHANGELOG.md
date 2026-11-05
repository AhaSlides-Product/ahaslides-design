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

## 0.1073.0 — 2026-11-05

### Added
- Profile header: `<aha-profile-header>`, the top of a person's profile page (144px avatar, 96px under 600px wide; the name at the h3 size, SemiBold 600; the username in text-secondary; a sentence-case details list) with `actions`, `stats` and `nav` slots for `<aha-button>`, a row of `<aha-statistic>` and `<aha-tabs>`. `variant="card"` is the same header as a user card. It reuses `<aha-avatar>` (#703)
- `lib/discourse-profile.css` restyles Discourse's own profile page and user card on the same values (names and stat figures SemiBold, never Bold; section titles without uppercase); the Profile header page has a Discourse tab with the class map and the Admin text overrides that make the profile labels sentence case (#703)

## 0.1059.1 — 2026-11-05

## 0.1072.0 — 2026-11-05

### Added
- Composer: new `<aha-composer>`, the reply box of a forum or comment thread. Collapsed it is a real 40px `<aha-input>` (radius 8), never a div painted as a field; a click, Enter, Space or typing (not focus alone) opens an editor box (Input border, hover and focus ring) with a toolbar of tertiary icon-only `<aha-button>`s on registry glyphs, an uncapped `<aha-counted-textarea>`, an optional preview pane in post-body type (16/24 Regular ink, the host renders the Markdown) and primary Reply / tertiary Cancel. Composed, cancelable `submit` and `cancel` events, plus `open`, `input` and `upload`; Mod+B, Mod+I and Mod+Enter (#705)
- `lib/discourse-composer.css` (export `./discourse-composer.css`): restyles Discourse's own composer (`#reply-control`) on the same values and paints the registry glyphs over its toolbar icons; the Composer page's Discourse theme tab swaps a theme's collapsed pill for `<aha-input>` (#705)

### Fixed
- The countdown points-drain test measures against the time actually left when it reads the value, so a slow CI runner no longer fails it (#705)

## 0.1071.0 — 2026-11-05
### Changed
- Audience judge C3, C5, C9, C13, C14, C19 and C28 now scope a mode C self-paced view (`setting.audienceQuizSelfPaced: true`). Below 480px wide the phone values hold; from 480px type may scale to set caps (question 48px, option labels 40px, scene titles 56px, body 32px, controls and metadata 20px) (a self-painted question is 22px on a phone), the layout may leave one column, and from 960px a stretched phone column fails. The page draws its own single Time's up notice and verdict, because the host draws neither there. `audience.*` and modes A and B do not change. Eight new audience eval cases. (#709)

## 0.1064.0 — 2026-11-05
### Added
- `<aha-poll>` (`@ahaslides-product/design/aha-poll`): a poll or vote block built from `<aha-radio>` or `<aha-checkbox>` rows, a primary `<aha-button>` Vote and `<aha-progressbar>` results with a percent and a vote count, a 14px tertiary voter line, `results="always|on-vote|on-close"` and a closed state. Fires `vote`; the host sets `voted`, `counts` and `voters` (#707)
- `lib/discourse-poll.css` (`@ahaslides-product/design/discourse-poll.css`): a class layer that restyles the Discourse poll plugin's own markup to the Poll values, with a Discourse theme tab mapping each plugin class (#707)
