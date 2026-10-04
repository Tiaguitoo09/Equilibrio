/**
 * Prueba el estado del nivel 01 (criterio de aceptación del paso 1):
 * tocar la vía cerrada baja el TOTAL de 60 a 45 y gana en 1 toque.
 */
import { readFileSync } from 'node:fs';
import { EstadoNivel } from './estadoNivel';
import type { Nivel } from '../engine/equilibrio';

const niveles: Nivel[] = JSON.parse(readFileSync(new URL('../../data/niveles.json', import.meta.url), 'utf8'));
let fallos = 0;
const ok = (cond: boolean, msg: string) => {
  if (!cond) {
    fallos++;
    console.log('  ✗', msg);
  }
};

const e = new EstadoNivel(niveles[0]);
ok(Math.round(e.total) === 60, `nivel 01 empieza en 60 (da ${e.total})`);
ok(!e.resuelto, 'nivel 01 no empieza resuelto');

// cerrar la única vía abierta deja al grupo sin ruta: no se permite
ok(e.tocar('s') === 'sin-ruta', 'cerrar la única vía no se permite');
ok(e.toques === 0 && e.abiertas.has('s'), 'un toque prohibido no cambia nada');

ok(e.tocar('n') === 'ok', 'abrir la vía de abajo');
ok(Math.round(e.total * 10) / 10 === 45, `TOTAL baja a 45 (da ${e.total})`);
ok(e.resuelto && e.toques === 1, 'equilibrio alcanzado en 1 toque');
ok(Math.round(e.resultadoFase.x.s) === 4500 && Math.round(e.resultadoFase.x.n) === 1500, 'reparto 4.500 / 1.500');
ok(e.tocar('s') === 'resuelto', 'después de ganar no se toca más');

e.reiniciar();
ok(Math.round(e.total) === 60 && e.toques === 0, 'reiniciar vuelve a 60');

// obra intocable y tope de toques
const n10 = new EstadoNivel(niveles[9]);
const obra = niveles[9].links.find((l) => l.locked)!;
ok(n10.tocar(obra.id) === 'obra', 'la obra no se toca');
const n05 = new EstadoNivel(niveles[4]);
const otra = niveles[4].links.find((l) => !l.locked && !niveles[4].solucion.includes(l.id) && l.kind === 'cable')!;
n05.tocar(otra.id);
ok(n05.quedan === 0 && n05.tocar(niveles[4].solucion[0]) === 'agotado', 'nivel 05: con el tope agotado no se toca');

console.log(fallos === 0 ? 'Estado del nivel: todo bien.' : `\n${fallos} fallo(s).`);
process.exit(fallos === 0 ? 0 : 1);
