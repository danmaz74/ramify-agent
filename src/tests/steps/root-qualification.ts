import assert from 'node:assert/strict';
import { After, Given, Then, When } from '@cucumber/cucumber';
import { rootQualificationFixture } from '../helpers/root-qualification.js';

let fixture: Awaited<ReturnType<typeof rootQualificationFixture>> | undefined;
function current() { assert.ok(fixture, 'Create root qualification consumers first'); return fixture; }
Given('existing root qualification consumers of setup attribution and trial reporting', async () => { fixture = await rootQualificationFixture(); });
When('they verify valid and invalid setup evidence and choose report destinations', async () => { await current().exercise(); });
Then('their results and errors match the baseline through selected contracts', () => { current().compatibility(); });
Then('in-project and symlink report destinations remain refused', async () => { await current().protection(); });
Then('no KPI implementation becomes a browser production API', async () => { await current().browser(); });
After(async () => { const closing = fixture; fixture = undefined; await closing?.close(); });
