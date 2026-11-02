"""Exact linear force balance, literal source routes and local relative travel.

No application imports; accepts model JSONL on stdin. Optional second argument
checks the rendered DOM, actual CSV, SVG and portable-study downloads.
"""
import csv
from fractions import Fraction as Q
import json
from pathlib import Path
import sys

# Each wheel separates two rope tensions. Supports identify which of those
# tensions act on the hanging assembly. Fixed-tie wheel 1 is a stationary turn.
ROUTES = {
    ('single', 'moving'): ([0], [1]),
    ('three', 'moving'): ([0, 1, 2], [1, 2, 3]),
    ('three', 'fixed'): ([1, 2], [0, 1, 2]),
    ('five', 'moving'): ([0, 1, 2, 3, 4], [1, 2, 3, 4, 5]),
    ('five', 'fixed'): ([1, 2, 3, 4], [0, 1, 2, 3, 4]),
}

def solve(a, b):
    """General exact Gaussian elimination, not a geometric-series formula."""
    m = [[Q(v) for v in row] + [Q(rhs)] for row, rhs in zip(a, b)]
    for col in range(len(m)):
        pivot = next(i for i in range(col, len(m)) if m[i][col])
        m[col], m[pivot] = m[pivot], m[col]
        div = m[col][col]
        m[col] = [v / div for v in m[col]]
        for i in range(len(m)):
            if i == col:
                continue
            factor = m[i][col]
            m[i] = [v - factor*w for v, w in zip(m[i], m[col])]
    return [row[-1] for row in m]

def expected(s):
    supports, speed = ROUTES[s['rig'], s['anchor']]
    size = len(speed) + 1
    eta = Q(s['efficiency'], 100)
    a, b = [], []
    for j, v in enumerate(speed):
        row = [Q(0)] * size
        row[j], row[j+1] = 1, -(eta if v else 1)
        a.append(row)
        b.append(0)
    a.append([int(i in supports) for i in range(size)])
    b.append(s['weight'])
    t = solve(a, b)
    h = Q(str(s['distance'])) / (len(supports) if s['hold'] == 'rope' else 1)
    losses = [(t[j+1]-t[j])*v*h for j, v in enumerate(speed)]
    work = s['weight']*h
    input_work = t[-1]*len(supports)*h
    assert sum(losses) == input_work-work
    return {
        'supports': len(supports), 'supportTensions': [t[i] for i in supports],
        'rise': h, 'rope': len(supports)*h, 'tension': t[-1],
        'hand': t[-1]/s['arm'], 'handPath': len(supports)*h*s['arm'],
        'work': work, 'ropeWork': input_work, 'handWork': input_work,
        'loss': sum(losses), 'efficiency': Q(s['weight'])/(len(supports)*t[-1]),
        'wheels': [dict(before=t[j], after=t[j+1], travel=v*h, loss=losses[j]) for j,v in enumerate(speed)],
    }

checks, maximum = 0, 0.0

def near(a, b):
    global checks, maximum
    err = abs(float(a)-float(b))/max(1, abs(float(b)))
    assert err < 2e-11, (a, b, err)
    checks += 1
    maximum = max(maximum, err)

def compare(m, exp):
    for key, val in exp.items():
        if key == 'supportTensions':
            assert len(m[key]) == len(val)
            for a, b in zip(m[key], val):
                near(a, b)
        elif key == 'wheels':
            assert len(m[key]) == len(val)
            for row, target in zip(m[key], val):
                for k, v in target.items():
                    near(row[k], v)
        else:
            near(m[key], val)

cases = 0
for line in sys.stdin:
    row = json.loads(line)
    compare(row['model'], expected(row['state']))
    cases += 1
assert cases == 1530, cases
rendered = 0
csv_rows = 0
if len(sys.argv) > 1:
    from xml.etree import ElementTree as ET
    root = Path(sys.argv[1])
    for folder in sorted(root.glob('*-*')):
        if not (folder/'rendered.json').exists():
            continue
        for row in json.loads((folder/'rendered.json').read_text()):
            exp = expected(row['state'])
            for a, b in zip(row['supportTensions'], exp['supportTensions']):
                near(a, b)
            assert len(row['supportTensions']) == exp['supports']
            for a, b in zip(row['wheels'], exp['wheels']):
                for k, v in b.items():
                    near(a[k], v)
            near(row['work']['input'], exp['handWork'])
            near(row['work']['useful'], exp['work'])
            near(row['work']['loss'], exp['loss'])
            near(row['work']['efficiency'], exp['efficiency'])
            near(row['blueWidth'], 560*exp['efficiency'])
            rendered += 1
        with (folder/'measurements.csv').open() as f:
            records = list(csv.DictReader(f))
        assert len(records) == 211
        for r in records:
            s = dict(rig=r['rig'], anchor=r['anchor'], hold=r['held_distance_kind'],
                     distance=r['distance_m'], weight=int(r['weight_N']),
                     arm=int(r['arm_over_drum']), efficiency=int(r['turning_wheel_transfer_percent']))
            exp = expected(s)
            for col, key in [('tension_N','tension'), ('hand_force_N','hand'),
                             ('load_work_J','work'), ('hand_work_J','handWork'),
                             ('rope_work_J','ropeWork'), ('dissipated_work_J','loss'),
                             ('whole_system_efficiency','efficiency')]:
                near(r[col], exp[key])
            for a,b in zip(r['support_tensions_N_tied_end_to_drum'].split(';'), exp['supportTensions']):
                near(a,b)
            for col,key in [('wheel_tied_side_N','before'), ('wheel_hauling_side_N','after'),
                            ('wheel_relative_travel_m','travel'), ('wheel_dissipated_work_J','loss')]:
                values = r[col].split(';')
                assert len(values) == len(exp['wheels'])
                for a,b in zip(values,exp['wheels']):
                    near(a,b[key])
            csv_rows += 1
        svg = ET.fromstring((folder/'diagram.svg').read_text())
        ns = {'s':'http://www.w3.org/2000/svg'}
        metadata = json.loads(svg.find('s:metadata',ns).text)
        assert metadata['format'] == 'gonia-hoist-v2'
        exp = expected(metadata['state'])
        groups = [g for g in svg.findall('s:g', ns) if g.get('data-support')]
        assert len(groups) == exp['supports']
        for g, target in zip(groups, exp['supportTensions']):
            near(g.get('data-tension'), target)
    assert rendered == 104, rendered
    assert csv_rows == 844, csv_rows
print(json.dumps(dict(method='Exact rational linear equilibrium at each wheel; independent source-route and relative-travel fixtures',
                      cases=cases, comparisons=checks, max_relative_error=maximum,
                      rendered_states=rendered, downloaded_csv_rows=csv_rows, passed=True), indent=2))
