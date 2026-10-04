import './styles.css';
import datos from '../data/niveles.json';
import type { Nivel } from './engine/equilibrio';
import { pantallaAjustes } from './screens/ajustes';
import { pantallaNivel } from './screens/pantallaNivel';

const niveles = datos as unknown as Nivel[];

/** Espera las fuentes: las pastillas se miden con el ancho real del texto. */
async function cargarFuentes() {
  const usadas = ['500 12px Barlow', '600 12px Barlow', '700 12px Barlow', '800 12px Barlow', '600 12px "Barlow Condensed"', '700 12px "Barlow Condensed"'];
  await Promise.all(usadas.map((f) => document.fonts.load(f)));
}

async function iniciar() {
  await cargarFuentes();
  const svg = document.querySelector<SVGSVGElement>('#escena')!;

  if (import.meta.env.DEV) {
    // Solo en desarrollo: ?pantalla=ajustes abre Ajustes; si no, navegación de pruebas entre los 15 niveles
    const { navegacionPruebas } = await import('./dev/navegacion');
    if (new URLSearchParams(location.search).get('pantalla') === 'ajustes') pantallaAjustes(svg, () => navegacionPruebas(svg, niveles));
    else navegacionPruebas(svg, niveles);
    return;
  }
  pantallaNivel(svg, niveles[0]);
}

iniciar();
