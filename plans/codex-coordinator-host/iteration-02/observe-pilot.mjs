import {readFile,writeFile} from 'node:fs/promises';
import {setTimeout as delay} from 'node:timers/promises';
import {Client,StreamableHTTPClientTransport} from '@modelcontextprotocol/client';
import {coordinatorStatus} from '../../../subs/harness/subs/assistance/src/coordinator-client.ts';
import {readCoordinator} from '../../../subs/harness/subs/assistance/src/coordinator-store.ts';
const target=JSON.parse(await readFile('plans/codex-coordinator-host/iteration-02/pilot-target.json','utf8'));
const evidence={startedAt:new Date().toISOString(),target:target.root,observations:[],disconnects:[]};
let previous='',workerDone=false,assessmentDone=false;
for(const deadline=Date.now()+1_200_000;Date.now()<deadline;){
 const status=await coordinatorStatus(target.root);const r=status.record;
 const view={at:new Date().toISOString(),id:r.id,generation:r.generation,threadId:r.threadId,jobId:r.jobId,host:r.owner,provider:r.readiness?.process,phase:r.phase,turn:r.turn,workers:r.workers,pending:r.pending,assessments:status.assessments,cursor:r.cursor};
 const key=JSON.stringify({...view,at:undefined,cursor:undefined});
 if(key!==previous){previous=key;evidence.observations.push(view);console.log(JSON.stringify(view));await retain();}
 if(!workerDone&&r.workers.length>0){
  const {runtime}=await readCoordinator(target.root,r.id);const abort=new AbortController();
  const watch=fetch(`${runtime.endpoint}/watch?after=${r.cursor}&wait=30000`,{headers:{authorization:`Bearer ${runtime.token}`},signal:abort.signal}).then(response=>response.json());
  await delay(100);abort.abort();await watch.catch(()=>undefined);
  const after=await coordinatorStatus(target.root,r.id);evidence.disconnects.push({kind:'watch-disconnected-during-worker',at:new Date().toISOString(),id:r.id,threadId:r.threadId,workersBefore:r.workers,workersAfter:after.record.workers,sameIdentity:after.record.id===r.id&&after.record.threadId===r.threadId});workerDone=true;await retain();
 }
 if(!assessmentDone&&status.assessments.some(a=>a.status==='running')){
  const assessment=status.assessments.find(a=>a.status==='running');const {runtime}=await readCoordinator(target.root,r.id);
  const client=new Client({name:'real-pilot-observer',version:'1'});await client.connect(new StreamableHTTPClientTransport(new URL(`${runtime.endpoint}/mcp`),{requestInit:{headers:{authorization:`Bearer ${runtime.token}`}}}));
  const detail=await client.callTool({name:'job_detail',arguments:{plan_id:r.planId,job_id:r.jobId}});await client.close();
  await delay(1000);const after=await coordinatorStatus(target.root,r.id);
  evidence.disconnects.push({kind:'mcp-observer-disconnected-during-assessment',at:new Date().toISOString(),id:r.id,threadId:r.threadId,assessmentBefore:assessment,assessmentsAfter:after.assessments,sameIdentity:after.record.id===r.id&&after.record.threadId===r.threadId,registeredJobReadable:!detail.isError});assessmentDone=true;await retain();
 }
 if(r.turn!==null&&r.turn.status!=='inProgress'&&r.pending.length===0){evidence.finishedAt=new Date().toISOString();evidence.last=status;await retain();break;}
 await delay(1500);
}
async function retain(){await writeFile('plans/codex-coordinator-host/iteration-02/pilot-observation.json',JSON.stringify(evidence,null,2)+'\n');}
