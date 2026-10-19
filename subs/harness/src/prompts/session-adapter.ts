import type { AgentPort } from '../../subs/agent/src/interfaces/port.js';
import { TaskSessionOperations, composeOperationPacket, type PreparedOperationInput, type HarnessTaskBrief } from '../../subs/task-execution/src/session-operations.js';
import type { LoadedPackage } from './packages.js';
import { prepareTaskPackage } from '../../subs/task-workflow/src/prompts/tasks.js';
import { isInspectableShellCheck } from '../tools/shell-tests.js';

export interface HarnessOperationInput extends Omit<PreparedOperationInput, 'prepare'> { readonly loaded: LoadedPackage }
/** Workflow policy around the shared executor; it passes no package internals into the runtime. */
export class HarnessSessionOperations extends TaskSessionOperations {
  static override async open(directory: string, agent: AgentPort): Promise<HarnessSessionOperations> {
    return await super.open(directory, agent) as HarnessSessionOperations;
  }
  protected override isInspectableShellCheck(command: string, workingDirectory: string): boolean { return isInspectableShellCheck(command, workingDirectory); }
  override start(input: PreparedOperationInput): ReturnType<TaskSessionOperations['start']>;
  override start(input: HarnessOperationInput): ReturnType<TaskSessionOperations['start']>;
  override start(input: HarnessOperationInput | PreparedOperationInput) {
    if (!('loaded' in input)) return super.start(input);
    const { loaded, ...prepared } = input;
    return super.start({ ...prepared, prepare: () => prepareTaskPackage(loaded, input.brief.kind, input.brief.consultationSubmissionSchema) });
  }
}
/** The workflow resolves procedure policy; renderer and actual delivery share all framing. */
export function composeWorkflowOperationPacket(input: Omit<Parameters<typeof composeOperationPacket>[0], 'prepared'> & { readonly loaded: LoadedPackage; readonly brief: HarnessTaskBrief }) {
  const { loaded, ...prepared } = input;
  return composeOperationPacket({ ...prepared, prepared: prepareTaskPackage(loaded, input.brief.kind, input.brief.consultationSubmissionSchema) });
}
