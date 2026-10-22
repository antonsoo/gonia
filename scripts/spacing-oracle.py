"""Solve Vitruvius III.3's gap, height and boundary constraints over rationals.

No application imports. The unknown diameter and column axes are solved
simultaneously, rather than using the application's summed-width expression.
Input may be generated core cases or actual SVG geometry from a browser receipt.
"""
import json
import sys
from fractions import Fraction as F


def solve(rows):
    a = [[F(value) for value in row] for row in rows]
    for column in range(len(a)):
        pivot = next(i for i in range(column, len(a)) if a[i][column])
        a[column], a[pivot] = a[pivot], a[column]
        divisor = a[column][column]
        a[column] = [value / divisor for value in a[column]]
        for i in range(len(a)):
            if i != column:
                factor = a[i][column]
                a[i] = [x - factor * y for x, y in zip(a[i], a[column])]
    return [row[-1] for row in a]


def reference(p):
    n = p['columns']
    kind = p['system']
    # III.3.2, .4, .6 and .10, read against Krohn pp. 64-66.
    gaps = {'pycnostyle': F(3, 2), 'systyle': F(2), 'eustyle': F(9, 4),
            'diastyle': F(3), 'araeostyle': F(str(p['wideGap']))}
    heights = {'pycnostyle': F(10), 'systyle': F(19, 2), 'eustyle': F(19, 2),
               'diastyle': F(17, 2), 'araeostyle': F(8)}
    ordinary = gaps[kind]
    centre = F(3) if kind == 'eustyle' and not p['equalCentre'] else ordinary
    # Unknowns: n column axes, D, H. First outer shaft face lies at zero.
    def equation(terms, rhs=0):
        row = [F(0)] * (n + 3)
        for pos, coefficient in terms.items():
            row[pos] = F(coefficient)
        row[-1] = F(rhs)
        return row
    rows = [equation({0: 1, n: -F(1, 2)})]
    for i in range(1, n):
        gap = centre if i == n // 2 else ordinary
        rows.append(equation({i: 1, i - 1: -1, n: -1 - gap}))
    if p['basis'] == 'front':
        rows.append(equation({n - 1: 1, n: F(1, 2)}, F(str(p['front']))))
    else:
        rows.append(equation({n: 1}, F(str(p['diameter']))))
    rows.append(equation({n + 1: 1, n: -heights[kind]}))
    values = solve(rows)
    axes, diameter, height = values[:n], values[n], values[n + 1]
    front = axes[-1] + diameter / 2
    clear = [axes[i + 1] - axes[i] - diameter for i in range(n - 1)]
    if kind == 'eustyle' and not p['equalCentre']:
        assert front / diameter == {4: F(23, 2), 6: F(18), 8: F(49, 2)}[n]
    return axes, diameter, height, front, clear


rendered = len(sys.argv) > 1
if rendered:
    with open(sys.argv[1], encoding='utf-8') as f:
        configurations = json.load(f)['configurations']
    cases = [case for config in configurations for case in config['geometry']]
else:
    cases = [json.loads(line) for line in sys.stdin]
assert cases, 'No cases supplied'
checks = 0
maximum = 0.0
for case in cases:
    axes, diameter, height, front, gaps = reference(case['parameters'])
    assert len(case['axes']) == len(axes)
    comparisons = [(actual, expected, 1e-11) for actual, expected in zip(case['axes'], axes)]
    comparisons += [(case['diameter'], diameter, 1e-11)]
    # SVG getBBox returns single-precision geometry. Keep a separate bound for
    # this browser measurement; all parsed coordinates and core arithmetic
    # retain the much tighter tolerance.
    comparisons += [(case['height'], height, 1e-5 if rendered else 1e-11)]
    if 'front' in case:
        comparisons.append((case['front'], front, 1e-11))
        comparisons.append((case['widthModules'], front / diameter, 1e-11))
        comparisons.extend((gap['width'], expected, 1e-11) for gap, expected in zip(case['gaps'], gaps))
    for actual, expected, tolerance in comparisons:
        error = abs(actual - float(expected))
        assert error < tolerance, (case['parameters'], actual, str(expected), error)
        maximum = max(maximum, error)
        checks += 1
print(json.dumps({
    'source': 'Krohn 1912 pp. 64-66; Vitruvius III.3.2, .4, .6-.7 and .10',
    'method': 'Exact rational simultaneous solution for axes, diameter and height; independent checks of the three printed eustyle front totals.',
    'cases': len(cases), 'coordinate_and_distance_comparisons': checks,
    'maximum_absolute_error_m': maximum, 'coordinate_tolerance_m': 1e-11,
    'height_tolerance_m': 1e-5 if rendered else 1e-11,
    'measurement': 'SVG circles and getBBox path height' if rendered else 'core model',
}, indent=2))
