import { createHash } from 'node:crypto';
import { z } from 'zod';
import { canonicalJson } from '../jobs/commands.js';
import { sha256Schema } from '../interfaces/protocol/evidence.js';
import type { ContentStore } from '../transcripts/store.js';
import type { RunLog } from '../run/log.js';
import type { WriteScope } from './scope.js';
import { decodeOwnershipEvidenceAnswer, type OwnershipAnswer } from '../../subs/evidence/src/ownership-evidence.js';

const text = z.string().min(1);

/** A successful ownership observation retained by the run writer before admission. */
export const ownershipEvidenceRetainedSchema = z.object({
  assignment: sha256Schema,
  sourceAuthority: sha256Schema.optional(),
  hash: sha256Schema,
  bytes: z.int().nonnegative(),
  provider: text,
  ramifyVersion: text,
  root: text,
  inputId: text,
}).strict();
export type OwnershipEvidenceReference = z.infer<typeof ownershipEvidenceRetainedSchema>;

/** The identity fields common to supported normalized ownership answers. */
export interface RetainableOwnershipAnswer {
  readonly schemaVersion: string;
  readonly ramifyVersion: string;
  readonly root: string;
  readonly inputId: string;
  readonly scope: unknown;
  readonly paths: readonly { readonly path: string }[];
}

const storedReferenceSchema = z.object({ hash: sha256Schema, bytes: z.int().nonnegative() }).strict();
const envelopeSchema = z.object({
  schema: z.literal('ramify-agent.ownership-evidence/1'), assignment: sha256Schema, sourceAuthority: sha256Schema.optional(),
  table: storedReferenceSchema, schemaVersion: text, ramifyVersion: text, root: text, inputId: text,
  paths: z.array(z.unknown()), decisions: z.array(z.object({ path: text, allowed: z.boolean() }).strict()),
}).strict();
const tableSchema = z.object({ schema: z.literal('ramify-agent.ownership-table/1'), schemaVersion: text,
  ramifyVersion: text, root: text, scope: z.unknown() }).strict();

/** Missing or changed harness authority is never a provider acquisition failure. */
export class OwnershipAuthorityError extends Error {
  constructor(message: string, readonly kind: 'missing' | 'corrupt' = 'corrupt') {
    super(message); this.name = 'OwnershipAuthorityError';
  }
}

/** Content identity includes the complete assignment, including guarded authorizations. */
export function assignmentAuthorityIdentity(assignment: unknown): string {
  return digest(canonicalJson(assignment));
}

function digest(content: string): string {
  return createHash('sha256').update(content, 'utf8').digest('hex');
}

export interface OwnershipAuthorityInputs<A extends RetainableOwnershipAnswer> {
  readonly assignment: string;
  readonly sourceAuthority?: string;
  readonly root: string;
  readonly store: ContentStore;
  /** Only committed ledger references, in ledger order. */
  readonly references: () => readonly OwnershipEvidenceReference[];
  /** Runtime validation of the normalized answer, including provider topology. */
  readonly decode: (value: unknown, root: string) => A;
  /** Must settle the durable writer transaction; refusal or unsettled writes throw. */
  readonly append: (reference: OwnershipEvidenceReference) => Promise<void>;
}

export interface RetainedOwnership<A> {
  readonly latest: A | null;
  readonly reference: OwnershipEvidenceReference | null;
  /** Last successful answer for each path; unrelated queries cannot erase a refusal. */
  readonly paths: ReadonlyMap<string, boolean>;
}

/** Durable successful placement evidence, separate from assignment authority and analysis. */
export class OwnershipAuthority<A extends RetainableOwnershipAnswer> {
  constructor(private readonly inputs: OwnershipAuthorityInputs<A>) {}

  get assignment(): string { return this.inputs.assignment; }

  /** Diagnostic failure bytes have no authority; guard observations retain this pointer. */
  async retainFailure(failure: unknown): Promise<{ readonly hash: string; readonly bytes: number }> {
    const content = canonicalJson({ schema: 'ramify-agent.ownership-failure/1', assignment: this.inputs.assignment, root: this.inputs.root, failure });
    const stored = await this.inputs.store.put(content);
    if (await this.inputs.store.read(stored.hash) !== content) throw new OwnershipAuthorityError(`Ownership failure blob ${stored.hash} is changed`);
    return stored;
  }

  async read(): Promise<RetainedOwnership<A>> {
    const paths = new Map<string, boolean>();
    let latest: A | null = null;
    let reference: OwnershipEvidenceReference | null = null;
    for (const raw of this.inputs.references()) {
      const parsed = ownershipEvidenceRetainedSchema.safeParse(raw);
      if (!parsed.success) throw new OwnershipAuthorityError('Recorded ownership ledger reference is invalid');
      const ref = parsed.data;
      const source = this.inputs.sourceAuthority ?? this.inputs.assignment;
      if (ref.assignment !== this.inputs.assignment && ref.assignment !== source && ref.sourceAuthority !== source) continue;
      if (ref.root !== this.inputs.root) throw new OwnershipAuthorityError('Recorded ownership project identity differs from the assignment');
      const content = await this.inputs.store.read(ref.hash);
      if (content === null) throw new OwnershipAuthorityError(`Recorded ownership evidence ${ref.hash} is missing`, 'missing');
      if (Buffer.byteLength(content, 'utf8') !== ref.bytes || digest(content) !== ref.hash) throw new OwnershipAuthorityError(`Recorded ownership evidence ${ref.hash} is changed`);
      let answer: A;
      let envelope: z.infer<typeof envelopeSchema>;
      try {
        envelope = envelopeSchema.parse(JSON.parse(content));
          const tableContent = await this.inputs.store.read(envelope.table.hash);
          if (tableContent === null) throw new OwnershipAuthorityError(`Recorded ownership table ${envelope.table.hash} is missing`, 'missing');
          if (Buffer.byteLength(tableContent, 'utf8') !== envelope.table.bytes || digest(tableContent) !== envelope.table.hash) throw new OwnershipAuthorityError(`Recorded ownership table ${envelope.table.hash} is changed`);
          const table = tableSchema.parse(JSON.parse(tableContent));
          if (table.schemaVersion !== envelope.schemaVersion || table.ramifyVersion !== envelope.ramifyVersion || table.root !== envelope.root) throw new OwnershipAuthorityError('Recorded ownership table identity differs from its evidence manifest');
          answer = this.inputs.decode({ schemaVersion: table.schemaVersion, ramifyVersion: table.ramifyVersion, root: table.root,
            inputId: envelope.inputId, scope: table.scope, paths: envelope.paths }, this.inputs.root);
      } catch (error) {
        if (error instanceof OwnershipAuthorityError) throw error;
        throw new OwnershipAuthorityError(`Recorded ownership evidence ${ref.hash} is invalid: ${String(error)}`);
      }
      if (envelope.assignment !== ref.assignment || envelope.sourceAuthority !== ref.sourceAuthority || answer.schemaVersion !== ref.provider || answer.ramifyVersion !== ref.ramifyVersion || answer.inputId !== ref.inputId || answer.root !== ref.root) {
        throw new OwnershipAuthorityError('Recorded ownership evidence identity differs from its ledger reference');
      }
      assertDecisions(answer, envelope.decisions);
      for (const decision of envelope.decisions) paths.set(decision.path, decision.allowed);
      latest = answer;
      reference = ref;
    }
    return { latest, reference, paths };
  }

  /** Blob precedes the reference; the returned decision can only follow settled retention. */
  async retain(answer: A, decisions: readonly { readonly path: string; readonly allowed: boolean }[]): Promise<OwnershipEvidenceReference> {
    const validated = this.inputs.decode(answer, this.inputs.root);
    assertDecisions(validated, decisions);
    const previous = await this.read();
    const tableContent = canonicalJson(tableSchema.parse({ schema: 'ramify-agent.ownership-table/1', schemaVersion: validated.schemaVersion,
      ramifyVersion: validated.ramifyVersion, root: validated.root, scope: validated.scope }));
    const table = await this.inputs.store.put(tableContent);
    if (await this.inputs.store.read(table.hash) !== tableContent) throw new OwnershipAuthorityError(`Ownership table blob ${table.hash} is changed`);
    const content = canonicalJson(envelopeSchema.parse({ schema: 'ramify-agent.ownership-evidence/1', assignment: this.inputs.assignment,
      table, schemaVersion: validated.schemaVersion, ramifyVersion: validated.ramifyVersion, root: validated.root,
      inputId: validated.inputId, paths: validated.paths,
      ...(this.inputs.sourceAuthority === undefined ? {} : { sourceAuthority: this.inputs.sourceAuthority }),
      decisions: [...decisions].sort((a, b) => a.path.localeCompare(b.path)) }));
    const stored = await this.inputs.store.put(content);
    // put can find an existing blob. Authority must verify those bytes too.
    if (await this.inputs.store.read(stored.hash) !== content) throw new OwnershipAuthorityError(`Ownership evidence blob ${stored.hash} is changed`);
    const reference = ownershipEvidenceRetainedSchema.parse({ assignment: this.inputs.assignment, ...stored,
      ...(this.inputs.sourceAuthority === undefined ? {} : { sourceAuthority: this.inputs.sourceAuthority }),
      provider: validated.schemaVersion, ramifyVersion: validated.ramifyVersion, root: validated.root, inputId: validated.inputId });
    if (previous.reference?.hash !== reference.hash) await this.inputs.append(reference);
    return reference;
  }
}

/** Every run and standalone owner binds the same ledger and content-store behavior. */
export function ownershipAuthorityFor(assignment: { readonly scope: WriteScope }, run: { readonly log: RunLog; readonly store: ContentStore },
  append: (reference: OwnershipEvidenceReference) => Promise<void>): OwnershipAuthority<OwnershipAnswer> {
  const sourceAuthority = assignment.scope.resolved.sourceAuthority;
  if (sourceAuthority !== undefined && !run.log.ledger.replay().some(line => line.transaction.records.some(record =>
    record.body !== null && typeof record.body === 'object' && 'scope' in record.body && 'schema' in record.body
      && ['ramify-agent.iteration-assignment/1', 'ramify-agent.nonfunctional-repair-assignment/1'].includes(String(record.body.schema))
      && assignmentAuthorityIdentity(record.body) === sourceAuthority))) {
    throw new OwnershipAuthorityError(`Original assignment ${sourceAuthority} is missing from verified records`, 'missing');
  }
  return new OwnershipAuthority({ assignment: assignmentAuthorityIdentity(assignment), ...(sourceAuthority === undefined ? {} : { sourceAuthority }), root: assignment.scope.resolved.ownership.root,
    store: run.store, references: () => run.log.all('ownership-evidence-retained').map(event => event.data),
    decode: decodeOwnershipEvidenceAnswer, append });
}

function assertDecisions(answer: RetainableOwnershipAnswer, decisions: readonly { readonly path: string; readonly allowed: boolean }[]): void {
  const answered = new Set(answer.paths.map(path => path.path));
  const decided = new Set(decisions.map(path => path.path));
  if (answered.size !== answer.paths.length || decided.size !== decisions.length || answered.size !== decided.size || [...answered].some(path => !decided.has(path))) {
    throw new OwnershipAuthorityError('Recorded placement decisions do not exactly match answered ownership paths');
  }
}
