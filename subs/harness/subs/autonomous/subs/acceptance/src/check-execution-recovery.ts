import type { GateAttempt } from './checks/records.js';

export interface CheckExecutionObstruction { readonly diagnostic: string; readonly automatic: boolean }

/** A verdict alone has no execution classification; only structured producer evidence qualifies. */
export function checkExecutionObstruction(gate: GateAttempt): CheckExecutionObstruction | null {
  if (gate.verdict !== 'not-verified' || gate.commands.some(command => command.outcome === 'failed')) return null;
  const command = gate.commands.find(command => ['command-missing', 'runner-error', 'timeout'].includes(command.notVerified ?? ''));
  if (command) return { diagnostic: `Check ${command.kind} could not execute: ${command.notVerified}; ${command.runnerError?.message ?? command.stopped ?? ''}`,
    automatic: command.notVerified === 'timeout' };
  const provider = gate.provider?.result;
  if (typeof provider !== 'object' || provider === null) return null;
  const result = provider as { status?: unknown; error?: { code?: unknown; message?: unknown; retryable?: unknown }; summary?: { checks?: unknown } };
  if (result.status === 'failed' && typeof result.error?.code === 'string') {
    const code = result.error.code;
    if (['cancelled', 'discovery-failed', 'invalid-audit-request', 'unsupported', 'unsafe-with-linked-modules'].includes(code)) return null;
    if (code === 'setup-command-failed') return null;
    const eligible = ['timeout', 'test-lock-wait-exceeded', 'setup-command-timed-out', 'runner-error', 'command-missing', 'spawn-failed', 'ENOENT', 'EACCES', 'execution-failed', 'worktree-setup-failed'];
    if (!eligible.includes(code) && result.error.retryable !== true) return null;
    return { diagnostic: `Audit ${code}: ${typeof result.error.message === 'string' ? result.error.message : ''}`,
      automatic: result.error.retryable === true || code === 'timeout' || code === 'test-lock-wait-exceeded' };
  }
  if (result.status !== 'completed') return null;
  const commands = auditCheckFacts(provider, gate.provider?.checks);
  if (commands.some(hasAssertionFailure)) return null;
  for (const command of commands) {
    if (typeof command !== 'object' || command === null) continue;
    const record = command as { runnerError?: { kind?: unknown; message?: unknown }; termination?: { reason?: unknown }; error?: { code?: unknown; message?: unknown } };
    if (typeof record.error?.code === 'string' && ['timeout', 'test-lock-wait-exceeded', 'setup-command-timed-out'].includes(record.error.code)) return {
      diagnostic: `Audit ${record.error.code}: ${String(record.error.message ?? '')}`, automatic: record.error.code !== 'setup-command-timed-out' };
    if (typeof record.runnerError?.kind === 'string') return { diagnostic: `Audit runner ${record.runnerError.kind}: ${String(record.runnerError.message ?? '')}`,
      automatic: record.runnerError.kind === 'timeout' };
    if (record.termination?.reason === 'timeout' || record.termination?.reason === 'interrupted') return {
      diagnostic: `Audit runner ${record.termination.reason}`, automatic: record.termination.reason === 'timeout' };
  }
  return null;
}

/** Structured root and nested producer check facts; aggregate failure alone supplies no cause. */
export function auditCheckFacts(provider: unknown, published?: unknown): unknown[] {
  if (provider === null || typeof provider !== 'object') return [];
  const result = provider as { status?: unknown; summary?: { checks?: unknown }; projects?: readonly { result?: unknown }[] };
  const own = [published, result.summary?.checks].flatMap(checks => checks === null || typeof checks !== 'object' ? [] : Object.values(checks).flatMap((check: unknown) => {
    if (check === null || typeof check !== 'object') return [];
    const value = check as { commands?: Record<string, unknown> };
    return [check, ...Object.values(value.commands ?? {})];
  }));
  return [...(result.status === 'failed' ? [provider] : []), ...own, ...(result.projects ?? []).flatMap(project => auditCheckFacts(project.result))];
}

export function hasAssertionFailure(command: unknown): boolean {
  if (typeof command !== 'object' || command === null) return false;
  const value = command as Record<string, unknown>;
  if (['failedTests', 'failedScenarios', 'failedSuites'].some(key => Array.isArray(value[key]) && value[key].length > 0)) return true;
  const failedCount = (counts: unknown): boolean => {
    if (typeof counts !== 'object' || counts === null) return false;
    return Object.entries(counts).some(([key, number]) => key === 'failed' && typeof number === 'number' && number > 0 || typeof number === 'object' && failedCount(number));
  };
  if (failedCount(value.counts)) return true;
  return typeof value.exitCode === 'number' && value.exitCode !== 0 && !value.runnerError;
}
