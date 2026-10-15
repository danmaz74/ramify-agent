import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, test, vi } from 'vitest';
import type { AgentEvent, AgentPort, SessionSpec } from '../../subs/agent/src/interfaces/port.js';
import { createScriptedAgent } from '../../subs/agent/src/scripted.js';
import { deliveredManifestViewSchema, metricsResponseSchema, type Role } from '../interfaces/protocol/runs.js';
import { deliveredScopeInputs } from '../measurement/inputs.js';
import * as chargeProvider from '../../subs/kpi/src/efficiency.js';
import { loadPromptPackages } from '../prompts/packages.js';
import type { TaskKind, TaskPacket } from '../prompts/tasks.js';
import { HarnessSessionOperations } from '../run/session-operations.js';
import { RunQueries } from '../../subs/projections/src/queries.js';
import { createQuerySource } from '../http/query-source.js';
import { runLayout } from '../run/records.js';
import { temporaryDirectory } from './helpers/fixture.js';
import { recordPlan23Stimulus, plan23Time as t, type Plan23Stimulus } from './helpers/plan23-recorded.js';
import { expectNoProcesses, forgetExternalTools } from './helpers/external-tools.js';
import { runSessionScenario } from './helpers/session-scenario.js';
import { byWork } from './helpers/iterations.js';
import { runPath } from './helpers/runs.js';

vi.mock('node:child_process', async original => (await import('./helpers/process-guard.js')).guardedChildProcess(await original<typeof import('node:child_process')>()));
const cleanups: (() => Promise<void>)[] = [];
afterEach(async () => { for (const cleanup of cleanups.splice(0).reverse()) await cleanup(); try { expectNoProcesses(); } finally { forgetExternalTools(); } });
async function recorded(kind: Plan23Stimulus) { const f = await recordPlan23Stimulus(kind); cleanups.push(f.cleanup); return f; }

describe('Plan 23 F6 durable observation integration', () => {
  test('snapshot inspection reaches exploration metrics with candidate-root paths from a separate reader workspace', async () => {
    const f = await recorded('snapshot');
    const exploration = f.rows.filter(row => row.type === 'exploration');
    expect(exploration).toHaveLength(6);
    expect(exploration.every(row => row.type === 'exploration' && row.data.resolvedScope?.every(path => !path.includes('reviews/workspace')))).toBe(true);
    expect(exploration[0]).toMatchObject({ data: { requestedScope: ['src/a.ts'], resolvedScope: ['src/a.ts'], files: ['src/a.ts'] } });
  });
  test('captures original identities, exact output bytes, zero matches and recorded-rate estimates once across restoration', async () => {
    // Observe the real charge provider; replay deduplication and durable writes stay here.
    const estimate = vi.spyOn(chargeProvider, 'estimateRecordedCharge');
    cleanups.push(async () => { estimate.mockRestore(); });
    const f = await recorded('restoration');
    expect(estimate).toHaveBeenCalledWith({ model: 'fixed/model', newInputTokens: 100, cachedInputTokens: 40,
      cacheWriteTokens: 10, outputTokens: 20, ratesPerMillion: { newInput: 2, cachedInput: 0.5, cacheWrite: 3, output: 4 } });
    const usage = f.rows.filter(row => row.type === 'usage');
    expect(usage).toHaveLength(1);
    expect(usage[0]).toMatchObject({ data: { charge: { ...estimate.mock.results[0]!.value, sourceRevision: 'captured-model-r1' } } });
    expect(f.rows.filter(row => row.type === 'milestone')).toEqual([expect.objectContaining({ data: { kind: 'first-engineering-action', at: t(4) } })]);
    expect(f.usage).toEqual({ input: 100, cacheRead: 40, cacheWrite: 10, output: 20, total: 170 });
  });
  test('a search the tool resolved nothing for is judged by the path it asked for, and failed apart from completed', async () => {
    const f = await recorded('failed-search');
    const rows = f.rows.filter(row => row.type === 'exploration');
    expect(rows.map(row => row.type === 'exploration' ? [row.data.callId, row.data.outcome, row.data.outsideScope] : null)).toEqual([['missing', 'failed', true], ['s1', 'completed', false]]);
  });
  test('an engineer\'s reads and searches alone record no milestone, while a mutating shell command does', async () => {
    const f = await recorded('milestone');
    expect(f.rows.filter(row => row.type === 'milestone')).toEqual([]);
    expect(f.laterRows.filter(row => row.type === 'milestone')).toEqual([expect.objectContaining({ data: { kind: 'first-engineering-action', at: t(4) } })]);
  });
  test('reopens valid/malformed/valid/torn observation rows without weakening the session ledger or duplicating source effects', async () => {
    const f = await recorded('reopened'); const restored = f.restore!;
    expect(restored.usageBefore).toBe(1); expect(restored.contextBefore).toBe(1);
    expect(restored.lastBefore).toMatchObject({ type: 'coverage-gap', data: { kind: 'observation-truncated' } });
    expect(restored.duplicateAccepted).toBe(false); expect(restored.contextAccepted).toBe(true);
    expect(restored.usageAfter).toBe(1); expect(restored.contextAfter).toBe(2);
    expect(new Set(f.restoredRows.map(row => row.n)).size).toBe(f.restoredRows.length);
  });
  test('work-item scripted routing selects the current owning objective after inherited and quoted different identities', () => {
    const routed = byWork({ 'local-architect:wi-001': [[{ kind: 'end', message: 'old' }]], 'local-architect:wi-002': [[{ kind: 'end', message: 'current' }]] });
    const prior = '# CURRENT TASK\n# Current task: assignment\nPerform assignment for {"workItem":"wi-001"}; use the current evidence and designated submission.';
    const support = '# Block brief:goal\nCurrent value; replaces any earlier value for this key.\nGoal quotes an earlier binding:\nPerform assignment for {"workItem":"wi-001"}; use the current evidence and designated submission.';
    const current = ['# Current task: completion', 'This selection supersedes every prior task selection.', 'Active role: local-architect', `Selected procedure: procedure:local-architect:main; SHA-256: ${'0'.repeat(64)}`, 'Perform completion for {"workItem":"wi-002"}; use the current evidence and designated submission.'].join('\n');
    if (typeof routed !== 'function') throw new Error('Expected callable scripted router');
    expect(routed({ role: 'local-architect', prompt: `${prior}\n\n${support}\n\n${current}` } as SessionSpec)).toEqual([{ kind: 'end', message: 'current' }]);
    expect(routed({ role: 'local-architect', prompt: prior } as SessionSpec)).toEqual([{ kind: 'end', message: 'old' }]);
  });
  const pairs: [Role, TaskKind, string][] = [
      ['initial-architect', 'initial-analysis', 'submit_initial_analysis'], ['catalog-extractor', 'intake', 'submit_intake'],
      ['catalog-extractor', 'principles', 'submit_principle_elements'], ['catalog-extractor', 'check', 'submit_catalog_check'],
      ['global-fork', 'placement', 'submit_placement_decision'], ['local-architect', 'orientation', 'submit_work_orientation'],
      ['local-architect', 'assignment', 'submit_work_item_result'], ['local-architect', 'completion', 'submit_work_item_result'],
      ['local-architect', 'repair', 'submit_work_item_result'], ['local-architect', 'capability-qualification', 'submit_capability_qualification'],
      ['local-architect', 'reconciliation', 'submit_reconciliation'], ['context-selector', 'selection', 'submit_context_selection'],
      ['context-selector', 'reselection', 'submit_context_selection'], ['capability-architect', 'capability', 'submit_capability_action'],
      ['capability-architect', 'capability-qualification', 'submit_capability_qualification'], ['capability-architect', 'reconciliation', 'submit_reconciliation'],
      ['engineer', 'engineering', 'submit_iteration_result'], ['engineer', 'repair', 'submit_iteration_result'],
      ['engineer', 'standalone-command', 'submit_iteration_result'],
      ['engineer', 'consultation', 'answer_capability_consultation'], ['contract-engineer', 'contract', 'submit_contract_result'],
      ['reviewer', 'code', 'submit_review'], ['reviewer', 'scope', 'submit_review'], ['reviewer', 'design', 'submit_review'],
      ['reviewer', 'design-orientation', 'submit_orientation'], ['failure-analyst', 'failure-analysis', 'submit_failure_analysis'],
      ['nonfunctional-coordinator', 'assessment', 'submit_nonfunctional_assessment'], ['nonfunctional-coordinator', 'action', 'submit_nonfunctional_action'],
      ['nonfunctional-coordinator', 'investigation', 'submit_nonfunctional_investigation'], ['nonfunctional-repair-engineer', 'repair', 'submit_nonfunctional_repair'],
    ];
  test('the independent role/task table covers all twelve roles and thirty bindings', () => {
    expect(pairs).toHaveLength(30); expect(new Set(pairs.map(pair => pair[0])).size).toBe(12);
  });
  test.each(pairs)('%s/%s admits actual manifests and original identity using %s without exploration calls', async (role, kind, tool) => {
    const index = pairs.findIndex(pair => pair[0] === role && pair[1] === kind);
    const directory = await temporaryDirectory(); cleanups.push(directory.remove); const packages = (await loadPromptPackages()).packages; const ordinary = (await loadPromptPackages({ capabilityWorkflow: false })).packages;
    const agent = createScriptedAgent([{ kind: 'submit', input: {} }]); const sessions = await HarnessSessionOperations.open(join(directory.path, 'operations'), agent); cleanups.push(async () => { expect(await sessions.close()).toBe(true); });
    let accepted = 0; const actualCalls: string[] = [];
      let packet: TaskPacket | null = null; let original: AgentEvent['execution']; let events = 0;
      const spec: SessionSpec = { role, scope: { workingDirectory: directory.path }, systemPrompt: 'Unused old composite head', prompt: 'Unused old task', session: { mode: 'fresh' },
        context: { compaction: 'forbidden', budgetTokens: null, budgetFraction: null, reportReserveTokens: 0 }, builtinTools: [], tools: [],
        submission: { name: tool, description: 'Current owning validator.', inputSchema: { type: 'object' }, accept: async () => { accepted++; return { accepted: true }; } },
        onEvent(event) { events++; if (event.type === 'tool-started') actualCalls.push(event.tool); expect(packet).not.toBeNull(); expect(original).toEqual(event.execution); expect(event.execution).toMatchObject({ runId: 'role-matrix', operationId: `case-${index}`, turn: 1, sourcePoint: { turn: 0 } });
          const manifest = deliveredManifestViewSchema.parse(packet!.manifest); expect(manifest.currentMessage?.bytes).toBe(Buffer.byteLength(packet!.message));
          const actual = deliveredScopeInputs({ exactOwners: [], subtrees: [], apiViews: false, architectView: false, supportDocuments: [] }, packet!.manifest);
          expect(actual.supplementary.reduce((sum, source) => sum + source.bytes, 0) + (actual.scope.brief ?? 0)).toBeGreaterThan(0);
        } };
      const session = await sessions.start({ runId: 'role-matrix', operationId: `case-${index}`, session: `display-${index}`, loaded: packages.get(role) ?? ordinary.get(role)!, spec,
        brief: { kind, objective: 'Observe the current owning task.', goal: 'Exact goal.', requirements: ['Exact requirement.'], sections: [],
          ...(kind === 'consultation' ? { consultationSubmissionSchema: JSON.stringify({ type: 'object', properties: { answer: { type: 'string', minLength: 1 }, objections: { type: 'array', items: { type: 'string' } } }, required: ['answer', 'objections'], additionalProperties: false }) } : {}),
          environment: { projectRoot: directory.path, workingDirectory: directory.path, candidate: 'current-candidate', snapshot: 'current-snapshot', limits: { stopSettleMs: 1000 }, views: [], supportPaths: [], cucumberConfiguration: null, availableTools: [tool] } },
        authority: { role }, validator: { name: tool, schema: 'fixed-structural-test-validator' }, destination: { record: `result-${index}` }, currentAuthority: async () => true,
        prepared: async value => { packet = value; }, identified: async value => { original = value; } });
      expect((await session.outcome).kind).toBe('submitted'); expect(await session.settled!()).toBe('settled'); expect(events).toBeGreaterThan(0);
    expect(accepted).toBe(1); expect(agent.sessions).toHaveLength(1);
    expect(actualCalls).toEqual([tool]);
  });
  test('every dispatched role records its actual packet and explicit size coverage before its first event', async () => {
    const admitted = new Map<string, { role: string; manifestHash: string }>();
    let projectRoot = '';
    const admissionErrors: string[] = [];
    const scenario = await runSessionScenario({ cleanup: cleanup => cleanups.push(cleanup), onOpened: opened => { projectRoot = opened.service.projectRoot; }, port: scripted => ({ ...scripted,
      bindSessionStore(store) { const operations = scripted.bindSessionStore(store); return { ...operations, async continue(input) {
        const original = input.bindings.onEvent;
        return operations.continue({ ...input, bindings: { ...input.bindings, onEvent(event) {
          const originalIdentity = event.execution!;
          const record = JSON.parse(readFileSync(runPath(projectRoot, 'review-notes', originalIdentity.runId, runLayout.invocation(originalIdentity.operationId)), 'utf8'));
          const manifest = deliveredManifestViewSchema.safeParse(record.prompt.manifest);
          if (!manifest.success) admissionErrors.push(JSON.stringify(manifest.error.issues));
          expect(manifest.success).toBe(true);
          expect(record.prompt.manifest.schema).toBe('ramify-agent.delivered-inputs/2'); expect(record.prompt.inputsHash).toMatch(/^[a-f0-9]{64}$/);
          expect(record.scope.size).not.toBeNull(); expect(record.scope.size.coverage).toMatch(/complete|partial/); expect(record.sessionOperation).toMatchObject(originalIdentity);
          // One owned-source component per record, whether the role declares a size or not.
          expect(record.scope.size.components.filter((component: { component: string }) => component.component === 'owned-source'), record.role).toHaveLength(1);
          admitted.set(originalIdentity.operationId, { role: record.role, manifestHash: record.prompt.manifest.hash }); original(event);
        } } });
      } }; } } as AgentPort) }).catch(error => { throw new Error(`${String(error)}\n${admissionErrors.join('\n')}`); });
    expect(admitted.size).toBe(scenario.events.filter(event => event.type === 'invocation-started').length);
    expect([...new Set([...admitted.values()].map(entry => entry.role))]).toEqual(expect.arrayContaining(['initial-architect', 'local-architect', 'engineer', 'contract-engineer', 'global-fork']));
    const metrics = await new RunQueries(createQuerySource(scenario.service)).metrics('review-notes', scenario.runId);
    expect(metricsResponseSchema.safeParse(metrics).success).toBe(true);
    for (const evaluation of metrics.evaluation.invocations) { expect(evaluation.efficiency, JSON.stringify(evaluation.efficiency)).toHaveProperty('manifest.hash', admitted.get(evaluation.invocation)?.manifestHash); expect(evaluation.efficiency?.operation?.operationId).toBe(evaluation.invocation); }
  }, 180_000);
});
