# shellcheck shell=bash
# Definitions shared by setup.sh, post-start.sh and status.sh. Sourced, never run.
#
# Every path derives from this file's location: the agent checkout is the
# parent of .devcontainer/, and the workspace is the agent checkout's parent.
# In the container that is /workspaces/ramify-agent and /workspaces.

RAMIFY_DEVCONTAINER_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
AGENT_ROOT="$(cd "$RAMIFY_DEVCONTAINER_DIR/.." && pwd -P)"
WORKSPACE_ROOT="$(cd "$AGENT_ROOT/.." && pwd -P)"
COMPANION_MANIFEST="$RAMIFY_DEVCONTAINER_DIR/companion-repos.json"
COMPANIONS=(ramify ramify-audit)
# The local branch a fresh companion clone is created on, at the manifest commit.
# shellcheck disable=SC2034 # used by setup.sh
DEVELOPMENT_BRANCH="dev/workspace"
# Setup-owned scratch for clones in progress; it never holds a working tree.
# shellcheck disable=SC2034 # used by setup.sh
STAGING_ROOT="$WORKSPACE_ROOT/.setup-staging"

# Dependency directories docker-compose.yml mounts as named volumes, relative
# to each checkout. Keep these lists equal to the compose volumes.
AGENT_DEPENDENCY_DIRS=(node_modules)
companion_dependency_dirs() {
  case "$1" in
    ramify) printf '%s\n' node_modules site/node_modules examples/collection-review/node_modules ;;
    ramify-audit) printf '%s\n' node_modules ;;
    *) return 1 ;;
  esac
}

# Every dependency volume path, absolute.
all_dependency_dirs() {
  local dir name
  for dir in "${AGENT_DEPENDENCY_DIRS[@]}"; do printf '%s\n' "$AGENT_ROOT/$dir"; done
  for name in "${COMPANIONS[@]}"; do
    while IFS= read -r dir; do printf '%s\n' "$WORKSPACE_ROOT/$name/$dir"; done < <(companion_dependency_dirs "$name")
  done
}

# Prints "<name> <url> <commit>" for each companion, or fails when the manifest
# does not declare exactly ramify and ramify-audit with an HTTPS URL and a full
# commit ID each.
read_companion_manifest() {
  # shellcheck disable=SC2016 # JavaScript, not shell
  node -e '
    const fs = require("node:fs");
    const file = process.argv[1];
    let data;
    try { data = JSON.parse(fs.readFileSync(file, "utf8")); }
    catch (error) { console.error(`cannot read ${file}: ${error.message}`); process.exit(2); }
    const names = ["ramify", "ramify-audit"];
    const keys = data && typeof data === "object" && !Array.isArray(data) ? Object.keys(data) : [];
    if (keys.length !== names.length || !names.every(name => keys.includes(name))) {
      console.error(`${file} must declare exactly "ramify" and "ramify-audit"`);
      process.exit(2);
    }
    for (const name of names) {
      const entry = data[name];
      const valid = entry && typeof entry === "object"
        && Object.keys(entry).every(key => key === "url" || key === "commit")
        && typeof entry.url === "string" && /^https:\/\/\S+$/.test(entry.url)
        && typeof entry.commit === "string" && /^[0-9a-f]{40}$/.test(entry.commit);
      if (!valid) {
        console.error(`${file}: "${name}" needs exactly an https "url" and a full 40-character "commit"`);
        process.exit(2);
      }
      console.log(`${name} ${entry.url} ${entry.commit}`);
    }
  ' "$COMPANION_MANIFEST"
}

# Reduces a Git remote URL to host/owner/repository in lower case, so the
# HTTPS, SSH and scp-like spellings of one GitHub repository compare equal.
normalize_remote() {
  local url="$1"
  url="${url%/}"
  url="${url%.git}"
  url="${url%/}"
  case "$url" in
    *://*) url="${url#*://}"; url="${url#*@}" ;;
    *@*:*) url="${url#*@}"; url="${url/://}" ;;
  esac
  printf '%s\n' "$url" | tr '[:upper:]' '[:lower:]'
}

# True when the directory is the top level of a Git checkout (a main working
# tree or a linked worktree).
is_checkout_root() {
  local dir="$1" top real
  top="$(git -C "$dir" rev-parse --show-toplevel 2>/dev/null)" || return 1
  real="$(cd "$dir" && pwd -P)" || return 1
  [[ "$top" == "$real" ]]
}

# True when the checkout has a remote whose URL names the expected repository.
has_expected_remote() {
  local dir="$1" expected="$2" key url
  expected="$(normalize_remote "$expected")"
  while read -r key url; do
    [[ -n "$key" ]] || continue
    [[ "$(normalize_remote "$url")" == "$expected" ]] && return 0
  done < <(git -C "$dir" config --get-regexp '^remote\..*\.url$' 2>/dev/null)
  return 1
}

# True when an existing companion directory holds nothing but the dependency
# mount points Docker creates for its volumes, and their parent directories.
# Docker creates them on the host before setup runs when the companion is
# absent, so such a directory counts as absent.
holds_only_dependency_mounts() {
  local dir="$1" name="$2" entry rel mount allowed
  local -a mounts prune=()
  mapfile -t mounts < <(companion_dependency_dirs "$name")
  for mount in "${mounts[@]}"; do prune+=(-path "$dir/$mount" -prune -o); done
  while IFS= read -r -d '' entry; do
    rel="${entry#"$dir"/}"
    allowed=no
    if [[ -d "$entry" && ! -L "$entry" ]]; then
      for mount in "${mounts[@]}"; do
        if [[ "$mount" == "$rel"/* ]]; then allowed=yes; break; fi
      done
    fi
    [[ "$allowed" == yes ]] || return 1
  done < <(find "$dir" -mindepth 1 "${prune[@]}" -print0)
  return 0
}

# True when the path is a mount point (directory or file bind mount, or volume).
is_mount_point() {
  local path
  path="$(realpath -m "$1")"
  awk -v p="$path" '{ gsub(/\\040/, " ", $5); if ($5 == p) found = 1 } END { exit found ? 0 : 1 }' /proc/self/mountinfo
}

# Gives root-owned dependency volumes to the current user. Docker creates a
# new named volume owned by root; nothing is reinstalled here.
align_dependency_volume_ownership() {
  local dir status=0
  while IFS= read -r dir; do
    [[ -d "$dir" ]] || continue
    if [[ "$(stat -c %u "$dir")" == 0 && "$(id -u)" != 0 ]]; then
      echo "Giving $dir to $(id -un) (the new volume is owned by root)"
      if ! sudo -n chown -R "$(id -u):$(id -g)" "$dir"; then
        echo "ERROR: could not change the owner of $dir" >&2
        status=1
      fi
    fi
  done < <(all_dependency_dirs)
  return "$status"
}
