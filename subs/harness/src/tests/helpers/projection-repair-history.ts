import assert from 'node:assert/strict';
import { readFile, readdir, stat, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { RunQueries, type RunSource } from '../../../subs/projections/src/queries.js';
import { ProjectionError } from '../../../subs/projections/src/inputs.js';
import { commitRecord } from '../../jobs/commit.js';
import { RunLog } from '../../../subs/autonomous/src/run/log.js';
import { runLayout } from '../../../subs/autonomous/src/run/records.js';
import { authenticateRepairHistory, RepairHistoryError } from '../../../subs/autonomous/subs/work-coordination/src/repair/repair-history.js';
import { repairIncidentRecordSchema } from '../../interfaces/protocol/repairs.js';
import { runRepairExportCommandWith } from '../../../subs/autonomous/src/run/repair-export-command.js';
import { repairExportPayloadPath } from '../../../subs/autonomous/src/run/repair-export.js';
import { commandResult } from './command-result.js';
import { runId } from './constructed.js';
import { retainedRepairRun } from './repair-export-fixture.js';

export const repairInconsistencies = [
  'a record and event identity mismatch', 'a gap in incident revisions',
  'an invalid lifecycle transition', 'changed original incident evidence',
  'export changing non-export evidence', 'conflicting invocation identity',
  'continuation without verified handback',
] as const;
export type RepairInconsistency = typeof repairInconsistencies[number];
const diagnostics: Record<RepairInconsistency, string> = {
  'a record and event identity mismatch': 'does not identify its committed record',
  'a gap in incident revisions': 'revisions must be consecutive',
  'an invalid lifecycle transition': 'Invalid automatic repair transition refused to refused',
  'changed original incident evidence': 'changes original harnessError',
  'export changing non-export evidence': 'changes incident evidence',
  'conflicting invocation identity': 'names a different invocation or session',
  'continuation without verified handback': 'has no verified continuation',
};

// Inventory includes every retained run file (bytes and write timestamps), not
// just selected materializations. The command's lock lives outside this tree.
async function inventory(directory: string): Promise<unknown[]> {
  const result: unknown[] = [];
  for (const name of (await readdir(directory)).sort()) {
    const path = join(directory, name);
    const info = await stat(path);
    if (info.isDirectory()) result.push([name, await inventory(path)]);
    else result.push([name, await readFile(path), info.mtimeMs]);
  }
  return result;
}

// This topology witness complements (never substitutes for) the real-output,
// file and counter assertions below. Both production consumers must directly
// import and call the harness's authenticator; equal errors alone cannot prove
// that they have not independently reimplemented its rules.
async function sharedAuthenticatorTopology() {
  const provider = fileURLToPath(new URL('../../../subs/autonomous/subs/work-coordination/src/repair/repair-history.ts', import.meta.url));
  for (const url of [new URL('../../../subs/autonomous/src/run/repair-export-command.ts', import.meta.url),
    new URL('../../../subs/projections/src/repairs.ts', import.meta.url)]) {
    const path = fileURLToPath(url);
    const source = await readFile(path, 'utf8');
    const imported = [...source.matchAll(/import\s*\{([^}]+)\}\s*from\s*['"]([^'"]+)['"]/g)]
      .filter(match => resolve(dirname(path), match[2]!.replace(/\.js$/, '.ts')) === provider
        && match[1]!.split(',').map(value => value.trim()).includes('authenticateRepairHistory'));
    assert.equal(imported.length, 1, `${path} must directly import the shared authenticator`);
    assert.equal([...source.matchAll(/\bauthenticateRepairHistory\s*\(/g)].length, 1,
      `${path} must call the shared authenticator`);
  }
}

export async function recordedRepairHistory(inconsistency?: RepairInconsistency) {
  const advanced = inconsistency === 'conflicting invocation identity' || inconsistency === 'continuation without verified handback';
  const exportEvent = inconsistency === 'a gap in incident revisions' || inconsistency === 'export changing non-export evidence';
  const fixture = await retainedRepairRun(false, inconsistency === undefined || exportEvent, advanced);
  if (inconsistency !== undefined) {
    if (advanced) await fixture.log.append({ type: 'invocation-started', data: {
      invocation: 'inv-repair', session: 'ses-0001', role: 'engineer', start: 'opened', work: { automaticRepair: 'apr-0001' },
    } });
    const revision = inconsistency === 'a gap in incident revisions' ? 3 : 2;
    const incident = repairIncidentRecordSchema.parse({ ...fixture.payload.incident, revision,
      ...(advanced ? { invocation: inconsistency === 'conflicting invocation identity' ? 'inv-other' : 'inv-repair', session: 'ses-0001' } : {}),
      ...(['changed original incident evidence', 'export changing non-export evidence'].includes(inconsistency)
        ? { harnessError: { ...fixture.payload.incident.harnessError, message: 'Changed original failure' } } : {}),
    });
    const event = exportEvent
      ? fixture.log.next({ type: 'repair-export-recorded', data: { incidentId: incident.incidentId, revision, state: incident.export.state } })
      : fixture.log.next({ type: 'repair-incident-recorded', data: { incidentId: incident.incidentId, revision, stage: advanced ? 'running' : 'refused' } });
    await commitRecord(fixture.log.ledger, { event, records: [{ path: runLayout.repairIncident(incident.incidentId, revision),
      id: inconsistency === 'a record and event identity mismatch' ? 'apr-9999' : incident.incidentId, revision, body: incident }] });
    if (inconsistency === 'continuation without verified handback') {
      const continued = repairIncidentRecordSchema.parse({ ...incident, revision: 3,
        result: { outcome: 'ready', summary: 'Ready judgment', checks: [], remainingWork: [], suspectedCause: null, evidence: [] },
        verification: { verified: false, reason: 'Handback not verified', evidence: [] },
        continuation: { delivered: true, reason: 'Delivered', evidence: [] } });
      await commitRecord(fixture.log.ledger, { event: fixture.log.next({ type: 'repair-incident-recorded', data: {
        incidentId: continued.incidentId, revision: 3, stage: 'continued',
      } }), records: [{ path: runLayout.repairIncident(continued.incidentId, 3), id: continued.incidentId, revision: 3, body: continued }] });
    }
    // Recovery would repair both markers; refusal must leave them untouched.
    for (const path of [runLayout.repairIncident('apr-0001', 1), repairExportPayloadPath('apr-0001', 1)]) {
      await writeFile(join(fixture.directory, path), 'not recovered');
    }
  }
  const entries = fixture.log.ledger.replay();
  const source: RunSource = {
    projectRoot: fixture.root, agentName: undefined,
    committed: () => ({ record: fixture.record, directory: fixture.directory, entries }),
    committedRuns: () => [{ record: fixture.record, directory: fixture.directory, entries }],
    runVersions: () => [{ planId: 'review-notes', runId, version: entries.at(-1)?.sequence ?? 0 }],
  };
  const query = () => new RunQueries(source).run('review-notes', runId);
  const captured = await inventory(fixture.directory);
  let calls = 0;
  let exercised = false;
  let queryError: ProjectionError | undefined;
  let historyError: RepairHistoryError | undefined;
  let result: Awaited<ReturnType<typeof runRepairExportCommandWith>> | undefined;
  let retry: typeof result;
  let unchangedQuery = false;
  let preservedTerminal = false;
  let refusedBeforeEffects = false;
  let payloadPreserved = false;
  return {
    close: fixture.close,
    async exercise() {
      assert(!exercised); exercised = true;
      await sharedAuthenticatorTopology();
      if (inconsistency !== undefined) {
        try { authenticateRepairHistory(entries); assert.fail('Corrupt history authenticated'); }
        catch (error) {
          assert(error instanceof RepairHistoryError);
          assert(error.message.includes(diagnostics[inconsistency]), error.message);
          assert.deepEqual(error.evidence, []); // these lifecycle failures intentionally have no path evidence
          historyError = error;
        }
        try { await query(); assert.fail('Corrupt query succeeded'); }
        catch (error) { assert(error instanceof ProjectionError); queryError = error; }
      } else {
        const authenticated = authenticateRepairHistory(entries);
        assert.equal(authenticated.length, 1);
        assert.deepEqual(authenticated[0]?.record, fixture.payload.incident);
        const answer = await query();
        assert.equal(answer.run.automaticRepairs?.incidents[0]?.stage, authenticated[0]?.stage);
        for (let i = 0; i < 3; i++) assert.deepEqual(await query(), answer);
      }
      unchangedQuery = calls === 0;
      assert.deepEqual(await inventory(fixture.directory), captured);
      const execution: Parameters<typeof runRepairExportCommandWith>[1] = { commandExecution: async request => {
        calls++;
        assert.equal(inconsistency, undefined, 'Corrupt history launched exporter');
        if (request.argv.includes('update')) {
          assert(request.argv.includes('tracker-1'));
          assert(request.argv.includes('--body-file'));
          const sent = JSON.parse(request.stdin ?? 'null');
          const retained = JSON.parse(await readFile(join(fixture.directory, repairExportPayloadPath('apr-0001', 2)), 'utf8'));
          assert.deepEqual(sent, retained);
          return commandResult(request, { stdout: '{}' });
        }
        assert(request.argv.includes('list'));
        assert(request.argv.includes(fixture.payload.incident.export.externalRef));
        return commandResult(request, { stdout: JSON.stringify([{ id: 'tracker-1', external_ref: fixture.payload.incident.export.externalRef, status: 'closed' }]) });
      } };
      result = await runRepairExportCommandWith(fixture.options, execution);
      if (inconsistency !== undefined) {
        assert.equal(calls, 0);
        assert.deepEqual(await inventory(fixture.directory), captured);
        refusedBeforeEffects = true;
      } else {
        assert.equal(calls, 1);
        const reopened = await RunLog.open(join(fixture.directory, runLayout.events), runId);
        assert.deepEqual(reopened.terminal, fixture.log.terminal);
        preservedTerminal = true;
        const revised = JSON.parse(await readFile(join(fixture.directory, repairExportPayloadPath('apr-0001', 2)), 'utf8'));
        const { revision: _revision, export: _export, ...retained } = revised.incident;
        const { revision: _originalRevision, export: _originalExport, ...original } = fixture.payload.incident;
        assert.deepEqual(retained, original);
        assert.equal(revised.projectKey, fixture.payload.projectKey);
        assert.equal(revised.incident.export.externalRef, fixture.payload.incident.export.externalRef);
        assert.equal(revised.incident.export.issueId, 'tracker-1');
        payloadPreserved = true;
        retry = await runRepairExportCommandWith(fixture.options, execution);
        assert.equal(calls, 3); // initial lookup, retry lookup and same-issue payload update; no create
        const afterRetry = await RunLog.open(join(fixture.directory, runLayout.events), runId);
        assert.deepEqual(afterRetry.terminal, fixture.log.terminal);
        const after = await new RunQueries({ ...source, committed: () => ({ record: fixture.record, directory: fixture.directory, entries: afterRetry.ledger.replay() }) }).run('review-notes', runId);
        assert.equal(after.run.automaticRepairs?.incidents[0]?.stage, 'refused');
        assert.equal(after.run.automaticRepairs?.incidents[0]?.export.externalRef, fixture.payload.incident.export.externalRef);
      }
    },
    sharedValidation() {
      assert(exercised);
      if (inconsistency !== undefined) {
        assert(historyError && queryError && result);
        assert.equal(queryError.message, historyError.message);
        assert.deepEqual(queryError.evidence, historyError.evidence);
        assert(result.stderr.includes(historyError.message));
      } else assert(payloadPreserved && preservedTerminal);
    },
    queryUnchanged() { assert(exercised && unchangedQuery); },
    commandPreserved() {
      assert(payloadPreserved && result && retry);
      for (const command of [result, retry]) {
        assert.equal(command.exitStatus, 0);
        assert.equal(command.stderr, '');
        assert.equal(JSON.parse(command.stdout).exports[0].issueId, 'tracker-1');
        assert.equal(JSON.parse(command.stdout).exports[0].state, 'exported');
      }
    },
    terminalPreserved() { assert(preservedTerminal); },
    unreadable() { assert(queryError); assert.equal(queryError.code, 'unreadable'); assert.deepEqual(queryError.evidence, historyError?.evidence); },
    refused() { assert(refusedBeforeEffects && result); assert.equal(result.exitStatus, 2); assert.equal(result.stdout, ''); assert.equal(calls, 0); },
  };
}
