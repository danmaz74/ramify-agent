import { z } from 'zod';

import { sha256Schema } from '../interfaces/protocol/evidence.js';

const text = z.string().min(1);
export const projectConfigVersion = 'ramify-agent.project/1';

/** An argv the harness runs as it stands, with its first element the executable or `npm`. */
const argvSchema = z.array(text).min(1);

/** The longest a project may give one gate command: two hours. */
export const projectCommandTimeoutCeilingMs = 7_200_000;

const projectTimeout = z.int().positive().max(projectCommandTimeoutCeilingMs, {
  error: `A command timeout is at most ${projectCommandTimeoutCeilingMs} ms (two hours)`,
});

/** The formats of a type checker's output the gate reads error locations from. */
export const typeCheckOutputSchema = z.enum(['tsc']);

/** A project-relative directory inside the project: no absolute path, no drive and no `..` segment. */
const projectDirectorySchema = z.string().refine(value => {
  const normalized = value.replaceAll('\\', '/');
  return !normalized.startsWith('/') && !/^[A-Za-z]:/u.test(normalized) && !normalized.split('/').includes('..');
}, 'must be a relative directory inside the project');

/**
 * One command that prepares the project before a gate's checks run, such as
 * its build. `command` is the argv as it stands; `cwd` is relative to the
 * project root, which it defaults to; `env` is added to the environment the
 * harness builds for every command.
 */
export const setupCommandSchema = z.object({
  /** Labels the command in records and pages; `build` is shown as the build. */
  name: text.optional(),
  command: argvSchema,
  cwd: projectDirectorySchema.optional(),
  /** Positive milliseconds; ten minutes where it is not declared. */
  timeoutMs: z.int().positive().optional(),
  env: z.record(text, z.string()).optional(),
}).strict();
export type SetupCommandConfig = z.infer<typeof setupCommandSchema>;

/** An explicitly enabled existing target-project tracker, independent of the implementation worktree. */
export const beadsProjectConfigSchema = z.object({
  /** The main Git working tree, or an explicit absolute/project-relative tracker workspace. */
  workspace: z.union([
    z.literal('git-common-root'),
    z.object({ path: text }).strict(),
  ]),
  /** A command name on PATH or an absolute/project-relative executable path; `bd` when omitted. */
  executable: text.optional(),
}).strict();
export type BeadsProjectConfig = z.infer<typeof beadsProjectConfigSchema>;

/**
 * `ramify-agent.json`, the target project's configuration for the harness:
 * only what the harness cannot derive, all of it optional: the format of what
 * the type check prints, the timeouts of a standalone diagnosis's commands
 * and the setup commands it runs first, plus optional existing-issue
 * administration. The project's tests and scenarios are checks of its
 * committed audit definition, `ramify-audit.json`, and nothing here names them.
 */
export const projectConfigSchema = z.object({
  schema: z.literal(projectConfigVersion),
  /**
   * The project's type check. `output` declares the format it prints, from
   * which a failed type check is attributed by the locations of its errors;
   * without it, by which commands failed.
   */
  typeCheck: z.object({ output: typeCheckOutputSchema.optional() }).strict().optional(),
  /**
   * The timeouts of a standalone diagnosis's commands for this project, in
   * milliseconds, each replacing the harness's own: the type check and the
   * complete Ramify check. Each is bounded by `projectCommandTimeoutCeilingMs`.
   */
  timeouts: z.object({
    typeCheck: projectTimeout.optional(),
    ramifyCheck: projectTimeout.optional(),
  }).strict().optional(),
  /**
   * The project's setup commands, run in order before a standalone
   * diagnosis's checks at the project root. Readiness requires them to equal
   * the committed audit definition's workspace setup, which ramify-audit
   * runs in the worktree of every audited commit. Each carries its own
   * bound, which `timeouts` does not replace.
   */
  setup: z.array(setupCommandSchema).optional(),
  /** Isolated administrative fork sessions; omission or false disables them. */
  beads: z.union([z.literal(false), beadsProjectConfigSchema]).optional(),
}).strict();
export type ProjectConfig = z.infer<typeof projectConfigSchema>;

/**
 * The configuration as `start-run` found it, captured in `job.json`: the
 * validated file with its hash, or why there is none. An invalid or missing
 * file is not a refusal to start; readiness reports it.
 */
export const capturedProjectConfigSchema = z.union([
  z.object({ path: text, hash: sha256Schema, config: projectConfigSchema }).strict(),
  z.object({ path: text, hash: sha256Schema.nullable(), invalid: text }).strict(),
]);
export type CapturedProjectConfig = z.infer<typeof capturedProjectConfigSchema>;

/** Provider-validated committed policy, retained in the harness's own durable vocabulary. */
export const committedAuditConfigurationSchema = z.object({
  sourceCommit: text,
  path: text,
  blob: text,
  projectRoot: text,
  checks: z.array(z.unknown()),
  ignorePaths: z.array(z.string()),
  undetectedConfigFilesForcingFullAudit: z.array(z.string()),
  workspace: z.object({
    preparationId: z.literal('nodejs'),
    packageDirectoriesDeclared: z.boolean(),
    linkNodeModules: z.boolean(),
    packageDirectories: z.array(z.string()),
    setupCommands: z.array(z.object({
      name: z.string().optional(), argv: z.array(z.string()).min(1), cwd: z.string(),
      env: z.record(z.string(), z.string()), timeoutMs: z.int().positive(),
    }).strict()),
  }).strict(),
}).strict();
export type CommittedAuditConfigurationRecord = z.infer<typeof committedAuditConfigurationSchema>;

/** A committed record at one revision; `hash` is the SHA-256 of the file's bytes. */

/** `job.json` of a run. Written once, before the first event. */
