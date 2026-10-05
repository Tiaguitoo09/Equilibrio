/**
 * Anuncios para lectores de pantalla (región aria-live de index.html).
 * Lo visual no cambia: es el mismo resultado del toque dicho en palabras.
 */
export function anunciar(texto: string) {
  const el = document.getElementById('anuncio');
  if (!el) return;
  // vaciar y volver a escribir hace que se lea aunque el texto se repita
  el.textContent = '';
  requestAnimationFrame(() => (el.textContent = texto));
}
