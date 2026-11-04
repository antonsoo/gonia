"""Check both ends of every numerical bracket against independent block statics.

The imported LP balances forces and moments for each stone, with two independent
nonnegative endpoint pressures and a shear at every joint and base. It does not
use the production elimination of the global H,C constraints.
"""
import importlib.util
import json
from pathlib import Path
import sys

spec = importlib.util.spec_from_file_location("arch_oracle", Path(__file__).with_name("arch-oracle.py"))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
options = {"primal_feasibility_tolerance": 1e-9, "dual_feasibility_tolerance": 1e-9}
counts = {"geometries": 0, "brackets": 0, "geometry_failures": 0, "above_range": 0, "lp_optimizations": 0}
max_width = 0
for line in sys.stdin:
    record = json.loads(line)
    counts["geometries"] += 1
    for bases, result in zip([False, True], record["results"], strict=True):
        state = record["state"]
        def feasible(mu):
            counts["lp_optimizations"] += 2
            return module.oracle({**state, "friction": mu}, bases, options)["feasible"]
        if result["kind"] == "geometry":
            assert not feasible(None), (state, bases, result)
            counts["geometry_failures"] += 1
        elif result["kind"] == "above-range":
            assert feasible(None) and not feasible(2), (state, bases, result)
            counts["above_range"] += 1
        else:
            assert not feasible(result["lower"]), (state, bases, "lower", result)
            assert feasible(result["upper"]), (state, bases, "upper", result)
            assert 0 < result["upper"] - result["lower"] < 1e-6
            max_width = max(max_width, result["upper"] - result["lower"])
            counts["brackets"] += 1
assert counts["geometries"] > 0
print(json.dumps({**counts, "max_bracket_width": max_width, "scipy": module.scipy.__version__,
                  "oracle": "Independent endpoint-pressure and shear LP, both actual endpoints, primal/dual tolerance 1e-9"}, indent=2))
