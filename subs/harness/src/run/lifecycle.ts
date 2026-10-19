import { AutonomousRunService as AutonomousService, type AutonomousRunOptions as AutonomousOptions } from '../../subs/autonomous/src/run/service.js';
import type { ProjectLock } from '../store/lock.js';
/** Parent-owned process resources; autonomous receives only current authority and a close acknowledgment. */
export type RunServiceOptions = Omit<AutonomousOptions, 'lock' | 'onQuiescentClose'> & { readonly lock: ProjectLock };
export type RunService = AutonomousService;
function bindOwnership(options: RunServiceOptions): AutonomousOptions {
  const { lock, ...inputs } = options;
  return { ...inputs, lock: { held: () => lock.held() }, onQuiescentClose: () => lock.release() };
}
/** The application composes lock lifetime; lifecycle decisions belong to autonomous. */
export const RunService = {
  open: (options: RunServiceOptions) => AutonomousService.open(bindOwnership(options)),
  openForScriptedLifecycleTests: (options: RunServiceOptions) => AutonomousService.openForScriptedLifecycleTests(bindOwnership(options)),
  openForCapabilityTests: (options: RunServiceOptions, factory: Parameters<typeof AutonomousService.openForCapabilityTests>[1]) => AutonomousService.openForCapabilityTests(bindOwnership(options), factory),
};
