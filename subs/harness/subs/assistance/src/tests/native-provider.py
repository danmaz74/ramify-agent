#!/usr/bin/env python3
"""Scripted provider process for exact native ownership witnesses; never model inference."""
import json
import os
import sys
import time
from pathlib import Path

root = Path.cwd()
history = root / 'history.json'
thread = None

def output(value):
    print(json.dumps(value), flush=True)


def orphan():
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
        result = {'data': [], 'nextCursor': None}
    elif method == 'config/read':
        result = {'config': {'model': 'gpt-6-astra', 'approval_policy': 'on-request', 'sandbox_mode': 'workspace-write'}}
    elif method in ('thread/start', 'thread/resume'):
        if method == 'thread/start':
            thread = {'id': 'persistent-native-thread', 'parentThreadId': None, 'ephemeral': params['ephemeral'], 'cwd': params['cwd'], 'model': params['model'],
                      'cliVersion': 'native-script/1', 'status': {'type': 'idle'}, 'turns': []}
        else:
            thread = json.loads(history.read_text())
        history.write_text(json.dumps(thread))
        result = {'thread': thread, 'model': params['model'], 'instructionSources': [], 'approvalPolicy': 'on-request', 'sandbox': {'type': 'workspaceWrite'}}
    elif method == 'thread/read':
        result = {'thread': json.loads(history.read_text())}
    elif method == 'turn/start':
        message = params['input'][0]['text']
        orphan()
        turn = {'id': 'native-turn', 'status': 'inProgress', 'error': None, 'items': [{'id': 'input', 'type': 'userMessage', 'content': params['input']}]}
        thread['turns'] = [turn]
        thread['status'] = {'type': 'active'}
        history.write_text(json.dumps(thread))
        output({'method': 'turn/started', 'params': {'threadId': thread['id'], 'turn': turn}})
        result = {'turn': turn}
    elif method == 'turn/interrupt':
        thread['turns'][0]['status'] = 'interrupted'
        thread['status'] = {'type': 'idle'}
        history.write_text(json.dumps(thread))
        output({'method': 'turn/completed', 'params': {'threadId': thread['id'], 'turn': thread['turns'][0]}})
        result = {}
    else:
        output({'id': request['id'], 'error': {'code': -32601, 'message': method}})
        continue
    output({'id': request['id'], 'result': result})
    if method == 'turn/start' and message == 'exit-with-child':
        os._exit(17)
