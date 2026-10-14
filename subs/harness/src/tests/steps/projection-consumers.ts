import { After, Given, When, Then } from '@cucumber/cucumber';
import { recordedProjectionConsumers } from '../helpers/projection-consumers.js';

type Fixture = Awaited<ReturnType<typeof recordedProjectionConsumers>>;
let fixture: Fixture | undefined;
function current(): Fixture { if (!fixture) throw new Error('Recorded projection fixture not prepared'); return fixture; }
After(async () => { const value = fixture; fixture = undefined; await value?.close(); });
Given('a project has recorded runs, sessions and consultations', async () => { fixture = await recordedProjectionConsumers(); });
Given('a completed run with session transcripts and repair incidents', async () => { fixture = await recordedProjectionConsumers(); });
Given('its project files, durable files and event sequence have been captured', async () => { await current().capture(); });
When('HTTP answers run and session queries and the CLI inspects consultations', async () => { await current().exercise(); });
When('its supported queries are repeated in process and through HTTP', async () => { await current().exercise(); });
Then("those answers use the projections child's implementation", async () => { await current().composition(); });
Then('the existing schemas, values, text, ordering and exit statuses are preserved', async () => { await current().unchanged(); current().noEffects(); });
Then('the old harness production projection directory is absent', async () => { await current().oldTreeAbsent(); });
Then('those files and the event sequence are unchanged', async () => { await current().unchanged(); });
Then('no query invokes an agent, audit or external exporter', () => { current().noEffects(); });
