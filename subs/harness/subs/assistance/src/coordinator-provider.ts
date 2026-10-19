import { createCodexProvider } from '../../agent/subs/codex/src/provider.js';
import { CodexProviderError, type CodexEquipment, type CodexProvider, type CodexProviderOptions, type CodexReadiness, type CodexThreadSession, type CodexThreadSettings } from '../../agent/subs/codex/src/interfaces/provider.js';

/** Prepared host inputs. This consumer does not register work or own acceptance. */
export interface CoordinatorProviderPreparation {
  readonly launch: CodexProviderOptions;
  readonly thread: CodexThreadSettings;
  readonly workerModel: string;
  readonly requiredMcp?: { readonly server: string; readonly tools: readonly string[] };
  readonly resumeThreadId?: string;
  /** The host durably records verified thread identity before receiving input authority. */
  readonly retain: (session: CodexThreadSession, readiness: CodexReadiness) => Promise<void>;
}
export interface PreparedCoordinatorProvider {
  readonly provider: CodexProvider;
  readonly session: CodexThreadSession;
  readonly readiness: CodexReadiness;
  readonly equipment: CodexEquipment;
}

/**
 * An actual assistance consumer of the agent contract. Establish equipment,
 * persistent conversation and retained identity before exposing turn input.
 * Failure settles this dedicated provider, preserving the original error.
 */
export async function prepareCoordinatorProvider(input: CoordinatorProviderPreparation, provider: CodexProvider = createCodexProvider(input.launch)): Promise<PreparedCoordinatorProvider> {
  try {
    const readiness = await provider.initialize();
    const equipment = await provider.inspectEquipment(input.thread.cwd);
    if (!equipment.features.some(feature => feature.name === 'multi_agent' && feature.enabled)) throw new CodexProviderError('unavailable', 'Native multi-agent equipment is disabled or unavailable');
    const coordinator = equipment.models.find(model => model.id === input.thread.model);
    if (coordinator === undefined || coordinator.nativeWorkers !== 'v2') throw new CodexProviderError('unavailable', `Coordinator model ${input.thread.model} does not declare native v2 workers`);
    if (!equipment.models.some(model => model.id === input.workerModel)) throw new CodexProviderError('unavailable', `Worker model ${input.workerModel} is not in the provider catalog`);
    const required = input.requiredMcp;
    if (required !== undefined) {
      const server = equipment.mcp.find(server => server.name === required.server);
      const missing = required.tools.filter(tool => !server?.tools.includes(tool));
      if (server === undefined || server.error !== null || missing.length > 0) throw new CodexProviderError('unavailable', `Required MCP equipment ${required.server} is unavailable: ${server?.error ?? missing.join(', ')}`);
    }
    const session = input.resumeThreadId === undefined ? await provider.startThread(input.thread) : await provider.resumeThread(input.resumeThreadId, input.thread);
    await input.retain(session, readiness);
    // Query the loaded thread as well: project-local equipment can differ.
    const loadedEquipment = await provider.inspectEquipment(input.thread.cwd, session.thread.id);
    if (!loadedEquipment.features.some(feature => feature.name === 'multi_agent' && feature.enabled)) throw new CodexProviderError('unavailable', 'Loaded thread has no enabled native multi-agent equipment');
    if (required !== undefined) {
      const server = loadedEquipment.mcp.find(server => server.name === required.server);
      if (server === undefined || server.error !== null || required.tools.some(tool => !server.tools.includes(tool))) throw new CodexProviderError('unavailable', 'Loaded thread is missing required MCP tools');
    }
    return { provider, session, readiness, equipment: loadedEquipment };
  } catch (error) {
    const settlement = await provider.stop();
    if (!settlement.confirmed) throw new AggregateError([error], `Coordinator preparation failed and owned execution is not confirmed settled: ${settlement.reason}`);
    throw error;
  }
}
