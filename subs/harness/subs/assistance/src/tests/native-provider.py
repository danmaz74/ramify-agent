#!/usr/bin/env python3
"""Scripted provider process for exact native ownership witnesses; never model inference."""
import json
import os
import sys
import time
import tomllib
import uuid
from pathlib import Path

root = Path.cwd()
history = root / 'history.json'
thread = None
configuration = {'old-stdio': {'command': 'scripted-original-command'}, 'added-stdio': {'command': 'scripted-additional-command'}}
for index, argument in enumerate(sys.argv):
    if argument == '-c':
        override = tomllib.loads(sys.argv[index + 1])
        for name, entry in override.get('mcp_servers', {}).items():
            configuration.setdefault(name, {}).update(entry)
for name, entry in configuration.items():
    if 'command' not in entry and 'url' not in entry:
        raise RuntimeError('invalid transport in mcp_servers.' + name)
host_mode = True
turn_number = 0
orphan_started = False

def output(value):
    print(json.dumps(value), flush=True)


def orphan():
    (root / 'writer.pid').unlink(missing_ok=True)
    parent = os.fork()
    if parent == 0:
        pid = os.fork()
        if pid != 0:
            os._exit(0)
        os.setsid()
        # Deliberately close provider pipes: process exit must not imply child exit.
        for fd in (0, 1, 2):
            try:
                os.close(fd)
            except OSError:
                pass
        (root / 'writer.pid').write_text(str(os.getpid()))
        while True:
            (root / 'heartbeat').write_text(str(time.monotonic_ns()))
            time.sleep(0.01)
    os.waitpid(parent, 0)
    deadline = time.monotonic() + 3
    while not (root / 'writer.pid').exists():
        if time.monotonic() > deadline:
            raise RuntimeError('orphan startup timed out')
        time.sleep(0.005)


for line in sys.stdin:
    request = json.loads(line)
    method = request.get('method')
    if 'id' not in request:
        continue
    params = request.get('params', {})
    if method == 'initialize':
        result = {'userAgent': 'native-script/1', 'codexHome': str(root), 'platformOs': 'linux'}
    elif method == 'model/list':
        result = {'data': [{'model': 'gpt-6-astra', 'multiAgentVersion': 'v2'}, {'model': 'gpt-6-sol', 'multiAgentVersion': 'v2'}], 'nextCursor': None}
    elif method == 'experimentalFeature/list':
        result = {'data': [{'name': 'multi_agent', 'enabled': True}], 'nextCursor': None}
    elif method == 'mcpServerStatus/list':
        tools = {name: {} for name in ('plan_executions', 'job_detail', 'iteration', 'iteration_assess', 'assessment_wait', 'assessment_result')}
        result = {'data': [{'name': name, 'tools': tools, 'toolsError': None} for name, entry in configuration.items() if entry.get('enabled', True) and 'url' in entry], 'nextCursor': None}
    elif method == 'config/read':
        result = {'config': {'model': 'gpt-6-astra', 'approval_policy': 'on-request', 'sandbox_mode': 'workspace-write', 'mcp_servers': configuration}}
    elif method in ('thread/start', 'thread/resume'):
        if method == 'thread/start':
            thread = {'id': 'persistent-native-thread' if not (root / 'writer.pid').exists() else 'persistent-native-thread-' + uuid.uuid4().hex, 'parentThreadId': None, 'ephemeral': params['ephemeral'], 'cwd': params['cwd'], 'model': params['model'],
                      'cliVersion': 'native-script/1', 'status': {'type': 'idle'}, 'turns': []}
        else:
            if not history.exists():
                output({'id': request['id'], 'error': {'code': -32600, 'message': 'no rollout found for thread id ' + params['threadId']}})
                continue
            thread = json.loads(history.read_text())
            turn_number = max([int(turn['id'].rsplit('-', 1)[-1]) for turn in thread['turns'] if turn['id'].rsplit('-', 1)[-1].isdigit()] or [0])
        history.write_text(json.dumps(thread))
        result = {'thread': thread, 'model': params['model'], 'instructionSources': [], 'approvalPolicy': 'on-request', 'sandbox': {'type': 'workspaceWrite'}}
    elif method == 'thread/read':
        result = {'thread': json.loads(history.read_text())}
    elif method == 'turn/start':
        message = params['input'][0]['text']
        if not orphan_started:
            orphan()
            orphan_started = True
        turn_number += 1
        turn = {'id': 'native-turn-' + str(turn_number) if host_mode else 'native-turn', 'status': 'inProgress', 'error': None, 'items': [{'id': 'input', 'type': 'userMessage', 'content': params['input']}]}
        thread['turns'].append(turn)
        thread['status'] = {'type': 'active'}
        history.write_text(json.dumps(thread))
        output({'method': 'turn/started', 'params': {'threadId': thread['id'], 'turn': turn}})
        result = {'turn': turn}
    elif method == 'turn/interrupt':
        thread['turns'][-1]['status'] = 'interrupted'
        thread['status'] = {'type': 'idle'}
        history.write_text(json.dumps(thread))
        output({'method': 'turn/completed', 'params': {'threadId': thread['id'], 'turn': thread['turns'][-1]}})
        result = {}
    else:
        output({'id': request['id'], 'error': {'code': -32601, 'message': method}})
        continue
    if method == 'turn/start' and message == 'hold-ack':
        continue
    output({'id': request['id'], 'result': result})
    if method == 'turn/start' and message == 'exit-with-child':
        os._exit(17)
