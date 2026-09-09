# Changelog

All notable changes to `@ahaslides-product/design`, **newest first**.

**The rule:** every merge adds one entry here **and** bumps `version` in `package.json`.
The top entry's version MUST equal `package.json` → `version` — `standards.mjs` enforces it, so a
PR that forgets either goes red. The `v<version>` release tag (what `npm publish` ships) matches too.

**Format** — one entry per version:

```
## X.Y.Z — YYYY-MM-DD
### Added        ← new component / prop / token / export
### Changed      ← behaviour or API change to something that already shipped
### Fixed        ← bug / gate / doc fix, no API change
### Removed       ← a removed export / component / token
- one short bullet per change, written for a consumer; link the PR: (#123)
```

Include only the sections you touched. **Versioning is [SemVer](https://semver.org)** — pre-1.0:
an additive change (new component/prop/token) bumps **MINOR** (`0.x.0`); a fix with no API change
bumps **PATCH** (`0.0.x`); a breaking change also bumps MINOR until 1.0, and is called out in the bullet.

## 0.2.0 — 2026-09-09
### Added
- Changelog + version rule: every merge now adds a dated entry to `CHANGELOG.md` and bumps `package.json` → `version`. `standards.mjs` gates it (top entry must match the package version, be dated, and carry ≥1 bullet).

## 0.1.0 — 2026-09-08
### Added
- Initial design system: `--aha-*` tokens, the `<aha-icon>` call-by-name registry, the `aha-checkbox` / `aha-button` / `aha-paywall` leaf elements, the shared DataTable composite (antd theme), the generated agent feeds in `dist/`, and the standards + render gates (`npm run check`).
