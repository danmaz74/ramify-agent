#!/usr/bin/env python3
"""Dedicated Linux subreaper. Provider stdio is inherited; fd3/4 are private control/status."""
import ctypes
import json
import os
import select
import signal
import subprocess
import sys
import time


def status(value):
    global stopping
    try:
        os.write(4, (json.dumps(value, separators=(',', ':')) + '\n').encode())
    except BrokenPipeError:
        # The host vanished. Its control/status pipes are no longer observers.
        stopping = True


from importlib.machinery import SourceFileLoader
sys.dont_write_bytecode = True
kernel = SourceFileLoader('ramify_owned_tree', sys.argv[1]).load_module()
identity = kernel.identity
children = kernel.children

def settle():
    kernel.settle(float(os.environ.get('RAMIFY_CODEX_SETTLE_SECONDS', '5')), lambda: status({'kind': 'settled', 'confirmed': False, 'reason': 'Owned descendants did not settle within the bound'}))
    status({'kind': 'settled', 'confirmed': True})

stopping = False

def request_stop(*_):
    global stopping
    stopping = True


try:
    kernel.enable_subreaper()
    supervisor_identity = identity(os.getpid())
    for sig in (signal.SIGTERM, signal.SIGINT, signal.SIGHUP):
        signal.signal(sig, request_stop)
    provider = subprocess.Popen(sys.argv[2:], stdin=0, stdout=1, stderr=2, close_fds=True)
    provider_pid = provider.pid
    status({'kind': 'ready', 'pid': provider_pid, 'identity': identity(provider_pid),
            'supervisorPid': os.getpid(), 'supervisorIdentity': supervisor_identity})
    reported_exit = False
    control_buffer = b''
    while not stopping:
        # Reap native workers adopted after their original parent exited.
        while True:
            try:
                pid, code = os.waitpid(-1, os.WNOHANG)
            except ChildProcessError:
                pid = 0
            if pid == 0:
                break
            if pid == provider_pid and not reported_exit:
                reported_exit = True
                status({'kind': 'provider-exit', 'code': os.waitstatus_to_exitcode(code) if os.WIFEXITED(code) else None,
                        'signal': signal.Signals(os.WTERMSIG(code)).name if os.WIFSIGNALED(code) else None})
        ready, _, _ = select.select([3], [], [], 0.02)
        if ready:
            chunk = os.read(3, 4096)
            if not chunk:  # Host disappeared: settle only this owned tree.
                stopping = True
            else:
                control_buffer += chunk
                if b'\n' in control_buffer:
                    command = json.loads(control_buffer.split(b'\n', 1)[0])
                    if command.get('kind') == 'stop':
                        stopping = True
    settle()
except Exception as error:
    try:
        status({'kind': 'error', 'message': str(error)})
    except OSError:
        pass
    # Startup and transport failures still settle this dedicated tree.
    settle()
    sys.exit(1)
