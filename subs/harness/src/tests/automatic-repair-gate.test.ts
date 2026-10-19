import { chmod, mkdir, rm, symlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { afterEach, expect, test } from 'vitest';
import { CommittingGates, type GateHost, type GateRun } from '../../subs/autonomous/src/run/committing-gate.js';
import { type RunLog } from '../../subs/autonomous/src/run/log.js';
import { runLayout } from '../../subs/autonomous/src/run/records.js';
import { automaticRepairAssignmentSchema, captureRepairFiles, repairChanges, repairDeltaSchema } from '../../subs/autonomous/src/run/repair-preparation.js';
import { verifiedRepairDeltas } from '../../subs/autonomous/src/run/repair-gate.js';
import { iterationAssignmentSchema } from '../../subs/autonomous/subs/work-coordination/src/work/iterations.js';
import { type WriteScope } from '../work/scope.js';
import { type OwnershipAnswer } from '../../subs/evidence/src/ownership-evidence.js';
import { temporaryDirectory } from './helpers/fixture.js';
import { mockGit } from './helpers/mock-git.js';
import { repairExportFixture } from './helpers/repair-export-fixture.js';
import { externalCandidatePath } from '../../subs/autonomous/src/run/candidate-attribution.js';

const cleanups: Array<() => Promise<void>> = [];
afterEach(async () => { for (const cleanup of cleanups.splice(0)) await cleanup(); });
type Entries = ReturnType<RunLog['ledger']['replay']>;
const at = '2026-10-12T00:00:00.000Z';

async function fixture(priorOutside = false) {
  const directory = await temporaryDirectory(); cleanups.push(directory.remove);
  const root = directory.path;
  for (const name of ['Alpha', 'Beta']) await mkdir(join(root, name));
  await writeFile(join(root, 'Alpha/partial.ts'), 'partial');
  await writeFile(join(root, 'Beta/restored.ts'), 'broken');
  const modules = [{ id: 'Root', parent: null, directory: '.' }, { id: 'Root/Alpha', parent: 'Root', directory: 'Alpha' }, { id: 'Root/Beta', parent: 'Root', directory: 'Beta' }];
  const included = ['Alpha', 'Beta'].map(directory => ({ directory, reason: 'Repair preparation', instructions: 'Restore ordinary source only' }));
  const scope = (broad: boolean): WriteScope => ({ revision: 1, base: { module: broad ? 'Root' : 'Root/Alpha', included: broad ? included : [] }, extra: [], bootstrap: [], read: [], rationale: 'Restore preparation',
    resolved: { boundaryVersion: 'ramify-agent.assignment-boundary/1', roots: [broad ? root : join(root, 'Alpha')], files: [], excluded: [], view: { status: 'placeholder' },
      included: broad ? included.map(entry => ({ ...entry, kind: 'child-subtree', owner: `Root/${entry.directory}`, projectInstructions: [] })) : [],
      ownership: { provider: 'ramify.ownership/1', ramifyVersion: 'scripted', root, inputId: 'captured', configuration: 'tsconfig.json', modules, exclusions: [] } } });
  const original = iterationAssignmentSchema.parse({ schema: 'ramify-agent.iteration-assignment/1', id: 'wi-001.i01', workItem: 'wi-001', outline: { id: 'wi-001', revision: 1, hash: 'a'.repeat(64) }, coordination: { kind: 'work-item', id: 'wi-001' }, stage: 0, kind: 'ordinary', goal: 'Implement A', approach: 'Preserve partial work', startingPoints: [], scope: scope(false), externalCapabilities: [], completionEvidence: 'Tests', evidenceObligations: [], gate: { checkpoint: 'iteration', tests: { policy: 'owned-by-scope', exactOwners: ['Root/Alpha'], subtrees: [], extraSuites: [] } }, guarded: [], authorizations: [] });
  const assignment = automaticRepairAssignmentSchema.parse({ schema: 'ramify-agent.automatic-repair-assignment/1', id: 'root-repair', invocation: 'inv-0001', delegation: { root: 'Root', included, instructions: 'Restore preparation' }, scope: scope(true), guarded: [] });
  const paths = ['Alpha/partial.ts', 'Beta/restored.ts'];
  const before = await captureRepairFiles(root, paths);
  await writeFile(join(root, 'Beta/restored.ts'), 'repaired');
  const after = await captureRepairFiles(root, paths);
  const dirty = priorOutside ? paths : ['Alpha/partial.ts'];
  const delta = repairDeltaSchema.parse({ schema: 'ramify-agent.automatic-repair-delta/1', incidentId: 'apr-0001', assignment: assignment.id, originalAssignment: original.id, acceptedCommit: 'base', invocation: 'inv-0004', beforeValidated: true, beforeDirtyPaths: dirty, before, after, changes: repairChanges(before, after), structure: [] });
  const incident = repairExportFixture(root, 'run-1', {
    originalAssignment: original.id, authority: { assignment: assignment.id, scopeEvidence: [runLayout.contingentRepairAssignment] },
    admission: { admitted: true, reason: 'Preparation fault' }, invocation: delta.invocation,
    candidateBefore: { head: 'base', tree: null, changedPaths: dirty, staged: [], unstaged: dirty, untracked: [], evidence: [] },
    result: { outcome: 'ready', summary: 'Restored input', checks: [], remainingWork: ['Finish A'], suspectedCause: null, evidence: [] },
    verification: { verified: true, reason: 'Verified', evidence: [runLayout.repairDelta(delta.incidentId)] },
    continuation: { delivered: true, reason: 'Prepared', evidence: [] },
  }).incident;
  const entries: Array<Entries[number]> = [];
  function append(type: string, data: unknown, records: unknown[] = []) {
    const sequence = entries.length + 1;
    entries.push({ sequence, at, transaction: { event: { sequence, jobId: 'run-1', at, type, data }, records } } as Entries[number]);
  }
  append('iteration-assigned', { iteration: original.id }, [{ path: 'original.json', id: original.id, revision: 1, body: original }]);
  append('repair-assignment-recorded', { assignment: assignment.id, invocation: assignment.invocation }, [{ path: runLayout.contingentRepairAssignment, id: assignment.id, revision: 1, body: assignment }]);
  append('writer-released', { invocation: delta.invocation, confirmed: true, groupsKilled: 0 });
  append('repair-incident-recorded', { incidentId: incident.incidentId, revision: incident.revision, stage: 'continued' }, [
    { path: runLayout.repairIncident(incident.incidentId, incident.revision), id: incident.incidentId, revision: incident.revision, body: incident },
    { path: runLayout.repairDelta(incident.incidentId), id: incident.incidentId, revision: 1, body: delta },
  ]);
  let excluded = false;
  const git = mockGit({ changedPaths: async () => paths });
  const host = { projectRoot: root, git, harnessFiles: async () => [], ramify: { async queryOwnershipAnswer(_root: string, paths: readonly string[]): Promise<OwnershipAnswer> {
    const exclusion = { kind: 'external' as const, directory: 'Beta', owner: null };
    return { schemaVersion: 'ramify.ownership/1', ramifyVersion: 'scripted', root, inputId: 'current', scope: { configuration: 'tsconfig.json', ownership: { modules, exclusions: excluded ? [exclusion] : [] } }, paths: paths.map(path => excluded && path.startsWith('Beta/') ? { path, status: 'excluded', module: null, exclusion } : { path, status: 'owned', module: path.startsWith('Alpha/') ? 'Root/Alpha' : path.startsWith('Beta/') ? 'Root/Beta' : 'Root', exclusion: null }) };
  } } } as unknown as GateHost<GateRun>;
  const run = { base: 'base', log: { ledger: { replay: () => entries }, all: (type: string) => entries.map(entry => entry.transaction.event).filter(event => event.type === type) } } as unknown as GateRun;
  return { root, entries, host, run, append, exclude: () => { excluded = true; }, acceptLaterCandidate: () => {
    // Only the fields acceptedCommit reads; no gate execution is scripted here.
    append('gate-attempted', { gate: 'gate-001', checkpoint: 'iteration', verdict: 'passed', next: 'continue' }, [{ path: 'gate.json', id: 'gate-001', revision: 1,
      body: { schema: 'ramify-agent.gate-attempt/3', id: 'gate-001', checkpoint: 'iteration', audited: 'later-accepted' } }]);
  }, rewordScenarios: () => append('scenarios-reworded', { deviation: 'pd-001', commit: 'feature-only-commit' }), async outcome() {
    const result = await new CommittingGates(host).candidateAuthority(run, { checkpoint: 'iteration', subject: { iteration: original.id } });
    expect(git.unexpected).toEqual([]);
    return result.rules.find(rule => rule.rule === 'write-scope');
  } };
}

test('a verified repair delta covers exact sibling bytes at the resumed ordinary gate', async () => {
  const f = await fixture();
  expect(await f.outcome()).toMatchObject({ outcome: 'passed', violations: [] });
});

test('authenticated operator repair supplies exact sibling provenance without changing engineer scope', async () => {
  const f = await fixture();
  // This case uses the operator's correction, with no automatic repair handback.
  f.entries.splice(1);
  const id = 'settled-observation';
  f.append('external-candidate-observed', { id, beforeTree: 'partial-tree', afterTree: 'corrected-tree' },
    [{ path: externalCandidatePath(id), id, revision: 1, body: {
      schema: 'ramify-agent.external-candidate/1', id, beforeTree: 'partial-tree', afterTree: 'corrected-tree',
      beforeDirtyPaths: ['Alpha/partial.ts'], changes: [{ path: 'Beta/restored.ts',
        before: { path: 'Beta/restored.ts', hash: 'broken', mode: '100644' },
        after: { path: 'Beta/restored.ts', hash: 'operator-bytes', mode: '100644' } }],
    } }]);
  Object.assign(f.host, { previewCandidateTree: async () => ({ tree: 'corrected-tree' }), candidates: { treeEntries: async () => [
    { path: 'Alpha/partial.ts', kind: 'file', bytes: 7, objectId: 'partial' }, { path: 'Beta/restored.ts', kind: 'file', bytes: 8, objectId: 'operator-bytes' },
  ] } });
  expect(await f.outcome()).toMatchObject({ outcome: 'passed', violations: [] });
  expect((f.run.log.ledger.replay()[0]!.transaction.records[0]!.body as { scope: WriteScope }).scope.resolved.roots).toEqual([join(f.root, 'Alpha')]);
  f.exclude();
  expect(await f.outcome()).toMatchObject({ outcome: 'failed', violations: [{ path: 'Beta/restored.ts' }] });
});
test.each(['bytes', 'mode', 'symlink'] as const)('later %s changes cannot borrow repair authority', async kind => {
  const f = await fixture(); const path = join(f.root, 'Beta/restored.ts');
  if (kind === 'bytes') await writeFile(path, 'changed later');
  if (kind === 'mode') await chmod(path, 0o755);
  if (kind === 'symlink') { await rm(path); await symlink('../Alpha/partial.ts', path); }
  expect(await f.outcome()).toMatchObject({ outcome: 'failed', violations: [{ path: 'Beta/restored.ts' }] });
});
test('pre-existing unauthorized sibling content is not laundered by a repair', async () => {
  expect(await (await fixture(true)).outcome()).toMatchObject({ outcome: 'failed', violations: [{ path: 'Beta/restored.ts' }] });
});
test('current exclusions narrow verified repair authority', async () => {
  const f = await fixture(); f.exclude();
  expect(await f.outcome()).toMatchObject({ outcome: 'failed', violations: [{ path: 'Beta/restored.ts' }] });
});
test('an accepted boundary consumes repair authority even if a later writer restores the old bytes', async () => {
  const f = await fixture();
  expect(await f.outcome()).toMatchObject({ outcome: 'passed' });
  f.acceptLaterCandidate();
  expect(await f.outcome()).toMatchObject({ outcome: 'failed', violations: [{ path: 'Beta/restored.ts' }] });
});
test('a harness commit of scenario files does not consume an unaccepted source repair', async () => {
  const f = await fixture(); f.rewordScenarios();
  expect(await f.outcome()).toMatchObject({ outcome: 'passed' });
});
test('handback requires a co-committed delta and prior confirmed writer settlement', async () => {
  const f = await fixture();
  expect(verifiedRepairDeltas(f.entries)).toHaveLength(1);
  expect(() => verifiedRepairDeltas(f.entries.filter(entry => entry.transaction.event.type !== 'writer-released'))).toThrow(/writer settlement/);
  const missing = f.entries.map((entry, index) => index === f.entries.length - 1
    ? { ...entry, transaction: { ...entry.transaction, records: entry.transaction.records.slice(0, 1) } } : entry);
  expect(() => verifiedRepairDeltas(missing)).toThrow(/incident and delta/);
});
