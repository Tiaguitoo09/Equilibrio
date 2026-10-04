import numpy as np
from solver import paths_for
def proj_simplex(v, z):
    # proyección de v sobre {x>=0, sum x = z}
    if z<=0: return np.zeros_like(v)
    u=np.sort(v)[::-1]; css=np.cumsum(u)-z
    ind=np.arange(1,len(v)+1); cond=u-css/ind>0
    rho=ind[cond][-1]; th=css[cond][-1]/rho
    return np.maximum(v-th,0)
def equilibrium(level, open_set, factor=1.0, iters=20000, tol=1e-6):
    links=level['links']; idx={L['id']:i for i,L in enumerate(links)}
    a=np.array([L['a'] for L in links],float); b=np.array([L['b'] for L in links],float)
    cols=[]; gid=[]
    for gi,g in enumerate(level['groups']):
        ps=paths_for(links,open_set,g['from'],g['to'])
        if not ps: return None
        for p in ps: cols.append([idx[l] for l in p]); gid.append(gi)
    D=np.zeros((len(links),len(cols)))
    for j,c in enumerate(cols): D[c,j]=1
    gid=np.array(gid); G=len(level['groups'])
    dem=np.array([g['cars']*factor for g in level['groups']],float)
    groups=[np.where(gid==gi)[0] for gi in range(G)]
    H=D.T@np.diag(b)@D
    Lc=max(np.linalg.eigvalsh(H).max(),1e-9)
    f=np.zeros(len(cols))
    for gi,J in enumerate(groups): f[J]=dem[gi]/len(J)
    y=f.copy(); tk=1.0
    def grad(v): return D.T@(a+b*(D@v))
    for it in range(iters):
        g=grad(y); fn=y-g/Lc
        for gi,J in enumerate(groups): fn[J]=proj_simplex(fn[J],dem[gi])
        tn=(1+np.sqrt(1+4*tk*tk))/2
        y=fn+((tk-1)/tn)*(fn-f)
        if it%200==0:
            pc=grad(fn); gap=sum((fn[J]*pc[J]).sum()-dem[gi]*pc[J].min() for gi,J in enumerate(groups))
            if gap<tol*max(1,dem.sum()): f=fn; break
        f=fn; tk=tn
    x=D@f; c=a+b*x; pc=D.T@c
    gt=[float((f[J]*pc[J]).sum()/dem[gi]) for gi,J in enumerate(groups)]
    return {'avg':float((f*pc).sum()/dem.sum()),'x':{L['id']:float(x[i]) for i,L in enumerate(links)},'t':{L['id']:float(c[i]) for i,L in enumerate(links)},'group_times':gt,'paths':[(int(gid[j]),[links[i]['id'] for i in cols[j]],float(f[j])) for j in range(len(cols))]}
def score(level, open_set):
    phases=level.get('phases') or [{'name':'Normal','factor':1.0}]
    tot=0;w=0;per=[]
    for ph in phases:
        r=equilibrium(level,open_set,ph['factor'])
        if r is None: return None
        cars=sum(g['cars'] for g in level['groups'])*ph['factor']
        tot+=r['avg']*cars; w+=cars; per.append(r)
    return {'avg':tot/w,'phases':per}
