import { After, Given, When, Then } from '@cucumber/cucumber';
import { recordedRepairHistory, repairInconsistencies, type RepairInconsistency } from '../helpers/projection-repair-history.js';

let fixture: Awaited<ReturnType<typeof recordedRepairHistory>> | undefined;
function current() { if (!fixture) throw new Error('Repair history fixture not prepared'); return fixture; }
After(async () => { const value = fixture; fixture = undefined; await value?.close(); });
Given('a terminal run with valid repair history and a retained export payload', async () => { fixture = await recordedRepairHistory(); });
Given(/^retained repair history with (.+)$/, async (inconsistency: string) => {
  if (!repairInconsistencies.includes(inconsistency as RepairInconsistency)) throw new Error(`Unknown inconsistency: ${inconsistency}`);
  fixture = await recordedRepairHistory(inconsistency as RepairInconsistency);
});
When('its repair history is queried and its incident is exported through the command', async () => { await current().exercise(); });
When('its repair history is queried and the repair export command is requested', async () => { await current().exercise(); });
Then('both consumers use the same harness-owned history validation', () => { current().sharedValidation(); });
Then('the query performs no writes or export', () => { current().queryUnchanged(); });
Then('the command preserves export identity, payload, retry behavior and exit status', () => { current().commandPreserved(); });
Then("the run's terminal state is preserved", () => { current().terminalPreserved(); });
Then('the query reports unreadable history with its evidence', () => { current().unreadable(); });
Then('the command refuses before record-copy recovery or external export', () => { current().refused(); });
Then('both refusals use the shared history validation', () => { current().sharedValidation(); });
