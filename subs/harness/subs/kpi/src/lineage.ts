import type { LineageMetric, Role } from '../../../src/interfaces/protocol/runs.js';
import { replaceReasonSchema, type ContinueReason, type DegradeRelation, type ReplaceRelation } from '../../task-execution/src/records.js';

export const lineagePolicyVersion: 'lineage/2' = 'lineage/2';
export type StartKind = 'fresh' | 'continue' | 'fork';
export type SegmentUsage =
  | { readonly input: number; readonly cacheRead: number; readonly cacheWrite: number; readonly output: number }
  | { readonly unavailable: string };

/** Recorded starts govern classification, not requested starts. Unknown starts retain requested groups. */
export interface SegmentFacts {
  readonly invocation: string;
  readonly session: string;
  readonly role: Role;
  readonly ended: boolean;
  readonly requested: StartKind;
  readonly actual: StartKind | null;
  readonly unknown: string | null;
  readonly degraded: DegradeRelation | null;
  readonly continues: ContinueReason | null;
  readonly generation: number | null;
  readonly source?: { readonly session: string; readonly role: Role } | null | undefined;
  readonly previous: string | null;
  readonly startContext: number | { readonly unavailable: string };
  readonly usage: SegmentUsage;
}

export interface LineageInputs {
  readonly segments: readonly SegmentFacts[];
  readonly sessions: ReadonlyArray<{ readonly id: string; readonly replaces: ReplaceRelation | null }>;
  readonly generations: readonly number[];
}

type Body = Omit<LineageMetric, 'policyVersion' | 'measurementPolicy'>;
function measurement(body: Partial<Body> & Pick<Body, 'id' | 'unit' | 'state'>): LineageMetric {
  return { policyVersion: lineagePolicyVersion, measurementPolicy: null, value: null, numerator: null,
    denominator: null, subtotal: null, coverage: null, evidence: [], note: null, ...body };
}
const startOf = (segment: SegmentFacts): StartKind => segment.actual ?? segment.requested;
type Figure = number | { readonly unavailable: string };
const measures: ReadonlyArray<readonly [string, (segment: SegmentFacts) => Figure]> = [
  ['start-context', segment => segment.startContext],
  ...([['input', 'input'], ['cache-read', 'cacheRead'], ['cache-write', 'cacheWrite'], ['output', 'output']] as const).map(([name, key]) => [
    name, (segment: SegmentFacts): Figure => ('unavailable' in segment.usage ? { unavailable: segment.usage.unavailable } : segment.usage[key]),
  ] as const),
];
function figureOf(segment: SegmentFacts, read: (segment: SegmentFacts) => Figure): Figure {
  if (segment.actual === null) return { unavailable: `its start is unknown: ${segment.unknown ?? 'it was not recorded'}` };
  return read(segment);
}
function mean(id: string, unit: string, group: readonly SegmentFacts[], read: (segment: SegmentFacts) => Figure, empty: string): LineageMetric {
  if (group.length === 0) return measurement({ id, unit, state: 'not-applicable', coverage: { covered: 0, total: 0 }, note: empty });
  let sum = 0;
  const known: string[] = [];
  const missing: string[] = [];
  for (const segment of group) {
    const figure = figureOf(segment, read);
    if (typeof figure === 'number') {
      sum += figure;
      known.push(`${segment.invocation} (${segment.session}): ${figure}`);
    } else missing.push(`${segment.invocation} (${segment.session}): ${figure.unavailable}`);
  }
  const coverage = { covered: known.length, total: group.length };
  if (missing.length > 0) {
    return measurement({ id, unit, state: 'unavailable', subtotal: known.length > 0 ? sum : null, coverage, evidence: [...missing, ...known],
      note: 'A segment lacks this input, so the mean is unknown; the known subtotal is shown' });
  }
  return measurement({ id, unit, state: 'measured', value: sum / group.length, numerator: sum, denominator: group.length, coverage, evidence: known });
}
function profile(prefix: string, group: readonly SegmentFacts[], empty: string): LineageMetric[] {
  return measures.map(([name, read]) => mean(`${prefix}.${name}`, 'tokens per segment', group, read, empty));
}
const ended = (inputs: LineageInputs) => inputs.segments.filter(segment => segment.ended);
const globalRoles: readonly Role[] = ['initial-architect', 'global-fork'];
const localFork = (segment: SegmentFacts): boolean =>
  segment.requested === 'fork' && segment.source != null && !globalRoles.includes(segment.source.role);
function forkCost(inputs: LineageInputs): LineageMetric[] {
  const segments = ended(inputs);
  const byGeneration = inputs.generations.flatMap(generation => profile(
    `fork.generation-${generation}`, segments.filter(segment => startOf(segment) === 'fork' && segment.generation === generation),
    `No fork of generation ${generation} ended`,
  ));
  const local = profile('fork.local', segments.filter(segment => startOf(segment) === 'fork' && localFork(segment)), 'No fork of a local session ended');
  const fresh = profile('fresh-fork', segments.filter(segment => segment.role === 'global-fork' && startOf(segment) === 'fresh'), 'No global fork started fresh');
  return [...byGeneration, ...local, ...fresh];
}
function continuationGrowth(inputs: LineageInputs): LineageMetric {
  const id = 'continuation-growth';
  const unit = 'tokens per continuation';
  const byInvocation = new Map(inputs.segments.map(segment => [segment.invocation, segment]));
  const group = ended(inputs).filter(segment => startOf(segment) === 'continue');
  return mean(id, unit, group, segment => {
    const previous = segment.previous === null ? undefined : byInvocation.get(segment.previous);
    if (previous === undefined) return { unavailable: 'it has no previous segment' };
    if (typeof segment.startContext !== 'number') return segment.startContext;
    if (typeof previous.startContext !== 'number') return { unavailable: `its previous segment ${previous.invocation}: ${previous.startContext.unavailable}` };
    return segment.startContext - previous.startContext;
  }, 'No continued segment ended');
}
function repairCost(inputs: LineageInputs): LineageMetric[] {
  const segments = ended(inputs);
  return [
    ...profile('repair', segments.filter(segment => startOf(segment) === 'continue' && segment.continues === 'repair'), 'No segment continued for a repair ended'),
    ...profile('fresh-engineer', segments.filter(segment => segment.role === 'engineer' && startOf(segment) === 'fresh'), 'No engineer segment started fresh'),
  ];
}
function degradedStarts(id: string, inputs: LineageInputs, kinds: readonly StartKind[]): LineageMetric {
  const unit = 'degraded starts per requested start';
  const requests = ended(inputs).filter(segment => kinds.includes(segment.requested));
  if (requests.length === 0) return measurement({ id, unit, state: 'not-applicable', coverage: { covered: 0, total: 0 }, note: `No ${kinds.join(' or ')} was requested` });
  const known = requests.filter(segment => segment.actual !== null);
  const degraded = known.filter(segment => segment.degraded !== null);
  const reasons = new Map<string, string[]>();
  for (const segment of degraded) {
    const relation = segment.degraded!;
    const key = `${relation.requested} made ${relation.actual}: ${relation.reason ?? 'the executor gave no reason'}`;
    reasons.set(key, [...(reasons.get(key) ?? []), segment.invocation]);
  }
  const evidence = [
    ...[...reasons].map(([reason, list]) => `${reason} (${list.join(', ')})`),
    ...requests.filter(segment => segment.actual === null).map(segment => `${segment.invocation}: its start is unknown: ${segment.unknown ?? 'it was not recorded'}`),
  ];
  const coverage = { covered: known.length, total: requests.length };
  if (known.length === 0) return measurement({ id, unit, state: 'unavailable', coverage, evidence, note: 'No requested start is known to have been made or degraded' });
  if (known.length < requests.length) {
    return measurement({ id, unit, state: 'partial', numerator: degraded.length, denominator: known.length, coverage, evidence,
      note: `Counted over ${known.length} of ${requests.length} requested starts whose start is known` });
  }
  return measurement({ id, unit, state: 'measured', value: degraded.length / known.length, numerator: degraded.length, denominator: known.length, coverage, evidence });
}
function replacements(inputs: LineageInputs): LineageMetric[] {
  return replaceReasonSchema.options.map(reason => {
    const id = `replacements.${reason}`;
    const unit = 'replacements per session';
    const replacing = inputs.sessions.filter(session => session.replaces?.reason === reason);
    const evidence = replacing.map(session => `${session.id} in place of ${session.replaces!.session}`);
    const total = inputs.sessions.length;
    if (total === 0) return measurement({ id, unit, state: 'not-applicable', denominator: 0, note: 'No session was opened' });
    return measurement({ id, unit, state: 'measured', value: replacing.length / total, numerator: replacing.length, denominator: total, coverage: { covered: total, total }, evidence });
  });
}
function served(id: string, requested: readonly SegmentFacts[], source: string, named: boolean): LineageMetric {
  const unit = 'forks';
  const made = requested.filter(segment => segment.actual === 'fork');
  const unknown = requested.filter(segment => segment.actual === null);
  const evidence = [
    ...made.map(segment => `${segment.session} (${segment.invocation})${named && segment.source != null ? ` from ${segment.source.session}` : ''}`),
    ...requested.filter(segment => segment.actual !== null && segment.actual !== 'fork').map(segment => `${segment.session} (${segment.invocation}) asked for a fork and started ${segment.actual}`),
    ...unknown.map(segment => `${segment.session} (${segment.invocation}): its start is unknown: ${segment.unknown ?? 'it was not recorded'}`),
  ];
  const coverage = { covered: requested.length - unknown.length, total: requested.length };
  if (unknown.length > 0) {
    return measurement({ id, unit, state: 'partial', numerator: made.length, coverage, evidence, note: `Counted over ${coverage.covered} of ${coverage.total} forks of ${source} whose start is known` });
  }
  return measurement({ id, unit, state: 'measured', value: made.length, numerator: made.length, coverage, evidence });
}
function forksServed(inputs: LineageInputs): LineageMetric[] {
  const segments = ended(inputs);
  return [
    ...inputs.generations.map(generation => served(`forks-served.generation-${generation}`,
      segments.filter(segment => segment.requested === 'fork' && segment.generation === generation), 'this generation', false)),
    served('forks-served.local', segments.filter(localFork), 'a local session', true),
  ];
}

/** Every lineage measurement in baseline glossary order. */
export function lineageMetrics(inputs: LineageInputs): LineageMetric[] {
  return [...forkCost(inputs), continuationGrowth(inputs), ...repairCost(inputs),
    degradedStarts('degraded-starts', inputs, ['continue', 'fork']),
    degradedStarts('degraded-starts.continue', inputs, ['continue']), degradedStarts('degraded-starts.fork', inputs, ['fork']),
    ...replacements(inputs), ...forksServed(inputs)];
}
