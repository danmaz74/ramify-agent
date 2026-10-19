// Test operator supplies the exact item identity after inspecting its request.
// No automatic policy/session approvals; this helper never changes sandbox settings.
import { readFile, appendFile } from 'node:fs/promises';
import {relative,resolve} from 'node:path';
import { coordinatorStatus, coordinatorControl } from '../../../subs/harness/subs/assistance/src/coordinator-client.ts';
const metadata=JSON.parse(await readFile('plans/codex-coordinator-host/iteration-02/pilot-target.json','utf8'));
const status=await coordinatorStatus(metadata.root);
const request=status.record.pending.find(request=>process.argv[2]?.startsWith('mcp:') ? request.kind==='mcp-elicitation' && JSON.parse(request.id)[3]===Number(process.argv[2].slice(4)) : request.itemId===process.argv[2]);
if(!request) throw new Error('Exact inspected fixture request is no longer pending');
let response;
if(request.kind==='command-approval' && request.cwd!==null && !relative(metadata.root,resolve(request.cwd)).startsWith('..') && !relative(metadata.root,resolve(request.cwd)).startsWith('/')){const choice=request.choices.find(choice=>choice.effect==='once');if(!choice)throw new Error('No one-time choice offered');response={kind:'approval',choiceId:choice.id};}
else if(request.kind==='mcp-elicitation' && request.serverName===`ramify_host_${status.record.generation.replaceAll('-','')}` && Object.keys(request.schema.properties??{}).length===0){response={kind:'mcp-elicitation',action:'accept',content:{}};}
else if(request.kind==='file-approval' && request.writeRoot===null){const inspected=JSON.parse(await readFile('plans/codex-coordinator-host/iteration-02/pilot-inspected-file-change.json','utf8'));if(inspected.request.id!==request.id)throw new Error('File change has not been exactly inspected');const choice=request.choices.find(choice=>choice.effect==='once');if(!choice)throw new Error('No one-time file choice');response={kind:'approval',choiceId:choice.id};}
else throw new Error('Inspected request is outside the exact supported pilot operation');
const commandId=`pilot-once:${request.generation}:${request.itemId??JSON.parse(request.id)[3]}`;
const result=await coordinatorControl(metadata.root,status.record.id,{action:'respond',commandId,requestId:request.id,response},30000);
const evidence={at:new Date().toISOString(),authorization:'Exact inspected disposable pilot operation; approve once only. No sandbox or command policy change.',request,response,commandId,result};
await appendFile('plans/codex-coordinator-host/iteration-02/pilot-operator-responses.jsonl',JSON.stringify(evidence)+'\n');
console.log(JSON.stringify({command:request.command,message:request.message,itemId:request.itemId,result}));
