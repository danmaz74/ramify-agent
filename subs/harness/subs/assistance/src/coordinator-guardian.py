#!/usr/bin/env python3
"""Own the host tree, including assessor and provider descendants, until settled."""
import json
import os
import signal
import subprocess
import sys
import time
from importlib.machinery import SourceFileLoader

sys.dont_write_bytecode = True
kernel = SourceFileLoader('ramify_owned_tree', sys.argv[1]).load_module()
path, generation = sys.argv[2:4]
record = {'schema': 'ramify-agent.coordinator-guardian/1', 'generation': generation}


def retain(state, reason=None):
    record.update(state=state, reason=reason)
    retained = os.environ.get('RAMIFY_COORDINATOR_GUARDIAN_RECORD')
    destinations = [retained] if retained and os.path.isdir(os.path.dirname(retained)) else [path]
    for destination in destinations:
        temporary = destination + '.tmp-' + str(os.getpid())
        fd = os.open(temporary, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
        with os.fdopen(fd, 'w') as output:
            json.dump(record, output)
            output.flush()
            os.fsync(output.fileno())
        os.replace(temporary, destination)
        directory = os.open(os.path.dirname(destination), os.O_RDONLY)
        try:
            os.fsync(directory)
        finally:
            os.close(directory)


stopping = False

def stop(*_):
    global stopping
    stopping = True


try:
    kernel.enable_subreaper()
    record.update(pid=os.getpid(), identity=kernel.identity(os.getpid()))
    retain('starting')
    for sig in (signal.SIGTERM, signal.SIGINT, signal.SIGHUP):
        signal.signal(sig, stop)
    host = subprocess.Popen(sys.argv[4:], close_fds=True)
    record.update(hostPid=host.pid, hostIdentity=kernel.identity(host.pid))
    retain('running')
    code = None
    retained_written = False
    while not stopping and code is None:
        retained = os.environ.get('RAMIFY_COORDINATOR_GUARDIAN_RECORD')
        if not retained_written and retained and os.path.isdir(os.path.dirname(retained)):
            retain('running')
            retained_written = True
        code = host.poll()
        time.sleep(0.02)
    kernel.settle(5, lambda: retain('unsettled', 'Owned host descendants did not settle within the bound'))
    retain('settled')
    sys.exit(code if code is not None and code >= 0 else 2)
except Exception as error:
    # A failure to retain proof must never create a false safe-replacement receipt.
    try:
        retain('unsettled', str(error))
    except Exception:
        pass
    kernel.settle()
    try:
        retain('settled')
    except Exception:
        pass
    raise
