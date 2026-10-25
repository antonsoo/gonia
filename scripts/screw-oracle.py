#!/usr/bin/env python3
"""Independent numerical geometry: radial strips, not the app's angular primitive.

Requires NumPy and SciPy for Gauss-Legendre nodes and adaptive quadrature.
Only reads the emitted measurements; never imports application code.
"""
import json
import math
import sys
import warnings
import numpy as np
from scipy.integrate import quad, IntegrationWarning

P = math.pi
nodes, weights = np.polynomial.legendre.leggauss(96)

def area(rho, lam, count, phi):
    if lam >= 1:
        return 0.0
    first = math.acos(-lam / rho) if lam < rho else P
    water = rho * math.sin(first) + lam * (first - phi)
    if water <= -1:
        return 0.0
    # At each radius, intersect the lower circular arc with the channel.
    # For positive levels, discard the disconnected component across the
    # shaft's dry crest. This selects the bucket around its first bottom.
    lower = phi - 2 * P / count
    upper = phi
    if water >= 0:
        crest = math.asin(min(1.0, water / rho))
        lower = max(lower, P - crest)
        upper = min(upper, 2 * P + crest)
    if upper <= lower:
        return 0.0
    # Split radii where a clipped circular arc meets a blade, or is tangent.
    cuts = [rho, 1.0]
    for r in [abs(water), *[water / math.sin(t) for t in [lower, upper] if abs(math.sin(t)) > 1e-14]]:
        if rho < r < 1:
            cuts.append(r)
    total = 0.0
    for left, right in zip(sorted(cuts), sorted(cuts)[1:]):
        radii = (left + right) / 2 + (right - left) / 2 * nodes
        ratio = water / radii
        a = np.arcsin(np.clip(ratio, -1, 1))
        width = np.maximum(0, np.minimum(upper, 2 * P + a) - np.maximum(lower, P - a))
        width = np.where(ratio <= -1, 0, np.where(ratio >= 1, upper - lower, width))
        total += (right - left) / 2 * float(np.dot(weights, radii * width))
    return total

def main():
    data = json.load(sys.stdin)
    max_area_error = max_fraction_error = 0.0
    checked = 0
    with warnings.catch_warnings():
        warnings.simplefilter("error", IntegrationWarning)
        for row in data["cases"]:
            s, g, c = row["state"], row["geometry"], row["capacity"]
            rho = .5 if s["units"] == "digits" else 2/3
            pitch = 2 * P * rho * s["lead"] / 100
            lam = math.tan(s["angle"] * P / 1800) * pitch / (2 * P)
            assert abs(g["pitch"] - pitch) < 1e-12
            assert abs(g["lambda"] - lam) < 1e-12
            for section in row["sections"]:
                expected = area(rho, lam, s["starts"], section["phi"])
                error = abs(expected - section["area"])
                max_area_error = max(max_area_error, error)
                assert error < 1.5e-6, (s, section, expected, error)
                checked += 1
            # Integrate over a deliberately broad independent interval, without
            # using the application's root-solved wet endpoint.
            if lam < 1:
                first = math.acos(-lam/rho) if lam < rho else P
                last = min(first + 2*P + 2*P/s["starts"], first + (rho*math.sin(first)+1)/lam)
                cuts = np.linspace(first, last, 25)
                volume = sum(quad(lambda phi: area(rho, lam, s["starts"], phi), a, b, epsabs=2e-8, limit=150)[0] for a,b in zip(cuts,cuts[1:]))
                fraction = s["starts"] * volume / (2 * P * P)
            else:
                fraction = 0.0
            error = abs(c["fraction"] - fraction)
            max_fraction_error = max(max_fraction_error, error)
            assert error < 1.5e-6, (s, c["fraction"], fraction, error)
            assert abs(c["perTurn"] - fraction * P * pitch) < 4e-5
            assert c["converged"]
    print(json.dumps({"cases": len(data["cases"]), "sections": checked, "maxAreaDifference": max_area_error, "maxFractionDifference": max_fraction_error, "method": "96-point Gauss-Legendre radial-strip integration plus independent SciPy quadrature; broad wet interval", "passed": True}, indent=2))


if __name__ == "__main__":
    main()
