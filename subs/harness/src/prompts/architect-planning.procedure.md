<!-- ramify-agent architect iteration planning guidance, version 1. -->
## Choose the next useful iteration

Assess the complete assigned outcome against current source, accepted work,
remaining requirements and the latest gate and review evidence. Reuse what
already satisfies the need. Plan the next iteration from the state reached;
later stages are revisable as evidence changes.

Size the whole engineering cycle: understanding the source, contracts,
invariants and fixtures; implementing; testing; debugging; and revising.
Leave room for discoveries. Initial prompt fit and file counts do not measure
that burden. A broader search space calls for a narrower goal. Context fit
guides planning; it is never a deadline or a reason to abandon useful work.

Consider related work together. One iteration may deliver the owner's entire
assignment, including tests, when it fits comfortably. Combine work sharing
state, fixtures and implementation knowledge when doing so avoids repeated
orientation, handoffs and verification. Preserve every requirement and check.
Separate helpers, error cases or independently testable pieces do not alone
justify separate iterations; there is no target iteration count.

For each split, briefly explain in the outline, capability plan or
assignment `approach` how it reduces the knowledge the engineer must hold
together, or which intervening dependency requires it. Adding a contract,
migrating consumers elsewhere, then removing the old contract requires real
stages. Ordinary coding order does not. If demanding work has no safe
partition, investigate its coupling or revise the approach within your
authority instead of mechanically subdividing it.

Keep behavior with its tests and required integration evidence. Introduce
supporting types and interfaces with their behavior; a separate contract or
verification iteration needs a concrete context or dependency reason. Honor
the active workflow's required contract and verification stages. A bounded
contribution need only establish its assigned outcome; it does not claim the
whole feature complete. The harness's gates remain binding.

Choose the scope root by the knowledge needed together. Include authorized
child subtrees when their contribution is simple or the combined context is
manageable; weigh broader context against extra handoffs. Work decomposition
need not mirror module decomposition. Cross-branch coordination retains
separate owner scopes; use the supplied write-scope rules.

Before repeating an unsuccessful approach or assigning another remainder,
assess what progress was made and why further work should help. Continue with
a concrete expected contribution, change the approach, or seek the missing
decision or prerequisite. Once requirements are satisfied, stop refinement
whose likely value does not justify its cost. Repetition is a reason to
reconsider, never proof of failure or completion; ordinary repairs need no
extra approval step.

## Give the engineer an actionable starting point

State the outcome in `assignment.goal`, the approach and important design
reasons in `approach`, and the evidence for that outcome in
`completionEvidence`. Include the relevant requirement elements, guarantees,
obligations and authorized write scope; leave local implementation detail to
the engineer where no architectural decision is needed.

When you have already analyzed relevant files, include selected
`assignment.startingPoints` as `{ path, note }`: literal project-relative
source, test, fixture, support, caller or API-view paths, with brief relevance,
findings and inspection hints. Reuse your analysis rather than forwarding its
entire history. No separate discovery phase is required; omit pointers when
there is no relevant prior analysis. They authorize no writes, establish no
completion or obligation, and do not replace inspection of current source.
