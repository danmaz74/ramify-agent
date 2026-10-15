import type { RunPolicy } from '../run/records.js';

/** The policy version captured by every new production run. */
export const capabilityRunPolicyVersion = 'run-policy/8';

export function supportedCapabilityPolicy(version: string): boolean {
  return version === 'run-policy/7' || version === capabilityRunPolicyVersion;
}

export interface CapabilityLimits {
  readonly maxAssignments: number;
  readonly maxWorkUnits: number;
  readonly maxInvocations: number;
}

/** Preserve historical task limit fields at delegation. Counts no longer
 * decide whether assignments or work units may continue. */
export function captureCapabilityLimits(policy: RunPolicy): CapabilityLimits {
  if (!supportedCapabilityPolicy(policy.version) || policy.limits.maxIterationsPerCapabilityTask === undefined) {
    throw new Error('Capability coordination requires a captured run-policy/7 task limit');
  }
  return {
    maxAssignments: policy.limits.maxIterationsPerCapabilityTask,
    maxWorkUnits: policy.limits.maxWorkItems,
    maxInvocations: policy.limits.maxInvocationsPerRun,
  };
}

/** The first capability policy uses the existing per-work-item assignment
 * limit as its default, while recording the distinct task limit explicitly. */
export function capabilityPolicyFrom(previous: RunPolicy): RunPolicy {
  if (!supportedCapabilityPolicy(previous.version)) throw new Error(`Run policy ${previous.version} is refused by ${capabilityRunPolicyVersion}; a fresh run is required`);
  return {
    ...previous,
    context: { ...previous.context, 'capability-architect': {
      compaction: 'allowed', budgetTokens: null, budgetFraction: null, reportReserveTokens: 0,
    } },
    limits: { ...previous.limits, maxIterationsPerCapabilityTask: previous.limits.maxIterationsPerWorkItem },
  };
}

export function canStartInvocation(committedInvocations: number, limits: CapabilityLimits): boolean {
  return committedInvocations < limits.maxInvocations;
}
