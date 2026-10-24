"""Inspect real browser CSV and SVG downloads without importing application code."""
import csv
import json
import math
import re
import sys
from pathlib import Path
from xml.etree import ElementTree as ET

root = Path(sys.argv[1])
results = []
for folder in sorted(root.glob('*-*')):
    file = folder / 'measurements.csv'
    if not file.exists():
        continue
    rows = list(csv.DictReader(file.open()))
    assert len(rows) == 211
    for row in rows:
        wheels = {'single': 1, 'three': 3, 'five': 5}[row['rig']]
        supports = wheels if row['anchor'] == 'moving' else wheels - 1
        assert int(row['supports']) == supports
        d, w, a = float(row['distance_m']), float(row['weight_N']), float(row['arm_over_drum'])
        h = d if row['held_distance_kind'] == 'rise' else d / supports
        expected = {'rise_m': h, 'rope_wound_m': supports * h,
                    'tension_N': w / supports, 'hand_force_N': w / supports / a,
                    'hand_path_m': supports * h * a, 'load_work_J': w * h,
                    'rope_work_J': w * h, 'hand_work_J': w * h,
                    'drum_turns': supports * h / (.3 * math.pi)}
        for key, val in expected.items():
            assert abs(float(row[key]) - val) < 1e-8, (key, row, val)
        assert abs(float(row['initial_visible_rope_m']) - float(row['visible_rope_m']) - supports * h) < 1e-9
    svg = ET.fromstring((folder / 'diagram.svg').read_text())
    ns = {'s': 'http://www.w3.org/2000/svg'}
    saved = json.loads(svg.find('s:metadata', ns).text)['state']
    assert saved == {'rig': 'five', 'anchor': 'moving', 'hold': 'rise', 'distance': 1, 'weight': 1200, 'arm': 4}
    route = next(p for p in svg.findall('s:path', ns) if p.get('data-route') == 'true')
    # Independent literal path in displayed coordinates: three upper arcs,
    # two lower arcs, five shortening runs and the final fixed drum run.
    tokens = re.findall(r'[MLA]|-?\d+(?:\.\d+)?(?:e[-+]?\d+)?', route.get('d'))
    numbers = []
    commands = []
    for token in tokens:
        if token in 'MLA':
            commands.append(token)
        else:
            numbers.append(float(token))
    assert commands == ['M', 'L', 'A', 'L', 'A', 'L', 'A', 'L', 'A', 'L', 'A', 'L']
    ox = 330 - 1.6 * 130
    x = lambda v: ox + v * 260
    y = lambda v: 50 + v * 78
    expected = [x(0), y(4), x(0), y(1.1)]
    for j in range(3):
        expected += [41.6, 12.48, 0, 0, 1, x((4*j+2)*.16), y(1.1)]
        if j < 2:
            expected += [x((4*j+2)*.16), y(4)]
            expected += [41.6, 12.48, 0, 0, 0, x((4*j+4)*.16), y(4)]
            expected += [x((4*j+4)*.16), y(1.1)]
        else:
            expected += [x(1.6), y(5.8)]
    assert len(numbers) == len(expected)
    assert max(abs(a-b) for a,b in zip(numbers, expected)) < 1e-9
    assert len([g for g in svg.findall('s:g',ns) if g.get('data-support')]) == 5
    results.append({'configuration':folder.name, 'csv_rows':len(rows), 'literal_svg_route':True})
assert len(results) == 4
print(json.dumps({'method':'Independently calculated force/travel/work for actual CSV rows and literal M/L/A geometry of the native SVG', 'passed':True,'configurations':results},indent=2))
