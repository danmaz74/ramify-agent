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


def identity(pid):
    with open('/proc/%d/stat' % pid) as source:
        fields = source.read().rsplit(')', 1)[1].split()
    with open('/proc/sys/kernel/random/boot_id') as source:
        boot = source.read().strip()
    return boot + ':' + fields[19]


def children():
    # Re-read all ancestry each time: descendants can fork, setsid and double-fork.
    parents = {}
    starts = {}
    for entry in os.listdir('/proc'):
        if not entry.isdigit():
            continue
        try:
            with open('/proc/' + entry + '/stat') as source:
                fields = source.read().rsplit(')', 1)[1].split()
            parents[int(entry)] = int(fields[1])
            starts[int(entry)] = fields[19]
        except (OSError, ValueError, IndexError):
            pass
    owned = {os.getpid()}
    while True:
        discovered = {pid for pid, parent in parents.items() if parent in owned}
        if discovered.issubset(owned):
            return {pid: starts[pid] for pid in owned - {os.getpid()}}
        owned.update(discovered)


def settle():
    deadline = time.monotonic() + float(os.environ.get('RAMIFY_CODEX_SETTLE_SECONDS', '5'))
    while True:
        # Identity checks avoid signalling a PID reused between scan and signal.
        observed = []
        for pid, start in children().items():
            try:
                current = identity(pid)
                if current.rsplit(':', 1)[1] == start:
                    observed.append((pid, current))
            except OSError:
                pass
        for pid, expected in observed:
            try:
                if identity(pid) == expected:
                    os.kill(pid, signal.SIGKILL)
            except ProcessLookupError:
                pass
            except FileNotFoundError:
                pass
        has_children = True
        while True:
            try:
                pid, _ = os.waitpid(-1, os.WNOHANG)
                if pid == 0:
                    break
            except ChildProcessError:
                has_children = False
                break
        if not has_children:
            status({'kind': 'settled', 'confirmed': True})
            break
        if time.monotonic() >= deadline:
            # Stay available for a later stop; never abandon an unresolved writer.
            status({'kind': 'settled', 'confirmed': False, 'reason': 'Owned descendants did not settle within the bound'})
            deadline = time.monotonic() + float(os.environ.get('RAMIFY_CODEX_SETTLE_SECONDS', '5'))
        time.sleep(0.01)

stopping = False

def request_stop(*_):
    global stopping
    stopping = True


try:
    if sys.platform != 'linux':
        raise RuntimeError('Linux subreaper supervision is required')
    libc = ctypes.CDLL(None, use_errno=True)
    if libc.prctl(36, 1, 0, 0, 0) != 0:  # PR_SET_CHILD_SUBREAPER
        raise OSError(ctypes.get_errno(), 'PR_SET_CHILD_SUBREAPER failed')
    # Require readable ancestry before starting anything that could write.
    children()
    supervisor_identity = identity(os.getpid())
    for sig in (signal.SIGTERM, signal.SIGINT, signal.SIGHUP):
        signal.signal(sig, request_stop)
    provider = subprocess.Popen(sys.argv[1:], stdin=0, stdout=1, stderr=2, close_fds=True)
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
