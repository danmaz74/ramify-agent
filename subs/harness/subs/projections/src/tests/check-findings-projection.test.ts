import { describe, expect, test } from 'vitest';
import { decideCheckFindingChange } from '../../../check-findings/src/decide.js';
import { applyCheckFindingEvent, emptyCheckFindingState } from '../../../check-findings/src/replay.js';
import type { CheckFindingCommand, CheckFindingEvent, CheckFindingState } from '../../../check-findings/src/interfaces/check-findings.js';
import type { CheckFindingCause } from '../../../../src/check-findings/records.js';
import {
  checkFindingDetailSchema, checkFindingListResponseSchema, checkFindingModuleCountsSchema, reviewListResponseSchema,
  type CheckFindingSummaryView,
} from '../../../../src/interfaces/protocol/check-findings.js';
import { planDecisionWaitSchema } from '../../../../src/interfaces/protocol/queries.js';
import { runSnapshotSchema } from '../../../../src/interfaces/protocol/runs.js';
import {
  checkFindingDetailOf, checkFindingListOf, checkFindingModulesOf, reviewListOf, type CheckFindingListQuery,
} from '../check-findings.js';
import { ProjectionError, runView, type CommittedRun } from '../inputs.js';
import { RunQueries } from '../queries.js';
import { snapshotOf } from '../snapshot.js';
import { defaultReviewPolicy } from '../../../../src/run/policy.js';
import { reviewPolicyVersion } from '../../../autonomous/subs/acceptance/src/review-policy.js';
import { type RunPolicy } from '../../../autonomous/src/run/records.js';
import { concern, decision, dispose, failure, producerCause, report } from '../../../../src/tests/helpers/check-findings.js';
import { constructedRecord, constructedRun, runId, type Line } from '../../../../src/tests/helpers/constructed.js';

/*
 * The CheckFinding protocol's projections over constructed runs: each
 * CheckFinding event is one the child decided, carried as the harness
 * carries it, and each review line holds the records the harness commits.
 * The projections are pure, so every case reads a run view and nothing
 * else.
 */

const reviewed = constructedRecord({ policy: { reviews: defaultReviewPolicy } as unknown as RunPolicy });
const { reviews: _reviews, ...noReviews } = constructedRecord().policy;
const unreviewed = constructedRecord({ policy: noReviews });

/** CheckFinding lines decided by the child against the state the earlier ones left. */
class Stream {
  state: CheckFindingState = emptyCheckFindingState();
  readonly lines: Line[] = [];

  record(commands: readonly CheckFindingCommand[], cause: CheckFindingCause = producerCause()): this {
    const events: CheckFindingEvent[] = [];
    for (const command of commands) {
      const change = decideCheckFindingChange(this.state, command);
      if (!change.ok) throw new Error(`${change.rejection.code}: ${change.rejection.message}`);
      for (const event of change.events) {
        const applied = applyCheckFindingEvent(this.state, event);
        if (!applied.ok) throw new Error(applied.rejection.message);
        this.state = applied.state;
      }
      events.push(...change.events);
    }
    this.lines.push({ type: 'check-findings-recorded', data: { cause, checkFindings: events } });
    return this;
  }

  line(line: Line): this {
    this.lines.push(line);
    return this;
  }

  revision(id: string): number {
    return this.state.findings.get(id)!.revision;
  }
}

const iso = '2026-09-24T12:00:00.000Z';

function request(id: string, workItem: string, iteration: string, kind: 'code' | 'scope' | 'design', candidate: string): Line {
  return {
    type: 'review-request-recorded',
    data: { request: id, workItem, iteration, kind, gate: `ga-${id.slice(3)}`, candidate },
    records: [{ path: `reviews/${id}/request.json`, body: {
      schema: 'ramify-agent.review-request/1', id, key: { iteration, candidate, kind, policy: reviewPolicyVersion }, workItem,
      assignment: `work-items/${workItem}/iterations/${iteration}.json`, base: `base-of-${candidate}`, gate: `ga-${id.slice(3)}`,
      tree: `tree-of-${candidate}`, guidance: [], forkPoint: { kind: 'none' },
    } }],
  };
}

type Result = { result: 'complete'; inspected: Array<{ path: string }>; concerns: number; assessment?: string; limitations?: string[] }
  | { result: 'partial'; inspected: Array<{ path: string }>; missing: Array<{ path: string; reason: string }>; concerns: number }
  | { result: 'not-verified'; reason: 'timed-out' | 'invalid-output' | 'deadline' | 'no-time-before-deadline'; detail: string };

function finished(requestId: string, attempt: string, result: Result, checkFindings: string[] = [], settles = true): Line {
  return {
    type: 'review-attempt-finished',
    data: { request: requestId, attempt, result: result.result, reason: result.result === 'not-verified' ? result.reason : null, settles, checkFindings: [] },
    records: [{ path: `reviews/${requestId}/attempts/01/attempt.json`, body: {
      schema: 'ramify-agent.review-attempt/1', id: attempt, request: requestId, queuedAt: iso, startedAt: iso, finishedAt: iso,
      invocation: `inv-r${attempt.slice(3, 7)}`, session: `ses-9${attempt.slice(3, 6)}`, requestedStart: 'fresh', actualStart: 'fresh',
      result, settles, checkFindings,
    } }],
  };
}

const inspected = [{ path: 'src/cart.ts' }];
const query = (extra: Partial<CheckFindingListQuery> = {}): CheckFindingListQuery =>
  ({ workItem: null, module: null, select: 'all', order: 'attention', after: null, limit: 50, ...extra });

/**
 * One run with every standing: two work items, their reviews, and
 * CheckFindings fixed, superseded, waived, deferred, open with a decision
 * request, repair-planned and left unresolved at completion.
 *
 * | ID | Work item | Risk | Standing |
 * | finding:case-0001 | work-item:cart | medium | fixed by assessment |
 * | finding:case-0002 | work-item:cart | low | superseded, reported as a material choice |
 * | finding:case-0003 | work-item:cart | high | waived by the architect, reported (open without `waive`) |
 * | finding:case-0004 | work-item:cart | high | open, from the latest review; unresolved, rounds exhausted |
 * | finding:case-0005 | work-item:cart | low | open; unresolved, below the floor |
 * | finding:case-0006 | work-item:checkout | medium | open, awaiting a user's decision; two modules |
 * | finding:case-0007 | work-item:checkout | high | a required scenario, fixed by check |
 * | finding:case-0008 | work-item:checkout | low | deferred |
 * | finding:case-0009 | work-item:checkout | high | open, repair planned |
 */
function fullRun(options: { readonly waive?: boolean; readonly unresolved?: ReadonlyArray<{ checkFinding: string; reason: string }> } = {}) {
  const stream = new Stream()
    .line(request('rq-0001', 'work-item:cart', 'work-item:cart.i01', 'code', 'c-01'))
    .line(request('rq-0002', 'work-item:cart', 'work-item:cart.i01', 'scope', 'c-01'))
    .line(request('rq-0003', 'work-item:cart', 'work-item:cart.i01', 'design', 'c-01'))
    .line(finished('rq-0001', 'rq-0001.a01', { result: 'complete', inspected, concerns: 3, assessment: 'Relevant behavior assessed.', limitations: ['Unrelated artifact unread.'] }, ['finding:case-0001', 'finding:case-0002', 'finding:case-0005']))
    .line(finished('rq-0002', 'rq-0002.a01', { result: 'partial', inspected, missing: [{ path: 'src/b.ts', reason: 'binary' }], concerns: 1 }, ['finding:case-0003']))
    .line(finished('rq-0003', 'rq-0003.a01', { result: 'not-verified', reason: 'timed-out', detail: 'The attempt ran past its limit' }))
    .line(request('rq-0004', 'work-item:cart', 'work-item:cart.i02', 'code', 'c-02'))
    .line(finished('rq-0004', 'rq-0004.a01', { result: 'complete', inspected, concerns: 1 }, ['finding:case-0004']))
    .line(request('rq-0005', 'work-item:checkout', 'work-item:checkout.i01', 'code', 'c-03'));
  const at = (bound: ReturnType<typeof concern>, risk: 'high' | 'medium' | 'low', modules?: string[]) =>
    ({ ...bound, owner: bound.owner.kind === 'work-item' && bound.owner.workItem === 'work-item:review-notes'
      ? { kind: 'work-item' as const, workItem: 'work-item:cart' } : bound.owner,
      judgment: { ...bound.judgment!, risk }, ...(modules ? { modules } : {}) });
  stream.record([
    report(at(concern({ key: 'concern-01', summary: 'The total rounds early' }), 'medium')),
    report(at(concern({ key: 'concern-02', summary: 'A name reads oddly' }), 'low')),
  ], producerCause('rq-0001.a01'));
  stream.record([report(at(concern({ attempt: 'rq-0002.a01', findingKey: 'draft:finding:case-0003', summary: 'The scope added a cache' }), 'high'))], producerCause('rq-0002.a01'));
  stream.record([report(at(concern({ attempt: 'rq-0004.a01', findingKey: 'draft:finding:case-0004', summary: 'The cache is never invalidated' }), 'high'))], producerCause('rq-0004.a01'));
  stream.record([report(at(concern({ key: 'concern-03', findingKey: 'draft:finding:case-0005', summary: 'The coupon path is untested' }), 'low'))], producerCause('rq-0001.a01'));
  stream.record([
    dispose('finding:case-0001', 1, decision({ action: 'fix-by-assessment', reassessed: ['cfr-0001'] })),
    dispose('finding:case-0002', 1, decision({ action: 'supersede', reassessed: ['cfr-0002'], replacement: 'The name follows the module\'s glossary' },
      { communication: { mode: 'report', choice: 'kept the glossary name', uncertainty: 'the plan does not name it', reason: 'a reader may expect the plan\'s word' } })),
    ...(options.waive === false ? [] : [
      dispose('finding:case-0003', 1, decision({ action: 'waive', authority: { kind: 'work-item-assessment', ref: 'work-item:cart.rc01' }, acceptedRisk: 'high', uncertainty: 'little' },
        { communication: { mode: 'report', choice: 'kept the cache', uncertainty: 'a later change may need invalidation', reason: 'a high risk was accepted' } })),
    ]),
  ], { kind: 'recovery', detail: 'the reconciliation' });
  stream.record([report(at(concern({ attempt: 'rq-0005.a01', findingKey: 'draft:finding:case-0006', workItem: 'work-item:checkout', summary: 'The API conflicts with the plan' }), 'medium', ['project/checkout', 'project/cart']))], producerCause('rq-0005.a01'));
  stream.record([report({ ...failure({ attempt: 'ga-0010', subject: 'scenario:case-004', tree: 't-02', findingKey: 'draft:finding:case-0007' }), owner: { kind: 'work-item', workItem: 'work-item:checkout' } })],
    { kind: 'producer', producer: 'check:scenario', attempt: 'ga-0010' });
  stream.record([report(at(concern({ attempt: 'rq-0005.a01', key: 'concern-02', findingKey: 'draft:finding:case-0008', workItem: 'work-item:checkout', summary: 'Logging is verbose' }), 'low', ['project/checkout']))], producerCause('rq-0005.a01'));
  stream.record([report(at(concern({ attempt: 'rq-0005.a01', key: 'concern-03', findingKey: 'draft:finding:case-0009', workItem: 'work-item:checkout', summary: 'The retry never stops' }), 'high', ['project/checkout']))], producerCause('rq-0005.a01'));
  stream.record([
    dispose('finding:case-0006', 1, decision({
      action: 'request-user-decision', authority: { kind: 'work-item-assessment', ref: 'work-item:checkout.rc01' },
      conflicts: [{ text: 'The API returns a list.', document: 'plans/review-notes/plan.md', revision: 'sha256:plan' }],
      options: [{ id: 'keep', summary: 'Keep the page', consequence: 'The plan text is not met' }, { id: 'list', summary: 'Return a list', consequence: 'Callers change' }],
    })),
    dispose('finding:case-0008', 1, decision({ action: 'defer', authority: { kind: 'work-item-assessment', ref: 'work-item:checkout.rc01' }, responsible: { kind: 'work-item', workItem: 'work-item:checkout' }, revisit: { kind: 'condition', condition: 'when logging is configured' } })),
    dispose('finding:case-0009', 1, decision({ action: 'plan-repair', repair: { kind: 'intent', ref: 'work-item:checkout.rc01' } })),
  ], { kind: 'recovery', detail: 'the reconciliation' });
  stream.line({ type: 'iteration-assigned', data: { workItem: 'work-item:checkout', iteration: 'work-item:checkout.i02', kind: 'engineer', scopeRevision: 1, invocation: 'inv-0029', decisions: [], corrects: 'work-item:checkout.rc01' } });
  stream.line({ type: 'invocation-started', data: { invocation: 'inv-0030', role: 'engineer', session: 'ses-0009', work: { workItem: 'work-item:checkout', iteration: 'work-item:checkout.i02' }, start: 'opened' } });
  stream.record([dispose('finding:case-0007', 1, decision({ action: 'fix-by-check', candidate: { kind: 'tree', id: 't-03' }, witness: {
    producer: 'check:scenario', attempt: 'ga-0012', obligation: { subject: 'scenario:case-004', revision: 1 }, selection: 'quick/identity',
    source: { kind: 'tree', id: 't-03' }, coverage: 'complete', outcome: 'passed', evidence: [{ kind: 'gate-attempt', ref: 'gates/ga-0012.json', hash: null }],
  } }, { actor: { kind: 'harness', reason: 'the scenario adapter' }, source: { kind: 'tree', id: 't-03' } }))], { kind: 'producer', producer: 'check:scenario', attempt: 'ga-0012' });
  stream.line({ type: 'work-item-completed', data: { workItem: 'work-item:cart', gate: 'ga-0009', unresolved: options.unresolved ?? [
    { checkFinding: 'finding:case-0004', reason: 'rounds-exhausted' }, { checkFinding: 'finding:case-0005', reason: 'below-floor' },
  ] } });
  return stream;
}

function byId(items: readonly CheckFindingSummaryView[]): Record<string, CheckFindingSummaryView> {
  return Object.fromEntries(items.map(item => [item.id, item]));
}

describe('CheckFinding lists', () => {
  test('a deliberately omitted correction remains visible without a fabricated completed review or pending request', () => {
    const view = runView(constructedRun([{ type: 'iteration-closed', data: { workItem: 'work-item:cart', iteration: 'work-item:cart.i02',
      outcome: 'accepted', gate: 'ga-0002', commit: 'c-02', notices: [],
      reviewPolicy: { mode: 'not-run', reason: 'Selected correction verified through its configured gate.' } } }], reviewed));
    const result = reviewListResponseSchema.parse(reviewListOf(view, { workItem: 'work-item:cart', after: null, limit: 50 }));
    expect(result.requests).toEqual([]);
    expect(result.coverage).toEqual({ state: 'available', requested: 0, complete: 0, partial: 0, notVerified: 0, pending: 0, notRun: 1 });
  });

  test('lists order by risk, then credibility, then recency; standings, settlements, decision requests and material choices are separate fields', () => {
    const stream = fullRun();
    const list = checkFindingListResponseSchema.parse(checkFindingListOf(runView(constructedRun(stream.lines, reviewed)), query()));
    expect(list.version).toBe(stream.lines.length);
    expect(list.items.map(item => [item.id, item.risk, item.credibility])).toEqual([
      ['finding:case-0007', 'high', 'objective'],
      ['finding:case-0009', 'high', 'ungrounded'],
      ['finding:case-0004', 'high', 'ungrounded'],
      ['finding:case-0003', 'high', 'ungrounded'],
      ['finding:case-0006', 'medium', 'ungrounded'],
      ['finding:case-0001', 'medium', 'ungrounded'],
      ['finding:case-0008', 'low', 'ungrounded'],
      ['finding:case-0005', 'low', 'ungrounded'],
      ['finding:case-0002', 'low', 'ungrounded'],
    ]);
    const items = byId(list.items);
    expect(items['finding:case-0001']).toMatchObject({ standing: 'closed', reason: 'fixed-by-assessment', settlement: { kind: 'fixed-by-assessment', by: { kind: 'agent', role: 'local-architect' } }, materialChoice: null, userCommands: [] });
    expect(items['finding:case-0002']).toMatchObject({ standing: 'closed', reason: 'superseded', settlement: { kind: 'superseded', replacement: 'The name follows the module\'s glossary' },
      materialChoice: { action: 'supersede', choice: 'kept the glossary name' } });
    expect(items['finding:case-0003']).toMatchObject({ standing: 'closed', reason: 'waived', settlement: { kind: 'waived', by: { kind: 'agent', role: 'local-architect' }, acceptedRisk: 'high' },
      materialChoice: { choice: 'kept the cache' }, unresolved: null, latestReview: false, userCommands: ['revoke'] });
    expect(items['finding:case-0004']).toMatchObject({ standing: 'open', reason: 'new', unresolved: 'rounds-exhausted', latestReview: true, settlement: null, userCommands: ['waive'] });
    expect(items['finding:case-0005']).toMatchObject({ standing: 'open', unresolved: 'below-floor', risk: 'low', latestReview: false });
    expect(items['finding:case-0006']).toMatchObject({ standing: 'open', reason: 'awaiting-user-decision', awaiting: 'user-decision', risk: 'medium', userCommands: ['respond'],
      unresolved: null, pendingUserDecision: { request: 'cfd-0004', conflicts: [{ text: 'The API returns a list.', revision: 'sha256:plan' }], options: [{ id: 'keep' }, { id: 'list' }] } });
    expect(items['finding:case-0007']).toMatchObject({ standing: 'closed', reason: 'fixed-by-check', verification: 'check', required: true, obligation: 'scenario:case-004@1', userCommands: [],
      settlement: { kind: 'fixed-by-check', by: { kind: 'harness' }, witness: { attempt: 'ga-0012', coverage: 'complete', outcome: 'passed', source: { id: 't-03' } } } });
    expect(items['finding:case-0008']).toMatchObject({ standing: 'deferred', settlement: { kind: 'deferred', revisit: 'when logging is configured' }, userCommands: ['waive'] });
    expect(items['finding:case-0009']).toMatchObject({ standing: 'open', reason: 'repair-planned', awaiting: 'repair', repair: { kind: 'intent', ref: 'work-item:checkout.rc01' }, unresolved: null });
    // A decision request is not a risk level, and a high risk asks nobody anything.
    expect(items['finding:case-0009']!.pendingUserDecision).toBeNull();
    expect(list.counts).toEqual({ total: 9, open: 4, deferred: 1, closed: 4, fixed: 2, waived: 1, superseded: 1, unresolved: 2, awaitingUser: 1 });
    expect(list.coverage).toEqual({ state: 'available', requested: 5, complete: 2, partial: 1, notVerified: 1, pending: 1 });
  });

  test('an open signal of a completed work item carries its unresolved reason, and one of non-low risk from the latest review is marked', () => {
    const stream = fullRun();
    // After work-item:cart completed, a person revokes finding:case-0003's waiver: it is open again, after the last round's basis.
    stream.record([dispose('finding:case-0003', stream.revision('finding:case-0003'), decision({ action: 'revoke-waiver', reason: 'the cache matters' }, { actor: { kind: 'user', name: 'dan' } }))]);
    const items = byId(checkFindingListOf(runView(constructedRun(stream.lines, reviewed)), query()).items);
    expect(items['finding:case-0003']).toMatchObject({ standing: 'open', reason: 'waiver-revoked', unresolved: 'raised-after-last-round', latestReview: true, materialChoice: null, settlement: null });
    expect(items['finding:case-0004']).toMatchObject({ unresolved: 'rounds-exhausted', risk: 'high', latestReview: true });
    expect(items['finding:case-0005']).toMatchObject({ unresolved: 'below-floor', risk: 'low', latestReview: false });
    // An open signal of a work item that has not completed is not unresolved.
    expect(items['finding:case-0006']).toMatchObject({ unresolved: null, latestReview: false });

    // A high signal left unresolved that surfaced in an earlier iteration's review is unresolved, not marked.
    const earlier = byId(checkFindingListOf(runView(constructedRun(fullRun({ waive: false, unresolved: [
      { checkFinding: 'finding:case-0003', reason: 'rounds-exhausted' }, { checkFinding: 'finding:case-0004', reason: 'rounds-exhausted' }, { checkFinding: 'finding:case-0005', reason: 'below-floor' },
    ] }).lines, reviewed)), query()).items);
    expect(earlier['finding:case-0003']).toMatchObject({ unresolved: 'rounds-exhausted', risk: 'high', latestReview: false });
    expect(earlier['finding:case-0004']).toMatchObject({ unresolved: 'rounds-exhausted', risk: 'high', latestReview: true });
  });

  test('the default selections: attention holds the open ones, reported adds settled material choices, all holds every standing', () => {
    const view = runView(constructedRun(fullRun().lines, reviewed));
    expect(checkFindingListOf(view, query({ select: 'attention' })).items.map(item => item.id)).toEqual(['finding:case-0009', 'finding:case-0004', 'finding:case-0006', 'finding:case-0005']);
    expect(checkFindingListOf(view, query({ select: 'reported' })).items.map(item => item.id)).toEqual(['finding:case-0009', 'finding:case-0004', 'finding:case-0003', 'finding:case-0006', 'finding:case-0005', 'finding:case-0002']);
    const attention = checkFindingListOf(view, query({ select: 'attention' }));
    // Counts cover every CheckFinding of the selection's owner and module, whatever the page shows.
    expect(attention.total).toBe(4);
    expect(attention.counts.total).toBe(9);
  });

  test('the work item and module filters, and per-module counts that do not sum to the run\'s', () => {
    const view = runView(constructedRun(fullRun().lines, reviewed));
    const wi2 = checkFindingListOf(view, query({ workItem: 'work-item:checkout' }));
    expect(wi2.items.map(item => item.id).sort()).toEqual(['finding:case-0006', 'finding:case-0007', 'finding:case-0008', 'finding:case-0009']);
    expect(wi2.coverage).toEqual({ state: 'available', requested: 1, complete: 0, partial: 0, notVerified: 0, pending: 1 });
    const checkout = checkFindingListOf(view, query({ module: 'project/checkout' }));
    expect(checkout.items.map(item => item.id).sort()).toEqual(['finding:case-0006', 'finding:case-0007', 'finding:case-0008', 'finding:case-0009']);
    expect(checkout.query).toEqual({ workItem: null, module: 'project/checkout', select: 'all', order: 'attention' });

    const modules = checkFindingModuleCountsSchema.parse(checkFindingModulesOf(view));
    expect(modules.modules).toEqual([
      { module: 'project/cart', open: 3, deferred: 0, unresolved: 2, highestOpenRisk: 'high', pendingUserDecisions: 1 },
      { module: 'project/checkout', open: 2, deferred: 1, unresolved: 0, highestOpenRisk: 'high', pendingUserDecisions: 1 },
    ]);
    const run = checkFindingListOf(view, query());
    // finding:case-0006 concerns both modules and counts in each row.
    expect(modules.modules.reduce((sum, row) => sum + row.open, 0)).toBeGreaterThan(run.counts.open);
  });

  test('pages are bounded, continue after their cursor in order, and a cursor that names no CheckFinding is refused', () => {
    const stream = new Stream();
    const risks = ['low', 'medium', 'high'] as const;
    stream.record(Array.from({ length: 3 }, (_, index) => {
      const bound = concern({ key: `concern-${index}`, findingKey: `draft:finding:case-000${index + 1}`, summary: `Concern ${index}` });
      return report({ ...bound, judgment: { ...bound.judgment!, risk: risks[index % 3]! } });
    }));
    stream.record(Array.from({ length: 2 }, (_, index) => report(concern({ attempt: 'rq-0002.a01', key: `concern-${index}`,
      findingKey: `draft:finding:case-000${index + 4}`, summary: `Late ${index}` }))), producerCause('rq-0002.a01'));
    const view = runView(constructedRun(stream.lines, reviewed));
    const first = checkFindingListOf(view, query({ limit: 2 }));
    expect(first).toMatchObject({ total: 5, shown: 2 });
    expect(first.items[0]!.risk).toBe('high');
    const seen = [...first.items];
    let next = first.next;
    while (next !== null) {
      const page = checkFindingListOf(view, query({ after: next, limit: 2 }));
      expect(page.items.length).toBeLessThanOrEqual(2);
      seen.push(...page.items);
      next = page.next;
    }
    expect(seen.map(item => item.id)).toEqual(checkFindingListOf(view, query({ limit: 5 })).items.map(item => item.id));
    expect(new Set(seen.map(item => item.id)).size).toBe(5);
    // Within one risk level the most recent report comes first.
    const highs = seen.filter(item => item.risk === 'high').map(item => Number(item.id.split('-').at(-1)));
    expect(highs).toEqual([...highs].sort((a, b) => b - a));
    const byIdOrder = checkFindingListOf(view, query({ order: 'id', limit: 3 }));
    expect(byIdOrder.items.map(item => item.id)).toEqual(['finding:case-0001', 'finding:case-0002', 'finding:case-0003']);
    expect(() => checkFindingListOf(view, query({ after: 'finding:case-9999' }))).toThrow(ProjectionError);
  });

  test('a run whose policy requested no reviews reports its coverage as unavailable, never clean, and still lists its CheckFindings', () => {
    const view = runView(constructedRun(fullRun().lines, unreviewed));
    const list = checkFindingListOf(view, query());
    expect(list.coverage).toEqual({ state: 'unavailable', reason: 'no-review-policy' });
    expect(list.total).toBe(9);
    expect(checkFindingModulesOf(view).coverage).toEqual({ state: 'unavailable', reason: 'no-review-policy' });
    expect(reviewListOf(view, { workItem: null, after: null, limit: 50 }).coverage).toEqual({ state: 'unavailable', reason: 'no-review-policy' });
    // An empty old run is not clean either.
    expect(checkFindingListOf(runView(constructedRun([], unreviewed)), query())).toMatchObject({ total: 0, coverage: { state: 'unavailable' } });
  });

  test('a review record the log holds that no longer satisfies its schema makes coverage unavailable', () => {
    const lines = fullRun().lines;
    const broken = lines.findIndex(line => line.type === 'review-attempt-finished');
    lines[broken] = { ...lines[broken]!, records: [{ path: 'reviews/rq-0001/attempts/01/attempt.json', body: { schema: 'ramify-agent.review-attempt/1', id: 'rq-0001.a01' } }] };
    const list = checkFindingListOf(runView(constructedRun(lines, reviewed)), query());
    expect(list.coverage).toEqual({ state: 'unavailable', reason: 'records-unreadable' });
  });
});

describe('CheckFinding detail and reviews', () => {
  test('the detail puts the history beside its work item, attempt, candidate diff and repair session', () => {
    const view = runView(constructedRun(fullRun().lines, reviewed));
    const detail = checkFindingDetailSchema.parse(checkFindingDetailOf(view, 'finding:case-0009'));
    expect(detail.summary).toMatchObject({ id: 'finding:case-0009', workItem: 'work-item:checkout' });
    expect(detail.reports.items).toEqual([expect.objectContaining({ id: 'cfr-0009', producer: 'review:code', attempt: 'rq-0005.a01',
      judgment: expect.objectContaining({ risk: 'high', by: { kind: 'agent', role: 'reviewer', invocation: 'inv-0010' } }) })]);
    expect(detail.decisions).toEqual({ total: 1, items: [expect.objectContaining({ action: { action: 'plan-repair', repair: { kind: 'intent', ref: 'work-item:checkout.rc01' } } })] });
    expect(detail.attempts).toEqual([{ report: 'cfr-0009', kind: 'review', attempt: 'rq-0005.a01', request: 'rq-0005', iteration: 'work-item:checkout.i01', gate: 'ga-0005',
      session: null, invocation: null, candidate: { base: 'base-of-c-03', commit: 'c-03', tree: 'tree-of-c-03' } }]);
    expect(detail.repairs).toEqual([{ decision: 'cfd-0006', reconciliation: 'work-item:checkout.rc01', iteration: 'work-item:checkout.i02',
      sessions: [{ session: 'ses-0009', invocation: 'inv-0030', role: 'engineer' }] }]);

    const reviewedFinding = checkFindingDetailOf(view, 'finding:case-0001');
    expect(reviewedFinding.attempts[0]).toMatchObject({ session: 'ses-9000', invocation: 'inv-r0001', request: 'rq-0001', candidate: { base: 'base-of-c-01', commit: 'c-01' } });
    const factual = checkFindingDetailOf(view, 'finding:case-0007');
    expect(factual.attempts[0]).toMatchObject({ kind: 'other', attempt: 'ga-0010', candidate: { tree: 't-02' } });
    expect(factual.decisions.items.at(-1)!.action).toMatchObject({ action: 'fix-by-check', witness: { attempt: 'ga-0012', obligation: 'scenario:case-004@1' } });
    expect(() => checkFindingDetailOf(view, 'finding:case-0099')).toThrow(ProjectionError);
  });

  test('historical elapsed-review reasons remain visible without manufacturing current review outcomes', () => {
    // Compatibility records only: current review execution never emits elapsed expiry.
    for (const reason of ['deadline', 'no-time-before-deadline'] as const) {
      const stream = new Stream()
        .line(request('rq-0001', 'work-item:cart', 'work-item:cart.i01', 'code', 'c-01'))
        .line(finished('rq-0001', 'rq-0001.a01', { result: 'not-verified', reason, detail: 'Retained historical elapsed-review outcome' }));
      const before = JSON.stringify(stream.lines);
      const view = runView(constructedRun(stream.lines, reviewed));
      const select = { workItem: 'work-item:cart', after: null, limit: 50 };
      const first = reviewListResponseSchema.parse(reviewListOf(view, select));
      expect(first.requests).toEqual([expect.objectContaining({ id: 'rq-0001', result: 'not-verified',
        attempts: [expect.objectContaining({ id: 'rq-0001.a01', reason })] })]);
      expect(first.coverage).toMatchObject({ state: 'available', requested: 1, notVerified: 1, pending: 0 });
      expect(reviewListOf(view, select)).toEqual(first);
      expect(JSON.stringify(stream.lines)).toBe(before);
    }
  });

  test('reviews list each request with its settling result and attempts, bounded and paged', () => {
    const view = runView(constructedRun(fullRun().lines, reviewed));
    const all = reviewListResponseSchema.parse(reviewListOf(view, { workItem: 'work-item:cart', after: null, limit: 2 }));
    expect(all).toMatchObject({ total: 4, shown: 2, next: 'rq-0002', workItem: 'work-item:cart' });
    expect(all.requests[0]).toMatchObject({ id: 'rq-0001', kind: 'code', result: 'complete', base: 'base-of-c-01', candidate: 'c-01',
      attempts: [{ id: 'rq-0001.a01', state: 'finished', result: 'complete', inspected: 1, concerns: 3, assessment: 'Relevant behavior assessed.', limitations: ['Unrelated artifact unread.'], checkFindings: ['finding:case-0001', 'finding:case-0002', 'finding:case-0005'] }] });
    const rest = reviewListOf(view, { workItem: 'work-item:cart', after: 'rq-0002', limit: 50 });
    expect(rest.requests.map(entry => [entry.id, entry.result, entry.attempts[0]?.reason ?? null])).toEqual([
      ['rq-0003', 'not-verified', 'timed-out'], ['rq-0004', 'complete', null],
    ]);
    expect(rest.next).toBeNull();
    expect(reviewListOf(view, { workItem: 'work-item:checkout', after: null, limit: 50 }).requests).toEqual([
      expect.objectContaining({ id: 'rq-0005', result: null, attempts: [] }),
    ]);
  });
});

describe('A run waiting for a person\'s decision', () => {
  const snapshot = (lines: readonly Line[]) => runSnapshotSchema.parse(snapshotOf(runView(constructedRun(lines, reviewed))));
  const held = { open: 1, waiting: true, workItems: [{ workItem: 'work-item:checkout', requests: [{ checkFinding: 'finding:case-0006', request: 'cfd-0004' }] }] };

  test('the snapshot names the open request and the work item it holds, and says the run waits; the answer clears it', () => {
    const stream = fullRun();
    expect(snapshot(stream.lines).decisionRequests).toEqual(held);

    stream.record([dispose('finding:case-0006', stream.revision('finding:case-0006'), decision({ action: 'answer-user-decision', request: 'cfd-0004', option: 'keep' },
      { actor: { kind: 'user', name: 'dana' } }))], { kind: 'user-response', command: 'answer-0001' });
    expect(snapshot(stream.lines).decisionRequests).toEqual({ open: 0, waiting: false, workItems: [] });
  });

  test('a stop or the run\'s end leaves the request open and the run no longer waits; a run with no CheckFinding has none', () => {
    const stopped = fullRun().line({ type: 'stop-requested', data: { command: {
      commandId: 'stop-0001', contentHash: 'h', receipt: { commandId: 'stop-0001', jobId: runId, sequence: 30, acceptedAt: iso },
    } } });
    expect(snapshot(stopped.lines).decisionRequests).toEqual({ ...held, waiting: false });
    const ended = fullRun().line({ type: 'job-stopped', data: { settled: true } });
    expect(snapshot(ended.lines)).toMatchObject({ state: 'stopped', decisionRequests: { ...held, waiting: false } });
    // A run begun before CheckFindings: no CheckFinding event, so no request.
    const before = snapshot([request('rq-0001', 'work-item:cart', 'work-item:cart.i01', 'code', 'c-01')]);
    expect(before.decisionRequests).toEqual({ open: 0, waiting: false, workItems: [] });
  });

  test('the plan list names a plan\'s waiting runs only', () => {
    const run = (lines: readonly Line[], jobId: string): CommittedRun => {
      const built = constructedRun(lines, constructedRecord({ jobId, policy: { reviews: defaultReviewPolicy } as unknown as RunPolicy }));
      return { ...built, entries: built.entries.map(entry => ({ ...entry, transaction: { ...entry.transaction, event: { ...entry.transaction.event, jobId } } })) };
    };
    const runs = [
      run(fullRun().lines, runId),
      run(fullRun().line({ type: 'job-stopped', data: { settled: true } }).lines, '20260921T070000Z-0ff1ce'),
      run([], '20260921T060000Z-5eed00'),
    ];
    const queries = new RunQueries({
      projectRoot: '/nonexistent', agentName: 'scripted',
      committed: (_plan, id) => runs.find(entry => entry.record.jobId === id),
      committedRuns: () => runs,
      runVersions: () => [],
    });
    const waits = queries.decisionWaits('review-notes');
    expect(waits).toEqual([{ runId, requests: 1, workItems: ['work-item:checkout'] }]);
    expect(waits.map(wait => planDecisionWaitSchema.parse(wait))).toEqual(waits);
  });
});
