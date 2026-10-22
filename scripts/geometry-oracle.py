"""Solve position constraints over exact rational numbers, without the app's
discrepancy/contraction formula. Then measure the solved arrangement directly.
This checks the modeled geometry, not the historical reconstruction of a temple.
"""
import json
import sys
from fractions import Fraction as F


def solve(equations):
    matrix = [[F(v) for v in row] for row in equations]
    for col in range(8):
        pivot = next(i for i in range(col, 8) if matrix[i][col])
        matrix[col], matrix[pivot] = matrix[pivot], matrix[col]
        divisor = matrix[col][col]
        matrix[col] = [v / divisor for v in matrix[col]]
        for i in range(8):
            if i != col:
                factor = matrix[i][col]
                matrix[i] = [a - factor * b for a, b in zip(matrix[i], matrix[col])]
    return [row[-1] for row in matrix]


def equation(terms, result):
    row = [F(0)] * 9
    for position, coefficient in terms.items():
        row[position] = F(coefficient)
    row[-1] = F(result)
    return row


cases = checks = 0
maximum = 0.0
for raw in sys.stdin:
    c = json.loads(raw)
    beam = F(str(c['parameters']['beam']))
    treatment = c['parameters']['treatment']
    # Unknowns: three column axes C0..C2, then five triglyph centres G0..G4.
    equations = [equation({0: 1}, beam / 2)]
    if treatment == 'contract':
        equations += [equation({3: 1}, F(1, 2))]
        equations += [equation({i: 1, i - 1: -1}, F(5, 2)) for i in range(4, 8)]
        equations += [equation({1: 1, 5: -1}, 0), equation({2: 1, 7: -1}, 0)]
    else:
        equations += [equation({1: 1, 0: -1}, 5), equation({2: 1, 1: -1}, 5)]
        if treatment == 'align':
            equations += [equation({3: 1, 0: -1}, 0)]
            equations += [equation({i: 1, i - 1: -1}, F(5, 2)) for i in range(4, 8)]
        else:
            equations += [equation({3: 1}, F(1, 2)), equation({5: 1, 1: -1}, 0), equation({7: 1, 2: -1}, 0), equation({5: 1, 4: -1}, F(5, 2)), equation({6: 1, 5: -1}, F(5, 2))]
    positions = solve(equations)
    columns, glyphs = positions[:3], positions[3:]
    comparisons = list(zip(c['columnAxes'] + c['triglyphCenters'], positions))
    comparisons += list(zip(c['bays'], [columns[i + 1] - columns[i] for i in range(2)]))
    comparisons += list(zip([m['width'] for m in c['metopes']], [glyphs[i + 1] - glyphs[i] - 1 for i in range(4)]))
    comparisons += [(c['cornerGap'], glyphs[0] - F(1, 2)), (c['cornerOffset'], columns[0] - glyphs[0])]
    for actual, expected in comparisons:
        error = abs(actual - float(expected))
        assert error < 1e-12, (c['parameters'], actual, str(expected), error)
        maximum = max(maximum, error)
        checks += 1
    # A shared corner must account for the whole beam half-depth, irrespective of treatment.
    assert abs(c['cornerGap'] + c['cornerOffset'] + .5 - float(beam / 2)) < 1e-12
    cases += 1
assert cases == 603, cases
print(json.dumps({'cases': cases, 'coordinate_and_distance_comparisons': checks, 'maximum_absolute_error_T': maximum, 'tolerance_T': 1e-12, 'method': 'Exact rational solution of eight positional constraints; direct distances between solved positions.'}, indent=2))
