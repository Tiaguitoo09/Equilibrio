"""Equilibrio — solver de Wardrop para los niveles.
Modelo: cada tramo cuesta  t = a + b * x  (minutos, x = carros en el tramo).
  ancha   -> b = 0     (tiempo fijo, no se llena)
  angosta -> b > 0     (crece con los carros)
  cable   -> atajo (normalmente a=0, b=0)
  obra    -> locked=True (no se puede tocar)
Grupos: {from, to, cars}. Fases (hora pico): factores sobre los carros.
TOTAL = promedio de minutos por carro (ponderado por carros y fases).
"""
import itertools, math

def paths_for(links, open_set, s, t):
    adj = {}
    for L in links:
        if L['id'] in open_set:
            adj.setdefault(L['from'], []).append(L)
            if L.get('both'):
                adj.setdefault(L['to'], []).append(dict(L, **{'from': L['to'], 'to': L['from'], '_rev': True}))
    out = []
    def dfs(n, seen, acc):
        if n == t:
            out.append(list(acc)); return
        for L in adj.get(n, []):
            if L['to'] in seen: continue
            seen.add(L['to']); acc.append(L['id'])
            dfs(L['to'], seen, acc)
            acc.pop(); seen.discard(L['to'])
    dfs(s, {s}, [])
    return out

def equilibrium(level, open_set, factor=1.0, iters=400):
    links = {L['id']: L for L in level['links']}
    groups = level['groups']
    P = []
    for g in groups:
        ps = paths_for(level['links'], open_set, g['from'], g['to'])
        if not ps: return None
        P.append(ps)
    # flujo inicial: todo por el primer camino
    F = [[0.0]*len(ps) for ps in P]
    for gi, g in enumerate(groups):
        F[gi][0] = g['cars']*factor
    def linkflow():
        x = {k: 0.0 for k in links}
        for gi, ps in enumerate(P):
            for pi, p in enumerate(ps):
                for l in p: x[l] += F[gi][pi]
        return x
    def cost(l, x): return links[l]['a'] + links[l]['b']*x[l]
    for it in range(iters):
        moved = 0
        for gi, ps in enumerate(P):
            x = linkflow()
            c = [sum(cost(l, x) for l in p) for p in ps]
            k = min(range(len(ps)), key=lambda i: c[i])
            for pi in range(len(ps)):
                if pi == k or F[gi][pi] <= 0: continue
                diff = c[pi] - c[k]
                if diff <= 1e-9: continue
                sk, sp = set(ps[k]), set(ps[pi])
                d = sum(links[l]['b'] for l in sk ^ sp)
                step = F[gi][pi] if d <= 0 else min(F[gi][pi], diff/d)
                F[gi][pi] -= step; F[gi][k] += step; moved += step
                x = linkflow()
                c = [sum(cost(l, x) for l in p) for p in ps]
        if moved < 1e-6: break
    x = linkflow()
    tot = 0; cars = 0; gtimes = []
    for gi, ps in enumerate(P):
        c = [sum(cost(l, x) for l in p) for p in ps]
        used = [c[i] for i in range(len(ps)) if F[gi][i] > 1e-6]
        gt = max(used)
        gtimes.append(gt)
        tot += gt*groups[gi]['cars']*factor; cars += groups[gi]['cars']*factor
    times = {l: cost(l, x) for l in links}
    return {'avg': tot/cars, 'x': x, 't': times, 'group_times': gtimes}

def score(level, open_set):
    phases = level.get('phases') or [{'name': 'Normal', 'factor': 1.0}]
    tot = 0; w = 0; per = []
    for ph in phases:
        r = equilibrium(level, open_set, ph['factor'])
        if r is None: return None
        cars = sum(g['cars'] for g in level['groups'])*ph['factor']
        tot += r['avg']*cars; w += cars; per.append(r)
    return {'avg': tot/w, 'phases': per}

def solve(level, max_changes=5):
    init = {L['id'] for L in level['links'] if L.get('open', True)}
    togg = [L['id'] for L in level['links'] if not L.get('locked')]
    budget = level.get('toques')
    lim = min(max_changes, budget) if budget else max_changes
    start = score(level, init)
    best = (start['avg'], 0, frozenset(init))
    results = []
    for k in range(1, lim+1):
        for combo in itertools.combinations(togg, k):
            s = set(init)
            for c in combo:
                s.symmetric_difference_update({c})
            r = score(level, s)
            if r is None: continue
            results.append((round(r['avg'], 2), k, combo))
            if r['avg'] < best[0] - 0.05 or (abs(r['avg']-best[0]) <= 0.05 and k < best[1]):
                best = (r['avg'], k, combo)
    return start, best, sorted(results)[:6]
