def L(id,f,t,kind,a=0,k=None,open=True,locked=False,line=None,both=False):
    b = 0 if not k else 1.0/k
    return dict(id=id,**{'from':f,'to':t},kind=kind,a=a,b=b,k=k,open=open,locked=locked,line=line,both=both)

def l05(p):
    return dict(toques=1, phases=[{'name':'Hora valle','factor':p['vf']},{'name':'Hora pico','factor':1.0}],
      groups=[{'from':'A','to':'B','cars':p['n1']},{'from':'M','to':'B','cars':p['n2']}],
      links=[L('a_t1','A','T1','angosta',p['a1'],p['k1'],line='azul'),L('t1_m','T1','M','ancha',p['c1'],line='azul'),
             L('a_d1','A','D1','ancha',p['c1'],line='naranja'),L('d1_m','D1','M','angosta',p['a1'],p['k1'],line='naranja'),
             L('cab1','T1','D1','cable',p['q1']),
             L('m_t2','M','T2','angosta',p['a2'],p['k2'],line='amarilla'),L('t2_b','T2','B','ancha',p['c2'],line='amarilla'),
             L('m_d2','M','D2','ancha',p['c2'],line='lila'),L('d2_b','D2','B','angosta',p['a2'],p['k2'],line='lila'),
             L('cab2','T2','D2','cable',p['q2'])])

def l06(p, obra=False, phases=None):
    d=dict(groups=[{'from':'PN','to':'CEN','cars':p['n1']},{'from':'PU','to':'CEN','cars':p['n2']}],
      links=[L('y1','PN','C72','angosta',p['ya'],p['yk'],line='amarilla'),L('y2','C72','CEN','ancha',p['yc'],line='amarilla'),
             L('o1','PN','SV','ancha',p['oc'],line='naranja'),L('tr','SV','CEN','angosta',p['ta'],p['tk'],line='naranja'),
             L('cab1','C72','SV','cable',p['q1']),
             L('l1','PU','BOS','angosta',p['la'],p['lk'],line='lila'),L('l2','BOS','CEN','ancha',p['lc'],line='lila'),
             L('a1','PU','SV','ancha',p['ac'],line='azul'),
             L('cab2','BOS','SV','cable',p['q2'],locked=obra)])
    if phases: d['phases']=phases
    return d

def l07(p, third=False):
    g=[{'from':'A','to':'Z','cars':p['n1']},{'from':'P2','to':'Z','cars':p['n2']}]
    links=[L('t0','A','T1','ancha',p['tc1'],line='azul'),L('t1','T1','T2','angosta',p['ta'],p['tk'],line='azul'),
           L('t2','T2','T3','ancha',p['tc2'],line='azul'),L('t3','T3','Z','angosta',p['ta2'],p['tk2'],line='azul'),
           L('b0','A','B1','angosta',p['ba'],p['bk'],line='amarilla'),L('b1','B1','B2','ancha',p['bc1'],line='amarilla'),
           L('b2','B2','B3','angosta',p['ba2'],p['bk2'],line='amarilla'),L('b3','B3','Z','ancha',p['bc2'],line='amarilla'),
           L('p2','P2','B1','ancha',p['pc'],line='lila'),
           L('c1','T1','B1','cable',p['q1'],both=True),L('c2','T2','B2','cable',p['q2'],both=True),
           L('c3','T3','B3','cable',p['q3'],both=True),L('c4','B1','T2','cable',p['q4'])]
    if third:
        g.append({'from':'P3','to':'Z','cars':p['n3']})
        links.append(L('p3','P3','T2','ancha',p['p3c'],line='cafe'))
    return dict(groups=g,links=links)

def l11(p, groups3=False):
    links=[]; cols=[('amarilla','naranja'),('azul','lila'),('cafe','cian')]
    for i in range(3):
        u,l=cols[i]; s=str(i+1)
        links+= [L('u'+s+'a','O','U'+s,'angosta',p['a'+s],p['k'+s],line=u),L('u'+s+'b','U'+s,'Z','ancha',p['c'+s],line=u),
                 L('l'+s+'a','O','L'+s,'ancha',p['c'+s],line=l),L('l'+s+'b','L'+s,'Z','angosta',p['a'+s],p['k'+s],line=l),
                 L('cab'+s,'U'+s,'L'+s,'cable',p['q'+s])]
    g=[{'from':'O','to':'Z','cars':p['n']}]
    if groups3:
        g+= [{'from':'U1','to':'Z','cars':p['n2']},{'from':'O','to':'L3','cars':p['n3']}]
    return dict(groups=g,links=links)

def l13(p, phases=None, toques=None):
    links=[]; pairs=[('amarilla','naranja'),('azul','lila')]
    for h,(src,dst) in enumerate([('O','M'),('M','Z')]):
        for i,(u,l) in enumerate(pairs):
            s=f'{h+1}{i+1}'
            links+=[L('u'+s+'a',src,'U'+s,'angosta',p['a'+s],p['k'+s],line=u),L('u'+s+'b','U'+s,dst,'ancha',p['c'+s],line=u),
                    L('l'+s+'a',src,'L'+s,'ancha',p['c'+s],line=l),L('l'+s+'b','L'+s,dst,'angosta',p['a'+s],p['k'+s],line=l),
                    L('cab'+s,'U'+s,'L'+s,'cable',p['q'+s])]
    g=[{'from':'O','to':'Z','cars':p['n1']},{'from':'M','to':'Z','cars':p['n2']},{'from':'O','to':'M','cars':p['n3']}]
    d=dict(groups=g,links=links)
    if phases: d['phases']=phases
    if toques: d['toques']=toques
    return d

def l15(p):
    links=[]; trip=[('amarilla','naranja'),('azul','lila'),('cafe','cian')]
    for h,(src,dst) in enumerate([('O','M'),('M','Z')]):
        for i,(u,l) in enumerate(trip):
            s=f'{h+1}{i+1}'
            links+=[L('u'+s+'a',src,'U'+s,'angosta',p['a'+s],p['k'+s],line=u),L('u'+s+'b','U'+s,dst,'ancha',p['c'+s],line=u),
                    L('l'+s+'a',src,'L'+s,'ancha',p['c'+s],line=l),L('l'+s+'b','L'+s,dst,'angosta',p['a'+s],p['k'+s],line=l),
                    L('cab'+s,'U'+s,'L'+s,'cable',p['q'+s])]
    g=[{'from':'O','to':'Z','cars':p['n1']},{'from':'M','to':'Z','cars':p['n2']},{'from':'U12','to':'Z','cars':p['n3']},{'from':'O','to':'M','cars':p['n4']}]
    return dict(groups=g,links=links,phases=[{'name':'Hora valle','factor':p['vf']},{'name':'Hora pico','factor':1.0}],toques=3)
