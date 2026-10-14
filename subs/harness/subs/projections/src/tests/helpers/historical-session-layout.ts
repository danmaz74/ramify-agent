import { sessionLayout, sessionsDirectory } from '../../standalone-records.js';

/** Selected metadata for installing and inspecting retained historical fixtures. */
export interface HistoricalSessionLayout {
  readonly directory: string;
  readonly outcome: string;
  readonly transcript: string;
  readonly session: string;
}

export const historicalSessionLayout: HistoricalSessionLayout = Object.freeze({
  directory: sessionsDirectory,
  outcome: sessionLayout.outcome,
  transcript: sessionLayout.transcript,
  session: sessionLayout.session,
});
