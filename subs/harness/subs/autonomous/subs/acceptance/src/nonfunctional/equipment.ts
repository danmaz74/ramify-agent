import type { ToolDefinition } from '../../../../../agent/src/interfaces/port.js';
import { runCommand, type CommandRunner } from '../../../../../evidence/src/run-command.js';
import { ToolInputJudge, validateAgainst } from '../../../../../task-execution/src/submissions.js';
import { createShellTool, shellInputSchemaFor, shellMaxTimeoutMs, shellToolName } from '../../../../../../src/tools/shell.js';
import { heldCommands } from '../../../work-coordination/src/work/engineer-equipment.js';
import { type EquipContext, type Equipment } from '../../../../../task-execution/src/equipment.js';

/** Ordinary inspection equipment, with optional conveniences for the pinned candidate. */
export function nonfunctionalEquipment(input: {
  readonly projectRoot: string;
  readonly snapshotTools: readonly ToolDefinition[];
  readonly commandExecution?: CommandRunner | undefined;
  readonly registerProcessGroup?: ((pid: number, identity: string | null) => Promise<void>) | undefined;
  readonly commandTimeoutMs?: number | undefined;
  readonly outputFile: (call: number) => string;
}, session: EquipContext): Equipment {
  const maxTimeoutMs = input.commandTimeoutMs ?? shellMaxTimeoutMs;
  const judge = new ToolInputJudge({ tool: shellToolName,
    validate: value => validateAgainst(shellInputSchemaFor(maxTimeoutMs), value),
    observations: session.observations,
  });
  let shellGapRecorded = false;
  const held = heldCommands(input.commandExecution ?? runCommand, session.hold);
  const shell = createShellTool({
    commandExecution: request => held({ ...request,
      ...(input.registerProcessGroup === undefined ? {} : { registerProcessGroup: input.registerProcessGroup }),
    }),
    workingDirectory: input.projectRoot, maxTimeoutMs,
    callId: () => session.callId(shellToolName),
    judge: (value, callId) => judge.judge(value, callId ?? session.callId(shellToolName)),
    outputFile: input.outputFile,
    starting: async call => {
      session.transcript?.output(call.callId!, call.outputFile);
      if (!shellGapRecorded) {
        shellGapRecorded = true;
        await session.observations.record({ type: 'coverage-gap', data: {
          kind: 'unguarded-shell', detail: 'The coordinator shell is instructed to inspect evidence; shell writes are not prevented.',
        } });
      }
    },
    ended: async () => {},
  });
  return { builtinTools: ['read', 'grep', 'ls', 'find'],
    tools: [...input.snapshotTools, shell.definition], settle: () => shell.settle() };
}
