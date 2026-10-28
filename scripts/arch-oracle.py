"""Independent finite rigid-block equilibrium oracle using SciPy/HiGHS.

Input is JSONL from arch-cases.ts. Unlike the production H,C interval solver,
this LP uses inner/outer compressive endpoint forces and unconstrained joint
shear, balances every block's x/y forces and moments, and optimizes H.
Centroids are independently integrated in Cartesian coordinates by quadrature.

node --import tsx scripts/arch-cases.ts | uv run --with scipy==1.18.1 scripts/arch-oracle.py
"""
import json
import math
import sys

import numpy as np
import scipy
from scipy.integrate import quad
from scipy.optimize import linprog


def geometry(s):
    rise = s["rise"] / 100
    t = s["thickness"] / 100
    r = (1 + rise * rise) / (2 * rise)
    cy = rise - r
    inner, outer = r - t / 2, r + t / 2
    end = math.acos(1 / r)
    angles = np.linspace(math.pi - end, end, 14)
    blocks = []
    for i in range(13):
        a, b = angles[i + 1], angles[i]
        area = quad(lambda _theta: (outer**2 - inner**2) / 2, a, b)[0]
        x = quad(lambda theta: math.cos(theta) * (outer**3 - inner**3) / 3, a, b)[0] / area
        y = cy + quad(lambda theta: math.sin(theta) * (outer**3 - inner**3) / 3, a, b)[0] / area
        extra = (s["load"] / 100 if i == 6 else 0) if s["loading"] == "crown" else (s["load"] / 200 if i in [3, 9] else 0)
        blocks.append((x, y, 1 / 13 + extra))
    return inner, outer, cy, angles, blocks


def oracle(s, bases):
    inner, outer, cy, angles, blocks = geometry(s)
    # At each radial joint: n_inner >= 0, n_outer >= 0, shear free.
    # F_j is force transmitted from the left body to the right body.
    count = 42 + (6 if bases else 0)
    vectors = []
    bounds = []
    for j, angle in enumerate(angles):
        fx = np.zeros(count)
        fy = np.zeros(count)
        moment = np.zeros(count)
        for k, radius in enumerate([inner, outer]):
            fx[3*j+k] = math.sin(angle)
            fy[3*j+k] = -math.cos(angle)
            px = radius * math.cos(angle)
            py = cy + radius * math.sin(angle)
            moment[3*j+k] = px * fy[3*j+k] - py * fx[3*j+k]
        fx[3*j+2], fy[3*j+2] = math.cos(angle), math.sin(angle)
        moment[3*j+2] = -cy * math.cos(angle)
        vectors.append((fx, fy, moment))
        bounds.extend([(0, None), (0, None), (None, None)])
    rows, values = [], []
    for i, (x, _y, weight) in enumerate(blocks):
        for axis, external in enumerate([0, weight, weight * x]):
            rows.append(vectors[i][axis] - vectors[i+1][axis])
            values.append(external)
    # The selected load and geometry family is symmetric.
    rows.append(vectors[0][1]); values.append((1 + s["load"] / 100) / 2)
    if bases:
        for side, joint, offset in [(-1, 0, 42), (1, 13, 45)]:
            # Upward base endpoint forces; horizontal shear at y=-1.
            fx, fy, moment = (np.zeros(count) for _ in range(3))
            fx[offset+2] = 1
            fy[offset:offset+2] = 1
            moment[offset] = side - s["width"] / 200
            moment[offset+1] = side + s["width"] / 200
            moment[offset+2] = 1
            for axis, external in enumerate([0, s["mass"] / 100, side * s["mass"] / 100]):
                rows.append([fx, fy, moment][axis] + side * vectors[joint][axis])
                values.append(external)
            bounds.extend([(0, None), (0, None), (None, None)])
    objective = vectors[0][0]
    answers = [linprog(sign * objective, A_eq=rows, b_eq=values, bounds=bounds, method="highs") for sign in [1, -1]]
    if any(a.status == 2 for a in answers):
        assert all(a.status == 2 for a in answers)
        return {"feasible": False}
    assert answers[0].success and (answers[1].success or answers[1].status == 3), [a.message for a in answers]
    return {"feasible": True, "min": answers[0].fun,
            "max": -answers[1].fun if answers[1].success else math.inf}


def main():
    count = feasible = impossible = 0
    max_error = 0
    for line in sys.stdin:
        record = json.loads(line)
        for bases, key in [(False, "arch"), (True, "whole")]:
            expected, actual = oracle(record["state"], bases), record[key]
            assert expected["feasible"] == actual["feasible"], (record, key, expected)
            if expected["feasible"]:
                feasible += 1
                for limit in ["min", "max"]:
                    if math.isinf(expected[limit]):
                        assert actual[limit] is None  # JSON representation of the JS Infinity.
                        continue
                    error = abs(expected[limit] - actual[limit])
                    max_error = max(max_error, error)
                    assert error < 1e-8, (record, key, limit, expected)
            else:
                impossible += 1
        count += 1
    assert count > 0
    print(json.dumps({"geometryLoadCases": count, "domains": 2 * count, "LPOptimizations": 4 * count,
                      "feasibleDomains": feasible, "infeasibleDomains": impossible,
                      "maxEndpointErrorW": max_error, "scipy": scipy.__version__,
                      "oracle": "Independent endpoint-pressure block force/moment LP; quadrature centroids"}, indent=2))


if __name__ == "__main__":
    main()
