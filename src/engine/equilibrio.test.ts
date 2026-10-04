/**
 * Verifica que el motor en TypeScript reproduce los números de data/niveles.json
 * (que salieron del solver de referencia en Python). Correr con:  npm test
 */
import { readFileSync } from 'node:fs';
import { abiertasIniciales, alternar, enEquilibrio, equilibrio, puntaje, resolver, type Nivel } from './equilibrio';

const niveles: Nivel[] = JSON.parse(readFileSync(new URL('../../data/niveles.json', import.meta.url), 'utf8'));
let fallos = 0;
const ok = (cond: boolean, msg: string) => {
  if (!cond) {
    fallos++;
    console.log('  ✗', msg);
  }
};

for (const n of niveles) {
  const ini = abiertasIniciales(n);
  const p0 = puntaje(n, ini)!;
  ok(Math.abs(p0.promedio - n.start) < 0.15, `inicio ${p0.promedio.toFixed(2)} != ${n.start}`);

  let s = ini;
  for (const id of n.solucion) s = alternar(n, s, id);
  const p1 = puntaje(n, s)!;
  ok(!!p1 && Math.abs(p1.promedio - n.optimo) < 0.15, `óptimo ${p1?.promedio.toFixed(2)} != ${n.optimo}`);
  ok(!!p1 && enEquilibrio(n, p1.promedio), 'la solución debe contar como equilibrio');
  ok(n.solucion.length === n.cambios, 'cambios = largo de la solución');
  if (n.toques) ok(n.solucion.length <= n.toques, 'la solución cabe en el tope de toques');

  // lo que se muestra en pantalla al empezar (fase pico si hay fases)
  const rf = p0.fases[p0.fases.length - 1];
  for (const l of n.links) {
    if (!ini.has(l.id) || l.t0 == null) continue;
    ok(Math.abs(rf.t[l.id] - l.t0) < 0.3, `t0 de ${l.id}: ${rf.t[l.id].toFixed(2)} != ${l.t0}`);
  }

  // las obras no se pueden tocar
  for (const l of n.links.filter((x) => x.locked)) ok(alternar(n, ini, l.id) === ini, `obra ${l.id} debe ser intocable`);

  // ningún toque extra desde la solución mejora (el óptimo es de verdad el óptimo)
  const extra = n.links.filter((l) => !l.locked && !(n.toques && n.solucion.length >= n.toques));
  for (const l of extra) {
    const r = puntaje(n, alternar(n, s, l.id));
    if (r && n.toques === undefined) ok(r.promedio > p1.promedio - 0.3, `un toque extra en ${l.id} mejora a ${r.promedio.toFixed(2)}`);
  }
  console.log(`${String(n.num).padStart(2, '0')} ${n.name.padEnd(26)} ${p0.promedio.toFixed(1).padStart(6)} → ${p1.promedio.toFixed(1).padStart(6)}  (${n.cambios} toque${n.cambios > 1 ? 's' : ''})`);
}

// sin ruta => null (ese toque no se permite en el juego)
{
  const n = niveles[0];
  const sin = equilibrio(n, new Set<string>());
  ok(sin === null, 'sin vías abiertas debe devolver null');
}

// búsqueda por fuerza bruta en un nivel chico
{
  const n = niveles[2];
  const r = resolver(n);
  ok(r.mejor.cambios === 1 && r.mejor.toques[0] === 'cab', 'nivel 03: la mejor jugada es cerrar el cable');
}

console.log(fallos === 0 ? '\nTodo bien: el motor reproduce los 15 niveles.' : `\n${fallos} fallo(s).`);
process.exit(fallos === 0 ? 0 : 1);
