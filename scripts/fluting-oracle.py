"""Independent circle constraints, law of cosines and Green boundary integrals.

No application import. Also accepts real-browser receipts to inspect exported
CSV, actual SVG arc commands, printed dimensions and vector calibration bars.
"""
import csv,io,json,math,re,sys,xml.etree.ElementTree as ET
checks=0
worst=0.0
by_tolerance={}

def near(a,b,tol=2e-8):
 global checks,worst
 checks+=1
 error=abs(float(a)-float(b))/max(1,abs(float(b)))
 worst=max(worst,error)
 by_tolerance[str(tol)]=max(by_tolerance.get(str(tol),0),error)
 assert error<tol,(a,b,error,tol)

def reference(s):
 w=s['width'];recipe=s['recipe'];count=24 if recipe=='ionic' else 20
 land=s['fillet']/100 if recipe=='ionic' else 0
 half=math.pi/count*(1-land);R=w/(2*math.sin(half));m=R*math.cos(half)
 C=(w/2,-w/2 if recipe=='doric' else 0)
 r=math.dist((0,0),C) if recipe!='flat' else 0
 phi=math.pi/2 if recipe=='doric' else math.pi if recipe=='ionic' else 0
 def point(t):
  if recipe=='flat':return (w*t,0)
  # Rotate vector A-C by the selected negative sweep, independently of app's angle origin.
  a=-phi*t;x,y=-C[0],-C[1]
  return C[0]+x*math.cos(a)-y*math.sin(a),C[1]+x*math.sin(a)+y*math.cos(a)
 def world(i,t):
  u,v=point(t);theta=2*math.pi*i/count-math.pi/2
  return ((m-v)*math.cos(theta)-(u-w/2)*math.sin(theta),(m-v)*math.sin(theta)+(u-w/2)*math.cos(theta))
 def centre(i):
  theta=2*math.pi*i/count-math.pi/2
  return ((m-C[1])*math.cos(theta),(m-C[1])*math.sin(theta))
 def arc_integral(c,r,start,delta):
  end=start+delta
  return r*r*delta+r*c[0]*(math.sin(end)-math.sin(start))-r*c[1]*(math.cos(end)-math.cos(start))
 integral=0
 for i in range(count):
  a,b=world(i,0),world(i,1)
  if recipe=='flat':integral+=a[0]*b[1]-b[0]*a[1]
  else:
   c=centre(i);start=math.atan2(a[1]-c[1],a[0]-c[0]);integral+=arc_integral(c,r,start,-phi)
  if land:integral+=arc_integral((0,0),R,2*math.pi*i/count-math.pi/2+half,2*math.pi/count-2*half)
 remaining=integral/2;removed=math.pi*R*R-remaining
 return dict(w=w,r=r,C=C,phi=phi,R=R,m=m,count=count,remaining=remaining,removed=removed,point=point,world=world,centre=centre)

def gauge(s,ref):
 x,y=ref['point'](s['point']/100);w=s['width']
 if s['recipe']=='flat':return x,y,180,w-x
 a,b=math.hypot(x,y),math.hypot(w-x,y)
 angle=math.degrees(math.acos(max(-1,min(1,(a*a+b*b-w*w)/(2*a*b)))))
 # A line perpendicular to PA through P has slope -x/y. Intersect at the chord y=0.
 contact=x+y*y/x
 return x,y,angle,abs(w-contact)

def paper(text,s):
 root=ET.fromstring(text);assert root.attrib['width']=='190mm' and root.attrib['height']=='277mm';assert root.attrib['viewBox']=='0 0 190 277'
 bar=next(el for el in root.iter() if el.attrib.get('id')=='calibration')
 assert bar.attrib['d']=='M10,234 V238 M10,236 H35 M35,234 V238'
 assert 'Print at 100%' in text
 cut=next(el for el in root.iter() if el.attrib.get('id')=='print-cut')
 if s['recipe']=='flat':assert cut.attrib['d']==f"M0,0 L{s['width']},0"
 else:
  nums=[float(x) for x in re.findall(r'-?\d+(?:\.\d+)?',cut.attrib['d'])]
  near(nums[2],reference(s)['r'],1e-8);near(nums[-2],s['width'])

def svg_path(path,s):
 ref=reference(s);numbers=[float(x) for x in re.findall(r'-?\d+(?:\.\d+)?',path)]
 start=numbers[:2];near(start[0],ref['world'](0,0)[0],1e-6);near(start[1],ref['world'](0,0)[1],1e-6)
 # Commands are checked independently, including concave rather than outward flute arcs.
 chunks=re.findall(r'([AL])([^ALMZ]+)',path)
 expected=[]
 for i in range(ref['count']):
  expected.append(('L' if s['recipe']=='flat' else 'A',i,1,False))
  if s['recipe']=='ionic' and s['fillet']:expected.append(('A',(i+1)%ref['count'],0,True))
 assert len(chunks)==len(expected),(len(chunks),len(expected))
 for (command,raw),(cmd,i,t,land) in zip(chunks,expected):
  assert command==cmd
  n=[float(x) for x in re.findall(r'-?\d+(?:\.\d+)?',raw)]
  if command=='A':
   near(n[0],ref['R'] if land else ref['r'],1e-6);near(n[1],n[0]);assert n[2:5]==[0,0,1 if land else 0]
  x,y=ref['world'](i,t);near(n[-2],x,1e-6);near(n[-1],y,1e-6)

if len(sys.argv)==1:
 data=json.load(sys.stdin)
 for case in data['cases']:
  s=case['state'];ref=reference(s);g=case['gauge'];c=case['column'];x,y,angle,miss=gauge(s,ref)
  for a,b in [(g['p']['x'],x),(g['p']['y'],y),(g['angle'],angle),(g['miss'],miss),(c['diameter'],2*ref['R']),(c['remaining'],ref['remaining']),(c['removed'],ref['removed'])]:near(a,b)
  for i,p in enumerate(case['samples']):
   x,y=ref['point'](i/20);near(p['x'],x);near(p['y'],y)
  for i,section in enumerate(case['section']):
   for j,p in enumerate(section['points']):
    x,y=ref['world'](i,j/20);near(p['x'],x);near(p['y'],y)
  assert case['roundTrip']=={'state':s,'warning':False}
  svg_path(case['path'],s)
  if case['paper']:paper(case['paper'],s)
 report={'cases':len(data['cases'])}
else:
 data=json.load(open(sys.argv[1]));rows=0
 for view in data['geometry']:
  s=view['state'];ref=reference(s);x,y,angle,miss=gauge(s,ref)
  if s['recipe']!='flat':near(view['point'][0],100*x/s['width'],1e-6);near(view['point'][1],100*y/s['width'],1e-6)
  svg_path(view['sectionPath'],s)
  near(view['depth'],ref['point'](.5)[1],.0006)
  if s['recipe']!='flat':near(view['angle'],angle,.0006);near(view['miss'],miss,.0006)
 for item in data['files']:
  if item['kind']=='template':paper(open(item['path']).read(),item['state'])
  if item['kind']!='csv':continue
  source_rows=list(csv.DictReader(io.StringIO(open(item['path']).read())))
  assert len(source_rows)==276+(984 if item['state']['recipe']=='ionic' else 820)
  assert {r['recipe'] for r in source_rows if r['kind']=='section'}=={item['state']['recipe']}
  for row in source_rows:
   assert float(row['width_mm'])==item['state']['width'], 'Receipt points to another exported state'
   assert float(row['fillet_percent_of_pitch'])==(item['state']['fillet'] if row['recipe']=='ionic' else 0)
   rows+=1;s={**item['state'],'recipe':row['recipe'],'width':float(row['width_mm']),'fillet':float(row['fillet_percent_of_pitch']),'point':float(row['point_percent'])};ref=reference(s)
   near(row['shaft_diameter_mm'],2*ref['R']);near(row['removed_area_mm2'],ref['removed'])
   if row['kind']!='section':
    x,y,a,m=gauge(s,ref)
    for key,value in [('x_mm',x),('y_mm',y),('edge_angle_deg',a),('chord_contact_miss_mm',m)]:near(row[key],value)
   else:
    x,y=ref['world'](int(row['flute_index']),int(row['sample_index'])/40)
    near(row['x_mm'],x);near(row['y_mm'],y)
 report={'browser_views':len(data['geometry']),'csv_rows':rows}
print(json.dumps({'status':'passed',**report,'comparisons':checks,'worst_relative_error':worst,'max_relative_error_by_tolerance':by_tolerance,'method':'circle rotation, law of cosines, perpendicular line intersection and Green boundary integral; no application imports'},indent=2))
