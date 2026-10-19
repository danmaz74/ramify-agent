export {
  repairIncidentRecordSchema, repairIncidentStageSchema, repairResultSchema, repairExportStateSchema, repairCandidateSchema,
  type RepairIncidentId, type RepairIncidentRecord, type RepairIncidentStage, type RepairResult, type RepairExportState, type RepairCandidate,
} from '../../../../src/interfaces/protocol/repairs.js';

/** Derived from the number of distinct durable incidents of the run. */
export const repairIncidentId = (count: number): string => `apr-${String(count).padStart(4, '0')}`;
