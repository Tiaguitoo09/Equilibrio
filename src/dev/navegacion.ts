/**
 * Navegación entre niveles SOLO PARA PRUEBAS INTERNAS.
 * main.ts lo carga con import() dentro de `import.meta.env.DEV`, así que no llega al build.
 *   - botones ‹ › abajo a la derecha, y flechas ← → del teclado
 *   - ?nivel=N en la URL abre ese nivel (y se actualiza al navegar)
 *   - ?toques=a,b aplica toques al abrir
 */
import type { Nivel } from '../engine/equilibrio';
import { C } from '../render/colores';
import { Escena, dos } from '../render/primitivas';
import { activarBotones, elemento } from '../render/svg';
import { pantallaNivel, type PantallaNivel } from '../screens/pantallaNivel';

function dibujarNavegacion(capa: SVGGElement, num: number, total: number) {
  const s = new Escena('pruebas');
  s.r('inf', 1262, 820, 146, 36, { f: C.blanco, s: C.borde, sw: 1, rr: 18, n: 'pruebas' });
  s.t('inf', 1335, 832, `PRUEBAS · ${dos(num)}/${total}`, 10, 'CB', C.sec, { a: 'c', ls: 1 });
  s.pill('inf', 1282, 838, [{ v: '‹', z: 16, f: 'B', c: C.blanco }], { bg: C.tinta, bd: C.tinta, px: 8, py: 0, n: 'btn:dev-anterior' });
  s.pill('inf', 1388, 838, [{ v: '›', z: 16, f: 'B', c: C.blanco }], { bg: C.tinta, bd: C.tinta, px: 8, py: 0, n: 'btn:dev-siguiente' });
  for (const it of s.it) capa.append(elemento(it));
  activarBotones(capa);
  capa.querySelector('[data-btn="dev-anterior"]')?.setAttribute('aria-label', 'Nivel anterior');
  capa.querySelector('[data-btn="dev-siguiente"]')?.setAttribute('aria-label', 'Nivel siguiente');
}

export function navegacionPruebas(svg: SVGSVGElement, niveles: Nivel[]) {
  const params = new URLSearchParams(location.search);
  let i = Math.max(0, Math.min(niveles.length - 1, Number(params.get('nivel') ?? 1) - 1));
  let pantalla: PantallaNivel | null = null;

  const abrir = (idx: number, toques?: string[]) => {
    i = (idx + niveles.length) % niveles.length;
    pantalla?.cerrar();
    pantalla = pantallaNivel(svg, niveles[i], { alDibujar: (capas) => dibujarNavegacion(capas.inf, niveles[i].num, niveles.length) });
    toques?.forEach((id) => id && pantalla!.tocar(id));
    const url = new URL(location.href);
    url.searchParams.set('nivel', String(niveles[i].num));
    if (!toques) url.searchParams.delete('toques');
    history.replaceState(null, '', url);
  };

  svg.addEventListener('click', (ev) => {
    const b = (ev.target as Element).closest<SVGElement>('[data-btn^="dev-"]');
    if (b) abrir(b.dataset.btn === 'dev-anterior' ? i - 1 : i + 1);
  });
  addEventListener('keydown', (ev) => {
    if (ev.key === 'ArrowLeft') abrir(i - 1);
    if (ev.key === 'ArrowRight') abrir(i + 1);
  });

  abrir(i, params.get('toques')?.split(','));
}
