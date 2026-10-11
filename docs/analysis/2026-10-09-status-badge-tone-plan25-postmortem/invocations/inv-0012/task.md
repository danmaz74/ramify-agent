Briefing revision: f154e073321df1d20162026c88b10ec7695f687868a0bb78e66f78842960f168; based on: 882c6cdba61b7411db40c9829a0c3334e3c9e04b7a5750ff7d1102c425d9a4f6 (post-fork)

# Block brief:goal
Current value; replaces any earlier value for this key.
# Goal
Review b999ea9a913557a04d3e2309247093027ad6b9f8

# Block brief:requirements
Current value; replaces any earlier value for this key.
# Requirements
- {"schema":"ramify-agent.review-request/1","id":"rq-0003","key":{"iteration":"wi-001.i01","candidate":"b999ea9a913557a04d3e2309247093027ad6b9f8","kind":"design","policy":"review-policy/1"},"workItem":"wi-001","assignment":"work-items/wi-001/iterations/01/assignment.json","base":"c76c24eee5847debd467199431e3aa504a90b288","gate":"ga-0002","tree":"4e706c2d97f1d5e4973e905e4331132a30e8e5ec","guidance":[{"ref":"README.md","hash":"b72856422e9dd390beb6eb5448ddfb30260ac90cbc8b91e014541c97821e2c95"},{"ref":"subs/workspace/README.md","hash":"f5cdda73289e0ff31f3b1d2d5942640a78a4224497474462fc26eef5d7546e56"},{"ref":"subs/workspace/subs/shared-ui/README.md","hash":"8cec99d7e15b169c49a10f3982e551a081e0da714105120442118184bf573435"}],"forkPoint":{"kind":"orientation","key":"ec7606cfbaf86b5371d3e3d23a15e8cd0419b9461dd1ab748ec902b6d0f58727"}}

# Block brief:support:context:0
Current value; replaces any earlier value for this key.
Design review rq-0003 of iteration wi-001.i01 of work item wi-001.

The audited candidate is commit b999ea9a913557a04d3e2309247093027ad6b9f8 (tree 4e706c2d97f1d5e4973e905e4331132a30e8e5ec); its gate ga-0002 passed. The diff is taken from c76c24eee5847debd467199431e3aa504a90b288.

The request's assignment path identifies a record in the harness run directory. Use the assignment intent below; that record is not a candidate file readable with snapshot tools.


# Block brief:support:## The iteration:0
Current value; replaces any earlier value for this key.
## The iteration

Goal: Implement optional StatusBadge tone markup with a neutral default, preserve all existing wording and caller behavior, and bind both status-badge-tone acceptance scenarios.
Approach: In `status-badge.tsx`, add an optional tone prop constrained to exactly neutral/positive/warning/critical and emit `data-tone` using neutral when omitted, while leaving data-status and label/default-label selection intact. Extend the existing static-markup Vitest suite to cover an explicit tone, the neutral default, and wording preservation. Add TypeScript/TSX Cucumber steps under this module’s `src/tests/steps/` that render StatusBadge to static markup and bind both supplied scenarios; keep scenario state isolated and declare no fake dependency because the real pure presentation primitive is exercised. Do not edit the generated feature file or require changes from existing feature-view callers.
Completion evidence: The focused shared-ui unit tests demonstrate the allowed explicit tone in data-tone, neutral on omission, and unchanged status/custom-label wording; both supplied Cucumber scenarios are bound to the real StatusBadge static markup with no fakes and pass; project type-check, tests, scenarios, and structural audit remain green.


# Block brief:support:## The guidance this design is judged against:0
Current value; replaces any earlier value for this key.
## The guidance this design is judged against

Each file is part of the audited candidate. If this session has not read one of them yet, read it with `snapshot_read` before you judge.

- README.md (sha256 b72856422e9d)
- subs/workspace/README.md (sha256 f5cdda73289e)
- subs/workspace/subs/shared-ui/README.md (sha256 8cec99d7e15b)


# Block brief:support:## The changed paths:0
Current value; replaces any earlier value for this key.
## The changed paths

- M subs/workspace/subs/shared-ui/src/status-badge.tsx
- M subs/workspace/subs/shared-ui/src/tests/features/status-badge-tone/render-status-badge-with-tone.feature
- M subs/workspace/subs/shared-ui/src/tests/status-badge.test.tsx
- A subs/workspace/subs/shared-ui/src/tests/steps/status-badge-tone.steps.tsx


Use the supplied changed-path list and complete patches delivered in this message. Fetch a relevant patch with snapshot_diff only when it is not supplied, and inspect the source required to judge it. List paths with snapshot_diff only if the supplied list is unavailable. The audited diff includes harness-produced changes; no feature or pending-tag patch is hidden.

Harness pending-tag binding: sc-001 in subs/workspace/subs/shared-ui/src/tests/features/status-badge-tone/render-status-badge-with-tone.feature, exact candidate sha256 508226a39238609158ba9acec42fdf9aa165b882f7ebe263cbfb6df97646659e, accepted producer inv-0007, submission bb01502d79e6ff008ce3f623021af8c05dc4240bc344a6d86de58b04e7dbb681. This attribution supplies provenance; review the actual audited patch.

Harness pending-tag binding: sc-002 in subs/workspace/subs/shared-ui/src/tests/features/status-badge-tone/render-status-badge-with-tone.feature, exact candidate sha256 508226a39238609158ba9acec42fdf9aa165b882f7ebe263cbfb6df97646659e, accepted producer inv-0007, submission bb01502d79e6ff008ce3f623021af8c05dc4240bc344a6d86de58b04e7dbb681. This attribution supplies provenance; review the actual audited patch.


# Block brief:support:candidate-diff
Current value; replaces any earlier value for this key.
### Candidate Review Diff

Base: c76c24eee5847debd467199431e3aa504a90b288; candidate: b999ea9a913557a04d3e2309247093027ad6b9f8.
Changed paths: 4; collected patch bytes: 6957.

Complete patches below are supplied as inspection evidence. Request surrounding source when needed.

```diff
diff --git a/subs/workspace/subs/shared-ui/src/status-badge.tsx b/subs/workspace/subs/shared-ui/src/status-badge.tsx
index 0b4af93..696cc48 100644
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
+ * One status, shown as a badge. `data-status` and `data-tone` carry its
+ * presentation choices, so both the stylesheet and a test can read them
+ * without matching on the label a feature chose.
  */
-export function StatusBadge({ status, label }: StatusBadgeProps): ReactElement {
+export function StatusBadge({ status, label, tone = 'neutral' }: StatusBadgeProps): ReactElement {
   return (
-    <span className="status-badge" data-status={status}>
+    <span className="status-badge" data-status={status} data-tone={tone}>
       {label ?? defaultLabels[status]}
     </span>
   );
diff --git a/subs/workspace/subs/shared-ui/src/tests/features/status-badge-tone/render-status-badge-with-tone.feature b/subs/workspace/subs/shared-ui/src/tests/features/status-badge-tone/render-status-badge-with-tone.feature
index c5263a7..c38d3ca 100644
--- a/subs/workspace/subs/shared-ui/src/tests/features/status-badge-tone/render-status-badge-with-tone.feature
+++ b/subs/workspace/subs/shared-ui/src/tests/features/status-badge-tone/render-status-badge-with-tone.feature
@@ -7,14 +7,14 @@ Feature: render-status-badge-with-tone
   Render a status badge with an optional presentation tone exposed in markup,
   defaulting to neutral while preserving the displayed status wording.
 
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
index 8309488..93d07a0 100644
--- a/subs/workspace/subs/shared-ui/src/tests/status-badge.test.tsx
+++ b/subs/workspace/subs/shared-ui/src/tests/status-badge.test.tsx
@@ -12,15 +12,30 @@ import { StatusBadge } from '../status-badge.js';
  */
 
 describe('StatusBadge', () => {
-  it('reads a status back as its own word when no label is given', () => {
-    expect(renderToStaticMarkup(<StatusBadge status="passed" />)).toContain('Passed');
-    expect(renderToStaticMarkup(<StatusBadge status="failed" />)).toContain('Failed');
+  it('reads a status back as its own word and uses a neutral tone by default', () => {
+    const passedMarkup = renderToStaticMarkup(<StatusBadge status="passed" />);
+    const failedMarkup = renderToStaticMarkup(<StatusBadge status="failed" />);
+
+    expect(passedMarkup).toContain('data-tone="neutral"');
+    expect(passedMarkup).toContain('Passed');
+    expect(failedMarkup).toContain('data-tone="neutral"');
+    expect(failedMarkup).toContain('Failed');
+  });
+
+  it('carries an explicit tone without changing the default status wording', () => {
+    const markup = renderToStaticMarkup(<StatusBadge status="passed" tone="warning" />);
+
+    expect(markup).toContain('data-tone="warning"');
+    expect(markup).toContain('Passed');
   });
 
-  it('carries the status as an attribute whatever the label says', () => {
-    const markup = renderToStaticMarkup(<StatusBadge status="failed" label="No revisions" />);
+  it('carries the status as an attribute without changing a custom label', () => {
+    const markup = renderToStaticMarkup(
+      <StatusBadge status="failed" label="No revisions" tone="critical" />,
+    );
 
     expect(markup).toContain('data-status="failed"');
+    expect(markup).toContain('data-tone="critical"');
     expect(markup).toContain('No revisions');
     expect(markup).not.toContain('Failed');
   });
diff --git a/subs/workspace/subs/shared-ui/src/tests/steps/status-badge-tone.steps.tsx b/subs/workspace/subs/shared-ui/src/tests/steps/status-badge-tone.steps.tsx
new file mode 100644
index 0000000..c4824a3
--- /dev/null
+++ b/subs/workspace/subs/shared-ui/src/tests/steps/status-badge-tone.steps.tsx
@@ -0,0 +1,60 @@
+import assert from 'node:assert/strict';
+
+import { Given, Then, When } from '@cucumber/cucumber';
+import { renderToStaticMarkup } from 'react-dom/server';
+
+import { StatusBadge, type StatusBadgeProps } from '../../status-badge.js';
+
+interface StatusBadgeWorld {
+  badgeProps?: StatusBadgeProps;
+  badgeMarkup?: string;
+}
+
+function isStatusBadgeTone(tone: string): tone is NonNullable<StatusBadgeProps['tone']> {
+  return tone === 'neutral' || tone === 'positive' || tone === 'warning' || tone === 'critical';
+}
+
+function requireBadgeProps(world: StatusBadgeWorld): StatusBadgeProps {
+  assert.ok(world.badgeProps, 'A badge must be given before it is rendered');
+  return world.badgeProps;
+}
+
+function requireBadgeMarkup(world: StatusBadgeWorld): string {
+  assert.ok(world.badgeMarkup, 'The badge must be rendered before its markup is checked');
+  return world.badgeMarkup;
+}
+
+Given(
+  'a badge for a passed review with the tone {string}',
+  function (this: StatusBadgeWorld, tone: string) {
+    assert.ok(isStatusBadgeTone(tone), `Unsupported status badge tone: ${tone}`);
+    this.badgeProps = { status: 'passed', tone };
+    delete this.badgeMarkup;
+  },
+);
+
+Given('a badge for a failed review with no tone', function (this: StatusBadgeWorld) {
+  this.badgeProps = { status: 'failed' };
+  delete this.badgeMarkup;
+});
+
+When('the badge is rendered', function (this: StatusBadgeWorld) {
+  this.badgeMarkup = renderToStaticMarkup(<StatusBadge {...requireBadgeProps(this)} />);
+});
+
+Then(
+  'its markup carries the tone {string}',
+  function (this: StatusBadgeWorld, tone: string) {
+    assert.ok(
+      requireBadgeMarkup(this).includes(`data-tone="${tone}"`),
+      `Expected rendered badge markup to carry tone "${tone}"`,
+    );
+  },
+);
+
+Then('it still reads {string}', function (this: StatusBadgeWorld, label: string) {
+  assert.ok(
+    requireBadgeMarkup(this).includes(`>${label}</span>`),
+    `Expected rendered badge markup to read "${label}"`,
+  );
+});

```

# Block brief:support:starting-points
Current value; replaces any earlier value for this key.
## Recorded starting points

Optional navigation help. Notes are producer judgments, not verified current facts, completion evidence or read/write authority. Inspect the current source and explore further when a hint is stale or unhelpful. Origin boundaries describe where pointers were recorded; they do not establish unchanged files.
Paths are relative to the pinned candidate b999ea9a913557a04d3e2309247093027ad6b9f8 (tree 4e706c2d97f1d5e4973e905e4331132a30e8e5ec); use snapshot tools.

- {"path":"subs/workspace/subs/shared-ui/src/status-badge.tsx","note":"Extend the current props and span markup while preserving defaultLabels and label semantics.","origins":[{"producer":"architect assignment","workItem":"wi-001","iteration":"wi-001.i01","invocation":"inv-0006","boundary":"c76c24eee5847debd467199431e3aa504a90b288"}]}
- {"path":"subs/workspace/subs/shared-ui/src/tests/status-badge.test.tsx","note":"Existing renderToStaticMarkup tests establish the regression style and current guarantees.","origins":[{"producer":"architect assignment","workItem":"wi-001","iteration":"wi-001.i01","invocation":"inv-0006","boundary":"c76c24eee5847debd467199431e3aa504a90b288"}]}
- {"path":"subs/workspace/subs/shared-ui/src/tests/features/status-badge-tone/render-status-badge-with-tone.feature","note":"Read-only harness-owned scenarios whose exact steps must be bound from src/tests/steps/.","origins":[{"producer":"architect assignment","workItem":"wi-001","iteration":"wi-001.i01","invocation":"inv-0006","boundary":"c76c24eee5847debd467199431e3aa504a90b288"}]}
- {"path":"subs/workspace/subs/shared-ui/src/status-badge.tsx","note":"StatusBadge tone contract, neutral default, and data-tone rendering.","origins":[{"producer":"engineer accepted result","workItem":"wi-001","iteration":"wi-001.i01","invocation":"inv-0007","boundary":"b999ea9a913557a04d3e2309247093027ad6b9f8"}]}
- {"path":"subs/workspace/subs/shared-ui/src/tests/status-badge.test.tsx","note":"Static-markup coverage for tones and wording preservation.","origins":[{"producer":"engineer accepted result","workItem":"wi-001","iteration":"wi-001.i01","invocation":"inv-0007","boundary":"b999ea9a913557a04d3e2309247093027ad6b9f8"}]}
- {"path":"subs/workspace/subs/shared-ui/src/tests/steps/status-badge-tone.steps.tsx","note":"Real-provider Cucumber bindings with per-scenario World state.","origins":[{"producer":"engineer accepted result","workItem":"wi-001","iteration":"wi-001.i01","invocation":"inv-0007","boundary":"b999ea9a913557a04d3e2309247093027ad6b9f8"}]}

# Block brief:support:design-guidance
Withdrawn; this block no longer applies.


# Block procedure:reviewer:design
Current value; replaces any earlier value for this key.
# Current procedure
Do this, in order:

1. Reuse earlier understanding of captured guidance with the same known identity.
   Refresh guidance whose identity changed or cannot be established. Only the
   listed guidance is the standard; a preference of your own is not. Every
   reported concern still requires current `snapshot_read` evidence for its ground.
2. Use the supplied canonical changed-path list; if unavailable, list paths once
   with `snapshot_diff`. Read the complete patches supplied in this message.
   Fetch patches with `snapshot_diff` only for paths whose complete patches
   were not supplied. Read the surrounding source where a patch alone does
   not show the design.
3. Ask of each change: does it follow the guidance's principles and the
   module's stated responsibility, or does it duplicate, entangle or place
   something where the guidance says it does not belong?
4. Submit.

## What a concern is

A concern is a design problem the guidance lets you name: the rule or
responsibility it departs from, cited by the guidance file, the consequence,
the evidence in the candidate, how sure you are, a bounded remedy and its
risk. Its ground is that guidance file, read with `snapshot_read` in this
review even if an earlier conversation already showed it to you.
Correctness defects and scope gaps belong to other reviews. Report each
distinct problem once. `suggests` may name a CheckFinding the message below
lists when you believe yours is the same problem, and is otherwise null.

## Coverage

Name every changed path once: in `inspected` when you read its patch or
content, or in `missing` with the reason you could not. The harness checks
`inspected` against the complete patches delivered in this message and the
reads its tools answered. A changed-path list, patch summary or omitted patch
is not inspection evidence. No concern and nothing
missing says the candidate's design follows the listed guidance; that is a
valid review, and so is an honest partial one.

# Block environment:workingDirectory
Current value; replaces any earlier value for this key.
{
  "workingDirectory": "/tmp/claude-1000/-ramify/669eae14-eb15-4a6b-9927-63ba7b876b24/scratchpad/trial/collection-review/plans/status-badge-tone/.harness/jobs/20261009T193340Z-51f42e/reviews/rq-0003/attempts/01/workspace"
}

# Block environment:candidate
Current value; replaces any earlier value for this key.
{
  "candidate": "b999ea9a913557a04d3e2309247093027ad6b9f8"
}

# Block environment:snapshot
Current value; replaces any earlier value for this key.
{
  "snapshot": "4e706c2d97f1d5e4973e905e4331132a30e8e5ec"
}

# Block environment:limits
Current value; replaces any earlier value for this key.
{
  "limits": {
    "budgetReturnsPerIteration": 6,
    "commandTimeoutMs": 600000,
    "cycleReplansPerWorkItem": 1,
    "forkRetriesPerRequest": 2,
    "infrastructureRetriesPerGate": 2,
    "invocationAbsoluteMs": 599965,
    "invocationIdleMs": 300000,
    "laterRoundMinimumRisk": "medium",
    "maxCommandTimeoutMs": 1800000,
    "maxInvocationAbsoluteMs": 10800000,
    "maxInvocationIdleMs": 1800000,
    "maxInvocationsPerRun": 400,
    "maxIterationsPerCapabilityTask": 24,
    "maxIterationsPerWorkItem": 12,
    "maxPlacementRequests": 32,
    "maxPlanDeviations": 5,
    "maxWorkItems": 64,
    "nonfunctionalRoundsPerPlan": 3,
    "readinessRecoveries": 2,
    "reconciliationRoundsPerWorkItem": 3,
    "rejectedSubmissionsPerTurn": 3,
    "rejectedToolInputsPerTurn": 3,
    "repairRoundsPerIteration": 3,
    "repairRoundsPerWorkItemGate": 3,
    "runAbsoluteMs": 28800000,
    "sessionReconstructionsPerWork": 2,
    "stopSettleMs": 30000,
    "writerSettleMs": 30000
  }
}

# Block environment:availableTools
Current value; replaces any earlier value for this key.
{
  "availableTools": [
    "snapshot_list",
    "snapshot_read",
    "snapshot_search",
    "snapshot_diff",
    "submit_review"
  ]
}

# Block environment:views
Current value; replaces any earlier value for this key.
{
  "views": []
}

# Block environment:supportPaths
Current value; replaces any earlier value for this key.
{
  "supportPaths": [
    "subs/harness/src/prompts/reviewer.system.md",
    "subs/harness/src/prompts/design-review.procedure.md"
  ]
}

# Current task: design
This selection supersedes every prior task selection.
Active role: reviewer
Selected procedure: procedure:reviewer:design; SHA-256: ea711325e08c341d37d30c0fa451f6164710914b825aab9e44f35a41611f7940
Perform design for {"workItem":"wi-001","iteration":"wi-001.i01"}; use the current evidence and designated submission.

Submit only through `submit_review`. Only an accepted submission completes this task.