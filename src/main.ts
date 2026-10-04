import './styles.css';
import datos from '../data/niveles.json';
import { crearApp } from './app';
import type { Nivel } from './engine/equilibrio';

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
    // Solo en desarrollo: navegación de pruebas (?nivel=N, ?pantalla=…, flechas ← →)
    const { instalarPruebas } = await import('./dev/navegacion');
    instalarPruebas(svg, niveles);
    return;
  }
  crearApp(svg, niveles).ir({ p: 'carga' });
}

iniciar();
