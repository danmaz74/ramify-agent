import { mkdtemp, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, expect, test, vi } from 'vitest';
import { guardedScopeOf, type WriteScope } from '../work/scope.js';
import { decideWrite } from '../guard/write-guard.js';
import { OwnershipAuthority, assignmentAuthorityIdentity } from '../work/ownership-authority.js';
import { ContentStore } from '../../subs/task-execution/src/transcripts/store.js';
import { RunLog } from '../../subs/autonomous/src/run/log.js';
import { RamifyCli } from '../../subs/evidence/src/ramify-cli.js';
import { decodeOwnershipEvidenceAnswer, OwnershipUnavailableError, type OwnershipAnswer } from '../../subs/evidence/src/ownership-evidence.js';
vi.unmock('../../subs/ledger/src/session-store.js');
const roots: string[] = [];
afterEach(async () => { await Promise.all(roots.splice(0).map(root => rm(root, { recursive: true, force: true }))); });
test('real guard and durable ledger retain new exclusions and exact refusal through outage and reopen', async () => {
  const root = await mkdtemp(join(tmpdir(), 'repair-ledger-')); roots.push(root);
  await mkdir(join(root, 'Reviews')); await mkdir(join(root, 'plans/.harness'), { recursive: true });
  const modules = [{ id: 'Root', parent: null, directory: '.' }, { id: 'Root/Reviews', parent: 'Root', directory: 'Reviews' }];
  const scope: WriteScope = { revision: 1, base: { module: 'Root/Reviews', included: [] }, extra: [], bootstrap: [], read: [], rationale: 'repair',
    resolved: { boundaryVersion: 'ramify-agent.assignment-boundary/1', nestedDeclarations: [], roots: [join(root, 'Reviews')], files: [], excluded: [], included: [], view: { status: 'placeholder' },
      ownership: { provider: 'ramify.ownership/1', ramifyVersion: 'scripted', root, inputId: 'capture', configuration: 'tsconfig.json', modules, exclusions: [] } } };
  const assignment = assignmentAuthorityIdentity({ scope, guarded: [] });
  const logPath = join(root, 'plans/.harness/events.jsonl'); let log = await RunLog.open(logPath, 'repair');
  const authority = () => new OwnershipAuthority({ assignment, root, store: new ContentStore(join(root, 'plans/.harness/blobs')), decode: decodeOwnershipEvidenceAnswer,
    references: () => log.all('ownership-evidence-retained').map(event => event.data), append: async data => { await log.append({ type: 'ownership-evidence-retained', data }); } });
  let unavailable = false;
  class Provider extends RamifyCli {
    override async queryOwnershipAnswer(_root: string, paths: readonly string[]): Promise<OwnershipAnswer> {
      if (unavailable) throw new OwnershipUnavailableError({ status: 'unavailable', failureStatus: 'incomplete', reason: 'provider outage', decoded: null, report: null, stdout: '', stderr: '', exitCode: 2 });
      const exclusion = { kind: 'external' as const, directory: 'Reviews/Closed', owner: null };
      return { schemaVersion: 'ramify.ownership/1', ramifyVersion: 'scripted', root, inputId: 'narrowed', scope: { configuration: 'tsconfig.json', ownership: { modules: [...modules, { id: 'Root/Reviews/Refused', parent: 'Root/Reviews', directory: 'Reviews/Refused' }], exclusions: [exclusion] } },
        paths: paths.map(path => path.startsWith('Reviews/Closed/') ? { path, status: 'excluded' as const, module: null, exclusion } : { path, status: 'owned' as const, module: path === 'Reviews/Refused/file.ts' ? 'Root/Reviews/Refused' : 'Root/Reviews', exclusion: null }) };
    }
  }
  const provider = new Provider(); const action = (path: string) => ({ kind: 'write' as const, paths: [path] });
  let guard = guardedScopeOf(scope, [], provider, undefined, authority());
  expect((await decideWrite(guard, root, action('Reviews/Refused/file.ts'))).verdict).toBe('blocked-scope');
  expect((await decideWrite(guard, root, action('Reviews/open.ts'))).verdict).toBe('allowed');
  unavailable = true; log = await RunLog.open(logPath, 'repair'); guard = guardedScopeOf(scope, [], provider, undefined, authority());
  expect((await decideWrite(guard, root, action('Reviews/Refused/file.ts'))).verdict).toBe('blocked-scope');
  expect((await decideWrite(guard, root, action('Reviews/Closed/new.ts'))).verdict).toBe('blocked-scope');
  expect(await decideWrite(guard, root, action('Reviews/new.ts'))).toMatchObject({ verdict: 'allowed', basis: 'historical', assignment, ownershipEvidence: { inputId: 'narrowed' }, failureEvidence: { hash: expect.any(String) } });
});
