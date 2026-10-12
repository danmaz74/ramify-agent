import { RamifyCli, ramifyExecutable } from '../ramify-cli.js';
import { afterEach, describe, expect, it } from 'vitest';
import { ScriptedCli } from './helpers/scripted-cli.js';
import { decodeOwnershipEvidenceAnswer, decodeOwnershipQueryResult, OwnershipCancelledError, OwnershipUnavailableError, requireOwnershipAnswer } from '../ownership-evidence.js';
const root = '/project';
const replies: ScriptedCli[] = [];
afterEach(() => { for (const reply of replies.splice(0)) reply.assertComplete(); });
const location = { file: 'module.ramify', start: 0, end: 4, line: 1, column: 1 };
const diagnostic = { id: 'd', category: 'description', code: 'unknown-clause', message: 'bad declaration', location, related: [location], importer: null, original: null, accessId: null };
const stages = [{ stage: 'parse', status: 'invalid', blockedBy: [], diagnosticIds: ['d'] }];
const answered = () => ({ schemaVersion: 'ramify.ownership/1', ramifyVersion: 'released-test-identity', status: 'answered', exitCode: 0, root, inputId: 'input/1:a',
  scope: { configuration: '/project/tsconfig.json', ownership: { modules: [{ id: 'app', directory: '.', parent: null }], exclusions: [] } },
  paths: [{ path: 'src/a.ts', ownership: { status: 'owned', module: 'app', directory: '.', exclusion: null } }], warnings: [] });
const run = (value: unknown, code: number) => ({ code, stdout: typeof value === 'string' ? value : JSON.stringify(value), stderr: 'retained stderr' });
const decode = (value: unknown, code = 0) => decodeOwnershipQueryResult(run(value, code), root, ['src/a.ts']);

describe('typed ownership evidence', () => {
  it('identifies the exact released installed launcher without probing custom executables', () => {
    expect(new RamifyCli().ownershipCommandSupported).toBe(true);
    expect(new RamifyCli({ executable: ramifyExecutable }).ownershipCommandSupported).toBe(true);
    expect(new RamifyCli({ executable: '/custom/unknown' }).ownershipCommandSupported).toBe(false);
    expect(new RamifyCli({ verifiedOwnershipCommand: false }).ownershipCommandSupported).toBe(false);
  });
  it('keeps provider identity and validates normalized durable answers independently of affected analysis', () => {
    const result = decode(answered());
    const answer = requireOwnershipAnswer(result);
    expect(answer).toMatchObject({ schemaVersion: 'ramify.ownership/1', inputId: 'input/1:a', paths: [{ status: 'owned', module: 'app' }] });
    expect(decodeOwnershipEvidenceAnswer(JSON.parse(JSON.stringify(answer)), root)).toEqual(answer);
    expect(() => decodeOwnershipEvidenceAnswer({ ...answer, inputId: '' }, root)).toThrow();
    expect(() => decodeOwnershipEvidenceAnswer({ ...answer, paths: [{ ...answer.paths[0], path: '../escape' }] }, root)).toThrow();
  });
  it.each([['invalid', 1], ['incomplete', 2], ['unavailable', 2]] as const)('retains %s acquisition evidence and refusal', (status, code) => {
    const body = { schemaVersion: 'ramify.ownership/1', ramifyVersion: 'test', status, root, diagnostics: [diagnostic], stages, exitCode: code };
    const result = decode(body, code);
    expect(result).toMatchObject({ status: 'unavailable', failureStatus: status, exitCode: code, stdout: JSON.stringify(body), stderr: 'retained stderr', decoded: { diagnostics: [diagnostic], stages } });
    try { requireOwnershipAnswer(result); throw new Error('expected refusal'); } catch (error) { expect(error).toBeInstanceOf(OwnershipUnavailableError); expect((error as OwnershipUnavailableError).result).toBe(result); }
  });
  it('keeps answered outside placement separate from unavailable acquisition', () => {
    const body = answered(); body.paths = [{ path: '../elsewhere', ownership: { status: 'outside-project', module: null } }] as never;
    expect(decodeOwnershipQueryResult(run(body, 0), root, ['../elsewhere'])).toMatchObject({ status: 'answered', answer: { paths: [{ status: 'outside-project' }] } });
  });
  it('queries explicit project roots while refusing root answers to empty or nonempty different requests', async () => {
    const body = answered(); body.paths[0]!.path = '.';
    const current = new ScriptedCli(true); replies.push(current);
    current.declare({ argv: ['ownership', '--root', root, '--format', 'json', '--path', '.'], cwd: root, result: run(body, 0) });
    expect((await current.queryOwnershipAnswer(root, ['.'])).paths.map(path => path.path)).toEqual(['.']);
    for (const requested of [[], ['src/a.ts']]) {
      expect(decodeOwnershipQueryResult(run(body, 0), root, requested)).toMatchObject({
        status: 'unavailable', failureStatus: 'unsupported', stdout: JSON.stringify(body),
        reason: expect.stringContaining('query did not answer exactly the requested paths'),
      });
    }
  });
  it('refuses contradictory, unsupported and corrupted evidence without losing raw bytes', () => {
    const wrongDirectory = answered(); wrongDirectory.paths[0]!.ownership.directory = 'elsewhere';
    const wrongWarning = answered(); wrongWarning.warnings = [{ code: 'invented', message: 'm', path: 'src' }] as never;
    const wrongDiagnostics = { schemaVersion: 'ramify.ownership/1', ramifyVersion: 'test', root, status: 'invalid', exitCode: 1, diagnostics: [{ ...diagnostic, category: 'imagined' }] };
    for (const [value, code] of [[{ ...answered(), recovery: {} }, 0], [wrongDirectory, 0], [wrongWarning, 0], [answered(), 1], [wrongDiagnostics, 1], [{ schemaVersion: 'future/1' }, 0]] as const) {
      expect(decode(value, code)).toMatchObject({ status: 'unavailable', failureStatus: 'unsupported', stdout: JSON.stringify(value), decoded: null });
    }
    expect(decode('not json', 0)).toMatchObject({ status: 'unavailable', failureStatus: 'unsupported', stdout: 'not json' });
    expect(decode('timeout', -1)).toMatchObject({ status: 'unavailable', failureStatus: 'execution-failed', exitCode: -1 });
  });
  it('keeps cancellation distinct and never selects the unavailable bridge', () => {
    const result = decode('', 130); expect(result.status).toBe('cancelled');
    expect(() => requireOwnershipAnswer(result)).toThrow(OwnershipCancelledError);
  });
  it('uses only verified command capability, with no repeated unsupported probes', async () => {
    const old = new ScriptedCli(); replies.push(old);
    old.declare({ argv: ['affected', '--batch', '--root', root, '--format', 'json', '--path', 'src/a.ts'], cwd: root, result: run({ schemaVersion: 'ramify.cli/1', status: 'unavailable', exitCode: 2, reason: 'old unavailable' }, 2), times: 2 });
    expect((await old.queryOwnershipResult(root, ['src/a.ts'])).status).toBe('unavailable');
    expect((await old.queryOwnershipResult(root, ['src/a.ts'])).status).toBe('unavailable');
    const current = new ScriptedCli(true); replies.push(current);
    current.declare({ argv: ['ownership', '--root', root, '--format', 'json', '--path', 'src/a.ts'], cwd: root, result: run(answered(), 0) });
    expect((await current.queryOwnershipAnswer(root, ['src/a.ts'])).inputId).toBe('input/1:a');
    const abort = new AbortController(); abort.abort();
    expect((await current.queryOwnershipResult(root, ['src/a.ts'], abort.signal)).status).toBe('cancelled');
    expect(current.calls).toHaveLength(1);
  });
});

const recovery = { schemaVersion: 'ramify.recovery/1', lastCompleted: null, changes: { paths: ['module.ramify'], coverage: 'unavailable', reason: 'no-completed-baseline; context-restarted' } };
const changed = (schemaVersion: string, fields: Record<string, unknown> = {}) => ({ schemaVersion, root, revision: null, since: null,
  paths: [{ path: 'src/a.ts', disposition: 'not-checked', module: null, exclusion: null, reason: 'analysis-failed' }], outcome: 'not-checked', reason: 'analysis-failed', execution: 'invalid',
  findings: [], removed: [], warnings: [], coverage: [], checked: null, timings: {}, exitCode: 2, ...fields });
async function changedResult(body: unknown, code: number) {
  const cli = new ScriptedCli(); replies.push(cli);
  cli.declare({ argv: ['check', '--changed', 'src/a.ts', '--format', 'json', '--deadline', '100'], cwd: root, result: run(body, code) });
  return cli.checkChanged(['src/a.ts'], root, 100);
}
describe('versioned failure carriers', () => {
  it('retains stages, related locations and resident gaps only from new carriers', async () => {
    const finding = { ...diagnostic, new: true };
    const result = await changedResult(changed('ramify.check/4', { findings: [finding], stages, recovery }), 2);
    expect(result).toMatchObject({ outcome: 'not-checked', execution: 'invalid', provider: { schema: 'ramify.check/4' }, failureEvidence: { stages, recovery } });
    expect(result.report).toMatchObject({ findings: [finding] });
    expect((await changedResult(changed('ramify.check/3', { recovery }), 2)).unsupported).toContain('old schema');
    const old = await changedResult(changed('ramify.check/3'), 2);
    expect(old.failureEvidence).toEqual({});
  });
  it('preserves generic invalid exit1 and execution exit2, and rejects mismatches and future fields', async () => {
    const body = { schemaVersion: 'ramify.cli/2', status: 'unavailable', exitCode: 1, diagnostics: [{ category: 'execution', code: 'analysis-failed', message: 'not selected' }, diagnostic], stages, recovery };
    expect(decode(body, 1)).toMatchObject({ status: 'unavailable', failureStatus: 'invalid', decoded: { diagnostics: body.diagnostics, stages, recovery } });
    expect(await changedResult(body, 1)).toMatchObject({ outcome: 'not-checked', failureEvidence: { diagnostics: body.diagnostics, stages, recovery }, unsupported: null });
    expect((await changedResult({ ...body, exitCode: 2 }, 2)).unsupported).toBeNull();
    expect((await changedResult(body, 2)).unsupported).toContain('disagreement');
    expect((await changedResult({ ...body, invented: true }, 1)).unsupported).toContain('unsupported CLI fields');
    expect((await changedResult({ ...body, schemaVersion: 'ramify.cli/1' }, 1)).unsupported).not.toBeNull();
  });
  it('refuses fabricated history and preserves cancellation with received output', async () => {
    for (const invalid of [{ ...recovery, changes: { ...recovery.changes, paths: ['../foreign'] } }, { ...recovery, changes: { ...recovery.changes, paths: ['x', 'x'] } }, { ...recovery, changes: { ...recovery.changes, coverage: 'observed' } }]) {
      expect((await changedResult(changed('ramify.check/4', { recovery: invalid }), 2)).unsupported).not.toBeNull();
    }
    expect(await changedResult('Interrupted', 130)).toMatchObject({ cancelled: true, outcome: 'not-checked', exitCode: 130, stdout: 'Interrupted' });
  });
});

const generation = '12345678-1234-1234-1234-123456789abc';
const completedIdentity = { context: `ctx/1:${'a'.repeat(64)}`, generation: `gen/1:${generation}`, revision: `rev/1:${generation}:2`, inputId: `input/1:${'b'.repeat(64)}` };
it('preserves historical evidence for a cleanup nonanswer after completed execution and validates identity/coverage', async () => {
  const history = { schemaVersion: 'ramify.recovery/1', lastCompleted: completedIdentity, changes: { paths: ['src/a.ts'], coverage: 'observed', reason: null } };
  expect(await changedResult(changed('ramify.check/4', { execution: 'completed', recovery: history }), 2)).toMatchObject({ outcome: 'not-checked', failureEvidence: { recovery: history }, unsupported: null });
  for (const invalid of [
    { ...history, lastCompleted: { ...completedIdentity, revision: 'rev/1:other:2' } },
    { ...history, changes: { ...history.changes, paths: ['z.ts', 'a.ts'] } },
    { ...history, changes: { ...history.changes, coverage: 'unavailable' } },
  ]) expect((await changedResult(changed('ramify.check/4', { recovery: invalid }), 2)).unsupported).not.toBeNull();
});
