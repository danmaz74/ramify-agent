"""Read retained Plan 25 packets; report bytes, never token or cost savings.

Run from any directory. Prints JSON; does not modify the source evidence.
The 1,000-byte cutoff selects substantial passages for this inventory only.
It is not a proposed runtime threshold.
"""

import hashlib
import json
import re
from collections import defaultdict
from pathlib import Path


root = Path(__file__).resolve().parent.parent
evidence = root / "2026-10-09-status-badge-tone-plan25-postmortem/invocations"
environment = defaultdict(lambda: {"deliveries": 0, "bytes": 0})
inputs = []
reuse = []
review_payloads = []

for path in sorted(evidence.glob("*/packet.json")):
    raw = path.read_bytes()
    operation = json.loads(raw)
    packet = operation["packet"]
    additions = packet["additions"]
    history = operation["context"]["inherited"]
    assert additions and history[-len(additions):] == additions, path
    prior = history[:-len(additions)]
    effective = {}
    for item in prior:
        block = item.get("block")
        if block:
            if block["effect"] == "remove":
                effective.pop(block["key"], None)
            else:
                effective[block["key"]] = item
    appended_keys = {item["key"] for item in additions}
    inputs.append({"path": str(path.relative_to(root)),
                   "sha256": hashlib.sha256(raw).hexdigest()})
    for item in additions:
        if item["kind"] == "environment":
            entry = environment[item["key"]]
            entry["deliveries"] += 1
            entry["bytes"] += len(item["text"].encode())
        if path.parent.name in {"inv-0008", "inv-0009", "inv-0012"} and item["key"] in {
            "brief:support:candidate-diff", "brief:support:starting-points",
            "brief:support:assignment-package",
        }:
            body = item["text"].encode()
            review_payloads.append({"invocation": path.parent.name,
                                    "key": item["key"], "bytes": len(body),
                                    "sha256": hashlib.sha256(body).hexdigest()})

    passages = []
    selected = re.search(r"Selected procedure: ([^;]+);", packet["message"])
    if selected and selected[1] not in appended_keys:
        item = effective[selected[1]]
        size = len(item["text"].encode())
        if size > 1000:
            passages.append({"key": selected[1], "kind": "procedure",
                             "body_bytes": None, "framed_bytes": size})

    current = next(brief for brief in operation["context"]["history"]
                   if brief["revision"] == operation["context"]["revision"])
    for section in current["sections"]:
        key = "brief:" + section["key"]
        size = len(section["text"].encode())
        if section.get("effect") == "remove" or key in appended_keys or size <= 1000:
            continue
        expected = f"# Block {key}\nCurrent value; replaces any earlier value for this key.\n{section['text']}"
        assert effective[key]["text"] == expected, (path, key)
        passages.append({"key": key, "kind": "brief", "body_bytes": size,
                         "framed_bytes": len(expected.encode())})
    if passages:
        reuse.append({"invocation": path.parent.name, "mode": operation["mode"],
                      "source": operation["source"], "passages": passages,
                      "framed_bytes": sum(p["framed_bytes"] for p in passages)})

assert len(inputs) == 13, "Expected the complete retained 13-invocation run"
print(json.dumps({
    "run": "20261009T193340Z-51f42e",
    "historical_source": "474ffa58",
    "method": "UTF-8 bytes; inherited state is resolved before this operation's additions at its recorded source point. Only effective current passages over 1,000 bytes absent from additions are counted. This is existing reuse, not predicted incremental savings.",
    "inputs": inputs,
    "environment_appended": dict(environment),
    "environment_total_bytes": sum(item["bytes"] for item in environment.values()),
    "substantial_existing_reuse": reuse,
    "substantial_existing_reuse_framed_bytes": sum(item["framed_bytes"] for item in reuse),
    "review_payloads_for_content_comparison_not_lineage_savings": review_payloads,
}, indent=2))
