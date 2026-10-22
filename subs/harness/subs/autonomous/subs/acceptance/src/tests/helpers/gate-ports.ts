import type { GateHost } from '../../committing-gate.js';
import type { RunPolicy } from '../../../../../src/run/records.js';
import type { RunLog } from '../../../../../src/run/log.js';
import type { Mutex } from '../../../../../../../src/jobs/mutex.js';
import type { WriterOwnership } from '../../../../../../task-execution/src/writer.js';
import type { ArchitectIndex } from '../../../../../../evidence/src/views.js';
export interface GateFixture { readonly jobId: string; readonly planId: string; readonly directory: string; readonly base: string; readonly policy: RunPolicy; readonly log: RunLog; readonly mutex: Mutex; readonly writer: WriterOwnership; readonly index: ArchitectIndex | null; }
type BoundKeys = 'evidenceApplicable' | 'awaitGateAdmission' | 'recoverGate' | 'retryGateDelay' | 'write' | 'harnessFiles' | 'auditDefinition' | 'refreshIndex' | 'ignoring';
export type FixtureGateHost = { [K in keyof GateHost]: K extends BoundKeys ? NonNullable<GateHost[K]> extends (...args: infer Args) => infer Result ? (run: GateFixture, ...args: Args) => Result : GateHost[K] : GateHost[K] };
export function gateFixturePorts(run: GateFixture | undefined, original: Partial<FixtureGateHost>): GateHost {
 const bound = { ...original } as unknown as GateHost;
 for (const key of ['evidenceApplicable', 'awaitGateAdmission', 'recoverGate', 'retryGateDelay', 'write', 'harnessFiles', 'auditDefinition', 'refreshIndex', 'ignoring'] as const) {
  const callback = original[key]; if (callback !== undefined) Reflect.set(bound, key, (...args: unknown[]) => Reflect.apply(callback, undefined, [run, ...args]));
 }
 return { ...bound,
  identity: { jobId: run?.jobId ?? 'fixture', planId: run?.planId ?? 'fixture', directory: run?.directory ?? '/fixture', base: run?.base ?? '' },
  decideFinding: () => { throw new Error('This gate fixture scripts no finding decision'); },
  observe: () => { const lines = structuredClone(run?.log.ledger.replay() ?? []); return { history: { lines, events: lines.map(line => line.transaction.event) }, version: run?.log.version ?? 0, terminal: run?.log.terminal, policy: run?.policy as RunPolicy, index: structuredClone(run?.index ?? null), pendingEffects: [] }; },
  publish: async decide => { const proposal = await decide(); if (proposal.transaction !== undefined) throw new Error('This gate fixture scripts no accepted publication'); return proposal.value; },
  effect: spec => {
   const transaction = (input: import('../../acceptance-journal.js').AcceptanceTransaction) => {
    if ('kind' in input) throw new Error('This gate fixture scripts no finding publication');
    return { ...input, event: run!.log.next(input.event) };
   };
   const intent = spec.intent;
   return run!.log.ledger.effect({ ...spec, intent: typeof intent === 'function' ? () => transaction(intent()) : transaction(intent), complete: result => transaction(spec.complete(result)) });
  },
  requireSettled: reason => run?.writer?.requireSettled(reason),
 };
}
