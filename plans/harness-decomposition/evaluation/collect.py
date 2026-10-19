#!/usr/bin/env python3
"""Summarize actual Ramify owners; consume retained provider facts, never resolve imports.

python3 collect.py --root CHECKOUT --check check.json[.gz] --measure measure.json \
  --affected affected.json [--compare before.json] > snapshot.json
Capture inputs and materialize all API/architect views first in a stable checkout.
"""
import argparse
import collections
import gzip
import hashlib
import json
import pathlib
import subprocess

p = argparse.ArgumentParser(description=__doc__)
for key in ('root', 'check', 'measure', 'affected'):
    p.add_argument('--' + key, required=True)
p.add_argument('--compare')
a = p.parse_args()
root = pathlib.Path(a.root).resolve()
sha = lambda b: hashlib.sha256(b).hexdigest()
def read(path):
    path = pathlib.Path(path)
    raw = gzip.decompress(path.read_bytes()) if path.suffix == '.gz' else path.read_bytes()
    return json.loads(raw), {'sha256': sha(raw), 'bytes': len(raw)}
def git(*args):
    return subprocess.check_output(['git', '-C', str(root), *args], text=True).strip()
check, ci = read(a.check)
measure, mi = read(a.measure)
affected, ai = read(a.affected)
assert check['outcome']['check'] == 'passed', 'Check did not pass'
inv = {f['path']: f for f in check['snapshot']['inventory']['files']}
measured = {f['path']: f for f in measure['files']}
# Input hashes verify correspondence even when resident and batch IDs differ.
for path, f in inv.items():
    raw = (root / path).read_bytes()
    assert sha(raw) == f['sha256'], f'Stale check inventory: {path}'
    assert measured[path]['bytes'] == len(raw), f'Stale measure inventory: {path}'
files = []
for path, f in sorted(inv.items()):
    raw = (root / path).read_bytes()
    files.append({**{k: f[k] for k in ('path', 'owner', 'area', 'kind', 'sha256')},
                  'bytes': len(raw), 'lines': len(raw.splitlines())})
production = {p: f for p, f in inv.items() if f['area'] == 'ordinary' and f['kind'] == 'source'}
edges, value_edges, test_edges = set(), set(), set()
originals = collections.defaultdict(set)
unresolved = collections.Counter()
for access in check['snapshot']['accesses']:
    source, target = access['importer']['file'], access['target']
    if target['kind'] != 'application':
        continue
    dest = target['origin']['file']
    if source in inv and inv[source]['area'] == 'tests' and dest in production:
        test_edges.add((source, dest))
    if source not in production or dest not in production:
        continue
    edges.add((source, dest))
    selections = access['selections']
    if not selections or any(s['request'] != 'type-only' for s in selections):
        value_edges.add((source, dest))
    owner = production[source]['owner']
    if owner == production[dest]['owner']:
        continue
    for s in selections:
        if s['status'] == 'resolved' and s['original']:
            originals[owner].add(json.dumps(s['original'], sort_keys=True))
        else:
            unresolved[owner] += 1
architect_meta, _ = read(root / '.ramify-architect/_meta.json')
assert architect_meta['revision'] == measure['revision'], 'Architect/measure revision mismatch'
assert architect_meta['input'] == affected['revision']['inputId'], 'Affected/architect input mismatch'
architect = {}
for path in (root / '.ramify-architect').rglob('module.json'):
    module, _ = read(path)
    architect[module['module']] = module
modules = {}
for m in measure['modules']:
    owner = m['id']
    owned = [f for f in files if f['owner'] == owner]
    local = {f['path'] for f in owned if f['area'] == 'ordinary' and f['kind'] == 'source'}
    out = {(s,t) for s,t in edges if s in local and t not in local}
    inc = {(s,t) for s,t in edges if t in local and s not in local}
    tests = {s for s,t in test_edges if t in local}
    arch = architect[owner]
    views = {}
    for area, rel in [('ordinary', 'src/.ramify'), ('tests', 'src/tests/.ramify')]:
        directory = root / arch['dir'] / rel
        if not directory.exists():
            views[area] = {'state': 'missing'}
            continue
        paths = sorted(x for x in directory.rglob('*') if x.is_file())
        meta, _ = read(directory / '_meta.json')
        assert meta['revision'] == measure['revision'], f'Stale API view: {directory}'
        views[area] = {'state': 'captured', 'meta': meta,
            'physicalFiles': len(paths), 'physicalBytes': sum(x.stat().st_size for x in paths),
            'inventorySha256': sha(json.dumps([(str(x.relative_to(directory)),sha(x.read_bytes())) for x in paths]).encode())}
    modules[owner] = {'measurement': m, 'directory': arch['dir'],
        'architecture': {k: arch.get(k) for k in ('parent','children','purpose','docs','symbols','uses','usedBy','tests')},
        'apiViews': views,
        'declaration': {'path': str(pathlib.PurePosixPath(arch['dir']) / 'module.ramify'),
            'sha256': sha((root / arch['dir'] / 'module.ramify').read_bytes()),
            'text': (root / arch['dir'] / 'module.ramify').read_text()},
        'productionDependencies': {'outboundFilePairs': len(out),
            'outboundValueOrSideEffectFilePairs': len(out & value_edges),
            'externalDependencyFiles': len({t for _,t in out}),
            'providers': sorted({production[t]['owner'] for _,t in out}),
            'resolvedImportedOriginals': len(originals[owner]),
            'unresolvedSelectionOccurrences': unresolved[owner],
            'inboundFilePairs': len(inc), 'externalConsumerFiles': len({s for s,_ in inc}),
            'consumers': sorted({production[s]['owner'] for s,_ in inc})},
        'tests': {'ownedSourceFiles': sum(f['area'] == 'tests' and f['kind'] == 'source' for f in owned),
            'directSourceConsumers': len(tests), 'directConsumerPaths': sorted(tests),
            'directConsumersTouchingMultipleProductionOwners': sum(len({production[t]['owner'] for s,t in test_edges if s == test}) > 1 for test in tests)}}
pairs = collections.Counter((production[s]['owner'],production[t]['owner']) for s,t in edges if production[s]['owner'] != production[t]['owner'])
result = {'schema': 'harness-decomposition-actual-ownership/1',
    'producer': {'collectorSha256': sha(pathlib.Path(__file__).read_bytes()), 'python': __import__('platform').python_version(),
        'ramify': subprocess.check_output([str(root/'node_modules/.bin/ramify'),'--version'],text=True).strip()},
    'source': {'commit': git('rev-parse','HEAD'), 'tree': git('rev-parse','HEAD^{tree}'),
        'inventorySha256': sha(json.dumps(files,sort_keys=True).encode()),
        'trackedChanges': git('status','--porcelain','--untracked-files=no'),
        'providerPins': {k:v for k,v in json.loads((root/'package.json').read_text())['dependencies'].items() if k in ('ramify.ts','ramify-audit')}},
    'units': {'bytes': 'raw file bytes', 'lines': 'physical splitlines including comments/blanks',
        'dependencies': 'distinct directed production file pairs; application accesses only; includes types',
        'originals': 'distinct resolved original identities imported from other owners; not API exposure count',
        'tests': 'owned source files and direct testing imports; helpers included; not transitive reach',
        'views': 'measure buckets are producer context sizes; physical catalog bytes include metadata'},
    'coverage': {'checkOutcome': check['outcome'], 'checkSummary': check['summary'],
        'codes': dict(collections.Counter(c['code'] for c in check['coverage'])),
        'operationalBenefit': 'unmeasured; structural counts do not establish effort, speed or token savings'},
    'inputs': {'check': {**ci,'inputId':check['inputId'],'schema':check['schemaVersion']},
        'measure': {**mi,'revision':measure['revision'],'schema':measure['schema']},
        'affected': {**ai,'schema':affected['schemaVersion']}, 'architectMeta': architect_meta},
    'modules': modules, 'moduleEdges': [{'from':s,'to':t,'filePairs':n} for (s,t),n in sorted(pairs.items())],
    'affectedWitness': affected, 'files': files}
if a.compare:
    before, bi = read(a.compare)
    before_files = {f['path']: f for f in before['files']}
    result['comparison'] = {'beforeSha256':bi['sha256'], 'beforeSource':before['source'],
        'addedOwners': sorted(modules.keys()-before['modules'].keys()),
        'removedOwners': sorted(before['modules'].keys()-modules.keys()),
        'samePathOwnershipChanges': [{'path':f['path'],'before':old['owner'],'after':f['owner']} for f in files if (old := before_files.get(f['path'])) and f['owner']!=old['owner']],
        'limitation': 'Compare retained module buckets and dependency counts by identity; moved files are not new delivered work. No guessed responsibility allocation or operational effect.'}
print(json.dumps(result,indent=2))
