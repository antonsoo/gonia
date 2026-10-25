"""Independent Decimal line/screen intersections and Euclidean endpoint distances."""
from decimal import Decimal as D, getcontext
import json, math, sys
getcontext().prec=65
cases=json.load(sys.stdin)
comparisons=0
max_relative=D(0)
def close(actual, expected):
    global comparisons, max_relative
    a=D(str(actual));b=D(expected);err=abs(a-b)/max(D(1),abs(b))
    assert err < D('2e-12'), (a,b,err)
    comparisons+=1;max_relative=max(max_relative,err)
for item in cases:
    s=item['state'];m=item['result']
    d,h,e,L=[D(s[k])/10 for k in ['distance','height','eye','length']]
    rise=h-e;R=(d*d+rise*rise).sqrt()
    if s['mode']=='source': sin=D(1)/D(145).sqrt();cos=D(12)/D(145).sqrt()
    elif s['mode']=='normal': sin=rise/R;cos=d/R
    elif s['mode']=='vertical': sin=D(0);cos=D(1)
    else:
        a=math.radians(s['angle']/10);sin=D(str(math.sin(a)));cos=D(str(math.cos(a)))
    rays=[];image=[]
    for p,f in zip(m['points'],[D('-.5'),D('-.25'),D(0),D('.25'),D('.5')]):
        x=d-f*L*sin;z=h+f*L*cos;qz=z-e
        ray=(x*x+qz*qz).sqrt();rays.append(ray)
        # Intersect the E--P ray with the screen through C, perpendicular to E--C.
        lam=(d*d+rise*rise)/(d*x+rise*qz)
        ix=lam*x-d;iz=lam*qz-rise
        normalized=(-rise*ix+d*iz)/(R*L);image.append(normalized)
        for a,b in [(p['x'],x),(p['z'],z),(p['ray'],ray),(p['normalizedImage'],normalized)]:close(a,b)
    close(m['difference'],rays[-1]-rays[0]);close(m['upperLowerRatio'],image[-1]/-image[0]);close(m['sourceDistance'],12*rise)
    close(((D(str(m['top']['x']))-D(str(m['bottom']['x'])))**2+(D(str(m['top']['z']))-D(str(m['bottom']['z'])))**2).sqrt(),L)
    if s['mode']=='normal' or (s['mode']=='source' and d==12*rise):
        close(rays[0],rays[-1]);close(image[-1],D('.5'));close(image[0],D('-.5'))
    if s['mode']=='vertical':assert rays[-1]>rays[0]
    if s['mode']=='source':assert (rays[-1]>rays[0]) == (d<12*rise) if d!=12*rise else abs(rays[-1]-rays[0])<D('1e-55')
print(json.dumps({'method':'Independent 65-digit Decimal Euclidean distances and intersections of eye rays with the screen through C; custom angles use Python math sin/cos, not arbitrary-precision trigonometry.','cases':len(cases),'comparisons':comparisons,'maximumScaledError':str(max_relative),'sourceAtanRatio':'1/12','scope':'Chosen flat-face geometry and projection; no historical perceptual or construction validation.'},indent=2))
