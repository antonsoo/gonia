"""Independently move a polygon about successive ground vertices.

The application uses a closed form for each quarter-turn. Here a rectangle's
world vertices are transformed about its actual advancing support vertex,
one interval at a time. Actual browser SVG/CSV captures can be checked too.
"""
import csv
import io
import json
import math
from pathlib import Path
import sys

maximum=0.0
def solve(state,angle=None):
    w,h,r=state['width'],state['height'],state['radius']
    angle=state['angle'] if angle is None else angle
    vertices=[(-w/2,0),(w/2,0),(w/2,h),(-w/2,h)]
    if state['kind']=='bare':
        remaining=angle
        while remaining>1e-12:
            bottom=min(y for x,y in vertices)
            pivot=max((p for p in vertices if abs(p[1]-bottom)<1e-8),key=lambda p:p[0])
            step=min(90,remaining)*math.pi/180
            c,s=math.cos(step),math.sin(step)
            vertices=[(pivot[0]+(x-pivot[0])*c+(y-pivot[1])*s,pivot[1]-(x-pivot[0])*s+(y-pivot[1])*c) for x,y in vertices]
            remaining-=min(90,remaining)
        centre=(sum(x for x,y in vertices)/4,sum(y for x,y in vertices)/4)
    else:
        step=angle*math.pi/180
        c,s=math.cos(step),math.sin(step)
        centre=(r*step,r)
        vertices=[(centre[0]+x*c+(y-h/2)*s,centre[1]-x*s+(y-h/2)*c)for x,y in vertices]
    lowest=0 if state['kind']=='shaft' else min(y for x,y in vertices)
    return centre,vertices,lowest

def close(a,b,label):
    global maximum
    error=abs(a-b);maximum=max(maximum,error)
    assert error<1e-9,(label,a,b,error)

cases=json.load(sys.stdin)
for c in cases:
    centre,vertices,lowest=solve(c['state'])
    for i,axis in enumerate(('x','y')):close(c['centre'][axis],centre[i],('centre',c['state']))
    close(c['lowest'],lowest,('lowest',c['state']))
    for actual,expected in zip(c['corners'],vertices):
        close(centre[0]+actual['x'],expected[0],'corner x');close(centre[1]+actual['y'],expected[1],'corner y')
    state=c['state'];expected_distance=2*(state['width']+state['height']) if state['kind']=='bare' else math.tau*state['radius']
    close(c['fullTurnDistance'],expected_distance,'full turn advance')
rendered=0;csv_samples=0
if len(sys.argv)>1:
    report=json.loads(Path(sys.argv[1]).read_text())
    for c in report['constructions']:
        centre,vertices,lowest=solve(c['state']);rendered+=1
        close(c['svg']['worldCentre']['x'],centre[0],'visible advance')
        close(c['svg']['worldCentre']['y'],centre[1],'visible height')
        close(c['svg']['centre']['y'],c['svg']['groundY']-centre[1]*c['svg']['scale'],'SVG centre height')
        if c['svg']['radiusPixels'] is not None:close(c['svg']['radiusPixels']/c['svg']['scale'],c['state']['radius'],'visible circular radius')
        for mark in c['svg']['ruler']:
            close(float(mark['label']),mark['world'],'visible road label')
            close((mark['x']-c['svg']['originX'])/c['svg']['scale']+centre[0],mark['world'],'visible road advance')
        if c['state']['kind']!='shaft':
            for actual,expected in zip(c['svg']['vertices'],vertices):
                close((actual[0]-c['svg']['originX'])/c['svg']['scale']+centre[0],expected[0],'SVG corner x')
                close((c['svg']['groundY']-actual[1])/c['svg']['scale'],expected[1],'SVG corner y')
        graph=c['graph']
        for i in range(0,len(graph['path']),2):
            angle=(graph['path'][i]-graph['xOrigin'])/graph['xPerDegree']
            curve,_,_=solve({**c['state'],'kind':'bare'},angle)
            close((graph['yOrigin']-graph['path'][i+1])/graph['yPerUnit'],curve[1],'visible height curve')
        for row in csv.DictReader(io.StringIO(c.get('csv',''))):
            cp,vp,lp=solve(c['state'],float(row['angle_degrees']));csv_samples+=1
            close(float(row['centre_advance']),cp[0],'downloaded advance')
            close(float(row['centre_height']),cp[1],'downloaded height')
            close(float(row['lowest_stone_point']),lp,'downloaded lowest point')
print(json.dumps({'model_cases':len(cases),'rendered_cases':rendered,'native_csv_samples':csv_samples,'maximum_coordinate_difference':maximum,'method':'successive rigid rotations around actual support vertices; independent world-coordinate polygon and native CSV checks; no app imports'},indent=2))
