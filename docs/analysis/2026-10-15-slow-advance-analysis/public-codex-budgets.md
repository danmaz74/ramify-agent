# Budget delivery in public Codex

Public Codex can explicitly tell an LLM how many tokens remain, through context-management messages and an optional shared session budget. Its ordinary model request does not contain an output-token cap, and the inspected client does not translate `medium` reasoning effort into 27,000 tokens. These findings do not establish the source of the Pi engineers' perceived budget.

Source: [openai/codex at 922510f4d7570b42838e015787ed53abfa8761a1](https://github.com/openai/codex/tree/922510f4d7570b42838e015787ed53abfa8761a1), retrieved on 2026-10-15 into `/tmp/codex-budget-source-SY7aId`. This is the inspected public main revision, not a claim about the code deployed behind the service during the earlier run. Source and existing tests were read; no Codex build or inference trial was run.

| Mechanism | What reaches the model | Activation and meaning |
| --- | --- | --- |
| Context budget | Configurable developer guidance and low-context reminders; `get_context_remaining` can return the remaining count | `token_budget` feature and relevant context-management configuration; remaining space in the current context, not total work allowed |
| Shared rollout budget | A developer message saying how many weighted tokens remain in the shared session budget | `rollout_budget` must be enabled with an explicit positive limit and reminder thresholds; shared accounting across the root session tree |
| Ordinary inference request | `reasoning.effort`, optional summary/context settings | Normal effort selection; no `max_output_tokens` or `max_completion_tokens` field in the inspected request structure |
| Goal budget | Goal tool results and goal-specific accounting | Separate explicit goal/configuration facility; not a universal engineering-task allowance |

**Context management.** [TokenBudgetRemainingContext](https://github.com/openai/codex/blob/922510f4d7570b42838e015787ed53abfa8761a1/codex-rs/core/src/context/token_budget_context.rs#L176) renders “You have {tokens_left} tokens left in this context window.” The [get_context_remaining handler](https://github.com/openai/codex/blob/922510f4d7570b42838e015787ed53abfa8761a1/codex-rs/core/src/tools/handlers/get_context_remaining.rs#L82) exposes this as a tool result. The [remaining-count calculation](https://github.com/openai/codex/blob/922510f4d7570b42838e015787ed53abfa8761a1/codex-rs/core/src/session/context_window.rs#L83) takes the minimum remaining allowance across the applicable auto-compaction scope and effective full context window, clamped at zero.

Separately, [maybe_record](https://github.com/openai/codex/blob/922510f4d7570b42838e015787ed53abfa8761a1/codex-rs/core/src/session/token_budget.rs#L161) inserts a configurable developer reminder when the remaining count crosses a threshold. On exhaustion, configured guidance can request notes and a fresh context. This is not an unconditional numeric message on every inference request.

The [feature defaults](https://github.com/openai/codex/blob/922510f4d7570b42838e015787ed53abfa8761a1/codex-rs/features/src/lib.rs#L1909) mark both `token_budget` and `context_management` as under development and disabled by default. Activation can also come from model-owned defaults or eligible experimental-context configuration, so this does not prove every deployed Codex installation has them disabled. The checked-in [gpt-6.1-sol entry](https://github.com/openai/codex/blob/922510f4d7570b42838e015787ed53abfa8761a1/codex-rs/models-manager/models.json#L177) has a 272,000-token context window and `token_budget.enabled: false`; its reminder threshold is 6,144 and fallback buffer 16,384. None is a 27,000-token assignment budget. A fetched model catalog may differ from this checked-in fallback.

**Shared session budget.** [RolloutBudgetContext](https://github.com/openai/codex/blob/922510f4d7570b42838e015787ed53abfa8761a1/codex-rs/core/src/context/rollout_budget.rs#L9) renders a developer message wrapped in `<rollout_budget>`, with a numeric remaining weighted-token allowance. The [turn loop](https://github.com/openai/codex/blob/922510f4d7570b42838e015787ed53abfa8761a1/codex-rs/core/src/session/turn.rs#L479) asks for a reminder before constructing the next request. Existing [request-capture tests](https://github.com/openai/codex/blob/922510f4d7570b42838e015787ed53abfa8761a1/codex-rs/core/tests/suite/rollout_budget.rs#L102) assert that this message reaches the first request and that later reminders update the amount.

The feature is disabled by default. Its [configuration resolver](https://github.com/openai/codex/blob/922510f4d7570b42838e015787ed53abfa8761a1/codex-rs/core/src/config/mod.rs#L2949) requires an explicit positive `limit_tokens` and reminder thresholds, rather than supplying a default such as 27,000. [Accounting](https://github.com/openai/codex/blob/922510f4d7570b42838e015787ed53abfa8761a1/codex-rs/core/src/rollout_budget.rs#L45) uses provider-reported rollout units when available, otherwise weighted output and noncached input tokens. It is an actual limit: the [controller](https://github.com/openai/codex/blob/922510f4d7570b42838e015787ed53abfa8761a1/codex-rs/core/src/agent/control/budget.rs#L11) reports `SessionBudgetExceeded` upon exhaustion.

**Outgoing inference controls.** The ordinary [ResponsesApiRequest and WebSocket request structures](https://github.com/openai/codex/blob/922510f4d7570b42838e015787ed53abfa8761a1/codex-rs/codex-api/src/common.rs#L278) carry no `max_output_tokens` or `max_completion_tokens`. The [client builder](https://github.com/openai/codex/blob/922510f4d7570b42838e015787ed53abfa8761a1/codex-rs/core/src/client.rs#L934) chooses the requested or model-default effort. [Effort normalization](https://github.com/openai/codex/blob/922510f4d7570b42838e015787ed53abfa8761a1/codex-rs/protocol/src/openai_models/reasoning_effort.rs#L8) leaves `medium` unchanged; it does not calculate a numeric token budget. The serializer supports a custom numeric effort value, but that is not evidence of an automatic `medium` to 27k conversion or its server-side semantics. Other `max_output_tokens` occurrences concern separate operations such as search or tool-result truncation and do not establish a main-agent generation limit.

**Implication for the retained run.** ramify-agent invoked Pi's provider adapter directly, not the public Codex client loop. Earlier inspection found no token-limit field in all 133 outgoing requests from inv-0014, inv-0017 and inv-0032; each sent `reasoning.effort: medium`. An additional inspection of 22 retained inv-0014 requests found no `<rollout_budget>`, `<context_window_reminder>`, shared-budget wording or context-tokens-left wording in their instructions or system/developer/user message inputs. Model-generated reasoning was excluded from that text check.

Therefore public Codex demonstrates that explicit budget messaging exists, including a true optional session allowance. It does not demonstrate that this mechanism supplied the approximately 27k estimate in the Pi run. There is no traced client-side source for that number. A learned behavior or provider-side influence remains possible, but the public client does not reveal model training or hidden server-side inputs.


## Exact public-client wording

Added 2026-10-16 after the combined Pi context-notice/subagent replay. These
excerpts are taken from Git objects at the pinned revision above, not inferred
from the Pi experiment or this chat's instructions. They describe that public
client revision; they do not establish which messages a deployed Codex service
sends. Placeholders remain literal below; the client substitutes actual counts.

The Pi experiment's longer `<context_window>` notice was our adaptation, not a
verbatim Codex prompt. The occupancy/capacity/reserve explanation, the statement
that Pi can compact and continue, and the instruction not to stop because of an
assumed task budget were added by our adapter.

### Remaining context count

Exact renderer text from
[TokenBudgetRemainingContext](https://github.com/openai/codex/blob/922510f4d7570b42838e015787ed53abfa8761a1/codex-rs/core/src/context/token_budget_context.rs#L176):

```text
You have {tokens_left} tokens left in this context window.
```

If the count is unavailable:

```text
You have unknown tokens left in this context window.
```

The renderer has no enclosing markers. The ordinary `get_context_remaining`
function-tool response uses this text. Its code-mode result instead returns
`{"tokens_left": N}` (or `{"tokens_left": null}` when unknown), as implemented in
[the handler](https://github.com/openai/codex/blob/922510f4d7570b42838e015787ed53abfa8761a1/codex-rs/core/src/tools/handlers/get_context_remaining.rs#L39).
These are conditional delivery paths, not a promise that every Codex model
request receives the sentence.

### Shared session allowance

Exact rendered template from
[RolloutBudgetContext](https://github.com/openai/codex/blob/922510f4d7570b42838e015787ed53abfa8761a1/codex-rs/core/src/context/rollout_budget.rs#L9),
with `{remaining_tokens}` denoting the number substituted into Rust's `{}`:

```text
<rollout_budget>
You have {remaining_tokens} weighted tokens left in the shared session token budget.
</rollout_budget>
```

This is a separate optional actual shared allowance. We did not enable or
reproduce this allowance in the Pi experiments.

### Sol 6.1 context guidance and reminders

The following complete strings come from the pinned catalog's
[`gpt-6.1-sol` model messages](https://github.com/openai/codex/blob/922510f4d7570b42838e015787ed53abfa8761a1/codex-rs/models-manager/models.json#L278).
They are configurable model defaults, not universal hard-coded wording. This
entry has `enabled: false`, a reminder threshold of 6,144 and a fallback buffer
of 16,384 tokens. Feature activation/configuration determines whether these
strings reach a request.

The low-context reminder substitutes `{n_remaining}` with the measured count:

```text
<context_window_reminder>
Your current context window is nearly exhausted; only {n_remaining} tokens remain. Before starting a new context window, save concise progress notes with the `notes` tool with the goal, decisions, progress, learnings, next steps, and the window ID and item ID of every relevant user request still being solved, as well as important actions/tool calls for future reference. Note that every non-assistant item, such as user, developer, tool response, has an item id `[id: ...]` that is immediately after its item content. You should write or append notes in a way to best help you recover in a new context window. It is also a good idea to clean up your old notes if they become obsolete or irrelevant. Future context windows will not automatically include the current conversation. After saving your state, call `functions.new_context` to continue in a fresh context window.
</context_window_reminder>
```

The exhausted-context fallback prompt is:

```text
<context_window_reminder>
The current context window is exhausted. Do not continue the task or give a final answer in this window. The next window will not automatically include this conversation. Make exactly one write or append call to `notes` now to save a concise checkpoint with the goal, decisions, progress, learnings, next steps, and the window ID and item ID of every relevant user request still being solved, as well as important actions/tool calls for future reference. Note that every non-assistant item, such as user, developer, tool response, has an item id `[id: ...]` that is immediately after its item content. After the notes result returns, call `functions.new_context`; do not use any tools other than `notes` and `functions.new_context`.
</context_window_reminder>
```

The initial context-management guidance is wrapped by `ContextWindowGuidance`
in `<context_window_guidance>` tags. Its configured body is:

```text
For tasks that may span context windows, use `notes` to maintain a concise checkpoint of the goal, decisions, progress, learnings and next steps. Include the window ID and item ID for every relevant user request you are currently solving as well as important actions/tool calls. You can use `history` tool to look up details with the references later. Note that every non-assistant item, such as user, developer, tool response, has an item id `[id: ...]` that is immediately after its item content. Relative note paths belong to the current thread; absolute paths may read other threads' notes, but writes are limited to the current thread.

It is a good idea to take incremental notes while you work so that you do not miss any important info. You can also use `get_context_remaining` tool to find the remaining token budget for better planning. Once the token budget is exhausted, you will lose access to the current window and continue in a fresh context window and you can only recover through `notes` and `history` tools. So be careful not to over-run the context window without any documentation.

If Previous context window id is present in `<context_window>`, it means a context reset occurred and this is a new window. After a reset, read the checkpoint and use the read-only `history` tool to recover any missing details. When a window ID and item ID are known, prefer `read_item` directly; when they are missing or uncertain, use `list_items`, or `search_contents` to locate the item first.

Treat notes and history as internal bookkeeping. Do not mention them in user-facing messages.
```

The tool names and operational directions in those quoted strings are part of
the inspected Codex implementation. They are source evidence, not instructions
to run those tools in the Pi experiment or this analysis.
