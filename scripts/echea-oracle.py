"""Independent integration of the defining ODE, without the application's closed form.

Run: node --import tsx scripts/echea-cases.ts | python3 scripts/echea-oracle.py
The source row is independently specified as pitch relationships in Fraction.
"""
import json
import math
import sys
from fractions import Fraction

worst_x = worst_v = 0.0
count = 0
for line in sys.stdin:
    case = json.loads(line)
    if 'row' in case:
        expected = [Fraction(2), Fraction(3, 2), Fraction(9, 8), Fraction(4, 3),
                    Fraction(1), Fraction(3, 4), Fraction(9, 16), Fraction(3, 4),
                    Fraction(1), Fraction(4, 3), Fraction(9, 8), Fraction(3, 2), Fraction(2)]
        assert len(case['row']) == 13
        for item, ratio in zip(case['row'], expected):
            assert abs(item['hz'] - float(220 * ratio)) < 1e-10
        continue
    q = case['state']['q']
    f0, f = case['natural'], case['drive']
    w0, w = math.tau * f0, math.tau * f
    damping = w0 / q
    force = w0 * w0 / q
    max_step = 1 / (max(f0, f) * 160)
    x = v = t = 0.0
    for item in case['times']:
        target = item['t']
        # Integrate separately to the drive cutoff; never smear the discontinuity.
        while target - t > 1e-13:
            driven = t < 1.5 - 1e-13
            end = min(target, 1.5) if driven else target
            steps = math.ceil((end - t) / max_step)
            if steps < 1:
                t = end
                continue
            h = (end - t) / steps
            def accel(at, pos, vel):
                return -damping * vel - w0 * w0 * pos + (force * math.sin(w * at) if driven else 0)
            for _ in range(steps):
                a1 = accel(t, x, v)
                x2, v2 = x + h*v/2, v + h*a1/2
                a2 = accel(t+h/2, x2, v2)
                x3, v3 = x + h*v2/2, v + h*a2/2
                a3 = accel(t+h/2, x3, v3)
                x4, v4 = x + h*v3, v + h*a3
                a4 = accel(t+h, x4, v4)
                x += h * (v + 2*v2 + 2*v3 + v4) / 6
                v += h * (a1 + 2*a2 + 2*a3 + a4) / 6
                t += h
            t = end
        dx, dv = abs(x-item['x']), abs(v-item['v'])/w0
        worst_x, worst_v = max(worst_x, dx), max(worst_v, dv)
        assert dx < 2e-5 and dv < 2e-5, (case['state'], target, dx, dv)
    # A separate complex dynamic-stiffness calculation for the steady state.
    displacement = abs(force / complex(w0*w0-w*w, damping*w))
    assert abs(displacement-case['amplitude']) < 1e-12
    assert abs(case['tau'] - 2/damping) < 1e-12
    count += 1
print(json.dumps({'cases': count, 'samples_per_case': 10, 'method': 'RK4 integration, at least 160 steps per fastest cycle; exact drive cutoff', 'max_displacement_error': worst_x, 'max_velocity_error_divided_by_w0': worst_v, 'row': '13 frequencies independently checked with rational arithmetic'}, indent=2))
