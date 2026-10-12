import { join } from 'node:path';
import { writeFile, unlink, readdir } from 'node:fs/promises';
import { afterEach, expect, test, vi } from 'vitest';
import { ContentStore } from '../transcripts/store.js';
import { OwnershipAuthority, assignmentAuthorityIdentity } from '../work/ownership-authority.js';
import { decodeOwnershipEvidenceAnswer, type OwnershipAnswer } from '../../subs/evidence/src/ownership-evidence.js';
import { RamifyCli } from '../../subs/evidence/src/ramify-cli.js';
import { guardedScopeOf, resolveWriteScope } from '../work/scope.js';
import { RunLog } from '../run/log.js';
import { temporaryDirectory } from './helpers/fixture.js';

vi.unmock('../../subs/ledger/src/session-store.js');
const cleanup: Array<() => Promise<void>> = [];
afterEach(async () => { for (const remove of cleanup.splice(0)) await remove(); });

function answer(root: string, path: string, inputId = 'a'): OwnershipAnswer {
  return { schemaVersion: 'ramify.ownership/1', ramifyVersion: '0.4.4', root, inputId,
    scope: { configuration: 'ramify.json', ownership: { modules: [{ id: 'Root', directory: '.', parent: null }], exclusions: [] } },
    paths: [{ path, status: 'owned', module: 'Root', exclusion: null }] };
}

async function setup() {
  const directory = await temporaryDirectory(); cleanup.push(directory.remove);
  const root = directory.path;
  const path = join(root, 'events.jsonl');
  const assignment = assignmentAuthorityIdentity({ id: 'i01', scope: { revision: 1 }, authorizations: [] });
  let log = await RunLog.open(path, 'job');
  const store = new ContentStore(join(root, 'blobs'));
  const authority = () => new OwnershipAuthority({ assignment, root, store, decode: decodeOwnershipEvidenceAnswer,
    references: () => log.all('ownership-evidence-retained').map(event => event.data),
    append: async data => { await log.append({ type: 'ownership-evidence-retained', data }); } });
  return { root, store, authority, reopen: async () => { log = await RunLog.open(path, 'job'); }, log: () => log };
}

test('restrictive success survives unrelated success and reopen; only an answer for the same path clears it', async () => {
  const fixture = await setup();
  await fixture.authority().retain(answer(fixture.root, 'a.ts'), [{ path: 'a.ts', allowed: false }]);
  await fixture.authority().retain(answer(fixture.root, 'b.ts', 'b'), [{ path: 'b.ts', allowed: true }]);
  await fixture.reopen();
  const historical = await fixture.authority().read();
  expect(historical.paths.get('a.ts')).toBe(false);
  expect(historical.paths.get('b.ts')).toBe(true);
  expect(historical.latest?.inputId).toBe('b');
  await fixture.authority().retain(answer(fixture.root, 'a.ts', 'c'), [{ path: 'a.ts', allowed: true }]);
  expect((await fixture.authority().read()).paths.get('a.ts')).toBe(true);
});

test('identical evidence uses one blob and one consecutive ledger reference', async () => {
  const fixture = await setup();
  const evidence = answer(fixture.root, 'a.ts');
  const first = await fixture.authority().retain(evidence, [{ path: 'a.ts', allowed: true }]);
  const second = await fixture.authority().retain(evidence, [{ path: 'a.ts', allowed: true }]);
  expect(first).toEqual(second);
  expect(await readdir(fixture.store.directory)).toHaveLength(2);
  expect(await readdir(fixture.store.directory)).toContain(first.hash);
  expect(fixture.log().all('ownership-evidence-retained')).toHaveLength(1);
});

test.each(['missing', 'changed'] as const)('%s evidence is fatal authority corruption', async mode => {
  const fixture = await setup();
  const reference = await fixture.authority().retain(answer(fixture.root, 'a.ts'), [{ path: 'a.ts', allowed: false }]);
  if (mode === 'missing') await unlink(fixture.store.path(reference.hash));
  else await writeFile(fixture.store.path(reference.hash), '{}');
  await fixture.reopen();
  await expect(fixture.authority().read()).rejects.toMatchObject({ kind: mode === 'missing' ? 'missing' : 'corrupt' });
  await expect(fixture.authority().retain(answer(fixture.root, 'b.ts'), [{ path: 'b.ts', allowed: true }])).rejects.toMatchObject({ kind: mode === 'missing' ? 'missing' : 'corrupt' });
});

test('unsettled ledger retention cannot return evidence authority', async () => {
  const fixture = await setup();
  const authority = new OwnershipAuthority({ assignment: assignmentAuthorityIdentity({ id: 'other' }), root: fixture.root,
    store: fixture.store, decode: decodeOwnershipEvidenceAnswer, references: () => [], append: async () => { throw new Error('writer unsettled'); } });
  await expect(authority.retain(answer(fixture.root, 'a.ts'), [{ path: 'a.ts', allowed: true }])).rejects.toThrow('writer unsettled');
  expect((await fixture.authority().read()).reference).toBeNull();
});

test('authority identities distinguish guarded authorizations and assignment IDs', () => {
  const original = { id: 'i01', scope: { revision: 1 }, authorizations: [] };
  expect(assignmentAuthorityIdentity(original)).not.toBe(assignmentAuthorityIdentity({ ...original, id: 'i02' }));
  expect(assignmentAuthorityIdentity(original)).not.toBe(assignmentAuthorityIdentity({ ...original, authorizations: ['tsconfig.json'] }));
});

test.each(['provider', 'ramifyVersion', 'root', 'inputId'] as const)('ledger %s must match the retained answer', async field => {
  const fixture = await setup();
  const reference = await fixture.authority().retain(answer(fixture.root, 'a.ts'), [{ path: 'a.ts', allowed: false }]);
  const authority = new OwnershipAuthority({ assignment: reference.assignment, root: fixture.root, store: fixture.store,
    decode: decodeOwnershipEvidenceAnswer, references: () => [{ ...reference, [field]: 'different' }], append: async () => {} });
  await expect(authority.read()).rejects.toMatchObject({ kind: 'corrupt' });
});

test('a hash-valid unsupported blob schema cannot supply authority', async () => {
  const fixture = await setup();
  const evidence = answer(fixture.root, 'a.ts');
  const assignment = assignmentAuthorityIdentity({ id: 'i01', scope: { revision: 1 }, authorizations: [] });
  const stored = await fixture.store.put(JSON.stringify({ schema: 'ramify-agent.ownership-evidence/99', assignment,
    answer: evidence, decisions: [{ path: 'a.ts', allowed: true }] }));
  const authority = new OwnershipAuthority({ assignment, root: fixture.root, store: fixture.store,
    decode: decodeOwnershipEvidenceAnswer, references: () => [{ ...stored, assignment, provider: evidence.schemaVersion,
      ramifyVersion: evidence.ramifyVersion, root: evidence.root, inputId: evidence.inputId }], append: async () => {} });
  await expect(authority.read()).rejects.toMatchObject({ kind: 'corrupt' });
});

test('inherited evidence retains actual assignment identity separately from original lineage', async () => {
  const fixture = await setup();
  const first = await fixture.authority().retain(answer(fixture.root, 'a.ts'), [{ path: 'a.ts', allowed: false }]);
  const current = assignmentAuthorityIdentity({ id: 'i02' });
  const authority = new OwnershipAuthority({ assignment: current, sourceAuthority: first.assignment, root: fixture.root,
    store: fixture.store, decode: decodeOwnershipEvidenceAnswer,
    references: () => fixture.log().all('ownership-evidence-retained').map(event => event.data),
    append: async data => { await fixture.log().append({ type: 'ownership-evidence-retained', data }); } });
  expect((await authority.read()).paths.get('a.ts')).toBe(false);
  const reference = await authority.retain(answer(fixture.root, 'b.ts', 'later'), [{ path: 'b.ts', allowed: true }]);
  expect(reference.assignment).toBe(current);
  expect(reference.sourceAuthority).toBe(first.assignment);
  expect(authority.assignment).toBe(current);
  expect((await authority.read()).paths.get('a.ts')).toBe(false);
});

test('different paths and input identities reuse an unchanged full ownership table', async () => {
  const fixture = await setup();
  const first = await fixture.authority().retain(answer(fixture.root, 'a.ts', 'a'), [{ path: 'a.ts', allowed: true }]);
  const second = await fixture.authority().retain(answer(fixture.root, 'b.ts', 'b'), [{ path: 'b.ts', allowed: true }]);
  const firstManifest = JSON.parse((await fixture.store.read(first.hash))!);
  const secondManifest = JSON.parse((await fixture.store.read(second.hash))!);
  expect(firstManifest.table).toEqual(secondManifest.table);
  expect(first.hash).not.toBe(second.hash);
  expect(await readdir(fixture.store.directory)).toHaveLength(3);
  await unlink(fixture.store.path(firstManifest.table.hash));
  await expect(fixture.authority().read()).rejects.toMatchObject({ kind: 'missing' });
});


test('answered refusal waits for durable retention before the guard returns its decision', async () => {
  const fixture = await setup();
  const path = 'subs/new-owner/a.ts';
  const initial = answer(fixture.root, '.');
  const scope = await resolveWriteScope({ projectRoot: fixture.root, index: null, view: { status: 'placeholder' }, revision: 1,
    base: { module: 'Root', included: [] }, extra: [], read: [], bootstrap: [], rationale: 'root work' }, initial);
  let signalEntered!: () => void;
  let settleWriter!: () => void;
  const entered = new Promise<void>(resolve => { signalEntered = resolve; });
  const writer = new Promise<void>(resolve => { settleWriter = resolve; });
  const authority = new OwnershipAuthority({ assignment: assignmentAuthorityIdentity({ id: 'actual' }), root: fixture.root,
    store: fixture.store, decode: decodeOwnershipEvidenceAnswer,
    references: () => fixture.log().all('ownership-evidence-retained').map(event => event.data),
    append: async data => { signalEntered(); await writer; await fixture.log().append({ type: 'ownership-evidence-retained', data }); } });
  class CurrentOwnership extends RamifyCli {
    override async queryOwnershipAnswer(): Promise<OwnershipAnswer> {
      return { ...initial, inputId: 'changed', scope: { ...initial.scope,
        ownership: { modules: [...initial.scope.ownership.modules, { id: 'Root/new-owner', directory: 'subs/new-owner', parent: 'Root' }], exclusions: [] } },
        paths: [{ path, status: 'owned', module: 'Root/new-owner', exclusion: null }] };
    }
  }
  const guard = guardedScopeOf(scope, [], new CurrentOwnership(), undefined, authority);
  let returned = false;
  const decision = guard.placement([path]).then(result => { returned = true; return result; });
  await entered;
  expect(returned).toBe(false);
  expect(fixture.log().all('ownership-evidence-retained')).toHaveLength(0);
  expect(await readdir(fixture.store.directory)).toHaveLength(2);
  settleWriter();
  expect(await decision).toEqual([{ path, allowed: false }]);
  expect((await authority.read()).paths.get(path)).toBe(false);
  expect((await guard.historicalPlacement!([path])).decisions).toEqual([{ path, allowed: false }]);
});
