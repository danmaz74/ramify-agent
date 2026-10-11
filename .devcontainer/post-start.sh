#!/bin/bash
# Runs on every container start (postStartCommand). It only checks:
#
# - the workspace bind mount and the host state mounts are present;
# - the dependency volumes are mounted and owned by this user (a root-owned
#   new volume is given to the user; nothing is installed or reinstalled);
# - the configured tools exist at their pinned versions;
# - the repositories' state, through the read-only status script.
#
# It never installs or updates dependencies, CLIs or checkouts. Any missing
# state is reported and makes the command exit 1.

set -uo pipefail

# shellcheck source=lib.sh
source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

problems=0
problem() {
  echo "NOT READY: $*" >&2
  problems=$((problems + 1))
}

echo "=== Mounts"
if is_mount_point "$WORKSPACE_ROOT"; then
  echo "workspace: $WORKSPACE_ROOT is mounted"
else
  problem "$WORKSPACE_ROOT is not a mount; the workspace parent must be bind-mounted there"
fi
for path in "$HOME/.gitconfig" "$HOME/.ssh" "$HOME/.claude" "$HOME/.codex" "$HOME/.pi"; do
  if is_mount_point "$path"; then
    echo "host state: $path is mounted"
  else
    problem "$path is not mounted from the host; see docs/development/workspace.md"
  fi
done
while IFS= read -r dir; do
  if is_mount_point "$dir"; then
    echo "dependency volume: $dir"
  else
    problem "$dir is not a dependency volume mount"
  fi
done < <(all_dependency_dirs)
align_dependency_volume_ownership || problem "a dependency volume is not writable by $(id -un)"

echo ""
echo "=== Tools"
require_version() {
  local label="$1" expected="$2" actual="$3"
  if [[ -z "$actual" ]]; then
    problem "$label is not available"
  elif [[ -n "$expected" && "$actual" != "$expected" ]]; then
    problem "$label is $actual, expected the pinned $expected (rebuild the image; startup never updates it)"
  else
    echo "$label $actual"
  fi
}
global_package_version() {
  local file
  file="$(npm root -g 2>/dev/null)/$1/package.json"
  [[ -f "$file" ]] && node -p "require('$file').version" 2>/dev/null
}
node_major="$(node -p 'process.versions.node.split(".")[0]' 2>/dev/null)"
require_version "Node.js major" 22 "$node_major"
require_version npm "" "$(npm --version 2>/dev/null)"
require_version git "" "$(git --version 2>/dev/null)"
require_version ripgrep "" "$(rg --version 2>/dev/null | head -n 1)"
require_version jq "" "$(jq --version 2>/dev/null)"
require_version chromium "" "$("${CHROME_BIN:-/usr/bin/chromium}" --version 2>/dev/null)"
require_version "Claude Code" "${CLAUDE_CODE_VERSION:-}" "$(global_package_version @anthropic-ai/claude-code)"
require_version "Codex CLI" "${CODEX_VERSION:-}" "$(global_package_version @openai/codex)"
require_version "Playwright MCP" "${PLAYWRIGHT_MCP_VERSION:-}" "$(global_package_version @playwright/mcp)"

echo ""
echo "=== Repositories"
bash "$RAMIFY_DEVCONTAINER_DIR/status.sh" || problem "the workspace is incomplete; run bash $RAMIFY_DEVCONTAINER_DIR/setup.sh"

if ((problems > 0)); then
  echo "" >&2
  echo "post-start: $problems problem(s); the container is not ready" >&2
  exit 1
fi
echo ""
echo "post-start: ready"
