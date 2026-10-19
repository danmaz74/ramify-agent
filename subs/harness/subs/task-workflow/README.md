# Task workflow

Owns authored task inputs, role-specific task recipes and prose, rendering and
manual `step`/standalone session entry points. Managed planning, coordination and
acceptance consume the same constructors and prepared inputs that manual commands
render and execute. This owner supplies workflow policy; task-execution owns the
shared policy-free invocation, session binding, recording and settlement mechanics.

Manual runs retain their own admission, durable identity, replay, command meaning
and project-lock lifetime. Their gates, review promotion and after-handling use
supported acceptance operations with detached reads and explicit accepted writes.
They never access an autonomous service's private state. Public command schemas
remain browser-safe harness contracts; common project configuration, commands,
locks and guards remain harness support.

The shared workflow runner receives a bound invocation context: detached events,
record/index/policy reads, serialized admission/publication, live registration and
writer settlement operations. Managed lifecycle binds these in autonomous; manual
lifecycle binds them here. Neither passes a whole run, journal, mutex, live map or
writer object into the shared runner or consultation equipment.
