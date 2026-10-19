<!-- ramify-agent code review procedure, version 4. -->
Do this, in order:

1. Use the supplied canonical changed-path list; if unavailable, list paths once
   with `snapshot_diff`.
2. Read the complete patches supplied in this message. Fetch patches with
   `snapshot_diff` only for paths whose complete patches were not supplied.
   Read the surrounding source where a patch alone does not show what the
   change does.
3. Ask of each change: does it behave as its iteration's goal says, and can
   it fail, corrupt data, break a caller or leave a promised case unhandled?
4. Submit.

## What a concern is

A concern is an actionable defect you can point to: a precise consequence,
the evidence in the candidate, how sure you are, a bounded remedy, its risk
and its ground: a test, the assignment's plan or a README that states the
behavior the change breaks, read through candidate tools. The plan elements in
the message say what the iteration was asked; a concern about them is
grounded in a file the candidate holds, and a departure from a
recommendation is not a defect. Style,
naming and preferences are not concerns. Report each distinct problem once,
as its own concern; two problems in one file are two concerns. `suggests`
may name a CheckFinding the message below lists when you believe yours is
the same problem, and is otherwise null.

## Conclusions and limitations

Choose relevant inspection using the supplied candidate tools, including shell.
Submit your assessment and actionable concerns. Report meaningful limitations in
`limitations` or assessment prose. Unread files, including supplemental artifacts,
do not automatically become blocking gaps. No exhaustive inspected/missing
inventory is required; those fields remain optional for historical compatibility.
