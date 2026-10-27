#!/usr/bin/env python3
"""Repack Pedersen's CC BY 4.0 scan, retaining every vertex and triangle.

No simplification, hole filling, face removal or inferred building geometry.
Python standard library. Texture reduction is a separate, recorded Pillow step.
"""
import argparse
import gzip
import hashlib
import json
import math
import struct
from pathlib import Path

parser = argparse.ArgumentParser()
parser.add_argument("obj", type=Path)
parser.add_argument("output", type=Path)
args = parser.parse_args()
raw = args.obj.read_bytes()
assert hashlib.sha256(raw).hexdigest() == "eeb258b59fae4e458a26a67e62db3bac5884df7d41bbc5b97ec0678c92c20a18", "Unexpected source bytes"
# The deposited OBJ has an opaque 104-byte trailer after its final face.
# The known source digest and expected counts pin this omission explicitly.
end = raw.index(b"\n", raw.rindex(b"\nf ") + 1) + 1
body, trailer = raw[:end], raw[end:]
assert body.endswith(b"\n") and len(trailer) == 104
positions, uv, faces = [], [], []
for line in body.decode("ascii").splitlines():
    fields = line.split()
    if not fields or fields[0].startswith("#"):
        continue
    if fields[0] == "v":
        assert len(fields) == 4
        positions.append(tuple(map(float, fields[1:])))
    elif fields[0] == "vt":
        assert len(fields) == 3
        uv.append(tuple(map(float, fields[1:])))
    elif fields[0] == "f":
        assert len(fields) == 4
        face = [tuple(int(n) - 1 for n in s.split("/")) for s in fields[1:]]
        assert all(len(v) == 2 and 0 <= v[0] < len(positions) and 0 <= v[1] < len(uv) for v in face)
        faces.append(face)
    else:
        assert fields[0] in {"mtllib", "usemtl", "o", "s", "g"}, fields[0]
assert len(positions) == 103234 and len(faces) == 189027
normal = [[0., 0., 0.] for _ in positions]
for face in faces:
    a, b, c = (positions[v[0]] for v in face)
    u, v = [b[i] - a[i] for i in range(3)], [c[i] - a[i] for i in range(3)]
    cross = (u[1]*v[2]-u[2]*v[1], u[2]*v[0]-u[0]*v[2], u[0]*v[1]-u[1]*v[0])
    for pair in face:
        for i in range(3):
            normal[pair[0]][i] += cross[i]
normals = []
for n in normal:
    length = math.hypot(*n)
    normals.append(tuple(x / length for x in n) if length else (0., 0., 0.))
# The export repeats UV coordinates per triangle. Join only identical source
# position IDs and identical UV values; seams remain seams.
lookup, vertices, indices = {}, [], []
for face in faces:
    for vi, ti in face:
        key = (vi, *uv[ti])
        if key not in lookup:
            lookup[key] = len(vertices)
            vertices.append((*positions[vi], *normals[vi], *uv[ti]))
        indices.append(lookup[key])
binary = bytearray(b"GONIAS01")
binary += struct.pack("<II", len(vertices), len(indices))
for vertex in vertices:
    binary += struct.pack("<8f", *vertex)
binary += struct.pack(f"<{len(indices)}I", *indices)
args.output.write_bytes(gzip.compress(binary, compresslevel=9, mtime=0))
print(json.dumps({
    "source": "https://doi.org/10.5281/zenodo.10374395",
    "creator": "Olof Pedersen, October 2023",
    "license": "CC BY 4.0",
    "originalSha256": hashlib.sha256(raw).hexdigest(),
    "originalBytes": len(raw),
    "opaqueTrailerBytesOmitted": len(trailer),
    "opaqueTrailerSha256": hashlib.sha256(trailer).hexdigest(),
    "originalPositions": len(positions), "triangles": len(faces),
    "renderVerticesIncludingUVSeams": len(vertices),
    "outputBytes": args.output.stat().st_size,
    "outputSha256": hashlib.sha256(args.output.read_bytes()).hexdigest(),
    "decodedBytes": len(binary),
    "positions": "Original coordinates converted to IEEE float32; no shape edits or simplification",
    "normals": "New area-weighted vertex normals, computed from deposited triangle winding; not measured surface normals",
    "uv": "Original texture coordinates, float32; only identical position/UV pairs joined",
    "bounds": [[min(v[i] for v in positions), max(v[i] for v in positions)] for i in range(3)]
}, indent=2))
