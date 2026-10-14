import { test } from 'vitest';
import { recordedRepairHistory, repairInconsistencies } from './helpers/projection-repair-history.js';

test('valid retained repair history is read without effects and exported with stable identity', async () => {
  const fixture = await recordedRepairHistory();
  try {
    await fixture.exercise();
    fixture.sharedValidation(); fixture.queryUnchanged(); fixture.commandPreserved(); fixture.terminalPreserved();
  } finally { await fixture.close(); }
});
test.each(repairInconsistencies)('shared repair validation refuses %s before effects', async inconsistency => {
  const fixture = await recordedRepairHistory(inconsistency);
  try {
    await fixture.exercise();
    fixture.unreadable(); fixture.refused(); fixture.sharedValidation(); fixture.queryUnchanged();
  } finally { await fixture.close(); }
});
