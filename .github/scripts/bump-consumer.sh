#!/usr/bin/env bash
# Usage: bump-consumer.sh <consumer checkout> <design-system checkout> <new version>
# Env: REPO BASE PACKAGE_DIR LOCKFILE_DIR PACKAGE_MANAGER LOCKFILE GH_TOKEN
set -euo pipefail

consumer_dir=$1
design_dir=$2
new_version=$3
package_name='@ahaslides-product/design'
bump_branch='ds/auto-bump'
design_repo_url="https://github.com/AhaSlides-Product/ahaslides-design"

cd "$consumer_dir"
package_json="$PACKAGE_DIR/package.json"
old_version=$(node -e '
  const manifest = require(require("path").resolve(process.argv[1]));
  const sections = ["dependencies", "devDependencies", "peerDependencies", "optionalDependencies"];
  const range = sections.map((section) => (manifest[section] || {})[process.argv[2]]).find(Boolean) || "";
  process.stdout.write(range.replace(/^[^0-9]*/, ""));
' "$package_json" "$package_name")

if [ -z "$old_version" ]; then
  echo "::warning::$REPO does not depend on $package_name in $package_json; skipping."
  exit 0
fi
if [ "$old_version" = "$new_version" ]; then
  echo "$REPO already pins $package_name@$new_version on $BASE; nothing to bump."
  exit 0
fi

sed -E -i "s#(\"$package_name\"[[:space:]]*:[[:space:]]*\")[^\"]*\"#\1$new_version\"#" "$package_json"

(
  cd "$LOCKFILE_DIR"
  case "$PACKAGE_MANAGER" in
    npm)  npm install --package-lock-only --ignore-scripts --no-audit --no-fund ;;
    # CI=true makes pnpm default to a frozen lockfile, which is the opposite of what a bump needs.
    pnpm) pnpm install --lockfile-only --ignore-scripts --no-frozen-lockfile ;;
    # Yarn 1 has no lockfile-only mode, so this is a full install.
    yarn) yarn install --ignore-scripts --ignore-engines --non-interactive --network-timeout 600000 ;;
    *)    echo "::error::Unknown package manager '$PACKAGE_MANAGER' for $REPO"; exit 1 ;;
  esac
)

git config user.name  "github-actions[bot]"
git config user.email "github-actions[bot]@users.noreply.github.com"
git checkout -B "$bump_branch"
git add "$package_json" "$LOCKFILE"
git commit -m "chore(deps): bump $package_name to $new_version"
git push --force origin "$bump_branch"

title="chore(deps): bump $package_name $old_version → $new_version"
body_file=$(mktemp)
{
  echo "Automatic design system bump, opened by the \`ahaslides-design\` publish workflow."
  echo
  echo "1. \`$package_name\`: \`$old_version\` → \`$new_version\` (exact pin), lockfile regenerated with $PACKAGE_MANAGER."
  echo "2. Changelog: [CHANGELOG.md at v$new_version]($design_repo_url/blob/v$new_version/CHANGELOG.md) · [diff v$old_version...v$new_version]($design_repo_url/compare/v$old_version...v$new_version)"
  echo "3. Not auto-merged. Check the app, then merge. The next DS release force-pushes \`$bump_branch\` and refreshes this PR."
  echo
  echo "<details><summary>Changelog entries $old_version → $new_version</summary>"
  echo
  # PR bodies are capped at 65536 characters.
  node "$design_dir/.github/scripts/changelog-between.mjs" "$design_dir/CHANGELOG.md" "$old_version" "$new_version" | head -c 55000
  echo
  echo "</details>"
} > "$body_file"

existing_pr=$(gh pr list --repo "$REPO" --head "$bump_branch" --base "$BASE" --state open --json number --jq '.[0].number // empty')
if [ -n "$existing_pr" ]; then
  gh pr edit "$existing_pr" --repo "$REPO" --title "$title" --body-file "$body_file"
  echo "Updated $REPO#$existing_pr"
else
  gh pr create --repo "$REPO" --base "$BASE" --head "$bump_branch" --title "$title" --body-file "$body_file"
fi
