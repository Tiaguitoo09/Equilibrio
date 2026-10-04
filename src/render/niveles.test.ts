/**
 * Verifica los 15 niveles con el MISMO renderizador del juego (sin navegador):
 *  - al empezar, el HUD muestra TOTAL = start y ÓPTIMO = optimo de data/niveles.json
 *  - las pastillas muestran t0 (fase pico) y, resuelto, t1
 *  - aplicar nivel.solucion toque a toque gana en `cambios` toques y el HUD muestra el óptimo
 *  - leyenda, píldora negra, selector de fases, indicador de toques y obras solo donde el nivel los trae
 * Correr con:  npm run verificar   (también corre en npm test)
 */
import { readFileSync } from 'node:fs';
import type { Nivel } from '../engine/equilibrio';
import { EstadoNivel } from '../game/estadoNivel';
import { escenaNivel } from './nivel';
import { nf, type Pastilla, type Primitiva, type Texto } from './primitivas';

const niveles: Nivel[] = JSON.parse(readFileSync(new URL('../../data/niveles.json', import.meta.url), 'utf8'));
let fallos = 0;
const ok = (cond: boolean, msg: string) => {
  if (!cond) {
    fallos++;
    console.log('  ✗', msg);
  }
};

/** La pastilla muestra el entero más cercano; en un empate (21,5) el motor puede dar 21,4999 → 21. */
const redondea = (pastilla: string | undefined, t: number) => pastilla !== undefined && Math.abs(Number(pastilla) - t) <= 0.5 + 1e-9;

function dibujo(e: EstadoNivel) {
  const r = e.resultadoFase;
  const { escena } = escenaNivel(e.nivel, { abiertas: e.abiertas, t: r.t, x: r.x, total: e.total, resuelto: e.resuelto, toques: e.toques, fase: e.fase });
  const it = escena.it;
  const por = (n: string) => it.filter((i: Primitiva) => i.n === n);
  const texto = (n: string) => (por(n)[0] as Texto | undefined)?.v;
  const pastilla = (id: string) => (por('costo:' + id)[0] as Pastilla | undefined)?.parts[0].v;
  const hay = (n: string) => por(n).length > 0;
  const empieza = (p: string) => it.filter((i) => i.n?.startsWith(p)).length;
  return { total: texto('hud:total'), optimo: texto('hud:optimo'), mensajeHud: texto('hud:mensaje'), pastilla, hay, empieza };
}

console.log('nivel                          HUD inicio      HUD resuelto   toques');
for (const n of niveles) {
  const id = `nivel ${String(n.num).padStart(2, '0')}`;
  const e = new EstadoNivel(n);

  // --- al empezar ---
  const d0 = dibujo(e);
  ok(d0.total === nf(n.start), `${id}: TOTAL inicial ${d0.total} != ${nf(n.start)}`);
  ok(d0.optimo === nf(n.optimo), `${id}: ÓPTIMO ${d0.optimo} != ${nf(n.optimo)}`);
  ok(!e.resuelto && d0.mensajeHud === undefined, `${id}: no debe empezar resuelto`);
  for (const l of n.links) {
    if (l.open && l.t0 != null) ok(redondea(d0.pastilla(l.id), l.t0), `${id}: pastilla ${l.id} muestra ${d0.pastilla(l.id)}, t0 = ${l.t0}`);
    if (!l.open) ok(d0.pastilla(l.id) === undefined, `${id}: la vía cerrada ${l.id} no lleva pastilla`);
  }

  // --- extras solo donde el nivel los trae ---
  ok(d0.hay('leyenda') === !!n.legend, `${id}: leyenda ${d0.hay('leyenda') ? 'sobra' : 'falta'}`);
  ok(d0.hay('mensaje') === !!n.msg, `${id}: píldora negra ${d0.hay('mensaje') ? 'sobra' : 'falta'}`);
  ok(d0.hay('fases') === !!n.phases, `${id}: selector de fases ${d0.hay('fases') ? 'sobra' : 'falta'}`);
  ok(d0.empieza('toque:') === (n.toques ?? 0), `${id}: indicador de toques con ${d0.empieza('toque:')} círculos, tope ${n.toques ?? 0}`);
  ok(d0.empieza('obra') > 0 === n.links.some((l) => l.locked), `${id}: obra mal dibujada`);
  for (const l of n.links.filter((x) => x.locked)) ok(e.tocar(l.id) === 'obra' && e.toques === 0, `${id}: la obra ${l.id} debe ser intocable`);

  // --- hora pico: cambiar de fase cambia las pastillas, no el TOTAL ---
  if (n.phases) {
    e.fase = 0;
    const dv = dibujo(e);
    ok(dv.total === d0.total, `${id}: el TOTAL no depende de la fase mostrada`);
    ok(n.links.some((l) => l.open && dv.pastilla(l.id) !== d0.pastilla(l.id)), `${id}: en hora valle las pastillas deben cambiar`);
    e.fase = n.phases.length - 1;
  }

  // --- resolver con nivel.solucion ---
  for (const v of n.solucion) ok(e.tocar(v) === 'ok', `${id}: el toque ${v} de la solución no se permitió`);
  const d1 = dibujo(e);
  ok(e.resuelto, `${id}: la solución no llega al equilibrio (${e.total.toFixed(2)})`);
  ok(e.toques === n.cambios, `${id}: ${e.toques} toques, se esperaban ${n.cambios}`);
  ok(d1.total === nf(n.optimo), `${id}: TOTAL resuelto ${d1.total} != ÓPTIMO ${nf(n.optimo)}`);
  ok(d1.mensajeHud === `Equilibrio alcanzado en ${n.cambios} toque${n.cambios === 1 ? '' : 's'}`, `${id}: mensaje «${d1.mensajeHud}»`);
  for (const l of n.links) {
    ok(e.abiertas.has(l.id) === l.open_solved, `${id}: ${l.id} debería quedar ${l.open_solved ? 'abierta' : 'cerrada'}`);
    if (l.open_solved && l.t1 != null) ok(redondea(d1.pastilla(l.id), l.t1), `${id}: pastilla resuelta ${l.id} muestra ${d1.pastilla(l.id)}, t1 = ${l.t1}`);
  }
  ok(!d1.hay('leyenda') && !d1.hay('mensaje') && !d1.hay('fases'), `${id}: al ganar se ocultan leyenda, píldora y fases`);

  console.log(`${id} ${n.name.padEnd(24)} ${d0.total!.padStart(6)} | ${d0.optimo!.padEnd(6)}  ${d1.total!.padStart(6)} | ${d1.optimo!.padEnd(6)}  ${e.toques}`);
}

console.log(fallos === 0 ? '\nNiveles: los 15 se resuelven y el HUD coincide con data/niveles.json.' : `\n${fallos} fallo(s).`);
process.exit(fallos === 0 ? 0 : 1);
