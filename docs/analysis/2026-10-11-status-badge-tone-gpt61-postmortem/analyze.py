"""Read retained evidence and write derived postmortem artifacts only."""
import collections
import hashlib
import json
from pathlib import Path

ROOT = Path('/home/app/ramify-trial-evidence/status-badge-tone-gpt61-20261011T104510Z')
RUN = '20261011T104510Z-0e1b47'
JOB = ROOT / f'collection-review/plans/status-badge-tone/.harness/jobs/{RUN}'
SESSION = ROOT / 'collection-review/plans/.harness/session-operations'
OUT = Path(__file__).parent

def read(path):
    return json.loads(path.read_text())

def rows(path):
    return [json.loads(line) for line in path.read_text().splitlines() if line]

def digest(value):
    return hashlib.sha256(json.dumps(value, separators=(',', ':'), ensure_ascii=False).encode()).hexdigest()

def user_texts(native):
    return [''.join(c.get('text', '') for c in item.get('content', []) if isinstance(c, dict))
            for item in native['input'] if item.get('role') == 'user']

native = []
for path in (SESSION / 'store/payloads').iterdir():
    try:
        obj = read(path)
    except (ValueError, UnicodeError):
        continue
    if isinstance(obj, dict) and obj.get('schema') == 'ramify.pi-native-request/1':
        native.append((path, obj))

metrics = read(ROOT / 'metrics.json')
evaluations = {x['invocation']: x for x in metrics['evaluation']['invocations']}
inventory = []
all_usage = []
tools = []
for path in sorted((JOB / 'invocations').glob('*/invocation.json')):
    inv = read(path)
    iid = inv['id']
    outcome = read(path.parent / 'outcome.json')
    correlation = SESSION / f'correlations/operations/{digest([RUN, iid])}.json'
    packet = read(correlation)
    observations = rows(path.parent / 'observations.jsonl')
    usage = [r for r in observations if r['type'] == 'usage']
    all_usage.extend((iid, r) for r in usage)
    task = packet['packet']['message']
    # Match the last user task, excluding first requests for later continuations.
    matches = [(p, n) for p, n in native if user_texts(n) and user_texts(n)[-1] == task]
    matches.sort(key=lambda pair: len(pair[1]['input']))
    first = matches[0] if matches else None
    last = matches[-1] if matches else None
    kinds = [e['key'][10:] for e in inv['prompt']['manifest']['entries']
             if e['key'].startswith('procedure:') and e['delivery'] == 'appended']
    if not kinds:
        # Plan 25: a continuation may inherit its procedure; name the task from its header.
        header = [l for l in task.splitlines() if l.startswith('# Current task:')]
        kinds = [header[0].split(':', 1)[1].strip() + ' (procedure inherited)' if header else 'unknown']
    entry = {
        'invocation': iid, 'role': inv['role'], 'kind': kinds[-1],
        'session': inv['session'], 'operation': inv['sessionOperation'],
        'startedAt': inv['startedAt'], 'outcome': outcome,
        'correlation': str(correlation),
        'currentMessage': inv['prompt']['manifest']['currentMessage'],
        'nativeFirst': str(first[0]) if first else None,
        'nativeLast': str(last[0]) if last else None,
        'nativeRequestCount': len(matches),
        'firstUsage': usage[0] if usage else None,
        'lastUsage': usage[-1] if usage else None,
        'exploration': evaluations[iid]['efficiency']['exploration'],
        'timing': evaluations[iid]['efficiency']['timing'],
        'chargeTotal': evaluations[iid]['efficiency']['chargeTotal'],
        'rejections': [r for r in observations if r['type'] == 'rejection'],
    }
    inventory.append(entry)
    dest = OUT / 'invocations' / iid
    dest.mkdir(parents=True, exist_ok=True)
    (dest / 'packet.json').write_text(json.dumps(packet, indent=2) + '\n')
    (dest / 'task.md').write_text(task)
    if first:
        (dest / 'native-first.json').write_text(json.dumps(first[1], indent=2) + '\n')
    for row in observations:
        if row['type'] == 'tool-start':
            tools.append({'invocation': iid, **row['data']})

by_id = {i['invocation']: i for i in inventory}
boundaries = []
for inv in inventory:
    mode = inv['session']['actual']
    if mode not in ('continued', 'fork'):
        continue
    iid = inv['invocation']
    corr = read(Path(inv['correlation']))
    src = corr['source']
    parent = None
    if src:
        # Correlation source is a harness session point reference.
        ref = json.loads(src) if isinstance(src, str) else src
        point = ref.get('point', ref)
        sid = point.get('sessionId')
        turn = point.get('turn')
        candidates = [i for i in inventory if i['operation']['sessionId'] == sid
                      and i['outcome']['sessionOperation']['point']['turn'] == turn]
        parent = candidates[0] if candidates else None
    child_request = read(Path(inv['nativeFirst'])) if inv['nativeFirst'] else None
    parent_request = read(Path(parent['nativeLast'])) if parent and parent['nativeLast'] else None
    prefix = None
    if child_request and parent_request:
        a, b = parent_request, child_request
        prefix = {
            'parent': parent['invocation'], 'parentNativeLast': parent['nativeLast'],
            'instructionsEqual': a['instructions'] == b['instructions'],
            'toolsEqual': a['tools'] == b['tools'],
            'parentInputItems': len(a['input']), 'childInputItems': len(b['input']),
            'parentInputPreservedAsPrefix': b['input'][:len(a['input'])] == a['input'],
            'requestModelEqual': a['request']['model'] == b['request']['model'],
            'parentInstructionsBytes': len(a['instructions'].encode()),
            'childInstructionsBytes': len(b['instructions'].encode()),
            'providerInstructionsEqual': a['request']['instructions'] == b['request']['instructions'],
            'providerToolsEqual': a['request']['tools'] == b['request']['tools'],
            'providerInputPreservedAsPrefix': b['request']['input'][:len(a['request']['input'])] == a['request']['input'],
            'promptCacheKeyEqual': a['request'].get('prompt_cache_key') == b['request'].get('prompt_cache_key'),
            'parentLastUsageAt': parent['lastUsage']['at'],
            'childFirstUsageAt': inv['firstUsage']['at'],
        }
    u = inv['firstUsage']['data']['usage']
    boundaries.append({'invocation': iid, 'kind': inv['kind'], 'mode': mode,
                       'source': src, 'firstUsage': u,
                       'firstCharge': inv['firstUsage']['data'].get('charge'),
                       'cacheShare': u['cacheRead'] / (u['input'] + u['cacheRead']),
                       'prefix': prefix})

events = [r.get('event', r) for r in rows(JOB / 'events.jsonl')]
totals = {k: sum(i['outcome']['usage'][k] for i in inventory)
          for k in ['input', 'cacheRead', 'cacheWrite', 'output', 'total']}
call_totals = {k: sum(r['data']['usage'][k] for _, r in all_usage) for k in totals}
tool_keys = [(x['invocation'], x['callId']) for x in tools]
snapshot_keys = [(x['invocation'], x['callId']) for x in tools if x['tool'].startswith('snapshot_')]
exploration_keys = [(i['invocation'], o['callId']) for i in inventory
                    for o in i['exploration']['observations']]
snapshot_exact_once = all(exploration_keys.count(k) == 1 for k in snapshot_keys)
no_match_results = []
for path in sorted((JOB / 'transcripts').glob('*.jsonl')):
    for line, row in enumerate(rows(path), 1):
        if row.get('role') != 'tool-result' or row.get('tool') not in ('grep', 'snapshot_search'):
            continue
        texts = []
        for block in row.get('blocks', []):
            if block.get('type') != 'text':
                continue
            body = block['body']
            texts.append(body['text'] if body['stored'] == 'inline'
                         else (JOB / 'blobs' / body['hash']).read_text())
        if ''.join(texts).strip() == 'No matches found':
            no_match_results.append({'invocation': row['invocation'], 'callId': row['callId'],
                                     'transcript': str(path), 'line': line, 'isError': row.get('isError')})
summary = {
    'run': RUN, 'nativePayloads': len(native), 'modelCalls': len(all_usage),
    'usageTotals': totals, 'callUsageTotals': call_totals,
    'usageReconciles': totals == call_totals,
    'estimatedCostUSD': sum(i['chargeTotal'] for i in inventory),
    'toolCalls': len(set(tool_keys)), 'toolStarts': len(tools),
    'toolKinds': dict(collections.Counter(t['tool'] for t in tools)),
    'snapshotCalls': sum(t['tool'].startswith('snapshot_') for t in tools),
    'snapshotCallsRecordedExactlyOnce': snapshot_exact_once,
    'recordedZeroMatchSearches': sum(i['exploration']['zeroMatchSearches'] for i in inventory),
    'explicitNoMatchResults': no_match_results,
    'snapshotExplorationRows': sum(o['kind'] in ['read', 'list', 'search', 'diff']
                                    for i in inventory if i['role'] in ['reviewer', 'nonfunctional-coordinator']
                                    for o in i['exploration']['observations']),
    'boundaries': boundaries,
    'events': [{'type': e['type'], 'at': e['at'], 'data': e.get('data')}
               for e in events if e['type'] in ['job-started', 'job-completed', 'gate-started',
                    'gate-attempted', 'readiness-passed', 'work-item-completed', 'invocation-ended',
                    'submission-rejected', 'obligation-bound', 'review-attempt-finished']],
    'explorationTotals': {k: sum(i['exploration']['metrics'][k] for i in inventory)
                          for k in ['reads', 'searches', 'returnedBytes', 'toolElapsedMs',
                                    'repeatedReads', 'broadSearches', 'outsideScopeSearches']},
}
(OUT / 'inventory.json').write_text(json.dumps(inventory, indent=2) + '\n')
(OUT / 'summary.json').write_text(json.dumps(summary, indent=2) + '\n')
(OUT / 'tools.json').write_text(json.dumps(tools, indent=2) + '\n')
print(json.dumps({k: v for k, v in summary.items() if k != 'events'}, indent=2))
