"""Independent rational grid enumeration and shaft/wall distance checks."""
from fractions import Fraction as F
import json
import sys

cases = 0
positions = 0
for line in sys.stdin:
    m = json.loads(line)
    g = F(str(m['state']['gap']))
    p = g + 1
    expected_present = 76 if m['state']['kind'] == 'double' else 42
    assert m['present'] == expected_present
    assert F(str(m['wideClear'])) == 2*g + 1
    assert F(str(m['continuousStrip'])) == (g if expected_present == 76 else 2*g+1)
    for ring, inset in [('outer', 0), ('inner', 1)]:
        # Enumerate a rectangular lattice by membership, independently of circuit order.
        expected = {(x, y) for x in range(inset, 15-inset) for y in range(inset, 8-inset)
                    if x in (inset, 14-inset) or y in (inset, 7-inset)}
        actual = m[ring]
        assert len(actual) == len(expected)
        assert {(c['gridX'], c['gridY']) for c in actual} == expected
        assert len({c['id'] for c in actual}) == len(expected)
        for c in actual:
            assert F(str(c['x'])) == c['gridX']*p
            assert F(str(c['y'])) == c['gridY']*p
            assert c['present'] == (ring == 'outer' or expected_present == 76)
        positions += len(actual)
    # Derive the passage directly from wall and shaft faces.
    wall_face = F(str(m['cella']['y']))
    assert wall_face - F(1, 2) == 2*g + 1
    assert wall_face - (p + F(1, 2)) == g
    assert (p - F(1, 2)) - F(1, 2) == g
    cases += 1
assert cases == 14, cases
print(json.dumps({'cases': cases, 'independent_position_checks': positions,
                  'method': 'Fraction lattice membership and independently derived face distances',
                  'textual_reading_decided': False}, indent=2))
