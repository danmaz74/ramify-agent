"""Recompute postmortem observations without changing retained run evidence."""

import collections
import hashlib
import json
from pathlib import Path

EVIDENCE = Path('/home/app/ramify-trial-evidence/status-badge-tone-20261009')
OUTPUT = Path(__file__).resolve().parent


def read(path):
    return json.loads(path.read_text())


def rows(path):
    return [json.loads(line) for line in path.read_text().splitlines() if line]


def reference(path, line=None):
    return str(path) + (f':{line}' if line is not None else '')


def main():
    result = read(EVIDENCE / 'result.json')
    run = Path(result['artifacts']['records'])
    store = EVIDENCE / 'collection-review/plans/.harness/session-operations/store'
    correlations = EVIDENCE / 'collection-review/plans/.harness/session-operations/correlations/operations'
    metrics = read(EVIDENCE / 'metrics.json')
    packets = {read(p)['operationId']: (p, read(p)) for p in correlations.glob('*.json')}
    evaluation = {v['invocation']: v for v in metrics['evaluation']['invocations']}
    transcripts = {}
    for path in sorted((run / 'transcripts').glob('*.jsonl')):
        for line, row in enumerate(rows(path), 1):
            transcripts.setdefault(row.get('invocation'), []).append((path, line, row))

    def body(value):
        if value['stored'] == 'inline':
            return value['text']
        path = run / 'blobs' / value['hash']
        content = path.read_bytes()
        assert hashlib.sha256(content).hexdigest() == value['hash']
        return content.decode()

    def classify(scopes):
        categories = set()
        for scope in scopes:
            if '.ramify-architect' in scope:
                categories.add('architect-view')
            elif '.ramify/' in scope or scope.endswith('.ramify'):
                categories.add('api-view')
            elif scope.endswith(('README.md', 'AGENTS.md', 'CLAUDE.md', 'module.ramify')):
                categories.add('other-docs')
            elif '/src/' in scope or scope.endswith(('.ts', '.tsx', '.feature')):
                categories.add('source-tests')
            else:
                categories.add('unclassified-target')
        return next(iter(categories)) if len(categories) == 1 else 'mixed' if categories else 'unknown'

    inventory = []
    tool_calls = []
    all_usage = []
    for path in sorted((run / 'invocations').glob('*/invocation.json')):
        invocation = read(path)
        identity = invocation['id']
        outcome = read(path.parent / 'outcome.json')
        observations = rows(path.parent / 'observations.jsonl')
        usages = [(i, row) for i, row in enumerate(observations, 1) if row['type'] == 'usage']
        for _, row in usages:
            usage = row['data']['usage']
            assert usage['total'] == sum(usage[k] for k in ['input', 'cacheRead', 'cacheWrite', 'output']), identity
        sums = {name: sum(row['data']['usage'][name] for _, row in usages)
                for name in ['input', 'cacheRead', 'cacheWrite', 'output', 'total']}
        assert sums == outcome['usage'], identity
        assert sums == next(v['usage'] for v in result['invocations'] if v['invocation'] == identity), identity
        assert {k: sums[k] for k in ['input', 'cacheRead', 'cacheWrite', 'output']} == evaluation[identity]['usage'], identity
        packet_path, correlation = packets[identity]
        procedures = [entry['key'].removeprefix('procedure:')
                      for entry in invocation['prompt']['manifest']['entries']
                      if entry['kind'] == 'procedure' and entry['delivery'] == 'appended']
        start_rows = [(p, n, row) for p, n, row in transcripts[identity] if row['type'] == 'started']
        assert len(start_rows) == 1
        transcript_path, start_line, started = start_rows[0]
        assert body(started['prompt']) == correlation['packet']['message'], identity
        assert body(started['systemPrompt']) == correlation['packet']['roleInstructions'], identity
        usage_details = []
        for line, row in usages:
            detail = dict(invocation=identity, source=reference(path.parent / 'observations.jsonl', line), **row)
            usage_details.append(detail)
            all_usage.append(detail)
        first = usages[0][1]['data']['usage']
        efficiency = evaluation[identity]['efficiency']
        inventory.append({
            'invocation': identity, 'role': invocation['role'], 'procedures': procedures,
            'work': invocation['work'], 'requested': invocation['session']['requested'],
            'actual': outcome['session']['mode'], 'correlationMode': correlation['mode'],
            'sourcePoint': correlation['source'], 'lineage': {k: started[k] for k in ['continues', 'fork']},
            'sessionOperation': invocation['sessionOperation'], 'usage': sums,
            'firstUsage': first, 'firstUsageSource': usage_details[0]['source'],
            'firstCacheReadShare': first['cacheRead'] / (first['input'] + first['cacheRead'])
                if first['input'] + first['cacheRead'] else None,
            'callCount': len(usages), 'charges': sum(v['data']['charge']['total'] for _, v in usages),
            'chargeMatchesProjection': abs(sum(v['data']['charge']['total'] for _, v in usages) - efficiency['chargeTotal']) < 1e-10,
            'timing': {k: v for k, v in efficiency['timing'].items() if k != 'coverage'},
            'exploration': {k: v for k, v in efficiency['exploration']['metrics'].items() if k != 'coverage'},
            'gaps': evaluation[identity]['gaps'], 'ended': outcome['ended'],
            'promptMessageBytes': len(correlation['packet']['message'].encode()),
            'roleInstructionBytes': len(correlation['packet']['roleInstructions'].encode()),
            'packet': reference(packet_path), 'invocationSource': reference(path),
            'transcriptSource': reference(transcript_path, start_line),
        })
        exploration = {row['data']['callId']: row['data'] for row in observations if row['type'] == 'exploration'}
        results = {row.get('callId'): row for _, _, row in transcripts[identity] if row.get('role') == 'tool-result'}
        for p, n, row in transcripts[identity]:
            for block in row.get('blocks', []):
                if block['type'] != 'tool-call':
                    continue
                call = block['callId']
                observation = exploration.get(call)
                answer = results.get(call)
                tool_calls.append({
                    'invocation': identity, 'role': invocation['role'], 'callId': call,
                    'tool': block['tool'], 'action': block.get('action'),
                    'input': body(block['input']), 'source': reference(p, n),
                    'resultError': answer.get('isError') if answer else None,
                    'resultBodyBytes': sum(len(body(b['body']).encode()) for b in answer.get('blocks', []) if 'body' in b) if answer else None,
                    'exploration': observation,
                    'targetClass': classify(observation.get('resolvedScope', observation.get('requestedScope', []))) if observation else 'not-in-exploration',
                })
    assert len({(x['invocation'], x['callId']) for x in tool_calls}) == len(tool_calls)

    # Native requests are indexed by first ledger reference, and correlated to
    # the last exact delivered task-message text in their ordered input items.
    first_seen = {}
    ledger = store / 'session-ledger.jsonl'
    for line, row in enumerate(rows(ledger), 1):
        for digest in row['event'].get('payloads', []):
            first_seen.setdefault(digest, {'source': reference(ledger, line), 'at': row['at'], 'sequence': row['sequence']})
    native = {}
    for path in sorted((store / 'payloads').iterdir()):
        try:
            payload = read(path)
        except (ValueError, UnicodeDecodeError):
            continue
        if not isinstance(payload, dict) or payload.get('schema') != 'ramify.pi-native-request/1':
            continue
        assert hashlib.sha256(path.read_bytes()).hexdigest() == path.name
        texts = [b.get('text', '') for item in payload['input'] if isinstance(item, dict)
                 for b in item.get('content', []) if isinstance(b, dict)]
        found = [(i, k) for i, text in enumerate(texts) for k, (_, c) in packets.items()
                 if text == c['packet']['message']]
        assert found, path
        identity = max(found)[1]
        native.setdefault(identity, []).append((first_seen[path.name]['sequence'], path, payload))
    for item in inventory:
        requests = sorted(native[item['invocation']], key=lambda v: v[0])
        assert len(requests) == item['callCount'], item['invocation']
        item['nativeRequestSources'] = [reference(p) for _, p, _ in requests]
        item['nativeRequestLedgerSources'] = [first_seen[p.name] for _, p, _ in requests]

    boundaries = []
    by_id = {item['invocation']: item for item in inventory}
    for item in inventory:
        relation = item['lineage']['fork'] or item['lineage']['continues']
        if not relation:
            continue
        parent_id = relation['from']['invocation']
        parent = sorted(native[parent_id], key=lambda v: v[0])[-1]
        child = sorted(native[item['invocation']], key=lambda v: v[0])[0]
        a, b = parent[2]['request'], child[2]['request']
        prefix = 0
        for old, new in zip(a['input'], b['input']):
            if old != new:
                break
            prefix += 1
        boundaries.append({
            'invocation': item['invocation'], 'mode': item['actual'], 'parent': parent_id,
            'firstUsage': item['firstUsage'], 'firstCacheReadShare': item['firstCacheReadShare'],
            'usageSource': item['firstUsageSource'], 'parentNative': reference(parent[1]), 'childNative': reference(child[1]),
            'instructionsEqual': a['instructions'] == b['instructions'], 'toolsEqual': a['tools'] == b['tools'],
            'parentToolNames': [tool.get('name') for tool in a['tools']],
            'childToolNames': [tool.get('name') for tool in b['tools']],
            'parentInputItems': len(a['input']), 'childInputItems': len(b['input']), 'equalLeadingInputItems': prefix,
            'parentInputIsChildPrefix': prefix == len(a['input']),
            'promptCacheKeyEqual': a.get('prompt_cache_key') == b.get('prompt_cache_key'),
            'parentPromptCacheKey': a.get('prompt_cache_key'), 'childPromptCacheKey': b.get('prompt_cache_key'),
            'changedRequestFields': [key for key in sorted(set(a) | set(b)) if a.get(key) != b.get(key)],
        })
    totals = {name: sum(i['usage'][name] for i in inventory) for name in ['input', 'cacheRead', 'cacheWrite', 'output', 'total']}
    aggregate = {
        'result': reference(EVIDENCE / 'result.json'), 'records': reference(run),
        'runId': result['provenance']['runId'], 'sourceCommit': result['provenance']['sourceCommit'],
        'usage': totals, 'chargeEstimate': sum(i['charges'] for i in inventory),
        'modelCalls': len(all_usage), 'nativeRequests': sum(len(v) for v in native.values()),
        'toolCalls': len(tool_calls), 'toolNames': dict(collections.Counter(v['tool'] for v in tool_calls)),
        'inventory': inventory, 'boundaries': boundaries,
        'comparisonMethod': 'Exact JSON value equality on ordered native request fields, matched by last delivered message; UTF-8 byte counts, not token estimates.',
    }
    for name, value in [('measurements.json', aggregate), ('tool-calls.json', tool_calls), ('per-call-usage.json', all_usage)]:
        (OUTPUT / name).write_text(json.dumps(value, indent=2) + '\n')
    source_files = [EVIDENCE / 'result.json', EVIDENCE / 'metrics.json', run / 'job.json', run / 'events.jsonl', ledger]
    source_files += sorted((run / 'transcripts').glob('*.jsonl'))
    source_files += sorted((run / 'invocations').glob('*/*.json'))
    source_files += sorted((run / 'invocations').glob('*/observations.jsonl'))
    source_files += [p for group in native.values() for _, p, _ in group]
    hashes = {str(path): hashlib.sha256(path.read_bytes()).hexdigest() for path in sorted(set(source_files))}
    (OUTPUT / 'source-hashes.json').write_text(json.dumps(hashes, indent=2) + '\n')
    print(json.dumps({k: v for k, v in aggregate.items() if k not in ['inventory', 'boundaries']}, indent=2))
    for b in boundaries:
        print(b['invocation'], b['mode'], 'first cached', round(100 * b['firstCacheReadShare'], 1),
              'instructions/tools/input prefix', b['instructionsEqual'], b['toolsEqual'], b['parentInputIsChildPrefix'],
              'cache key equal', b['promptCacheKeyEqual'])


if __name__ == '__main__':
    main()
