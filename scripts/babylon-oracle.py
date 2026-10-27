#!/usr/bin/env python3
"""Independent rational calculations from the published numerical tables.

stdin: application cases, or --browser: actual downloaded CSV and SVG DOM.
Does not import application code or the retained source JSON.
"""
import argparse
import csv
import json
import math
import sys
from fractions import Fraction as F
from pathlib import Path

TABLET = [(90,90,33),(78,78,18),(60,60,6),(51,51,6),(42,42,6),None,(24,F(45,2),15)]
STONE = [(F(124,10),F(37,10)),(11,F(13,10)),(F(97,10),F(12,10)),(F(84,10),F(12,10)),(7,F(12,10)),(F(55,10),F(11,10)),(F(39,10),F(28,10))]

def close(actual,expected):
    if expected is None:
        assert actual in (None,""), (actual,expected)
    else:
        assert math.isclose(float(actual),float(expected),rel_tol=2e-12,abs_tol=2e-12),(actual,str(expected))

def expected(s):
    factor=F(s['base'],10)/(F(25,2) if s['ruler']=='overall' else F(62,5))
    rows=[]; t=F(0);u=F(0)
    for i,(tablet,stone) in enumerate(zip(TABLET,STONE)):
        if i==5:
            tablet=(F(s['width']*3,2),F(s['width']*3,2),F(s['height']*3,2)) if s['supplied'] else (None,None,None)
        w,d,h=tablet
        rows.append({'level':i+1,'width':w,'depth':d,'height':h,'bottom':None if i==6 and not s['supplied'] else t,'steleWidth':stone[0]*factor,'steleHeight':stone[1]*factor,'steleBottom':u,'imageWidth':stone[0],'imageHeight':stone[1]})
        if h is not None:t+=h
        u+=stone[1]*factor
    return rows,factor,(t if s['supplied'] else None),u

parser=argparse.ArgumentParser();parser.add_argument('--browser',type=Path);args=parser.parse_args()
cases=csv_rows=drawings=0
if not args.browser:
    coverage=set()
    for line in sys.stdin:
        item=json.loads(line);rows,factor,total,image=expected(item['state']);m=item['model']
        s=item['state'];coverage.add((s['supplied'],s['base'],s['ruler'],s['width'],s['height']))
        for a,b in zip(m['rows'],rows):
            for key,value in b.items():close(a[key],value)
        close(m['factor'],factor);close(m['tabletHeight'],total);close(m['steleHeight'],image);close(m['knownHeight'],84)
        cases+=1
    expected_coverage={(s,b,r,w,h) for s in (True,False) for b in (900,915) for r in ('overall','terrace') for w in range(17,28) for h in range(1,13)}
    assert cases==1056 and coverage==expected_coverage,'Incomplete or repeated case inventory'
else:
    report=json.loads(args.browser.read_text())
    assert not report.get('partial') and {(c['engine'],c['width']) for c in report['configurations']}=={('chromium',1440),('chromium',375),('firefox',1440),('firefox',375)}
    for config in report['configurations']:
        assert len(config['samples'])==7 and {s['label'] for s in config['samples']}=={'initial','unknown','tall','short','different-ruler','sanctuary','final'}
        for item in config['samples']:
            s=item['state'];rows,factor,total,image=expected(s)
            with (args.browser.parent/item['csv']).open(newline='') as stream:actual=list(csv.DictReader(stream))
            assert len(actual)==7
            for a,b in zip(actual,rows):
                for ak,bk in [('level','level'),('tablet_length_m','width'),('tablet_breadth_m','depth'),('tablet_height_m','height'),('tablet_bottom_m','bottom'),('stele_width_cm','imageWidth'),('stele_height_cm','imageHeight'),('projected_width_m','steleWidth'),('projected_height_m','steleHeight'),('projected_bottom_m','steleBottom')]:close(a[ak],b[bk])
                close(a['calibration_width_cm'],F(25,2) if s['ruler']=='overall' else F(62,5));close(a['assigned_base_m'],F(s['base'],10));csv_rows+=1
            for g in item['geometry']:
                r=rows[g['level']-1]
                if g['kind']=='tablet':
                    close(g['width'],r['width']);close(g['height'],r['height']);close(g['bottom'],r['bottom'])
                else:
                    close(g['width'],r['steleWidth']);close(g['height'],r['steleHeight']);close(g['bottom'],r['steleBottom'])
                # Actual SVG rectangle width/height agree with each other and
                # the same physical metre scale. Missing-gap geometry is layout.
                if g['width'] is not None:
                    close(F(str(g['rectWidth']))/F(str(g['width'])),F(18,5))
                    close(F(str(g['rectHeight']))/F(str(g['height'])),F(18,5))
                drawings+=1
            cases+=1
print(json.dumps({'status':'passed','cases':cases,'downloadedCsvRows':csv_rows,'actualSvgGroups':drawings,'method':'Python Fraction, separate published numerical tables; no application imports'},indent=2))
