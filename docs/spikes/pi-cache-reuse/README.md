# Pi subscription cache reuse spike

This standalone live experiment uses ramify-agent's pinned Pi 0.87.1,
`openai-codex/gpt-5.6-sol`, Pi-owned subscription authentication and SSE. It
simulates exact forks directly at the provider boundary: copy the complete
parent transcript, assign independent child session IDs, and alternate A1,
B1, A2, B2, A3, B3. Production harness behavior is unchanged.

## Controls

Each independently namespaced cohort carries 256 synthetic reference records,
well above the documented cache minimum. It executes:

1. Parent seed request.
2. Identical request replay with the same session and cache key.
3. Identical request replay changing only the body `prompt_cache_key`, keeping
   session headers unchanged.
4. Parent continuation, which establishes the common fork checkpoint.
5. Three alternating turns on each of two independent forks.

`session-key` matches the pre-adoption adapter: each child UUID becomes its cache
key. `shared-key` preserves distinct child UUIDs and headers while overriding
only `prompt_cache_key` with the parent's key. `shared-routing` keeps logical
fork UUIDs independent while sending the parent's provider session identity
in both headers and the body cache key. Two repeats counterbalance the
strategy order. Every cohort gets a unique early fixture namespace to limit
cross-cohort reuse. The default experiment is serial; the extension below tests
concurrent dispatch. Neither tests compaction, cache expiration or explicit
breakpoints.

The runner uses the public Pi ModelRuntime directly, with no agent loop, tools,
background warming or provider retries. It retains full credential-free native
requests, original provider completion responses and normalized responses. The
only recorded request headers are `session-id` and `x-client-request-id`.
Credentials stay Pi-owned. No dollar estimate is treated as subscription billing.

## Run and verify

From `ramify-agent/`, select a new empty evidence directory:

```sh
node docs/spikes/pi-cache-reuse/run.mjs --output /home/app/ramify-pi-cache-evidence/NEW-RUN
node docs/spikes/pi-cache-reuse/run.mjs --verify /home/app/ramify-pi-cache-evidence/NEW-RUN
node docs/spikes/pi-cache-reuse/verify-wire.mjs /home/app/ramify-pi-cache-evidence/NEW-RUN
```

Defaults are `--repeats 2 --rounds 3 --records 256` (60 live requests).
Use `--modes session-key,shared-key` to select only the first two strategies.
Every request has a 120-second bound. Failures are retained and stop the run;
there is no automatic retry. This explicitly invoked spike is outside automated
test discovery and is not a replacement for registered native acceptance tests.

Verification checks original-versus-normalized usage, actual request hashes,
replay equality, the inherited native prefix including request settings, parent
immutability and sibling transcript isolation. A cache hit is measured as
`cacheRead / (input + cacheRead + cacheWrite)`; output is excluded.
The independent offline wire verifier checks complete original responses against
the retained SSE events, verifies the archived runner hash and computes the
strategy aggregates.

Current findings and evidence are recorded in [results.md](results.md).

## Concurrent sibling extension

Use `--dispatch concurrent` to dispatch each A/B pair together. Each call reaches
a shared gate at the HTTP boundary; the gate releases after both requests are
ready. Recorded HTTP-start and stream-completion intervals must overlap.

Concurrent branch requests use different per-request reply labels and private
first-turn markers. Each response must return its own label, its own first-turn
marker and a record revision from the shared parent context. Turn 2 asks for the
marker from turn 1 without restating it. This exercises response isolation and
retained branch history, with independent expected answers.

```sh
node docs/spikes/pi-cache-reuse/run.mjs --output /home/app/ramify-pi-cache-evidence/NEW-CONCURRENT-RUN --dispatch concurrent --modes session-key,shared-routing --repeats 3 --rounds 2
node docs/spikes/pi-cache-reuse/run.mjs --verify /home/app/ramify-pi-cache-evidence/NEW-CONCURRENT-RUN
node docs/spikes/pi-cache-reuse/verify-wire.mjs /home/app/ramify-pi-cache-evidence/NEW-CONCURRENT-RUN
```

This runs 48 calls, including 12 overlapping fork pairs across independent
parents and separate/shared provider identities. The offline wire verifier derives
the expected branch answers from native request text, checks distinct original
provider response IDs and verifies the recorded overlaps. It uses no credentials
or live calls. Concurrent findings are recorded in
[concurrent-results.md](concurrent-results.md).

## Production adapter witness

After adoption, `run-adapter.ts` exercises the actual Pi adapter and production
session store. Two independently namespaced parents each seed a reference and
fork two concurrent children. Every child makes exactly one model request and
must submit its own label, private marker and inherited record revision. Fresh
adapter instances read the durable history; no cache key or header is rewritten
by the witness. The HTTP interception records the installed provider's emitted
headers, body and original SSE responses and gates sibling dispatch together.

```sh
node_modules/.bin/tsx docs/spikes/pi-cache-reuse/run-adapter.ts --output /home/app/ramify-pi-cache-evidence/NEW-ADAPTER-RUN
node_modules/.bin/tsx docs/spikes/pi-cache-reuse/run-adapter.ts --verify /home/app/ramify-pi-cache-evidence/NEW-ADAPTER-RUN
```

Results and implementation verification are in [adapter-results.md](adapter-results.md).
