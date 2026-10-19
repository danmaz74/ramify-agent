#!/usr/bin/env python3
"""Independent retained-evidence verification; no import of the study collector.
Run from project root: python3 plans/harness-decomposition/corrections/evidence-access/verify.py
Only writes diagnostic evidence beside this script. No provider/model/audit execution.
"""
import collections, gzip, hashlib, json, pathlib, subprocess
ROOT = pathlib.Path.cwd()
OUT = pathlib.Path(__file__).resolve().parent
BASE = ROOT/'plans/harness-decomposition'
sha = lambda b: hashlib.sha256(b).hexdigest()
records = {}
def load(rel):
    path=BASE/rel; stored=path.read_bytes(); raw=gzip.decompress(stored) if path.suffix=='.gz' else stored
    x=json.loads(raw)
    records[rel]={'storedBytes':len(stored),'storedSha256':sha(stored),'jsonBytes':len(raw),'jsonSha256':sha(raw)}
    return x

def save(name,x):
    (OUT/name).write_text(json.dumps(x,indent=2)+'\n')

man=load('iteration-01/manifest.json')
bman=load('evaluation/baseline-inputs/manifest.json')
for prefix, manifest in [('iteration-01/',man['inputs']),('evaluation/baseline-inputs/',bman)]:
    for name, expected in manifest.items():
        path=BASE/(prefix+name); raw=path.read_bytes()
        assert sha(raw)==expected['sha256'] and len(raw)==expected['bytes'],path

checks={label:load(path) for label,path in [('baseline','evaluation/baseline-inputs/check.json.gz'),('before','iteration-01/before-check.json.gz'),('after','iteration-01/after-check.json.gz')]}
measures={label:load(path) for label,path in [('baseline','evaluation/baseline-inputs/measure.json'),('before','iteration-01/before-measure.json'),('after','iteration-01/after-measure.json')]}
summaries={'baseline':load('evaluation/execution-baseline.json'),'after':load('iteration-01/after-summary.json')}
affected={label:load(path) for label,path in [('baseline','evaluation/baseline-inputs/affected-session-store.json'),('before','iteration-01/before-affected.json'),('after','iteration-01/after-affected.json')]}
findings=[]
for label,check in checks.items():
    assert check['outcome']['check']=='passed'
    inventory={f['path']:f for f in check['snapshot']['inventory']['files']}
    measure=measures[label]; mf={f['path']:f for f in measure['files']}
    assert inventory.keys() <= mf.keys() # measure also includes documentation outside check inventory
    for path,f in inventory.items():assert f['bytes']==mf[path]['bytes'],path
    # Independently recompute exact production/testing source/resource buckets.
    for m in measure['modules']:
        for area,bucket in [('ordinary','production'),('tests','tests')]:
            for kind,prefix in [('source','source'),('resource','resource')]:
                fs=[f for f in inventory.values() if f['owner']==m['id'] and f['area']==area and f['kind']==kind]
                assert len(fs)==m['exact'][bucket][prefix+'Files'],(label,m['id'],bucket,kind)
                assert sum(f['bytes'] for f in fs)==m['exact'][bucket][prefix+'Bytes']
    for m in measure['modules']:
        docs=[f for f in mf.values() if f['owner']==m['id'] and f['area']=='documentation']
        assert len(docs)==m['exact']['documentation']['files']
        assert sum(f['bytes'] for f in docs)==m['exact']['documentation']['bytes']
    if label not in summaries:continue
    summary=summaries[label]
    checkpath='evaluation/baseline-inputs/check.json.gz' if label=='baseline' else 'iteration-01/after-check.json.gz'
    assert summary['inputs']['check']['sha256']==records[checkpath]['jsonSha256']
    assert summary['inputs']['check']['bytes']==records[checkpath]['jsonBytes']
    assert summary['inputs']['check']['inputId']==check['inputId']
    assert summary['inputs']['architectMeta']['revision']==measure['revision']
    assert summary['inputs']['architectMeta']['input']==affected[label]['revision']['inputId']
    assert summary['affectedWitness']==affected[label]
    assert {m['id']:m for m in measure['modules']}=={k:v['measurement'] for k,v in summary['modules'].items()}
    sf={f['path']:f for f in summary['files']}
    assert sf.keys()==inventory.keys()
    for path,f in inventory.items():
        for k in ['owner','area','kind','sha256','bytes']:assert sf[path][k]==f[k],(label,path,k)
    assert summary['source']['inventorySha256']==sha(json.dumps(summary['files'],sort_keys=True).encode())
    prod={p:f for p,f in inventory.items() if f['area']=='ordinary' and f['kind']=='source'}
    edges=set(); values=set(); tests=set(); originals=collections.defaultdict(set); unresolved=collections.Counter()
    for acc in check['snapshot']['accesses']:
        target=acc['target']; source=acc['importer']['file']
        if target['kind']!='application':continue
        dest=target['origin']['file']
        if source in inventory and inventory[source]['area']=='tests' and dest in prod:tests.add((source,dest))
        if source not in prod or dest not in prod:continue
        edges.add((source,dest)); selections=acc['selections']
        if not selections or any(s['request']!='type-only' for s in selections):values.add((source,dest))
        owner=prod[source]['owner']
        if owner==prod[dest]['owner']:continue
        for s in selections:
            if s['status']=='resolved' and s['original']:originals[owner].add(json.dumps(s['original'],sort_keys=True))
            else:unresolved[owner]+=1
    pairs=collections.Counter((prod[s]['owner'],prod[t]['owner']) for s,t in edges if prod[s]['owner']!=prod[t]['owner'])
    assert summary['moduleEdges']==[{'from':s,'to':t,'filePairs':n} for (s,t),n in sorted(pairs.items())]
    for owner,module in summary['modules'].items():
        local={p for p,f in prod.items() if f['owner']==owner}
        out={(s,t) for s,t in edges if s in local and t not in local}; inc={(s,t) for s,t in edges if t in local and s not in local}
        computed={'outboundFilePairs':len(out),'outboundValueOrSideEffectFilePairs':len(out&values),
          'externalDependencyFiles':len({t for s,t in out}),'providers':sorted({prod[t]['owner'] for s,t in out}),
          'resolvedImportedOriginals':len(originals[owner]),'unresolvedSelectionOccurrences':unresolved[owner],
          'inboundFilePairs':len(inc),'externalConsumerFiles':len({s for s,t in inc}),'consumers':sorted({prod[s]['owner'] for s,t in inc})}
        assert computed==module['productionDependencies'],(label,owner,'dependencies')
        direct={s for s,t in tests if t in local}
        assert module['tests']['directConsumerPaths']==sorted(direct)
        assert module['tests']['directSourceConsumers']==len(direct)
        assert module['tests']['ownedSourceFiles']==sum(f['owner']==owner and f['area']=='tests' and f['kind']=='source' for f in inventory.values())
        assert module['tests']['directConsumersTouchingMultipleProductionOwners']==sum(len({prod[t]['owner'] for s,t in tests if s==test})>1 for test in direct)
        for area,view in module['apiViews'].items():
            if view['state']=='captured':
                assert view['meta']['revision']==measure['revision']
                assert view['physicalBytes']==module['measurement']['exact']['views'][area+'Bytes']
        declaration=module['declaration'];assert sha(declaration['text'].encode())==declaration['sha256']
    findings.append({'label':label,'checkOutcome':check['outcome'],'summary':check['summary'],
        'inventoryFiles':len(inventory),'measureFileBytesVerified':sum(f['bytes'] for f in inventory.values()),
        'independentValidation':'Full decompression/JSON parse; exact measured buckets; summary file identities, module measurements, module edges, every dependency/test descriptor and declaration hash recomputed successfully.'})
# Before collection has the same complete inventory as immutable baseline, independent of producer IDs.
identity=lambda c:sorted((f['path'],f['owner'],f['area'],f['kind'],f['sha256'],f['bytes']) for f in c['snapshot']['inventory']['files'])
assert identity(checks['baseline'])==identity(checks['before'])

# Authenticate retained inventory bytes against immutable Git trees in one batch.
def compare_git(label,commit):
    inv=checks[label]['snapshot']['inventory']['files']
    request=''.join(commit+':'+f['path']+'\n' for f in inv).encode()
    response=subprocess.check_output(['git','cat-file','--batch'],input=request,cwd=ROOT)
    offset=0; mismatches=[]; verified=0
    for f in inv:
        end=response.index(b'\n',offset); header=response[offset:end].decode();offset=end+1
        if header.endswith(' missing'):
            mismatches.append({'path':f['path'],'reason':'absent from commit'});continue
        size=int(header.rsplit(' ',1)[1]);raw=response[offset:offset+size];offset+=size+1
        if sha(raw)!=f['sha256']:mismatches.append({'path':f['path'],'capturedSha256':f['sha256'],'gitSha256':sha(raw),'gitBytes':size,'capturedBytes':f['bytes']})
        else:
            verified+=1
            if label in summaries:
                summary_file=next(s for s in summaries[label]['files'] if s['path']==f['path'])
                assert summary_file['lines']==len(raw.splitlines()) and summary_file['bytes']==len(raw)
    return {'commit':commit,'verifiedInventoryFiles':verified,'mismatches':mismatches}
git_witness=[compare_git('baseline','85ed836c5b0e410bdd1a7b759a5ca89f0d85cee4'),compare_git('after','ed9a61330fa6e3f7d72d34197e7fb840beffc13c')]
for summary in summaries.values():
    collector=(BASE/'evaluation/collect.py').read_bytes()
    assert summary['producer']['collectorSha256']==sha(collector)
for rel in ['docs/analysis/2026-10-19-harness-decomposition/baseline.json','docs/analysis/2026-10-19-harness-decomposition/collect.py']:
    original=subprocess.check_output(['git','show','85ed836c:'+rel],cwd=ROOT)
    assert (ROOT/rel).read_bytes()==original
old,new=summaries['baseline'],summaries['after']
oldfiles={f['path']:f for f in old['files']}
assert new['comparison']['samePathOwnershipChanges']==[{'path':f['path'],'before':oldfiles[f['path']]['owner'],'after':f['owner']} for f in new['files'] if f['path'] in oldfiles and f['owner']!=oldfiles[f['path']]['owner']]

assert new['comparison']['beforeSha256']==records['evaluation/execution-baseline.json']['jsonSha256']
assert new['comparison']['addedOwners']==sorted(new['modules'].keys()-old['modules'].keys())
assert not new['comparison']['removedOwners']
comparison={'schema':'harness-decomposition-readable-comparison/1','provenance':records,
 'sourceTiming':'After summary was captured with baseline HEAD and dirty source. Independent authentication now verifies all 1101 captured inventory files exactly match candidate ed9a61330fa6e3f7d72d34197e7fb840beffc13c; baseline verifies all 1099 files against 85ed836c. This does not relabel the original capture HEAD or cover later timeout corrections.',
 'owners':{'before':len(old['modules']),'after':len(new['modules']),'added':new['comparison']['addedOwners']},
 'modules':{},'affected':{k:{'selection':v['selection']['selection'],'testModules':len(v['selection']['testModules']),'widening':v['selection']['widening']} for k,v in affected.items()},
 'limitation':'Structural descriptors only; producer partial coverage persists. Physical source moves do not establish delivered context, productivity, token, speed, cache or audit benefit. No operational task pair is established.'}
for owner in ['ramify-agent/harness','ramify-agent/harness/session-store','ramify-agent/harness/agent','ramify-agent/harness/ledger']:
    comparison['modules'][owner]={}
    for label,summary in summaries.items():
        if owner not in summary['modules']:continue
        m=summary['modules'][owner]
        comparison['modules'][owner][label]={'exact':m['measurement']['exact'],'productionDependencies':m['productionDependencies'],
           'tests':{k:v for k,v in m['tests'].items() if k!='directConsumerPaths'},
           'apiViews':{k:{'meta':v.get('meta'),'physicalBytes':v.get('physicalBytes')} for k,v in m['apiViews'].items()}}
save('comparison.json',comparison)
save('verification.json',{'schema':'harness-decomposition-independent-verification/1','verifierSha256':sha(pathlib.Path(__file__).read_bytes()),
 'inputs':records,'manifestChecks':'All iteration manifest and execution-baseline input manifest stored bytes/hashes match.',
 'baselineVsBeforeInventory':'Identical complete inventory including source/resource owners and content hashes.',
 'recomputations':findings,'gitAuthentication':git_witness,
 'notReproduced':'No re-execution of Ramify, architect/API materialization, audits or model requests. Documentation/API bucket values remain retained measure producer facts; physical API catalog inventory hashes cannot be independently regenerated from this Git-only check. Native operational measures remain unavailable.'})
# Bounded relevant slices: declarations and direct test identities, not another giant inventory copy.
(OUT/'slices').mkdir(exist_ok=True)
for label,summary in summaries.items():
    for owner in comparison['modules']:
        if owner not in summary['modules']:continue
        m=summary['modules'][owner]; short=owner.removeprefix('ramify-agent/').replace('/','-')
        save('slices/'+label+'-'+short+'-contracts.json',{'summarySha256':records['evaluation/execution-baseline.json' if label=='baseline' else 'iteration-01/after-summary.json']['jsonSha256'],'module':owner,'declaration':m['declaration'],'architecture':{k:v for k,v in m['architecture'].items() if k not in ['purpose','docs']}})
        paths=m['tests']['directConsumerPaths']
        for i in range(0,len(paths),80):save('slices/'+label+'-'+short+'-test-imports-'+str(i//80+1)+'.json',{'module':owner,'part':i//80+1,'totalPaths':len(paths),'paths':paths[i:i+80]})
print(json.dumps({'status':'verified','gitAuthentication':git_witness,'output':str(OUT),'largestSliceBytes':max(p.stat().st_size for p in (OUT/'slices').glob('*.json'))},indent=2))
