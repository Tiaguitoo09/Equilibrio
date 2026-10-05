/**
 * Equilibrio se juega en computador (o en tablet acostada).
 * La red se dibuja en 1440×900 y se escala a la pantalla; en un celular quedaría a menos de la mitad
 * (íconos de 6–10 px, vías imposibles de tocar), así que ahí se muestra un aviso en vez del juego.
 */

/** Por debajo de esta escala el juego no se muestra (≈ 790×495 px de pantalla). */
export const ESCALA_MINIMA = 0.55;

export type Motivo = 'celular' | 'girar' | 'ventana';

/** Por qué no se puede jugar en esta pantalla, o null si sí se puede. Función pura (se prueba en Node). */
export function motivoBloqueo(ancho: number, alto: number, tactil: boolean): Motivo | null {
  if (Math.min(ancho / 1440, alto / 900) >= ESCALA_MINIMA) return null;
  if (tactil && Math.min(ancho, alto) < 600) return 'celular';
  if (tactil && alto > ancho) return 'girar';
  return 'ventana';
}

const TEXTOS: Record<Motivo, [string, string]> = {
  celular: ['Equilibrio se juega en computador', 'La red de Bogotá no cabe en una pantalla tan pequeña. Ábrelo en un computador o en una tablet.'],
  girar: ['Gira la pantalla', 'Equilibrio se juega con la pantalla acostada.'],
  ventana: ['Agranda la ventana', 'Equilibrio necesita un poco más de espacio para que se vea bien.'],
};

/** Muestra u oculta el aviso según la pantalla, ahora y cada vez que cambie de tamaño o se gire. */
export function vigilarPantalla(svg: SVGSVGElement, logo: string) {
  const aviso = document.getElementById('bloqueo');
  if (!aviso) return;
  aviso.querySelector('img')?.setAttribute('src', logo);
  const revisar = () => {
    const tactil = matchMedia('(pointer: coarse)').matches;
    const motivo = motivoBloqueo(innerWidth, innerHeight, tactil);
    aviso.hidden = !motivo;
    // el juego sigue detrás (al girar o agrandar vuelve igual), pero no se ve ni recibe el foco
    svg.style.visibility = motivo ? 'hidden' : '';
    svg.setAttribute('aria-hidden', String(!!motivo));
    if (motivo) {
      const [titulo, texto] = TEXTOS[motivo];
      aviso.querySelector('h1')!.textContent = titulo;
      aviso.querySelector('p')!.textContent = texto;
    }
  };
  addEventListener('resize', revisar);
  addEventListener('orientationchange', revisar);
  revisar();
}
