import { apiViewDirectoriesOf, coverageLimitsOf, coverageRecordsOf, describeCoverageLimits, findModule, readArchitectMeta, type ArchitectIndex } from '../../../evidence/src/views.js';
import { projectPath } from '../../../../src/steps/inputs.js';
import type { InputManifest } from '../../../../src/interfaces/protocol/evidence.js';
import type { OrientationStepInputs } from '../../../../src/steps/inputs.js';
import { apiCoverageStatement } from './session.js';

/** Current local view references, with architect detail identity independent of API-view identity. */
export async function localViewInputsOf(projectRoot: string, module: string, index: ArchitectIndex | null,
  view: InputManifest['architectView']): Promise<OrientationStepInputs['architectView']> {
  const entry = index === null ? undefined : findModule(index, module);
  const directories = entry === undefined ? [] : await apiViewDirectoriesOf(projectRoot, entry).catch(() => []);
  const current = index === null ? null : await readArchitectMeta(projectRoot).catch(() => null);
  const matching = current !== null && current.revision === index?.revision && current.input === index.input;
  const detailUnavailable = matching ? undefined : current === null
    ? 'current architect metadata cannot be read and verified against the captured index'
    : `current architect metadata has revision \`${current.revision}\`, input \`${current.input}\`, which differs from this summary's captured identity`;
  const captured = view.status !== 'materialized' ? [] : [
    `Captured architect aggregate identity: revision \`${view.revision}\`, input \`${view.input}\`.`,
    ...view.coverageLimits.map(limit => `Captured aggregate limit: ${limit}`),
  ];
  const coverage = view.status !== 'materialized' ? [] : index === null
    ? [...captured, 'Architect coverage detail access unavailable: no generated index was captured.']
    : matching
      ? describeCoverageLimits(coverageLimitsOf(current), coverageRecordsOf(index), [entry?.module ?? module], index)
      : [...captured, ...describeCoverageLimits(['Index records are observed separately; captured aggregate limits have not been correlated with this index identity'],
        coverageRecordsOf(index), [entry?.module ?? module], index, detailUnavailable)];
  if (directories.length === 0) return view.status !== 'materialized' ? [] : [{ path: projectPath('.ramify-architect'),
    revision: matching ? index!.revision : view.revision, modules: [...index?.modules.keys() ?? []], coverage }];
  return directories.map((directory, position) => ({ path: projectPath(directory.path), revision: directory.revision, modules: [entry!.module],
    coverage: [...directory.coverage === null ? [] : [apiCoverageStatement(directory.coverage)], ...position === 0 ? coverage : []] }));
}
