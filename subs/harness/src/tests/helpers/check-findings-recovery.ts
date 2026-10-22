import { existsSync } from 'node:fs';
import { readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { expect } from 'vitest';
import { replayCheckFindingEvents } from '../../../subs/check-findings/src/replay.js';
import { selectCheckFindings } from '../../../subs/check-findings/src/queries.js';
import { carriedCheckFindings, type RunEvent } from '../../../subs/autonomous/src/run/log.js';
import { scriptedCandidates, testReviewPolicy } from '../../../subs/autonomous/subs/acceptance/src/tests/helpers/candidates.js';
import { reviewEventsOf as eventsOf, plan, reviewRun } from '../../../subs/autonomous/subs/acceptance/src/tests/helpers/reviews.js';
import { compositionCommits, compositionScenario, compositionTarget } from './check-findings-composition.js';
import { identityOf, logLines, recordText, runDirectory, type LogLine } from './composition.js';
import { mockGit } from './mock-git.js';
import { onlyRun, openRuns, testPolicy } from './runs.js';

/*
 * CF06 and CF07: the composed CheckFinding run, cut just before and just
 * after review, reconciliation and CheckFinding boundary lines, and reopened
 * without an execution agent. check-findings-composition.test.ts runs a few
 * cuts of distinct kinds; check-findings-composition.stress.ts runs them all.
 */

/** A service opened over the project as a crash left it: nothing is driven, and what recovery asks of Git is answered. */
export async function restart(root: string) {
  const restarted = await openRuns(root, {
    git: mockGit({ changedPaths: async () => [], currentHead: async () => 'revision-04' }),
    candidates: scriptedCandidates(root, compositionCommits()),
    policy: projectRoot => testPolicy(projectRoot, { reviews: testReviewPolicy({ kinds: ['code', 'scope', 'design'] }) }),
  });
  return restarted;
}

/** The lines of the review, reconciliation and CheckFinding boundaries, where a crash is placed before and after. */
function boundary(event: RunEvent): boolean {
  return event.type.startsWith('review-') || event.type.startsWith('reconciliation-')
    || carriedCheckFindings(event).length > 0 || event.type === 'work-item-completed'
    || event.type === 'iteration-closed';
}

/** Each identity the log may hold once, beside the composition's own: a request, an attempt's start and end, a round's start, assessment and brief. */
function reviewIdentity(event: RunEvent): string | null {
  switch (event.type) {
    case 'review-request-recorded': return `${event.type}:${event.data.request}`;
    case 'review-attempt-started': case 'review-attempt-finished': return `${event.type}:${event.data.attempt}`;
    case 'review-orientation-recorded': return `${event.type}:${event.data.key}`;
    case 'reconciliation-started': case 'reconciliation-assessed': case 'reconciliation-brief-appended': return `${event.type}:${event.data.reconciliation}`;
    default: return identityOf(event);
  }
}

/** Runs the composed scenario, then crashes and recovers it at each cut `choose` picks from the boundary cuts. */
export async function recoverFromPrefixes(cleanups: Array<() => Promise<void>>,
  choose: (cuts: readonly number[], golden: readonly LogLine[]) => number[]): Promise<void> {
  const root = await compositionTarget(cleanups);
  const run = await reviewRun(root, cleanups, compositionScenario(root));
  expect(onlyRun(run.service, plan).state).toBe('completed');
  await run.service.close();
  const runId = run.runId;
  const golden = await logLines(root, runId);
  const directory = runDirectory(root, runId);

  // A crash leaves a prefix of the log: the ledger writes whole lines only
  // (iteration 2's fault sweep), and its record copies may be missing. Each
  // cut is placed just before and just after one boundary line.
  const boundaryCuts = [...new Set(golden.flatMap((line, index) => (boundary(line.event) ? [index, index + 1] : [])))].sort((a, b) => a - b);
  const cuts = boundaryCuts.filter(cut => {
    const prefix = golden.slice(0, cut).map(line => line.event);
    const started = prefix.filter(event => event.type === 'gate-committing').length;
    const finished = prefix.filter(event => event.type === 'gate-attempted').length;
    // Review may finish during audit. This no-execution-agent sweep can
    // resume settled gates, but cannot complete an in-flight Git/audit effect.
    return started === finished;
  });
  expect(boundaryCuts.length - cuts.length).toBeGreaterThan(0);
  const chosen = [...new Set(choose(cuts, golden))].sort((a, b) => a - b);
  expect(chosen.every(cut => cuts.includes(cut)), `cuts ${chosen.join(', ')}`).toBe(true);
  const written = new Set<string>();
  const recovered = new Map<number, RunEvent[]>();
  for (const cut of chosen) {
    const prefix = golden.slice(0, cut);
    // Nothing the crashed process committed after the cut, and none of its record copies, survives.
    for (const path of new Set([...golden.flatMap(line => line.records.map(record => record.path)), ...written])) {
      if (existsSync(join(directory, path))) await rm(join(directory, path));
    }
    await writeFile(join(directory, 'events.jsonl'), prefix.map(line => `${line.text}\n`).join(''));

    const restarted = await restart(root);
    try {
      const after = await logLines(root, runId);
      const context = `cut ${cut} after ${prefix.at(-1)?.event.type ?? 'nothing'}`;
      // The prefix is untouched; recovery called no agent session.
      expect(after.slice(0, cut).map(line => line.text), context).toEqual(prefix.map(line => line.text));
      expect(restarted.agent, context).toBeUndefined();
      const assessedIntent = prefix.find(line => line.event.type === 'reconciliation-assessed' && line.event.data.reconciliation === 'work-item:catalog-tags.rc01');
      if (assessedIntent?.effect?.phase === 'intent' && !prefix.some(line => line.effect?.key === assessedIntent.effect!.key && line.effect.phase === 'completion')) {
        // Without an execution port, retain the authentic pending append;
        // no executor has established a lost session or completed delivery.
        expect(after.filter(line => line.effect?.key === assessedIntent.effect!.key).map(line => line.effect!.phase), context).toEqual(['intent']);
      }
      const appended = after.slice(cut).map(line => line.event);
      // Invocation settlement is recorded, but no review result or workflow decision is invented.
      for (const event of appended) {
        expect(event.type, context).toBe('invocation-ended');
        if (event.type !== 'invocation-ended') continue;
        expect(prefix.some(line => line.event.type === 'invocation-started' && line.event.data.invocation === event.data.invocation), context).toBe(true);
        expect(prefix.some(line => line.event.type === 'invocation-ended' && line.event.data.invocation === event.data.invocation), context).toBe(false);
      }
      const events = after.map(line => line.event);
      // Exactly once: every identity at most once, and the CheckFinding events replay.
      const identities = events.flatMap(event => reviewIdentity(event) ?? []);
      expect(identities.filter((identity, index) => identities.indexOf(identity) !== index), context).toEqual([]);
      const replayed = replayCheckFindingEvents(events.flatMap(event => [...carriedCheckFindings(event)]));
      if (!replayed.ok) throw new Error(`${context}: ${replayed.rejection.message}`);
      // Reopening without an execution agent retains precisely the recorded requests and unfinished reviews.
      const requests = eventsOf(events, 'review-request-recorded');
      const settled = new Set(eventsOf(events, 'review-attempt-finished').filter(event => event.data.settles).map(event => event.data.request));
      const coverage = restarted.service.reviews(plan, runId)!.coverage;
      expect(coverage, context).toMatchObject({ state: 'available', requested: requests.length,
        pending: requests.filter(event => !settled.has(event.data.request)).length });
      // The projections are rebuilt from the log alone.
      const list = restarted.service.checkFindings(plan, runId, { kind: 'list', owner: null, select: 'all', limit: 100 });
      expect(list, context).toEqual(selectCheckFindings(replayed.state, { kind: 'list', owner: null, select: 'all', limit: 100 }));
      for (const id of replayed.state.findings.keys()) {
        expect(restarted.service.checkFindings(plan, runId, { kind: 'detail', checkFinding: id }), `${context}: ${id}`)
          .toEqual(selectCheckFindings(replayed.state, { kind: 'detail', checkFinding: id }));
      }
      // Materialized records contain the latest committed version. The
      // immutable prefix above retains every earlier intent/prepared version.
      const currentRecords = new Map(after.flatMap(line => line.records).map(record => [record.path, record.body]));
      for (const [path, body] of currentRecords) {
        written.add(path);
        expect(await readFile(join(directory, path), 'utf8'), `${context}: ${path}`).toBe(recordText(body));
      }
      expect(events.some(event => event.type === 'job-interrupted'), context).toBe(false);
      recovered.set(cut, appended);
    } finally {
      await restarted.service.close();
    }
    // A second restart finds nothing to do.
    const before = await readFile(join(directory, 'events.jsonl'), 'utf8');
    const again = await restart(root);
    try {
      expect(await readFile(join(directory, 'events.jsonl'), 'utf8')).toBe(before);
      expect(again.agent).toBeUndefined();
    } finally {
      await again.service.close();
    }
  }
  // Every cut retains its pending scheduling, reader or parent append for an execution owner.
  expect([...recovered.values()].every(appended => appended.every(event => event.type === 'invocation-ended'))).toBe(true);
}
