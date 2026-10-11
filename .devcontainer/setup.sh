#!/bin/bash
# Prepares the three-repository workspace. Runs once as the devcontainer's
# postCreateCommand; rerun it explicitly after a lockfile changes:
#
#   bash .devcontainer/setup.sh
#
# 1. Verifies every companion path before changing anything. An existing
#    companion must be the top level of a Git checkout with a remote naming
#    the manifest's repository; anything else stops setup untouched.
# 2. Clones each missing companion at its manifest commit onto the local
#    branch dev/workspace. An existing checkout is never fetched, pulled,
#    checked out, reset or cleaned: its branch, HEAD, index, files and remotes
#    stay as they are, whatever the manifest now says.
# 3. Creates the workspace's worktrees/ and evidence/ directories.
# 4. Runs each project's own dependency preparation on its current lockfiles.
#    It runs no test suite and links nothing between the projects.
#
# A failure stops setup with a nonzero status and names the step. Fix the
# cause and run setup again: completed clones are kept, an interrupted clone
# is started again, and authored work is never removed.

set -euo pipefail

# shellcheck source=lib.sh
source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

fail() {
  echo "" >&2
  echo "setup: FAILED: $*" >&2
  echo "setup: existing checkouts keep their branch, HEAD and files. Fix the cause and rerun:" >&2
  echo "  bash $RAMIFY_DEVCONTAINER_DIR/setup.sh" >&2
  exit 1
}

run_in() {
  local dir="$1"
  shift
  echo "+ (cd $dir && $*)"
  (cd "$dir" && "$@") || fail "'$*' in $dir exited with status $?"
}

# Docker creates an absent companion's directory, and the parents of its
# dependency mount points, owned by root. Give those (and only those) to the
# current user so the clone can be placed there.
take_created_directories() {
  local name="$1" dir="$WORKSPACE_ROOT/$1" mount parent
  local -a paths=("$dir")
  while IFS= read -r mount; do
    parent="$(dirname "$mount")"
    while [[ "$parent" != . ]]; do
      paths+=("$dir/$parent")
      parent="$(dirname "$parent")"
    done
  done < <(companion_dependency_dirs "$name")
  for parent in "${paths[@]}"; do
    if [[ -d "$parent" && "$(stat -c %u "$parent")" == 0 && "$(id -u)" != 0 ]]; then
      sudo -n chown "$(id -u):$(id -g)" "$parent" || fail "could not take ownership of $parent"
    fi
  done
}

clone_companion() {
  local name="$1" url="$2" commit="$3"
  local dir="$WORKSPACE_ROOT/$name" stage="$STAGING_ROOT/$name"
  echo ""
  echo "=== Cloning $name from $url at $commit"
  # Left by an interrupted earlier attempt; it holds only Git metadata.
  rm -rf -- "$stage"
  mkdir -p "$STAGING_ROOT"
  git clone --no-checkout -- "$url" "$stage" || fail "could not clone $url"
  if ! git -C "$stage" cat-file -e "$commit^{commit}" 2>/dev/null; then
    git -C "$stage" fetch origin "$commit" || fail "$url does not provide commit $commit"
  fi
  git -C "$stage" cat-file -e "$commit^{commit}" 2>/dev/null || fail "$url does not provide commit $commit"
  git -C "$stage" branch --no-track "$DEVELOPMENT_BRANCH" "$commit"
  git -C "$stage" symbolic-ref HEAD "refs/heads/$DEVELOPMENT_BRANCH"

  mkdir -p "$dir"
  take_created_directories "$name"
  mv -- "$stage/.git" "$dir/.git" || fail "could not move the clone into $dir"
  rmdir -- "$stage"
  rmdir -- "$STAGING_ROOT" 2>/dev/null || true
  git -C "$dir" checkout --force --quiet "$DEVELOPMENT_BRANCH" \
    || fail "could not check out $DEVELOPMENT_BRANCH in $dir; inspect it with git status before rerunning"
  echo "$name is on $DEVELOPMENT_BRANCH at $(git -C "$dir" rev-parse HEAD)"
}

echo "=== ramify-agent workspace setup"
echo "Workspace: $WORKSPACE_ROOT"
echo "Agent:     $AGENT_ROOT"

is_checkout_root "$AGENT_ROOT" || fail "$AGENT_ROOT is not the top level of a Git checkout"

manifest="$(read_companion_manifest)" || fail "invalid companion manifest $COMPANION_MANIFEST"

# 1. Verify every companion path before changing anything.
declare -a to_clone=() refusals=()
while read -r name url commit; do
  dir="$WORKSPACE_ROOT/$name"
  if [[ ! -e "$dir" && ! -L "$dir" ]]; then
    echo "$name: absent; will clone $url at $commit"
    to_clone+=("$name $url $commit")
  elif [[ -L "$dir" || ! -d "$dir" ]]; then
    refusals+=("$dir exists but is not a directory")
  elif [[ -e "$dir/.git" ]]; then
    if ! is_checkout_root "$dir"; then
      refusals+=("$dir has .git but Git does not accept it as a checkout root: $(git -C "$dir" rev-parse --show-toplevel 2>&1 | head -n 1)")
    elif ! has_expected_remote "$dir" "$url"; then
      refusals+=("$dir is a checkout of another repository; expected a remote for $url, found: $(git -C "$dir" config --get-regexp '^remote\..*\.url$' | tr '\n' ' ')")
    else
      echo "$name: existing checkout on $(git -C "$dir" symbolic-ref --short -q HEAD || echo 'detached HEAD') at $(git -C "$dir" rev-parse --short HEAD); left as it is"
    fi
  elif holds_only_dependency_mounts "$dir" "$name"; then
    echo "$name: only dependency mount points present; will clone $url at $commit"
    to_clone+=("$name $url $commit")
  else
    refusals+=("$dir is not a Git checkout and is not empty")
  fi
done <<<"$manifest"

if ((${#refusals[@]} > 0)); then
  printf 'setup: refused: %s\n' "${refusals[@]}" >&2
  fail "move or rename the refused path, or replace it with a checkout of the expected repository"
fi

# 2. Clone missing companions.
for entry in "${to_clone[@]}"; do
  read -r name url commit <<<"$entry"
  clone_companion "$name" "$url" "$commit"
done

# 3. Persistent workspace directories.
mkdir -p "$WORKSPACE_ROOT/worktrees" "$WORKSPACE_ROOT/evidence"

# 4. Each project's own dependency preparation, on its current lockfiles.
align_dependency_volume_ownership || fail "dependency volumes are not writable"

echo ""
echo "=== Preparing ramify-agent (npm ci)"
run_in "$AGENT_ROOT" npm ci

echo ""
echo "=== Preparing ramify (npm ci, reference example, site)"
run_in "$WORKSPACE_ROOT/ramify" npm ci
run_in "$WORKSPACE_ROOT/ramify" npm --prefix examples/collection-review ci
run_in "$WORKSPACE_ROOT/ramify" npm --prefix site ci

echo ""
echo "=== Preparing ramify-audit (npm ci, whose prepare script builds it)"
run_in "$WORKSPACE_ROOT/ramify-audit" npm ci

# A headless browser for Claude Code, at the version the image installed.
# Only an absent registration is added; an existing one is left alone.
if command -v claude >/dev/null 2>&1 && command -v playwright-mcp >/dev/null 2>&1; then
  if ! claude mcp get playwright >/dev/null 2>&1; then
    echo ""
    echo "=== Registering the Playwright MCP server with Claude Code"
    claude mcp add playwright --scope user -- playwright-mcp --headless --browser chromium \
      --executable-path /usr/bin/chromium --isolated --no-sandbox --caps devtools \
      || fail "could not register the Playwright MCP server with Claude Code"
  fi
fi

echo ""
echo "=== Setup complete"
bash "$RAMIFY_DEVCONTAINER_DIR/status.sh"
