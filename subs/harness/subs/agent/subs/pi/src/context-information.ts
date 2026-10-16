import type { AgentSession } from '@earendil-works/pi-coding-agent';

/** Pi reports current occupancy, not the size of the next serialized request. */
export function contextInformation(usage: ReturnType<AgentSession['getContextUsage']>, reserveTokens: number): string {
  const window = usage?.contextWindow;
  const tokens = usage?.tokens;
  const knownWindow = typeof window === 'number' && Number.isFinite(window) && window > 0;
  const knownTokens = typeof tokens === 'number' && Number.isFinite(tokens) && tokens >= 0;
  const remaining = knownWindow && knownTokens ? Math.max(0, Math.floor(window - reserveTokens - tokens)) : null;
  return `You have ${remaining ?? 'unknown'} tokens left in this context window.`;
}
