# Prompts para Claude Code (copia y pega, en orden)

## 1 · Arranque (nivel 01 jugable)

```
Lee primero CLAUDE.md completo y mira las capturas de reference/figma-preview/.
Estamos construyendo "Equilibrio", un juego web de puzzle (paradoja de Braess).
El motor del equilibrio ya está hecho y probado en src/engine/equilibrio.ts: no lo reescribas.
Los 15 niveles están en data/niveles.json: no inventes datos.

Antes de escribir código, dime en máximo 8 líneas tu plan y qué estructura de carpetas vas a usar. Espera mi visto bueno.

Después haz esto, en este orden:
1. Convierte esta carpeta en un proyecto Vite + TypeScript estricto (sin frameworks de UI),
   conservando y fusionando el package.json que ya existe y sin tocar data/, src/engine/ ni reference/.
   Carga las fuentes de public/fonts/ con @font-face local.
2. Porta a TypeScript (src/render/) la parte de reference/escena.js que dibuja un NIVEL
   (capas ter/red/est/sta/inf, vías ancha/angosta/cerrada/cable/obra, estaciones, pastillas de costo, carros, HUD, título),
   dibujando en un <svg viewBox="0 0 1440 900"> que escala a la ventana.
3. Haz el nivel 01 jugable: tocar una vía la abre o la cierra, recalcula con puntaje() de src/engine,
   actualiza TOTAL, las pastillas y el HUD, y muestra «Equilibrio alcanzado en 1 toque» cuando enEquilibrio() sea verdadero.
   Si un toque deja a un grupo sin ruta (puntaje() devuelve null), no lo permitas y haz vibrar la vía.
4. Carros animados: pequeños círculos tinta con borde blanco que recorren cada vía, más lentos en una angosta llena.
5. Botones Reiniciar y Pausa abajo a la izquierda.

Criterio de aceptación: el nivel 01 se ve igual que la captura de Figma, y jugarlo baja el TOTAL de 60 a 45.
Corre npm test y npm run dev, y dime cómo abrirlo en el navegador. Si algo no cuadra con CLAUDE.md, pregúntame.
```

## 2 · Todos los niveles y la navegación

```
Perfecto. Ahora carga los 15 niveles desde data/niveles.json con el mismo renderizador.
Añade: la leyenda y la píldora negra solo donde el nivel las trae (campos legend y msg),
el selector «Hora valle | Hora pico» en los niveles con phases, el indicador «TOQUES ○○○» con tope en los niveles con toques,
y las obras intocables (locked). Navegación simple entre niveles (anterior/siguiente) solo para pruebas internas.
Verifica con un script que cada nivel se resuelve con nivel.solucion y que el HUD muestra los mismos números de data/niveles.json.
```

## 3 · Pantallas y flujo

```
Ahora las pantallas, portando reference/escena.js y reference/tutorial_y_cargas.js:
carga de la app, inicio, plano de la red (con el nivel actual y los resueltos), carga de nivel,
tutorial de 4 pasos (solo en el nivel 01, con «Saltar»), bitácora al ganar y menú de pausa.
Guarda el progreso en localStorage (nivel actual y niveles resueltos).
Flujo: carga → inicio → (carga del nivel → tutorial en el 01) → nivel → bitácora → siguiente nivel.
Respeta las 10 leyes de la simplicidad de CLAUDE.md: nada de texto de más.
```

## 4 · Pulido y publicación

```
Pulido: transiciones suaves (< 300 ms) al tocar una vía, accesibilidad (foco con teclado, aria-label en las vías, contraste),
funciona en celular (táctil) y en escritorio, y arma un script `npm run build`.
Prepara el despliegue gratis en GitHub Pages o Vercel y dime los pasos exactos para Windows.
Deja el punto de extensión src/ui/iconos.ts para cuando lleguen los íconos finales (SVG).
```

## 5 · Cuando lleguen los íconos

```
Aquí están los íconos finales en SVG (carpeta icons/). Reemplaza los botones provisionales de reiniciar y pausa
y cualquier otro símbolo provisional usando src/ui/iconos.ts. Mismo grosor de trazo, misma cuadrícula y mismos colores del sistema.
```
