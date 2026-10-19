# Autonomous execution

Owns admission, stop/resume, activity ordering, lifecycle recovery and the
serialized event-plus-record transitions of managed implementation runs. The
harness composes external providers and project lock lifetime; this owner receives
current lock authority and acknowledges a quiescent close before the parent
releases it.

The planning child performs the initial captured-document workflow. Its accepted
bundle remains one atomic `analysis-accepted` transition. Staging catalog files is
not acceptance, and an accepted run never repeats planning during reopening.

The work-coordination child owns placement, frontier, assignments, contracts and
capability delegation/handback. Acceptance algorithms remain local here during
the intermediate iteration 5 state; iteration 6 extracts their cohesive owner. Shared task mechanics remain in task-execution; common job, command,
guard and lock mechanisms remain with harness composition.
