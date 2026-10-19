# Plan Architect Prompt Optimization Principles

**Status:** Proposed; retained from the existing harness principles.

## Purpose

Define the existing commitments for the plan architect's reasoning and output,
in addition to the [shared prompt optimization principles](prompt-optimization.principles.md).
This relocation changes neither their adoption status nor the plan architect's
authority.

## Principles

### Forecast Early; Decide with Current Evidence

Early analysis forecasts needs across the plan for two purposes:

- **Improve global decisions.** Seeing related needs together can reveal
  opportunities to reuse one new capability across several consumers, before
  local decisions produce separate solutions.
- **Enable high-level human review.** The forecast makes the intended
  architectural direction, reuse opportunities and uncertainties visible
  before detailed implementation.

Forecasts and actual decisions remain separate. A forecast informs later
choices but does not, by itself, create work or establish a contract.

Forecasts, decisions and their rationale are recorded in the repository.
Session continuity aims to avoid repeated exploration, reduce elapsed time
and token cost, and preserve consistency. Its optional role is defined by the
[harness recovery principles](harness-recovery.principles.md#an-oriented-context-is-reused-never-required).
Making a forecast available for review is
separate from requiring execution to wait for approval.

### Architecture Planning Produces an Implementation Map

The implementation map says where the implementation of a plan falls on the
module tree. Above all it identifies which modules take most of the work. That
guides the division of the plan into phases and iterations. New modules are
rare.

The phase also records what only the global view can supply:

- reuse findings: behavior that already exists, and whether it is available to
  the module that needs it;
- seams: where modules in different branches must agree on an interface.

Finer detail is left to the module engineer who reads the code.
