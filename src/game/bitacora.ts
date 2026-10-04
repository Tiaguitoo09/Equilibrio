/**
 * Frases de la bitácora del ingeniero (pantalla al ganar).
 * El JSON solo trae la frase del nivel 03 («Hoy cerré el cable y la ciudad respiró.»),
 * así que las demás se arman con la misma plantilla a partir de lo que el jugador hizo:
 *   cita:    «Hoy {cerré el cable | abrí dos vías anchas | …} y {final}.»
 *   detalle: «{Cerraste | Abriste} {una vía | N vías} y todos llegaron X minutos antes.»
 * Sin fórmulas ni jerga (Maeda: reducir).
 */
import { abiertasIniciales, type Nivel, type Tipo } from '../engine/equilibrio';
import { nf } from '../render/primitivas';

/** Final de la cita; rota por nivel para que no se repita siempre igual (el 03 queda con el original). */
const FINALES = ['todos llegaron antes', 'el tráfico se soltó', 'la ciudad respiró', 'la ciudad encontró su equilibrio'];

const NUMEROS = ['', 'una', 'dos', 'tres', 'cuatro', 'cinco', 'seis'];
const cuantas = (n: number) => NUMEROS[n] ?? String(n);

const SINGULAR: Record<Tipo, string> = { cable: 'el cable', ancha: 'la vía ancha', angosta: 'la vía angosta' };
const PLURAL: Record<Tipo, string> = { cable: 'cables', ancha: 'vías anchas', angosta: 'vías angostas' };

export interface Bitacora {
  cita: string;
  detalle: string;
  /** TOTAL al empezar y al terminar, como se muestran en pantalla */
  antes: string;
  despues: string;
}

/**
 * @param nivel   nivel jugado
 * @param abiertas vías abiertas al ganar
 * @param total   TOTAL alcanzado
 */
export function bitacora(nivel: Nivel, abiertas: Set<string>, total: number): Bitacora {
  const ini = abiertasIniciales(nivel);
  // cambios netos respecto al inicio (abrir y volver a cerrar no cuenta)
  const cambios = nivel.links.filter((l) => ini.has(l.id) !== abiertas.has(l.id));
  const grupos = new Map<string, { accion: 'cerré' | 'abrí'; tipo: Tipo; n: number }>();
  for (const l of cambios) {
    const accion = ini.has(l.id) ? 'cerré' : 'abrí';
    const clave = accion + l.kind;
    const g = grupos.get(clave);
    if (g) g.n++;
    else grupos.set(clave, { accion, tipo: l.kind, n: 1 });
  }
  // un verbo por acción: «cerré la vía ancha y el cable»
  const porAccion = new Map<string, string[]>();
  for (const g of grupos.values()) {
    const obj = g.n === 1 ? SINGULAR[g.tipo] : `${cuantas(g.n)} ${PLURAL[g.tipo]}`;
    porAccion.set(g.accion, [...(porAccion.get(g.accion) ?? []), obj]);
  }
  const unir = (xs: string[]) => (xs.length > 1 ? `${xs.slice(0, -1).join(', ')} y ${xs[xs.length - 1]}` : xs[0]);
  const partes = [...porAccion].map(([accion, objs]) => `${accion} ${unir(objs)}`);
  const final = FINALES[(nivel.num - 1) % FINALES.length];
  const ultima = partes[partes.length - 1] ?? '';
  const cita = partes.length ? `«Hoy ${partes.join(', ')}${ultima.includes(' y ') ? ', y ' : ' y '}${final}.»` : `«Hoy ${final}.»`;

  const cerradas = cambios.filter((l) => ini.has(l.id)).length;
  const abiertasN = cambios.length - cerradas;
  const vias = (n: number) => `${cuantas(n)} vía${n === 1 ? '' : 's'}`;
  let hecho: string;
  if (cerradas && abiertasN) hecho = cerradas === 1 && abiertasN === 1 ? 'Cerraste una vía, abriste otra' : `Cerraste ${vias(cerradas)}, abriste ${vias(abiertasN)}`;
  else if (cerradas) hecho = `Cerraste ${vias(cerradas)}`;
  else hecho = `Abriste ${vias(abiertasN)}`;

  // los minutos ahorrados salen de los mismos números que se ven en pantalla
  const r1 = (v: number) => Math.round(v * 10) / 10;
  const ahorro = r1(r1(nivel.start) - r1(total));
  const detalle = `${hecho} y todos llegaron ${nf(ahorro)} minuto${ahorro === 1 ? '' : 's'} antes.`;

  return { cita, detalle, antes: nf(nivel.start), despues: nf(total) };
}
