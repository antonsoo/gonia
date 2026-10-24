"""Independent force/work and literal route oracle; no TypeScript implementation imported."""
import json
import math
import sys
from fractions import Fraction

count = 0
max_error = 0.0
for line in sys.stdin:
    row = json.loads(line)
    s, m = row['state'], row['model']
    lower = {'single': 0, 'three': 1, 'five': 2}[s['rig']]
    n = 2 * lower + (s['anchor'] == 'moving')
    distance = Fraction(str(s['distance']))
    rise = distance if s['hold'] == 'rise' else distance / n
    rope = n * rise
    tension = Fraction(s['weight'], n)
    hand = tension / s['arm']
    hand_path = rope * s['arm']
    expected = {'supports': n, 'rise': rise, 'rope': rope, 'tension': tension,
                'hand': hand, 'handPath': hand_path, 'work': s['weight'] * rise,
                'ropeWork': s['weight'] * rise, 'handWork': s['weight'] * rise,
                'turns': float(rope) / (.3 * math.pi)}
    for key, value in expected.items():
        err = abs(float(value) - m[key])
        assert err < 1e-8, (s, key, value, m[key])
        max_error = max(max_error, err)
    # Rebuild each endpoint and semicircle independently from the literal layout.
    for h, actual in [(float(rise), m['route']), (.713, row['probe'])]:
        r, top, bottom = .16, 1.1, 5 - h
        start = bottom if s['anchor'] == 'moving' else top + .5
        parts = [('line', 0, start, 0, top)]
        for wheel in range(lower + 1):
            parts.append(('arc', (4 * wheel + 1) * r, top, r, 'upper'))
            x = (4 * wheel + 2) * r
            if wheel < lower:
                parts.extend([('line', x, top, x, bottom),
                              ('arc', x + r, bottom, r, 'lower'),
                              ('line', x + 2 * r, bottom, x + 2 * r, top)])
            else:
                parts.append(('line', x, top, x, 5.8))
        assert len(parts) == len(actual)
        length = 0
        for expected_part, a in zip(parts, actual):
            assert a['kind'] == expected_part[0]
            keys = ['x1', 'y1', 'x2', 'y2'] if a['kind'] == 'line' else ['cx', 'cy', 'radius', 'side']
            for key, value in zip(keys, expected_part[1:]):
                if isinstance(value, str):
                    assert value == a[key]
                else:
                    assert abs(value - a[key]) < 1e-9
            if a['kind'] == 'line':
                length += math.hypot(a['x2'] - a['x1'], a['y2'] - a['y1'])
            else:
                length += math.pi * a['radius']
        if h == float(rise):
            assert abs(length - m['length']) < 1e-9
    count += 1
assert count == 540, count
print(json.dumps({'cases': count, 'method': 'Python Fraction force/work, independently constructed rope endpoints and semicircles at selected and probe poses', 'max_absolute_numeric_error': max_error, 'passed': True}, indent=2))
