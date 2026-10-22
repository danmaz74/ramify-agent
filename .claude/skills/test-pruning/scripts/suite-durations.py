#!/usr/bin/env python3
"""Per-file test durations and tier shape from a ramify-audit vitest report.

Reads the default reporter output the `agent-tests` check retains
(`reports/audit/agent-tests.txt` in a report commit), joins each file with
static layer flags read from its source, and prints the suite's shape.

Usage (from the repository root):
  suite-durations.py                      newest refs/audited/by-tree report
  suite-durations.py --ref <commit>       a specific report commit
  suite-durations.py --text <file>        a saved agent-tests.txt
  suite-durations.py ... --out <dir>      also write file-durations.tsv and slow-tests.tsv
  suite-durations.py ... --top 60         rows in the top-files table (default 40)

Layer flags (from the test file's text, so they are heuristics):
  run        drives a whole scripted run: startRun(, openRuns(, runToEnd(,
             runAcceptedHandback(, runDependencyGate(, reviewRun(, verifyRow(, crashAt(
  real       realRamify / privateRamify: starts an installed Ramify daemon
  spawn      spawns the CLI or a nested runner: 'src/main.ts', 'vitest.mjs', execFile(
  tmp        mkdtemp or tmpdir
  fixture    copyFixture / copyCapabilityFixture
  unmock     vi.unmock(
Tier is the first match of: boundary project; run; tmp; in-memory.
"""
import argparse
import os
import re
import subprocess
import sys
from collections import defaultdict

FILE_LINE = re.compile(r'^\s*[✓❯×↓]\s+\|(\w+)\|\s+(\S+)\s+\((\d+) tests?(?:\s*\|[^)]*)?\)\s*(?:(\d+)ms)?')
TEST_LINE = re.compile(r'^\s+[✓×]\s+(.*?)\s+(\d+)ms\s*$')
FLAGS = {
    'run': re.compile(r'\b(startRun|openRuns|runToEnd|runAcceptedHandback|runDependencyGate|reviewRun|verifyRow|crashAt)\('),
    'real': re.compile(r'\b(realRamify|privateRamify)\b'),
    'spawn': re.compile(r"src/main\.ts|vitest\.mjs|\bexecFile\(|\bspawn\("),
    'tmp': re.compile(r'\b(mkdtemp|tmpdir)\b'),
    'fixture': re.compile(r'\b(copyFixture|copyCapabilityFixture)\('),
    'unmock': re.compile(r'vi\.unmock\('),
}


def newest_report_ref():
    """The newest report commit that retains the agent-tests text (a partial audit may not)."""
    out = subprocess.run(['git', 'for-each-ref', '--sort=-committerdate', '--format=%(objectname)', 'refs/audited/by-tree'],
                         capture_output=True, text=True, check=True).stdout.split()
    if not out:
        sys.exit('no refs/audited/by-tree refs; pass --ref or --text')
    for ref in out[:50]:
        if subprocess.run(['git', 'cat-file', '-e', f'{ref}:reports/audit/agent-tests.txt'], capture_output=True).returncode == 0:
            return ref
    sys.exit('none of the newest 50 report commits retains reports/audit/agent-tests.txt; pass --ref or --text')


def report_text(args):
    if args.text:
        return open(args.text, encoding='utf8').read()
    ref = args.ref or newest_report_ref()
    res = subprocess.run(['git', 'show', f'{ref}:reports/audit/agent-tests.txt'], capture_output=True, text=True)
    if res.returncode:
        sys.exit(f'cannot read reports/audit/agent-tests.txt from {ref}: {res.stderr.strip()}')
    audited = subprocess.run(['git', 'log', '-1', '--format=%cd', '--date=short', ref], capture_output=True, text=True).stdout.strip()
    print(f'report commit {ref[:12]} ({audited}); file-seconds scale with the worker count that run used', file=sys.stderr)
    return res.stdout


def flags_of(path):
    try:
        src = open(path, encoding='utf8').read()
    except OSError:
        return {k: False for k in FLAGS}, 0
    return {k: bool(p.search(src)) for k, p in FLAGS.items()}, src.count('\n')


def tier_of(project, flags):
    if project == 'boundaries':
        return 'boundary'
    if flags['run']:
        return 'run'
    if flags['tmp']:
        return 'tmp'
    return 'memory'


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--ref')
    ap.add_argument('--text')
    ap.add_argument('--out')
    ap.add_argument('--top', type=int, default=40)
    args = ap.parse_args()
    lines = report_text(args).splitlines()
    summary = [l.strip() for l in lines if re.match(r'^\s*(Test Files|Tests|Duration)\s', l)]
    rows, slow, current = [], [], None
    for line in lines:
        m = FILE_LINE.match(line)
        if m:
            project, path, n, ms = m.group(1), m.group(2), int(m.group(3)), int(m.group(4) or 0)
            flags, nlines = flags_of(path)
            current = path
            rows.append({'s': ms / 1000, 'tests': n, 'project': project, 'path': path, 'flags': flags, 'lines': nlines,
                         'tier': tier_of(project, flags)})
            continue
        m = TEST_LINE.match(line)
        if m and current:
            slow.append((int(m.group(2)) / 1000, current, m.group(1)))
    if not rows:
        sys.exit('no per-file lines found; is this the default reporter output?')
    rows.sort(key=lambda r: -r['s'])
    slow.sort(reverse=True)
    total = sum(r['s'] for r in rows) or 1

    for s in summary:
        print(s)
    print(f'\nfiles {len(rows)}, tests {sum(r["tests"] for r in rows)}, summed file-seconds {total:.0f}')

    print('\n== tiers ==')
    agg = defaultdict(lambda: [0.0, 0, 0])
    for r in rows:
        a = agg[r['tier']]; a[0] += r['s']; a[1] += r['tests']; a[2] += 1
    print(f'{"tier":10s} {"files":>5s} {"tests":>6s} {"seconds":>8s} {"share":>6s} {"s/test":>7s}')
    for k in ('memory', 'tmp', 'run', 'boundary'):
        if k in agg:
            s, n, c = agg[k]
            print(f'{k:10s} {c:5d} {n:6d} {s:8.0f} {s / total * 100:5.0f}% {s / max(n, 1):7.2f}')

    print(f'\n== top {args.top} files ==')
    print(f'{"seconds":>8s} {"tests":>5s} {"project":10s} {"tier":9s} flags  path')
    for r in rows[:args.top]:
        fl = ','.join(k for k, v in r['flags'].items() if v) or '-'
        print(f'{r["s"]:8.1f} {r["tests"]:5d} {r["project"]:10s} {r["tier"]:9s} {fl:28s} {r["path"]}')

    print('\n== cumulative share ==')
    acc = 0.0
    marks = {10, 25, 50, 100, 200, len(rows)}
    for i, r in enumerate(rows, 1):
        acc += r['s']
        if i in marks:
            print(f'top {i:4d} files: {acc / total * 100:5.1f}%')

    print('\n== by directory ==')
    agg = defaultdict(lambda: [0.0, 0, 0])
    for r in rows:
        a = agg[os.path.dirname(r['path'])]; a[0] += r['s']; a[1] += r['tests']; a[2] += 1
    for k, (s, n, c) in sorted(agg.items(), key=lambda x: -x[1][0])[:25]:
        print(f'{s:8.0f}s {c:4d} files {n:5d} tests {s / total * 100:4.0f}%  {k}')

    print('\n== slowest 30 tests ==')
    for s, p, t in slow[:30]:
        print(f'{s:6.1f}s {p} :: {t[:100]}')
    print(f'\ntests >= 5 s: {sum(1 for s, _, _ in slow if s >= 5)}, >= 1 s: {sum(1 for s, _, _ in slow if s >= 1)}')

    if args.out:
        os.makedirs(args.out, exist_ok=True)
        with open(os.path.join(args.out, 'file-durations.tsv'), 'w', encoding='utf8') as f:
            f.write('seconds\ttests\tproject\ttier\t' + '\t'.join(FLAGS) + '\tlines\tfile\n')
            for r in rows:
                f.write(f'{r["s"]:.1f}\t{r["tests"]}\t{r["project"]}\t{r["tier"]}\t' + '\t'.join(str(int(r['flags'][k])) for k in FLAGS) + f'\t{r["lines"]}\t{r["path"]}\n')
        with open(os.path.join(args.out, 'slow-tests.tsv'), 'w', encoding='utf8') as f:
            f.write('seconds\tfile\ttest\n')
            for s, p, t in slow:
                f.write(f'{s:.1f}\t{p}\t{t}\n')
        print(f'\nwrote {args.out}/file-durations.tsv and slow-tests.tsv', file=sys.stderr)


if __name__ == '__main__':
    main()
