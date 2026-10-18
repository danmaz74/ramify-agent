import { z } from 'zod';
import type { JsonSchema, ToolDefinition, ToolResult } from '../../subs/agent/src/interfaces/port.js';

/** A caller-owned, exact reference that Pi may inspect during assessment. */
export interface AssessmentEvidenceRef {
  readonly ref: string;
  readonly description: string;
}

export interface AssessmentEvidenceSource {
  /** The complete reference catalog; entries are paged by the tool. */
  list(): readonly AssessmentEvidenceRef[] | Promise<readonly AssessmentEvidenceRef[]>;
  /** Only a reference from list() reaches this callback. No path is resolved here. */
  read(ref: string): unknown | Promise<unknown>;
}

const inputSchema = z.object({
  ref: z.string().min(1).max(500).optional(),
  offset: z.int().nonnegative().default(0),
  limit: z.int().positive().max(12_000).optional(),
}).strict();

/** Bounded read-only access to retained assessment facts selected by the owner. */
export function createAssessmentEvidenceTool(source: AssessmentEvidenceSource): ToolDefinition {
  return {
    name: 'assessment_evidence',
    description: 'List available assessment evidence refs, or read one exact ref in bounded chunks. Use offset from nextOffset to continue. This does not read arbitrary project paths.',
    inputSchema: z.toJSONSchema(inputSchema) as JsonSchema,
    mutating: false,
    action: () => ({ kind: 'other' }),
    async execute(value): Promise<ToolResult> {
      const parsed = inputSchema.safeParse(value);
      if (!parsed.success) return { isError: true, text: `Invalid assessment evidence request: ${parsed.error.issues.map(issue => issue.message).join('; ')}` };
      try {
        const input = parsed.data;
        const entries = await source.list();
        if (new Set(entries.map(entry => entry.ref)).size !== entries.length || entries.some(entry => entry.ref === '' || entry.ref.length > 500))
          return { isError: true, text: 'Assessment evidence catalog has duplicate or invalid references' };
        if (input.ref === undefined) {
          const size = Math.min(input.limit ?? 50, 100);
          const items = entries.slice(input.offset, input.offset + size).map(entry => ({ ref: entry.ref, description: entry.description.slice(0, 500) }));
          return { text: JSON.stringify({ kind: 'list', total: entries.length, offset: input.offset, entries: items,
            nextOffset: input.offset + items.length < entries.length ? input.offset + items.length : null }) };
        }
        if (!entries.some(entry => entry.ref === input.ref)) return { isError: true, text: `Unknown assessment evidence ref ${input.ref}` };
        const data = await source.read(input.ref);
        const content = typeof data === 'string' ? data : JSON.stringify(data);
        if (content === undefined) return { isError: true, text: `Assessment evidence ${input.ref} is unavailable` };
        if (input.offset > content.length) return { isError: true, text: `Offset ${input.offset} exceeds ${content.length} characters of ${input.ref}` };
        const size = input.limit ?? 8000;
        const chunk = content.slice(input.offset, input.offset + size);
        return { text: JSON.stringify({ kind: 'content', ref: input.ref, offset: input.offset, totalChars: content.length,
          content: chunk, nextOffset: input.offset + chunk.length < content.length ? input.offset + chunk.length : null }) };
      } catch (error) {
        return { isError: true, text: `Assessment evidence unavailable: ${error instanceof Error ? error.message : String(error)}` };
      }
    },
  };
}
