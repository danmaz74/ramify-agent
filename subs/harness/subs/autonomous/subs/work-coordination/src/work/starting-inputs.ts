import { isAbsolute, join, relative, resolve, sep } from 'node:path';
import type { TestArea } from '../../../../../../src/run/project-config.js';
import { resolveSnapshotPath, type CandidateSnapshot } from '../../../../../reviews/src/snapshot.js';
import type { StartingPoint } from './starting-points.js';

/** Producer identity is supplied by the harness's existing records, never by a hint. */
export interface StartingPointGroup {
  readonly origin: {
    readonly producer: string;
    readonly workItem: string;
    readonly iteration?: string;
    readonly invocation?: string;
    readonly boundary?: string;
    readonly capabilityTask?: string;
  };
  readonly points: readonly StartingPoint[] | undefined;
}

/**
 * A path as a message states it: relative to the project root, which the
 * environment states once, or absolute where it lies outside the project.
 */
function projectPath(projectRoot: string, value: string): string {
  const absolute = resolve(projectRoot, value);
  const within = relative(projectRoot, absolute);
  if (within === '') return '.';
  return within === '..' || within.startsWith(`..${sep}`) || isAbsolute(within) ? absolute : within.split(sep).join('/');
}

/** One caller-owned section; exact pairs share all origins in stable declaration order. */
export function startingPointsSection(groups: readonly StartingPointGroup[], input: {
  readonly projectRoot: string;
  readonly snapshot?: CandidateSnapshot;
  readonly allows?: (path: string) => boolean;
}): { readonly key: 'support:starting-points'; readonly text: string } | undefined {
  const pairs = new Map<string, { point: StartingPoint; origins: StartingPointGroup['origin'][] }>();
  for (const group of groups) for (const point of group.points ?? []) {
    if (input.allows && !input.allows(point.path)) continue;
    if (input.snapshot && !resolveSnapshotPath(input.snapshot, point.path).ok) continue;
    const key = JSON.stringify([point.path, point.note]);
    const entry = pairs.get(key) ?? { point, origins: [] };
    if (!entry.origins.some(origin => JSON.stringify(origin) === JSON.stringify(group.origin))) entry.origins.push(group.origin);
    pairs.set(key, entry);
  }
  if (pairs.size === 0) return undefined;
  return { key: 'support:starting-points', text: [
    '## Recorded starting points', '',
    'Optional navigation help. Notes are producer judgments, not verified current facts, completion evidence or read/write authority. Inspect the current source and explore further when a hint is stale or unhelpful. Origin boundaries describe where pointers were recorded; they do not establish unchanged files.',
    input.snapshot ? `Paths are relative to the pinned candidate ${input.snapshot.commit} (tree ${input.snapshot.tree}); use snapshot tools.`
      : 'Paths are relative to the project root.', '',
    ...[...pairs.values()].map(({ point, origins }) => `- ${JSON.stringify({ path: input.snapshot ? point.path : projectPath(input.projectRoot, point.path), note: point.note, origins })}`),
  ].join('\n') };
}

/**
 * Known command declarations rendered as information, without acquiring
 * effective configuration. The gate runs them; nothing here asks a reader to
 * run or open anything. Paths are project-relative unless they lie outside
 * the project root.
 */
export function declaredCheckInputs(input: {
  readonly projectRoot: string;
  readonly checks: readonly unknown[];
  readonly paths?: readonly string[];
  readonly snapshot?: boolean;
}): string {
  const path = (value: string) => projectPath(input.projectRoot, value);
  const word = (value: string) => /^[\w@%+=:,./-]+$/u.test(value) ? value : JSON.stringify(value);
  const lines: string[] = [];
  let located = (input.paths ?? []).length > 0;
  for (const check of input.checks) {
    const declared = check as { id?: string; executor?: { kind?: string; commands?: readonly { cmd: string; args?: readonly string[]; cwd?: string; env?: Record<string, string>; parser?: string }[] } };
    if (declared.executor?.kind !== 'command') continue;
    for (const command of declared.executor.commands ?? []) {
      const cwd = path(command.cwd ?? '.');
      if (cwd !== '.') located = true;
      lines.push(`- ${declared.id ?? 'Declared check'}${command.parser ? ` (${command.parser})` : ''}: \`${[command.cmd, ...command.args ?? []].map(word).join(' ')}\``
        + `${cwd === '.' ? '' : ` in \`${cwd}\``}${command.env ? `; environment names: ${Object.keys(command.env).sort().join(', ')}` : ''}`);
    }
  }
  const configured = (input.paths ?? []).map(value => `\`${path(value)}\``);
  if (lines.length === 0 && configured.length === 0) return '';
  const listed = configured.length < 2 ? configured.join('') : `${configured.slice(0, -1).join(', ')} and ${configured.at(-1)}`;
  return ['## Declared project checks', '',
    lines.length === 0 ? 'The gate runs the project\'s checks; nothing here is a command for you to run.' : 'The gate runs these; nothing here is a command for you to run.',
    ...lines.length === 0 ? [] : ['', ...lines],
    ...configured.length === 0 ? [] : ['', `${lines.length === 0 ? 'The checks are' : 'They are'} configured in ${listed}. Open one only when a concern, or a focused command you need, depends on it.`],
    ...located ? ['', input.snapshot ? 'Paths are project-relative, in the audited candidate.' : 'Paths are relative to the project root.'] : [], ''].join('\n');
}

/** Module paths already known to the caller; API references describe observed directories only. */
export function moduleInputPointers(input: {
  readonly projectRoot: string;
  readonly modules: readonly { readonly module: string; readonly directory: string; readonly apiPaths: readonly string[] }[];
  readonly testAreas: readonly TestArea[];
}): string {
  const lines: string[] = [];
  for (const module of input.modules) {
    lines.push(`- \`${module.module}\`: README \`${join(input.projectRoot, module.directory, 'README.md')}\`; declaration \`${join(input.projectRoot, module.directory, 'module.ramify')}\`; source \`${join(input.projectRoot, module.directory, 'src')}/\`.`);
    for (const area of input.testAreas.filter(area => area.module === module.module)) lines.push(`  - Test area: \`${join(input.projectRoot, area.area)}/\`.`);
    for (const path of module.apiPaths) lines.push(`  - Observed API view: \`${join(input.projectRoot, path)}/\`. Use supplied revision and coverage as authoritative delivery evidence; do not search for metadata already supplied. Inspect metadata only for a specific unanswered evidence question. Absence under coverage limits is not proof.`);
  }
  return lines.length === 0 ? '' : ['## Module and test pointers', '', ...lines, ''].join('\n');
}
