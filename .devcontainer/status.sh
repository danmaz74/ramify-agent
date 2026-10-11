#!/bin/bash
# Prints the state of the three repositories and the agent's installed
# provider releases. Read-only: it writes nothing, not even Git's index cache.
#
#   bash .devcontainer/status.sh
#
# Exits 1 when a repository is missing or invalid, or when an installed
# provider release differs from the agent's pin.

set -uo pipefail

# shellcheck source=lib.sh
source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

status=0

describe_repository() {
  local name="$1" dir="$2" default="${3:-}"
  local branch head subject remotes changes staged unstaged untracked
  echo "$name"
  echo "  path:     $dir"
  if [[ ! -e "$dir" ]]; then
    echo "  state:    MISSING (run .devcontainer/setup.sh)"
    status=1
    return
  fi
  if ! is_checkout_root "$dir"; then
    echo "  state:    NOT A GIT CHECKOUT ROOT"
    status=1
    return
  fi
  remotes="$(git -C "$dir" config --get-regexp '^remote\..*\.url$' | sed -E 's/^remote\.(.*)\.url /\1 /')"
  echo "  remotes:  ${remotes:-none}" | sed '2,$s/^/            /'
  branch="$(git -C "$dir" symbolic-ref --short -q HEAD || echo '(detached HEAD)')"
  echo "  branch:   $branch"
  if head="$(git -C "$dir" rev-parse -q --verify HEAD)"; then
    subject="$(git -C "$dir" log -1 --format=%s HEAD)"
    echo "  HEAD:     $head $subject"
  else
    head=""
    echo "  HEAD:     (no commit)"
  fi
  if [[ -n "$default" ]]; then
    if [[ "$head" == "$default" ]]; then
      echo "  manifest: at the setup default $default"
    else
      echo "  manifest: setup default is $default (informational; checkouts are never moved)"
    fi
  fi
  if ! changes="$(git --no-optional-locks -C "$dir" status --porcelain=v1 --untracked-files=normal)"; then
    echo "  dirty:    UNKNOWN (git status failed)"
    status=1
    return
  fi
  staged="$(grep -c '^[MADRCT]' <<<"$changes")"
  unstaged="$(grep -c '^.[MADRCT]' <<<"$changes")"
  untracked="$(grep -c '^??' <<<"$changes")"
  if [[ -z "$changes" ]]; then
    echo "  dirty:    clean"
  else
    echo "  dirty:    $staged staged, $unstaged unstaged, $untracked untracked"
  fi
}

describe_repository ramify-agent "$AGENT_ROOT"
if manifest="$(read_companion_manifest)"; then
  while read -r name _url commit; do
    describe_repository "$name" "$WORKSPACE_ROOT/$name" "$commit"
  done <<<"$manifest"
else
  echo "companion manifest: INVALID ($COMPANION_MANIFEST)"
  status=1
fi

echo "ramify-agent provider releases (installed in its node_modules; never a companion checkout)"
# shellcheck disable=SC2016 # JavaScript, not shell
providers="$(node -e '
  const fs = require("node:fs");
  const root = process.argv[1];
  const manifest = JSON.parse(fs.readFileSync(`${root}/package.json`, "utf8"));
  let mismatch = false;
  for (const name of ["ramify.ts", "ramify-audit"]) {
    const pin = manifest.dependencies?.[name] ?? "(not declared)";
    let installed = "NOT INSTALLED";
    try { installed = JSON.parse(fs.readFileSync(`${root}/node_modules/${name}/package.json`, "utf8")).version; } catch {}
    const verdict = installed === pin ? "matches pin" : "DIFFERS FROM PIN";
    if (installed !== pin) mismatch = true;
    console.log(`  ${name}: pin ${pin}, installed ${installed} (${verdict})`);
  }
  process.exit(mismatch ? 1 : 0);
' "$AGENT_ROOT")" || status=1
echo "$providers"

exit "$status"
