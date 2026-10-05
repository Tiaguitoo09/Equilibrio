/**
 * Atajos SOLO PARA PRUEBAS INTERNAS (por la URL, sin nada visible en pantalla).
 * main.ts lo carga con import() dentro de `import.meta.env.DEV`, así que no llega al build:
 * en el juego publicado no hay forma de saltarse niveles.
 *   - sin parámetros: el flujo normal (carga → inicio → …)
 *   - ?nivel=N abre ese nivel directo · ?toques=a,b aplica toques al abrirlo
 *   - ?pantalla=carga|inicio|plano|ajustes|bitacora|bitacoraCompleta|fin|cargaNivel (con ?nivel=N para bitacora y cargaNivel)
 *   - ?tutorial=1 abre el nivel 01 con el tutorial · ?pausa=1 abre el menú de pausa
 *   - ?borrar=1 borra el progreso guardado
 */
import { crearApp, type Destino } from '../app';
import type { Nivel } from '../engine/equilibrio';
import type { PantallaNivel } from '../screens/pantallaNivel';

export function instalarPruebas(svg: SVGSVGElement, niveles: Nivel[]) {
  const params = new URLSearchParams(location.search);
  if (params.get('borrar')) localStorage.removeItem('equilibrio.progreso.v1');
  const app = crearApp(svg, niveles);

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
