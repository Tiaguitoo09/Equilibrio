"""Genera levels.json: la fuente de verdad de los 15 niveles (datos + geometría).
Lo usa Figma (diseño) y luego el juego (programación)."""
import json, itertools
from levels_def import *
from solver_np import score, equilibrium

def R(w):
    return json.load(open(f'final_{w}.json'))  # params elegidos

# ---------- geometría ----------
def route(P, Q, shape='s'):
    (x1, y1), (x2, y2) = P, Q
    dy = y2 - y1
    if shape == 'dh':
        return [[x1, y1], [x1 + abs(dy) * (1 if x2 > x1 else -1), y2], [x2, y2]]
    if shape == 'hd':
        return [[x1, y1], [x2 - abs(dy) * (1 if x2 > x1 else -1), y1], [x2, y2]]
    if shape == 'dhd':  # sale en diagonal, va horizontal, entra en diagonal (hexágono)
        raise ValueError
    return [[x1, y1], [x2, y2]]

def mk(num, name, block, lv, nodes, shapes, meta, pts_override=None):
    pos = {k: (v['x'], v['y']) for k, v in nodes.items()}
    for L_ in lv['links']:
        if pts_override and L_['id'] in pts_override:
            L_['pts'] = pts_override[L_['id']]
        else:
            L_['pts'] = route(pos[L_['from']], pos[L_['to']], shapes.get(L_['id'], 's'))
    d = dict(num=num, name=name, block=block, nodes=nodes, **lv, **meta)
    return d

# nodos: kind = terminal (portal/destino), station (transbordo simple), mini (paso), bar (terminal en barra), capsule
def N(x, y, label='', kind='station', **kw):
    return dict(x=x, y=y, label=label, kind=kind, **kw)

levels = []
DIFF = {1: 'Fácil', 2: 'Intermedio', 3: 'Difícil'}

# 01 ---------------------------------------------------------------
lv = dict(groups=[{'from': 'A', 'to': 'B', 'cars': 6000}],
          links=[L('s', 'A', 'B', 'angosta', 0, 100, line='amarilla'), L('n', 'A', 'B', 'ancha', 45, open=False, line='azul')])
levels.append(mk(1, 'Línea única', 1, lv,
    {'A': N(240, 500, 'Portal Usme', 'terminal'), 'B': N(1200, 500, 'Av. Jiménez', 'terminal')}, {},
    dict(msg='Toca la vía gris para abrirla.', legend=['ancha', 'angosta', 'cerrada']),
    {'s': [[240, 500], [400, 340], [1040, 340], [1200, 500]], 'n': [[240, 500], [400, 660], [1040, 660], [1200, 500]]}))

# 02 ---------------------------------------------------------------
lv = dict(groups=[{'from': 'A', 'to': 'B', 'cars': 4000}],
          links=[L('a1', 'A', 'M', 'angosta', 0, 100, line='azul'), L('a2', 'A', 'M', 'ancha', 25, open=False, line='azul'),
                 L('b1', 'M', 'B', 'ancha', 25, open=False, line='amarilla'), L('b2', 'M', 'B', 'angosta', 0, 100, line='amarilla')])
levels.append(mk(2, 'Estación de paso', 1, lv,
    {'A': N(180, 500, 'Portal Sur', 'terminal'), 'M': N(720, 500, 'Ricaurte', 'station'), 'B': N(1260, 500, 'Calle 26', 'terminal')}, {},
    dict(msg=None, legend=None),
    {'a1': [[180, 500], [330, 350], [570, 350], [720, 500]], 'a2': [[180, 500], [330, 650], [570, 650], [720, 500]],
     'b1': [[720, 500], [870, 350], [1110, 350], [1260, 500]], 'b2': [[720, 500], [870, 650], [1110, 650], [1260, 500]]}))

# 03 / 04 (diamante de Braess) ---------------------------------------
def diamond(num, name, labels, kinds, opens, msg, legend):
    a = {'angosta': (0, 100), 'ancha10': (10, None), 'ancha45': (45, None)}
    k_at, k_tb, k_ad, k_db = kinds
    def mkL(id, f, t, kk, line):
        if kk == 'angosta': return L(id, f, t, 'angosta', 0, 100, line=line)
        return L(id, f, t, 'ancha', int(kk[5:]), line=line)
    lv = dict(groups=[{'from': 'A', 'to': 'B', 'cars': 4000}],
              links=[mkL('at', 'A', 'T', k_at, 'azul'), mkL('tb', 'T', 'B', k_tb, 'azul'),
                     mkL('ad', 'A', 'D', k_ad, 'naranja'), mkL('db', 'D', 'B', k_db, 'naranja'),
                     L('cab', 'T', 'D', 'cable', 0, open=opens)])
    nodes = {'A': N(230, 500, labels[0], 'terminal'), 'T': N(720, 320, labels[1]), 'D': N(720, 680, labels[2]), 'B': N(1210, 500, labels[3], 'terminal')}
    return mk(num, name, 1, lv, nodes, {}, dict(msg=msg, legend=legend),
              {'at': [[230, 500], [410, 320], [720, 320]], 'tb': [[720, 320], [1030, 320], [1210, 500]],
               'ad': [[230, 500], [410, 680], [720, 680]], 'db': [[720, 680], [1030, 680], [1210, 500]],
               'cab': [[720, 320], [720, 680]]})
levels.append(diamond(3, 'El puente', ['Portal Tunal', 'El Paraíso', 'Santa Lucía', 'Av. Jiménez'],
                      ['angosta', 'ancha45', 'ancha45', 'angosta'], True,
                      'Apareció un cable: un atajo. ¿Ayuda o estorba?', ['ancha', 'angosta', 'cerrada', 'cable']))
levels.append(diamond(4, 'El puente bueno', ['Portal Américas', 'Banderas', 'Kennedy', 'Puente Aranda'],
                      ['ancha10', 'angosta', 'angosta', 'ancha10'], False, None, None))

# 05 -----------------------------------------------------------------
p = R('05'); lv = l05(p)
levels.append(mk(5, 'Dos puentes', 1, lv,
    {'A': N(150, 500, 'Portal Suba', 'terminal'), 'T1': N(430, 300, 'Niza'), 'D1': N(430, 700, 'Suba Tv. 91'),
     'M': N(720, 500, 'Calle 100', 'station', group=True), 'T2': N(1010, 300, 'Usaquén'), 'D2': N(1010, 700, 'Pepe Sierra'),
     'B': N(1290, 500, 'Chapinero', 'terminal')}, {},
    dict(msg='Hora pico: solo tienes 1 toque. Elige bien el cable.', legend=None),
    {'a_t1': [[150, 500], [350, 300], [430, 300]], 't1_m': [[430, 300], [520, 300], [720, 500]],
     'a_d1': [[150, 500], [350, 700], [430, 700]], 'd1_m': [[430, 700], [520, 700], [720, 500]],
     'cab1': [[430, 300], [430, 700]],
     'm_t2': [[720, 500], [920, 300], [1010, 300]], 't2_b': [[1010, 300], [1090, 300], [1290, 500]],
     'm_d2': [[720, 500], [920, 700], [1010, 700]], 'd2_b': [[1010, 700], [1090, 700], [1290, 500]],
     'cab2': [[1010, 300], [1010, 700]]}))

# 06 / 08 / 10 -------------------------------------------------------
def portales(num, name, p, obra=False, phases=None, msg=None, legend=None):
    lv = l06(p, obra=obra, phases=phases)
    nodes = {'PN': N(170, 290, 'Portal Norte', 'terminal'), 'PU': N(170, 710, 'Portal Usme', 'terminal'),
             'C72': N(560, 290, 'Calle 72'), 'BOS': N(560, 710, 'Bosa'),
             'SV': N(860, 500, 'San Victorino', 'capsule'), 'CEN': N(1270, 500, 'Centro', 'terminal')}
    pts = {'y1': [[170, 290], [560, 290]], 'y2': [[560, 290], [1060, 290], [1270, 500]],
           'o1': [[170, 290], [340, 460], [860, 460]], 'tr': [[860, 500], [1270, 500]],
           'cab1': [[560, 290], [860, 480]],
           'l1': [[170, 710], [560, 710]], 'l2': [[560, 710], [1060, 710], [1270, 500]],
           'a1': [[170, 710], [340, 540], [860, 540]], 'cab2': [[560, 710], [860, 520]]}
    return mk(num, name, 2, lv, nodes, {}, dict(msg=msg, legend=legend), pts)

PH = lambda p: [{'name': 'Hora valle', 'factor': p['vf']}, {'name': 'Hora pico', 'factor': 1.0}]
p6 = R('06'); levels.append(portales(6, 'Dos portales', p6, msg='Dos grupos comparten el centro.'))

# 07 / 09 -------------------------------------------------------------
def expreso(num, name, p, third=False, msg=None):
    lv = l07(p, third)
    nodes = {'A': N(150, 500, 'Portal Eldorado', 'terminal'), 'T1': N(420, 300, 'Modelia'), 'T2': N(720, 300, 'Av. 68'),
             'T3': N(1020, 300, 'Corferias'), 'B1': N(420, 700, 'Fontibón'), 'B2': N(720, 700, 'Salitre'),
             'B3': N(1020, 700, 'Gobernación'), 'Z': N(1290, 500, 'Universidades', 'terminal'),
             'P2': N(250, 820, 'Portal Fontibón', 'terminal')}
    pts = {'t0': [[150, 500], [350, 300], [420, 300]], 't1': [[420, 300], [720, 300]], 't2': [[720, 300], [1020, 300]],
           't3': [[1020, 300], [1090, 300], [1290, 500]],
           'b0': [[150, 500], [350, 700], [420, 700]], 'b1': [[420, 700], [720, 700]], 'b2': [[720, 700], [1020, 700]],
           'b3': [[1020, 700], [1090, 700], [1290, 500]],
           'p2': [[250, 820], [300, 820], [420, 700]],
           'c1': [[420, 300], [420, 700]], 'c2': [[720, 300], [720, 700]], 'c3': [[1020, 300], [1020, 700]], 'c4': [[420, 700], [720, 300]]}
    if third:
        nodes['P3'] = N(720, 130, 'Suba', 'terminal'); pts['p3'] = [[720, 130], [720, 300]]
    return mk(num, name, 2, lv, nodes, {}, dict(msg=msg, legend=None), pts)

p7 = R('07'); levels.append(expreso(7, 'Expreso y local', p7))
p8 = R('08'); levels.append(portales(8, 'Hora pico', p8, phases=PH(p8), msg='Hora pico: entran más carros a la red.'))
p9 = R('09'); levels.append(expreso(9, 'Tres grupos', p9, third=True))
p10 = R('10'); levels.append(portales(10, 'Obra en San Victorino', p10, obra=True,
                                      msg='El cable de Bosa está en obra y no se puede cerrar. Busca otra salida.',
                                      legend=['obra']))

# 11 / 12 ------------------------------------------------------------
def corredores(num, name, p, g3=False):
    lv = l11(p, g3)
    ys = [(250, 330), (460, 540), (670, 750)]
    nodes = {'O': N(150, 500, 'Portal Américas', 'bar', y1=210, y2=790), 'Z': N(1290, 500, 'Universidades', 'bar', y1=210, y2=790)}
    pts = {}
    for i, (yu, yl) in enumerate(ys):
        s = str(i + 1); xu = [560, 480, 640][i]; xl = xu + 260
        nodes['U' + s] = N(xu, yu, ['Banderas', 'Marsella', 'Mandalay'][i])
        nodes['L' + s] = N(xl, yl, ['Pradera', 'Américas', 'Puente Aranda'][i])
        pts['u' + s + 'a'] = [[150, yu], [xu, yu]]; pts['u' + s + 'b'] = [[xu, yu], [1290, yu]]
        pts['l' + s + 'a'] = [[150, yl], [xl, yl]]; pts['l' + s + 'b'] = [[xl, yl], [1290, yl]]
        pts['cab' + s] = [[xu, yu], [xl, yl]]
    return mk(num, name, 3, lv, nodes, {}, dict(msg=None, legend=None), pts)

levels.append(corredores(11, 'Tres corredores', R('11')))
levels.append(corredores(12, 'Tres grupos, seis líneas', R('12'), True))

# 13 / 14 ------------------------------------------------------------
def ciudad4(num, name, p, phases=None, toques=None, msg=None):
    lv = l13(p, phases, toques)
    nodes = {'O': N(150, 500, 'Portal Sur', 'bar', y1=220, y2=780), 'M': N(720, 500, 'Ricaurte', 'bar', y1=220, y2=780),
             'Z': N(1290, 500, 'Calle 100', 'bar', y1=220, y2=780)}
    ys = [(270, 370), (630, 730)]; pts = {}
    names = {'11': ('Sevillana', 'Venecia'), '12': ('Kennedy', 'Mundo Aventura'), '21': ('Calle 45', 'Marly'), '22': ('Movistar Arena', 'Calle 76')}
    for h, (x0, x1) in enumerate([(150, 720), (720, 1290)]):
        for i, (yu, yl) in enumerate(ys):
            s = f'{h+1}{i+1}'; xu = x0 + 200 + 40 * i; xl = xu + 170
            nodes['U' + s] = N(xu, yu, names[s][0]); nodes['L' + s] = N(xl, yl, names[s][1])
            pts['u' + s + 'a'] = [[x0, yu], [xu, yu]]; pts['u' + s + 'b'] = [[xu, yu], [x1, yu]]
            pts['l' + s + 'a'] = [[x0, yl], [xl, yl]]; pts['l' + s + 'b'] = [[xl, yl], [x1, yl]]
            pts['cab' + s] = [[xu, yu], [xl, yl]]
    return mk(num, name, 3, lv, nodes, {}, dict(msg=msg, legend=None), pts)

p13 = R('13'); levels.append(ciudad4(13, 'Cruzar la ciudad', p13))
p14 = R('14'); levels.append(ciudad4(14, 'Hora pico, dos toques', p14, phases=PH(p14), toques=2,
                                     msg='Hora pico: solo dos toques.'))

# 15 -----------------------------------------------------------------
p15 = R('15'); lv = l15(p15)
nodes = {'O': N(150, 500, 'Portal Américas', 'bar', y1=210, y2=790), 'M': N(720, 500, 'Ricaurte', 'bar', y1=210, y2=790),
         'Z': N(1290, 500, 'Universidades', 'bar', y1=210, y2=790)}
ys = [(250, 320), (450, 520), (650, 720)]; pts = {}
nm = {'11': ('Marsella', 'Pradera'), '12': ('Zona Industrial', 'Américas'), '13': ('Mandalay', 'Kennedy'),
      '21': ('Tercer Milenio', 'Museo Nacional'), '22': ('Las Aguas', 'Germania'), '23': ('Calle 22', 'Calle 26')}
for h, (x0, x1) in enumerate([(150, 720), (720, 1290)]):
    for i, (yu, yl) in enumerate(ys):
        s = f'{h+1}{i+1}'; xu = x0 + 170 + 50 * i; xl = xu + 190
        nodes['U' + s] = N(xu, yu, nm[s][0]); nodes['L' + s] = N(xl, yl, nm[s][1])
        pts['u' + s + 'a'] = [[x0, yu], [xu, yu]]; pts['u' + s + 'b'] = [[xu, yu], [x1, yu]]
        pts['l' + s + 'a'] = [[x0, yl], [xl, yl]]; pts['l' + s + 'b'] = [[xl, yl], [x1, yl]]
        pts['cab' + s] = [[xu, yu], [xl, yl]]
levels.append(mk(15, 'La ciudad', 3, lv, nodes, {}, dict(msg='Hora pico: tres toques para seis cables. No todos son trampa.', legend=None), pts))

# ---------- resolver y anotar ----------
def solve_full(lv, lim, toggles):
    init = {l['id'] for l in lv['links'] if l.get('open', True)}
    st = score(lv, init); best = (st['avg'], 0, ())
    if lv.get('toques'): lim = min(lim, lv['toques'])
    for k in range(1, lim + 1):
        for combo in itertools.combinations(toggles, k):
            r = score(lv, init ^ set(combo))
            if r and r['avg'] < best[0] - 0.3: best = (r['avg'], k, combo)
    return st, best

out = []
for lvl in levels:
    n = len(lvl['links'])
    cabs = [l['id'] for l in lvl['links'] if l['kind'] == 'cable' and not l['locked']]
    alltg = [l['id'] for l in lvl['links'] if not l['locked']]
    # niveles chicos: búsqueda completa en todas las vías; grandes: cables + 1 vía extra
    if len(alltg) <= 13:
        st, best = solve_full(lvl, 4, alltg)
    else:
        st, best = solve_full(lvl, 4, cabs)
    init = {l['id'] for l in lvl['links'] if l.get('open', True)}
    sol = init ^ set(best[2])
    ph = st['phases'][-1]  # fase mostrada (pico si existe)
    rs = score(lvl, sol)['phases'][-1]
    for l in lvl['links']:
        l['t0'] = round(ph['t'][l['id']], 1) if l['id'] in init else None
        l['x0'] = round(ph['x'][l['id']]) if l['id'] in init else 0
        l['t1'] = round(rs['t'][l['id']], 1) if l['id'] in sol else None
        l['x1'] = round(rs['x'][l['id']]) if l['id'] in sol else 0
        l['open_solved'] = l['id'] in sol
    lvl['start'] = round(st['avg'], 1); lvl['optimo'] = round(best[0], 1)
    lvl['cambios'] = best[1]; lvl['solucion'] = list(best[2])
    lvl['lineas'] = len({l['line'] for l in lvl['links'] if l['line']})
    lvl['cables'] = len([l for l in lvl['links'] if l['kind'] == 'cable'])
    lvl['grupos'] = len(lvl['groups'])
    print(f"{lvl['num']:02d} {lvl['name']:<26} {lvl['start']:>6} -> {lvl['optimo']:>6}  cambios={best[1]} {best[2]}  líneas={lvl['lineas']} grupos={lvl['grupos']} cables={lvl['cables']}")
    out.append(lvl)
json.dump(out, open('levels.json', 'w'), ensure_ascii=False, indent=1)

# ---------- export compacto para escena / Figma ----------
comp = []
for lvl in out:
    c = {k: lvl[k] for k in ('num', 'name', 'block', 'groups', 'start', 'optimo', 'cambios', 'lineas', 'cables', 'grupos', 'msg', 'legend')}
    if lvl.get('phases'): c['phases'] = 1
    if lvl.get('toques'): c['toques'] = lvl['toques']
    c['nodes'] = {k: {kk: vv for kk, vv in v.items()} for k, v in lvl['nodes'].items()}
    c['links'] = [dict(id=l['id'], kind=l['kind'], a=l['a'], line=l['line'], pts=l['pts'], op=l.get('open', True), os=l['open_solved'],
                       locked=l['locked'] or None, t0=l['t0'], x0=l['x0'], t1=l['t1'] if lvl['num'] == 3 else None, x1=l['x1'] if lvl['num'] == 3 else None) for l in lvl['links']]
    comp.append(c)
json.dump(comp, open('levels_compact.json', 'w'), ensure_ascii=False, separators=(',', ':'))
