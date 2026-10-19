import { describe, expect, it } from 'vitest';
import { scriptedCandidates } from '../../../autonomous/subs/acceptance/src/tests/helpers/candidates.js';
import { prepareAssistedReview } from '../assisted.js';
import { openCandidateSnapshot } from '../snapshot.js';

const root = '/scripted/project';
const source = () => scriptedCandidates(root, { base: { tree: 'tree-0', base: 'base', changes: [], files: { 'src/feature.ts': 'export const feature = false;\n' } }, candidate: {
  tree: 'tree-1', base: 'base', changes: [{ status: 'M', path: 'src/feature.ts' }],
  files: { 'src/feature.ts': 'export const feature = true;\n', 'README.md': '# Project\n' },
} });

describe('assisted review preparation', () => {
  it('renders factual audit state and requires answers for behavior absent from the diff', async () => {
    const candidates = source();
    const snapshot = await openCandidateSnapshot(candidates, root, { commit: 'candidate', base: 'base' });
    const prepared = await prepareAssistedReview({ source: candidates, projectRoot: root, maxConcerns: 4,
      briefing: { id: 'review-1', iteration: 'iteration-1', snapshot, outcome: 'Add feature and migration.',
        audit: { status: 'pending' }, principles: [], requirements: [{ ref: 'feature', text: 'Feature works' }, { ref: 'migration', text: 'Migration is present' }] } });
    expect(prepared.message).toContain('Audit: pending');
    expect(prepared.message).not.toContain('gate passed');
    expect(prepared.message).toContain('including requirements with no implementation');
    const report = { inspected: ['src/feature.ts'], missing: [], concerns: [], codeAssessment: 'Feature looks sound.',
      scopeAssessment: 'Migration missing.', design: { needed: false, reason: 'No interface or ownership change.', assessment: 'The existing dependency direction is preserved.' },
      requirements: [{ ref: 'feature', outcome: 'met', explanation: 'Implementation exists.', evidencePaths: ['src/feature.ts'] },
        { ref: 'migration', outcome: 'unmet', explanation: 'No migration exists.', evidencePaths: [] }] };
    expect(prepared.validate(report)).toEqual({ ok: true, value: report });
    expect(prepared.validate({ ...report, requirements: [report.requirements[0]] })).toMatchObject({ ok: false, errors: [{ path: 'requirements', message: 'No answer for acceptance reference migration' }] });
    expect(prepared.validate({ ...report, inspected: [], missing: [] })).toMatchObject({ ok: false });
    expect(prepared.validate({ ...report, requirements: [{ ...report.requirements[0], evidencePaths: [] }, report.requirements[1]] })).toMatchObject({ ok: false });
    expect(prepared.validate({ ...report, requirements: [{ ...report.requirements[0], evidencePaths: ['src/unread.ts'] }, report.requirements[1]] })).toMatchObject({ ok: false });
    expect(prepared.validate({ ...report, requirements: [{ ...report.requirements[0], evidencePaths: ['README.md'] }, report.requirements[1]] })).toMatchObject({ ok: false });
    expect(prepared.tools.definitions.every(tool => tool.mutating === false)).toBe(true);
  });

  it('keeps a valid zero-concern report and explicit design escalation distinct', async () => {
    const candidates = source(); const snapshot = await openCandidateSnapshot(candidates, root, { commit: 'candidate', base: 'base' });
    const prepared = await prepareAssistedReview({ source: candidates, projectRoot: root, maxConcerns: 4,
      briefing: { id: 'review-2', iteration: 'iteration-1', snapshot, outcome: 'Add feature.', audit: { status: 'failed', detail: 'configured audit failed' },
        principles: [{ path: 'design.principles.md', note: 'Ownership applies.' }], requirements: [{ ref: 'feature', text: 'Feature works' }] } });
    const report = { inspected: ['src/feature.ts'], missing: [], concerns: [], codeAssessment: 'No code concern.', scopeAssessment: 'Goal covered.',
      design: { needed: true, reason: 'Ownership changed.', assessment: 'The new owner receives the exported feature.' }, requirements: [{ ref: 'feature', outcome: 'met', explanation: 'Source present.', evidencePaths: ['src/feature.ts'] }] };
    expect(prepared.message).toContain('Audit: failed — configured audit failed');
    expect(prepared.validate(report).ok).toBe(true);
  });

  it('retains twenty material concerns and an explicit overflow gap', async () => {
    const candidates = source(); const snapshot = await openCandidateSnapshot(candidates, root, { commit: 'candidate', base: 'base' });
    const prepared = await prepareAssistedReview({ source: candidates, projectRoot: root, maxConcerns: 20,
      briefing: { id: 'review-overflow', iteration: 'iteration-1', snapshot, outcome: 'Assess all defects.', audit: { status: 'passed' },
        principles: [], requirements: [{ ref: 'feature', text: 'Feature works' }] } });
    const concern = (index: number) => ({ summary: `Defect ${index}`, consequence: 'Behavior fails.', rationale: 'Candidate source shows it.',
      uncertainty: 'Needs repair.', remedy: 'Correct the behavior.', locations: [{ path: 'src/feature.ts', startLine: 1, endLine: 1 }],
      suggests: null, risk: 'medium', ground: null });
    const report = { inspected: ['src/feature.ts'], missing: [], concerns: Array.from({ length: 20 }, (_, index) => concern(index + 1)),
      codeAssessment: 'Twenty material defects were found.', scopeAssessment: 'Further assessment remains.',
      design: { needed: false, reason: 'No interface change.', assessment: 'No design change identified yet.' },
      requirements: [{ ref: 'feature', outcome: 'uncertain', explanation: 'Further review remains.', evidencePaths: [] }],
      coverageGap: 'More candidate behavior remains to inspect and may contain additional concerns.' };
    expect(prepared.validate(report)).toEqual({ ok: true, value: report });
    expect(prepared.validate({ ...report, concerns: [...report.concerns, concern(21)] }).ok).toBe(false);
    expect(prepared.message).toContain('never silently truncate');
  });

  it('binds approval-only requirement answers to inspected factual protected paths', async () => {
    const candidates = source();
    const snapshot = await openCandidateSnapshot(candidates, root, { commit: 'candidate', base: 'base' });
    const prepared = await prepareAssistedReview({ source: candidates, projectRoot: root, maxConcerns: 4,
      briefing: { id: 'approval-review', iteration: 'iteration-1', snapshot, outcome: 'Implement feature.',
        audit: { status: 'passed' }, principles: [], requirements: [{ ref: 'feature', text: 'Feature works.' }],
        protectionPaths: ['src/feature.ts'] } });
    const report = { inspected: ['src/feature.ts'], missing: [], concerns: [], codeAssessment: 'Implementation is complete.',
      scopeAssessment: 'Only the exact protected change needs authority.', design: { needed: false, reason: 'No ownership change.', assessment: 'Contracts preserved.' },
      requirements: [{ ref: 'feature', outcome: 'unmet', explanation: 'Only owner authorization remains.',
        evidencePaths: ['src/feature.ts'], pendingProtection: ['src/feature.ts'] }] };
    expect(prepared.validate(report)).toEqual({ ok: true, value: report });
    const answer = report.requirements[0]!;
    for (const invalid of [{ ...answer, outcome: 'met' }, { ...answer, outcome: 'uncertain' },
      { ...answer, pendingProtection: ['README.md'] }, { ...answer, pendingProtection: [] }, { ...answer, evidencePaths: [] }])
      expect(prepared.validate({ ...report, requirements: [invalid] }).ok).toBe(false);
  });

});
