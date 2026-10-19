#!/usr/bin/env python3
"""Aggregate Ramify-produced facts for this proposal; never resolve imports here.

Run from the repository root with paths to `ramify check --batch --format json`,
`ramify measure --format json`, and `ramify affected --format json` output.
Prints the compact baseline as JSON.
The file allocation is a move-only experiment, not an implemented module tree.
"""
import collections
import hashlib
import json
import pathlib
import subprocess
import sys

ROOT = pathlib.Path.cwd()
HARNESS = "ramify-agent/harness"
PREFIX = "subs/harness/src/"
check_bytes = pathlib.Path(sys.argv[1]).read_bytes()
measure_bytes = pathlib.Path(sys.argv[2]).read_bytes()
check = json.loads(check_bytes)
measure = json.loads(measure_bytes)
affected_bytes = pathlib.Path(sys.argv[3]).read_bytes()
affected = json.loads(affected_bytes)
snapshot = check["snapshot"]
assert check["outcome"]["check"] == "passed"
inventory = {f["path"]: f for f in snapshot["inventory"]["files"]}
production = {p: f for p, f in inventory.items()
              if f["area"] == "ordinary" and f["kind"] == "source"}
own = {p: f for p, f in production.items() if f["owner"] == HARNESS}
assert all(p.startswith(PREFIX) for p in own)

# First matching rule wins. Residual source explicitly remains unresolved.
RULES = [
    ("assistance", ["assistance/"]),
    ("session-store", ["run/session-store.ts"]),
    ("task-execution-seed", ["steps/runner.ts", "run/session-operations.ts",
        "run/sessions.ts", "run/port-events.ts", "run/writer.ts",
        "run/observations.ts", "run/excursions.ts", "run/submissions.ts",
        "run/pausable-deadline.ts", "transcripts/", "prompts/blocks.ts",
        "prompts/briefings.ts", "prompts/delivered-manifest.ts"]),
    ("autonomous/planning", ["analysis/"]),
    ("autonomous/work-coordination", ["architecture/", "capability/", "contracts/", "work/"]),
    ("autonomous/acceptance", ["checks/", "reviews/", "check-findings/", "deviations/",
        "nonfunctional/", "run/committing-gate.ts", "run/gates.ts", "run/after-handling.ts",
        "run/review-finish.ts", "run/merge-readiness.ts", "run/nonfunctional-phase.ts",
        "run/nonfunctional-records.ts", "run/final-correction.ts"]),
    ("harness-facade", ["http/", "interfaces/", "jobs/", "store/", "plans/"]),
]


def group(path):
    if path not in own:
        return inventory.get(path, {}).get("owner", "outside-inventory")
    relative = path[len(PREFIX):]
    for name, patterns in RULES:
        if any(relative.startswith(p) if p.endswith("/") else relative == p for p in patterns):
            return name
    return "autonomous-remainder"


def digest(value):
    return hashlib.sha256(value).hexdigest()


def git(*args):
    return subprocess.check_output(["git", *args], text=True).strip()


head = git("rev-parse", "HEAD")
assert not git("diff", "HEAD", "--", "subs/harness/src", "subs/harness/subs")
files = []
for p, f in sorted(own.items()):
    raw = (ROOT / p).read_bytes()
    assert digest(raw) == f["sha256"], f"Source changed after check: {p}"
    files.append({"path": p, "group": group(p), "bytes": len(raw),
                  "lines": len(raw.splitlines()), "sha256": digest(raw)})
own_measure = next(m for m in measure["modules"] if m["id"] == HARNESS)
assert len(files) == own_measure["exact"]["production"]["sourceFiles"]
assert sum(f["bytes"] for f in files) == own_measure["exact"]["production"]["sourceBytes"]
measured_files = {f["path"]: f for f in measure["files"]}
for p, f in inventory.items():
    raw = (ROOT / p).read_bytes()
    assert digest(raw) == f["sha256"], f"Captured source/resource changed: {p}"
    assert measured_files[p]["bytes"] == f["bytes"], f"Check/measure size mismatch: {p}"

# Unique directed source-file pairs, and distinct resolved original identities.
# Mixed and explicit type imports may produce multiple accesses; sets deduplicate.
edges = set()
value_edges = set()
symbols = collections.defaultdict(set)
unresolved = collections.Counter()
test_edges = set()
for access in snapshot["accesses"]:
    source = access["importer"]["file"]
    target = access["target"]
    if target["kind"] != "application":
        continue
    destination = target["origin"]["file"]
    if source in inventory and inventory[source]["area"] == "tests" and destination in own:
        test_edges.add((source, destination))
    if source not in production or destination not in production:
        continue
    edges.add((source, destination))
    selections = access["selections"]
    if any(s["request"] != "type-only" for s in selections) or not selections:
        value_edges.add((source, destination))
    if source not in own or group(source) == group(destination):
        continue
    for selection in selections:
        if selection["status"] == "resolved" and selection["original"]:
            symbols[group(source)].add(json.dumps(selection["original"], sort_keys=True))
        else:
            unresolved[group(source)] += 1

groups = {}
for name in sorted({f["group"] for f in files}):
    local = [f for f in files if f["group"] == name]
    local_paths = {f["path"] for f in local}
    outbound = {(s, t) for s, t in edges if s in local_paths and t not in local_paths}
    inbound = {(s, t) for s, t in edges if t in local_paths and s not in local_paths}
    tests = {s for s, t in test_edges if t in local_paths}
    groups[name] = {
        "sourceFiles": len(local), "bytes": sum(f["bytes"] for f in local),
        "lines": sum(f["lines"] for f in local),
        "outboundFilePairs": len(outbound),
        "outboundValueOrSideEffectFilePairs": len(outbound & value_edges),
        "externalDependencyFiles": len({t for _, t in outbound}),
        "dependencyGroups": sorted({group(t) for _, t in outbound}),
        "resolvedImportedOriginals": len(symbols[name]),
        "unresolvedSelectionOccurrences": unresolved[name],
        "inboundFilePairs": len(inbound),
        "externalConsumerFiles": len({s for s, _ in inbound}),
        "directTestSourceFiles": len(tests),
        "directTestSourceFilesTouchingOtherGroups": sum(
            len({group(t) for s, t in test_edges if s == test}) > 1 for test in tests),
    }
pair_counts = collections.Counter((group(s), group(t)) for s, t in edges
                                  if s in own and t in own and group(s) != group(t))
nodes = set(groups)
reach = {n: {b for a, b in pair_counts if a == n} for n in nodes}
for middle in sorted(nodes):
    for source in sorted(nodes):
        if middle in reach[source]:
            reach[source] |= reach[middle]
components = set()
for node in nodes:
    component = tuple(sorted(n for n in nodes if n == node or n in reach[node] and node in reach[n]))
    if len(component) > 1:
        components.add(component)

# A bounded retrospective sample, restricted to files that still belong to this
# owner's production inventory. Deleted/moved-away files are not represented.
history = []
for commit in git("log", head, "--no-merges", "-n", "160", "--format=%H", "--", "subs/harness/src").splitlines():
    changed = set(git("diff-tree", "--no-commit-id", "--name-only", "-r", "--no-renames", commit).splitlines())
    paths = sorted(changed & own.keys())
    if not paths:
        continue
    history.append({"commit": commit, "committedAt": git("show", "-s", "--format=%cI", commit),
                    "subject": git("show", "-s", "--format=%s", commit),
                    "groups": sorted({group(p) for p in paths}), "paths": paths,
                    "otherCurrentProductionPaths": sorted((changed & production.keys()) - own.keys())})
    if len(history) == 40:
        break
history_groups = {}
for name in groups:
    touched = [c for c in history if name in c["groups"]]
    history_groups[name] = {"commits": len(touched),
        "singleGroupCommits": sum(len(c["groups"]) == 1 for c in touched),
        "singleGroupWithoutOtherCurrentProductionCommits": sum(
            len(c["groups"]) == 1 and not c["otherCurrentProductionPaths"] for c in touched)}

architect = json.loads((ROOT / ".ramify-architect/harness/module.json").read_text())
architect_meta = json.loads((ROOT / ".ramify-architect/_meta.json").read_text())
assert architect_meta["revision"] == measure["revision"]
assert architect_meta["input"] == affected["revision"]["inputId"]
result = {
    "schema": "harness-decomposition-study/1", "sourceCommit": head,
    "sourceInventoryHash": digest(json.dumps(files, sort_keys=True).encode()),
    "providerPins": {k: v for k, v in json.loads((ROOT / "package.json").read_text())["dependencies"].items()
                     if k in ["ramify.ts", "ramify-audit"]},
    "method": {
        "allocation": "Whole-file move-only seed; no extracted methods, new adapters, or future API sizes estimated.",
        "filePairs": "Distinct directed production source-file pairs from Ramify application accesses; includes type dependencies, excludes npm/builtins.",
        "originals": "Distinct resolved original identities imported outside each proposed group; not a proposed API or required exposure count.",
        "tests": "Distinct testing source files with direct imports into a group; helpers count, transitive test reach does not.",
        "history": "Latest 40 non-merge commits touching current harness-owned production files, drawn from 160 path commits; includes refactors, excludes deleted/moved-away files.",
        "lines": "Physical splitlines including blank lines and comments; bytes are UTF-8 file bytes.",
        "identity": "Batch and resident input IDs are retained separately. Every check inventory source/resource hash matches disk and every file byte count matches measure; architect, measure and affected share a resident revision.",
    },
    "inputs": {"checkSchema": check["schemaVersion"], "checkInputId": check["inputId"],
        "checkSha256": digest(check_bytes), "checkOutcome": check["outcome"], "checkSummary": check["summary"],
        "coverageCodes": dict(collections.Counter(c["code"] for c in check["coverage"])),
        "measureSchema": measure["schema"], "measureRevision": measure["revision"],
        "measureSha256": digest(measure_bytes),
        "architectMeta": architect_meta,
        "ordinaryApiMeta": json.loads((ROOT / "subs/harness/src/.ramify/_meta.json").read_text())},
    "currentHarness": {"measurement": own_measure, "children": architect["children"],
        "uses": architect["uses"], "usedBy": architect["usedBy"], "symbols": architect["symbols"]},
    "affectedWitness": {"sha256": digest(affected_bytes), "schema": affected["schemaVersion"],
        "revision": affected["revision"],
        **{key: affected["selection"][key] for key in ["paths", "changedModules", "affectedModules", "testModules", "selection", "widening"]}},
    "allocationRules": RULES, "groups": groups,
    "groupEdges": [{"from": a, "to": b, "filePairs": n} for (a, b), n in sorted(pair_counts.items())],
    "cyclicGroups": sorted(components),
    "largestFiles": sorted(files, key=lambda f: (-f["lines"], f["path"]))[:12],
    "history": {"sampleSize": len(history), "singleGroupCommits": sum(len(c["groups"]) == 1 for c in history),
                "byGroup": history_groups, "commits": history},
    "files": files,
}
print(json.dumps(result, indent=2))
