import { Given, When, Then, After } from '@cucumber/cucumber';
import { runCollectionFixture, projectionImplementationBase } from '../helpers/kpi-run-collection.js';

let fixture: Awaited<ReturnType<typeof runCollectionFixture>> | undefined;
function current() { if (!fixture) throw new Error('Run collection fixture was not prepared'); return fixture; }
Given('an implementation base containing the merged projections extraction', async () => {
  await projectionImplementationBase();
});
Given('a scripted run with invocation measurements and accepted changes', async () => { fixture = await runCollectionFixture(); });
When('run collection and the projections child produce its metric answers', { timeout: 60000 }, async () => { await current().exercise(); });
Then('measurement and attribution rules are implemented by the KPI child', () => { current().provider(); });
Then('execution commits returned measurements through the harness writer', async () => { await current().persisted(); });
Then('the HTTP metrics and session answers match the baseline', async () => { await current().http(); });
Then('cross-owner imports satisfy the declared ordinary API contracts', async () => { await current().contracts(); });
After(async () => { if (fixture) { const closing = fixture; fixture = undefined; await closing.close(); } });
