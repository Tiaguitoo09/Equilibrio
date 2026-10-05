/**
 * Bitácora: la cita sale de data/bitacora.json (una por nivel) y el detalle de la plantilla.
 * El nivel 03 debe dar exactamente lo del diseño.
 */
import { readFileSync } from 'node:fs';
import { bitacora, fraseDe } from './bitacora';
import { abiertasIniciales, alternar, puntaje, type Nivel } from '../engine/equilibrio';

const niveles: Nivel[] = JSON.parse(readFileSync(new URL('../../data/niveles.json', import.meta.url), 'utf8'));
const frases: { num: number; frase: string }[] = JSON.parse(readFileSync(new URL('../../data/bitacora.json', import.meta.url), 'utf8'));
let fallos = 0;
const ok = (cond: boolean, msg: string) => {
  if (!cond) {
    fallos++;
    console.log('  ✗', msg);
  }
};

ok(frases.length === niveles.length && frases.every((f, i) => f.num === i + 1), 'data/bitacora.json trae una frase por nivel, en orden');

for (const n of niveles) {
  let s = abiertasIniciales(n);
  for (const id of n.solucion) s = alternar(n, s, id);
  const b = bitacora(n, s, puntaje(n, s)!.promedio);
  console.log(`${String(n.num).padStart(2, '0')} ${b.cita}  ${b.detalle}  (${b.antes} → ${b.despues})`);
  ok(b.cita === fraseDe(n.num) && b.cita.startsWith('«') && b.cita.endsWith('»'), `nivel ${n.num}: la cita debe ser la de bitacora.json`);
  if (n.num === 3) {
    ok(b.cita === '«Hoy cerré el cable y la ciudad respiró.»', 'nivel 03: cita del diseño');
    ok(b.detalle === 'Cerraste una vía y todos llegaron 15 minutos antes.', 'nivel 03: detalle del diseño');
  }
}

// abrir y volver a cerrar no cuenta como cambio
{
  const n = niveles[0];
  let s = alternar(n, abiertasIniciales(n), 'n');
  s = alternar(n, alternar(n, s, 's'), 's');
  ok(bitacora(n, s, 45).detalle === 'Abriste una vía y todos llegaron 15 minutos antes.', 'nivel 01: cambios netos');
}

console.log(fallos === 0 ? 'Bitácora: todo bien.' : `\n${fallos} fallo(s).`);
process.exit(fallos === 0 ? 0 : 1);
