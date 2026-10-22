#!/usr/bin/env python3
"""Static scan of the test tree for pruning candidates, grouped by reason.

Every hit is a candidate to read, never a verdict. Run from the repository
root. Reasons match references/reasons.md:

  R1 scenario-twins     Vitest files that share a basename with a Cucumber step file
  R2 boundary-runs      registry boundary files that drive whole scripted runs
  R3 other-tools        tests of ramify-audit, Ramify, Vitest, Node or an SDK
  R4 duplicates         same title in several files; same acceptance tag in 3+ files;
                        basename twins (x.test / x.boundary.test / x.integration.test)
  R5 sweeps             exhaustive loops in the ordinary suite
  R6 compatibility      run-state compatibility and retired-limit tests
  R7 doubles            tests whose subject is a test double
  R8 locks              enum, constant, schema-shape and prose assertions
  R9 dead               registry mismatches, env-gated files, missing paths
  R10 real-waits        sleeps, stalls, long deadlines and minutes-long timeouts without fake timers

Usage:
  find-candidates.py                 all reasons, markdown to stdout
  find-candidates.py --reason R4 R7  only those reasons
  find-candidates.py --min-tag-files 4
"""
import argparse
import json
import os
import re
import sys
from collections import defaultdict

TEST_GLOB = re.compile(r'\.test\.tsx?$')
SKIP_DIRS = {'node_modules', 'fixtures', '.ramify', 'tmp', 'dist', '.superseded'}
TITLE = re.compile(r'''^\s*(?:test|it)(?:\.\w+(?:\((?:[^()]|\([^()]*\))*\))?)*\(\s*(['"`])((?:\\.|(?!\1).)*)\1''', re.M)
TAG = re.compile(r'\b((?:CA|CF|PB3-[A-Z]|AS|CM|ST|[BCDHIPRSUV])\d{1,2})\b')
RUN_HELPERS = re.compile(r'\b(startRun|openRuns|runToEnd|runAcceptedHandback|runDependencyGate|reviewRun|verifyRow|crashAt)\(')
DOUBLE_STATE = re.compile(r'\b(git|scripted|fake|mock)\w*\.(commits|operations|minted|branch|head|answers|calls)\(\)')
PROSE_LOCK = re.compile(r'''toContain\(\s*(['"`])([^'"`]{60,})\1''')
OPTIONS_LOCK = re.compile(r'\.options\s*\)\s*\.toEqual\(|Object\.keys\([^)]*\.shape\)\s*\)\s*\.to(Equal|HaveLength)')
SWEEP_TITLE = re.compile(r'\b(every \w+(,| over| of| ×| x) every|each prefix|each cut|every prefix|every cursor|every boundary|every combination|all roles|every role|exhaustive|from each prefix|from every)\b', re.I)
SWEEP_CODE = re.compile(r'\.length\)\.toBeGreaterThan\(\s*\d{2,}|for \(let \w+ = 0; \w+ <= [^;]*(lines|length)[^;]*\+ 1|\.options\.flatMap\(')
LEGACY = re.compile(r'\b(legacy|compatib|backward|no longer (fires|applies|limits|bounds)|left behind|earlier (harness|run|version))\b', re.I)
OTHER_TOOL = re.compile(r'ramify-audit \d|vitest\.mjs|--project boundaries|toThrow\([^)]*(circular|BigInt)|SIGKILL cannot|reserveTokens: \d|execFile\(\{[^}]*timeout|worktree prune')
SPAWN = re.compile(r"src/main\.ts|main\.ts'|\bexecFile\(|\bspawn\(")
CANARY = re.compile(r'\bcanary\b', re.I)
WAIT = re.compile(r'''setTimeout\(\s*(?:resolve|\w+)\s*,\s*(\d[\d_]*)\s*\)|\bstall\b[^\n]{0,40}?\bms:\s*(\d[\d_]*)|\b(?:sleep|delay|wait)\(\s*(\d[\d_]*)\s*\)''')
TEST_TIMEOUT = re.compile(r'''\}\s*,\s*(\d[\d_]*)\s*\)\s*;?\s*$''', re.M)
FAKE_TIMERS = re.compile(r'vi\.useFakeTimers\(')
ENV_GATE = re.compile(r'\b(describe|test|it)\.(skip|skipIf|runIf)\(|process\.env\.[A-Z_]+\s*\?\s*(test|describe|it)\b')


def test_files(root='.'):
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS and not d.startswith('.')]
        for f in filenames:
            if TEST_GLOB.search(f):
                yield os.path.relpath(os.path.join(dirpath, f), root).replace(os.sep, '/')


def read(path):
    try:
        return open(path, encoding='utf8').read()
    except OSError:
        return ''


def line_of(src, pos):
    return src.count('\n', 0, pos) + 1


def title_text(raw):
    """A test title as Vitest reports it: source escapes removed."""
    return re.sub(r"\\(['\"`\\])", r'\1', raw).strip()


def is_canary(src):
    return bool(CANARY.search('\n'.join(src.splitlines()[:25])))


def stem(path):
    base = os.path.basename(path)
    base = re.sub(r'\.(test|stress)\.tsx?$', '', base)
    return re.sub(r'(\.boundary|\.integration|-integration|-boundary)$', '', base)


def section(title, items):
    print(f'\n## {title}\n')
    if not items:
        print('(none)')
    for it in items:
        print(f'- {it}')


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--reason', nargs='*', default=None)
    ap.add_argument('--min-tag-files', type=int, default=3)
    args = ap.parse_args()
    want = set(r.upper() for r in args.reason) if args.reason else None

    def wanted(r):
        return want is None or r in want

    files = sorted(test_files())
    sources = {f: read(f) for f in files}
    step_names = set()
    for dirpath, dirnames, filenames in os.walk('.'):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS and not d.startswith('.')]
        if os.path.basename(dirpath) == 'steps' and os.path.basename(os.path.dirname(dirpath)) == 'tests':
            step_names.update(f[:-3] for f in filenames if f.endswith('.ts'))
    registry = {}
    try:
        reg = json.load(open('src/tests/test-boundaries.json', encoding='utf8'))
        registry = {e['file']: e for e in reg.get('boundaries', [])}
    except (OSError, ValueError):
        pass

    print('# Pruning candidates (heuristic; read every hit before acting)\n')
    print(f'{len(files)} test files scanned, {len(registry)} registered boundary files')

    if wanted('R1'):
        steps = {}
        for dirpath, dirnames, filenames in os.walk('.'):
            dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS and not d.startswith('.')]
            if os.path.basename(dirpath) == 'steps' and os.path.basename(os.path.dirname(dirpath)) == 'tests':
                for f in filenames:
                    if f.endswith('.ts'):
                        steps[f[:-3]] = os.path.relpath(os.path.join(dirpath, f)).replace(os.sep, '/')
        items = []
        for name, step in sorted(steps.items()):
            twins = [f for f in files if stem(f) == name]
            helper = os.path.join(os.path.dirname(os.path.dirname(step)), 'helpers', name + '.ts').replace(os.sep, '/')
            if twins:
                items.append(f'step `{step}` has Vitest twin(s) {", ".join("`" + t + "`" for t in twins)}' + (f' and helper `{helper}`' if os.path.exists(helper) else ''))
        section('R1 scenario twins: delete the Vitest side, keep feature and step', items)

    if wanted('R2'):
        items = []
        for f, entry in sorted(registry.items()):
            src = sources.get(f, '')
            hits = sorted(set(m.group(1) for m in RUN_HELPERS.finditer(src)))
            spawns = len(SPAWN.findall(src))
            why = entry.get('whyFakeCannotProve', '').strip()
            note = []
            if hits:
                note.append(f'drives whole runs via {", ".join(hits)}')
            if spawns:
                note.append(f'{spawns} CLI spawn site(s)')
            if note:
                items.append(f'`{f}`: {"; ".join(note)}; whyFakeCannotProve: "{why[:80]}"')
        generic = defaultdict(list)
        for f, entry in registry.items():
            generic[entry.get('whyFakeCannotProve', '').strip()].append(f)
        for why, fs in generic.items():
            if len(fs) >= 3:
                items.append(f'{len(fs)} registry entries share the generic justification "{why[:80]}"')
        section('R2 boundary files that are workflow tests', items)

    if wanted('R3'):
        items = []
        for f, src in sources.items():
            if is_canary(src):
                continue  # the one named witness per dependency stays
            for m in OTHER_TOOL.finditer(src):
                if m.group(0).startswith('reserveTokens') and '/subs/pi/' not in f:
                    continue  # fixture data outside the SDK's module
                items.append(f'`{f}:{line_of(src, m.start())}` {m.group(0)[:40]}')
        section('R3 assertions about another tool (canary files skipped)', items[:120])

    if wanted('R4'):
        by_title = defaultdict(list)
        by_tag = defaultdict(set)
        for f, src in sources.items():
            for m in TITLE.finditer(src):
                title = title_text(m.group(2))
                by_title[title].append(f'{f}:{line_of(src, m.start())}')
                for t in TAG.findall(title):
                    by_tag[t].add(f)
        items = [f'"{t[:70]}" in {", ".join("`" + p + "`" for p in ps)}' for t, ps in sorted(by_title.items()) if len(set(p.split(":")[0] for p in ps)) > 1]
        section('R4a identical titles in more than one file', items)
        items = [f'{t}: {len(fs)} files: {", ".join(sorted("`" + x + "`" for x in fs))}' for t, fs in sorted(by_tag.items(), key=lambda x: -len(x[1])) if len(fs) >= args.min_tag_files]
        section(f'R4b acceptance tags in {args.min_tag_files}+ files (one owner per behavior)', items)
        by_stem = defaultdict(list)
        for f in files:
            by_stem[(os.path.dirname(f), stem(f))].append(f)
        items = [', '.join('`' + x + '`' for x in sorted(fs)) for _, fs in sorted(by_stem.items()) if len(fs) > 1]
        section('R4c basename twins (fake test and its boundary/integration copy)', items)

    if wanted('R5'):
        items = []
        for f, src in sources.items():
            for m in TITLE.finditer(src):
                if SWEEP_TITLE.search(m.group(2)):
                    items.append(f'`{f}:{line_of(src, m.start())}` title "{m.group(2)[:70]}"')
            for m in SWEEP_CODE.finditer(src):
                items.append(f'`{f}:{line_of(src, m.start())}` {m.group(0)[:50]}')
        section('R5 exhaustive sweeps (move to *.stress.ts, keep a counterexample set)', items)

    if wanted('R6'):
        items = []
        for f, src in sources.items():
            for m in TITLE.finditer(src):
                if LEGACY.search(m.group(2)):
                    items.append(f'`{f}:{line_of(src, m.start())}` "{m.group(2)[:80]}"')
        section('R6 run-state compatibility and retired-limit tests', items)

    if wanted('R7'):
        items = []
        for f, src in sources.items():
            if stem(f) in step_names:
                continue  # an R1 scenario twin, not a double test
            if f in registry:
                continue  # a native witness has no production import either; that is R2/R3 material
            imports = re.findall(r'''from\s+['"]([^'"]+)['"]''', src)
            prod = [i for i in imports if i.startswith('.') and '/tests/' not in i and not re.search(r'(scripted|mock|fake|helpers)', i) and not i.startswith('./helpers')]
            n_state = len(DOUBLE_STATE.findall(src))
            double_signal = any(re.search(r'(scripted|mock|fake|guard|boundaries|transports)', i) for i in imports) or bool(
                re.search(r'(unstated answer|unused answer|exhausted (answer|script)|assertComplete|assertAnswered|refused (launch|process))', src, re.I))
            if imports and not prod and not RUN_HELPERS.search(src) and not SPAWN.search(src) and double_signal:
                items.append(f'`{f}`: no production import and the subject is a helper or double')
            elif n_state >= 5:
                items.append(f'`{f}`: {n_state} assertions read a double\'s own state')
        section('R7 tests of test doubles', items)

    if wanted('R8'):
        items = []
        for f, src in sources.items():
            for m in OPTIONS_LOCK.finditer(src):
                items.append(f'`{f}:{line_of(src, m.start())}` option list or shape count')
            for m in PROSE_LOCK.finditer(src):
                items.append(f'`{f}:{line_of(src, m.start())}` pinned prose "{m.group(2)[:40]}..."')
        section('R8 enum, constant, schema-shape and prose locks', items[:150])

    if wanted('R9'):
        items = []
        for f, entry in sorted(registry.items()):
            src = sources.get(f)
            if src is None:
                items.append(f'registry file missing: `{f}`')
                continue
            titles = [title_text(m.group(2)) for m in TITLE.finditer(src)]
            if re.search(r'\b(test|it)\.each\(', src) or re.search(r'\b(test|it)\(\s*(?:`[^`]*\$\{|[A-Za-z_])', src):
                items.append(f'`{f}`: parameterized titles; compare its owningCases by hand')
                continue
            for case in entry.get('owningCases', []):
                leaf = case.split(' > ')[-1].strip()
                if not any(leaf == t or leaf in t for t in titles):
                    items.append(f'`{f}`: owning case not found in file: "{leaf[:70]}"')
            for t in titles:
                if not any(t == c.split(' > ')[-1].strip() or t in c for c in entry.get('owningCases', [])):
                    items.append(f'`{f}`: test not in registry owningCases: "{t[:70]}"')
        for f, src in sources.items():
            m = ENV_GATE.search(src)
            if m:
                items.append(f'`{f}:{line_of(src, m.start())}` skipped or env-gated: {m.group(0)}')
        if os.path.isdir('scripts/browser-acceptance'):
            for name in sorted(os.listdir('scripts/browser-acceptance')):
                if not name.endswith('.ts'):
                    continue
                src = read(os.path.join('scripts/browser-acceptance', name))
                for ref in set(re.findall(r'''['"]((?:src|subs)/[^'"]+\.test\.tsx?)['"]''', src)):
                    if not os.path.exists(ref):
                        items.append(f'`scripts/browser-acceptance/{name}` points at missing `{ref}`')
        section('R9 dead, vacuous or mis-registered', items)

    if wanted('R10'):
        items = []
        for f, src in sources.items():
            fake = bool(FAKE_TIMERS.search(src))
            for m in WAIT.finditer(src):
                ms = int(next(g for g in m.groups() if g).replace('_', ''))
                if ms >= 1000 and not fake:
                    items.append(f'`{f}:{line_of(src, m.start())}` waits {ms / 1000:g} s on the wall clock: {m.group(0)[:50]}')
            for m in TEST_TIMEOUT.finditer(src):
                ms = int(m.group(1).replace('_', ''))
                if ms >= 300_000:
                    items.append(f'`{f}:{line_of(src, m.start())}` test or hook timeout cap of {ms / 1000:g} s; a cap, not a wait, unless the measured duration is near it')
        section('R10 wall-clock waits (sleeps and stalls without fake timers; fix with fake timers or an awaited event) and test timeout caps of five minutes or more (cross-check against measured durations before acting)', items)


if __name__ == '__main__':
    main()
