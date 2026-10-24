"""Check actual downloaded PCM, independently of TypeScript audio generation.

Usage: python3 scripts/echea-audio-oracle.py <browser-output-directory>
"""
import base64
import io
import json
import math
from pathlib import Path
import re
import struct
import sys
import wave

root = Path(sys.argv[1])
ratios = [2, 3/2, 9/8, 4/3, 1, 3/4, 9/16, 3/4, 1, 4/3, 9/8, 3/2, 2]

def pcm(data):
    with wave.open(io.BytesIO(data), 'rb') as w:
        assert (w.getnchannels(), w.getsampwidth(), w.getframerate()) == (1, 2, 24000)
        values = struct.unpack('<' + 'h'*w.getnframes(), w.readframes(w.getnframes()))
        assert max(abs(v) for v in values) < 32767
        assert values[0] == values[-1] == 0
        return values, w.getframerate()

def frequency(values, rate, start, end):
    crossings = []
    for i in range(int(start*rate), min(int(end*rate), len(values))-1):
        if values[i] <= 0 < values[i+1]:
            crossings.append((i - values[i] / (values[i+1] - values[i])) / rate)
    assert len(crossings) > 10
    return (len(crossings)-1) / (crossings[-1]-crossings[0])

def rms(values, start=.7, end=1.4):
    part = values[int(start*24000):int(end*24000)]
    return math.sqrt(sum(x*x for x in part)/len(part))/32767

rows=[]
for folder in sorted(p for p in root.iterdir() if p.is_dir()):
    if not (folder/'row.wav').exists():
        continue
    row_bytes=(folder/'row.wav').read_bytes()
    row, rate=pcm(row_bytes)
    frequencies=[]
    for i, ratio in enumerate(ratios):
        measured=frequency(row, rate, i*.62+.08, i*.62+.4)
        assert abs(measured-220*ratio) < .002, (i, measured, ratio*220)
        frequencies.append(measured)
    matched_bytes=(folder/'matched.wav').read_bytes()
    detuned_bytes=(folder/'detuned.wav').read_bytes()
    matched,_=pcm(matched_bytes)
    detuned,_=pcm(detuned_bytes)
    f0=220*4/3
    drive=f0*2**(1/12)
    on=frequency(detuned,rate,.7,1.4)
    off=frequency(detuned,rate,1.54,1.70)
    assert abs(on-drive)<.02
    assert abs(off-f0*math.sqrt(1-1/(4*120**2)))<.03
    ratio=rms(detuned)/rms(matched)
    expected=1/abs(complex(120*(1-2**(1/6)),2**(1/12)))
    assert abs(ratio-expected)<.0002
    # The portable document carries the same independently checked audio bytes.
    embedded=re.findall(r'<audio controls src="data:audio/wav;base64,([^"]+)"', (folder/'reading.html').read_text())
    assert len(embedded)==2
    assert base64.b64decode(embedded[0])==row_bytes
    assert base64.b64decode(embedded[1])==matched_bytes
    offline=folder/'offline-reading.html'
    if offline.exists():
        embedded_offline=re.findall(r'<audio controls src="data:audio/wav;base64,([^"]+)"',offline.read_text())
        assert base64.b64decode(embedded_offline[1])==detuned_bytes
    rows.append({'browser':folder.name,'row_measured_hz':frequencies,'detuned_drive_measured_hz':on,'free_decay_measured_hz':off,'detuned_to_matched_rms':ratio,'expected_steady_ratio':expected,'embedded_pcm_matches_downloads':True})
print(json.dumps({'method':'PCM16 positive zero crossings with linear interpolation; RMS; exact embedded WAV bytes','configurations':rows},indent=2))
