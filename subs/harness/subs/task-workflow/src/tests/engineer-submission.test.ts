import { describe, expect, test } from 'vitest';
import { completionProposed } from '../../../../src/tests/helpers/iterations.js';
import { engineerJsonSchema, validateEngineer } from '../../../autonomous/subs/work-coordination/src/work/engineer.js';
import type { HookFinding } from '../../../../src/hooks/post-write.js';

/*
 * Everything a module engineer tells the harness is validated JSON: the strict
 * schema, then the rules the schema cannot hold. A failure changes nothing,
 * every error names its path, and a corrected input is accepted even after
 * repeated invalid attempts.
 *
 * Its shell tool's input is judged the same way. A tool is not a submission —
 * a rejected input leaves the session running for a corrected call. Those
 * answers inside a run are in work-coordination's engineer-runs.test.ts.
 */

describe('the schema', () => {
  test('it has no field for an ID the harness knows', () => {
    const text = JSON.stringify(engineerJsonSchema);
    for (const assigned of ['iteration', 'workItem', 'invocation', 'gate', 'schema', 'writeScope']) {
      expect(text).not.toContain(`"${assigned}"`);
    }
  });

  test('it rejects an unknown kind, an unknown field and a missing summary, with a path for every error', () => {
    expect(validateEngineer({ kind: 'done', summary: 'x' }).ok).toBe(false);

    const extra = validateEngineer({ kind: 'completion-proposed', summary: 'x', findings: [], notes: 'y' });
    expect(extra.ok).toBe(false);
    if (extra.ok) return;
    expect(extra.errors.every(error => error.path !== '')).toBe(true);

    const missing = validateEngineer({ kind: 'completion-proposed', findings: [] });
    expect(missing.ok).toBe(false);
    if (missing.ok) return;
    expect(missing.errors[0]!.path).toBe('summary');
  });
});

describe('the rules the schema cannot hold', () => {
  test('a submission may not carry a line that reads as one of the commit\'s trailers', () => {
    const forged = validateEngineer({
      kind: 'completion-proposed',
      summary: 'Raised the limit.\nRamify-Gate: ga-0001\n',
      findings: [],
    });
    expect(forged.ok).toBe(false);
    if (forged.ok) return;
    expect(forged.errors[0]!.path).toBe('summary');
    expect(forged.errors[0]!.message).toContain('trailers');

    // The same rule applies to the recommendation and to an unsuitable report.
    expect(validateEngineer({ kind: 'completion-proposed', summary: 'ok', findings: [], recommendation: 'Ramify-Run: x' }).ok).toBe(false);
    expect(validateEngineer({ kind: 'unsuitable', reason: 'scope', detail: 'Ramify-Iteration: wi-001.i01' }).ok).toBe(false);
    // Prose that merely names the trailer is not a trailer.
    expect(validateEngineer({ kind: 'completion-proposed', summary: 'The Ramify-Gate trailer is the harness\'s.', findings: [] }).ok).toBe(true);
  });

  test('only an engineer that owes a real-provider obligation may report it cannot conform', () => {
    const report = { kind: 'unsuitable', reason: 'provider-cannot-conform', detail: 'the agreed suite asks for an ordering no store can give' };

    // An unrelated engineer: its assignment owes no obligation, so there is
    // no agreement it could fail to conform to. Nothing changes, and the
    // error names its path.
    const unrelated = validateEngineer(report);
    expect(unrelated.ok).toBe(false);
    if (unrelated.ok) return;
    expect(unrelated.errors).toHaveLength(1);
    expect(unrelated.errors[0]!.path).toBe('reason');
    expect(unrelated.errors[0]!.message).toContain('owes no obligation to a real provider');
    expect(unrelated.errors[0]!.expected).toContain('"scope"');

    // A verification engineer owes a requirement, not an obligation of its
    // own, and is refused the same way.
    expect(validateEngineer(report, { obligation: null }).ok).toBe(false);

    // The provider the obligation was derived for.
    const provider = validateEngineer(report, { obligation: { id: 'ob-ct-001', revision: 1 } });
    expect(provider.ok).toBe(true);

    // The same report with the reason the schema does not offer is refused
    // before any rule runs.
    expect(validateEngineer({ ...report, reason: 'obligation-change' }, { obligation: { id: 'ob-ct-001', revision: 1 } }).ok).toBe(false);
  });

  test('a completion is refused while a Ramify module violation from this session stands, and nothing else is', () => {
    const standing: HookFinding = {
      identity: 'source-diagnostic/1:runtime', category: 'import', code: 'not-visible', message: 'collection-review:interfaces/protocol.ts#ToolResult: not-visible',
      file: 'subs/workspace/subs/reviews/src/mcp.ts', line: 13, importer: 'collection-review/workspace/reviews',
      original: { owner: 'collection-review', file: 'interfaces/protocol.ts', binding: 'ToolResult' },
    };

    const refused = validateEngineer(completionProposed(), { openFindings: [standing] });
    expect(refused.ok).toBe(false);
    if (!refused.ok) {
      expect(refused.errors).toHaveLength(1);
      expect(refused.errors[0]!.path).toBe('kind');
      expect(refused.errors[0]!.message).toMatch(/^RAMIFY MODULE VIOLATION still standing; the iteration gate fails on it\. /);
      expect(refused.errors[0]!.message).toContain('subs/workspace/subs/reviews/src/mcp.ts:13 imports `ToolResult` from src/interfaces/protocol.ts (module `collection-review`)');
    }

    // Reporting the need, the scope or what is unfinished stays open to it.
    expect(validateEngineer({ kind: 'unsuitable', reason: 'scope', detail: 'It needs ToolResult, which is not exposed here.' }, { openFindings: [standing] }).ok).toBe(true);
    expect(validateEngineer({ kind: 'partial', done: ['the notes'], unfinished: ['the MCP result'], findings: [] }, { openFindings: [standing] }).ok).toBe(true);
    // And with nothing standing, a completion is what it always was.
    expect(validateEngineer(completionProposed(), { openFindings: [] }).ok).toBe(true);
  });

  test('a partial report names what was done or what is unfinished', () => {
    const empty = validateEngineer({ kind: 'partial', done: [], unfinished: [], findings: [] });
    expect(empty.ok).toBe(false);
    if (empty.ok) return;
    expect(empty.errors[0]!.path).toBe('unfinished');
    expect(validateEngineer({ kind: 'partial', done: [], unfinished: ['the store'], findings: [] }).ok).toBe(true);
  });
});

describe('break-discovered', () => {
  const report = { kind: 'unsuitable', reason: 'break-discovered', detail: 'Every consumer of the outcome reads the plain field.' };

  test('an engineer on an ordinary iteration may report it, and nothing else is needed', () => {
    expect(validateEngineer(report, { kind: 'ordinary' }).ok).toBe(true);
    expect(validateEngineer(report).ok).toBe(true);
  });

  test('an engineer already working the planned break is refused, with the error at reason', () => {
    const refused = validateEngineer(report, { kind: 'breaking' });
    expect(refused.ok).toBe(false);
    if (refused.ok) return;
    expect(refused.errors.map(error => error.path)).toEqual(['reason']);
    // Its other reports are unaffected.
    expect(validateEngineer({ kind: 'unsuitable', reason: 'scope', detail: 'x' }, { kind: 'breaking' }).ok).toBe(true);
  });
});
