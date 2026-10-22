"""Independent rotations of the source chord, law-of-cosines angle measures,
triangle base angles, actual facing-arc commands and exported coordinates.
No application imports or atan2 edge-angle calculation.
"""
import csv,io,json,math,re,sys,xml.etree.ElementTree as ET
checks=0;errors={}
def near(a,b,tol=1e-9):
 global checks
 checks+=1;e=abs(float(a)-float(b))/max(1,abs(float(b)));errors[str(tol)]=max(errors.get(str(tol),0),e)
 assert e<tol,(a,b,e,tol)
def angle(a,p,b):
 x=math.dist(a,p);y=math.dist(b,p);z=math.dist(a,b)
 return math.degrees(math.acos(max(-1,min(1,(x*x+y*y-z*z)/(2*x*y)))))
def reference(s):
 w=s['width'];a=(0,0);b=(w,0);c=(w/2,-w/2 if s['recipe']=='doric' else 0);r=math.dist(a,c);phi=math.pi/2 if s['recipe']=='doric' else math.pi;t=s['point']/100
 def rotate(delta):
  x,y=-c[0],-c[1]
  return (c[0]+x*math.cos(delta)-y*math.sin(delta),c[1]+x*math.sin(delta)+y*math.cos(delta))
 p=rotate(-phi*t);q=rotate((2*math.pi-phi)*t)
 return dict(a=a,b=b,c=c,r=r,p=p,q=q,pAngle=angle(a,p,b),qAngle=angle(a,q,b),pBaseA=angle(a,p,c),pBaseB=angle(c,p,b),cut=math.degrees(phi))
def pair(s,actual):
 r=reference(s)
 for key in ['a','b','c','p','q']:
  near(actual[key]['x'],r[key][0]);near(actual[key]['y'],r[key][1])
 for key in ['pAngle','qAngle','pBaseA','pBaseB']:near(actual[key],r[key])
 near(r['pAngle']+r['qAngle'],180);near(actual['pBaseA']+actual['pBaseB'],actual['pAngle'])
 for point in [r['p'],r['q']]:near(math.dist(point,r['c']),r['r'])
def drawing(text,s,name):
 root=ET.fromstring(text);r=reference(s);p=r[name.lower()];prefix='segment-'+name.lower();els={e.attrib.get('id'):e for e in root.iter()}
 circle=els[prefix+'-circle'];near(circle.attrib['cx'],50);near(circle.attrib['cy'],r['c'][1]*100/s['width']);near(circle.attrib['r'],r['r']*100/s['width'],1e-6)
 region=els[prefix+'-region'];assert region.attrib['d'].endswith(' Z');v=list(map(float,re.findall(r'-?\d+(?:\.\d+)?',region.attrib['d'])))
 assert v[4:7]==[0,1 if name=='Q' and s['recipe']=='doric' else 0,1 if name=='Q' else 0]
 ray=list(map(float,re.findall(r'-?\d+(?:\.\d+)?',els[prefix+'-rays'].attrib['d'])))
 assert ray[:2]==[0,0] and ray[-2:]==[100,0]
 near(ray[2],p[0]*100/s['width'],1e-6);near(ray[3],p[1]*100/s['width'],1e-6)
 point=els[prefix+'-point'];near(point.attrib['cx'],p[0]*100/s['width'],1e-6);near(point.attrib['cy'],p[1]*100/s['width'],1e-6)
 path=els[prefix+'-facing'];n=list(map(float,re.findall(r'-?\d+(?:\.\d+)?',path.attrib['d'])))
 near(n[0],0);near(n[1],0);near(n[2],r['r']*100/s['width'],1e-6);near(n[3],n[2]);near(n[-2],100);near(n[-1],0)
 assert n[4:7]==[0,1 if name=='P' and s['recipe']=='doric' else 0,1 if name=='P' else 0]
 arc=360-r['cut'] if name=='P' else r['cut'];near(path.attrib['data-arc-deg'],arc)
 assert f'{r[name.lower()+"Angle"]:.0f} degrees' in text

def check_csv(text,width):
 rows=list(csv.DictReader(io.StringIO(text)));assert len(rows)==364
 for row in rows:
  assert float(row['width_mm'])==width
  state={'recipe':row['recipe'],'width':width,'point':round(float(row['arc_fraction'])*100)};r=reference(state);name=row['point'].lower();p=r[name]
  near(row['x_mm'],p[0]);near(row['y_mm'],p[1]);near(row['edge_angle_deg'],r[name+'Angle'])
  face=360-r['cut'] if name=='p' else r['cut'];near(row['facing_arc_deg'],face);near(row['containing_arc_deg'],360-face)
 return len(rows)
if len(sys.argv)==1:
 data=json.load(sys.stdin);assert data['flat'] is None
 for case in data['cases']:
  pair(case['state'],case['pair'])
  for text,name in zip(case['drawings'],['P','Q']):drawing(text,case['state'],name)
 rows=check_csv(data['csv'],120);report={'cases':len(data['cases']),'csv_rows':rows}
else:
 data=json.load(open(sys.argv[1]));rows=0
 for view in data['views']:
  for text,name in zip(view['svg'],['P','Q']):drawing(text,view['state'],name)
  r=reference(view['state']);near(view['baseAngles'][0],r['pBaseA'],.0005);near(view['baseAngles'][1],r['pBaseB'],.0005)
 for item in data['csv']:rows+=check_csv(open(item['path']).read(),item['width'])
 report={'browser_views':len(data['views']),'csv_rows':rows}
print(json.dumps({'status':'passed',**report,'comparisons':checks,'max_relative_error_by_tolerance':errors,'method':'source-chord rotations, cosine-law angles and triangle base angles; actual SVG arc flags and coordinates'},indent=2))
