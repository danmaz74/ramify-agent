import { mkdtemp, mkdir, writeFile, readFile } from 'node:fs/promises';
import { tmpdir, homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
const root = process.argv[2] ?? await mkdtemp(join(tmpdir(), 'ramify-coordinate-pilot-'));
const files = {
  'package.json': JSON.stringify({name:'elapsed-labels-pilot',version:'1.0.0',private:true,type:'module',scripts:{test:'node --test src/tests/elapsed.test.js','check:self':'ramify check --batch --root .'},dependencies:{'ramify.ts':'0.5.2','ramify-audit':'0.9.3'}},null,2)+'\n',
  '.npmrc': 'registry=https://npm.braimax.com/\nlegacy-peer-deps=true\n',
  '.gitignore':'node_modules/\nsrc/.ramify/\n.ramify-architect/\n',
  'module.ramify':'ramify 1\nroot module elapsed-labels\nowned-unwired "plans"\n',
  'tsconfig.json':JSON.stringify({compilerOptions:{target:'ES2022',module:'NodeNext',moduleResolution:'NodeNext',allowJs:true,checkJs:false,noEmit:true,skipLibCheck:true},include:['src/**/*.js'],exclude:['node_modules']},null,2)+'\n',
  'src/elapsed.js':'/** Label elapsed whole seconds. */\nexport function formatElapsed(seconds) { return `${seconds}s`; }\n',
  'src/tests/elapsed.test.js':'import {test} from "node:test";\nimport assert from "node:assert/strict";\nimport {formatElapsed} from "../elapsed.js";\ntest("initial seconds label",()=>assert.equal(formatElapsed(30),"30s"));\n',
  'AGENTS.md':'# Elapsed labels\nUse this checkout only. Local source edits, tests and commits for its captured plan are authorized. Preserve module.ramify, package.json, package-lock.json, ramify-audit.json and plan requirements. Use installed Ramify CLI. Tests belong in src/tests. The public function lives in src/elapsed.js. Never edit a harness checkout or global provider configuration. Native Sol delegation is explicitly authorized.\n',
  'plans/elapsed-labels/plan.md':'# Stable elapsed-time labels\nImplement formatElapsed(seconds) in src/elapsed.js to return elapsed whole seconds as HH:MM:SS. Hours may exceed 24 and retain all digits; each field has at least two digits. Floor fractional seconds before formatting. Reject negative and non-finite inputs with RangeError. Keep the function export and add meaningful native node:test cases covering 0, second/minute/hour boundaries, more than 24 hours, fractional values and invalid inputs. Update the initial test to the new contract. Preserve project configuration and audit checks. Coordinate native Sol work and assess its committed candidate through the supplied assisted registration.\n',
  'ramify-audit.json':JSON.stringify({checks:[{id:'elapsed-tests',name:'Elapsed label behavior',scope:'both',category:'deterministic',executor:{kind:'command',commands:[{name:'node-tests',cmd:'npm',args:['test'],parser:'none',timeoutMs:30000}],continueOnFailure:true},onFailure:'record'},{id:'elapsed-structure',name:'Ramify module rules',scope:'both',category:'deterministic',executor:{kind:'command',commands:[{name:'ramify-check',cmd:'npm',args:['run','check:self'],parser:'none',timeoutMs:60000}],continueOnFailure:true},onFailure:'record'}]},null,2)+'\n',
};
for(const [path,body] of Object.entries(files)){await mkdir(join(root,path,'..'),{recursive:true});await writeFile(join(root,path),body);}
const git = args => execFileSync('git',args,{cwd:root,encoding:'utf8'}).trim();
git(['init','-q']);git(['config','user.name','Native pilot']);git(['config','user.email','pilot@example.invalid']);
execFileSync('npm',['install','--ignore-scripts','--no-audit','--no-fund'],{cwd:root,stdio:'inherit'});
execFileSync(join(root,'node_modules/.bin/ramify'),['materialize','--view','architect'],{cwd:root,stdio:'inherit'});
git(['add','.']);git(['commit','-qm','Prepare elapsed-labels real assisted pilot']);
const configPath=join(process.env.CODEX_HOME??join(homedir(),'.codex'),'config.toml');
const metadata={root,planId:'elapsed-labels',baseline:git(['rev-parse','HEAD']),preparedAt:new Date().toISOString(),harnessRoot:resolve('.'),harnessCommit:gitHarness(),globalConfigSha256:createHash('sha256').update(await readFile(configPath)).digest('hex'),assessmentModel:'openai/gpt-6-astra:high'};
function gitHarness(){return execFileSync('git',['rev-parse','HEAD'],{cwd:resolve('.'),encoding:'utf8'}).trim();}
await writeFile('plans/codex-coordinator-host/iteration-02/pilot-target.json',JSON.stringify(metadata,null,2)+'\n');
console.log(JSON.stringify(metadata));
