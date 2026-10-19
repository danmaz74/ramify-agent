import { describe, expect, it } from 'vitest';
import { decideCheckFindingChange } from '../../../check-findings/src/decide.js';
import { applyCheckFindingEvent, emptyCheckFindingState } from '../../../check-findings/src/replay.js';
import { report, failure } from '../../../../src/tests/helpers/check-findings.js';
import { validateReconciliation } from '../../../../src/reviews/reconciliation.js';
import { validateReconciliationForExecution } from '../../../reviews/src/reconciliation.js';

describe('shared reconciliation authority', () => {
  it('refuses waiving the same required failure through harness and assisted adapters', async () => {
    const issued = decideCheckFindingChange(emptyCheckFindingState(), report(failure({ attempt: 'gate-1', subject: 'scenario:required', tree: 'tree-1' })));
    if (!issued.ok) throw new Error(issued.rejection.message);
    let state = emptyCheckFindingState();
    for (const event of issued.events) {
      const applied = applyCheckFindingEvent(state, event);
      if (!applied.ok) throw new Error(applied.rejection.message);
      state = applied.state;
    }
    const base = {
      id: 'wi-001.rc01', attention: new Map([['cf-0001', { revision: 1, reason: 'new' as const, awaiting: 'assessment' as const,
        risk: 'high' as const, modules: ['project/cart'] }]]), held: new Map([['cf-0001', 1]]),
      actor: { kind: 'agent' as const, role: 'local-architect', invocation: 'inv-1' }, source: { kind: 'tree' as const, id: 'tree-1' },
      evidence: () => [], document: async () => null,
      decide: (command: Parameters<typeof decideCheckFindingChange>[1]) => {
        const decision = decideCheckFindingChange(state, command);
        return decision.ok ? null : decision.rejection;
      },
    };
    const proposed = { relations: [], dispositions: [{ checkFinding: 'cf-0001', rationale: 'Accept the failing check.',
      communication: { mode: 'quiet' }, action: { action: 'waive', uncertainty: 'The test is flaky.' } }],
      next: { kind: 'complete' }, brief: 'Continue despite the failure.' };
    const harness = await validateReconciliation(proposed, { ...base, workItem: 'wi-001', module: 'project/cart' });
    const assisted = await validateReconciliationForExecution(proposed, { ...base, owner: 'assisted-job',
      authority: { kind: 'governing-record', ref: 'input/plan.md' }, responsible: { kind: 'run' }, waiverRefusal: () => 'requires coordinator authority' });
    expect(harness.ok).toBe(false);
    expect(assisted.ok).toBe(false);
    if (!harness.ok) expect(harness.errors.map(error => error.message).join(' ')).toMatch(/required|waiv/u);
    if (!assisted.ok) expect(assisted.errors.map(error => error.message).join(' ')).toMatch(/authority|required/u);
    expect(state.findings.get('cf-0001')?.standing).toBe('open');
  });
});
