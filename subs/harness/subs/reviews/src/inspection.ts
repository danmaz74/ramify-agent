import { z } from 'zod';
import type { JsonSchema, ToolDefinition } from '../../agent/src/interfaces/port.js';
import { inspectCandidate } from '../../evidence/src/candidate-inspection.js';

const schema = z.object({ command: z.string().min(1), timeoutMs: z.int().positive().max(600_000).optional() }).strict();
export const candidateShellDeclaration = {
  name: 'shell',
  description: 'Inspect the pinned candidate with ordinary shell tools, including compressed or large evidence. Each call starts in a fresh detached candidate checkout at the project root. Do not edit source. Use filters to keep output relevant; files created in a call are discarded after it. This is ordinary instructed access, not a sandbox.',
  inputSchema: z.toJSONSchema(schema) as JsonSchema,
  mutating: false,
};

/** Shared ordinary inspection equipment for assisted and automated review. */
export function candidateShell(projectRoot: string, candidate: string): ToolDefinition {
  return { ...candidateShellDeclaration, action: () => ({ kind: 'other' }), async execute(value, signal) {
    const parsed = schema.safeParse(value);
    if (!parsed.success) return { isError: true, text: parsed.error.message };
    try {
      const result = await inspectCandidate({ projectRoot, candidate, ...parsed.data, signal });
      return { text: `Candidate ${candidate}. Outcome: ${JSON.stringify(result.outcome)}${result.output.truncated ? '; output truncated: narrow the command' : ''}\n${result.stdout}${result.stderr}`,
        isError: result.outcome.kind !== 'completed' || result.outcome.exitCode !== 0 };
    } catch (error) { return { isError: true, text: `Candidate inspection unavailable: ${error instanceof Error ? error.message : String(error)}` }; }
  } };
}
