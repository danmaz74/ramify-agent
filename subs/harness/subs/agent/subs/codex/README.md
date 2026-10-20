# Codex provider

Owns one dedicated Codex app-server, its JSON-line protocol and a Linux subreaper
that settles its descendants, including commands creating separate sessions.
Assistance receives typed conversation operations through the agent parent.

The native transport requires Linux `/proc` and Python 3 with `prctl` support.
Initialization diagnoses missing supervision before conversation input. It never
connects to or changes the shared Codex daemon. Every dedicated app-server uses
`sandbox_mode = "danger-full-access"` and `approval_policy = "never"`, including
its native workers. Thread start and resume explicitly restore those settings
and verify the returned policy. Other configuration, environment, instructions,
credentials and tool settings remain those supplied to the installed CLI;
shared configuration is never rewritten.

Protocol decoding is qualified against installed `codex-cli 0.161.0` generated
schemas. Version changes are not rejected solely by version. Initialization and
readiness calls diagnose actual missing methods, models or equipment. The model
catalog establishes declared equipment; a completed native worker in the retained
live evidence establishes exercised equipment. Neither establishes future access.

`interrupt` acknowledges a request for the parent turn only. `stop` confirms
settlement only after the supervisor reaps all descendants and itself exits.
Provider exit alone leaves supervision available for cleanup. A timeout, lost
reply, malformed protocol or supervisor failure remains explicit uncertainty.
No automatic restart or turn replay occurs. Closing an observer never stops work.
