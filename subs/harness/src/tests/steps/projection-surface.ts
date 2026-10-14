import { Given, When, Then } from '@cucumber/cucumber';
import { recordedProjectionSurface } from '../helpers/projection-surface.js';

let fixture: Awaited<ReturnType<typeof recordedProjectionSurface>> | undefined;
function current() { if (!fixture) throw new Error('Projection surface fixture not prepared'); return fixture; }
Given('the extracted module and its ordinary and testing API views', async () => { fixture = await recordedProjectionSurface(true); });
When('its real consumers and tests import the contracts they need', async () => { await current().importedConsumers(); });
Then('each imported symbol and signature companion has explicit valid exposure', () => { current().exposed(); });
Then("the child's production source imports, calls or receives by injection no writable run service, ledger writer or command executor, with no new writable exposure for it", async () => { await current().readOnly(); });
Then('private projectors and Node implementation are unavailable to web production code', async () => { await current().privateToWeb(); });
Then('focused child tests and parent integration tests remain in configured discovery', async () => { await current().discovered(); });
