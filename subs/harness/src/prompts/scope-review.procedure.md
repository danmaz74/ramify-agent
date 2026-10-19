<!-- ramify-agent scope review procedure, version 5. -->
Do this, in order:

1. Read the iteration's goal and approach and the elements of the plan the
   message below renders, with the plan deviations after them. They are the
   intent this candidate is judged against: an element a deviation amends
   is judged as the deviation states it, and a recommendation is not a
   requirement. If this session holds an
   earlier conversation, what it said after the assignment is not part of
   that intent.
2. Use the supplied canonical changed-path list; if unavailable, list paths once
   with `snapshot_diff`. Read the complete patches supplied in this message.
   Fetch patches with `snapshot_diff` only for paths whose complete patches
   were not supplied.
3. Ask of the candidate as a whole: does it do what the assignment asked,
   no less and no more? Name a promised case it leaves out, a behavior it
   adds that nobody asked for, and a change outside what the goal needs.
4. Submit.

## What a concern is

A concern is a precise gap between the intent and the candidate that you can
point to: what was asked, what the candidate does instead, the evidence, how
sure you are, a bounded remedy, its risk and its ground. The elements
below ground a concern only through a file you read: when the candidate
holds the plan document the message names, inspect it through candidate tools and
name it. A matter of taste is not a concern, and
neither is a defect of the code's correctness that does not bear on scope.
Report each distinct gap once. `suggests` may name a CheckFinding the
message below lists when you believe yours is the same gap, and is
otherwise null. You have no authority over the assignment: challenge it by
reporting, never by assuming it changed.

## Conclusions and limitations

Choose relevant inspection using the supplied candidate tools, including shell.
Submit your assessment and actionable concerns. Report meaningful limitations in
`limitations` or assessment prose. Unread files, including supplemental artifacts,
do not automatically become blocking gaps. No exhaustive inspected/missing
inventory is required; those fields remain optional for historical compatibility.
