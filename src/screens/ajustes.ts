/**
 * Ajustes — SECCIÓN PROVISIONAL.
 * El diseño está pendiente en Figma; por ahora solo existe la sección (título y volver),
 * con el mismo marco que «Plano de la red». El contenido va en la capa inf, debajo del título.
 */
import { C } from '../render/colores';
import { Escena, medidaPastilla } from '../render/primitivas';
import { activarBotones, pintar } from '../render/svg';

export function escenaAjustes(): Escena {
  const s = new Escena('Ajustes');
  s.g('ter', [[1180, 0], [1440, 0], [1440, 170]], C.agua);
  s.g('ter', [[0, 720], [0, 900], [260, 900]], C.agua);
  s.t('inf', 60, 48, 'Ajustes', 32, 'B', C.tinta, { n: 'titulo' });
  const volver = { parts: [{ v: 'Volver', z: 14, f: 'SB' as const, c: C.blanco }], px: 18, py: 10, gap: 3 };
  const [w] = medidaPastilla(volver);
  s.pill('inf', 60 + w / 2, 838, volver.parts, { ...volver, bg: C.tinta, bd: C.tinta, n: 'btn:volver' });
  return s;
}

export function pantallaAjustes(svg: SVGSVGElement, alVolver: () => void) {
  const capas = pintar(svg, escenaAjustes());
  activarBotones(capas.inf);
  const esVolver = (ev: Event) => !!(ev.target as Element).closest('[data-btn="volver"]');
  const volver = () => {
    cerrar();
    alVolver();
  };
  const alHacerClic = (ev: Event) => {
    if (esVolver(ev)) volver();
  };
  const alTeclear = (ev: KeyboardEvent) => {
    if ((ev.key === 'Enter' || ev.key === ' ') && esVolver(ev)) {
      ev.preventDefault();
      volver();
    }
  };
  function cerrar() {
    svg.removeEventListener('click', alHacerClic);
    svg.removeEventListener('keydown', alTeclear);
  }
  svg.addEventListener('click', alHacerClic);
  svg.addEventListener('keydown', alTeclear);
  return { cerrar };
}
