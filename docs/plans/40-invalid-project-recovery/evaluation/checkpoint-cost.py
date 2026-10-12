#!/usr/bin/env python3
"""Opt-in filesystem experiment; no production checkpoint or test-discovery entry.

Python inventory mirrors projectMutationSnapshot's observation scope. Store trials
model fsynced exclusive blobs, not Node ContentStore timings or integrated locks.
Native Git/Ramify diagnosis is enabled only by --native-witness.
"""
import argparse, base64, hashlib, json, os, pathlib, platform, statistics
import subprocess, tempfile, time, io, tarfile

EXCLUDED = {'.git', 'node_modules', '.ramify', '.ramify-architect'}
def digest(data): return hashlib.sha256(data).hexdigest()
def encoded(value): return json.dumps(value, sort_keys=True, separators=(',', ':')).encode()
def excluded(name):
    parts = pathlib.PurePosixPath(name).parts
    return any(p in EXCLUDED for p in parts) or (len(parts) >= 2 and parts[0] == 'plans' and (parts[1] == '.harness' or (len(parts) >= 3 and parts[2] == '.harness')))
def inventory(root, bodies=False):
    entries, payloads, gaps, size = {}, {}, [], 0
    def walk(directory):
        nonlocal size
        for path in sorted(directory.iterdir()):
            name = path.relative_to(root).as_posix()
            if excluded(name): continue
            try:
                if path.is_symlink(): entries[name] = {'kind':'symlink', 'target':os.readlink(path)}
                elif path.is_dir(): walk(path)
                elif path.is_file():
                    data = path.read_bytes(); size += len(data)
                    entries[name] = {'kind':'file', 'hash':digest(data), 'bytes':len(data)}
                    if bodies: payloads[name] = data
                else: gaps.append({'path':name, 'reason':'unsupported entry'})
            except OSError as error: gaps.append({'path':name, 'reason':str(error)})
    walk(root)
    return {'entries':entries, 'identity':digest(encoded(entries)), 'bytesHashed':size, 'gaps':gaps}, payloads
def timed(fn):
    start = time.perf_counter_ns(); result = fn()
    return result, (time.perf_counter_ns()-start)/1e6
def put(store, data, known):
    key = digest(data)
    if key in known: return 0
    path = store / key
    # Faithful restart cost: write+fsync a temporary even when target exists.
    fd, temporary = tempfile.mkstemp(dir=store)
    try:
        with os.fdopen(fd, 'wb') as stream:
            stream.write(data); stream.flush(); os.fsync(stream.fileno())
        try: os.link(temporary, path); created = len(data)
        except FileExistsError: created = 0
        directory = os.open(store, os.O_RDONLY)
        try: os.fsync(directory)
        finally: os.close(directory)
    finally: os.unlink(temporary)
    known.add(key)
    return created
def capture(root, store, known, representation='raw', bounds=None):
    snap, payloads = inventory(root, True)
    retained, gaps, original, transformed, stored = {}, [], 0, 0, 0
    limits = bounds or {'fileBytes':float('inf'), 'totalBytes':float('inf'), 'entries':float('inf')}
    for position, (name, entry) in enumerate(snap['entries'].items()):
        reason = None
        if position >= limits['entries']: reason = 'entry-count'
        elif entry['kind'] == 'file' and entry['bytes'] > limits['fileBytes']: reason = 'file-size'
        elif entry['kind'] == 'file' and original + entry['bytes'] > limits['totalBytes']: reason = 'total-bytes'
        if reason: gaps.append({'path':name, 'reason':reason, 'bytes':entry.get('bytes',0)}); continue
        retained[name] = entry
        if entry['kind'] == 'file':
            data = payloads[name]; original += len(data)
            if representation == 'base64': data = encoded({'encoding':'base64', 'sha256':entry['hash'], 'data':base64.b64encode(data).decode()})
            transformed += len(data); stored += put(store, data, known)
    manifest = encoded(retained); stored += put(store, manifest, known)
    return {'inputIdentity':snap['identity'], 'manifestHash':digest(manifest), 'bytesHashed':snap['bytesHashed']+transformed+len(manifest), 'sourceBytes':snap['bytesHashed'], 'retainedSourceBytes':original, 'transformedBytes':transformed, 'newStoredBytes':stored, 'manifestBytes':len(manifest), 'entries':len(snap['entries']), 'retainedEntries':len(retained), 'gaps':snap['gaps']+gaps}
def restore_read(store, manifest_hash):
    body=(store/manifest_hash).read_bytes()
    if digest(body)!=manifest_hash: raise ValueError('manifest corruption')
    manifest=json.loads(body); read_bytes=0
    for name,entry in manifest.items():
        if entry['kind']=='file':
            data=(store/entry['hash']).read_bytes(); read_bytes+=len(data)
            if digest(data)!=entry['hash'] or len(data)!=entry['bytes']: raise ValueError('blob corruption')
    return {'entries':len(manifest),'bytesReadAndVerified':read_bytes,'manifestHash':manifest_hash,'allReferencesVerified':True}
def diff(a,b):
    result = {}
    for name in sorted(a.keys() | b.keys()):
        if name not in a: result[name]='added'
        elif name not in b: result[name]='deleted'
        elif a[name]['kind'] != b[name]['kind']: result[name]='type-changed'
        elif a[name] != b[name]: result[name]='changed'
    return result
def summary(samples):
    return {'medianMs':statistics.median(samples), 'minMs':min(samples), 'maxMs':max(samples), 'samplesMs':samples}
def workload(root, scratch, label, count):
    before, _ = inventory(root)
    store = scratch / ('store-'+label); store.mkdir()
    known = set(); trials = []
    for i in range(count+1):
        snap, latency = timed(lambda:inventory(root))
        # Every fresh trial has empty storage: report initial durability cost.
        trial_store = scratch / (label+'-fresh-'+str(i)); trial_store.mkdir()
        initial, initial_ms = timed(lambda:capture(root, trial_store, set()))
        retained, retained_ms = timed(lambda:capture(root, store, known))
        fence, fence_ms = timed(lambda:inventory(root))
        trials.append({'warmup':i==0, 'snapshotMs':latency, 'initialCaptureMs':initial_ms, 'repeatCaptureMs':retained_ms, 'fenceMs':fence_ms, 'stable':snap[0]['identity']==initial['inputIdentity']==retained['inputIdentity']==fence[0]['identity'], 'initial':initial, 'repeat':retained})
    resumed, resume_ms = timed(lambda:capture(root,store,set()))
    readback, readback_ms = timed(lambda:restore_read(store,resumed['manifestHash']))
    b64store = scratch / ('b64-'+label); b64store.mkdir()
    b64, b64_ms = timed(lambda:capture(root,b64store,set(),'base64'))
    bounds = []
    for file_mib,total_mib,entries in [(1,8,1000),(8,64,5000),(64,256,20000)]:
        bounded = scratch / ('bounded-'+label+'-'+str(file_mib)); bounded.mkdir()
        limit={'fileBytes':file_mib*1024**2, 'totalBytes':total_mib*1024**2, 'entries':entries}
        result, ms = timed(lambda:capture(root,bounded,set(),bounds=limit))
        bounds.append({'experimentalBounds':limit, 'ms':ms, **result})
    after, _ = inventory(root)
    return {'label':label,'root':str(root),'initialInventory':before,'finalIdentity':after['identity'],'stableAcrossTrial':before['identity']==after['identity'], 'trials':trials, 'snapshot':summary([r['snapshotMs'] for r in trials[1:]]), 'initialCapture':summary([r['initialCaptureMs'] for r in trials[1:]]), 'repeatCapture':summary([r['repeatCaptureMs'] for r in trials[1:]]), 'fence':summary([r['fenceMs'] for r in trials[1:]]), 'resume':{'ms':resume_ms,**resumed},'resumeRead':{'ms':readback_ms,**readback},'base64':{'ms':b64_ms,**b64},'bounds':bounds}
def synth(root, files, per_file):
    root.mkdir(); (root/'src').mkdir()
    for i in range(files):
        # Four identical groups demonstrate content dedup, not all-unique worst case.
        data=(f'// group {i%4}\n'.encode()+b'x'*per_file)[:per_file]
        (root/'src'/f'f{i:05}.ts').write_bytes(data)
    (root/'large.bin').write_bytes(bytes(range(256))*65536) # 16 MiB, non-UTF8
    (root/'large.txt').write_bytes(b'large\n'*(32*1024**2//6))
    (root/'alias').symlink_to('src/f00000.ts')
def edits(root,scratch,label):
    store=scratch/('edit-store-'+label); store.mkdir(); known=set()
    baseline, bodies=inventory(root,True); checkpoint=capture(root,store,known)
    first=root/'src/f00000.ts'; original=first.read_bytes(); rows=[]
    actions=[lambda:first.write_bytes(b'invalid export {\n'),lambda:(root/'src/new.ts').write_bytes(b'export {\n'),lambda:(root/'src/f00001.ts').unlink(),lambda:first.write_bytes(b'invalid again {\n'),lambda:first.write_bytes(original),lambda:(root/'alias').unlink(),lambda:(root/'alias').write_bytes(b'type changed'),lambda:(root/'large.bin').write_bytes(b'\xff\x00\x80')]
    for number,action in enumerate(actions):
        _, before_ms=timed(lambda:inventory(root)); _,write_ms=timed(action)
        (current,_),after_ms=timed(lambda:inventory(root))
        result,added_ms=timed(lambda:capture(root,store,known))
        changes, diff_ms=timed(lambda:diff(baseline['entries'],current['entries']))
        rows.append({'step':number+1,'baselineBeforeAfterMs':before_ms+after_ms,'writeMs':write_ms,'additiveCaptureMs':added_ms,'diffMs':diff_ms,'netDiff':changes,**result})
    resumed, resumed_ms=timed(lambda:restore_read(store,checkpoint['manifestHash']))
    old=(store/baseline['entries']['src/f00000.ts']['hash']).read_bytes()
    return {'label':label+'-invalid-byte-edits-not-provider-verdicts','capturePolicy':'hypothetical per-write capture upper-cost probe; active checkpoint reference remains initial baseline, never promoted on invalid steps','activeCheckpointManifest':checkpoint['manifestHash'],'resumeReadInitialCheckpoint':{'ms':resumed_ms,**resumed},'originalFirstFileRecoveredExactly':old==original,'steps':rows,'restoredFirstFileAbsentFromNetDiff':'src/f00000.ts' not in rows[-1]['netDiff']}
def command(argv,cwd):
    start=time.perf_counter_ns(); answer=subprocess.run(argv,cwd=cwd,capture_output=True,text=True)
    return {'argv':list(map(str,argv)),'cwd':str(cwd),'exit':answer.returncode,'ms':(time.perf_counter_ns()-start)/1e6,'stdout':answer.stdout,'stderr':answer.stderr}
def witness(repo,scratch):
    root=scratch/'diagnosis'; root.mkdir()
    fixture=json.loads((repo/'docs/plans/40-invalid-project-recovery/evidence/query-control-fixture.json').read_text())
    for entry in fixture['files']:
        path=root/entry['path']; path.parent.mkdir(parents=True,exist_ok=True); path.write_text(entry['content'])
    commands=[command(['git','init','-q'],root),command(['git','add','.'],root),command(['git','-c','user.name=Probe','-c','user.email=probe@example.invalid','commit','-qm','accepted boundary'],root)]
    dirty=b'// operator adjustment not read by engineer\nexport const value: number = 19;\n'
    (root/'src/index.ts').write_bytes(dirty)
    cli=repo/'node_modules/.bin/ramify'
    precheck,_=inventory(root)
    checks=[command([str(cli),'check','--batch','--root',str(root)],root)]
    baseline,_=inventory(root,True)
    # Shell command discloses replacement bytes only; its stdout is empty.
    overwrite=command(['sh','-c',"printf 'export {\\n' > src/index.ts"],root)
    checks.append(command([str(cli),'check','--batch','--root',str(root)],root))
    commands += [command(['git','status','--porcelain'],root),command(['git','diff','--','src/index.ts'],root),command(['git','show','HEAD:src/index.ts'],root)]
    current,_=inventory(root)
    return {'baselineBytes':dirty.decode(),'baselineHash':digest(dirty),'acceptedBytes':fixture['files'][-1]['content'],'currentBytes':(root/'src/index.ts').read_text(),'baselineInventoryIdentity':baseline['identity'],'prePostCheckInventoryEqual':precheck['identity']==baseline['identity'],'netDiff':diff(baseline['entries'],current['entries']),'commands':commands,'overwrite':overwrite,'checks':checks,'claim':'Exact intermediate bytes unavailable from this command/output, HEAD, diff and hash-only mutations; prior read/edit transcripts could supply them in other cases.'}
def main():
    parser=argparse.ArgumentParser(); parser.add_argument('--repo',type=pathlib.Path,required=True); parser.add_argument('--output',type=pathlib.Path,required=True); parser.add_argument('--samples',type=int,default=5); parser.add_argument('--native-witness',action='store_true'); args=parser.parse_args()
    if args.samples<1 or args.output.exists(): parser.error('positive samples and new output required')
    repo=args.repo.resolve(); started=time.time(); scratch=pathlib.Path(tempfile.mkdtemp(prefix='plan40-checkpoint-'))
    frozen=scratch/'committed-source'; frozen.mkdir()
    consumer='39dfae593e836fbe98b74830c17e865550d6e7d2'
    archive=subprocess.run(['git','archive',consumer],cwd=repo,capture_output=True,check=True).stdout
    with tarfile.open(fileobj=io.BytesIO(archive)) as stream:
        for member in stream.getmembers():
            target=frozen/member.name
            if not target.resolve().is_relative_to(frozen): raise ValueError('archive path escape')
            if member.isdir(): target.mkdir(parents=True,exist_ok=True)
            elif member.isfile():
                target.parent.mkdir(parents=True,exist_ok=True); target.write_bytes(stream.extractfile(member).read())
            elif member.issym():
                target.parent.mkdir(parents=True,exist_ok=True); target.symlink_to(member.linkname)
            else: raise ValueError('unsupported archive entry')
    small=scratch/'small'; large=scratch/'large'; synth(small,128,8192); synth(large,4096,16384)
    # Small control omits large payloads; large control retains both.
    (small/'large.bin').unlink(); (small/'large.txt').unlink()
    evidence={'schema':'plan40.checkpoint-cost/1','startedUtc':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime(started)),'host':{'platform':platform.platform(),'python':platform.python_version(),'cpuCount':os.cpu_count()},'scratch':str(scratch),'frozenConsumer':consumer,'archiveSha256':digest(archive),'sourceIdentity':command(['git','rev-parse','HEAD'],repo),'dirtyBefore':command(['git','status','--porcelain'],repo),'providerPin':json.loads((repo/'package.json').read_text())['dependencies']['ramify.ts'],'scriptSha256':digest(pathlib.Path(__file__).read_bytes()),'scope':'projectMutationSnapshot exclusions; empty directories unobserved; Python mirror, not production Node integration; actual workloads from git archive committed tracked content, excludes untracked/ignored files','cache':'one warmup; OS cache uncontrolled; no cold claim','workloads':[]}
    for label,root in [('synthetic-small',small),('synthetic-large',large),('actual-small-fixture',frozen/'subs/harness/fixtures/collection-review'),('actual-large-committed-source',frozen)]: evidence['workloads'].append(workload(root,scratch,label,args.samples))
    evidence['invalidEdits']=[edits(small,scratch,'small'),edits(large,scratch,'large')]
    if args.native_witness: evidence['diagnosis']=witness(repo,scratch)
    binary=bytes(range(256)); evidence['binaryFidelity']={'originalBytes':len(binary),'utf8RoundtripEqual':binary.decode('utf8',errors='replace').encode()==binary,'base64RoundtripEqual':base64.b64decode(base64.b64encode(binary))==binary}
    evidence['dirtyAfter']=command(['git','status','--porcelain'],repo); evidence['elapsedSeconds']=time.time()-started
    args.output.parent.mkdir(parents=True,exist_ok=True)
    with args.output.open('x') as stream: json.dump(evidence,stream,indent=2)
    print(json.dumps({'output':str(args.output),'scratch':str(scratch),'elapsedSeconds':evidence['elapsedSeconds'],'workloads':[{ 'label':w['label'],'snapshotMedianMs':w['snapshot']['medianMs'],'captureMedianMs':w['initialCapture']['medianMs'],'stable':w['stableAcrossTrial']} for w in evidence['workloads']]}))
if __name__=='__main__': main()
