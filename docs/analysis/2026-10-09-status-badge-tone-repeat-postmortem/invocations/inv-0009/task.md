Briefing revision: 1739aab912baae9a09e6860cc76c021395163116329384d48155bbb33e2de2c9; based on: 8126c1af62d77076b26417356ebd5adc7927fc1b717d234b360d7f1df0261166 (post-fork)

# Goal
Review 40155157c0af1fa686ec5b8579755c17a6364613

# Requirements
- {"schema":"ramify-agent.review-request/1","id":"rq-0002","key":{"iteration":"wi-001.i01","candidate":"40155157c0af1fa686ec5b8579755c17a6364613","kind":"scope","policy":"review-policy/1"},"workItem":"wi-001","assignment":"work-items/wi-001/iterations/01/assignment.json","base":"564534ea8e482a1d65b77a247f80577ff5d540d8","gate":"ga-0002","tree":"36c77a3a474e60064bbb3efabdd5c0547a92133a","source":{"elements":["ctx-001","fr-001","fr-002","fr-003","fr-004","fr-005","nfr-001","nfr-002","nfr-003","nfr-004"],"deviations":[],"hash":"d5d8a0aa721e59c52f2123797f904d72f39f3eaedf9a400daf77acae9420fd6e"},"guidance":[],"forkPoint":{"kind":"session","session":"ses-0004","ref":"{\"schema\":\"ramify-agent.session-point/1\",\"runId\":\"20261009T181051Z-4c5bfc\",\"point\":{\"sessionId\":\"70485831-d2c2-4d02-a701-ec3aaaa80da1\",\"turn\":2,\"kind\":\"turn\",\"checkpoint\":\"9d7d355d-beb0-4a93-ac47-5d4f0e86e0e7\"}}"}}

Scope review rq-0002 of iteration wi-001.i01 of work item wi-001.

The audited candidate is commit 40155157c0af1fa686ec5b8579755c17a6364613 (tree 36c77a3a474e60064bbb3efabdd5c0547a92133a); its gate ga-0002 passed. The diff is taken from 564534ea8e482a1d65b77a247f80577ff5d540d8.

The request's assignment path identifies a record in the harness run directory. Use the assignment intent below; that record is not a candidate file readable with snapshot tools.


## The iteration

Goal: Implement the registered toned-status-badge capability and bind both acceptance scenarios in shared-ui.
Approach: Update StatusBadgeProps with an optional exact tone union and make StatusBadge resolve an omitted tone to neutral before rendering data-tone alongside the unchanged data-status. Keep the primitive dependent only on its props and retain existing label/default-label behavior. Extend the existing static-markup Vitest suite to prove explicit tone propagation, neutral omission, and unchanged wording. Add shared-ui-local TypeScript/TSX Cucumber steps under src/tests/steps that bind the exact generated phrases, render the real StatusBadge with react-dom/server, keep state scenario-local, and use no fakes. Do not edit the generated feature file or require changes from feature callers.
Completion evidence: A focused diff shows the optional four-value tone contract, neutral default, and data-tone output without caller or semantic regressions; focused type checking/tests and the bound Cucumber scenarios pass, followed by the required project gate including type-check, Vitest, Cucumber, and structural audit.
Its write scope's rationale: All production code, unit tests, and scenario steps belong to shared-ui's own source and test area; no child, external file, runner configuration, or guarded artifact needs modification.


## What the plan asks of it

The elements the assignment cites, whole. Each plan deviation amends the elements it names for the rest of this run, under its own authority; the elements above are unchanged. Where a deviation amends an element, judge the candidate against the element as the deviation amends it, and raise no concern for what the deviation leaves out.


The candidate holds the plan as `plans/status-badge-tone/plan.md`. To name it as a concern's ground, read it with `snapshot_read`.


## The changed paths

- M subs/workspace/subs/shared-ui/src/status-badge.tsx
- M subs/workspace/subs/shared-ui/src/tests/features/status-badge-tone/render-toned-status-badge.feature
- M subs/workspace/subs/shared-ui/src/tests/status-badge.test.tsx
- A subs/workspace/subs/shared-ui/src/tests/steps/status-badge-tone.steps.tsx


Use the supplied changed-path list and complete patches delivered in this message. Fetch a relevant patch with snapshot_diff only when it is not supplied, and inspect the source required to judge it. List paths with snapshot_diff only if the supplied list is unavailable. The audited diff includes harness-produced changes; no feature or pending-tag patch is hidden.


## Declared project checks

- fixture-type-check (none): argv ["npm","run","type-check"]; cwd `.`.
- fixture-tests (vitest): argv ["npm","test"]; cwd `.`.
- fixture-scenarios (cucumber): argv ["npm","run","test:cucumber"]; cwd `.`.
- fixture-structure (none): argv ["/home/app/ramify-status-badge-trial-20261009/ramify-agent/node_modules/.bin/ramify","check","--batch","--format","json","--no-snapshot"]; cwd `.`.
- Configuration/support pointer: `ramify-audit.json`.
- Configuration/support pointer: `ramify-agent.json`.
- Configuration/support pointer: `package.json`.
- Configuration/support pointer: `cucumber.js`.

Read these project-relative references with snapshot_read/snapshot_list in the audited candidate. Commands describe the declared setup; this reader does not execute them.



## Candidate test pointers

- `subs/workspace/subs/shared-ui/src/tests/`: inspect with snapshot_list; read named files with snapshot_read.

Harness pending-tag binding: sc-001 in subs/workspace/subs/shared-ui/src/tests/features/status-badge-tone/render-toned-status-badge.feature, exact candidate sha256 de0eb6508736e7c2c2cb91744467c7801cbf261cde45bb37bb7a71293860f197, accepted producer inv-0007, submission 92b9f97afe954f368d576461af3c32a9e479c41cdb82fc5955b2459797147ca4. This attribution supplies provenance; review the actual audited patch.

Harness pending-tag binding: sc-002 in subs/workspace/subs/shared-ui/src/tests/features/status-badge-tone/render-toned-status-badge.feature, exact candidate sha256 de0eb6508736e7c2c2cb91744467c7801cbf261cde45bb37bb7a71293860f197, accepted producer inv-0007, submission 92b9f97afe954f368d576461af3c32a9e479c41cdb82fc5955b2459797147ca4. This attribution supplies provenance; review the actual audited patch.


# Plan context package

Catalog: 20fb9f16cb3fc364d18e53e7664b6fab2b404eeb2617d7e8846b3aacd4e0135d
Elements: ctx-001, fr-001, fr-002, fr-003, fr-004, fr-005, nfr-001, nfr-002, nfr-003, nfr-004
Deviations: none

## Context

Context describes the situation the plan starts from and why the plan exists. It is not a requirement, and nothing assesses it.

### ctx-001: context from plans/status-badge-tone/plan.md

> The status badge says whether a review passed or failed, but a feature that wants to draw attention to a badge, or to play one down, has no way to say so. Give the badge a tone.

Conditions: none recorded.

Uncertainty: none recorded.

## Functional requirements

### fr-001: functional requirement from plans/status-badge-tone/plan.md

> `StatusBadge` takes an optional `tone`: `neutral`, `positive`, `warning` or `critical`.

Conditions: none recorded.

Uncertainty: none recorded.

### fr-002: functional requirement from plans/status-badge-tone/plan.md

> The badge carries its tone as a `data-tone` attribute beside `data-status`, so the stylesheet and a test can read it without matching on the label.

Conditions: none recorded.

Uncertainty: none recorded.

### fr-003: functional requirement from plans/status-badge-tone/plan.md

> A badge rendered without a tone reads as `neutral`.

Conditions: none recorded.

Uncertainty: none recorded.

### fr-004: functional requirement from plans/status-badge-tone/plan.md

> A badge given a tone carries that tone in its markup.

Conditions: none recorded.

Uncertainty: none recorded.

### fr-005: functional requirement from plans/status-badge-tone/plan.md

> A badge given no tone carries `neutral`.

Conditions: none recorded.

Uncertainty: none recorded.

## Non-functional requirements of the plan

### nfr-001: non-functional requirement of the plan from plans/status-badge-tone/plan.md

> The badge stays a presentation primitive of the shared UI: it learns nothing about records, reviews or protocols, and the tone arrives as a prop like everything else it renders.

Conditions: none recorded.

Uncertainty: none recorded.

### nfr-002: non-functional requirement of the plan from plans/status-badge-tone/plan.md

> `status` and `label` keep their meaning. A tone never changes the word the badge shows.

Conditions: none recorded.

Uncertainty: none recorded.

### nfr-003: non-functional requirement of the plan from plans/status-badge-tone/plan.md

> No feature view has to change. Existing callers keep rendering the badge as they do today.

Conditions: none recorded.

Uncertainty: none recorded.

### nfr-004: non-functional requirement of the plan from plans/status-badge-tone/plan.md

> The badge's existing tests still pass, and the tone has tests of its own.

Conditions: none recorded.

Uncertainty: none recorded.


### Candidate Review Diff

Base: 564534ea8e482a1d65b77a247f80577ff5d540d8; candidate: 40155157c0af1fa686ec5b8579755c17a6364613.
Changed paths: 4; collected patch bytes: 5792.

Complete patches below are supplied as inspection evidence. Request surrounding source when needed.

```diff
diff --git a/subs/workspace/subs/shared-ui/src/status-badge.tsx b/subs/workspace/subs/shared-ui/src/status-badge.tsx
index 0b4af93..fb09686 100644
--- a/subs/workspace/subs/shared-ui/src/status-badge.tsx
+++ b/subs/workspace/subs/shared-ui/src/status-badge.tsx
@@ -16,6 +16,7 @@ import type { ReviewStatus } from '../../contracts/src/interfaces/vocabulary.js'
 export interface StatusBadgeProps {
   status: ReviewStatus;
   label?: string;
+  tone?: 'neutral' | 'positive' | 'warning' | 'critical';
 }
 
 /** The word each status reads as when the caller supplies no label. */
@@ -25,13 +26,13 @@ const defaultLabels: Record<ReviewStatus, string> = {
 };
 
 /**
- * One status, shown as a badge. `data-status` carries the status itself, so
- * both the stylesheet and a test can read it without matching on the label a
- * feature chose.
+ * One status, shown as a badge. `data-status` carries the status itself and
+ * `data-tone` carries its presentation tone, so both the stylesheet and a
+ * test can read them without matching on the label a feature chose.
  */
-export function StatusBadge({ status, label }: StatusBadgeProps): ReactElement {
+export function StatusBadge({ status, label, tone = 'neutral' }: StatusBadgeProps): ReactElement {
   return (
-    <span className="status-badge" data-status={status}>
+    <span className="status-badge" data-status={status} data-tone={tone}>
       {label ?? defaultLabels[status]}
     </span>
   );
diff --git a/subs/workspace/subs/shared-ui/src/tests/features/status-badge-tone/render-toned-status-badge.feature b/subs/workspace/subs/shared-ui/src/tests/features/status-badge-tone/render-toned-status-badge.feature
index f4bc815..7e8e16f 100644
--- a/subs/workspace/subs/shared-ui/src/tests/features/status-badge-tone/render-toned-status-badge.feature
+++ b/subs/workspace/subs/shared-ui/src/tests/features/status-badge-tone/render-toned-status-badge.feature
@@ -8,14 +8,14 @@ Feature: render-toned-status-badge
   critical tone exposed through `data-tone`, using neutral when tone is
   omitted.
 
-  @ramify-sc-001 @ramify-pending
+  @ramify-sc-001
   Scenario: A badge given a tone carries that tone in its markup
     Given a badge for a passed review with the tone "warning"
     When the badge is rendered
     Then its markup carries the tone "warning"
     And it still reads "Passed"
 
-  @ramify-sc-002 @ramify-pending
+  @ramify-sc-002
   Scenario: A badge given no tone carries neutral
     Given a badge for a failed review with no tone
     When the badge is rendered
diff --git a/subs/workspace/subs/shared-ui/src/tests/status-badge.test.tsx b/subs/workspace/subs/shared-ui/src/tests/status-badge.test.tsx
index 8309488..5a480dc 100644
--- a/subs/workspace/subs/shared-ui/src/tests/status-badge.test.tsx
+++ b/subs/workspace/subs/shared-ui/src/tests/status-badge.test.tsx
@@ -24,4 +24,18 @@ describe('StatusBadge', () => {
     expect(markup).toContain('No revisions');
     expect(markup).not.toContain('Failed');
   });
+
+  it('carries an explicit tone without changing its wording', () => {
+    const markup = renderToStaticMarkup(<StatusBadge status="passed" tone="warning" />);
+
+    expect(markup).toContain('data-tone="warning"');
+    expect(markup).toContain('Passed');
+  });
+
+  it('uses the neutral tone when tone is omitted', () => {
+    const markup = renderToStaticMarkup(<StatusBadge status="failed" />);
+
+    expect(markup).toContain('data-tone="neutral"');
+    expect(markup).toContain('Failed');
+  });
 });
diff --git a/subs/workspace/subs/shared-ui/src/tests/steps/status-badge-tone.steps.tsx b/subs/workspace/subs/shared-ui/src/tests/steps/status-badge-tone.steps.tsx
new file mode 100644
index 0000000..39cc981
--- /dev/null
+++ b/subs/workspace/subs/shared-ui/src/tests/steps/status-badge-tone.steps.tsx
@@ -0,0 +1,65 @@
+import { Given, Then, When } from '@cucumber/cucumber';
+import type { ReactElement } from 'react';
+import { renderToStaticMarkup } from 'react-dom/server';
+
+import { StatusBadge } from '../../status-badge.js';
+
+interface BadgeScenarioState {
+  badge?: ReactElement;
+  markup?: string;
+}
+
+const states = new WeakMap<object, BadgeScenarioState>();
+
+function stateFor(world: object): BadgeScenarioState {
+  let state = states.get(world);
+  if (!state) {
+    state = {};
+    states.set(world, state);
+  }
+  return state;
+}
+
+function requireMarkup(world: object): string {
+  const markup = stateFor(world).markup;
+  if (markup === undefined) {
+    throw new Error('The badge has not been rendered');
+  }
+  return markup;
+}
+
+Given(
+  'a badge for a passed review with the tone {string}',
+  function (this: object, tone: string) {
+    if (tone !== 'neutral' && tone !== 'positive' && tone !== 'warning' && tone !== 'critical') {
+      throw new Error(`Unsupported badge tone: ${tone}`);
+    }
+    stateFor(this).badge = <StatusBadge status="passed" tone={tone} />;
+  },
+);
+
+Given('a badge for a failed review with no tone', function (this: object) {
+  stateFor(this).badge = <StatusBadge status="failed" />;
+});
+
+When('the badge is rendered', function (this: object) {
+  const state = stateFor(this);
+  if (state.badge === undefined) {
+    throw new Error('No badge was configured');
+  }
+  state.markup = renderToStaticMarkup(state.badge);
+});
+
+Then('its markup carries the tone {string}', function (this: object, tone: string) {
+  const markup = requireMarkup(this);
+  if (!markup.includes(`data-tone="${tone}"`)) {
+    throw new Error(`Expected ${markup} to carry tone ${tone}`);
+  }
+});
+
+Then('it still reads {string}', function (this: object, label: string) {
+  const markup = requireMarkup(this);
+  if (!markup.includes(`>${label}<`)) {
+    throw new Error(`Expected ${markup} to read ${label}`);
+  }
+});

```

# Current briefing update
support:## What the plan asks:0 no longer applies to this task.

# Current briefing update
support:## The scenarios of this work item:0 no longer applies to this task.

# Current briefing update
support:## Your module:0 no longer applies to this task.

# Current briefing update
support:## Default write scope:0 no longer applies to this task.

# Current briefing update
support:## Hypotheses you received:0 no longer applies to this task.

# Current briefing update
support:## The capability registry:0 no longer applies to this task.

# Current briefing update
support:## Placement decided for this work item:0 no longer applies to this task.

# Current briefing update
support:## The bounds of an engineer:0 no longer applies to this task.

# Current briefing update
support:# Registered obligations:0 no longer applies to this task.

# Current briefing update
support:work-item-package no longer applies to this task.

# Current briefing update
support:module-pointers no longer applies to this task.

# Current briefing update
support:scenario-files no longer applies to this task.

# Current procedure
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
holds the plan document the message names, read it with `snapshot_read` and
name it. A matter of taste is not a concern, and
neither is a defect of the code's correctness that does not bear on scope.
Report each distinct gap once. `suggests` may name a CheckFinding the
message below lists when you believe yours is the same gap, and is
otherwise null. You have no authority over the assignment: challenge it by
reporting, never by assuming it changed.

## Coverage

Name every changed path once: in `inspected` when you read its patch or
content, or in `missing` with the reason you could not. The harness checks
`inspected` against the complete patches delivered in this message and the
reads its tools answered. A changed-path list, patch summary or omitted patch
is not inspection evidence. No concern and nothing
missing says the candidate matches its assignment's scope; that is a valid
review, and so is an honest partial one.

# Current environment
{
  "projectRoot": "/home/app/ramify-trial-evidence/status-badge-tone-repeat-20261009T180737Z/collection-review",
  "workingDirectory": "/home/app/ramify-trial-evidence/status-badge-tone-repeat-20261009T180737Z/collection-review/plans/status-badge-tone/.harness/jobs/20261009T181051Z-4c5bfc/reviews/rq-0002/attempts/01/workspace",
  "candidate": "40155157c0af1fa686ec5b8579755c17a6364613",
  "snapshot": "36c77a3a474e60064bbb3efabdd5c0547a92133a",
  "limits": {
    "repairRoundsPerIteration": 3,
    "repairRoundsPerWorkItemGate": 3,
    "infrastructureRetriesPerGate": 2,
    "forkRetriesPerRequest": 2,
    "budgetReturnsPerIteration": 6,
    "sessionReconstructionsPerWork": 2,
    "cycleReplansPerWorkItem": 1,
    "rejectedSubmissionsPerTurn": 3,
    "rejectedToolInputsPerTurn": 3,
    "readinessRecoveries": 2,
    "stopSettleMs": 30000,
    "writerSettleMs": 30000,
    "invocationIdleMs": 300000,
    "invocationAbsoluteMs": 599948,
    "maxIterationsPerWorkItem": 12,
    "maxIterationsPerCapabilityTask": 24,
    "maxWorkItems": 64,
    "maxPlacementRequests": 32,
    "maxInvocationsPerRun": 400,
    "runAbsoluteMs": 28800000,
    "reconciliationRoundsPerWorkItem": 3,
    "laterRoundMinimumRisk": "medium",
    "maxPlanDeviations": 5,
    "commandTimeoutMs": 600000,
    "maxCommandTimeoutMs": 1800000,
    "maxInvocationIdleMs": 1800000,
    "maxInvocationAbsoluteMs": 10800000,
    "nonfunctionalRoundsPerPlan": 3
  },
  "availableTools": [
    "snapshot_list",
    "snapshot_read",
    "snapshot_search",
    "snapshot_diff",
    "submit_review"
  ],
  "views": [],
  "supportPaths": [
    "subs/harness/src/prompts/reviewer.system.md",
    "subs/harness/src/prompts/scope-review.procedure.md"
  ],
  "cucumberConfiguration": null
}

# Current task: scope
Perform scope for {"workItem":"wi-001","iteration":"wi-001.i01"}; use the current evidence and designated submission.

Submit only through `submit_review`. Only an accepted submission completes this task.