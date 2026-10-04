/**
 * Herramientas SOLO PARA PRUEBAS INTERNAS.
 * main.ts lo carga con import() dentro de `import.meta.env.DEV`, así que no llega al build.
 *   - sin parámetros: el flujo normal (carga → inicio → …)
 *   - ?nivel=N abre ese nivel directo; en los niveles, botones ‹ › abajo a la derecha y flechas ← →
 *   - ?toques=a,b aplica toques al abrir el nivel
 *   - ?pantalla=carga|inicio|plano|ajustes|bitacora|cargaNivel (con ?nivel=N para bitacora y cargaNivel)
 *   - ?tutorial=1 abre el nivel 01 con el tutorial · ?pausa=1 abre el menú de pausa
 *   - ?borrar=1 borra el progreso guardado
 */
import { crearApp, type Destino } from '../app';
import type { Nivel } from '../engine/equilibrio';
import { C } from '../render/colores';
import { Escena, dos } from '../render/primitivas';
import { activarBotones, elemento } from '../render/svg';
import type { PantallaNivel } from '../screens/pantallaNivel';

function dibujarNavegacion(capa: SVGGElement, num: number, total: number) {
  const s = new Escena('pruebas');
  s.r('inf', 1262, 820, 146, 36, { f: C.blanco, s: C.borde, sw: 1, rr: 18, n: 'pruebas' });
  s.t('inf', 1335, 832, `PRUEBAS · ${dos(num)}/${total}`, 10, 'CB', C.sec, { a: 'c', ls: 1 });
  s.pill('inf', 1282, 838, [{ v: '‹', z: 16, f: 'B', c: C.blanco }], { bg: C.tinta, bd: C.tinta, px: 8, py: 4, n: 'btn:dev-anterior' });
  s.pill('inf', 1388, 838, [{ v: '›', z: 16, f: 'B', c: C.blanco }], { bg: C.tinta, bd: C.tinta, px: 8, py: 4, n: 'btn:dev-siguiente' });
  for (const it of s.it) capa.append(elemento(it));
  activarBotones(capa);
  capa.querySelector('[data-btn="dev-anterior"]')?.setAttribute('aria-label', 'Nivel anterior');
  capa.querySelector('[data-btn="dev-siguiente"]')?.setAttribute('aria-label', 'Nivel siguiente');
}

export function instalarPruebas(svg: SVGSVGElement, niveles: Nivel[]) {
  const params = new URLSearchParams(location.search);
  if (params.get('borrar')) localStorage.removeItem('equilibrio.progreso.v1');

  let enNivel = 0; // número del nivel abierto (0 = otra pantalla)
  const app = crearApp(svg, niveles, {
    alDibujarNivel: (capas, num) => {
      enNivel = num;
      dibujarNavegacion(capas.inf, num, niveles.length);
    },
  });

  const abrirNivel = (num: number) => {
    const n = ((num - 1 + niveles.length) % niveles.length) + 1;
    const url = new URL(location.href);
    url.searchParams.set('nivel', String(n));
    url.searchParams.delete('toques');
    history.replaceState(null, '', url);
    app.ir({ p: 'nivel', num: n });
  };

  svg.addEventListener('click', (ev) => {
    const b = (ev.target as Element).closest<SVGElement>('[data-btn^="dev-"]');
    if (b) abrirNivel(enNivel + (b.dataset.btn === 'dev-anterior' ? -1 : 1));
  });
  addEventListener('keydown', (ev) => {
    if (!svg.querySelector('[data-btn^="dev-"]')) return; // solo dentro de un nivel
    if (ev.key === 'ArrowLeft') abrirNivel(enNivel - 1);
    if (ev.key === 'ArrowRight') abrirNivel(enNivel + 1);
  });

  const num = Number(params.get('nivel') ?? 0);
  const pantalla = params.get('pantalla');
  if (pantalla) {
    const p = pantalla as Destino['p'];
    app.ir(p === 'bitacora' || p === 'cargaNivel' || p === 'nivel' ? { p, num: num || 1 } : ({ p } as Destino));
  } else if (num || params.get('tutorial')) {
    const abierta = app.ir({ p: 'nivel', num: num || 1, tutorial: !!params.get('tutorial') }) as PantallaNivel;
    params.get('toques')?.split(',').forEach((id) => id && abierta.tocar(id));
    if (params.get('pausa')) svg.querySelector<SVGElement>('[data-btn="pausa"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  } else app.ir({ p: 'carga' });
}
