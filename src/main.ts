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
  const params = new URLSearchParams(location.search);

  // Solo en desarrollo: ?pantalla=ajustes abre la sección de Ajustes (todavía no hay Inicio)
  if (import.meta.env.DEV && params.get('pantalla') === 'ajustes') {
    pantallaAjustes(svg, () => jugar(svg));
    return;
  }
  const pantalla = jugar(svg);

  // Solo en desarrollo: ?toques=n aplica toques al abrir (para revisar estados sin jugar)
  if (import.meta.env.DEV) params.get('toques')?.split(',').forEach((id) => id && pantalla.tocar(id));
}

const jugar = (svg: SVGSVGElement) => pantallaNivel(svg, niveles[0]);

iniciar();
