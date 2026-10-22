import type { z } from 'zod';
import { checkFindingDetailSchema, checkFindingListResponseSchema, checkFindingWireLimits } from '../subs/harness/src/interfaces/protocol/check-findings.js';
import { errorResponseSchema } from '../subs/harness/src/interfaces/protocol/errors.js';
import { protocolPaths } from '../subs/harness/src/interfaces/protocol/paths.js';
import { workItemResponseSchema } from '../subs/harness/src/interfaces/protocol/runs.js';
import type { InspectOptions } from './cli.js';

export interface InspectClientPorts { readonly fetch?: typeof fetch }
export interface InspectResult { readonly exitStatus: number; readonly stdout: string; readonly stderr: string }

class InspectFailure extends Error {
  constructor(readonly code: string, message: string) { super(message); }
}

/** Read one accepted entity through the same public contract as the web client. */
export async function runInspectCommand(options: InspectOptions, ports: InspectClientPorts = {}): Promise<InspectResult> {
  try {
    const url = new URL(options.server);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash || url.pathname !== '/') {
      throw new InspectFailure('invalid-request', '--server must be an HTTP(S) origin');
    }
    const request = async <T>(path: string, schema: z.ZodType<T>): Promise<T> => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 30_000);
      try {
        const response = await (ports.fetch ?? fetch)(`${url.origin}${path}`, { signal: controller.signal });
        const data: unknown = await response.json();
        if (!response.ok) {
          const parsed = errorResponseSchema.safeParse(data);
          throw new InspectFailure(parsed.success ? parsed.data.error.code : 'protocol', parsed.success ? parsed.data.error.message : `HTTP ${response.status}`);
        }
        const parsed = schema.safeParse(data);
        if (!parsed.success) throw new InspectFailure('invalid-response', 'The harness response did not match the public detail contract.');
        return parsed.data;
      } catch (error) {
        if (error instanceof InspectFailure) throw error;
        throw new InspectFailure(controller.signal.aborted ? 'timeout' : 'transport', error instanceof Error ? error.message : String(error));
      } finally { clearTimeout(timer); }
    };
    const { planId, runId, selection } = options;
    let detail: unknown;
    if (selection.kind === 'work-item') {
      detail = await request(protocolPaths.runWorkItem(planId, runId, selection.id), workItemResponseSchema);
    } else if (selection.kind === 'finding') {
      detail = await request(protocolPaths.runCheckFinding(planId, runId, selection.id), checkFindingDetailSchema);
    } else {
      if (selection.id.startsWith('draft:')) throw new InspectFailure('invalid-request',
        `${selection.id} is a submission-local key; --deviation requires an accepted plan deviation ID.`);
      let after: string | undefined;
      let version: number | undefined;
      const visited = new Set<string>();
      let findingId: string | undefined;
      do {
        const page = await request(protocolPaths.runCheckFindings(planId, runId,
          { select: 'all', order: 'id', limit: checkFindingWireLimits.maxLimit, after, version }), checkFindingListResponseSchema);
        version ??= page.version;
        findingId = page.items.find(item => item.planDeviation?.id === selection.id)?.id;
        if (findingId !== undefined || page.next === null) break;
        if (visited.has(page.next)) throw new InspectFailure('invalid-response', 'The finding list repeated a cursor.');
        visited.add(page.next);
        after = page.next;
      } while (true);
      if (findingId === undefined) throw new InspectFailure('not-found',
        `No accepted plan deviation ${selection.id} in run ${runId}; inspect the run's check findings for valid references.`);
      const finding = await request(protocolPaths.runCheckFinding(planId, runId, findingId, version), checkFindingDetailSchema);
      if (finding.summary.planDeviation?.id !== selection.id) throw new InspectFailure('stale-version', 'The plan deviation changed while its detail was read.');
      detail = { deviation: finding.summary.planDeviation, finding };
    }
    return { exitStatus: 0, stdout: `${JSON.stringify(detail, null, options.json ? 0 : 2)}\n`, stderr: '' };
  } catch (error) {
    const code = error instanceof InspectFailure ? error.code : 'invalid-request';
    const message = error instanceof Error ? error.message : String(error);
    return { exitStatus: 2, stdout: '', stderr: options.json ? `${JSON.stringify({ error: { code, message } })}\n` : `${code}: ${message}\n` };
  }
}
