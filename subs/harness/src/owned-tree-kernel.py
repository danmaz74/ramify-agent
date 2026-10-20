"""Linux-only owned descendant settlement shared by the two dedicated supervisors."""
import ctypes
import os
import signal
import sys
import time

def enable_subreaper():
    if sys.platform != 'linux':
        raise RuntimeError('Linux subreaper supervision is required')
    libc = ctypes.CDLL(None, use_errno=True)
    if libc.prctl(36, 1, 0, 0, 0) != 0:
        raise OSError(ctypes.get_errno(), 'PR_SET_CHILD_SUBREAPER failed')
    children()

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


def settle(timeout=5, on_timeout=lambda: None):
    deadline = time.monotonic() + timeout
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
            return
        if time.monotonic() >= deadline:
            # Stay available for a later stop; never abandon an unresolved writer.
            on_timeout()
            deadline = time.monotonic() + timeout
        time.sleep(0.01)
