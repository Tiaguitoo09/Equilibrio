/**
 * Frases de la bitácora: el nivel 03 debe dar exactamente la frase del diseño,
 * y todos los niveles deben producir una frase con su solución.
 */
import { readFileSync } from 'node:fs';
import { bitacora } from './bitacora';
import { abiertasIniciales, alternar, puntaje, type Nivel } from '../engine/equilibrio';

const niveles: Nivel[] = JSON.parse(readFileSync(new URL('../../data/niveles.json', import.meta.url), 'utf8'));
let fallos = 0;
const ok = (cond: boolean, msg: string) => {
  if (!cond) {
    fallos++;
    console.log('  ✗', msg);
  }
};

for (const n of niveles) {
  let s = abiertasIniciales(n);
  for (const id of n.solucion) s = alternar(n, s, id);
  const b = bitacora(n, s, puntaje(n, s)!.promedio);
  console.log(`${String(n.num).padStart(2, '0')} ${b.cita}  ${b.detalle}  (${b.antes} → ${b.despues})`);
  ok(b.cita.startsWith('«Hoy ') && b.cita.endsWith('.»'), `nivel ${n.num}: cita mal armada`);
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
  ok(bitacora(n, s, 45).cita === '«Hoy abrí la vía ancha y todos llegaron antes.»', 'nivel 01: cambios netos');
}

console.log(fallos === 0 ? 'Bitácora: todo bien.' : `\n${fallos} fallo(s).`);
process.exit(fallos === 0 ? 0 : 1);
