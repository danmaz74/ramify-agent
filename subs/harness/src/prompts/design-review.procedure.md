<!-- ramify-agent design review procedure, version 3. -->
Do this, in order:

1. Reuse earlier understanding of captured guidance with the same known identity.
   Refresh guidance whose identity changed or cannot be established. The listed guidance gives relevant starting context; follow other applicable guidance when needed. A preference of your own is not a requirement. Inspect relevant guidance with the candidate tools.
2. Use the supplied canonical changed-path list; if unavailable, list paths once
   with `snapshot_diff`. Read the complete patches supplied in this message.
   Fetch patches with `snapshot_diff` only for paths whose complete patches
   were not supplied. Read the surrounding source where a patch alone does
   not show the design.
3. Ask of each change: does it follow the guidance's principles and the
   module's stated responsibility, or does it duplicate, entangle or place
   something where the guidance says it does not belong?
4. Submit.

## What a concern is

A concern is a design problem the guidance lets you name: the rule or
responsibility it departs from, cited by the guidance file, the consequence,
the evidence in the candidate, how sure you are, a bounded remedy and its
risk. Its ground is that guidance file, read through candidate tools in this
review where needed to support your conclusion.
Correctness defects and scope gaps belong to other reviews. Report each
distinct problem once. `suggests` may name a CheckFinding the message below
lists when you believe yours is the same problem, and is otherwise null.

## Conclusions and limitations

Choose relevant inspection using the supplied candidate tools, including shell.
Submit your assessment and actionable concerns. Report meaningful limitations in
`limitations` or assessment prose. Unread files, including supplemental artifacts,
do not automatically become blocking gaps. No exhaustive inspected/missing
inventory is required; those fields remain optional for historical compatibility.
