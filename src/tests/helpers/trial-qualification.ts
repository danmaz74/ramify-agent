import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { collectTrialScratchSetup, type TrialGitCommand, type TrialScratchSetupRecord } from '../../../scripts/trial-attribution.js';

export const B = 'b'.repeat(40); export const S = 'c'.repeat(40); export const F = 'f'.repeat(40);
export const bytes = (text: string) => Buffer.from(text);
export const old = bytes('dist/\n'); export const setup = bytes('dist/\n**/src/tmp/\n'); export const agent = bytes('dist/\n**/src/tmp/\nsecret-source.ts\n');
export const record: TrialScratchSetupRecord = { id: 'scratch-setup:2', runId: 'run-1', originalIgnoreBase64: old.toString('base64'), commit: S, appended: true };
const delta = '@@ -1,0 +2 @@\n+**/src/tmp/\n';
export const row = (commit: string, source: number, final: number, text: string) => `${commit} ${source} ${final} 1\nfilename .gitignore\n\t${text}\n`;
export function tree(content: Uint8Array | null, objectPath = '.gitignore', mode = '100644') {
  if (content === null) return Buffer.alloc(0);
  const sha = createHash('sha1').update(Buffer.from(`blob ${content.length}\0`)).update(content).digest('hex');
  return bytes(`${mode} blob ${sha}\t${objectPath}\0`);
}
/** Only raw external Git answers are scripted; collector and KPI verifier execute unchanged. */
export function scriptedTrialGitFake(answers: readonly (readonly [readonly string[], Uint8Array])[]) {
  const pending = [...answers]; const failures: string[] = [];
  const command: TrialGitCommand = async (project, args) => {
    const answer = pending.shift();
    if (project !== '/fixture' || !answer || JSON.stringify(args) !== JSON.stringify(answer[0])) { failures.push(`Unexpected command ${JSON.stringify(args)}; expected ${JSON.stringify(answer?.[0])}`); throw new Error(failures.at(-1)); }
    return answer[1];
  };
  return { command, verify() { assert.deepEqual(failures, []); assert.deepEqual(pending, []); } };
}
export function plan(options: { original?: Uint8Array | null; after?: Uint8Array; final?: Uint8Array; current?: Uint8Array | null; patch?: string; origins?: string; setupPatch?: string; prefix?: string; finalMode?: string } = {}) {
  const original = options.original === undefined ? old : options.original;
  const after = options.after ?? setup; const final = options.final ?? after; const prefix = options.prefix ?? '';
  const objectPath = `${prefix}.gitignore`;
  const answers: Array<readonly [readonly string[], Uint8Array]> = [
    [['rev-parse', '--show-prefix'], bytes(`${prefix}\n`)], [['rev-list', '--first-parent', '--reverse', F], bytes(`${B}\n${S}\n${F}\n`)],
  ];
  for (const [revision, content] of [[B, original], [S, after], [B, original], [F, final]] as const) {
    answers.push([['ls-tree', '-rz', '--full-tree', revision], tree(content, objectPath, revision === F ? options.finalMode ?? '100644' : '100644')]);
    if (content !== null) answers.push([['cat-file', 'blob', `${revision}:${objectPath}`], content]);
  }
  const diff = (from: string, to: string) => ['diff', '--no-ext-diff', '--no-textconv', '--unified=0', '--no-renames', from, to, '--', '.gitignore'];
  answers.push([diff(B, S), bytes(options.setupPatch ?? delta)], [diff(B, F), bytes(options.patch ?? delta)]);
  const patch = options.patch ?? delta;
  if (patch !== '') {
    const extra = patch.includes('+2,2') ? ['-L', '3,3'] : [];
    answers.push([['blame', '--line-porcelain', '-L', '2,2', ...extra, F, '--', '.gitignore'], bytes(options.origins ?? row(S, 2, 2, '**/src/tmp/'))]);
  }
  const actualRecord = { ...record, originalIgnoreBase64: original === null ? null : Buffer.from(original).toString('base64') };
  return { answers, input: { project: '/fixture', runId: 'run-1', base: B, final: F, record: actualRecord, currentIgnoreBytes: options.current === undefined ? final : options.current, currentIgnoreMode: '100644' as const } };
}
export async function run(data = plan()) {
  const script = scriptedTrialGitFake(data.answers); const result = await collectTrialScratchSetup(data.input, script.command); script.verify(); return result;
}
