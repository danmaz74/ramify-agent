# Codex provider

Owns one dedicated Codex app-server, its JSON-line protocol and a Linux subreaper
that settles its descendants, including commands creating separate sessions.
Assistance receives typed conversation operations through the agent parent.

The native transport requires Linux `/proc` and Python 3 with `prctl` support.
Initialization diagnoses missing supervision before conversation input. It never
connects to or changes the shared Codex daemon. Configuration, environment,
instructions, credentials, tool settings and permissions remain those supplied to
the installed CLI; the adapter does not select a more permissive policy.

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
