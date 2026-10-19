# Autonomous execution

Owns admission, stop/resume, activity ordering, lifecycle recovery and the
serialized event-plus-record transitions of managed implementation runs. The
harness composes external providers and project lock lifetime; this owner receives
current lock authority and acknowledges a quiescent close before the parent
releases it.

The planning child performs the initial captured-document workflow. Its accepted
bundle remains one atomic `analysis-accepted` transition. Staging catalog files is
not acceptance, and an accepted run never repeats planning during reopening.

The work-coordination child owns placement, frontier, assignments, contract
obligations, engineer turns/repair policy and capability delegation/consumer
return. The acceptance child owns qualification, gates, review/reconciliation,
nonfunctional assessment and completion eligibility. Lifecycle orchestrates these
owners and serializes their proposed transitions; it retains no alternative
implementation of their decisions.

Shared task mechanics live in task-execution. Authored/manual/standalone workflow
construction lives in task-workflow, used by managed owners as well. Common jobs,
commands, configuration, guards and project locks remain harness support. The
historical layout/schema registry composes owner-defined contracts for replay; it
is not a second domain projector.

See the [final responsibility map](../../../../plans/harness-decomposition/responsibility-map.md)
for the original mixed files and their actual homes.
