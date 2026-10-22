import { ramifyExecutable } from '../../subs/evidence/src/ramify-cli.js';
import { checkCommand, type CheckCommand } from '../../subs/autonomous/subs/acceptance/src/checks/records.js';
import type { Role } from '../interfaces/protocol/runs.js';
import { reviewPolicyVersion, type ReviewPolicy } from '../../subs/autonomous/subs/acceptance/src/review-policy.js';
import { roles, runPolicySchema, type RunPolicy } from '../../subs/autonomous/src/run/records.js';
import { type CapturedProjectConfig } from './project-records.js';

/*
 * The policy one run runs under. It is hardcoded, captured in `job.json`
 * before the first event. Explicit compatible recovery records an adopted
 * continuity policy separately; the original policy evidence stays immutable.
 *
 * Every command names the environment the harness built for it and holds no
 * value of it. `checkCommand` is the one constructor, and the environment its
 * child receives is the allowlist of `childEnvironment` plus the command's
 * own settings, built again at the moment of the spawn.
 */

export const runPolicyVersion = 'run-policy/8';

/** The policy table. Historical count fields remain for replay of captured runs;
 * their values do not decide whether semantic work may continue. */
export const defaultLimits: RunPolicy['limits'] = {
  repairRoundsPerIteration: 3,
  repairRoundsPerWorkItemGate: 3,
  infrastructureRetriesPerGate: 2,
  forkRetriesPerRequest: 2,
  // Retained historical fields; continuity does not enforce resource-return ceilings.
  budgetReturnsPerIteration: 6,
  sessionReconstructionsPerWork: 2,
  cycleReplansPerWorkItem: 1,
  rejectedSubmissionsPerTurn: 3,
  rejectedToolInputsPerTurn: 3,
  readinessRecoveries: 2,
  stopSettleMs: 30_000,
  writerSettleMs: 30_000,
  invocationIdleMs: 300_000,
  invocationAbsoluteMs: 3_600_000,
  maxIterationsPerWorkItem: 12,
  // A cross-owner capability may need provider, consumer, then root repair;
  // retry4 reached a valid root assignment at i13 before the old bound stopped it.
  maxIterationsPerCapabilityTask: 24,
  maxWorkItems: 64,
  maxPlacementRequests: 32,
  maxInvocationsPerRun: 400,
  runAbsoluteMs: 28_800_000,
  reconciliationRoundsPerWorkItem: 3,
  laterRoundMinimumRisk: 'medium',
  maxPlanDeviations: 5,
  commandTimeoutMs: 600_000,
  maxCommandTimeoutMs: 1_800_000,
  maxInvocationIdleMs: 1_800_000,
  maxInvocationAbsoluteMs: 10_800_000,
  nonfunctionalRoundsPerPlan: 3,
};

/**
 * An engineer's quiet-progress observation intervals. absoluteMs remains
 * readable historical assignment evidence and is never a lifetime deadline.
 */
export interface EngineerBounds {
  readonly commandTimeoutMs: number;
  readonly idleMs: number;
  readonly absoluteMs: number;
}

/** The bounds a module engineer runs under when its assignment raises none, and the ceilings an assignment may raise them to. */
export function engineerBoundsOf(limits: RunPolicy['limits']): { readonly defaults: EngineerBounds; readonly ceilings: EngineerBounds } {
  return {
    defaults: {
      commandTimeoutMs: limits.commandTimeoutMs ?? defaultLimits.commandTimeoutMs!,
      idleMs: limits.invocationIdleMs,
      absoluteMs: limits.invocationAbsoluteMs,
    },
    ceilings: {
      commandTimeoutMs: limits.maxCommandTimeoutMs ?? defaultLimits.maxCommandTimeoutMs!,
      idleMs: limits.maxInvocationIdleMs ?? defaultLimits.maxInvocationIdleMs!,
      absoluteMs: limits.maxInvocationAbsoluteMs ?? defaultLimits.maxInvocationAbsoluteMs!,
    },
  };
}

/**
 * Required review questions and scheduling settings. Current continuity
 * retains every question through resource recovery; historical attempt and
 * waiting durations never expire review authority or discard coverage.
 */
export const defaultReviewPolicy: ReviewPolicy = {
  version: reviewPolicyVersion,
  kinds: ['code', 'scope', 'design'],
  concurrency: 2,
  queue: 12,
  retries: 1,
  attemptMs: 600_000,
  settleMs: 900_000,
  maxConcerns: 20,
};

/**
 * Every current role uses Pi's native automatic compaction. Historical
 * ceiling fields remain readable; new policy captures no competing trigger
 * or extra reserve. Effective model settings are observed by the adapter.
 */
export const defaultContextPolicies: Record<Role, NonNullable<RunPolicy['context'][Role]>> = Object.fromEntries(
  roles.map(role => [role, { compaction: 'allowed', budgetTokens: null, budgetFraction: null, reportReserveTokens: 0 }]),
) as Record<Role, NonNullable<RunPolicy['context'][Role]>>;

/**
 * The context policy a run captured for one role. A run captured before the
 * role existed never invokes it, so a missing entry is a defect, not a
 * default to fall back to.
 */
/**
 * The captured invocation settings with an engineer's command and idle
 * observations. Absolute fields survive for historical evidence only.
 */
export function invocationLimits(limits: RunPolicy['limits'], own: {
  readonly bounds?: { readonly idleMs: number; readonly absoluteMs: number; readonly commandTimeoutMs?: number | undefined } | undefined;
  readonly absoluteMs?: number | undefined;
}): RunPolicy['limits'] {
  return {
    ...limits,
    commandTimeoutMs: own.bounds?.commandTimeoutMs ?? limits.commandTimeoutMs,
    invocationIdleMs: own.bounds?.idleMs ?? limits.invocationIdleMs,
    invocationAbsoluteMs: own.bounds?.absoluteMs
      ?? (own.absoluteMs === undefined ? limits.invocationAbsoluteMs : Math.min(limits.invocationAbsoluteMs, own.absoluteMs)),
  };
}

export function contextPolicyOf(policy: RunPolicy, role: Role): NonNullable<RunPolicy['context'][Role]> {
  const context = policy.context[role];
  if (context === undefined) throw new Error(`The run's policy (${policy.version}) has no context policy for the ${role}`);
  return context;
}

/**
 * The transcript policy. A body larger than this is stored once in the
 * content store and named by its hash; a smaller one stays in its entry.
 */
export const defaultTranscriptPolicy: RunPolicy['transcript'] = { inlineBodyBytes: 8 * 1024 };

/** The timeouts of the harness's own commands. */
export const commandTimeouts = {
  typeCheck: 300_000,
  ramifyCheck: 600_000,
  hook: 5_000,
} as const;

/** The MVP's one test runner, reached through the project's own npm scripts. */
function npmCommand(cwd: string, args: readonly string[], timeoutMs: number): CheckCommand {
  return checkCommand({ argv: ['npm', ...args], cwd, timeoutMs });
}

export interface RunPolicyOptions {
  readonly projectRoot: string;
  /** The `ramify` executable, for a test that supplies its own. */
  readonly ramify?: string | undefined;
  /** An endpoint directory for the harness's own Ramify daemon, where it has one. */
  readonly endpointDirectory?: string | undefined;
}

/**
 * The policy a run captures. The commands are the main plan's table, built
 * here and nowhere else, so that a captured `CheckCommand` is complete: it
 * names the variables its child received and carries the settings the harness
 * chose, and the values come from the allowlist when it runs.
 */
export function defaultRunPolicy(options: RunPolicyOptions): RunPolicy {
  const { projectRoot } = options;
  const ramify = options.ramify ?? ramifyExecutable;
  const ramifySettings: Record<string, string> = options.endpointDirectory === undefined ? {} : { RAMIFY_ENDPOINT_DIR: options.endpointDirectory };
  const context = Object.fromEntries(roles
    .map(role => [role, defaultContextPolicies[role]])) as RunPolicy['context'];
  return runPolicySchema.parse({
    version: runPolicyVersion,
    continuity: { version: 'resource-continuity/1' },
    contract: 'plan21-whole-owner-and-architect-reporting/1',
    recovery: { version: 'operation-recovery/1', automaticRetries: 2, baseDelayMs: 250, maxDelayMs: 5000 },
    limits: defaultLimits,
    context,
    transcript: defaultTranscriptPolicy,
    reviews: defaultReviewPolicy,
    commands: {
      typeCheck: npmCommand(projectRoot, ['run', 'type-check'], commandTimeouts.typeCheck),
      /**
       * The complete check. The harness reads its verdict and findings, never
       * the snapshot of every evaluated import, so the report leaves it out.
       */
      ramifyCheck: checkCommand({
        argv: [ramify, 'check', '--batch', '--root', projectRoot, '--format', 'json', '--no-snapshot'],
        cwd: projectRoot,
        envAdditions: ramifySettings,
        timeoutMs: commandTimeouts.ramifyCheck,
      }),
      /**
       * The hook check's template. The changed paths follow `--changed` and
       * the working directory becomes the one they are relative to; nothing
       * else of it changes. An exit of 2 is not checked with the CLI's
       * reason, which is never a pass.
       */
      ramifyChanged: checkCommand({
        argv: [ramify, 'check', '--changed', '--format', 'json', '--deadline', String(commandTimeouts.hook)],
        cwd: projectRoot,
        envAdditions: ramifySettings,
        timeoutMs: commandTimeouts.hook,
      }),
      hookTimeoutMs: commandTimeouts.hook,
    },
  });
}

/**
 * The policy with the diagnosis command timeouts a project's configuration
 * declares in place of the harness's own: `typeCheck` and `ramifyCheck`. A
 * missing or invalid configuration changes nothing; its reason is
 * readiness's to report.
 */
export function withProjectTimeouts(policy: RunPolicy, captured: CapturedProjectConfig): RunPolicy {
  const timeouts = 'config' in captured ? captured.config.timeouts : undefined;
  if (timeouts === undefined) return policy;
  const timed = <T extends { readonly timeoutMs: number }>(command: T, timeoutMs: number | undefined): T =>
    (timeoutMs === undefined ? command : { ...command, timeoutMs });
  const { commands } = policy;
  return runPolicySchema.parse({
    ...policy,
    commands: {
      ...commands,
      typeCheck: timed(commands.typeCheck, timeouts.typeCheck),
      ramifyCheck: timed(commands.ramifyCheck, timeouts.ramifyCheck),
    },
  });
}
