import { describe, expect, test } from 'vitest';
import type { ModuleTree, ViewIdentity } from '../../../../src/interfaces/protocol/evidence.js';
import { moduleCapabilityComparisonResponseSchema, runQueryLimits, type ModuleCapabilityComparisonResponse } from '../../../../src/interfaces/protocol/runs.js';
import { runView } from '../inputs.js';
import { moduleCapabilityComparisonOf, type AnalysisCoverageLimits } from '../module-capabilities.js';
import { capabilityProgressOf } from '../progress.js';
import { entryAssignmentsSchema } from '../../../autonomous/subs/planning/src/records.js';
import { at, constructedRun, forecast, hash, item, obligation, registered, requirement, reviews, type Line } from '../../../../src/tests/helpers/constructed.js';

const root = 'collection-review';

function progressOf(lines: readonly Line[]) {
  return capabilityProgressOf(runView(constructedRun(lines)));
}

describe('the capability progress projection', () => {
  test('todo, working, completed and a forecast', () => {
    const progress = progressOf([
      { type: 'job-started', data: {} },
      {
        type: 'analysis-accepted', data: {},
        records: [
          ...['capability:not-started', 'capability:under-way', 'capability:done', 'capability:no-item'].map(capability => ({ path: at('registry', capability), body: registered(capability) })),
          { path: at('hypotheses', 'hypothesis:h1'), body: forecast('hypothesis:h1', 'capability:forecast-only') },
          { path: 'work-items/wi-001/item.json', body: item('work-item:case-001', { entry: 'capability:not-started' }) },
          { path: 'work-items/wi-002/item.json', body: item('work-item:case-002', { entry: 'capability:under-way' }) },
          { path: 'work-items/wi-003/item.json', body: item('work-item:case-003', { entry: 'capability:done' }) },
        ],
      },
      { type: 'work-item-started', data: { workItem: 'work-item:case-002', module: reviews } },
      { type: 'work-item-started', data: { workItem: 'work-item:case-003', module: reviews } },
      { type: 'work-item-completed', data: { workItem: 'work-item:case-003', gate: 'ga-0004' } },
    ]);
    expect(progress.map(row => [row.capability, row.state, row.tentative, row.entry, row.workItems, row.evidence])).toEqual([
      ['capability:not-started', 'todo', false, true, ['work-item:case-001'], []],
      ['capability:under-way', 'working', false, true, ['work-item:case-002'], []],
      ['capability:done', 'completed', false, true, ['work-item:case-003'], ['ga-0004']],
      // An expected need with no work started is `todo`, not absent.
      ['capability:no-item', 'todo', false, true, [], []],
      ['capability:forecast-only', 'todo', true, false, [], []],
    ]);
    for (const row of progress) expect(row.reason.length).toBeGreaterThan(0);
  });

  test('`completed` is stated only with current verification evidence', () => {
    const lines: Line[] = [
      { type: 'analysis-accepted', data: {}, records: [{ path: at('registry', 'capability:done'), body: registered('capability:done') }, { path: 'wi', body: item('work-item:case-001', { entry: 'capability:done' }) }] },
      { type: 'work-item-started', data: { workItem: 'work-item:case-001', module: reviews } },
    ];
    expect(progressOf(lines)[0]).toMatchObject({ state: 'working', evidence: [] });
    // The completing event names the gate; without it nothing is completed.
    expect(progressOf([...lines, { type: 'work-item-completed', data: { workItem: 'work-item:case-001', gate: 'ga-0002' } }])[0]).toMatchObject({ state: 'completed', evidence: ['ga-0002'] });
  });

  test('a capability the registry holds is never listed a second time as a forecast', () => {
    const progress = progressOf([{
      type: 'analysis-accepted', data: {},
      records: [{ path: at('registry', 'capability:send-email'), body: registered('capability:send-email') }, { path: at('hypotheses', 'hypothesis:h1'), body: forecast('hypothesis:h1', 'capability:send-email') }],
    }]);
    expect(progress).toHaveLength(1);
    expect(progress[0]).toMatchObject({ capability: 'capability:send-email', entry: true, tentative: false });
  });
});

describe('M2: provider waits, verified reuse, reopened evidence and superseded hypotheses', () => {
  // A consumer, `send-button`, delegates `send-email` to a provider through
  // contract ct-001; its requirement rq-001 attaches to the obligation.
  const delegation: Line[] = [
    { type: 'job-started', data: {} },
    {
      type: 'analysis-accepted', data: {},
      records: [
        { path: at('registry', 'capability:send-button'), body: registered('capability:send-button') },
        { path: 'work-items/wi-001/item.json', body: item('work-item:case-001', { entry: 'capability:send-button' }) },
      ],
    },
    { type: 'work-item-started', data: { workItem: 'work-item:case-001', module: reviews } },
    {
      type: 'contract-registered', data: {},
      records: [
        { path: at('registry', 'capability:send-email'), body: registered('capability:send-email', { origin: 'local-decision', decision: 'ld-wi-001-01', consumers: [{ capability: 'capability:send-button', workItem: 'work-item:case-001' }] }) },
        { path: at('obligations', 'provider-obligation:case-001'), body: obligation('contract:case-001', 'capability:send-email') },
        { path: at('requirements', 'consumer-requirement:case-001'), body: requirement('consumer-requirement:case-001', 'work-item:case-001', 'capability:send-button', 'contract:case-001') },
        { path: 'work-items/wi-002/item.json', body: item('work-item:case-002', { obligation: { id: 'provider-obligation:case-001', revision: 1, hash } }, { startedFor: 'work-item:case-001' }) },
      ],
    },
    { type: 'work-item-yielded', data: { workItem: 'work-item:case-001', requirements: ['consumer-requirement:case-001'], invocation: 'inv-0004' } },
  ];

  test('a provider wait stays working, with its reason', () => {
    const progress = progressOf(delegation);
    const consumer = progress.find(row => row.capability === 'capability:send-button')!;
    expect(consumer.state).toBe('working');
    expect(consumer.reason).toBe('Waiting for provider provider-obligation:case-001 (consumer-requirement:case-001)');
    expect(consumer.dependsOn).toEqual([{ capability: 'capability:send-email', tentative: false }]);
    expect(progress.find(row => row.capability === 'capability:send-email')).toMatchObject({ state: 'todo', workItems: ['work-item:case-002'] });

    // The provider conforms and the consumer resumes; its requirement is
    // still open, so it is still working, now verifying.
    const resumed = progressOf([
      ...delegation,
      { type: 'work-item-started', data: { workItem: 'work-item:case-002', module: reviews } },
      { type: 'provider-conformed', data: { obligation: 'provider-obligation:case-001', revision: 1, workItem: 'work-item:case-002', iteration: 'wi-002.i01', gate: 'ga-0006' } },
      { type: 'work-item-completed', data: { workItem: 'work-item:case-002', gate: 'ga-0007' } },
      { type: 'work-item-resumed', data: { workItem: 'work-item:case-001', requirements: ['consumer-requirement:case-001'] } },
    ]);
    expect(resumed.find(row => row.capability === 'capability:send-button')).toMatchObject({ state: 'working', reason: expect.stringContaining('verifying consumer-requirement:case-001') });
    expect(resumed.find(row => row.capability === 'capability:send-email')).toMatchObject({ state: 'completed', evidence: ['ga-0007', 'ga-0006'] });

    // A passing gate on the consumer while its requirement is unverified is
    // a fake-backed pass: still working.
    const fakeBacked = progressOf([...delegation, { type: 'work-item-completed', data: { workItem: 'work-item:case-001', gate: 'ga-0005' } }]);
    expect(fakeBacked.find(row => row.capability === 'capability:send-button')).toMatchObject({ state: 'working', reason: expect.stringContaining('consumer-requirement:case-001 at revision 1') });

    // Verified at the current revision, it is completed.
    const verified = progressOf([
      ...delegation,
      { type: 'work-item-resumed', data: { workItem: 'work-item:case-001', requirements: ['consumer-requirement:case-001'] } },
      { type: 'requirement-verified', data: { requirement: 'consumer-requirement:case-001', revision: 1, workItem: 'work-item:case-001', iteration: 'wi-001.i02', gate: 'ga-0008' } },
      { type: 'work-item-completed', data: { workItem: 'work-item:case-001', gate: 'ga-0009' } },
    ]);
    expect(verified.find(row => row.capability === 'capability:send-button')).toMatchObject({ state: 'completed', evidence: ['ga-0009', 'ga-0008'] });
  });

  test('verified reuse is completed', () => {
    const reuse: Line[] = [
      {
        type: 'analysis-accepted', data: {},
        records: [
          { path: at('registry', 'capability:review-panel'), body: registered('capability:review-panel') },
          { path: 'work-items/wi-001/item.json', body: item('work-item:case-001', { entry: 'capability:review-panel' }) },
        ],
      },
      { type: 'work-item-started', data: { workItem: 'work-item:case-001', module: reviews } },
      // A decision reuses an existing capability; it gets no work item of its own.
      {
        type: 'decision-accepted', data: {},
        records: [{ path: at('registry', 'capability:format-date'), body: registered('capability:format-date', { origin: 'global-decision', decision: 'gd-001', owner: root, consumers: [{ capability: 'capability:review-panel', workItem: 'work-item:case-001' }] }) }],
      },
    ];
    expect(progressOf(reuse).find(row => row.capability === 'capability:format-date')).toMatchObject({ state: 'working', reason: expect.stringContaining('verified when consumer work-item:case-001 passes') });
    const done = progressOf([...reuse, { type: 'work-item-completed', data: { workItem: 'work-item:case-001', gate: 'ga-0003' } }]);
    expect(done.find(row => row.capability === 'capability:format-date')).toMatchObject({
      state: 'completed', workItems: [], evidence: ['ga-0003'], reason: expect.stringContaining('Verified reuse'),
    });
    expect(done.find(row => row.capability === 'capability:review-panel')!.dependsOn).toEqual([{ capability: 'capability:format-date', tentative: false }]);
  });

  test('evidence-reopened returns a completed capability to working', () => {
    const completed: Line[] = [
      ...delegation,
      { type: 'work-item-started', data: { workItem: 'work-item:case-002', module: reviews } },
      { type: 'provider-conformed', data: { obligation: 'provider-obligation:case-001', revision: 1, workItem: 'work-item:case-002', iteration: 'wi-002.i01', gate: 'ga-0006' } },
      { type: 'work-item-completed', data: { workItem: 'work-item:case-002', gate: 'ga-0007' } },
    ];
    expect(progressOf(completed).find(row => row.capability === 'capability:send-email')!.state).toBe('completed');

    const reopened = progressOf([
      ...completed,
      {
        type: 'evidence-reopened',
        data: {
          cause: 'contract-revision', contract: 'contract:case-001', revision: 2, iteration: 'wi-001.i03', obligation: 'provider-obligation:case-001', requirements: ['consumer-requirement:case-001'],
          bindings: [], followUps: [{ workItem: 'work-item:case-003', follows: 'work-item:case-002' }], superseded: [],
        },
        records: [
          { path: at('obligations', 'provider-obligation:case-001', 2), body: obligation('contract:case-001', 'capability:send-email', 2) },
          { path: at('requirements', 'consumer-requirement:case-001', 2), body: requirement('consumer-requirement:case-001', 'work-item:case-001', 'capability:send-button', 'contract:case-001', 2) },
          { path: 'work-items/wi-003/item.json', body: item('work-item:case-003', { obligation: { id: 'provider-obligation:case-001', revision: 2, hash } }, { follows: 'work-item:case-002', startedFor: null }) },
        ],
      },
    ]);
    const provider = reopened.find(row => row.capability === 'capability:send-email')!;
    expect(provider.state).toBe('working');
    expect(provider.reason).toBe('Evidence reopened by contract-revision of contract:case-001 at revision 2; follow-up work-item:case-003 of completed work-item:case-002 is open');
    expect(provider.workItems).toEqual(['work-item:case-002', 'work-item:case-003']);
    // The earlier completion stays in the evidence as history.
    expect(provider.evidence).toContain('ga-0007');
  });

  test('a reopened capability is not implemented now, though its earlier evidence remains', () => {
    const entries = {
      path: 'analysis/entries.json',
      body: entryAssignmentsSchema.parse({
        schema: 'ramify-agent.entry-assignments/2', view: { status: 'placeholder' },
        entries: [{ capability: 'send-button', capabilityId: 'capability:send-button', description: 'A send button.', owner: reviews, functionalRequirementIds: [], functionalAcceptanceIds: [], contextIds: [], citations: [] }],
      }),
    };
    const completed: Line[] = [
      { type: 'analysis-accepted', data: {}, records: [entries] },
      ...delegation,
      { type: 'work-item-started', data: { workItem: 'work-item:case-002', module: reviews } },
      { type: 'provider-conformed', data: { obligation: 'provider-obligation:case-001', revision: 1, workItem: 'work-item:case-002', iteration: 'wi-002.i01', gate: 'ga-0006' } },
      { type: 'work-item-completed', data: { workItem: 'work-item:case-002', gate: 'ga-0007' } },
    ];
    const tree = { status: 'unavailable' as const, message: 'not materialized' };
    const rows = (lines: readonly Line[]) => moduleCapabilityComparisonOf(runView(constructedRun(lines)), tree, { limits: [] })
      .modules.flatMap(entry => entry.capabilities.map(row => [entry.module, row.capability, row.initial.map(association => association.role), row.implementedHere?.evidence ?? null]));
    // Completed and first registered during the run: Implemented only.
    expect(rows(completed)).toEqual([
      [reviews, 'capability:send-button', ['entry-owner'], null],
      [reviews, 'capability:send-email', [], ['ga-0007', 'ga-0006']],
    ]);
    const reopened: Line[] = [
      ...completed,
      {
        type: 'evidence-reopened',
        data: {
          cause: 'contract-revision', contract: 'contract:case-001', revision: 2, iteration: 'wi-001.i03', obligation: 'provider-obligation:case-001', requirements: ['consumer-requirement:case-001'],
          bindings: [], followUps: [{ workItem: 'work-item:case-003', follows: 'work-item:case-002' }], superseded: [],
        },
        records: [
          { path: at('obligations', 'provider-obligation:case-001', 2), body: obligation('contract:case-001', 'capability:send-email', 2) },
          { path: at('requirements', 'consumer-requirement:case-001', 2), body: requirement('consumer-requirement:case-001', 'work-item:case-001', 'capability:send-button', 'contract:case-001', 2) },
          { path: 'work-items/wi-003/item.json', body: item('work-item:case-003', { obligation: { id: 'provider-obligation:case-001', revision: 2, hash } }, { follows: 'work-item:case-002', startedFor: null }) },
        ],
      },
    ];
    // Reopened, it is working: no row, since it was neither forecast nor is it implemented now.
    expect(rows(reopened)).toEqual([[reviews, 'capability:send-button', ['entry-owner'], null]]);
  });

  test('a superseded hypothesis leaves the list without becoming completed', () => {
    const progress = progressOf([{
      type: 'analysis-accepted', data: {},
      records: [
        { path: at('hypotheses', 'hypothesis:h1'), body: forecast('hypothesis:h1', 'capability:still-open') },
        { path: at('hypotheses', 'hypothesis:h2'), body: forecast('hypothesis:h2', 'capability:withdrawn') },
      ],
    }, {
      type: 'decision-accepted', data: {},
      records: [{ path: at('hypotheses', 'hypothesis:h2', 2), body: forecast('hypothesis:h2', 'capability:withdrawn', { revision: 2, standing: 'superseded', cause: { decision: 'gd-001', reason: 'placed elsewhere' }, supersededBy: 'hypothesis:h1' }) }],
    }]);
    expect(progress.map(row => [row.capability, row.state, row.tentative])).toEqual([['capability:still-open', 'todo', true]]);
    expect(progress.some(row => row.state === 'completed')).toBe(false);
  });
});

describe('the module-capability comparison', () => {
  const R = root;
  const notes = `${reviews}/notes`;
  const drafts = `${notes}/drafts`;
  const archive = `${drafts}/archive`;
  const panel = `${R}/panel`;
  const tree: ModuleTree = {
    status: 'available',
    revision: 'rev/7:tree:1',
    input: 'input/7:tree',
    modules: [
      { module: R, dir: '', parent: null },
      { module: panel, dir: 'subs/panel', parent: R },
      { module: `${R}/workspace`, dir: 'subs/workspace', parent: R },
      { module: reviews, dir: 'subs/workspace/subs/reviews', parent: `${R}/workspace` },
      { module: notes, dir: 'subs/workspace/subs/reviews/subs/notes', parent: reviews },
    ],
  };
  const proposal = (parent: string, name: string, purpose = `Holds ${name}.`) => ({ parent, directory: `subs/${name}`, purpose, tags: [] as string[] });

  function assignments(list: ReadonlyArray<{ capability: string; owner: string; proposed?: ReturnType<typeof proposal> }>, view: ViewIdentity = { status: 'placeholder' }) {
    return entryAssignmentsSchema.parse({
      schema: 'ramify-agent.entry-assignments/2',
      view,
      entries: list.map(entry => ({
        capability: entry.capability.slice('capability:'.length), capabilityId: entry.capability, description: `The run delivers ${entry.capability}.`, owner: entry.owner,
        ...(entry.proposed === undefined ? {} : { proposed: entry.proposed }),
        functionalRequirementIds: [], functionalAcceptanceIds: [], contextIds: [], citations: [],
      })),
    });
  }

  function compare(lines: readonly Line[], current: ModuleTree = tree, limits: AnalysisCoverageLimits = { limits: [] }) {
    const response = moduleCapabilityComparisonOf(runView(constructedRun(lines)), current, limits);
    // Every answer satisfies the protocol schema and its coverage refinement.
    expect(moduleCapabilityComparisonResponseSchema.parse(response)).toEqual(response);
    return response;
  }

  const rowsOf = (response: ModuleCapabilityComparisonResponse) => response.modules.flatMap(entry => entry.capabilities.map(row => ({
    module: entry.module,
    capability: row.capability,
    initial: row.initial.map(association => `${association.role}${association.hypothesis === null ? '' : `:${association.hypothesis}`}`),
    implemented: row.implementedHere !== null,
  })));

  // Entries: one owned by an existing module, one whose owner moves, and two
  // proposed modules, the second beneath the first. Hypotheses: an exact
  // slug join with an entry, a forecast that involves modules and names an
  // anticipated consumer, and one revised after revision 1. A capability
  // first registered during the run is verified by reuse.
  const main: Line[] = [
    { type: 'job-started', data: {} },
    {
      type: 'analysis-accepted', data: { invocation: 'inv-0001' },
      records: [
        {
          path: 'analysis/entries.json', body: assignments([
            { capability: 'capability:review-note', owner: notes },
            { capability: 'capability:moved-thing', owner: reviews },
            { capability: 'capability:note-drafts', owner: drafts, proposed: proposal(notes, 'drafts') },
            { capability: 'capability:draft-archive', owner: archive, proposed: proposal(drafts, 'archive') },
          ]),
        },
        ...['capability:review-note', 'capability:moved-thing', 'capability:note-drafts', 'capability:draft-archive'].map(capability => ({
          path: at('registry', capability),
          body: registered(capability, { owner: capability === 'capability:review-note' ? notes : capability === 'capability:moved-thing' ? reviews : capability === 'capability:note-drafts' ? drafts : archive }),
        })),
        { path: at('hypotheses', 'hypothesis:h-join'), body: forecast('hypothesis:h-join', 'capability:review-note', { suggestedOwner: notes }) },
        {
          path: at('hypotheses', 'capability:note-search'),
          body: forecast('hypothesis:note-search', 'capability:note-search', { suggestedOwner: notes, involvedModules: [reviews, notes, reviews], anticipatedConsumers: [panel] }),
        },
        { path: at('hypotheses', 'hypothesis:h-revised'), body: forecast('hypothesis:h-revised', 'capability:revised-later', { suggestedOwner: reviews }) },
        { path: 'work-items/wi-001/item.json', body: item('work-item:case-001', { entry: 'capability:review-note' }, { module: notes }) },
        { path: 'work-items/wi-002/item.json', body: item('work-item:case-002', { entry: 'capability:moved-thing' }) },
        { path: 'work-items/wi-003/item.json', body: item('work-item:case-003', { entry: 'capability:note-drafts' }, { module: drafts }) },
        { path: 'work-items/wi-004/item.json', body: item('work-item:case-004', { entry: 'capability:draft-archive' }, { module: archive }) },
      ],
    },
    { type: 'work-item-started', data: { workItem: 'work-item:case-001', module: notes } },
    { type: 'work-item-completed', data: { workItem: 'work-item:case-001', gate: 'ga-0002' } },
    {
      // A later decision moves moved-thing, revises a hypothesis and registers
      // format-date for reuse by wi-002; none of it rewrites revision 1.
      type: 'decision-accepted', data: {},
      records: [
        { path: at('registry', 'capability:moved-thing', 2), body: registered('capability:moved-thing', { revision: 2, owner: panel, origin: 'global-decision', decision: 'gd-001', previousOwner: reviews }) },
        { path: at('hypotheses', 'hypothesis:h-revised', 2), body: forecast('hypothesis:h-revised', 'capability:revised-later', { revision: 2, suggestedOwner: panel, cause: { decision: 'gd-001', reason: 'moved' } }) },
        { path: at('registry', 'capability:format-date'), body: registered('capability:format-date', { origin: 'global-decision', decision: 'gd-001', owner: R, consumers: [{ capability: 'capability:moved-thing', workItem: 'work-item:case-002' }] }) },
      ],
    },
    { type: 'work-item-started', data: { workItem: 'work-item:case-002', module: panel } },
    { type: 'work-item-completed', data: { workItem: 'work-item:case-002', gate: 'ga-0003' } },
    { type: 'work-item-started', data: { workItem: 'work-item:case-003', module: drafts } },
  ];

  test('both layers, exact-slug joins, every role once, changed placement and unforecast implementation', () => {
    const response = compare(main);
    expect(response.identityPolicy).toBe('exact-accepted-capability-id/2');
    expect(response.runVersion).toBe(main.length);
    expect(response.initialView).toEqual({ status: 'placeholder' });
    expect(response.tree).toEqual(tree);

    expect(rowsOf(response)).toEqual([
      // Unforecast: registered during the run and verified, Implemented only.
      { module: R, capability: 'capability:format-date', initial: [], implemented: true },
      // Changed placement: Initial in one module, Implemented in the other, with no mismatch status.
      { module: panel, capability: 'capability:moved-thing', initial: [], implemented: true },
      { module: reviews, capability: 'capability:moved-thing', initial: ['entry-owner'], implemented: false },
      // Involved twice by one hypothesis: once.
      { module: reviews, capability: 'capability:note-search', initial: ['involved:hypothesis:note-search'], implemented: false },
      // The revised hypothesis keeps its revision-1 owner.
      { module: reviews, capability: 'capability:revised-later', initial: ['suggested-owner:hypothesis:h-revised'], implemented: false },
      // An entry and a hypothesis of the same slug are one capability, one row, both roles.
      { module: notes, capability: 'capability:review-note', initial: ['entry-owner', 'suggested-owner:hypothesis:h-join'], implemented: true },
      // Suggested owner and involved module are distinct roles of one row.
      { module: notes, capability: 'capability:note-search', initial: ['suggested-owner:hypothesis:note-search', 'involved:hypothesis:note-search'], implemented: false },
      // Working is not implemented.
      { module: drafts, capability: 'capability:note-drafts', initial: ['entry-owner'], implemented: false },
      { module: archive, capability: 'capability:draft-archive', initial: ['entry-owner'], implemented: false },
    ]);
    // The anticipated consumer is no association.
    expect(response.modules.find(entry => entry.module === panel)!.capabilities.map(row => row.capability)).toEqual(['capability:moved-thing']);

    // Completed rows keep their progress's reason and evidence.
    const reviewNote = response.modules.find(entry => entry.module === notes)!.capabilities[0]!;
    expect(reviewNote.implementedHere).toEqual({ reason: 'work-item:case-001 passed its work-item gate ga-0002', evidence: ['ga-0002'] });

    // Placement: the tree's modules, the proposed ones after their parent's subtree.
    expect(response.modules.map(entry => [entry.module, entry.placement])).toEqual([
      [R, 'declared'], [panel, 'declared'], [`${R}/workspace`, 'declared'], [reviews, 'declared'], [notes, 'declared'],
      [drafts, 'proposed'], [archive, 'proposed'],
    ]);
    expect(response.modules.find(entry => entry.module === drafts)!.proposedAtStart).toEqual({ parent: notes, purpose: 'Holds drafts.', tags: [] });
    expect(response.modules.find(entry => entry.module === `${R}/workspace`)!.capabilities).toEqual([]);

    // Capability order: entries, revision-1 hypotheses, then the registry's discoveries.
    expect(response.coverage).toEqual({ state: 'complete', capabilities: 7, implemented: 3 });
  });

  test('a declared module keeps what was proposed for it at start', () => {
    const grown: ModuleTree = { ...tree, modules: [...tree.modules, { module: drafts, dir: 'subs/drafts', parent: notes }] };
    const response = compare(main, grown);
    expect(response.modules.filter(entry => [drafts, archive].includes(entry.module)).map(entry => [entry.module, entry.placement, entry.proposedAtStart?.parent]))
      .toEqual([[drafts, 'declared', notes], [archive, 'proposed', drafts]]);
    expect(response.coverage.state).toBe('complete');
  });

  test('the answer is deterministic', () => {
    expect(JSON.stringify(compare(main))).toBe(JSON.stringify(compare(main)));
  });

  test('a pending analysis is unavailable, with no view and no modules', () => {
    const response = compare([{ type: 'job-started', data: {} }]);
    expect(response).toMatchObject({ initialView: null, modules: [], coverage: { state: 'unavailable', reason: expect.stringContaining('pending') } });
  });

  test('an unavailable tree is partial: every module unplaced, with the tree\'s message', () => {
    const message = 'The architect view has not been materialized yet; a run materializes it before its initial analysis.';
    const response = compare(main, { status: 'unavailable', message });
    expect(new Set(response.modules.map(entry => entry.placement))).toEqual(new Set(['unplaced']));
    expect(response.modules.map(entry => entry.module)).toEqual([R, panel, reviews, notes, drafts, archive].sort());
    expect(response.modules.find(entry => entry.module === drafts)!.proposedAtStart).not.toBeNull();
    expect(response.coverage).toEqual({
      state: 'partial', knownCapabilities: 7, knownImplemented: 3, totalCapabilities: null,
      gaps: [`The current module tree is unavailable, so no module is placed: ${message}`],
    });
  });

  test('recorded coverage limits of the view and of the analysis are one gap each', () => {
    const view: ViewIdentity = { status: 'materialized', revision: 'r', input: 'i', coverageLimits: ['dependencies unavailable (stub)'] };
    const response = compare([{ type: 'analysis-accepted', data: {}, records: [{ path: 'analysis/entries.json', body: assignments([{ capability: 'capability:review-note', owner: notes }], view) }] }],
      tree, { limits: ['The panel was not read.'] });
    expect(response.initialView).toEqual(view);
    expect(response.coverage).toMatchObject({
      state: 'partial',
      gaps: ['The architect view the initial analysis worked from reports: dependencies unavailable (stub)', 'The initial analysis reports: The panel was not read.'],
    });
    const unreadable = compare([{ type: 'analysis-accepted', data: {}, records: [{ path: 'analysis/entries.json', body: assignments([{ capability: 'capability:review-note', owner: notes }]) }] }],
      tree, { unreadable: 'invocations/inv-0001/submission.json is not in the run' });
    expect(unreadable.coverage).toMatchObject({ state: 'partial', gaps: [expect.stringContaining('cannot be read')] });
  });

  test('an absent module without a proposal, and conflicting proposals, are unplaced with a gap', () => {
    const response = compare([{
      type: 'analysis-accepted', data: {},
      records: [
        {
          path: 'analysis/entries.json', body: assignments([
            { capability: 'capability:first-draft', owner: drafts, proposed: proposal(notes, 'drafts') },
            { capability: 'capability:second-draft', owner: drafts, proposed: proposal(reviews, 'drafts') },
          ]),
        },
        { path: at('hypotheses', 'hypothesis:far-away'), body: forecast('hypothesis:far-away', 'capability:far-away', { suggestedOwner: `${R}/nowhere` }) },
      ],
    }]);
    expect(response.modules.slice(-2)).toEqual([
      { module: `${R}/nowhere`, placement: 'unplaced', proposedAtStart: null, capabilities: [{ capability: 'capability:far-away', initial: [{ role: 'suggested-owner', hypothesis: 'hypothesis:far-away' }], implementedHere: null }] },
      {
        module: drafts, placement: 'unplaced', proposedAtStart: null, capabilities: [
          { capability: 'capability:first-draft', initial: [{ role: 'entry-owner', hypothesis: null }], implementedHere: null },
          { capability: 'capability:second-draft', initial: [{ role: 'entry-owner', hypothesis: null }], implementedHere: null },
        ],
      },
    ]);
    expect(response.coverage).toMatchObject({
      state: 'partial', knownCapabilities: 3, knownImplemented: 0, totalCapabilities: null,
      gaps: [
        `Module ${R}/nowhere is absent from the current tree and has no recorded proposed parent.`,
        `Module ${drafts} is absent from the current tree, and the entries that propose it disagree, so it has no provisional place.`,
      ],
    });
  });

  test('the capability bound drops whole capabilities from the end, the run\'s discoveries first', () => {
    const many = Array.from({ length: 501 }, (_, index) => `capability:entry-${String(index).padStart(3, '0')}`);
    const response = compare([
      {
        type: 'analysis-accepted', data: {},
        records: [
          { path: 'analysis/entries.json', body: assignments(many.map(capability => ({ capability, owner: reviews }))) },
          { path: at('registry', 'capability:discovered'), body: registered('capability:discovered', { origin: 'local-decision', decision: 'ld-001', owner: notes, consumers: [{ capability: 'capability:entry-000', workItem: 'work-item:case-001' }] }) },
          { path: 'work-items/wi-001/item.json', body: item('work-item:case-001', { entry: 'capability:entry-000' }) },
        ],
      },
      { type: 'work-item-completed', data: { workItem: 'work-item:case-001', gate: 'ga-0002' } },
    ]);
    const returned = new Set(response.modules.flatMap(entry => entry.capabilities.map(row => row.capability)));
    expect(returned.size).toBe(runQueryLimits.capabilities);
    expect(returned.has('capability:entry-500')).toBe(false);
    expect(returned.has('capability:discovered')).toBe(false);
    expect(response.coverage).toMatchObject({ state: 'partial', knownCapabilities: 500, knownImplemented: 0, totalCapabilities: 502 });
    if (response.coverage.state !== 'partial') throw new Error('partial');
    expect(response.coverage.gaps).toEqual([expect.stringMatching(/^The capabilities \(500\) bound returned 500 of 502 capabilities.*knownImplemented is a lower bound/)]);
  });

  test('the row bound keeps a capability with all of its rows or drops it whole', () => {
    const modules = Array.from({ length: 5 }, (_, index) => `${reviews}/m${index}`);
    const wide: ModuleTree = { ...tree, modules: [...tree.modules, ...modules.map(module => ({ module, dir: module, parent: reviews }))] };
    const hypotheses = Array.from({ length: 401 }, (_, index) => {
      const id = `hypothesis:forecast-${String(index).padStart(3, '0')}`;
      return { path: at('hypotheses', id), body: forecast(id, `capability:${id.slice('hypothesis:'.length)}`, { suggestedOwner: modules[0]!, involvedModules: modules.slice(1) }) };
    });
    const response = compare([{
      type: 'analysis-accepted', data: {},
      records: [{ path: 'analysis/entries.json', body: assignments([{ capability: 'capability:first', owner: notes }]) }, ...hypotheses],
    }], wide);
    const rows = response.modules.reduce((sum, entry) => sum + entry.capabilities.length, 0);
    // One entry row, then 399 forecasts of five rows each: 1,996 rows; the next would exceed 2,000.
    expect(rows).toBe(1 + 399 * 5);
    for (const module of modules) expect(response.modules.find(entry => entry.module === module)!.capabilities).toHaveLength(399);
    expect(response.coverage).toMatchObject({ state: 'partial', knownCapabilities: 400, totalCapabilities: 402 });
    if (response.coverage.state !== 'partial') throw new Error('partial');
    expect(response.coverage.gaps[0]).toMatch(/^The moduleCapabilityRows \(2000\) bound returned 400 of 402 capabilities and 1996 of 2006 rows.*lower bound/);
  });
});
